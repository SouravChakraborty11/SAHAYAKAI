from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import NotificationLog
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[NotificationLog]):
    """Repository pattern implementation for Notification logs and retry status."""
    def __init__(self, db: AsyncSession):
        super().__init__(NotificationLog, db)

    async def get_by_user_id(self, user_id: int) -> List[NotificationLog]:
        stmt = select(NotificationLog).where(NotificationLog.user_id == user_id).order_by(NotificationLog.created_at.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_channel(self, channel: str) -> List[NotificationLog]:
        stmt = select(NotificationLog).where(NotificationLog.channel == channel.upper()).order_by(NotificationLog.created_at.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_pending_retries(self) -> List[NotificationLog]:
        stmt = select(NotificationLog).where(NotificationLog.status.in_(["PENDING", "RETRYING"]))
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
