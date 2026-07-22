import logging
from typing import Optional, Tuple
from app.services.notification_service import notification_service

logger = logging.getLogger("NotificationTool")

class NotificationTool:
    """
    NotificationTool wraps the NotificationService to dispatch multi-channel notifications
    (Push, Email, SMS) with retry capabilities.
    """
    def __init__(self):
        self._service = notification_service

    async def send_notification(
        self,
        recipient: str,
        message: str,
        channel: str = "SMS",
        subject: Optional[str] = None
    ) -> bool:
        """Send notification over the specified channel (SMS, EMAIL, or PUSH)."""
        logger.info(f"[NOTIFICATION_TOOL] Sending notification via channel '{channel}' to recipient '{recipient}'")
        channel_upper = channel.upper()
        
        if channel_upper == "PUSH":
            success, err = await self._service.send_push_notification(recipient, subject or "Alert", message)
        elif channel_upper == "EMAIL":
            success, err = await self._service.send_email_notification(recipient, subject or "Update", message)
        else:
            success, err = await self._service.send_sms_notification(recipient, message)
            
        if not success:
            logger.error(f"[NOTIFICATION_TOOL] Failed to send {channel} notification: {err}")
        return success

    # Backwards compatibility methods
    async def send_push_notification(self, device_token: str, title: str, body: str) -> Tuple[bool, Optional[str]]:
        """Sends Firebase Push Notification via FCM API."""
        return await self._service.send_push_notification(device_token, title, body)

    async def send_email_notification(self, to_email: str, subject: str, body: str) -> Tuple[bool, Optional[str]]:
        """Sends Email Notification via SMTP / Email Provider."""
        return await self._service.send_email_notification(to_email, subject, body)

    async def send_sms_notification(self, phone_number: str, message: str) -> Tuple[bool, Optional[str]]:
        """Sends SMS Notification via Twilio / Gateway provider."""
        return await self._service.send_sms_notification(phone_number, message)

    async def dispatch_with_retry(
        self,
        notification_id: int,
        channel: str,
        recipient: str,
        subject: Optional[str],
        message: str,
        max_retries: int = 3
    ) -> bool:
        """Executes background notification retries with exponential backoff."""
        return await self._service.dispatch_with_retry(
            notification_id=notification_id,
            channel=channel,
            recipient=recipient,
            subject=subject,
            message=message,
            max_retries=max_retries
        )
