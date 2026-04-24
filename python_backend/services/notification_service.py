"""Email notification service via Gmail SMTP."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_EMAIL, SMTP_APP_PASSWORD, SMTP_HOST, SMTP_PORT

logger = logging.getLogger("alumconnect.notifications")


def send_email(to_emails: list, subject: str, body_html: str) -> dict:
    """Send an email notification via Gmail SMTP."""
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email.")
        return {"success": False, "message": "SMTP not configured"}

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"AlumConnect <{SMTP_EMAIL}>"
        msg["Subject"] = subject
        msg["To"] = ", ".join(to_emails)

        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_emails, msg.as_string())

        logger.info(f"Email sent to {len(to_emails)} recipients: {subject}")
        return {"success": True, "message": f"Sent to {len(to_emails)} recipients"}
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return {"success": False, "message": str(e)}
