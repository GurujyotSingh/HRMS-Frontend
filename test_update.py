import asyncio
from app.db.database import async_session
from app.services.employee_service import get_employee_by_employee_id, update_employee

async def run():
    async with async_session() as db:
        user = await get_employee_by_employee_id(db, 'UNI-HRS-AUTO')
        if not user:
            print('User not found by UNI-HRS-AUTO, trying another')
            user = await get_employee_by_employee_id(db, 'SK-HRS-01')
        if user:
            print('BEFORE:', user.pan_number)
            await update_employee(db, user, {'pan_number': 'TEST123456'})
            print('AFTER:', user.pan_number)
            
asyncio.run(run())
