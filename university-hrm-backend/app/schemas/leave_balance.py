from pydantic import BaseModel
from app.db.models.enums import LeaveType


# ── LeaveBalance schemas ──────────────────────────────────────────────────────

class LeaveBalanceRead(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    total_days: int
    used_days: int
    remaining_days: int   # computed property from model

    model_config = {"from_attributes": True}


class LeaveBalanceUpdate(BaseModel):
    """HR uses this to manually override an employee's quota."""
    total_days: int


# ── LeavePolicy schemas ───────────────────────────────────────────────────────

class LeavePolicyRead(BaseModel):
    id: int
    role_name: str
    leave_type: LeaveType
    default_days: int

    model_config = {"from_attributes": True}


class LeavePolicyCreate(BaseModel):
    role_name: str    # "faculty" | "accountant" | "employee"
    leave_type: LeaveType
    default_days: int


class LeavePolicyUpdate(BaseModel):
    default_days: int