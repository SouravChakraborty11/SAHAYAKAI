from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core.database import get_db
from app.models.chat import ChatSession, ChatMessage
from app.core.ai.memory import get_session_history
from app.core.ai.router import route_message
from sqlalchemy import select

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: int | None = None

async def save_message(db: AsyncSession, session_id: int, sender: str, content: str, intent: str = None):
    msg = ChatMessage(session_id=session_id, sender=sender, content=content, intent=intent)
    db.add(msg)
    await db.commit()

@router.post("/stream")
async def chat_stream(request: ChatRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    session_id = request.session_id
    
    # 1. Handle Session
    if not session_id:
        new_session = ChatSession()
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        session_id = new_session.id
    else:
        # Validate session
        stmt = select(ChatSession).where(ChatSession.id == session_id)
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Session not found")

    # 2. Get Agent and Intent
    agent, intent = await route_message(request.message)
    
    # 3. Save User Message
    await save_message(db, session_id, "user", request.message, intent)

    # 4. Fetch History
    history = await get_session_history(session_id, db)

    # 5. Generate Async Streaming Generator
    async def event_generator():
        full_response = ""
        # Send a meta-event with the session ID first
        yield {"event": "meta", "data": f'{{"session_id": {session_id}, "intent": "{intent}"}}'}
        
        try:
            async for chunk in agent.process(request.message, history):
                full_response += chunk
                # Yield text chunks
                yield {"event": "message", "data": chunk}
        except Exception as e:
            yield {"event": "error", "data": str(e)}
        finally:
            if full_response:
                from app.core.database import AsyncSessionLocal
                async with AsyncSessionLocal() as session:
                    await save_message(session, session_id, "ai", full_response, intent)
            
            yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(event_generator())
