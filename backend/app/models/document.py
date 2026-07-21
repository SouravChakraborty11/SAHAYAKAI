from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False) # Aadhaar, Income Certificate, Disability Certificate, etc.
    storage_path = Column(String(500), nullable=False)
    gcs_url = Column(String(500), nullable=True)
    file_size = Column(Integer, default=0)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
