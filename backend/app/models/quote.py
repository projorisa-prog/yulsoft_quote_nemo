from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.quote_item import QuoteItem
    from app.models.user import User


class QuoteStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    COMPLETED = "COMPLETED"
    CONVERTED = "CONVERTED"
    EXPIRED = "EXPIRED"


class Quote(Base):
    __tablename__ = "quote"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quote_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    status: Mapped[QuoteStatus] = mapped_column(
        Enum(QuoteStatus, native_enum=False), nullable=False, default=QuoteStatus.DRAFT
    )
    customer_info: Mapped[dict] = mapped_column(JSON, nullable=False)
    supplier_info: Mapped[dict] = mapped_column(JSON, nullable=True)
    calculation_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    totals: Mapped[dict] = mapped_column(JSON, nullable=False)
    watermark_text: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Powered by 율소프트 | www.yulsoft.kr"
    )
    design_key: Mapped[str] = mapped_column(
        String(20), nullable=False, default="classic"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped[User | None] = relationship(
        "User", back_populates="quotes", lazy="selectin"
    )
    items: Mapped[list[QuoteItem]] = relationship(
        "QuoteItem",
        back_populates="quote",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="QuoteItem.sort_order",
    )

    __table_args__ = (
        Index("idx_quote_expires_status", "expires_at", "status"),
        Index("idx_quote_created_at", "created_at"),
        Index("idx_quote_user_id", "user_id"),
        Index("idx_quote_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Quote(id={self.id}, quote_number={self.quote_number}, status={self.status})>"