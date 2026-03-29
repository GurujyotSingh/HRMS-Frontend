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
from datetime import datetime
from typing import Optional
from fastapi import Request
from sqlalchemy import select, desc
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
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    resource: Optional[str] = None,
    resource_id: Optional[int] = None,
    detail: Optional[str] = None,
    status: str = "success",
    request: Optional[Request] = None,
) -> AuditLog:
    """Write one audit log entry."""
    log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource=resource,
        resource_id=resource_id,
        detail=detail,
        ip_address=_get_ip(request),
        status=status,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


# ── Read audit logs (HR/Admin only) ──────────────────────────────────────────

async def get_audit_logs(
    db: AsyncSession,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
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

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()