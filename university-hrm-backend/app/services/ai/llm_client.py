"""
LLM Client
----------
Primary:  Groq (Llama 3 70b)

Set these in your .env:
    GROQ_API_KEY=gsk-...
"""

import os
import json
import httpx
from typing import Any
from app.core.config import settings

GROQ_API_KEY = settings.GROQ_API_KEY

GROQ_MODEL = "llama-3.3-70b-versatile"

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


# ── Groq call ───────────────────────────────────────────────────────────────

async def call_groq(
    messages: list[dict],
    system: str = "",
    tools: list[dict] | None = None,
    max_tokens: int = 2000,
) -> dict:
    """
    Call Groq API using OpenAI compatibility layer.
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set")

    full_messages = []
    if system:
        full_messages.append({"role": "system", "content": system})
    full_messages.extend(messages)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    body: dict[str, Any] = {
        "model": GROQ_MODEL,
        "messages": full_messages,
        "max_tokens": max_tokens,
    }
    
    if tools:
        # Map Anthropic tools schema to OpenAI compatibility format
        body["tools"] = [
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
        body["tool_choice"] = "auto"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()

    message = data["choices"][0]["message"]
    content = message.get("content") or ""
    
    tool_use = None
    if message.get("tool_calls"):
        tool_call = message["tool_calls"][0]
        tool_use = {
            "name": tool_call["function"]["name"],
            "input": json.loads(tool_call["function"]["arguments"]),
            "id": tool_call["id"]
        }

    tokens = data.get("usage", {}).get("total_tokens", 0)

    return {
        "content": content.strip(),
        "tool_use": tool_use,
        "tokens": tokens,
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
    Call Groq exclusively.
    """
    # Safety check
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    if _contains_blocked_keyword(last_user_msg):
        raise ValueError(
            "I apologize, but I am programmed to reject commands involving deletion, removal, or destructive actions for data security reasons."
        )

    try:
        return await call_groq(messages, system, tools, max_tokens)
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        print(f"[LLM] Groq HTTP Error {status}: {e.response.text}")
        if status == 429:
            raise RuntimeError("The system is currently busy (rate limited). Please try asking again in a few moments.")
        raise RuntimeError(f"I encountered a communication error with the AI engine. Please try again.")
    except Exception:
        raise RuntimeError("I am currently unable to process your request due to an internal timeout. Please try again later.")