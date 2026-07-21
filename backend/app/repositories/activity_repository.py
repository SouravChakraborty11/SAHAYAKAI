from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity import ActivityLog
from app.repositories.base import BaseRepository

class ActivityRepository(BaseRepository[ActivityLog]):
    """Repository pattern implementation for User Activity logs."""
    def __init__(self, db: AsyncSession):
        super().__init__(ActivityLog, db)

    async def get_by_user_id(self, user_id: int) -> List[ActivityLog]:
        stmt = select(ActivityLog).where(ActivityLog.user_id == user_id).order_by(ActivityLog.timestamp.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_action(self, action: str) -> List[ActivityLog]:
        stmt = select(ActivityLog).where(ActivityLog.action == action).order_by(ActivityLog.timestamp.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
