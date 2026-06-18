"""
Recruitment API — DB-backed CRUD for `recruitment_jobs` and `recruitment_applicants`.
Phase 3 implementation.
"""
import uuid
import os
import json
from datetime import datetime, timezone
from typing import Optional, List
from groq import AsyncGroq

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.core.config import settings
from app.db.session import get_db
from app.db.models.recruitment import RecruitmentJob, RecruitmentApplicant, RecruitmentApplicantHistory
from app.db.models.user import User
from app.services.email_service import send_recruitment_stage_email
from app.services.ai_recruitment_service import analyze_candidate_resume, generate_interview_questions

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


class AIGenerateRequest(BaseModel):
    title: str
    department_name: str
    employment_type: str


class AIGenerateResponse(BaseModel):
    description: str
    requirements: List[str]


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
    send_email: Optional[bool] = True


class ApplicantHistoryOut(BaseModel):
    id: str
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    changed_at: datetime
    
    model_config = {"from_attributes": True}

class ApplicantOut(BaseModel):
    id: str
    job_id: str
    name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    ai_analysis: Optional[dict] = None
    applied_at: datetime
    updated_at: datetime
    history: Optional[list[ApplicantHistoryOut]] = None

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


@router.post("/jobs/generate-ai", response_model=AIGenerateResponse)
async def generate_ai_job_description(
    data: AIGenerateRequest,
    current_user: User = Depends(require_role("hr", "admin"))
):
    """Generate a job description using Groq AI."""
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server.")
        
    client = AsyncGroq(api_key=api_key)
    
    prompt = f"""
    You are an expert HR professional at a university. Write a job description and a list of requirements for the following role:
    Job Title: {data.title}
    Department: {data.department_name}
    Employment Type: {data.employment_type.replace('_', ' ').title()}
    
    Return the output STRICTLY as a JSON object with two keys:
    - "description": A string (2-3 paragraphs) outlining the role, responsibilities, and university context. Do NOT use markdown in this string, use plain text.
    - "requirements": A list of strings, each being a specific requirement or qualification (e.g. "PhD in Computer Science", "5+ years of teaching experience").
    """
    
    try:
        completion = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an API that strictly returns valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=1024
        )
        
        result_text = completion.choices[0].message.content.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        result_json = json.loads(result_text.strip())
        
        return AIGenerateResponse(
            description=result_json.get("description", "Generated description unavailable."),
            requirements=result_json.get("requirements", [])
        )
    except Exception as e:
        print(f"Groq API Error: {e}")
        error_msg = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            error_msg += f" | Response: {e.response.text}"
        raise HTTPException(status_code=500, detail=f"AI generation failed: {error_msg}")


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
        .options(selectinload(RecruitmentApplicant.history))
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
        status="APPLIED",  # enum fix
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
    """HR/Admin: Update applicant status or notes with strict forward-only rules."""
    result = await db.execute(
        select(RecruitmentApplicant)
        .options(selectinload(RecruitmentApplicant.job), selectinload(RecruitmentApplicant.history))
        .where(RecruitmentApplicant.id == applicant_id)
    )
    applicant = result.scalar_one_or_none()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    old_status = applicant.status or "APPLIED"
    new_status = data.status
    
    # ── Strict Pipeline Rules ──
    if new_status and new_status != old_status:
        valid_transitions = {
            "APPLIED": ["SCREENING", "REJECTED"],
            "SCREENING": ["INTERVIEW", "REJECTED"],
            "INTERVIEW": ["OFFERED", "REJECTED"],
            "OFFERED": ["HIRED", "REJECTED"],
            "HIRED": [],
            "REJECTED": []
        }
        
        allowed_next = valid_transitions.get(old_status.upper(), [])
        if new_status.upper() not in allowed_next:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid stage transition. Cannot move from {old_status} to {new_status}. Please use the 'Reopen Application' action if you must reset this candidate."
            )
            
    update_data = data.model_dump(exclude_unset=True)
    send_email = update_data.pop("send_email", True)
    
    for field, value in update_data.items():
        setattr(applicant, field, value)
        
    applicant.updated_at = datetime.now(timezone.utc)
    
    # ── Log History ──
    if new_status and new_status != old_status:
        history_record = RecruitmentApplicantHistory(
            id=str(uuid.uuid4()),
            applicant_id=applicant.id,
            action="STATUS_CHANGE",
            previous_status=old_status,
            new_status=new_status,
            notes=data.notes,
            changed_by_id=current_user.id,
            changed_at=datetime.now(timezone.utc)
        )
        db.add(history_record)
    
    await db.commit()
    await db.refresh(applicant)
    
    if send_email and new_status and new_status != old_status:
        import asyncio
        asyncio.create_task(send_recruitment_stage_email(
            candidate_email=applicant.email,
            candidate_name=applicant.name,
            job_title=applicant.job.title if applicant.job else "University Role",
            new_status=new_status,
            hr_notes=data.notes if data.notes else None
        ))
        
    return applicant


