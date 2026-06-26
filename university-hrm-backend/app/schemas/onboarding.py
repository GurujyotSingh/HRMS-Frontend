from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Onboarding Templates (HR manages) ────────────────────────────────────────

class OnboardingTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None


class OnboardingTemplateRead(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Onboarding Tasks ──────────────────────────────────────────────────────────

class OnboardingTaskRead(BaseModel):
    id: str
    onboarding_record_id: str
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
    id: str
    employee_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    tasks: list[OnboardingTaskRead] = []

    model_config = {"from_attributes": True}


# ── Offboarding ───────────────────────────────────────────────────────────────

class OffboardingInitiate(BaseModel):
    """HR uses this to start offboarding for an employee."""
    employee_id: str
    reason: Optional[str] = None
    last_working_date: Optional[datetime] = None
    tasks: Optional[list[OffboardingTaskCreate]] = None


class OffboardingTemplateResponse(BaseModel):
    """Returned when previewing templates for a specific employee."""
    tasks: list[OffboardingTaskCreate]


class OffboardingTaskRead(BaseModel):
    id: str
    offboarding_record_id: str
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
    clearance_status: str   # "PENDING" | "CLEARED" | "HOLD"


class OffboardingRecordRead(BaseModel):
    id: str
    employee_id: str
    initiated_by_id: str
    reason: Optional[str] = None
    last_working_date: Optional[datetime] = None
    status: str
    clearance_status: str
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    tasks: list[OffboardingTaskRead] = []

    model_config = {"from_attributes": True}