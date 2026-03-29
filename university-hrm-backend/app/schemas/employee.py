from __future__ import annotations   # ← Added for maximum compatibility (Python 3.13 safe)

from datetime import date
from pydantic import BaseModel, EmailStr
from typing import Optional


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    employee_id: str
    date_of_joining: date
    department_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None   # HR can link later


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_joining: Optional[date] = None
    department_id: Optional[int] = None


class EmployeeRead(EmployeeBase):
    id: int
    user_id: int
    email: Optional[EmailStr] = None   # joined from User

    class Config:
        from_attributes = True