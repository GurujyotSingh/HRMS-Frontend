from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class AuditLog(Base):
    """
    Tracks all critical actions performed in the system.
    Written automatically via the audit_log() helper — never manually.

    action examples:
        LOGIN, LOGOUT, LOGIN_FAILED
        EMPLOYEE_CREATE, EMPLOYEE_UPDATE, EMPLOYEE_DELETE
        LEAVE_APPROVE, LEAVE_REJECT
        PAYROLL_GENERATE, PAYROLL_FINALIZE
        ROLE_CHANGE
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Who did it
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)  # denormalized for safety

    # What they did
    action: Mapped[str] = mapped_column(String(100), nullable=False)       # e.g. "LEAVE_APPROVE"
    resource: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "leave"
    resource_id: Mapped[int | None] = mapped_column(Integer, nullable=True)   # e.g. leave_id=5

    # Details
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)        # JSON or description
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="success")     # "success" | "failed"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    user: Mapped[User | None] = relationship("User")