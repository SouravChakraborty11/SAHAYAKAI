from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    high_contrast: Optional[bool] = None
    font_scale: Optional[str] = None

class UserResponse(UserBase):
    id: int
    theme: str
    high_contrast: bool
    font_scale: str

    model_config = {"from_attributes": True}

class GoogleAuthRequest(BaseModel):
    id_token: str
