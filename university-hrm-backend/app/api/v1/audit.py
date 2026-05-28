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
    id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


async def _fetch_logs(
    user_id: Optional[str],
    action: Optional[str],
    resource: Optional[str],
    limit: int,
    offset: int,
    db: AsyncSession,
    current_user: User,
):
    return await get_audit_logs(db, user_id, action, resource, limit, offset)


@router.get(
    "/",
    response_model=list[AuditLogRead],
    summary="HR/Admin: view audit logs (alias for /logs)",
)
@router.get(
    "/logs",
    response_model=list[AuditLogRead],
    summary="HR/Admin: view audit logs",
)
async def get_logs(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await get_audit_logs(db, user_id, action, resource, limit, offset)