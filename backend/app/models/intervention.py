from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class InterventionSession(Base):
    __tablename__ = "intervention_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    reference_number = Column(String(100), nullable=True)
    scheme_name = Column(String(255), nullable=True)
    trigger_type = Column(String(50), nullable=False) # 'OTP' or 'CAPTCHA'
    status = Column(String(50), default="PAUSED") # PAUSED_FOR_OTP, PAUSED_FOR_CAPTCHA, RESUMED, EXPIRED
    captcha_image_path = Column(String(255), nullable=True)
    user_input = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
