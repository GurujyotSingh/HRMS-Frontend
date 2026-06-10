import smtplib
from email.message import EmailMessage
import asyncio
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def _send_email_sync(to_emails: list[str], subject: str, html_content: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email dispatch.")
        return

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"University HRMS <{settings.SMTP_USER}>"
    msg['To'] = ", ".join(to_emails)
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent successfully to {to_emails}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_emails}: {e}")

async def send_credentials_email(personal_email: str, work_email: str, password: str, employee_name: str):
    """Asynchronously send the welcome email with credentials."""
    subject = "Welcome to University Global - Your Login Credentials"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1e3a8a; margin: 0;">University Global HRMS</h2>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e3a8a;">Welcome, {employee_name}!</h3>
                    <p>Your employee account has been successfully created. Below are your official login credentials for the University HRMS portal.</p>
                    
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Work Email (Login ID):</strong> {work_email}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> {password}</p>
                    </div>
                    
                    <p style="color: #dc2626; font-size: 0.9em; font-weight: bold;">
                        ⚠️ Important: Please log in and change your password immediately upon your first access.
                    </p>
                    
                    
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #64748b;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    # Send to both personal and work email
    to_emails = [email for email in [personal_email, work_email] if email]
    
    # Run SMTP in a background thread to avoid blocking the async event loop
    await asyncio.to_thread(_send_email_sync, to_emails, subject, html_content)
