from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.leave_balance import LeaveBalance
from app.db.models.leave_policy import LeavePolicy
from app.db.models.enums import LeaveType


async def seed_balances_for_employee(db: AsyncSession, employee_id: int, role_name: str) -> list[LeaveBalance]:
    """
    Called automatically when a new employee is created.
    Creates one LeaveBalance row per leave type, seeded from LeavePolicy defaults.
    UNPAID leave is always unlimited (total_days = 9999).
    """
    balances = []

    for leave_type in LeaveType:
        if leave_type == LeaveType.UNPAID:
            # Unpaid is always unlimited — no policy lookup needed
            balance = LeaveBalance(
                employee_id=employee_id,
                leave_type=leave_type,
                total_days=9999,
                used_days=0,
            )
        else:
            result = await db.execute(
                select(LeavePolicy).where(
                    LeavePolicy.role_name == role_name,
                    LeavePolicy.leave_type == leave_type,
                )
            )
            policy = result.scalar_one_or_none()
            total = policy.default_days if policy else 0

            balance = LeaveBalance(
                employee_id=employee_id,
                leave_type=leave_type,
                total_days=total,
                used_days=0,
            )

        db.add(balance)
        balances.append(balance)

    await db.commit()
    return balances


async def get_balances_for_employee(db: AsyncSession, employee_id: int) -> list[LeaveBalance]:
    result = await db.execute(
        select(LeaveBalance).where(LeaveBalance.employee_id == employee_id)
    )
    return result.scalars().all()


async def get_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType) -> LeaveBalance | None:
    result = await db.execute(
        select(LeaveBalance).where(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type == leave_type,
        )
    )
    return result.scalar_one_or_none()


async def check_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType, requested_days: int) -> None:
    """Raises ValueError if employee doesn't have enough balance."""
    if leave_type == LeaveType.UNPAID:
        return   # Unpaid leave always allowed

    balance = await get_balance(db, employee_id, leave_type)
    if not balance:
        raise ValueError(f"No leave balance record found for {leave_type.value} leave")
    if balance.remaining_days < requested_days:
        raise ValueError(
            f"Insufficient {leave_type.value} leave balance. "
            f"Requested: {requested_days} days, Available: {balance.remaining_days} days"
        )


async def deduct_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType, days: int) -> LeaveBalance:
    """Called when HR gives final APPROVED status."""
    if leave_type == LeaveType.UNPAID:
        balance = await get_balance(db, employee_id, leave_type)
        return balance  # No deduction for unpaid

    balance = await get_balance(db, employee_id, leave_type)
    if not balance:
        raise ValueError("Leave balance record not found")

    balance.used_days += days
    await db.commit()
    await db.refresh(balance)
    return balance


async def restore_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType, days: int) -> None:
    """
    Called if an APPROVED leave is later cancelled (edge case safety).
    Not exposed in routes currently but available for future use.
    """
    if leave_type == LeaveType.UNPAID:
        return

    balance = await get_balance(db, employee_id, leave_type)
    if balance:
        balance.used_days = max(balance.used_days - days, 0)
        await db.commit()


# ── HR: manage policies ───────────────────────────────────────────────────────

async def get_all_policies(db: AsyncSession) -> list[LeavePolicy]:
    result = await db.execute(select(LeavePolicy))
    return result.scalars().all()


async def upsert_policy(db: AsyncSession, role_name: str, leave_type: LeaveType, default_days: int) -> LeavePolicy:
    """Create or update a policy row."""
    result = await db.execute(
        select(LeavePolicy).where(
            LeavePolicy.role_name == role_name,
            LeavePolicy.leave_type == leave_type,
        )
    )
    policy = result.scalar_one_or_none()
    if policy:
        policy.default_days = default_days
    else:
        policy = LeavePolicy(role_name=role_name, leave_type=leave_type, default_days=default_days)
        db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


async def hr_override_employee_balance(
    db: AsyncSession, employee_id: int, leave_type: LeaveType, total_days: int
) -> LeaveBalance:
    """HR manually sets a specific employee's quota."""
    balance = await get_balance(db, employee_id, leave_type)
    if not balance:
        raise ValueError(f"No balance record found for employee {employee_id}, type {leave_type.value}")
    balance.total_days = total_days
    await db.commit()
    await db.refresh(balance)
    return balance