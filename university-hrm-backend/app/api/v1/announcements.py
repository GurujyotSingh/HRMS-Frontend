"""
Announcements API — fully DB-backed against the actual `announcements` and
`announcement_reads` tables.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.announcement import Announcement, AnnouncementRead
from app.db.models.user import User

router = APIRouter(prefix="/announcements", tags=["Announcements"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    target_roles: Optional[List[str]] = None
    target_departments: Optional[List[str]] = None
    priority: Optional[str] = "normal"
    expires_at: Optional[datetime] = None


class AnnouncementOut(BaseModel):
    id: str
    title: str
    body: str
    author_id: str
    target_roles: Optional[List[str]] = None
    target_departments: Optional[List[str]] = None
    priority: Optional[str] = None
    published_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    is_read: Optional[bool] = False

    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[AnnouncementOut])
async def list_announcements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List announcements visible to the current user's role."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Announcement)
        .where(
            (Announcement.expires_at == None) | (Announcement.expires_at > now)
        )
        .order_by(Announcement.published_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    announcements = result.scalars().all()

    # Check which ones the current user has read
    read_stmt = select(AnnouncementRead.announcement_id).where(
        AnnouncementRead.user_id == current_user.id
    )
    read_result = await db.execute(read_stmt)
    read_ids = set(read_result.scalars().all())

    out = []
    for a in announcements:
        d = AnnouncementOut.model_validate(a)
        d.is_read = a.id in read_ids
        out.append(d)
    return out


@router.post("", response_model=AnnouncementOut)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Create a new announcement."""
    now = datetime.now(timezone.utc)
    ann = Announcement(
        id=str(uuid.uuid4()),
        title=data.title,
        body=data.body,
        author_id=current_user.id,
        target_roles=data.target_roles,
        target_departments=data.target_departments,
        priority=data.priority or "normal",
        published_at=now,
        expires_at=data.expires_at,
        created_at=now,
    )
    db.add(ann)
    await db.commit()
    await db.refresh(ann)
    d = AnnouncementOut.model_validate(ann)
    d.is_read = False
    return d


@router.patch("/{announcement_id}/read")
async def mark_announcement_read(
    announcement_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an announcement as read for the current user."""
    # Check if already read
    existing = await db.execute(
        select(AnnouncementRead).where(
            AnnouncementRead.announcement_id == announcement_id,
            AnnouncementRead.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already read"}

    read_record = AnnouncementRead(
        id=str(uuid.uuid4()),
        announcement_id=announcement_id,
        user_id=current_user.id,
        read_at=datetime.now(timezone.utc),
    )
    db.add(read_record)
    await db.commit()
    return {"status": "marked as read"}


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: delete an announcement."""
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    await db.delete(ann)
    await db.commit()
    return {"status": "deleted"}
