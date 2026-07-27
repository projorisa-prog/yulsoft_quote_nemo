from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User


class CompanyInfo(Base):
    __tablename__ = "company_info"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    biz_reg_no: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    company_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    ceo_name: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    address: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    business_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    business_item: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    phone: Mapped[str] = mapped_column(
        String(15), nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    bank_info: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
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

    user: Mapped["User"] = relationship(
        "User", back_populates="company_info"
    )

    __table_args__ = (
        Index("idx_company_info_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<CompanyInfo(id={self.id}, company_name={self.company_name})>"