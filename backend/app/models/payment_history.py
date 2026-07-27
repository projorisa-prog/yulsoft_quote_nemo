from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import UserPlan, PaymentStatus

# Re-export for backward compatibility
PlanType = UserPlan

if TYPE_CHECKING:
    from app.models.user import User


class PaymentHistory(Base):
    __tablename__ = "payment_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan: Mapped[UserPlan] = mapped_column(
        Enum(UserPlan, native_enum=False), nullable=False
    )
    amount: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False), nullable=False, default=PaymentStatus.PENDING
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    pg_tid: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    pg_response: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="payment_history"
    )

    __table_args__ = (
        Index("idx_payment_history_user_id", "user_id"),
        Index("idx_payment_history_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<PaymentHistory(id={self.id}, user_id={self.user_id}, plan={self.plan}, status={self.status})>"