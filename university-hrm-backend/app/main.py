from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.exceptions import register_exception_handlers
from app.core.rate_limit import register_rate_limiter

# ── Import all routers ────────────────────────────────────────────────────────
from app.api.v1.auth import router as auth_router
from app.api.v1.employees import router as employee_router
from app.api.v1.departments import router as department_router
from app.api.v1.leaves import router as leave_router
from app.api.v1.leave_balance import router as leave_balance_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.payroll import router as payroll_router
from app.api.v1.performance import router as performance_router
from app.api.v1.reports import router as reports_router
from app.api.v1.ai import router as ai_router
from app.api.v1.audit import router as audit_router

# Phase 1 fixes — routers that were missing
from app.api.v1.announcements import router as announcements_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.holidays import router as holidays_router
from app.api.v1.settings import router as settings_router
from app.api.v1.dashboard import router as dashboard_router

# Phase 3 — Recruitment
from app.api.v1.recruitment import router as recruitment_router
from app.api.v1.public_careers import router as public_careers_router

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="University HRM API",
    description="Human Resource Management System for Universities",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow specific origins for credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://localhost:8000"],
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security: rate limiting + error handlers
register_rate_limiter(app)
register_exception_handlers(app)

# ── Register all routers under /api/v1 ───────────────────────────────────────
app.include_router(auth_router,           prefix="/api/v1")
app.include_router(employee_router,       prefix="/api/v1")
app.include_router(department_router,     prefix="/api/v1")
app.include_router(leave_router,          prefix="/api/v1")
app.include_router(leave_balance_router,  prefix="/api/v1")
app.include_router(attendance_router,     prefix="/api/v1")
app.include_router(onboarding_router,     prefix="/api/v1")
app.include_router(payroll_router,        prefix="/api/v1")
app.include_router(performance_router,    prefix="/api/v1")
app.include_router(reports_router,        prefix="/api/v1")
app.include_router(ai_router,             prefix="/api/v1")
app.include_router(audit_router,          prefix="/api/v1")

# Phase 1 — previously missing routers
app.include_router(announcements_router,  prefix="/api/v1")
app.include_router(notifications_router,  prefix="/api/v1")
app.include_router(holidays_router,       prefix="/api/v1")
app.include_router(settings_router,       prefix="/api/v1")
app.include_router(dashboard_router,      prefix="/api/v1")

# Phase 3 — Recruitment
app.include_router(recruitment_router,    prefix="/api/v1")
app.include_router(public_careers_router, prefix="/api/v1")

import os
# Ensure static directory exists
os.makedirs("app/static/payslips", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "University HRM API is running", "version": "2.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "2.0.0"}