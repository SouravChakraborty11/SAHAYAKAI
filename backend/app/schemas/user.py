from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    high_contrast: Optional[bool] = None
    font_scale: Optional[str] = None
    language: Optional[str] = None
    notif_email: Optional[bool] = None
    notif_push: Optional[bool] = None
    notif_sms: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: str
    high_contrast: bool
    font_scale: str
    language: str
    notif_email: bool
    notif_push: bool
    notif_sms: bool

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class GoogleAuthRequest(BaseModel):
    id_token: str
