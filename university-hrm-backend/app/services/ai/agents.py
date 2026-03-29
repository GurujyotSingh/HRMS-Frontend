"""
Autonomous AI Agents
--------------------
Small focused agents, each with one job.
All use call_llm() with Claude primary + OpenAI fallback.
"""

import json
from app.services.ai.llm_client import call_llm


# ═══════════════════════════════════════════════════════════════════════════════
# 1. PAYSLIP EXPLAINER AGENT
# ═══════════════════════════════════════════════════════════════════════════════

async def explain_payslip(payslip_data: dict, employee_name: str) -> str:
    """
    Explains a payslip in simple plain English.
    Employee asks: "Why is my salary lower this month?"
    """
    prompt = f"""
You are a helpful payroll assistant. Explain this payslip to {employee_name} in simple, 
friendly language. Highlight any deductions clearly. Keep it under 200 words.

Payslip Data:
{json.dumps(payslip_data, indent=2, default=str)}

Explain:
1. What they earned (gross)
2. What was deducted and why
3. Final take-home pay
4. If anything unusual (e.g. absent deduction), explain it clearly
"""
    result = await call_llm(
        messages=[{"role": "user", "content": prompt}],
        system="You are a friendly payroll assistant that explains salary details in plain language.",
        max_tokens=500,
    )
    return result["content"]


# ═══════════════════════════════════════════════════════════════════════════════
# 2. LEAVE RECOMMENDATION AGENT
# ═══════════════════════════════════════════════════════════════════════════════

async def recommend_leave_dates(
    employee_name: str,
    requested_start: str,
    requested_end: str,
    leave_balance: dict,
    team_leaves: list[dict],
) -> str:
    """
    Checks if requested leave dates are optimal.
    Warns if team coverage is low or balance is insufficient.
    """
    prompt = f"""
You are an HR assistant. An employee named {employee_name} wants to apply for leave.

Requested Dates: {requested_start} to {requested_end}
Leave Balance: {json.dumps(leave_balance, default=str)}
Other team members on leave during this period: {json.dumps(team_leaves, default=str)}

Analyze and respond:
1. Is the leave balance sufficient?
2. Are there any team coverage concerns?
3. Suggest alternative dates if there's a conflict.
4. Keep response under 150 words.
"""
    result = await call_llm(
        messages=[{"role": "user", "content": prompt}],
        system="You are a helpful HR assistant that reviews leave requests for conflicts and balance issues.",
        max_tokens=400,
    )
    return result["content"]


# ═══════════════════════════════════════════════════════════════════════════════
# 3. PERFORMANCE GOAL SUGGESTER AGENT
# ═══════════════════════════════════════════════════════════════════════════════

async def suggest_smart_goals(
    employee_name: str,
    role: str,
    department: str,
    goals_text: str,
) -> str:
    """
    Reviews employee's written goals and suggests SMART improvements.
    """
    prompt = f"""
You are a performance management expert. Review the goals written by {employee_name} 
({role} in {department} department) and improve them to be SMART goals 
(Specific, Measurable, Achievable, Relevant, Time-bound).

Original Goals:
{goals_text}

Return:
1. Improved version of each goal
2. Brief explanation of what was improved
3. Keep language professional but simple
"""
    result = await call_llm(
        messages=[{"role": "user", "content": prompt}],
        system="You are a performance management coach who helps employees write better SMART goals.",
        max_tokens=800,
    )
    return result["content"]


# ═══════════════════════════════════════════════════════════════════════════════
# 4. ATTENDANCE ANOMALY DETECTOR AGENT
# ═══════════════════════════════════════════════════════════════════════════════

async def detect_attendance_anomalies(
    employee_name: str,
    attendance_records: list[dict],
) -> str:
    """
    Analyzes 1-3 months of attendance and flags unusual patterns.
    """
    prompt = f"""
You are an HR analytics assistant. Analyze the attendance records of {employee_name} 
and identify any unusual patterns or concerns.

Attendance Data (last few months):
{json.dumps(attendance_records, indent=2, default=str)}

Look for:
1. Frequent late arrivals (especially on specific days)
2. Consecutive absences
3. Pattern of leave before/after holidays
4. Declining total hours trend
5. Frequent auto clock-outs (forgot to clock out)

Provide a brief, professional summary with specific examples from the data.
Flag severity as: ✅ Normal / ⚠️ Minor Concern / 🔴 Needs Attention
"""
    result = await call_llm(
        messages=[{"role": "user", "content": prompt}],
        system="You are an HR analytics assistant that identifies attendance patterns and anomalies.",
        max_tokens=600,
    )
    return result["content"]


# ═══════════════════════════════════════════════════════════════════════════════
# 5. ONBOARDING ASSISTANT AGENT
# ═══════════════════════════════════════════════════════════════════════════════

async def onboarding_assistant(
    employee_name: str,
    role: str,
    pending_tasks: list[dict],
    question: str,
) -> str:
    """
    Helps new employees understand their onboarding tasks.
    Answers questions about what to do next.
    """
    pending_list = "\n".join([f"- {t['title']}: {t.get('description', '')}" for t in pending_tasks])

    prompt = f"""
You are a friendly onboarding assistant for a university. Help {employee_name} ({role}) 
with their onboarding process.

Their pending onboarding tasks:
{pending_list if pending_list else "All tasks completed!"}

Employee's question: {question}

Answer helpfully and clearly. If the question is about a specific task, 
explain exactly what they need to do and where to go. Keep it friendly and concise.
"""
    result = await call_llm(
        messages=[{"role": "user", "content": prompt}],
        system="You are a friendly university onboarding assistant helping new employees settle in.",
        max_tokens=400,
    )
    return result["content"]


# ═══════════════════════════════════════════════════════════════════════════════
# 6. HR REPORT SUMMARIZER AGENT
# ═══════════════════════════════════════════════════════════════════════════════

async def summarize_hr_report(report_type: str, report_data: dict) -> str:
    """
    Takes any report data and creates a concise executive summary for HR.
    """
    prompt = f"""
You are an HR analytics expert. Summarize this {report_type} report for senior HR management.

Report Data:
{json.dumps(report_data, indent=2, default=str)}

Provide:
1. 3-5 key highlights
2. Any concerns or red flags
3. One actionable recommendation
Keep it under 200 words, professional tone.
"""
    result = await call_llm(
        messages=[{"role": "user", "content": prompt}],
        system="You are an HR analytics expert who creates concise executive summaries.",
        max_tokens=500,
    )
    return result["content"]