from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.employee import Employee
    from app.db.models.user import User


# ── Onboarding ────────────────────────────────────────────────────────────────

class OnboardingTemplate(Base):
    """
    Master list of default tasks every new employee must complete.
    HR manages this list. When a new employee is created, these tasks
    are auto-seeded into EmployeeOnboardingTask.
    """
    __tablename__ = "onboarding_templates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class OnboardingRecord(Base):
    """
    One record per employee. Tracks overall onboarding status.
    Created automatically when employee is added.
    """
    __tablename__ = "onboarding_records"
    __table_args__ = (
        UniqueConstraint("employee_id", name="uq_onboarding_employee"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_progress", nullable=False)
    # status: "in_progress" | "completed"
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped[Employee] = relationship("Employee", back_populates="onboarding_record")
    tasks: Mapped[list[OnboardingTask]] = relationship("OnboardingTask", back_populates="onboarding_record", cascade="all, delete-orphan")


class OnboardingTask(Base):
    """
    Individual task per employee, seeded from OnboardingTemplate.
    HR can also add custom tasks for a specific employee.
    """
    __tablename__ = "onboarding_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    onboarding_record_id: Mapped[int] = mapped_column(ForeignKey("onboarding_records.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    onboarding_record: Mapped[OnboardingRecord] = relationship("OnboardingRecord", back_populates="tasks")


# ── Offboarding ───────────────────────────────────────────────────────────────

class OffboardingRecord(Base):
    """
    HR initiates this when an employee is leaving.
    One record per employee (can only be offboarded once).
    """
    __tablename__ = "offboarding_records"
    __table_args__ = (
        UniqueConstraint("employee_id", name="uq_offboarding_employee"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    initiated_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)  # HR user
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_working_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="in_progress", nullable=False)
    # status: "in_progress" | "completed" | "cancelled"

    clearance_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # clearance_status: "pending" | "cleared" | "hold"

    initiated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped[Employee] = relationship("Employee", back_populates="offboarding_record")
    initiated_by: Mapped[User] = relationship("User", foreign_keys=[initiated_by_id])
    tasks: Mapped[list[OffboardingTask]] = relationship("OffboardingTask", back_populates="offboarding_record", cascade="all, delete-orphan")


class OffboardingTask(Base):
    """Individual checklist item for an employee's offboarding."""
    __tablename__ = "offboarding_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    offboarding_record_id: Mapped[int] = mapped_column(ForeignKey("offboarding_records.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    offboarding_record: Mapped[OffboardingRecord] = relationship("OffboardingRecord", back_populates="tasks")