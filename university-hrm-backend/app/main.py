from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions import register_exception_handlers
from app.core.rate_limit import register_rate_limiter

# Import all routers
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

#Create app
app = FastAPI(
    title="University HRM API",
    description="Human Resource Management System for Universities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Security: rate limiting + error handlers 
register_rate_limiter(app)
register_exception_handlers(app)

app.include_router(auth_router,         prefix="/api/v1")
app.include_router(employee_router,     prefix="/api/v1")
app.include_router(department_router,   prefix="/api/v1")
app.include_router(leave_router,        prefix="/api/v1")
app.include_router(leave_balance_router,prefix="/api/v1")
app.include_router(attendance_router,   prefix="/api/v1")
app.include_router(onboarding_router,   prefix="/api/v1")
app.include_router(payroll_router,      prefix="/api/v1")
app.include_router(performance_router,  prefix="/api/v1")
app.include_router(reports_router,      prefix="/api/v1")
app.include_router(ai_router,           prefix="/api/v1")
app.include_router(audit_router,        prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "University HRM API is running"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "1.0.0"}