from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, extract
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.db.models.chat import ChatSession, ChatMessage
from app.schemas.ai import (
    ChatRequest, ChatResponse, ChatSessionRead,
    PayslipExplainRequest, LeaveRecommendRequest,
    GoalSuggestRequest, AttendanceAnomalyRequest,
    OnboardingQuestionRequest, ReportSummaryRequest, AgentResponse,
)
from app.services.ai.hr_agent import run_hr_agent
from app.services.ai.agents import (
    explain_payslip, recommend_leave_dates, suggest_smart_goals,
    detect_attendance_anomalies, onboarding_assistant, summarize_hr_report,
)

router = APIRouter(prefix="/ai", tags=["AI Agents"])


# ── Shared helper — loads employee with ALL needed relationships ──────────────

async def _get_employee_full(db: AsyncSession, user_id: int):
    from app.db.models.employee import Employee
    from app.db.models.department import Department
    result = await db.execute(
        select(Employee)
        .options(
            selectinload(Employee.department),
            selectinload(Employee.user),
        )
        .where(Employee.user_id == user_id)
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


# ═══════════════════════════════════════════════════════════════════════════════
# HR COMMAND CHATBOT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="HR Command Chatbot",
    description=(
        "Natural language interface. Examples:\n"
        "- 'Show me all pending leaves'\n"
        "- 'How many employees are in the CS department?'\n"
        "- 'Approve leave ID 5' (will ask confirmation)\n"
        "- 'What is the payroll cost for March 2026?'\n\n"
        "Set `confirm: true` to confirm destructive actions."
    ),
)
async def hr_chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        result = await run_hr_agent(
            db=db,
            user_message=body.message,
            hr_user_id=current_user.id,
            session_id=body.session_id,
            confirm=body.confirm,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/sessions", response_model=list[ChatSessionRead])
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/chat/sessions/{session_id}", response_model=ChatSessionRead)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/chat/sessions/{session_id}", response_model=dict)
async def close_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "closed"
    await db.commit()
    return {"msg": "Session closed"}


