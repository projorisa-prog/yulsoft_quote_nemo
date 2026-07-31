from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.template import Template
from app.models.user import User, UserPlan

router = APIRouter()


@router.get("", response_model=dict)
async def get_my_templates(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    # Check plan - PRO required for templates
    if current_user.plan == UserPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PLAN_REQUIRED", "message": "템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다."}},
        )

    query = select(Template).where(Template.user_id == current_user.id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Template.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    templates = result.scalars().all()

    items = []
    for template in templates:
        items.append({
            "id": str(template.id),
            "name": template.name,
            "description": template.description,
            "item_count": len(template.items),
            "usage_count": template.usage_count,
            "created_at": template.created_at.isoformat(),
            "updated_at": template.updated_at.isoformat(),
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_template(
    request: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check plan
    if current_user.plan == UserPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PLAN_REQUIRED", "message": "템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다."}},
        )

    name = request.get("name")
    description = request.get("description")
    items = request.get("items", [])
    calculation_snapshot = request.get("calculation_snapshot", {})

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "템플릿 이름은 필수입니다."}},
        )

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "최소 1개 이상의 항목이 필요합니다."}},
        )

    template = Template(
        user_id=current_user.id,
        name=name,
        description=description,
        items=items,
        calculation_snapshot=calculation_snapshot,
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)

    return {
        "id": str(template.id),
        "name": template.name,
        "created_at": template.created_at.isoformat(),
    }


@router.post("/{template_id}/use", response_model=dict)
async def use_template(
    template_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.plan == UserPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PLAN_REQUIRED", "message": "템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다."}},
        )

    result = await db.execute(
        select(Template).where(Template.id == template_id, Template.user_id == current_user.id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "TEMPLATE_NOT_FOUND", "message": "템플릿을 찾을 수 없습니다."}},
        )

    # Increment usage count
    template.usage_count += 1
    await db.commit()

    # Return template data for starting a new quote
    return {
        "template": {
            "id": str(template.id),
            "name": template.name,
            "description": template.description,
            "items": template.items,
            "calculation_snapshot": template.calculation_snapshot,
        }
    }


@router.patch("/{template_id}", response_model=dict)
async def update_template(
    template_id: str,
    request: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.plan == UserPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PLAN_REQUIRED", "message": "템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다."}},
        )

    result = await db.execute(
        select(Template).where(Template.id == template_id, Template.user_id == current_user.id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "TEMPLATE_NOT_FOUND", "message": "템플릿을 찾을 수 없습니다."}},
        )

    if "name" in request:
        template.name = request["name"]
    if "description" in request:
        template.description = request["description"]
    if "items" in request:
        template.items = request["items"]
    if "calculation_snapshot" in request:
        template.calculation_snapshot = request["calculation_snapshot"]

    template.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(template)

    return {
        "id": str(template.id),
        "name": template.name,
        "updated_at": template.updated_at.isoformat(),
    }


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.plan == UserPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PLAN_REQUIRED", "message": "템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다."}},
        )

    result = await db.execute(
        select(Template).where(Template.id == template_id, Template.user_id == current_user.id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "TEMPLATE_NOT_FOUND", "message": "템플릿을 찾을 수 없습니다."}},
        )

    await db.delete(template)
    await db.commit()