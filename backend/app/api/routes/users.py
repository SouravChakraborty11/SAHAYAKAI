from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid
import shutil

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserSettingsUpdate, UserProfileUpdate
from app.models.application import SchemeApplication
from sqlalchemy import select, func

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me/profile", response_model=UserResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.patch("/me/settings", response_model=UserResponse)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/dashboard")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Query for active applications (all except Rejected)
    stmt = select(func.count()).select_from(SchemeApplication).where(
        SchemeApplication.user_id == current_user.id,
        SchemeApplication.status != "Rejected"
    )
    result = await db.execute(stmt)
    active_applications = result.scalar_one_or_none() or 0

    return {
        "welcome_message": f"Hello, {current_user.full_name or 'User'}!",
        "stats": {
            "active_applications": active_applications,
            "eligible_schemes": 0  # Default to 0 as user profile doesn't store this currently
        },
    }

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/me/profile-photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Read file contents and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
        
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Delete old avatar if exists
    if current_user.avatar_url:
        old_file_path = os.path.join("uploads", current_user.avatar_url.split("/uploads/")[-1])
        if os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except Exception as e:
                print(f"Error removing old avatar: {e}")

    # Save new file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Update user in DB
    avatar_url = f"/uploads/profiles/{unique_filename}"
    current_user.avatar_url = avatar_url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

@router.delete("/me/profile-photo", response_model=UserResponse)
async def delete_profile_photo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.avatar_url:
        old_file_path = os.path.join("uploads", current_user.avatar_url.split("/uploads/")[-1])
        if os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except Exception as e:
                print(f"Error removing avatar: {e}")
                
        current_user.avatar_url = None
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

    return current_user

