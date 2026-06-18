"""
Recruitment models — match actual `recruitment_jobs` and `recruitment_applicants` tables.
Uses VARCHAR UUID PKs.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, ARRAY, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecruitmentJob(Base):
    __tablename__ = "recruitment_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    department_id: Mapped[str] = mapped_column(String, ForeignKey("departments.id"), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)         # full_time | part_time | contract | internship
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closing_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)       # open | closed | on_hold
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    department: Mapped["Department"] = relationship("Department", foreign_keys=[department_id])
    applicants: Mapped[list["RecruitmentApplicant"]] = relationship("RecruitmentApplicant", back_populates="job")


class RecruitmentApplicant(Base):
    __tablename__ = "recruitment_applicants"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    job_id: Mapped[str] = mapped_column(String, ForeignKey("recruitment_jobs.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)       # applied | screening | interview | offered | hired | rejected
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    job: Mapped["RecruitmentJob"] = relationship("RecruitmentJob", back_populates="applicants")
    history: Mapped[list["RecruitmentApplicantHistory"]] = relationship(
        "RecruitmentApplicantHistory", 
        back_populates="applicant", 
        cascade="all, delete-orphan",
        order_by="RecruitmentApplicantHistory.changed_at.desc()"
    )

class RecruitmentApplicantHistory(Base):
    __tablename__ = "recruitment_applicant_history"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    applicant_id: Mapped[str] = mapped_column(String, ForeignKey("recruitment_applicants.id"), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)  # e.g., 'STATUS_CHANGE', 'REOPENED'
    previous_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    applicant: Mapped["RecruitmentApplicant"] = relationship("RecruitmentApplicant", back_populates="history")
    changed_by: Mapped[Optional["User"]] = relationship("User")
