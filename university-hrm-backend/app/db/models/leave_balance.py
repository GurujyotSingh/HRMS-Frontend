from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey, String, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.enums import LeaveType

if TYPE_CHECKING:
    from app.db.models.employee import Employee


class LeaveBalance(Base):
    """
    One row per (employee, leave_type).
    Auto-seeded when an employee is created via LeavePolicy.
    HR can manually override total_days anytime.
    used_days is incremented only when a leave reaches APPROVED status.
    """
    __tablename__ = "leave_balances"
    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type", name="uq_balance_employee_leavetype"),
        CheckConstraint("used_days >= 0", name="ck_used_days_non_negative"),
        CheckConstraint("total_days >= 0", name="ck_total_days_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    leave_type: Mapped[LeaveType] = mapped_column(String(20), nullable=False)
    total_days: Mapped[int] = mapped_column(Integer, nullable=False)
    used_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Computed property — no DB column needed
    @property
    def remaining_days(self) -> int:
        return max(self.total_days - self.used_days, 0)

    employee: Mapped[Employee] = relationship("Employee", back_populates="leave_balances")