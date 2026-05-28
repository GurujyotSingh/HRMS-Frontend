"""
Payroll models — match actual `salary_structures` and `payslips` tables.
DB uses VARCHAR UUID PKs and net_salary (not net_pay), pdf_url, published_at.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM

from app.db.base import Base


class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    __table_args__ = (
        UniqueConstraint("employee_id", name="uq_salary_employee"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)

    basic_salary: Mapped[float] = mapped_column(Float, nullable=False)
    hra: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    ta: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    da: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    other_allowances: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    pf_deduction: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    professional_tax: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    tds_rate: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    working_days_per_month: Mapped[int] = mapped_column(Integer, default=26, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], lazy="selectin")


class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="uq_payslip_employee_month_year"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    working_days: Mapped[int] = mapped_column(Integer, nullable=False)
    days_present: Mapped[int] = mapped_column(Integer, nullable=False)
    days_absent: Mapped[int] = mapped_column(Integer, nullable=False)
    days_on_leave: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    basic_salary: Mapped[float] = mapped_column(Float, nullable=False)
    hra: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    ta: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    da: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    other_allowances: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    gross_salary: Mapped[float] = mapped_column(Float, nullable=False)

    absent_deduction: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    pf_deduction: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    professional_tax: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    tds_deduction: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    total_deductions: Mapped[float] = mapped_column(Float, nullable=False)

    # DB uses net_salary (not net_pay)
    net_salary: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(ENUM('DRAFT', 'PUBLISHED', name='PayslipStatus', create_type=False), nullable=True)   # draft | published
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], lazy="selectin")