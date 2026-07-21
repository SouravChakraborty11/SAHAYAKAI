from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List

from app.core.database import get_db
from app.models.activity import ActivityLog

router = APIRouter()

class ActivityCreate(BaseModel):
    user_id: int | None = None
    action: str
    details: str | None = None

class ActivityResponse(ActivityCreate):
    id: int
    timestamp: str

    class Config:
        from_attributes = True

@router.post("/", response_model=ActivityResponse)
async def log_activity(activity: ActivityCreate, db: AsyncSession = Depends(get_db)):
    new_log = ActivityLog(
        user_id=activity.user_id,
        action=activity.action,
        details=activity.details
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    
    # Convert timestamp to string for response
    return {
        "id": new_log.id,
        "user_id": new_log.user_id,
        "action": new_log.action,
        "details": new_log.details,
        "timestamp": new_log.timestamp.isoformat()
    }

@router.get("/", response_model=List[ActivityResponse])
async def get_activity(user_id: int | None = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit)
    if user_id:
        stmt = stmt.where(ActivityLog.user_id == user_id)
        
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]
