from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.leave_policy import LeavePolicy
from app.db.models.enums import LeaveType
# LeaveBalance model is mocked/removed



async def seed_balances_for_employee(db: AsyncSession, employee_id: int, role_name: str) -> list:
    """Mocked: No LeaveBalance model exists."""
    return []

async def get_balances_for_employee(db: AsyncSession, employee_id: int) -> list:
    return []

async def get_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType):
    return None


async def check_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType, requested_days: int) -> None:
    """Mocked check_balance."""
    pass

async def deduct_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType, days: int):
    """Mocked deduct_balance."""
    pass

async def restore_balance(db: AsyncSession, employee_id: int, leave_type: LeaveType, days: int) -> None:
    """Mocked restore_balance."""
    pass


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
):
    """Mocked override."""
    pass