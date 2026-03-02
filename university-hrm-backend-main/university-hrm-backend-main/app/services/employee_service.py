from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
    employee = Employee(**employee_in.model_dump())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee


async def update_employee(db: AsyncSession, employee: Employee, employee_in: EmployeeUpdate):
    update_data = employee_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    return employee


async def get_employee_by_user_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(Employee).where(Employee.user_id == user_id))
    return result.scalar_one_or_none()