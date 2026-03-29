from __future__ import annotations
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.enums import LeaveStatus, LeaveType

if TYPE_CHECKING:
    from app.db.models.employee import Employee
    from app.db.models.user import User


class Leave(Base):
    __tablename__ = "leaves"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    leave_type: Mapped[LeaveType] = mapped_column(String(20), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LeaveStatus] = mapped_column(String(20), default=LeaveStatus.PENDING, nullable=False)

    # Tracks who took each action
    approved_by_hod_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_by_hr_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relationships
    employee: Mapped[Employee] = relationship("Employee", back_populates="leaves")
    hod_approver: Mapped[User | None] = relationship("User", foreign_keys=[approved_by_hod_id])
    hr_approver: Mapped[User | None] = relationship("User", foreign_keys=[approved_by_hr_id])