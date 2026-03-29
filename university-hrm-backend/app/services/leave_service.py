from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.leave import Leave
from app.db.models.leave_balance import LeaveBalance
from app.db.models.employee import Employee
from app.db.models.enums import LeaveStatus, LeaveType
from app.db.models.role import RoleEnum
from app.schemas.leave import LeaveCreate
from app.services.leave_balance_service import check_balance, deduct_balance


def _count_days(start: date, end: date) -> int:
    return (end - start).days + 1


async def _fetch_leave_with_relations(db: AsyncSession, leave_id: int) -> Leave:
    result = await db.execute(
        select(Leave)
        .options(
            selectinload(Leave.employee),
            selectinload(Leave.hod_approver),
            selectinload(Leave.hr_approver),
        )
        .where(Leave.id == leave_id)
    )
    return result.scalar_one()


# ── Employee actions ──────────────────────────────────────────────────────────

async def apply_leave(db: AsyncSession, employee: Employee, leave_in: LeaveCreate) -> Leave:
    """
    Employee applies for leave.
    - Checks balance first (except UNPAID).
    - If the employee is a HOD, skips HOD step → goes straight to HR (status stays PENDING,
      but HOD approval is not required — HR sees it in their queue directly).
    """
    days = _count_days(leave_in.start_date, leave_in.end_date)

    # Balance check (raises ValueError if insufficient)
    await check_balance(db, employee.id, leave_in.leave_type, days)

    leave = Leave(
        employee_id=employee.id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        reason=leave_in.reason,
        status=LeaveStatus.PENDING,
    )
    db.add(leave)
    await db.commit()
    return await _fetch_leave_with_relations(db, leave.id)


async def cancel_leave(db: AsyncSession, leave_id: int, employee_id: int) -> Leave:
    """Employee cancels their own leave — only if still PENDING."""
    result = await db.execute(select(Leave).where(Leave.id == leave_id))
    leave = result.scalar_one_or_none()

    if not leave or leave.employee_id != employee_id:
        raise ValueError("Leave not found")
    if leave.status not in (LeaveStatus.PENDING,):
        raise ValueError(f"Cannot cancel leave with status '{leave.status}'. Only PENDING leaves can be cancelled.")

    leave.status = LeaveStatus.CANCELLED
    await db.commit()
    return await _fetch_leave_with_relations(db, leave.id)


async def get_own_leaves(db: AsyncSession, employee_id: int) -> list[Leave]:
    result = await db.execute(
        select(Leave)
        .options(selectinload(Leave.hod_approver), selectinload(Leave.hr_approver))
        .where(Leave.employee_id == employee_id)
        .order_by(Leave.id.desc())
    )
    return result.scalars().all()


# ── HOD actions ───────────────────────────────────────────────────────────────

async def get_pending_leaves_for_hod(db: AsyncSession, department_id: int, hod_employee_id: int) -> list[Leave]:
    """
    HOD sees PENDING leaves from their department,
    excluding their own leaves (those go straight to HR).
    """
    result = await db.execute(
        select(Leave)
        .join(Employee, Leave.employee_id == Employee.id)
        .options(selectinload(Leave.employee))
        .where(
            Employee.department_id == department_id,
            Leave.status == LeaveStatus.PENDING,
            Leave.employee_id != hod_employee_id,   # exclude HOD's own
        )
        .order_by(Leave.id.desc())
    )
    return result.scalars().all()


async def approve_by_hod(db: AsyncSession, leave_id: int, hod_user_id: int, department_id: int, hod_employee_id: int) -> Leave:
    result = await db.execute(
        select(Leave)
        .join(Employee, Leave.employee_id == Employee.id)
        .where(
            Leave.id == leave_id,
            Employee.department_id == department_id,
            Leave.employee_id != hod_employee_id,   # HOD cannot approve own leave
        )
    )
    leave = result.scalar_one_or_none()

    if not leave:
        raise ValueError("Leave not found, not in your department, or you cannot approve your own leave")
    if leave.status != LeaveStatus.PENDING:
        raise ValueError(f"Leave is already '{leave.status}'")

    leave.status = LeaveStatus.APPROVED_BY_HOD
    leave.approved_by_hod_id = hod_user_id
    await db.commit()
    return await _fetch_leave_with_relations(db, leave.id)


