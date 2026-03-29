from __future__ import annotations
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.leave import Leave
    from app.db.models.leave_balance import LeaveBalance
    from app.db.models.user import User
    from app.db.models.department import Department
    from app.db.models.attendance import Attendance
    from app.db.models.onboarding import OnboardingRecord, OffboardingRecord
    from app.db.models.payroll import SalaryStructure, Payslip
    from app.db.models.performance import PerformanceGoal


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    department: Mapped[Department] = relationship("Department")
    user: Mapped[User] = relationship("User", back_populates="employee")
    leaves: Mapped[list[Leave]] = relationship("Leave", back_populates="employee")
    leave_balances: Mapped[list[LeaveBalance]] = relationship("LeaveBalance", back_populates="employee")
    attendance_records: Mapped[list[Attendance]] = relationship("Attendance", back_populates="employee")
    onboarding_record: Mapped[OnboardingRecord | None] = relationship("OnboardingRecord", back_populates="employee", uselist=False)
    offboarding_record: Mapped[OffboardingRecord | None] = relationship("OffboardingRecord", back_populates="employee", uselist=False)
    salary_structure: Mapped[SalaryStructure | None] = relationship("SalaryStructure", back_populates="employee", uselist=False)
    payslips: Mapped[list[Payslip]] = relationship("Payslip", back_populates="employee")
    performance_goals: Mapped[list[PerformanceGoal]] = relationship("PerformanceGoal", back_populates="employee")