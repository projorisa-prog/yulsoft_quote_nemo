from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.quote import Quote, QuoteStatus
from app.models.quote_item import QuoteItem
from app.models.user import User, UserPlan
from pydantic import BaseModel, ConfigDict

router = APIRouter()


class QuoteListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quote_number: str
    status: str
    customer_name: str
    grand_total: int
    design_key: str
    created_at: datetime


class QuoteListResponse(BaseModel):
    items: list[QuoteListItem]
    total: int
    page: int
    limit: int
    total_pages: int


class QuoteDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quote_number: str
    status: str
    customer_info: dict
    supplier_info: Optional[dict] = None
    items: list[dict]
    totals: dict
    design_key: str
    watermark_text: str
    expires_at: datetime
    created_at: datetime
    updated_at: datetime


class QuotePatchRequest(BaseModel):
    customer_info: Optional[dict] = None
    supplier_info: Optional[dict] = None
    items: Optional[list[dict]] = None
    calculation: Optional[dict] = None
    design_key: Optional[str] = None
    expires_days: Optional[int] = None


class ConvertResponse(BaseModel):
    id: str
    quote_number: str
    contract_number: str
    status: str
    contract_pdf_url: str
    converted_at: datetime


router = APIRouter()


@router.get("", response_model=QuoteListResponse)
async def list_my_quotes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    query = select(Quote).where(Quote.user_id == current_user.id)

    if status:
        try:
            quote_status = QuoteStatus(status)
            query = query.where(Quote.status == quote_status)
        except ValueError:
            pass

    if from_date:
        query = query.where(Quote.created_at >= from_date)

    if to_date:
        query = query.where(Quote.created_at <= to_date)

    if search:
        query = query.where(
            (Quote.quote_number.ilike(f"%{search}%")) |
            (Quote.customer_info["name"].astext.ilike(f"%{search}%"))
        )

    query = query.order_by(Quote.created_at.desc())

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    quotes = result.scalars().all()

    items = []
    for quote in quotes:
        items.append(QuoteListItem(
            id=str(quote.id),
            quote_number=quote.quote_number,
            status=quote.status.value,
            customer_name=quote.customer_info.get("name", ""),
            grand_total=quote.totals.get("grand_total", 0),
            design_key=quote.design_key,
            created_at=quote.created_at,
        ))

    return QuoteListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit,
    )


@router.get("/{quote_id}", response_model=QuoteDetailResponse)
async def get_my_quote(
    quote_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Quote).where(Quote.id == quote_id, Quote.user_id == current_user.id)
    )
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUOTE_NOT_FOUND", "message": "견적서를 찾을 수 없습니다."}},
        )

    # Load items
    items_result = await db.execute(
        select(QuoteItem).where(QuoteItem.quote_id == quote.id).order_by(QuoteItem.sort_order)
    )
    items = items_result.scalars().all()

    items_data = []
    for item in items:
        items_data.append({
            "id": str(item.id),
            "sort_order": item.sort_order,
            "area": item.area,
            "task": item.task,
            "days": item.days,
            "price": item.unit_price,
            "exclude_area": item.exclude_area,
            "memo": item.memo,
        })

    return QuoteDetailResponse(
        id=str(quote.id),
        quote_number=quote.quote_number,
        status=quote.status.value,
        customer_info=quote.customer_info,
        supplier_info=quote.supplier_info,
        items=items_data,
        totals=quote.totals,
        design_key=quote.design_key,
        watermark_text=quote.watermark_text,
        expires_at=quote.expires_at,
        created_at=quote.created_at,
        updated_at=quote.updated_at,
    )


@router.patch("/{quote_id}", response_model=QuoteDetailResponse)
async def update_my_quote(
    quote_id: str,
    request: QuotePatchRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Quote).where(Quote.id == quote_id, Quote.user_id == current_user.id)
    )
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUOTE_NOT_FOUND", "message": "견적서를 찾을 수 없습니다."}},
        )

    if quote.status != QuoteStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "INVALID_STATUS", "message": "DRAFT 상태에서만 수정 가능합니다."}},
        )

    # Update fields
    if request.customer_info:
        quote.customer_info = request.customer_info
    if request.supplier_info:
        quote.supplier_info = request.supplier_info
    if request.design_key:
        quote.design_key = request.design_key
    if request.expires_days:
        quote.expires_at = datetime.now(timezone.utc) + timedelta(days=request.expires_days)

    # If items or calculation changed, recalculate
    if request.items is not None or request.calculation is not None:
        # This would trigger recalculation - simplified for now
        pass

    quote.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(quote)

    return await get_my_quote(quote_id, current_user, db)


@router.post("/{quote_id}/convert", response_model=ConvertResponse)
async def convert_to_contract(
    quote_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.plan == UserPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PLAN_REQUIRED", "message": "계약서 변환은 PRO 플랜 이상에서 이용 가능합니다."}},
        )

    result = await db.execute(
        select(Quote).where(Quote.id == quote_id, Quote.user_id == current_user.id)
    )
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUOTE_NOT_FOUND", "message": "견적서를 찾을 수 없습니다."}},
        )

    if quote.status != QuoteStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "INVALID_STATUS", "message": "COMPLETED 상태의 견적서만 계약서로 변환 가능합니다."}},
        )

    # Update status to CONVERTED
    quote.status = QuoteStatus.CONVERTED
    quote.updated_at = datetime.now(timezone.utc)

    # Generate contract number
    contract_number = f"{quote.quote_number}-C"

    # Generate contract PDF (placeholder - would use contract template)
    contract_pdf_url = f"/api/v1/quotes/{quote.id}/contract-pdf"

    await db.commit()

    return ConvertResponse(
        id=str(quote.id),
        quote_number=quote.quote_number,
        contract_number=contract_number,
        status=quote.status.value,
        contract_pdf_url=contract_pdf_url,
        converted_at=datetime.now(timezone.utc),
    )