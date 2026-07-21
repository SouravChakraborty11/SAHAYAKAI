from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class SchemeApplication(Base):
    __tablename__ = "scheme_applications"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    scheme_name = Column(String(255), nullable=False)
    applicant_name = Column(String(255), nullable=False)
    aadhaar_number = Column(String(100), nullable=False)
    phone_number = Column(String(100), nullable=False)
    status = Column(String(100), default="Under Verification") # Submitted, Under Verification, Approved, Rejected
    receipt_file = Column(String(255), nullable=True)
    screenshot_file = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
