from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.services.encryption_service import decrypt_value

class PayrollComponentBase(BaseModel):
    component_name: str
    component_type: str  # "earning" or "deduction"
    amount: Optional[float] = None


class PayrollComponentCreate(PayrollComponentBase):
    pass


class PayrollComponentRead(PayrollComponentBase):
    id: str
    payroll_run_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('amount', mode='before')
    @classmethod
    def decrypt_amount(cls, v: any) -> Optional[float]:
        if isinstance(v, str):
            try:
                return decrypt_value(v)
            except Exception:
                pass
        return v


class PayslipRead(BaseModel):
    id: str
    payroll_run_id: str
    pdf_path: Optional[str] = None
    generated_at: datetime
    downloaded_count: int

    model_config = ConfigDict(from_attributes=True)


class PayrollApprovalHistoryRead(BaseModel):
    id: str
    payroll_run_id: str
    action: str
    remarks: Optional[str] = None
    performed_by: str
    performed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayrollRunCreate(BaseModel):
    employee_id: str
    payroll_month: int
    payroll_year: int
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None
    total_earnings: Optional[float] = None
    total_deductions: Optional[float] = None
    remarks: Optional[str] = None
    components: List[PayrollComponentCreate] = []


class PayrollRunUpdate(BaseModel):
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None
    total_earnings: Optional[float] = None
    total_deductions: Optional[float] = None
    remarks: Optional[str] = None
    components: Optional[List[PayrollComponentCreate]] = None


class PayrollRunRead(BaseModel):
    id: str
    employee_id: str
    payroll_month: int
    payroll_year: int
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None
    total_earnings: Optional[float] = None
    total_deductions: Optional[float] = None
    remarks: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    components: List[PayrollComponentRead] = []
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('gross_salary', 'net_salary', 'total_earnings', 'total_deductions', mode='before')
    @classmethod
    def decrypt_financials(cls, v: any) -> Optional[float]:
        if isinstance(v, str):
            try:
                return decrypt_value(v)
            except Exception:
                pass
        return v


class PayrollRunPaginatedOut(BaseModel):
    items: List[PayrollRunRead]
    total: int


class PayrollActionRequest(BaseModel):
    remarks: Optional[str] = None