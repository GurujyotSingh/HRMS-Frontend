"""
HR Command Agent — fully fixed, all lazy-load issues resolved
"""

import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai.llm_client import call_llm
from app.db.models.chat import ChatSession, ChatMessage


HR_SYSTEM_PROMPT = """
You are an intelligent HR assistant for a University HRM system.
You help HR staff manage employees, leaves, attendance, payroll, onboarding, and performance.

RULES:
1. You are a READ-ONLY informational assistant. You CANNOT mutate, update, or delete any data.
2. DO NOT provide highly sensitive information like salaries, financial data, or sensitive performance ratings to standard users. Provide generic/public information (names, IDs, departments, leave dates, onboarding status).
3. Be concise and professional. Use bullet points for lists.
4. If you don't have enough info, ask for it.
6. Always use the available tools to fetch real data — never make up numbers.
7. When displaying employee data, always show name + ID together.
8. NEVER guess or hallucinate integer IDs (like department_id or employee_id). If the user provides a string (e.g. a name), DO NOT pass it as an integer ID parameter. Call tools without optional parameters if you don't know the exact numeric ID.

DATABASE SCHEMA:
- users (id, employee_id, email, first_name, last_name, role, department_id, join_date)
- departments (id, name, code)
- leave_requests (id, employee_id, leave_type, from_date, to_date, reason, status)
- leave_balances (id, employee_id, year, annual_total, sick_used, etc)
- attendance (id, employee_id, date, check_in, check_out, is_late)
- payslips (id, employee_id, month, year, gross_salary, net_salary, status)
- appraisal_cycles (id, title, year, status)
- performance_goals (id, employee_id, cycle_id, goals_text, status, final_rating)
"""

HR_TOOLS = [
    {
        "name": "get_pending_leaves",
        "description": "Get all pending leave requests across all departments",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_employee_list",
        "description": "Get list of all employees, optionally filtered by department_id or role",
        "input_schema": {
            "type": "object",
            "properties": {
                "department_id": {"type": "integer"},
                "role": {"type": "string"},
            },
        },
    },
    {
        "name": "get_attendance_today",
        "description": "Get today's clock-in summary for all employees",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_attendance_report",
        "description": "Get monthly attendance report for a specific employee",
        "input_schema": {
            "type": "object",
            "properties": {
                "employee_id": {"type": "integer"},
                "month": {"type": "integer"},
                "year": {"type": "integer"},
            },
            "required": ["employee_id", "month", "year"],
        },
    },
    {
        "name": "get_onboarding_status",
        "description": "Get onboarding completion status for all employees",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_performance_overview",
        "description": "Get performance goals overview",
        "input_schema": {
            "type": "object",
            "properties": {
                "cycle_id": {"type": "integer"},
            },
        },
    },
    {
        "name": "get_employee_detail",
        "description": "Get full profile of a specific employee",
        "input_schema": {
            "type": "object",
            "properties": {"employee_id": {"type": "string"}},
            "required": ["employee_id"],
        },
    },
]

