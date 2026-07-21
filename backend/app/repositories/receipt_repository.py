from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.receipt import Receipt
from app.repositories.base import BaseRepository

class ReceiptRepository(BaseRepository[Receipt]):
    """Repository pattern implementation for Automation Receipts."""
    def __init__(self, db: AsyncSession):
        super().__init__(Receipt, db)

    async def get_by_reference(self, reference_number: str) -> Optional[Receipt]:
        stmt = select(Receipt).where(Receipt.reference_number == reference_number.strip())
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_scheme(self, scheme_name: str) -> List[Receipt]:
        stmt = select(Receipt).where(Receipt.scheme_name == scheme_name)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
