from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.employee import Employee
    from app.db.models.user import User


class AppraisalCycle(Base):
    """
    HR creates one cycle per year (e.g. "Annual 2026").
    All goals and reviews are tied to a cycle.
    """
    __tablename__ = "appraisal_cycles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "Annual 2026"
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # status: "active" | "closed"

    goals: Mapped[list[PerformanceGoal]] = relationship("PerformanceGoal", back_populates="cycle")


class PerformanceGoal(Base):
    """
    Employee sets goals within an appraisal cycle.
    HOD reviews and scores each goal.
    One record per (employee, cycle).
    """
    __tablename__ = "performance_goals"
    __table_args__ = (
        UniqueConstraint("employee_id", "cycle_id", name="uq_goal_employee_cycle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    cycle_id: Mapped[int] = mapped_column(ForeignKey("appraisal_cycles.id"), nullable=False)

    # Employee fills these
    goals_text: Mapped[str] = mapped_column(Text, nullable=False)         # what they plan to achieve
    self_rating: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)   # 1.0 - 5.0
    self_comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    # HOD fills these
    hod_rating: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    hod_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # HR finalizes
    final_rating: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    hr_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    finalized_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    # status: "draft" | "submitted" | "hod_reviewed" | "finalized"

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    employee: Mapped[Employee] = relationship("Employee", back_populates="performance_goals")
    cycle: Mapped[AppraisalCycle] = relationship("AppraisalCycle", back_populates="goals")
    reviewed_by: Mapped[User | None] = relationship("User", foreign_keys=[reviewed_by_id])
    finalized_by: Mapped[User | None] = relationship("User", foreign_keys=[finalized_by_id])