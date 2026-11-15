import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional
from datetime import datetime, timezone
from app.core.config import settings
from app.models import DeliveryStatus

logger = logging.getLogger(__name__)

def send_smtp_email(
    recipient_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None
) -> Tuple[DeliveryStatus, str]:
    """
    Sends an email via real SMTP if credentials exist.
    Accurately reports DeliveryStatus:
    - SKIPPED_NO_CREDENTIALS: if SMTP_HOST is not set.
    - FAILED: if connection or sending fails.
    - DELIVERED: if SMTP server accepted the message.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(f"[EMAIL SERVICE] SMTP not configured. Notification to {recipient_email} logged as SKIPPED_NO_CREDENTIALS.")
        return DeliveryStatus.SKIPPED_NO_CREDENTIALS, "SMTP credentials not configured in environment"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = recipient_email

    part1 = MIMEText(body_text, "plain")
    msg.attach(part1)

    if body_html:
        part2 = MIMEText(body_html, "html")
        msg.attach(part2)

    try:
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(settings.SMTP_FROM_EMAIL, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"[EMAIL SERVICE] Email successfully sent to {recipient_email}")
        return DeliveryStatus.DELIVERED, "Message accepted by SMTP server"
    except Exception as e:
        logger.error(f"[EMAIL SERVICE] Failed to send email to {recipient_email}: {str(e)}")
        return DeliveryStatus.FAILED, str(e)
