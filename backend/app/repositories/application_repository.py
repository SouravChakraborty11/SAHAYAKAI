from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.application import SchemeApplication
from app.repositories.base import BaseRepository

class ApplicationRepository(BaseRepository[SchemeApplication]):
    """Repository pattern implementation for Scheme Applications."""
    def __init__(self, db: AsyncSession):
        super().__init__(SchemeApplication, db)

    async def get_by_reference(self, reference_number: str) -> Optional[SchemeApplication]:
        stmt = select(SchemeApplication).where(SchemeApplication.reference_number == reference_number.strip())
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_status(self, status: str) -> List[SchemeApplication]:
        stmt = select(SchemeApplication).where(SchemeApplication.status == status)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
