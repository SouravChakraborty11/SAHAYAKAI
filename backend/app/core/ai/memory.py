from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.chat import ChatMessage

async def get_session_history(session_id: int, db: AsyncSession, limit: int = 10):
    stmt = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    messages = result.scalars().all()
    # Return chronologically
    return messages[::-1]
