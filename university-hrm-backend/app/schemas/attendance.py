from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AttendanceRead(BaseModel):
    id: int
    employee_id: int
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    total_hours: Optional[float] = None
    is_late: bool
    is_auto_clocked_out: bool
    status: str

    model_config = {"from_attributes": True}


class AttendanceSummary(BaseModel):
    """Monthly summary for a single employee."""
    employee_id: int
    month: int
    year: int
    total_days_present: int
    total_days_late: int
    total_days_absent: int
    total_days_on_leave: int
    total_hours_worked: float
    records: list[AttendanceRead]