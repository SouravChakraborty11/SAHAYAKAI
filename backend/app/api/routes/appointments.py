from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.appointment import Appointment

router = APIRouter()

class AppointmentCreate(BaseModel):
    provider_name: str
    provider_type: str
    appointment_date: str
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[int] = None

class AppointmentResponse(AppointmentCreate):
    id: int
    status: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate, 
    db: AsyncSession = Depends(get_db)
):
    new_app = Appointment(
        user_id=data.user_id,
        provider_name=data.provider_name,
        provider_type=data.provider_type,
        appointment_date=data.appointment_date,
        contact_phone=data.contact_phone,
        notes=data.notes,
        status="Confirmed"
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)

    return {
        "id": new_app.id,
        "user_id": new_app.user_id,
        "provider_name": new_app.provider_name,
        "provider_type": new_app.provider_type,
        "appointment_date": new_app.appointment_date,
        "contact_phone": new_app.contact_phone,
        "notes": new_app.notes,
        "status": new_app.status,
        "created_at": new_app.created_at.isoformat()
    }

@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    user_id: Optional[int] = None, 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Appointment).order_by(Appointment.created_at.desc())
    if user_id:
        stmt = stmt.where(Appointment.user_id == user_id)
        
    result = await db.execute(stmt)
    apps = result.scalars().all()

    return [
        {
            "id": app.id,
            "user_id": app.user_id,
            "provider_name": app.provider_name,
            "provider_type": app.provider_type,
            "appointment_date": app.appointment_date,
            "contact_phone": app.contact_phone,
            "notes": app.notes,
            "status": app.status,
            "created_at": app.created_at.isoformat()
        }
        for app in apps
    ]

@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: int, 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    app = result.scalar_one_or_none()
    
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    await db.delete(app)
    await db.commit()
    return {"message": "Appointment cancelled successfully"}
