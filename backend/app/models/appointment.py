from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    provider_name = Column(String(255), nullable=False)
    provider_type = Column(String(100), nullable=False) # 'ngo', 'caregiver', 'rehab_center'
    appointment_date = Column(String(100), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Confirmed") # Confirmed, Cancelled, Completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
