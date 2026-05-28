"""
Recruitment API — DB-backed CRUD for `recruitment_jobs` and `recruitment_applicants`.
Phase 3 implementation.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.recruitment import RecruitmentJob, RecruitmentApplicant
from app.db.models.user import User

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    department_id: str
    type: Optional[str] = "full_time"    # full_time | part_time | contract | internship
    description: str
    requirements: Optional[List[str]] = None
    closing_date: datetime
    status: Optional[str] = "open"


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department_id: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    closing_date: Optional[datetime] = None
    status: Optional[str] = None


class JobOut(BaseModel):
    id: str
    title: str
    department_id: str
    type: Optional[str] = None
    description: str
    requirements: Optional[List[str]] = None
    posted_at: datetime
    closing_date: datetime
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicantCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None


class ApplicantUpdate(BaseModel):
    status: Optional[str] = None    # applied | screening | interview | offered | hired | rejected
    notes: Optional[str] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None


class ApplicantOut(BaseModel):
    id: str
    job_id: str
    name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Job Endpoints ─────────────────────────────────────────────────────────────

@router.get("/jobs", response_model=list[JobOut])
async def list_jobs(
    status: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all recruitment jobs."""
    stmt = select(RecruitmentJob).order_by(RecruitmentJob.posted_at.desc()).offset(skip).limit(limit)
    if status:
        stmt = stmt.where(RecruitmentJob.status == status)
    if department_id:
        stmt = stmt.where(RecruitmentJob.department_id == department_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RecruitmentJob).where(RecruitmentJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/jobs", response_model=JobOut)
async def create_job(
    data: JobCreate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Post a new job opening."""
    now = datetime.now(timezone.utc)
    job = RecruitmentJob(
        id=str(uuid.uuid4()),
        title=data.title,
        department_id=data.department_id,
        type=data.type,
        description=data.description,
        requirements=data.requirements,
        posted_at=now,
        closing_date=data.closing_date,
        status=data.status or "open",
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.patch("/jobs/{job_id}", response_model=JobOut)
async def update_job(
    job_id: str,
    data: JobUpdate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RecruitmentJob).where(RecruitmentJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    job.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RecruitmentJob).where(RecruitmentJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
    return {"status": "deleted"}


# ── Applicant Endpoints ───────────────────────────────────────────────────────

@router.get("/jobs/{job_id}/applicants", response_model=list[ApplicantOut])
async def list_applicants(
    job_id: str,
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: List all applicants for a job."""
    stmt = (
        select(RecruitmentApplicant)
        .where(RecruitmentApplicant.job_id == job_id)
        .order_by(RecruitmentApplicant.applied_at.desc())
    )
    if status:
        stmt = stmt.where(RecruitmentApplicant.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/jobs/{job_id}/applicants", response_model=ApplicantOut)
async def add_applicant(
    job_id: str,
    data: ApplicantCreate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Add an applicant to a job."""
    now = datetime.now(timezone.utc)
    applicant = RecruitmentApplicant(
        id=str(uuid.uuid4()),
        job_id=job_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        resume_url=data.resume_url,
        status="applied",
        notes=data.notes,
        applied_at=now,
        updated_at=now,
    )
    db.add(applicant)
    await db.commit()
    await db.refresh(applicant)
    return applicant


@router.patch("/applicants/{applicant_id}", response_model=ApplicantOut)
async def update_applicant(
    applicant_id: str,
    data: ApplicantUpdate,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Update applicant status or notes."""
    result = await db.execute(
        select(RecruitmentApplicant).where(RecruitmentApplicant.id == applicant_id)
    )
    applicant = result.scalar_one_or_none()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(applicant, field, value)
    applicant.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(applicant)
    return applicant
