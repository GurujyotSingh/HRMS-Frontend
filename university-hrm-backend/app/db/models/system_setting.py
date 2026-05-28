"""
SystemSetting model — matches actual `system_settings` table.
Has work_start_time, work_end_time, late_threshold_minutes, working_days[],
leave_carry_forward_max, payroll_cycle_day, ai_enabled, ai_system_prompt.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    work_start_time: Mapped[str] = mapped_column(String, nullable=False)        # e.g. "09:00"
    work_end_time: Mapped[str] = mapped_column(String, nullable=False)          # e.g. "18:00"
    late_threshold_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    working_days: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)  # ["Mon","Tue",...]
    leave_carry_forward_max: Mapped[int] = mapped_column(Integer, nullable=False)
    payroll_cycle_day: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ai_system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
