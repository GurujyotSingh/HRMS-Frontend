from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessageRead(BaseModel):
    id: int
    role: str
    content: str
    agent: Optional[str] = None
    llm_used: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionRead(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    status: str
    created_at: datetime
    messages: list[ChatMessageRead] = []

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None   # if None, new session is created
    confirm: bool = False               # set True when confirming a destructive action


class ChatResponse(BaseModel):
    response: str
    session_id: int
    requires_confirmation: bool = False
    pending_action: Optional[dict] = None
    llm_used: str


# ── Autonomous agents ─────────────────────────────────────────────────────────

class PayslipExplainRequest(BaseModel):
    employee_id: int
    month: int
    year: int


class LeaveRecommendRequest(BaseModel):
    start_date: str   # "2026-04-01"
    end_date: str     # "2026-04-05"


class GoalSuggestRequest(BaseModel):
    goals_text: str


class AttendanceAnomalyRequest(BaseModel):
    employee_id: int
    months: int = 3   # how many months back to analyze


class OnboardingQuestionRequest(BaseModel):
    question: str


class ReportSummaryRequest(BaseModel):
    report_type: str   # "attendance" | "payroll" | "leave" | "onboarding"
    month: Optional[int] = None
    year: Optional[int] = None


class AgentResponse(BaseModel):
    result: str
    llm_used: str