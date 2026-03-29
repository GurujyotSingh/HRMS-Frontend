from __future__ import annotations
from datetime import date, datetime, time
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.employee import Employee


SHIFT_END_TIME = time(18, 0)   # 6:00 PM — used when employee forgets to clock out
LATE_THRESHOLD = time(9, 0)    # 9:00 AM — arrived after this = late


class Attendance(Base):
    """
    One row per employee per day.
    clock_in is set on first clock-in.
    clock_out is set when employee clocks out.
    If employee forgets to clock out, clock_out = SHIFT_END_TIME and is_auto_clocked_out = True.
    total_hours is calculated and stored on clock-out.
    is_late = clock_in time > 09:00 AM
    """
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    clock_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    clock_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    total_hours: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    is_late: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_auto_clocked_out: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # e.g. "present" | "absent" | "on_leave" | "holiday"
    status: Mapped[str] = mapped_column(String(20), default="present", nullable=False)

    employee: Mapped[Employee] = relationship("Employee", back_populates="attendance_records")