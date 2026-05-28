"""
Leave Request model — matches actual `leave_requests` table (not `leaves`).
Uses VARCHAR UUID PKs.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM

from app.db.base import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    leave_type: Mapped[Optional[str]] = mapped_column(ENUM('ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPENSATORY', name='LeaveType', create_type=False), nullable=True)  # casual | sick | earned | unpaid
    from_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    to_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_days: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', name='LeaveStatus', create_type=False), nullable=True)  # pending | approved | rejected | cancelled
    reviewed_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], lazy="selectin")
    reviewed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by_id], lazy="selectin")
