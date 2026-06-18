"""
Onboarding models — match actual `onboarding_employees` and `onboarding_tasks` tables.
The actual DB table is `onboarding_employees` (not `onboarding_records`).
Uses VARCHAR UUID PKs.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OnboardingEmployee(Base):
    """
    Tracks onboarding progress per employee.
    One record per employee — created when HR adds a new employee.
    """
    __tablename__ = "onboarding_employees"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, unique=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expected_completion_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # pending | in_progress | completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id])
    tasks: Mapped[list["OnboardingTask"]] = relationship(
        "OnboardingTask", back_populates="onboarding",
        cascade="all, delete-orphan"
    )


class OnboardingTask(Base):
    """Individual task item for employee onboarding."""
    __tablename__ = "onboarding_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    onboarding_record_id: Mapped[str] = mapped_column(String, ForeignKey("onboarding_employees.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str] = mapped_column(String, default="EMPLOYEE", nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    onboarding: Mapped["OnboardingEmployee"] = relationship("OnboardingEmployee", back_populates="tasks")


class OffboardingRecord(Base):
    """HR initiates when employee is leaving."""
    __tablename__ = "offboarding_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, unique=True)
    initiated_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_working_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, default="IN_PROGRESS", nullable=False)
    clearance_status: Mapped[str] = mapped_column(String, default="PENDING", nullable=False)
    initiated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id])
    initiated_by: Mapped["User"] = relationship("User", foreign_keys=[initiated_by_id])
    tasks: Mapped[list["OffboardingTask"]] = relationship(
        "OffboardingTask", back_populates="offboarding_record",
        cascade="all, delete-orphan"
    )


class OffboardingTask(Base):
    """Individual checklist item for employee offboarding."""
    __tablename__ = "offboarding_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    offboarding_record_id: Mapped[str] = mapped_column(String, ForeignKey("offboarding_records.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    offboarding_record: Mapped["OffboardingRecord"] = relationship("OffboardingRecord", back_populates="tasks")