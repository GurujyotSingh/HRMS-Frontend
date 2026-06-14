import asyncio
from sqlalchemy import text
from app.db.session import engine

async def cascade_delete_inactive():
    async with engine.begin() as conn:
        res = await conn.execute(text("""
            SELECT
                tc.table_name,
                kcu.column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='users' AND ccu.column_name='id';
        """))
        
        tables = res.fetchall()
        print(f"Found {len(tables)} dependent tables.")
        
        # First, we need to handle chat_messages which depends on chat_sessions
        try:
            await conn.execute(text("DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id IN (SELECT id FROM users WHERE status = 'INACTIVE'))"))
        except Exception:
            pass
            
        for t in tables:
            table_name = t[0]
            col_name = t[1]
            try:
                # If table is departments, we UPDATE instead of DELETE
                if table_name == 'departments':
                    await conn.execute(text(f"UPDATE departments SET {col_name} = NULL WHERE {col_name} IN (SELECT id FROM users WHERE status = 'INACTIVE')"))
                    print(f"Updated {table_name}")
                else:
                    await conn.execute(text(f"DELETE FROM {table_name} WHERE {col_name} IN (SELECT id FROM users WHERE status = 'INACTIVE')"))
                    print(f"Deleted from {table_name}")
            except Exception as e:
                print(f"Failed to process {table_name}: {e}")
                
        await conn.execute(text("DELETE FROM users WHERE status = 'INACTIVE'"))
        print("Users deleted.")

if __name__ == '__main__':
    asyncio.run(cascade_delete_inactive())
