from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


# ── Appraisal Cycle ───────────────────────────────────────────────────────────

class AppraisalCycleCreate(BaseModel):
    title: str
    year: int
    start_date: datetime
    end_date: datetime


class AppraisalCycleRead(BaseModel):
    id: int
    title: str
    year: int
    start_date: datetime
    end_date: datetime
    status: str

    model_config = {"from_attributes": True}


# ── Performance Goals ─────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    """Employee submits their goals for a cycle."""
    cycle_id: int
    goals_text: str


class GoalSelfReview(BaseModel):
    """Employee submits self-rating at end of cycle."""
    self_rating: float
    self_comments: Optional[str] = None

    @field_validator("self_rating")
    @classmethod
    def rating_range(cls, v):
        if not (1.0 <= v <= 5.0):
            raise ValueError("Rating must be between 1.0 and 5.0")
        return round(v, 1)


class GoalHODReview(BaseModel):
    """HOD reviews and rates employee goals."""
    hod_rating: float
    hod_comments: Optional[str] = None

    @field_validator("hod_rating")
    @classmethod
    def rating_range(cls, v):
        if not (1.0 <= v <= 5.0):
            raise ValueError("Rating must be between 1.0 and 5.0")
        return round(v, 1)


class GoalHRFinalize(BaseModel):
    """HR sets final rating."""
    final_rating: float
    hr_comments: Optional[str] = None

    @field_validator("final_rating")
    @classmethod
    def rating_range(cls, v):
        if not (1.0 <= v <= 5.0):
            raise ValueError("Rating must be between 1.0 and 5.0")
        return round(v, 1)


class PerformanceGoalRead(BaseModel):
    id: int
    employee_id: int
    cycle_id: int
    goals_text: str
    self_rating: Optional[float] = None
    self_comments: Optional[str] = None
    hod_rating: Optional[float] = None
    hod_comments: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    final_rating: Optional[float] = None
    hr_comments: Optional[str] = None
    finalized_by_id: Optional[int] = None
    finalized_at: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Reports ───────────────────────────────────────────────────────────────────

class DeptRoleCount(BaseModel):
    department: Optional[str]
    role: str
    count: int


class LeaveStatsReport(BaseModel):
    total: int
    pending: int
    approved_by_hod: int
    approved: int
    rejected: int
    cancelled: int


class AttendanceSummaryReport(BaseModel):
    employee_id: int
    employee_name: str
    days_present: int
    days_absent: int
    days_late: int
    total_hours: float


class PayrollCostReport(BaseModel):
    month: int
    year: int
    total_employees: int
    total_gross: float
    total_deductions: float
    total_net_pay: float
    by_department: list[dict]


class OnboardingReport(BaseModel):
    total: int
    in_progress: int
    completed: int
    details: list[dict]