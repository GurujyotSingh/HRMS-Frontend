"""
Audit Log Service
-----------------
Call audit() anywhere in your routes/services to log critical actions.

Usage:
    from app.services.audit_service import audit

    await audit(
        db=db,
        action="LEAVE_APPROVE",
        resource="leave",
        resource_id=leave_id,
        user_id=current_user.id,
        user_email=current_user.email,
        detail=f"Leave ID {leave_id} approved by HR",
        request=request,   # optional, extracts IP
    )
"""

import json
from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import Request
from sqlalchemy import select, desc, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.audit_log import AuditLog


# ── Action constants ──────────────────────────────────────────────────────────
class AuditAction:
    # Auth
    LOGIN          = "LOGIN"
    LOGOUT         = "LOGOUT"
    LOGIN_FAILED   = "LOGIN_FAILED"

    # Employee
    EMPLOYEE_CREATE = "EMPLOYEE_CREATE"
    EMPLOYEE_UPDATE = "EMPLOYEE_UPDATE"
    EMPLOYEE_DELETE = "EMPLOYEE_DELETE"

    # Leave
    LEAVE_APPLY    = "LEAVE_APPLY"
    LEAVE_APPROVE  = "LEAVE_APPROVE"
    LEAVE_REJECT   = "LEAVE_REJECT"
    LEAVE_CANCEL   = "LEAVE_CANCEL"

    # Payroll
    PAYROLL_GENERATE  = "PAYROLL_GENERATE"
    PAYROLL_FINALIZE  = "PAYROLL_FINALIZE"

    # Role
    ROLE_CHANGE    = "ROLE_CHANGE"

    # Onboarding/Offboarding
    OFFBOARDING_INITIATE = "OFFBOARDING_INITIATE"


def _get_ip(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def audit(
    db: AsyncSession,
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    detail: Optional[str] = None,
    status: str = "success",
    request: Optional[Request] = None,
) -> AuditLog:
    """Write one audit log entry."""
    import uuid as _uuid
    log = AuditLog(
        id=str(_uuid.uuid4()),
        user_id=str(user_id) if user_id else None,
        user_email=user_email,
        action=action,
        resource=resource,
        resource_id=str(resource_id) if resource_id else None,
        detail=detail,
        ip_address=_get_ip(request),
        status=status,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


def get_severity(action: str) -> str:
    act = action.upper()
    if "DELETE" in act or "ROLE" in act or "CRITICAL" in act or "PAYROLL" in act:
        return "CRITICAL"
    if "REJECT" in act or "FAIL" in act or "REOPEN" in act or "CANCEL" in act:
        return "WARNING"
    return "INFO"


# ── Read audit logs (HR/Admin only) ──────────────────────────────────────────

async def get_audit_logs(
    db: AsyncSession,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[AuditLog]:
    query = select(AuditLog).order_by(desc(AuditLog.created_at))

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
    if resource:
        query = query.where(AuditLog.resource == resource)
    if from_date:
        query = query.where(AuditLog.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.where(AuditLog.created_at <= datetime.combine(to_date, datetime.max.time()))
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                AuditLog.user_email.ilike(search_term),
                AuditLog.action.ilike(search_term),
                AuditLog.resource.ilike(search_term),
                AuditLog.detail.ilike(search_term),
                AuditLog.user_id.ilike(search_term)
            )
        )

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_audit_analytics(db: AsyncSession) -> dict:
    # Basic KPI counts
    total_events = await db.scalar(select(func.count(AuditLog.id)))
    success_logins = await db.scalar(select(func.count(AuditLog.id)).where(AuditLog.action == AuditAction.LOGIN))
    
    # We fetch the last 1000 logs to compute distributions so we don't stress the DB with complex groupby
    result = await db.execute(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(1000))
    logs = result.scalars().all()
    
    warnings = 0
    criticals = 0
    action_dist = {}
    severity_dist = {"INFO": 0, "WARNING": 0, "CRITICAL": 0}
    recent_criticals = []
    
    # Activity Trend (last 7 days)
    today = datetime.utcnow().date()
    activity_trend = {(today - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)}
    
    for log in logs:
        sev = get_severity(log.action)
        severity_dist[sev] += 1
        
        if sev == "WARNING":
            warnings += 1
        elif sev == "CRITICAL":
            criticals += 1
            if len(recent_criticals) < 10:
                recent_criticals.append(log)
                
        action_dist[log.action] = action_dist.get(log.action, 0) + 1
        
        log_date = log.created_at.date().isoformat()
        if log_date in activity_trend:
            activity_trend[log_date] += 1

    return {
        "kpi": {
            "total_events": total_events or 0,
            "success_logins": success_logins or 0,
            "warnings": warnings,
            "criticals": criticals
        },
        "action_distribution": action_dist,
        "severity_distribution": severity_dist,
        "activity_trend": activity_trend,
        "recent_criticals": recent_criticals
    }