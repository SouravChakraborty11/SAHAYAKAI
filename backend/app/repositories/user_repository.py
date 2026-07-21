from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    """Repository pattern implementation for User profiles."""
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.strip().lower())
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_active_users(self) -> List[User]:
        stmt = select(User).where(User.is_active == True)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
