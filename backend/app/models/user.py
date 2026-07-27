from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Index, String, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.quote import Quote
    from app.models.company_info import CompanyInfo
    from app.models.template import Template
    from app.models.payment_history import PaymentHistory


class UserPlan(str, enum.Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    company_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    ceo_name: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    biz_reg_no: Mapped[str | None] = mapped_column(
        String(10), unique=True, nullable=True, index=True
    )
    company_address: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )
    phone: Mapped[str | None] = mapped_column(
        String(15), nullable=True
    )
    plan: Mapped[UserPlan] = mapped_column(
        Enum(UserPlan, native_enum=False), nullable=False, default=UserPlan.FREE
    )
    quote_seq: Mapped[int] = mapped_column(
        nullable=False, default=0
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    quotes: Mapped[list["Quote"]] = relationship(
        "Quote", back_populates="user", lazy="selectin"
    )
    company_info: Mapped["CompanyInfo"] = relationship(
        "CompanyInfo", back_populates="user", cascade="all, delete-orphan", lazy="selectin", uselist=False
    )
    templates: Mapped[list["Template"]] = relationship(
        "Template", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    payment_history: Mapped[list["PaymentHistory"]] = relationship(
        "PaymentHistory", back_populates="user", lazy="selectin"
    )

    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_biz_reg_no", "biz_reg_no"),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, plan={self.plan})>"