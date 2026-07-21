from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(100), nullable=False, index=True)
    scheme_name = Column(String(255), nullable=False)
    receipt_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    gcs_url = Column(String(500), nullable=True)
    file_size = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
