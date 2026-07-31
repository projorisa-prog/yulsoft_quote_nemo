from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.payment_history import PaymentHistory, PaymentStatus, PlanType
from app.models.user import User, UserPlan

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class PlanInfo(BaseModel):
    plan: str
    name: str
    price: int
    features: list[str]


class PlansResponse(BaseModel):
    plans: list[PlanInfo]


class SubscriptionStatusResponse(BaseModel):
    plan: str
    is_active: bool
    features: dict


class SubscribeRequest(BaseModel):
    plan: str
    payment_method: str = "CARD"


class SubscribeResponse(BaseModel):
    payment_id: str
    pg_redirect_url: str


PLAN_FEATURES = {
    "FREE": {
        "watermark_removed": False,
        "unlimited_quotes": False,
        "templates": False,
        "contract_conversion": False,
        "api_access": False,
        "team_members": False,
    },
    "PRO": {
        "watermark_removed": True,
        "unlimited_quotes": True,
        "templates": True,
        "contract_conversion": True,
        "api_access": False,
        "team_members": False,
    },
    "ENTERPRISE": {
        "watermark_removed": True,
        "unlimited_quotes": True,
        "templates": True,
        "contract_conversion": True,
        "api_access": True,
        "team_members": True,
    },
}

PLAN_INFO = [
    PlanInfo(
        plan="FREE",
        name="무료",
        price=0,
        features=[
            "기본 견적서 작성",
            "PDF 다운로드 (워터마크 포함)",
            "견적 저장 5개 제한",
            "공유 링크 30일 유효",
        ],
    ),
    PlanInfo(
        plan="PRO",
        name="프로",
        price=29000,
        features=[
            "워터마크 제거",
            "무제한 견적 저장",
            "템플릿 저장/관리",
            "계약서 변환",
            "회사 정보 자동 채우기",
            "이메일 기술 지원",
        ],
    ),
    PlanInfo(
        plan="ENTERPRISE",
        name="엔터프라이즈",
        price=99000,
        features=[
            "모든 PRO 기능 포함",
            "API 키 발급",
            "다중 사용자(팀) 관리",
            "전담 매니저 지원",
            "전화/원격 기술 지원",
            "커스텀 템플릿 제작",
        ],
    ),
]


@router.get("/plans", response_model=PlansResponse)
async def get_plans():
    return PlansResponse(plans=PLAN_INFO)


@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: Annotated[User, Depends(get_current_user)],
):
    plan = current_user.plan
    is_active = current_user.plan != UserPlan.FREE or True  # FREE is always active

    # For paid plans, check if subscription is still valid
    expires_at = None
    if current_user.plan != UserPlan.FREE:
        # TODO: Check payment_history for latest PAID record and its expires_at
        pass

    return SubscriptionStatusResponse(
        plan=plan.value,
        is_active=is_active,
        features=PLAN_FEATURES.get(plan.value, PLAN_FEATURES["FREE"]),
    )


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(
    request: SubscribeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated["AsyncSession", Depends(get_db)],
):
    # Validate plan
    if request.plan not in ["PRO", "ENTERPRISE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_PLAN", "message": "유효하지 않은 플랜입니다."}},
        )

    # Check if already on this plan
    if current_user.plan.value == request.plan:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "ALREADY_SUBSCRIBED", "message": "이미 구독 중인 플랜입니다."}},
        )

    # Plan pricing
    plan_prices = {
        "PRO": 29000,
        "ENTERPRISE": 99000,
    }

    amount = plan_prices[request.plan]

    # Create payment history record (PENDING)
    payment = PaymentHistory(
        user_id=current_user.id,
        plan=PlanType(request.plan),
        amount=amount,
        status=PaymentStatus.PENDING,
    )

    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    # TODO: Integrate with TossPayments
    # For now, return a mock redirect URL
    pg_redirect_url = f"https://api.tosspayments.com/v1/payments/confirm?paymentKey=mock_{payment.id}&orderId={payment.id}&amount={amount}"

    return SubscribeResponse(
        payment_id=str(payment.id),
        pg_redirect_url=pg_redirect_url,
    )


@router.post("/webhook/toss")
async def toss_webhook(
    request: dict,
    db: Annotated["AsyncSession", Depends(get_db)],
):
    """Handle TossPayments webhook"""
    # Verify webhook signature (TODO: implement)

    payment_key = request.get("paymentKey")
    order_id = request.get("orderId")
    amount = request.get("amount")
    status = request.get("status")

    if not order_id:
        raise HTTPException(status_code=400, detail="Missing orderId")

    # Find payment record
    result = await db.execute(
        select(PaymentHistory).where(PaymentHistory.id == order_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Update payment status
    if status == "DONE":
        payment.status = PaymentStatus.PAID
        payment.paid_at = datetime.now(timezone.utc)
        payment.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        payment.pg_tid = payment_key
        payment.pg_response = request

        # Update user plan
        result = await db.execute(
            select(User).where(User.id == payment.user_id)
        )
        user = result.scalar_one_or_none()
        if user:
            user.plan = payment.plan
    else:
        payment.status = PaymentStatus.FAILED
        payment.pg_response = request

    await db.commit()

    return {"status": "ok"}


@router.post("/payments/{payment_id}/confirm")
async def confirm_payment(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated["AsyncSession", Depends(get_db)],
):
    """Confirm payment after redirect from TossPayments"""
    result = await db.execute(
        select(PaymentHistory).where(
            PaymentHistory.id == payment_id,
            PaymentHistory.user_id == current_user.id,
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "PAYMENT_NOT_FOUND", "message": "결제 내역을 찾을 수 없습니다."}},
        )

    # In production, verify with TossPayments API
    # For now, mock success
    if payment.status == PaymentStatus.PENDING:
        payment.status = PaymentStatus.PAID
        payment.paid_at = datetime.now(timezone.utc)
        payment.expires_at = datetime.now(timezone.utc) + timedelta(days=30)

        # Update user plan
        current_user.plan = payment.plan

        # Remove watermark from existing quotes
        from app.models.quote import Quote
        from sqlalchemy import update
        await db.execute(
            update(Quote)
            .where(Quote.user_id == current_user.id)
            .values(watermark_text="")
        )

        await db.commit()

        return {"status": "success", "message": "구독이 완료되었습니다."}

    return {"status": payment.status.value.lower(), "message": "결제 상태 확인 완료"}