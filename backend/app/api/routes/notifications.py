from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.core.database import get_db
from app.models.notification import NotificationLog
from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import notification_service

router = APIRouter()

class SendNotificationRequest(BaseModel):
    channel: str # PUSH, EMAIL, SMS
    recipient: str
    subject: Optional[str] = None
    message: str
    user_id: Optional[int] = None
    max_retries: Optional[int] = 3

class PushNotificationRequest(BaseModel):
    device_token: str
    title: str
    body: str
    user_id: Optional[int] = None

class EmailNotificationRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    user_id: Optional[int] = None

class SMSNotificationRequest(BaseModel):
    phone_number: str
    message: str
    user_id: Optional[int] = None

@router.post("/send")
async def send_notification(
    request: SendNotificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    channel_upper = request.channel.strip().upper()
    if channel_upper not in ["PUSH", "EMAIL", "SMS"]:
        raise HTTPException(status_code=400, detail="Invalid notification channel. Supported: PUSH, EMAIL, SMS")

    repo = NotificationRepository(db)
    notification_log = await repo.create({
        "user_id": request.user_id,
        "channel": channel_upper,
        "recipient": request.recipient.strip(),
        "subject": request.subject,
        "message": request.message,
        "status": "PENDING",
        "is_read": False,
        "retry_count": 0,
        "max_retries": request.max_retries or 3
    })

    background_tasks.add_task(
        notification_service.dispatch_with_retry,
        notification_id=notification_log.id,
        channel=channel_upper,
        recipient=request.recipient.strip(),
        subject=request.subject,
        message=request.message,
        max_retries=request.max_retries or 3
    )

    return {
        "success": True,
        "notification_id": notification_log.id,
        "channel": channel_upper,
        "recipient": request.recipient,
        "status": "PENDING",
        "message": "Notification enqueued for background dispatch with exponential backoff retry."
    }

@router.post("/push")
async def send_push_notification(
    request: PushNotificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    notification_log = await repo.create({
        "user_id": request.user_id,
        "channel": "PUSH",
        "recipient": request.device_token,
        "subject": request.title,
        "message": request.body,
        "status": "PENDING",
        "is_read": False,
        "max_retries": 3
    })

    background_tasks.add_task(
        notification_service.dispatch_with_retry,
        notification_id=notification_log.id,
        channel="PUSH",
        recipient=request.device_token,
        subject=request.title,
        message=request.body,
        max_retries=3
    )

    return {"success": True, "notification_id": notification_log.id, "channel": "PUSH", "status": "PENDING"}

@router.post("/email")
async def send_email_notification(
    request: EmailNotificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    notification_log = await repo.create({
        "user_id": request.user_id,
        "channel": "EMAIL",
        "recipient": request.to_email,
        "subject": request.subject,
        "message": request.body,
        "status": "PENDING",
        "is_read": False,
        "max_retries": 3
    })

    background_tasks.add_task(
        notification_service.dispatch_with_retry,
        notification_id=notification_log.id,
        channel="EMAIL",
        recipient=request.to_email,
        subject=request.subject,
        message=request.body,
        max_retries=3
    )

    return {"success": True, "notification_id": notification_log.id, "channel": "EMAIL", "status": "PENDING"}

@router.post("/sms")
async def send_sms_notification(
    request: SMSNotificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    notification_log = await repo.create({
        "user_id": request.user_id,
        "channel": "SMS",
        "recipient": request.phone_number,
        "subject": None,
        "message": request.message,
        "status": "PENDING",
        "is_read": False,
        "max_retries": 3
    })

    background_tasks.add_task(
        notification_service.dispatch_with_retry,
        notification_id=notification_log.id,
        channel="SMS",
        recipient=request.phone_number,
        subject=None,
        message=request.message,
        max_retries=3
    )

    return {"success": True, "notification_id": notification_log.id, "channel": "SMS", "status": "PENDING"}

@router.get("/history")
async def list_notification_history(
    channel: Optional[str] = None,
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    if user_id:
        logs = await repo.get_by_user_id(user_id)
    elif channel:
        logs = await repo.get_by_channel(channel)
    else:
        logs = await repo.get_all()

    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "channel": n.channel,
            "recipient": n.recipient,
            "subject": n.subject,
            "message": n.message,
            "status": n.status,
            "is_read": bool(n.is_read),
            "retry_count": n.retry_count,
            "max_retries": n.max_retries,
            "error_log": n.error_log,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "updated_at": n.updated_at.isoformat() if n.updated_at else None
        }
        for n in logs
    ]

@router.get("/unread-count")
async def get_unread_notification_count(
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get total unread notification count."""
    stmt = select(func.count(NotificationLog.id)).where(NotificationLog.is_read == False)
    if user_id:
        stmt = stmt.where(NotificationLog.user_id == user_id)
    res = await db.execute(stmt)
    count = res.scalar() or 0
    return {"unread_count": count}

@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark a single notification as read."""
    repo = NotificationRepository(db)
    item = await repo.get_by_id(notification_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    await db.commit()
    return {"success": True, "notification_id": notification_id, "is_read": True}

@router.patch("/read-all")
async def mark_all_notifications_as_read(
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read."""
    stmt = update(NotificationLog).values(is_read=True)
    if user_id:
        stmt = stmt.where(NotificationLog.user_id == user_id)
    await db.execute(stmt)
    await db.commit()
    return {"success": True, "message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete notification by ID."""
    repo = NotificationRepository(db)
    success = await repo.delete(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "notification_id": notification_id, "message": "Notification deleted"}
