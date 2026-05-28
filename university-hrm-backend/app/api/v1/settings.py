"""
Settings API — DB-backed against actual `system_settings` table.
Columns: work_start_time, work_end_time, late_threshold_minutes,
working_days[], leave_carry_forward_max, payroll_cycle_day,
ai_enabled, ai_system_prompt.
"""
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.system_setting import SystemSetting
from app.db.models.user import User

router = APIRouter(prefix="/settings", tags=["Settings"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class SystemSettingOut(BaseModel):
    id: str
    work_start_time: str
    work_end_time: str
    late_threshold_minutes: int
    working_days: Optional[List[str]] = None
    leave_carry_forward_max: int
    payroll_cycle_day: int
    ai_enabled: bool
    ai_system_prompt: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class SystemSettingUpdate(BaseModel):
    work_start_time: Optional[str] = None
    work_end_time: Optional[str] = None
    late_threshold_minutes: Optional[int] = None
    working_days: Optional[List[str]] = None
    leave_carry_forward_max: Optional[int] = None
    payroll_cycle_day: Optional[int] = None
    ai_enabled: Optional[bool] = None
    ai_system_prompt: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=SystemSettingOut)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current system settings (all authenticated users can read)."""
    result = await db.execute(select(SystemSetting).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="System settings not configured")
    return settings


@router.patch("/", response_model=SystemSettingOut)
async def update_settings(
    data: SystemSettingUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: update system settings."""
    result = await db.execute(select(SystemSetting).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="System settings not configured")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    settings.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(settings)
    return settings
