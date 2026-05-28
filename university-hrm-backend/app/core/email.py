from fastapi import BackgroundTasks

# Placeholder email sending functions used across the HRMS system.
# Additional email helpers (case/expense related) have been removed as those modules are no longer part of the project.

def send_onboarding_email(email: str, name: str, background_tasks: BackgroundTasks):
    """Send onboarding welcome email.
    In production this would enqueue an email job; here we simply simulate.
    """
    # Implementation would integrate with an email provider.
    background_tasks.add_task(lambda: print(f"Onboarding email sent to {name} <{email}>"))

def send_payroll_email(email: str, period: str, background_tasks: BackgroundTasks):
    """Notify employee about payroll availability for a given period."""
    background_tasks.add_task(lambda: print(f"Payroll email for {period} sent to {email}"))

# Add other email utilities as needed for remaining features.