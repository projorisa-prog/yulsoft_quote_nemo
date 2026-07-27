from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    JSON,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class QuoteItem(Base):
    __tablename__ = "quote_item"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quote_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("quote.id", ondelete="CASCADE"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    area: Mapped[str] = mapped_column(String(50), nullable=False)
    task: Mapped[str] = mapped_column(String(100), nullable=False)
    days: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    exclude_area: Mapped[str | None] = mapped_column(String(100), nullable=True)
    memo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    quote: Mapped["Quote"] = relationship("Quote", back_populates="items")

    __table_args__ = (
        Index("idx_quote_item_quote_id", "quote_id"),
        CheckConstraint("qty >= 1", name="ck_quote_item_qty_positive"),
        CheckConstraint("unit_price >= 0", name="ck_quote_item_unit_price_nonneg"),
    )

    def __repr__(self) -> str:
        return f"<QuoteItem(id={self.id}, quote_id={self.quote_id}, area={self.area}, task={self.task})>"