from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Onboarding Templates (HR manages) ────────────────────────────────────────

class OnboardingTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None


class OnboardingTemplateRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Onboarding Tasks ──────────────────────────────────────────────────────────

class OnboardingTaskRead(BaseModel):
    id: int
    onboarding_record_id: int
    title: str
    description: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OnboardingTaskCreate(BaseModel):
    """HR adds a custom task to a specific employee's onboarding."""
    title: str
    description: Optional[str] = None


# ── Onboarding Record ─────────────────────────────────────────────────────────

class OnboardingRecordRead(BaseModel):
    id: int
    employee_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    tasks: list[OnboardingTaskRead] = []

    model_config = {"from_attributes": True}


# ── Offboarding ───────────────────────────────────────────────────────────────

class OffboardingInitiate(BaseModel):
    """HR uses this to start offboarding for an employee."""
    employee_id: int
    reason: Optional[str] = None
    last_working_date: Optional[datetime] = None


class OffboardingTaskRead(BaseModel):
    id: int
    offboarding_record_id: int
    title: str
    description: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OffboardingTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


class ClearanceUpdate(BaseModel):
    """HR updates clearance status."""
    clearance_status: str   # "pending" | "cleared" | "hold"


class OffboardingRecordRead(BaseModel):
    id: int
    employee_id: int
    initiated_by_id: int
    reason: Optional[str] = None
    last_working_date: Optional[datetime] = None
    status: str
    clearance_status: str
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    tasks: list[OffboardingTaskRead] = []

    model_config = {"from_attributes": True}