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


async def send_director_assignment_email(user_email: str, employee_name: str, department_name: str):
    """Asynchronously send a notification email when an employee is promoted to Director."""
    subject = "Congratulations on Your New Role - Director Assignment"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1e3a8a; margin: 0;">University Global HRMS</h2>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e3a8a;">Congratulations, {employee_name}!</h3>
                    <p>We are pleased to inform you that you have been officially assigned as the <strong>Director</strong> of the <strong>{department_name}</strong> department.</p>
                    <p>Your system role has been automatically upgraded, granting you additional administrative privileges within the HRMS portal for your department.</p>
                    <br/>
                    <p>Best regards,<br/>University HR Administration</p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #64748b;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    if user_email:
        await asyncio.to_thread(_send_email_sync, [user_email], subject, html_content)


async def send_leave_status_email(personal_email: str, work_email: str, employee_name: str, status: str, leave_type: str, from_date: str, to_date: str, remarks: str):
    """Asynchronously send an email when a leave request is approved or rejected."""
    action_color = "#16a34a" if status.lower() == "approved" else "#dc2626"
    subject = f"Leave Request {status.capitalize()} - {leave_type.capitalize()} Leave"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1e3a8a; margin: 0;">University Global HRMS</h2>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e3a8a;">Hi {employee_name},</h3>
                    <p>Your <strong>{leave_type.replace('_', ' ').title()}</strong> request for the dates <strong>{from_date}</strong> to <strong>{to_date}</strong> has been <strong style="color: {action_color};">{status.upper()}</strong>.</p>
                    
                    {f'<div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid {action_color};"><p style="margin: 0; font-size: 14px;"><strong>HR Notes:</strong><br/>{remarks}</p></div>' if remarks else ''}
                    
                    <p>You can view more details by logging into the HRMS portal.</p>
                    <br/>
                    <p>Best regards,<br/>University HR Administration</p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #64748b;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    to_emails = [email for email in [personal_email, work_email] if email]
    if to_emails:
        await asyncio.to_thread(_send_email_sync, to_emails, subject, html_content)

async def send_job_application_received_email(candidate_email: str, candidate_name: str, job_title: str):
    """Asynchronously send an email confirming receipt of a job application."""
    subject = f"Application Received: {job_title}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1e3a8a; margin: 0;">University Global HRMS</h2>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e3a8a;">Hi {candidate_name},</h3>
                    <p>Thank you for expressing interest in joining our team! This email is to confirm that we have successfully received your application and resume for the <strong>{job_title}</strong> position.</p>
                    <p>Our recruitment team is currently reviewing your profile. If your qualifications match our requirements, we will reach out to you regarding the next steps in our hiring process.</p>
                    <p>We appreciate the time you took to apply and wish you the best of luck!</p>
                    <br/>
                    <p>Best regards,<br/>University Recruitment Team</p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #64748b;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    if candidate_email:
        logger.info(f"Dispatching application received email to {candidate_email} for job: {job_title}")
        await asyncio.to_thread(_send_email_sync, [candidate_email], subject, html_content)


async def send_recruitment_stage_email(candidate_email: str, candidate_name: str, job_title: str, new_status: str, hr_notes: str = None):
    """Asynchronously send an email updating the candidate on their application status."""
    
    new_status_lower = new_status.lower()
    subject = f"Update on your application: {job_title}"
    
    # Default generic text
    status_text = f"Your application has been moved to the <strong>{new_status.replace('_', ' ').title()}</strong> stage."
    action_color = "#3b82f6" # default blue
    
    if new_status_lower == "screening":
        status_text = f"We wanted to let you know that your application for the <strong>{job_title}</strong> position is now under active review by our screening team.<br/><br/>We appreciate the time you took to apply and are carefully evaluating your qualifications against the requirements of the role. You can expect to hear from us regarding the next steps in the process shortly."
    elif new_status_lower == "interview":
        status_text = f"Congratulations! We were very impressed with your background and would like to formally invite you to interview for the <strong>{job_title}</strong> position.<br/><br/>This will be a great opportunity for us to learn more about your experience and for you to ask any questions you have about the team and the role. Our recruitment coordinator will be reaching out to you shortly with scheduling details."
        action_color = "#8b5cf6" # purple
    elif new_status_lower == "offered":
        subject = f"Job Offer: {job_title}"
        status_text = f"We are delighted to extend a formal offer of employment for the <strong>{job_title}</strong> position!<br/><br/>Our team was incredibly impressed with your skills and experience during the interview process, and we are confident you will make a fantastic addition to our institution. Please review any associated documents or communications from our HR team regarding the next steps."
        action_color = "#10b981" # green
    elif new_status_lower == "hired":
        subject = f"Welcome Aboard: {job_title}"
        status_text = f"Welcome to the team! We are thrilled to officially confirm your hiring for the <strong>{job_title}</strong> position.<br/><br/>The onboarding process will begin soon. You will receive further instructions on how to access our internal HR portal and complete your new hire documentation. We look forward to seeing you thrive with us!"
        action_color = "#16a34a" # green
    elif new_status_lower == "rejected":
        status_text = f"Thank you very much for taking the time to apply for the <strong>{job_title}</strong> position.<br/><br/>While we were impressed with your background, we have decided to move forward with another candidate whose qualifications more closely match our current needs for this specific role at this time. We will keep your resume on file and may reach out if a suitable opportunity arises in the future. We wish you the absolute best in your career search."
        action_color = "#64748b" # gray
    
    notes_html = ""
    if hr_notes:
        notes_html = f"""
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid {action_color};">
            <p style="margin: 0; font-size: 14px;"><strong>Message from the Recruitment Team:</strong><br/>{hr_notes.replace(chr(10), '<br/>')}</p>
        </div>
        """

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1e3a8a; margin: 0;">University Global HRMS</h2>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e3a8a;">Hi {candidate_name},</h3>
                    <p>We are writing to provide an update regarding your application for the <strong>{job_title}</strong> position.</p>
                    
                    <p style="font-size: 1.05em;">{status_text}</p>
                    
                    {notes_html}
                    
                    <br/>
                    <p>Best regards,<br/>University Recruitment Team</p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #64748b;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    if candidate_email:
        logger.info(f"Dispatching recruitment stage email ({new_status}) to {candidate_email} for job: {job_title}")
        await asyncio.to_thread(_send_email_sync, [candidate_email], subject, html_content)
