"""
Attendance model — matches actual `attendance` table.
Uses VARCHAR UUID PKs, check_in/check_out (not clock_in/clock_out),
includes notes, corrected_by, corrected_at columns.
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)   # present | absent | on_leave | holiday
    is_late: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    corrected_by: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    corrected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id])
    corrector: Mapped[Optional["User"]] = relationship("User", foreign_keys=[corrected_by])