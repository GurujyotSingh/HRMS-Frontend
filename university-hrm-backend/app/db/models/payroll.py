"""
Payroll models (Manual Entry / Encrypted).
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PayrollRun(Base):
    __tablename__ = "payroll_runs"
    __table_args__ = (
        UniqueConstraint("employee_id", "payroll_month", "payroll_year", name="uq_payroll_run_emp_period"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    payroll_month: Mapped[int] = mapped_column(Integer, nullable=False)
    payroll_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Financial fields are stored as AES-256-GCM encrypted base64 strings
    gross_salary: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    net_salary: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_earnings: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_deductions: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status: Draft, Pending_HR_Review, Pending_Finance_Review, Approved, Paid, Rejected
    status: Mapped[str] = mapped_column(String, nullable=False, default="Draft")
    
    created_by: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], lazy="selectin")
    components: Mapped[list["PayrollComponent"]] = relationship("PayrollComponent", back_populates="payroll_run", cascade="all, delete-orphan")


class PayrollComponent(Base):
    __tablename__ = "payroll_components"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    payroll_run_id: Mapped[str] = mapped_column(String, ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False)
    
    component_name: Mapped[str] = mapped_column(String, nullable=False)
    component_type: Mapped[str] = mapped_column(String, nullable=False) # "earning" or "deduction"
    
    # Encrypted base64 string
    amount: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    payroll_run: Mapped["PayrollRun"] = relationship("PayrollRun", back_populates="components")


class Payslip(Base):
    __tablename__ = "payslips"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    payroll_run_id: Mapped[str] = mapped_column(String, ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    pdf_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    downloaded_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class PayrollApprovalHistory(Base):
    __tablename__ = "payroll_approval_history"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    payroll_run_id: Mapped[str] = mapped_column(String, ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False)
    
    action: Mapped[str] = mapped_column(String, nullable=False) # e.g., "SUBMITTED", "APPROVED", "REJECTED"
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    performed_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
