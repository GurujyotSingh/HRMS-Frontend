import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.api.v1.employees import EmployeeOut

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.employee_id == 'EMP001')) # Or just any user
        users = res.scalars().all()
        for u in users:
            print("User", u.email)
            if u.financials:
                print("Fin Bank Name from ORM:", u.financials.bank_name)
                # Let's see what Pydantic does
                out = EmployeeOut.model_validate(u)
                print("Fin from Pydantic:", out.financials)

asyncio.run(main())
