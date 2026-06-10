"""
Performance models — match actual `appraisal_cycles` and `performance_goals` tables.
DB uses VARCHAR UUID PKs. performance_goals has director_rating/director_comments
(not hod_rating/hod_comments).
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AppraisalCycle(Base):
    __tablename__ = "appraisal_cycles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String, default="ACTIVE", nullable=False)  # ACTIVE | CLOSED

    goals: Mapped[list["PerformanceGoal"]] = relationship("PerformanceGoal", back_populates="cycle", lazy="selectin")


class PerformanceGoal(Base):
    __tablename__ = "performance_goals"
    __table_args__ = (
        UniqueConstraint("employee_id", "cycle_id", name="uq_goal_employee_cycle"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    cycle_id: Mapped[str] = mapped_column(String, ForeignKey("appraisal_cycles.id"), nullable=False)

    goals_text: Mapped[str] = mapped_column(Text, nullable=False)
    self_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    self_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # DB uses director_rating (not hod_rating)
    director_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    director_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    final_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hr_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    finalized_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    finalized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], lazy="selectin")
    cycle: Mapped["AppraisalCycle"] = relationship("AppraisalCycle", back_populates="goals", lazy="selectin")
    reviewed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by_id], lazy="selectin")
    finalized_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[finalized_by_id], lazy="selectin")