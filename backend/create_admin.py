import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.database import Base, settings
from modules.iam.domain.models import User, UserRole
from modules.iam.application.security import get_password_hash

async def create_admin():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if users already exist
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.username == "admin"))
        if result.scalar_one_or_none():
            print("Admin user already exists.")
            return

        admin = User(
            username="admin",
            hashed_password=get_password_hash("admin123"), # Default password
            role=UserRole.ADMIN.value
        )
        session.add(admin)
        await session.commit()
        print("Admin user created: admin / admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