async def execute_tool(tool_name: str, tool_input: dict, db: AsyncSession, hr_user_id: str) -> str:
    """Execute tool — ALL queries use selectinload, no lazy loading anywhere."""
    try:
        if tool_name == "get_pending_leaves":
            from app.db.models.leave_request import LeaveRequest

            result = await db.execute(
                select(LeaveRequest)
                .options(selectinload(LeaveRequest.employee))
                .where(LeaveRequest.status == "PENDING")
            )
            leaves = result.scalars().all()
            if not leaves:
                return "No pending leave requests found."
            lines = [f"Found {len(leaves)} pending leave(s):"]
            for l in leaves:
                emp_name = f"{l.employee.first_name} {l.employee.last_name}" if l.employee else f"Emp {l.employee_id}"
                lines.append(
                    f"- Leave ID {l.id}: {emp_name}, {l.leave_type}, "
                    f"{l.from_date.strftime('%Y-%m-%d')} to {l.to_date.strftime('%Y-%m-%d')}, Reason: {l.reason}"
                )
            return "\n".join(lines)

        elif tool_name == "get_employee_list":
            from app.db.models.user import User

            query = (
                select(User)
            )
            if tool_input.get("department_id"):
                query = query.where(User.department_id == str(tool_input["department_id"]))
            if tool_input.get("role"):
                query = query.where(User.role == tool_input["role"].upper())

            result = await db.execute(query)
            employees = result.scalars().all()
            if not employees:
                return "No employees found."
            lines = [f"Found {len(employees)} employee(s):"]
            for e in employees:
                lines.append(f"- ID {e.id}: {e.first_name} {e.last_name} | {e.role} | Dept: {e.department_id or 'None'}")
            return "\n".join(lines)

        elif tool_name == "get_attendance_today":
            from app.services.attendance_service import get_all_attendance_today
            records = await get_all_attendance_today(db)
            if not records:
                return "No clock-ins recorded today."
            lines = [f"{len(records)} employee(s) clocked in today:"]
            for r in records:
                clock_out = r.clock_out.strftime("%H:%M") if r.clock_out else "Not clocked out"
                late = " ⚠️ LATE" if r.is_late else ""
                lines.append(
                    f"- Employee {r.employee_id}: "
                    f"In {r.clock_in.strftime('%H:%M') if r.clock_in else 'N/A'}, "
                    f"Out {clock_out}{late}"
                )
            return "\n".join(lines)

        elif tool_name == "get_attendance_report":
            from app.services.attendance_service import get_monthly_summary
            summary = await get_monthly_summary(
                db, tool_input["employee_id"], tool_input["month"], tool_input["year"]
            )
            return (
                f"Attendance for Employee {tool_input['employee_id']} "
                f"— {tool_input['month']}/{tool_input['year']}:\n"
                f"- Present: {summary.total_days_present} days\n"
                f"- Absent: {summary.total_days_absent} days\n"
                f"- Late: {summary.total_days_late} days\n"
                f"- On Leave: {summary.total_days_on_leave} days\n"
                f"- Total Hours: {summary.total_hours_worked}h"
            )

        elif tool_name == "get_onboarding_status":
            from app.services.reports_service import onboarding_report
            report = await onboarding_report(db)
            lines = [
                f"Onboarding Status (Total: {report.total}):",
                f"- Completed: {report.completed}",
                f"- In Progress: {report.in_progress}",
                "\nDetails:",
            ]
            for d in report.details:
                lines.append(f"  • {d['employee_name']} (ID {d['employee_id']}): {d['status']}")
            return "\n".join(lines)

        elif tool_name == "get_performance_overview":
            from app.services.performance_service import get_all_goals
            from collections import Counter
            goals = await get_all_goals(db, tool_input.get("cycle_id"))
            if not goals:
                return "No performance goals found."
            status_counts = Counter(g.status for g in goals)
            lines = [f"Performance Goals Overview ({len(goals)} total):"]
            for status, count in status_counts.items():
                lines.append(f"- {status}: {count}")
            return "\n".join(lines)

        elif tool_name == "get_employee_detail":
            from app.db.models.user import User

            emp_id_val = str(tool_input["employee_id"])
            
            query = select(User)
            if emp_id_val.isdigit():
                query = query.where(User.id == int(emp_id_val))
            else:
                query = query.where(User.employee_id == emp_id_val)
                
            result = await db.execute(query.limit(1))
            emp = result.scalar_one_or_none()
            if not emp:
                return f"No employee found with ID {tool_input['employee_id']}"
                
            return (
                f"Employee: {emp.first_name} {emp.last_name}\n"
                f"- ID: {emp.id} | Code: {emp.employee_id}\n"
                f"- Role: {emp.role}\n"
                f"- Department ID: {emp.department_id or 'Not assigned'}\n"
                f"- Joined: {emp.join_date}\n"
                f"- Email: {emp.email}"
            )

        return f"Unknown tool: {tool_name}"
    except Exception as e:
        print(f"[Tool Error] {tool_name}: {str(e)}")
        return f"Error executing tool {tool_name}: {str(e)}"