async def reject_by_hod(db: AsyncSession, leave_id: int, hod_user_id: int, department_id: int, hod_employee_id: int) -> Leave:
    result = await db.execute(
        select(Leave)
        .join(Employee, Leave.employee_id == Employee.id)
        .where(
            Leave.id == leave_id,
            Employee.department_id == department_id,
            Leave.employee_id != hod_employee_id,
        )
    )
    leave = result.scalar_one_or_none()

    if not leave:
        raise ValueError("Leave not found, not in your department, or you cannot reject your own leave")
    if leave.status != LeaveStatus.PENDING:
        raise ValueError(f"Leave is already '{leave.status}'")

    leave.status = LeaveStatus.REJECTED
    leave.approved_by_hod_id = hod_user_id  # tracks who acted
    await db.commit()
    return await _fetch_leave_with_relations(db, leave.id)


# ── HR actions ────────────────────────────────────────────────────────────────

async def get_all_leaves_for_hr(db: AsyncSession) -> list[Leave]:
    """HR sees ALL leaves across all departments."""
    result = await db.execute(
        select(Leave)
        .options(
            selectinload(Leave.employee),
            selectinload(Leave.hod_approver),
            selectinload(Leave.hr_approver),
        )
        .order_by(Leave.id.desc())
    )
    return result.scalars().all()


async def get_hr_action_queue(db: AsyncSession) -> list[Leave]:
    """
    HR's action queue:
    - PENDING leaves from HODs (who bypass the HOD step)
    - APPROVED_BY_HOD leaves waiting for HR final decision
    """
    result = await db.execute(
        select(Leave)
        .join(Employee, Leave.employee_id == Employee.id)
        .options(selectinload(Leave.employee), selectinload(Leave.hod_approver))
        .where(
            Leave.status.in_([LeaveStatus.APPROVED_BY_HOD])
            # Note: HOD's own pending leaves are also shown here via the /hr/all endpoint
            # Separating them requires knowing who is a HOD — handled in route layer
        )
        .order_by(Leave.id.desc())
    )
    return result.scalars().all()


async def process_by_hr(db: AsyncSession, leave_id: int, hr_user_id: int, action: str) -> Leave:
    """
    HR final decision.
    - approve: requires APPROVED_BY_HOD status (or PENDING if applicant was a HOD)
    - reject:  works from PENDING or APPROVED_BY_HOD
    On APPROVED: balance is deducted automatically.
    """
    result = await db.execute(
        select(Leave)
        .options(selectinload(Leave.employee))
        .where(Leave.id == leave_id)
    )
    leave = result.scalar_one_or_none()

    if not leave:
        raise ValueError("Leave not found")

    if action == "approve":
        # HOD's own leave comes in as PENDING (bypassed HOD step)
        # Regular employee leave must be APPROVED_BY_HOD first
        if leave.status not in (LeaveStatus.PENDING, LeaveStatus.APPROVED_BY_HOD):
            raise ValueError(f"Cannot approve leave with status '{leave.status}'")

        days = _count_days(leave.start_date, leave.end_date)
        await deduct_balance(db, leave.employee_id, leave.leave_type, days)

        leave.status = LeaveStatus.APPROVED
        leave.approved_by_hr_id = hr_user_id

    elif action == "reject":
        if leave.status not in (LeaveStatus.PENDING, LeaveStatus.APPROVED_BY_HOD):
            raise ValueError(f"Cannot reject leave with status '{leave.status}'")

        leave.status = LeaveStatus.REJECTED
        leave.approved_by_hr_id = hr_user_id

    else:
        raise ValueError("action must be 'approve' or 'reject'")

    await db.commit()
    return await _fetch_leave_with_relations(db, leave.id)

async def get_pending_leaves_for_admin(db: AsyncSession) -> list[Leave]:
    """Admin sees pending leaves from HR users only."""
    result = await db.execute(
        select(Leave)
        .join(Employee, Leave.employee_id == Employee.id)
        .join(User, Employee.user_id == User.id)
        .join(Role, User.role_id == Role.id)
        .options(selectinload(Leave.employee))
        .where(
            Role.name == RoleEnum.HR,
            Leave.status == LeaveStatus.PENDING,
        )
        .order_by(Leave.id.desc())
    )
    return result.scalars().all()


async def process_by_admin(db, leave_id, admin_user_id, action):
    result = await db.execute(select(Leave).where(Leave.id == leave_id))
    leave = result.scalar_one_or_none()

    if not leave:
        raise ValueError("Leave not found")
    if leave.status != LeaveStatus.PENDING:
        raise ValueError(f"Cannot process leave with status '{leave.status}'")

    if action == "approve":
        days = _count_days(leave.start_date, leave.end_date)
        await deduct_balance(db, leave.employee_id, leave.leave_type, days)
        leave.status = LeaveStatus.APPROVED
        leave.approved_by_hr_id = admin_user_id  # reuse field to track who approved

    elif action == "reject":
        leave.status = LeaveStatus.REJECTED
        leave.approved_by_hr_id = admin_user_id

    await db.commit()
    return await _fetch_leave_with_relations(db, leave.id)