from typing import Optional, Any
from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, computed_field

from app.api.deps import require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.services.audit_service import get_audit_logs, get_audit_analytics, get_severity

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
    
    @computed_field
    def severity(self) -> str:
        return get_severity(self.action)

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
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await get_audit_logs(db, user_id, action, resource, from_date, to_date, search, limit, offset)


@router.get(
    "/analytics",
    summary="HR/Admin: get audit analytics",
)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    data = await get_audit_analytics(db)
    
    # Serialize AuditLog objects in recent_criticals to AuditLogRead dicts
    serialized_recent = []
    for log in data.get("recent_criticals", []):
        serialized_recent.append(AuditLogRead.model_validate(log).model_dump())
        
    data["recent_criticals"] = serialized_recent
    return data