from __future__ import annotations

from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.enums import LeaveType


class LeavePolicy(Base):
    """
    Master policy table: defines default leave quota for each role+leave_type combo.
    HR edits this. When a new employee is created, their LeaveBalance rows
    are auto-seeded from this table based on their role.

    role_name values: "faculty" | "accountant" | "employee"
    (maps directly to RoleEnum values)
    """
    __tablename__ = "leave_policies"
    __table_args__ = (
        UniqueConstraint("role_name", "leave_type", name="uq_policy_role_leavetype"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)
    leave_type: Mapped[LeaveType] = mapped_column(String(20), nullable=False)
    default_days: Mapped[int] = mapped_column(Integer, nullable=False)