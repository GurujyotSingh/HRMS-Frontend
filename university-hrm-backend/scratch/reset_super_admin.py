import asyncio
import asyncpg
from app.core.security import get_password_hash

async def reset_password():
    conn = await asyncpg.connect("postgresql://postgres:Divyansh113@127.0.0.1:5432/university_hrm")
    email = "super@university.edu"
    new_password = "superadmin123"
    
    hashed = get_password_hash(new_password)
    result = await conn.execute("UPDATE users SET password_hash = $1 WHERE email = $2", hashed, email)
    
    if result == "UPDATE 1":
        print(f"SUCCESS: Password for {email} reset to '{new_password}'")
    else:
        print(f"ERROR: User {email} not found in database. Result: {result}")
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(reset_password())
