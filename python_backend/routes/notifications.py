"""Notification routes — email sending."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.notification_service import send_email

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class EmailNotificationRequest(BaseModel):
    to_emails: List[str]
    subject: str
    body_html: str


@router.post("/send-email")
async def handle_send_email(req: EmailNotificationRequest):
    try:
        result = send_email(req.to_emails, req.subject, req.body_html)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
