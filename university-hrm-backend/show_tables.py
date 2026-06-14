import asyncio
from app.db.session import engine
from sqlalchemy import text

async def show_tables():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        for row in res:
            print(row[0])

if __name__ == '__main__':
    asyncio.run(show_tables())
