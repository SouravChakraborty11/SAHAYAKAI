from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserSettingsUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
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
async def get_dashboard_data(current_user: User = Depends(get_current_user)):
    # Placeholder for actual dashboard logic
    return {
        "welcome_message": f"Hello, {current_user.full_name or 'User'}!",
        "stats": {
            "tasks_completed": 42,
            "active_projects": 3
        },
        "recent_activity": [
            {"id": 1, "action": "Logged in", "timestamp": "2026-07-20T10:00:00Z"},
            {"id": 2, "action": "Updated profile", "timestamp": "2026-07-19T14:30:00Z"}
        ]
    }
