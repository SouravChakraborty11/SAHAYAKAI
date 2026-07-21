from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.intervention import InterventionSession
from app.services.intervention_manager import intervention_manager

router = APIRouter()

class HumanInputRequest(BaseModel):
    session_id: str
    user_input: str

@router.get("/pending")
async def list_pending_interventions(db: AsyncSession = Depends(get_db)):
    """
    List all active workflows currently paused for human intervention (OTP / CAPTCHA).
    Combines in-memory active events and DB records.
    """
    active_in_memory = intervention_manager.list_active_sessions()
    
    stmt = select(InterventionSession).where(
        InterventionSession.status.in_(["PAUSED_FOR_OTP", "PAUSED_FOR_CAPTCHA", "PAUSED"])
    ).order_by(InterventionSession.created_at.desc())
    
    res = await db.execute(stmt)
    db_records = res.scalars().all()

    pending_list = []
    for rec in db_records:
        pending_list.append({
            "session_id": rec.session_id,
            "reference_number": rec.reference_number,
            "scheme_name": rec.scheme_name,
            "trigger_type": rec.trigger_type,
            "status": rec.status,
            "captcha_image_path": rec.captcha_image_path,
            "created_at": rec.created_at.isoformat() if rec.created_at else None
        })

    # Add any active in-memory sessions not yet committed to DB
    for sid, data in active_in_memory.items():
        if not any(item["session_id"] == sid for item in pending_list):
            pending_list.append({
                "session_id": sid,
                "reference_number": None,
                "scheme_name": "Government Scheme",
                "trigger_type": data["trigger_type"],
                "status": f"PAUSED_FOR_{data['trigger_type']}",
                "captcha_image_path": data["captcha_image"],
                "created_at": data["created_at"]
            })

    return {"pending_count": len(pending_list), "interventions": pending_list}

@router.get("/{session_id}")
async def get_intervention_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get state of a specific intervention session."""
    stmt = select(InterventionSession).where(InterventionSession.session_id == session_id)
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()

    if not rec:
        active = intervention_manager.get_active_session(session_id)
        if active:
            return {
                "session_id": session_id,
                "trigger_type": active["trigger_type"],
                "status": f"PAUSED_FOR_{active['trigger_type']}",
                "captcha_image_path": active["captcha_image"]
            }
        raise HTTPException(status_code=404, detail="Intervention session not found")

    return {
        "session_id": rec.session_id,
        "reference_number": rec.reference_number,
        "scheme_name": rec.scheme_name,
        "trigger_type": rec.trigger_type,
        "status": rec.status,
        "captcha_image_path": rec.captcha_image_path,
        "user_input": rec.user_input,
        "created_at": rec.created_at.isoformat() if rec.created_at else None
    }

@router.post("/submit")
async def submit_human_input(
    data: HumanInputRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    Submit human input (OTP code or CAPTCHA text) to resume Playwright automation.
    """
    session_id = data.session_id.strip()
    user_input = data.user_input.strip()

    if not user_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty")

    # Signal in-memory event to resume Playwright thread
    resumed = intervention_manager.resume_session(session_id, user_input)

    # Update DB record
    stmt = select(InterventionSession).where(InterventionSession.session_id == session_id)
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()

    if rec:
        rec.status = "RESUMED"
        rec.user_input = user_input
        await db.commit()
    else:
        # Create DB record if not already present
        new_rec = InterventionSession(
            session_id=session_id,
            trigger_type="CAPTCHA" if len(user_input) <= 6 else "OTP",
            status="RESUMED",
            user_input=user_input
        )
        db.add(new_rec)
        await db.commit()

    return {
        "success": True,
        "session_id": session_id,
        "status": "RESUMED",
        "message": "Human input received. Playwright workflow resumed successfully."
    }
