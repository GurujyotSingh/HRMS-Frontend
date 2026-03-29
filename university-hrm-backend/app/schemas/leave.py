from datetime import date
from typing import Optional
from pydantic import BaseModel, model_validator
from app.db.models.enums import LeaveStatus, LeaveType


class LeaveCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str

    @model_validator(mode="after")
    def end_after_start(self) -> "LeaveCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveApproveHR(BaseModel):
    action: str  # "approve" | "reject"

    @model_validator(mode="after")
    def valid_action(self) -> "LeaveApproveHR":
        if self.action not in ("approve", "reject"):
            raise ValueError("action must be 'approve' or 'reject'")
        return self


class LeaveRead(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatus
    approved_by_hod_id: Optional[int] = None
    approved_by_hr_id: Optional[int] = None

    model_config = {"from_attributes": True}