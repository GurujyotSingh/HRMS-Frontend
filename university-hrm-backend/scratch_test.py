import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

db_url = "postgresql+asyncpg://hrms_admin:admin123@localhost/university_hrms"

engine = create_async_engine(db_url)

async def test():
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT * FROM leave_requests LIMIT 5'))
        rows = result.fetchall()
        if rows:
            for r in rows:
                print(dict(r._mapping))
        else:
            print('No records found.')

asyncio.run(test())
