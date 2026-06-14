import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models.recruitment import RecruitmentJob, RecruitmentApplicant

router = APIRouter(prefix="/public/careers", tags=["Public Careers"])

# Schemas
class PublicJobOut(BaseModel):
    id: str
    title: str
    department_name: str
    type: Optional[str] = None
    description: str
    requirements: Optional[list[str]] = None
    posted_at: datetime
    closing_date: datetime

class PublicApplicantOut(BaseModel):
    id: str
    job_id: str
    name: str
    email: str
    status: str
    applied_at: datetime

@router.get("/jobs", response_model=list[PublicJobOut])
async def list_public_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RecruitmentJob)
        .options(selectinload(RecruitmentJob.department))
        .where(RecruitmentJob.status.in_(["open", "OPEN"]))
        .where(RecruitmentJob.closing_date >= datetime.now(timezone.utc))
        .order_by(RecruitmentJob.posted_at.desc())
    )
    jobs = result.scalars().all()
    
    return [
        PublicJobOut(
            id=job.id,
            title=job.title,
            department_name=job.department.name if job.department else "Unknown",
            type=job.type,
            description=job.description,
            requirements=job.requirements,
            posted_at=job.posted_at,
            closing_date=job.closing_date,
        )
        for job in jobs
    ]

@router.get("/jobs/{job_id}", response_model=PublicJobOut)
async def get_public_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job_res = await db.execute(
        select(RecruitmentJob)
        .options(selectinload(RecruitmentJob.department))
        .where(RecruitmentJob.id == job_id, RecruitmentJob.status.in_(["open", "OPEN"]))
        .where(RecruitmentJob.closing_date >= datetime.now(timezone.utc))
    )
    job = job_res.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not open")
        
    return PublicJobOut(
        id=job.id,
        title=job.title,
        department_name=job.department.name if job.department else "Unknown",
        type=job.type,
        description=job.description,
        requirements=job.requirements,
        posted_at=job.posted_at,
        closing_date=job.closing_date,
    )

@router.post("/jobs/{job_id}/apply", response_model=PublicApplicantOut)
async def apply_for_job(
    job_id: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Verify job exists and is open
    job_res = await db.execute(
        select(RecruitmentJob)
        .where(RecruitmentJob.id == job_id, RecruitmentJob.status.in_(["open", "OPEN"]))
        .where(RecruitmentJob.closing_date >= datetime.now(timezone.utc))
    )
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not open")
        
    # Ensure static resumes directory exists
    resumes_dir = os.path.join("app", "static", "resumes")
    os.makedirs(resumes_dir, exist_ok=True)
    
    # Save resume file
    file_ext = ""
    if resume.filename:
        file_ext = os.path.splitext(resume.filename)[1]
    
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(resumes_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)
        
    resume_url = f"/static/resumes/{safe_filename}"
    
    # Create applicant
    new_applicant = RecruitmentApplicant(
        id=str(uuid.uuid4()),
        job_id=job_id,
        name=name,
        email=email,
        phone=phone,
        resume_url=resume_url,
        status="applied",
        notes=notes,
        applied_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db.add(new_applicant)
    await db.commit()
    await db.refresh(new_applicant)
    
    return PublicApplicantOut(
        id=new_applicant.id,
        job_id=new_applicant.job_id,
        name=new_applicant.name,
        email=new_applicant.email,
        status=new_applicant.status,
        applied_at=new_applicant.applied_at
    )
