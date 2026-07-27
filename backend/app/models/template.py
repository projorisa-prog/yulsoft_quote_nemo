from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User


class Template(Base):
    __tablename__ = "template"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    items: Mapped[list[dict]] = mapped_column(
        JSON, nullable=False, default=list
    )
    calculation_snapshot: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
    is_public: Mapped[bool] = mapped_column(
        nullable=False, default=False
    )
    usage_count: Mapped[int] = mapped_column(
        nullable=False, default=0
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

    user: Mapped["User"] = relationship("User", back_populates="templates")

    __table_args__ = (
        Index("idx_template_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<Template(id={self.id}, name={self.name}, user_id={self.user_id})>"