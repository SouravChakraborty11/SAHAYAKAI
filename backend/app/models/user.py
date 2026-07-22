from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)

    # Settings
    theme = Column(String, default="system")       # light, dark, system
    high_contrast = Column(Boolean, default=False)
    font_scale = Column(String, default="medium")  # small, medium, large
    language = Column(String, default="English")

    # Notification preferences
    notif_email = Column(Boolean, default=True)
    notif_push = Column(Boolean, default=True)
    notif_sms = Column(Boolean, default=False)
