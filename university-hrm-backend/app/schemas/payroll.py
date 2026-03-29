from datetime import datetime
from typing import Optional
from pydantic import BaseModel, model_validator


# ── Salary Structure ──────────────────────────────────────────────────────────

class SalaryStructureCreate(BaseModel):
    basic_salary: float
    hra: float = 0
    ta: float = 0
    da: float = 0
    other_allowances: float = 0
    pf_deduction: float = 0
    professional_tax: float = 0
    tds_rate: float = 0          # percentage e.g. 10.0 = 10%
    working_days_per_month: int = 26

    @model_validator(mode="after")
    def validate_values(self) -> "SalaryStructureCreate":
        if self.basic_salary <= 0:
            raise ValueError("basic_salary must be greater than 0")
        if not (0 <= self.tds_rate <= 100):
            raise ValueError("tds_rate must be between 0 and 100")
        return self


class SalaryStructureRead(BaseModel):
    id: int
    employee_id: int
    basic_salary: float
    hra: float
    ta: float
    da: float
    other_allowances: float
    pf_deduction: float
    professional_tax: float
    tds_rate: float
    working_days_per_month: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Payslip ───────────────────────────────────────────────────────────────────

class PayslipRead(BaseModel):
    id: int
    employee_id: int
    month: int
    year: int

    # Attendance
    working_days: int
    days_present: int
    days_absent: int
    days_on_leave: int

    # Earnings
    basic_salary: float
    hra: float
    ta: float
    da: float
    other_allowances: float
    gross_salary: float

    # Deductions
    absent_deduction: float
    pf_deduction: float
    professional_tax: float
    tds_deduction: float
    total_deductions: float

    # Final
    net_pay: float
    status: str
    notes: Optional[str] = None
    generated_at: datetime
    finalized_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PayslipGenerate(BaseModel):
    """HR uses this to generate a payslip for an employee."""
    employee_id: int
    month: int
    year: int
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_month(self) -> "PayslipGenerate":
        if not (1 <= self.month <= 12):
            raise ValueError("month must be between 1 and 12")
        return self


class PayslipSummary(BaseModel):
    """HR monthly summary across all employees."""
    month: int
    year: int
    total_employees: int
    total_gross: float
    total_deductions: float
    total_net_pay: float
    payslips: list[PayslipRead]