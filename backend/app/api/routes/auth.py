from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.core.password import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import GoogleAuthRequest, UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter()

# ── Helper ────────────────────────────────────────────────────────────────────
def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        theme=user.theme or "system",
        high_contrast=user.high_contrast or False,
        font_scale=user.font_scale or "medium",
        language=user.language or "English",
        notif_email=user.notif_email if user.notif_email is not None else True,
        notif_push=user.notif_push if user.notif_push is not None else True,
        notif_sms=user.notif_sms if user.notif_sms is not None else False,
    )

# ── Email / Password Register ─────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=get_password_hash(request.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))

# ── Email / Password Login ────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(request: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))

# ── Google OAuth ──────────────────────────────────────────────────────────────
@router.post("/google", response_model=dict)
async def google_auth(request: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            request.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        email = idinfo.get("email")
        google_id = idinfo.get("sub")
        full_name = idinfo.get("name")
        avatar_url = idinfo.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(email=email, google_id=google_id, full_name=full_name, avatar_url=avatar_url)
            db.add(user)
            await db.commit()
            await db.refresh(user)

        access_token = create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")
