"""
Holidays API — fully DB-backed against the actual `holidays` table.
All authenticated users can list holidays. HR/Admin can create, update, delete.
"""
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.holiday import Holiday
from app.db.models.user import User

router = APIRouter(prefix="/holidays", tags=["Holidays"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class HolidayCreate(BaseModel):
    name: str
    date: date
    type: Optional[str] = "national"   # national | state | optional | university
    is_optional: bool = False


class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    type: Optional[str] = None
    is_optional: Optional[bool] = None


class HolidayOut(BaseModel):
    id: str
    name: str
    date: date
    type: Optional[str] = None
    is_optional: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[HolidayOut])
async def list_holidays(
    year: Optional[int] = Query(None, description="Filter by year, e.g. 2026"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All authenticated users: list holidays, optionally filtered by year."""
    stmt = select(Holiday).order_by(Holiday.date)
    if year:
        stmt = stmt.where(extract("year", Holiday.date) == year)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=HolidayOut)
async def create_holiday(
    data: HolidayCreate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Create a new holiday."""
    holiday = Holiday(
        id=str(uuid.uuid4()),
        name=data.name,
        date=data.date,
        type=data.type,
        is_optional=data.is_optional,
        created_at=datetime.now(timezone.utc),
    )
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    return holiday


@router.patch("/{holiday_id}", response_model=HolidayOut)
async def update_holiday(
    holiday_id: str,
    data: HolidayUpdate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Update a holiday."""
    result = await db.execute(select(Holiday).where(Holiday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(holiday, field, value)
    await db.commit()
    await db.refresh(holiday)
    return holiday


@router.delete("/{holiday_id}")
async def delete_holiday(
    holiday_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: delete a holiday."""
    result = await db.execute(select(Holiday).where(Holiday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    await db.delete(holiday)
    await db.commit()
    return {"status": "deleted"}