@router.post("/applicants/{applicant_id}/reopen", response_model=ApplicantOut)
async def reopen_applicant(
    applicant_id: str,
    reason: str = Query(..., description="Reason for reopening the application"),
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """HR Override: Reopen an application, resetting it to APPLIED."""
    result = await db.execute(
        select(RecruitmentApplicant)
        .options(selectinload(RecruitmentApplicant.history))
        .where(RecruitmentApplicant.id == applicant_id)
    )
    applicant = result.scalar_one_or_none()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    old_status = applicant.status
    applicant.status = "APPLIED"
    applicant.updated_at = datetime.now(timezone.utc)
    
    history_record = RecruitmentApplicantHistory(
        id=str(uuid.uuid4()),
        applicant_id=applicant.id,
        action="REOPENED",
        previous_status=old_status,
        new_status="APPLIED",
        notes=f"Reopened by HR override. Reason: {reason}",
        changed_by_id=current_user.id,
        changed_at=datetime.now(timezone.utc)
    )
    db.add(history_record)
    
    await db.commit()
    await db.refresh(applicant)
    return applicant


@router.post("/applicants/{applicant_id}/analyze", response_model=ApplicantOut)
async def analyze_applicant_resume(
    applicant_id: str,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """HR Action: Trigger AI analysis on the applicant's resume."""
    result = await db.execute(
        select(RecruitmentApplicant)
        .options(selectinload(RecruitmentApplicant.job), selectinload(RecruitmentApplicant.history))
        .where(RecruitmentApplicant.id == applicant_id)
    )
    applicant = result.scalar_one_or_none()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    if not applicant.resume_url:
        raise HTTPException(status_code=400, detail="Applicant has no resume to analyze")
        
    if not applicant.job:
        raise HTTPException(status_code=400, detail="Applicant job posting not found")
        
    try:
        analysis_result = await analyze_candidate_resume(
            resume_url=applicant.resume_url,
            job_title=applicant.job.title,
            job_description=applicant.job.description,
            job_requirements=applicant.job.requirements
        )
        
        applicant.ai_analysis = analysis_result
        applicant.updated_at = datetime.now(timezone.utc)
        
        history_record = RecruitmentApplicantHistory(
            id=str(uuid.uuid4()),
            applicant_id=applicant.id,
            action="AI_ANALYSIS",
            notes=f"AI Match Score: {analysis_result.get('match_score', 'N/A')}%",
            changed_by_id=current_user.id,
            changed_at=datetime.now(timezone.utc)
        )
        db.add(history_record)
        
        await db.commit()
        await db.refresh(applicant)
        return applicant
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during analysis: {str(e)}")


@router.post("/applicants/{applicant_id}/interview-questions")
async def get_interview_questions(
    applicant_id: str,
    current_user: User = Depends(require_role("hr", "admin")),
    db: AsyncSession = Depends(get_db)
):
    """HR Action: Generate custom interview questions for the applicant based on their resume."""
    result = await db.execute(
        select(RecruitmentApplicant)
        .options(selectinload(RecruitmentApplicant.job))
        .where(RecruitmentApplicant.id == applicant_id)
    )
    applicant = result.scalar_one_or_none()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    if not applicant.resume_url:
        raise HTTPException(status_code=400, detail="Applicant has no resume.")
        
    try:
        questions = await generate_interview_questions(
            resume_url=applicant.resume_url,
            job_title=applicant.job.title,
            job_description=applicant.job.description
        )
        return {"questions": questions}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