# ═══════════════════════════════════════════════════════════════════════════════
# AUTONOMOUS AGENTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/explain-payslip", response_model=AgentResponse, summary="AI explains a payslip in plain language")
async def explain_my_payslip(
    body: PayslipExplainRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.db.models.payroll import Payslip

    employee = await _get_employee_full(db, current_user.id)

    # Role is already loaded by deps.py
    is_hr = current_user.role.name == RoleEnum.HR
    if not is_hr and employee.id != body.employee_id:
        raise HTTPException(status_code=403, detail="You can only view your own payslip")

    result = await db.execute(
        select(Payslip).where(
            Payslip.employee_id == body.employee_id,
            Payslip.month == body.month,
            Payslip.year == body.year,
            Payslip.status == "finalized",
        )
    )
    payslip = result.scalar_one_or_none()
    if not payslip:
        raise HTTPException(status_code=404, detail="Finalized payslip not found")

    payslip_dict = {
        "month": payslip.month, "year": payslip.year,
        "days_present": payslip.days_present, "days_absent": payslip.days_absent,
        "gross_salary": float(payslip.gross_salary),
        "absent_deduction": float(payslip.absent_deduction),
        "pf_deduction": float(payslip.pf_deduction),
        "professional_tax": float(payslip.professional_tax),
        "tds_deduction": float(payslip.tds_deduction),
        "total_deductions": float(payslip.total_deductions),
        "net_pay": float(payslip.net_pay),
    }
    explanation = await explain_payslip(payslip_dict, f"{employee.first_name} {employee.last_name}")
    return AgentResponse(result=explanation, llm_used="claude")


@router.post("/recommend-leave", response_model=AgentResponse, summary="AI checks if leave dates are optimal")
async def recommend_leave(
    body: LeaveRecommendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.db.models.leave import Leave
    from app.db.models.leave_balance import LeaveBalance

    employee = await _get_employee_full(db, current_user.id)

    bal_result = await db.execute(
        select(LeaveBalance).where(LeaveBalance.employee_id == employee.id)
    )
    balances = {
        str(b.leave_type): {
            "total": b.total_days,
            "used": b.used_days,
            "remaining": b.remaining_days,
        }
        for b in bal_result.scalars().all()
    }

    team_result = await db.execute(
        select(Leave).where(
            Leave.start_date <= body.end_date,
            Leave.end_date >= body.start_date,
        )
    )
    team_leaves = [
        {
            "employee_id": l.employee_id,
            "type": str(l.leave_type),
            "start": str(l.start_date),
            "end": str(l.end_date),
        }
        for l in team_result.scalars().all()
        if l.employee_id != employee.id
    ]

    recommendation = await recommend_leave_dates(
        f"{employee.first_name} {employee.last_name}",
        body.start_date, body.end_date, balances, team_leaves,
    )
    return AgentResponse(result=recommendation, llm_used="claude")


@router.post("/suggest-goals", response_model=AgentResponse, summary="AI improves your performance goals")
async def suggest_goals(
    body: GoalSuggestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _get_employee_full(db, current_user.id)

    # role is loaded by deps.py selectinload
    role = current_user.role.name.value if current_user.role else "Employee"
    # department is loaded by _get_employee_full
    dept = employee.department.name if employee.department else "General"

    suggestion = await suggest_smart_goals(
        f"{employee.first_name} {employee.last_name}", role, dept, body.goals_text
    )
    return AgentResponse(result=suggestion, llm_used="claude")


@router.post("/attendance-anomaly/{employee_id}", response_model=AgentResponse, summary="HR: detect attendance anomalies")
async def attendance_anomaly(
    employee_id: int,
    months: int = Query(default=3, ge=1, le=6),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    from app.db.models.attendance import Attendance

    result = await db.execute(
        select(Attendance)
        .where(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .limit(months * 26)
    )
    records = result.scalars().all()
    records_data = [
        {
            "date": str(r.date),
            "clock_in": str(r.clock_in),
            "clock_out": str(r.clock_out),
            "is_late": r.is_late,
            "total_hours": float(r.total_hours or 0),
            "auto_clocked": r.is_auto_clocked_out,
        }
        for r in records
    ]
    analysis = await detect_attendance_anomalies(f"Employee {employee_id}", records_data)
    return AgentResponse(result=analysis, llm_used="claude")


@router.post("/onboarding-help", response_model=AgentResponse, summary="Employee: ask AI about onboarding tasks")
async def onboarding_help(
    body: OnboardingQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.db.models.onboarding import OnboardingRecord, OnboardingTask

    employee = await _get_employee_full(db, current_user.id)

    result = await db.execute(
        select(OnboardingRecord)
        .options(selectinload(OnboardingRecord.tasks))
        .where(OnboardingRecord.employee_id == employee.id)
    )
    record = result.scalar_one_or_none()
    pending_tasks = []
    if record:
        pending_tasks = [
            {"title": t.title, "description": t.description or ""}
            for t in record.tasks
            if not t.is_completed
        ]

    role = current_user.role.name.value if current_user.role else "Employee"
    answer = await onboarding_assistant(
        f"{employee.first_name} {employee.last_name}", role, pending_tasks, body.question
    )
    return AgentResponse(result=answer, llm_used="claude")


@router.post("/summarize-report", response_model=AgentResponse, summary="HR: AI summary of any report")
async def summarize_report(
    body: ReportSummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    month = body.month or datetime.now().month
    year = body.year or datetime.now().year

    if body.report_type == "payroll":
        from app.services.reports_service import payroll_cost_report
        data = await payroll_cost_report(db, month, year)
        report_dict = data.model_dump()
    elif body.report_type == "attendance":
        from app.services.reports_service import attendance_summary
        records = await attendance_summary(db, month, year)
        report_dict = {"month": month, "year": year, "employees": [r.model_dump() for r in records]}
    elif body.report_type == "leave":
        from app.services.reports_service import leave_stats
        data = await leave_stats(db)
        report_dict = data.model_dump()
    elif body.report_type == "onboarding":
        from app.services.reports_service import onboarding_report
        data = await onboarding_report(db)
        report_dict = data.model_dump()
    else:
        raise HTTPException(status_code=400, detail="report_type must be: payroll, attendance, leave, onboarding")

    summary = await summarize_hr_report(body.report_type, report_dict)
    return AgentResponse(result=summary, llm_used="claude")


# ── Debug endpoint (remove after testing) ─────────────────────────────────────

@router.get("/debug-key", summary="Debug: verify API key is loaded", include_in_schema=False)
async def debug_key(current_user: User = Depends(require_role(RoleEnum.HR))):
    from app.core.config import settings
    key = settings.ANTHROPIC_API_KEY
    return {
        "key_length": len(key),
        "key_preview": key[:15] + "..." if key else "EMPTY",
        "starts_correctly": key.startswith("sk-ant-"),
    }