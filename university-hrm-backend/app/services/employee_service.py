from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models.department import Department
from app.db.models.employee import Employee
from app.db.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


async def get_employee_by_id(db: AsyncSession, employee_id: int):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    return result.scalar_one_or_none()


async def get_employees(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Employee).offset(skip).limit(limit))
    return result.scalars().all()


async def create_employee(db: AsyncSession, employee_in: EmployeeCreate):
    from app.services.leave_balance_service import seed_balances_for_employee
    from app.services.onboarding_service import seed_onboarding_for_employee
    
    employee = Employee(**employee_in.model_dump())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)

    # Fetch user role securely for leave policies
    user_result = await db.execute(select(User).where(User.id == employee.user_id))
    user = user_result.scalar_one_or_none()
    
    if user:
        from app.db.models.role import Role
        role_result = await db.execute(select(Role).where(Role.id == user.role_id))
        role = role_result.scalar_one_or_none()
        role_name = role.name.value if role else "employee"
        
        # Provision initial DB objects
        await seed_balances_for_employee(db, employee.id, role_name)
        await seed_onboarding_for_employee(db, employee.id)

    return employee


async def update_employee(db: AsyncSession, employee: Employee, employee_in: EmployeeUpdate):
    update_data = employee_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    return employee


# async def get_employee_by_user_id(db: AsyncSession, user_id: int):
#     result = await db.execute(select(Employee).where(Employee.user_id == user_id))
#     return result.scalar_one_or_none()

async def get_employee_by_user_id(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Employee)
        .options(
            selectinload(Employee.department),   # 👈 add this
            selectinload(Employee.user),          # 👈 add this
        )
        .where(Employee.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_employee_by_id(db: AsyncSession, employee_id: int):
    result = await db.execute(
        select(Employee)
        .options(
            selectinload(Employee.department),   # 👈 add this
            selectinload(Employee.user),
        )
        .where(Employee.id == employee_id)
    )
    return result.scalar_one_or_none()