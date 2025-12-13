import os
import asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

async def main():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL not found in .env")

    engine = create_async_engine(url, echo=False)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        print("DB OK ✅ ->", result.scalar())
    await engine.dispose()

asyncio.run(main())
