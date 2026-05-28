"""
AuditLog model — updated to use VARCHAR UUID PK matching actual DB.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AuditLog(Base):
    """
    Tracks all critical actions performed in the system.
    Written automatically via the audit_log() helper — never manually.
    """
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)

    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    user_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    action: Mapped[str] = mapped_column(String, nullable=False)
    resource: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="success")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped[Optional["User"]] = relationship("User")