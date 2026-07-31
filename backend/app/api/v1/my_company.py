from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.company_info import CompanyInfo
from app.models.user import User, UserPlan

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=dict)
async def get_my_company_info(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated["AsyncSession", Depends(get_db)],
):
    result = await db.execute(
        select(CompanyInfo).where(CompanyInfo.user_id == current_user.id)
    )
    company_info = result.scalar_one_or_none()

    if not company_info:
        # Return user's basic info as fallback
        return {
            "biz_reg_no": current_user.biz_reg_no or "",
            "company_name": current_user.company_name or "",
            "ceo_name": current_user.ceo_name or "",
            "address": "",
            "business_type": "",
            "business_item": "",
            "phone": current_user.phone or "",
            "email": current_user.email,
            "bank_info": {
                "bank_name": "",
                "account_no": "",
                "account_holder": "",
            },
        }

    return {
        "biz_reg_no": company_info.biz_reg_no,
        "company_name": company_info.company_name,
        "ceo_name": company_info.ceo_name,
        "address": company_info.address,
        "business_type": company_info.business_type or "",
        "business_item": company_info.business_item or "",
        "phone": company_info.phone,
        "email": company_info.email,
        "bank_info": company_info.bank_info or {
            "bank_name": "",
            "account_no": "",
            "account_holder": "",
        },
    }


@router.patch("", response_model=dict)
async def update_my_company_info(
    request: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated["AsyncSession", Depends(get_db)],
):
    result = await db.execute(
        select(CompanyInfo).where(CompanyInfo.user_id == current_user.id)
    )
    company_info = result.scalar_one_or_none()

    if not company_info:
        # Create new company info
        company_info = CompanyInfo(
            user_id=current_user.id,
            biz_reg_no=request.get("biz_reg_no", ""),
            company_name=request.get("company_name", current_user.company_name or ""),
            ceo_name=request.get("ceo_name", current_user.ceo_name or ""),
            address=request.get("address", ""),
            business_type=request.get("business_type", ""),
            business_item=request.get("business_item", ""),
            phone=request.get("phone", current_user.phone or ""),
            email=request.get("email", current_user.email),
            bank_info=request.get("bank_info", {}),
        )
        db.add(company_info)
    else:
        # Update existing
        if "biz_reg_no" in request:
            company_info.biz_reg_no = request["biz_reg_no"]
        if "company_name" in request:
            company_info.company_name = request["company_name"]
        if "ceo_name" in request:
            company_info.ceo_name = request["ceo_name"]
        if "address" in request:
            company_info.address = request["address"]
        if "business_type" in request:
            company_info.business_type = request["business_type"]
        if "business_item" in request:
            company_info.business_item = request["business_item"]
        if "phone" in request:
            company_info.phone = request["phone"]
        if "email" in request:
            company_info.email = request["email"]
        if "bank_info" in request:
            company_info.bank_info = request["bank_info"]

        company_info.updated_at = datetime.now(timezone.utc)

    db.add(company_info)
    await db.commit()
    await db.refresh(company_info)

    return {
        "biz_reg_no": company_info.biz_reg_no,
        "company_name": company_info.company_name,
        "ceo_name": company_info.ceo_name,
        "address": company_info.address,
        "business_type": company_info.business_type or "",
        "business_item": company_info.business_item or "",
        "phone": company_info.phone,
        "email": company_info.email,
        "bank_info": company_info.bank_info or {
            "bank_name": "",
            "account_no": "",
            "account_holder": "",
        },
    }