async def get_or_create_session(
    db: AsyncSession, user_id: str, session_id: int | None = None
) -> ChatSession:
    if session_id:
        result = await db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if session:
            return session

    # Create new session
    session = ChatSession(user_id=user_id, status="ACTIVE")
    db.add(session)
    await db.commit()

    # Re-fetch with messages loaded
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session.id)
    )
    return result.scalar_one()


async def _save_message(
    db: AsyncSession,
    session_id: int,
    role: str,
    content: str,
    agent: str = "hr_command",
    llm_used: str | None = None,
    tokens: int | None = None,
    pending: str | None = None,
) -> ChatMessage:
    msg = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        agent=agent,
        llm_used=llm_used,
        tokens_used=tokens,
        pending_confirmation=pending,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def run_hr_agent(
    db: AsyncSession,
    user_message: str,
    hr_user_id: str,
    session_id: int | None = None,
    confirm: bool = False,
) -> dict:
    session = await get_or_create_session(db, hr_user_id, session_id)

    # Save user message
    await _save_message(db, session.id, "user", user_message)

    # Auto-title
    if len(session.messages) <= 1 and not session.title:
        session.title = user_message[:80]
        await db.commit()

    # Build history (last 19 messages from DB)
    history = [
        {"role": m.role, "content": m.content}
        for m in session.messages[-19:]
    ]
    
    # Manually append the new user message since the async DB object hasn't refreshed relationships
    history.append({"role": "user", "content": user_message})

    # Call LLM
    try:
        llm_result = await call_llm(
            messages=history,
            system=HR_SYSTEM_PROMPT,
            tools=HR_TOOLS,
            max_tokens=2000,
        )
    except ValueError as blocked:
        msg = str(blocked)
        await _save_message(db, session.id, "assistant", msg)
        return {
            "response": msg,
            "session_id": str(session.id),
            "requires_confirmation": False,
            "pending_action": None,
            "llm_used": "blocked",
        }
    except RuntimeError as e:
        err = str(e)
        await _save_message(db, session.id, "assistant", err)
        return {
            "response": err,
            "session_id": str(session.id),
            "requires_confirmation": False,
            "pending_action": None,
            "llm_used": "error",
        }

    # Handle tool_use
    if llm_result.get("tool_use"):
        tool_name = llm_result["tool_use"]["name"]
        tool_input = llm_result["tool_use"]["input"]

        # Directly execute all tools with no confirmation
        try:
            tool_result = await execute_tool(tool_name, tool_input, db, hr_user_id)
        except Exception as e:
            tool_result = f"Error executing {tool_name}: {str(e)}"

        # Get natural language summary from Claude/Groq
        summary_history = history + [
            {"role": "assistant", "content": f"[Tool result from {tool_name}]:\n{tool_result}"},
            {"role": "user", "content": "Summarize this clearly and concisely for the HR manager."},
        ]
        try:
            final = await call_llm(messages=summary_history, system=HR_SYSTEM_PROMPT, max_tokens=800)
            response_text = final["content"] or tool_result
        except Exception:
            response_text = tool_result

        await _save_message(
            db, session.id, "assistant", response_text,
            llm_used=llm_result["llm"], tokens=llm_result.get("tokens")
        )
        return {
            "response": response_text,
            "session_id": str(session.id),
            "requires_confirmation": False,
            "pending_action": None,
            "llm_used": llm_result["llm"],
        }

    # Plain text response
    response_text = llm_result["content"]
    # Provide a fallback if LLM returned completely empty string natively
    if not response_text or response_text.strip() == "":
        response_text = "I have noted that. Can I help with anything else?"

    await _save_message(
        db, session.id, "assistant", response_text,
        llm_used=llm_result["llm"], tokens=llm_result.get("tokens")
    )
    return {
        "response": response_text,
        "session_id": str(session.id),
        "requires_confirmation": False,
        "pending_action": None,
        "llm_used": llm_result["llm"],
    }