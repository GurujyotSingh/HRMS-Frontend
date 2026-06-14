"""
LLM Client
----------
Primary:  Groq (Llama 3 70b)
Rewritten for maximum robustness using official SDK and tenacity retries.
"""

import os
import json
import asyncio
from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from groq import AsyncGroq
from groq import APIConnectionError, RateLimitError, APIStatusError
from app.core.config import settings

GROQ_API_KEY = settings.GROQ_API_KEY
GROQ_MODEL = "llama-3.3-70b-versatile"

# Initialize AsyncGroq client
if GROQ_API_KEY:
    client = AsyncGroq(api_key=GROQ_API_KEY)
else:
    client = None

# ── Blocked command keywords ──────────────────────────────────────────────────
BLOCKED_KEYWORDS = [
    "kill", "drop", "truncate", "destroy", "wipe", "purge",
    "terminate", "nuke", "erase all", "delete all",
]

def _contains_blocked_keyword(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in BLOCKED_KEYWORDS)


# ── Destructive intent detection ──────────────────────────────────────────────
DESTRUCTIVE_KEYWORDS = [
    "delete", "remove", "reject", "fire", "offboard",
    "update", "change", "edit", "modify", "set",
]

def _is_destructive(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in DESTRUCTIVE_KEYWORDS)


# ── Groq call with Retries ───────────────────────────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((APIConnectionError, RateLimitError)),
    reraise=True
)
async def _call_groq_with_retry(
    messages: list[dict],
    system: str = "",
    tools: list[dict] | None = None,
    max_tokens: int = 2000,
) -> dict:
    if not client:
        raise ValueError("GROQ_API_KEY not set")

    full_messages = []
    if system:
        full_messages.append({"role": "system", "content": system})
    full_messages.extend(messages)

    kwargs = {
        "model": GROQ_MODEL,
        "messages": full_messages,
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }

    if tools:
        # Convert simple schema to Groq tool format
        kwargs["tools"] = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("input_schema", {"type": "object", "properties": {}})
                }
            }
            for t in tools
        ]
        kwargs["tool_choice"] = "auto"

    response = await client.chat.completions.create(**kwargs)
    
    choice = response.choices[0]
    message = choice.message
    content = message.content or ""
    
    tool_use = None
    if message.tool_calls:
        tool_call = message.tool_calls[0]
        try:
            args = json.loads(tool_call.function.arguments)
        except Exception:
            args = {}
        tool_use = {
            "name": tool_call.function.name,
            "input": args,
            "id": tool_call.id
        }

    return {
        "content": content.strip(),
        "tool_use": tool_use,
        "tokens": response.usage.total_tokens if response.usage else 0,
        "llm": "groq",
    }


# ── Main entry point ────────────────────────────────────────────

async def call_llm(
    messages: list[dict],
    system: str = "",
    tools: list[dict] | None = None,
    max_tokens: int = 2000,
) -> dict:
    """
    Call Groq API safely, handling all possible errors.
    """
    # Safety check
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user" and isinstance(m.get("content"), str)), ""
    )
    if _contains_blocked_keyword(last_user_msg):
        return {
            "content": "I apologize, but I am programmed to reject commands involving deletion, removal, or destructive actions for data security reasons.",
            "tool_use": None,
            "tokens": 0,
            "llm": "groq"
        }

    try:
        return await _call_groq_with_retry(messages, system, tools, max_tokens)
    except RateLimitError:
        return {
            "content": "The system is currently busy (rate limited). Please try asking again in a few moments.",
            "tool_use": None,
            "tokens": 0,
            "llm": "groq"
        }
    except APIConnectionError:
        return {
            "content": "I encountered a network communication error with the AI engine. Please try again.",
            "tool_use": None,
            "tokens": 0,
            "llm": "groq"
        }
    except APIStatusError as e:
        print(f"[LLM Error] Status: {e.status_code}, Message: {e.message}")
        return {
            "content": "I encountered an API error. Please try again later.",
            "tool_use": None,
            "tokens": 0,
            "llm": "groq"
        }
    except Exception as e:
        print(f"[LLM Exception] {str(e)}")
        return {
            "content": "I am currently unable to process your request due to an internal error. Please try again later.",
            "tool_use": None,
            "tokens": 0,
            "llm": "groq"
        }