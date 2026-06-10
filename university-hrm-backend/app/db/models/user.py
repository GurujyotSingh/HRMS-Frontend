"""
User model — matches the actual `users` table in PostgreSQL.
The DB uses VARCHAR UUID strings as PKs (not serial integers).
The `users` table IS the employee table (no separate employees table in real DB).
"""
from __future__ import annotations
from app.db.models.department import Department
from app.db.models.notification import Notification
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer,
    String, Text, ARRAY, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, ENUM

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # Name
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)

    # Contact
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    work_email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    personal_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Personal
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', name='Gender', create_type=False), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_photo: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)

    # Employment
    role: Mapped[Optional[str]] = mapped_column(ENUM('SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_STAFF', 'FACULTY', 'STAFF', name='SystemRole', create_type=False), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"), nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING', name='EmploymentType', create_type=False), nullable=True)
    salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    join_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    exit_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', name='EmployeeStatus', create_type=False), nullable=True)

    # Address
    street: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    campus: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Emergency Contact
    emergency_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    emergency_relation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    emergency_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    emergency_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # References
    reporting_manager_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    position_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Statutory & Financial
    pan_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    uan_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Preferences
    preferences: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Auth / Security
    reset_token: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reset_token_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    needs_password_change: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    department: Mapped[Optional["Department"]] = relationship("Department", foreign_keys=[department_id], lazy="selectin")
    reporting_manager: Mapped[Optional["User"]] = relationship("User", remote_side="User.id", foreign_keys=[reporting_manager_id], lazy="selectin")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", lazy="selectin")