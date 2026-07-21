from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document
from app.repositories.base import BaseRepository

class DocumentRepository(BaseRepository[Document]):
    """Repository pattern implementation for User and Scheme Documents."""
    def __init__(self, db: AsyncSession):
        super().__init__(Document, db)

    async def get_by_user_id(self, user_id: int) -> List[Document]:
        stmt = select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_file_type(self, file_type: str) -> List[Document]:
        stmt = select(Document).where(Document.file_type == file_type)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
