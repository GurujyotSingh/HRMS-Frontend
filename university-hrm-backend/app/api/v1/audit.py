from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.services.audit_service import get_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    resource: Optional[str] = None
    resource_id: Optional[int] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get(
    "/logs",
    response_model=list[AuditLogRead],
    summary="HR/Admin: view audit logs",
    description=(
        "View all critical system actions. Filter by user, action, or resource.\n\n"
        "Actions: LOGIN, LOGOUT, LOGIN_FAILED, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, "
        "EMPLOYEE_DELETE, LEAVE_APPLY, LEAVE_APPROVE, LEAVE_REJECT, "
        "PAYROLL_GENERATE, PAYROLL_FINALIZE, ROLE_CHANGE"
    ),
)
async def get_logs(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action e.g. LOGIN"),
    resource: Optional[str] = Query(None, description="Filter by resource e.g. leave"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await get_audit_logs(db, user_id, action, resource, limit, offset)