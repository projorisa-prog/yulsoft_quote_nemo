from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, rate_limit_preview, rate_limit_create, rate_limit_view, rate_limit_pdf
from app.models.quote import Quote, QuoteStatus
from app.models.quote_item import QuoteItem
from app.models.user import User, UserPlan
from app.models.company_info import CompanyInfo
from app.schemas.quote import (
    CalculationRequest,
    QuoteCreateRequest,
    QuoteCreateResponse,
    QuoteItemResponse,
    QuotePreviewResponse,
    QuoteViewResponse,
    TotalsResponse,
)
from app.services.calculation import calculation_service
from app.services.pdf import pdf_service

router = APIRouter()


class PreviewRequest(BaseModel):
    calculation: CalculationRequest


@router.post(
    "/preview",
    response_model=QuotePreviewResponse,
    summary="견적 산출 미리보기 (DB 저장 없음)",
    dependencies=[rate_limit_preview],
)
async def preview_quote(request: PreviewRequest):
    totals = calculation_service.calculate_totals(request.calculation)

    items = []
    for idx, item_req in enumerate(request.calculation.items, 1):
        items.append(
            QuoteItemResponse(
                id=str(uuid.uuid4()),
                sort_order=idx,
                area=item_req.area,
                task=item_req.task,
                days=item_req.days,
                qty=item_req.qty,
                unit_price=item_req.unit_price,
                total_price=item_req.qty * item_req.unit_price,
                exclude_area=item_req.exclude_area,
                memo=item_req.memo,
            )
        )

    return QuotePreviewResponse(items=items, totals=totals)


@router.post(
    "",
    response_model=QuoteCreateResponse,
    status_code=201,
    summary="견적서 생성 및 저장 (PDF 생성 트리거)",
    dependencies=[rate_limit_create],
)
async def create_quote(
    request: QuoteCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    http_request: Request,
    current_user: Annotated[User | None, Depends(get_current_user)] = None,
):
    totals = calculation_service.calculate_totals(request.calculation)
    
    # Determine quote number format
    if current_user:
        # Member: YYMM-SEQ
        current_user.quote_seq += 1
        quote_number = datetime.now(timezone.utc).strftime("%y%m") + f"-{current_user.quote_seq:03d}"
    else:
        # Non-member: TEMP-UUID
        quote_number = f"TEMP-{uuid.uuid4().hex[:8].upper()}"
    
    # Determine watermark text
    if current_user and current_user.plan != UserPlan.FREE:
        watermark_text = ""
    else:
        watermark_text = "Powered by 율소프트 | www.yulsoft.kr"
    
    # Use company info for supplier if available
    supplier_info = request.supplier.model_dump()
    if current_user and current_user.plan != UserPlan.FREE:
        # Try to get company info
        result = await db.execute(
            select(CompanyInfo).where(CompanyInfo.user_id == current_user.id)
        )
        company_info = result.scalar_one_or_none()
        if company_info:
            supplier_info = {
                "biz_reg_no": company_info.biz_reg_no,
                "company_name": company_info.company_name,
                "ceo_name": company_info.ceo_name,
                "address": company_info.address,
                "business_type": company_info.business_type,
                "business_item": company_info.business_item,
                "phone": company_info.phone,
                "email": company_info.email,
            }
    
    quote = Quote(
        user_id=current_user.id if current_user else None,
        quote_number=quote_number,
        status=QuoteStatus.COMPLETED,
        customer_info=request.customer.model_dump(),
        supplier_info=supplier_info,
        calculation_snapshot=request.calculation.model_dump(),
        totals=totals.model_dump(),
        watermark_text=watermark_text,
        design_key=request.design_key,
        expires_at=datetime.now(timezone.utc) + timedelta(days=request.expires_days),
    )

    for idx, item_req in enumerate(request.calculation.items, 1):
        quote.items.append(
            QuoteItem(
                sort_order=idx,
                area=item_req.area,
                task=item_req.task,
                days=item_req.days,
                qty=item_req.qty,
                unit_price=item_req.unit_price,
                total_price=item_req.qty * item_req.unit_price,
                exclude_area=item_req.exclude_area,
                memo=item_req.memo,
            )
        )

    db.add(quote)
    await db.flush()
    await db.refresh(quote)

    base_url = str(http_request.base_url).rstrip("/")
    public_url = f"{base_url}/q/{quote.id}"
    pdf_url = f"{base_url}/api/v1/quotes/{quote.id}/pdf"

    return QuoteCreateResponse(
        id=str(quote.id),
        quote_number=quote.quote_number,
        status=quote.status.value,
        public_url=public_url,
        pdf_url=pdf_url,
        expires_at=quote.expires_at,
        watermark_text=quote.watermark_text,
        created_at=quote.created_at,
    )


@router.get(
    "/{public_id}",
    response_model=QuoteViewResponse,
    summary="견적서 웹뷰 조회",
    dependencies=[rate_limit_view],
)
async def get_quote(
    public_id: uuid.UUID,
    format: Annotated[str, Query(pattern="^(json|html)$")] = "html",
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    result = await db.execute(select(Quote).where(Quote.id == public_id))
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "QUOTE_NOT_FOUND", "message": "견적서를 찾을 수 없습니다."}},
        )

    if quote.status == QuoteStatus.EXPIRED or quote.expires_at < datetime.now(timezone.utc):
        quote.status = QuoteStatus.EXPIRED
        await db.commit()

    items = [
        QuoteItemResponse(
            id=str(item.id),
            sort_order=item.sort_order,
            area=item.area,
            task=item.task,
            days=item.days,
            qty=item.qty,
            unit_price=item.unit_price,
            total_price=item.total_price,
            exclude_area=item.exclude_area,
            memo=item.memo,
        )
        for item in sorted(quote.items, key=lambda x: x.sort_order)
    ]

    totals = TotalsResponse(**quote.totals)

    if format == "json":
        return QuoteViewResponse(
            id=str(quote.id),
            quote_number=quote.quote_number,
            status=quote.status.value,
            customer_info=quote.customer_info,
            supplier_info=quote.supplier_info,
            items=items,
            totals=totals,
            design_key=quote.design_key.value,
            watermark_text=quote.watermark_text,
            expires_at=quote.expires_at,
            created_at=quote.created_at,
        )

    from fastapi.responses import HTMLResponse
    from app.services.pdf import PDFService
    pdf_svc = PDFService()
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>견적서 {quote.quote_number}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        {pdf_svc._get_base_css()}
        {pdf_svc._get_design_css(quote.design_key)}
        body {{ padding: 20px; background: #f0f0f0; }}
        .quote-container {{ max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 40px; }}
    </style>
</head>
<body>
    <div class="quote-container">
        {pdf_svc._render_header(quote)}
        {pdf_svc._render_info_blocks(quote)}
        {pdf_svc._render_items_table(sorted(quote.items, key=lambda x: x.sort_order))}
        {pdf_svc._render_summary(totals)}
        {pdf_svc._render_footer(quote)}
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)


@router.get(
    "/{public_id}/pdf",
    summary="PDF 다운로드",
    dependencies=[rate_limit_pdf],
)
async def download_pdf(
    public_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Quote).where(Quote.id == public_id))
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "QUOTE_NOT_FOUND", "message": "견적서를 찾을 수 없습니다."}},
        )

    items_result = await db.execute(
        select(QuoteItem).where(QuoteItem.quote_id == quote.id).order_by(QuoteItem.sort_order)
    )
    items = items_result.scalars().all()

    pdf_bytes = pdf_service.generate_pdf(quote, items)

    filename = f"견적서_{quote.quote_number}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )