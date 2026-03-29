"""
LLM Client
----------
Primary:  Anthropic Claude (claude-sonnet-4-6)
Fallback: OpenAI GPT-4o  (if Claude fails or is rate-limited)

Set these in your .env:
    ANTHROPIC_API_KEY=sk-ant-...
    OPENAI_API_KEY=sk-...         # optional, only needed for fallback
"""

import os
import json
import httpx
from typing import Any
from app.core.config import settings


from app.core.config import settings
ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY
OPENAI_API_KEY = settings.OPENAI_API_KEY

CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
OPENAI_MODEL = "gpt-4o"

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


# ── Claude call ───────────────────────────────────────────────────────────────

async def call_claude(
    messages: list[dict],
    system: str = "",
    tools: list[dict] | None = None,
    max_tokens: int = 2000,
) -> dict:
    """
    Call Claude API.
    Returns: {"content": str, "tool_use": dict|None, "tokens": int, "llm": "claude"}
    """
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    body: dict[str, Any] = {
        "model": CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        body["system"] = system
    if tools:
        body["tools"] = tools

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()

    text_content = ""
    tool_use = None

    for block in data.get("content", []):
        if block.get("type") == "text":
            text_content += block.get("text", "")
        elif block.get("type") == "tool_use":
            tool_use = {"name": block["name"], "input": block["input"], "id": block["id"]}

    return {
        "content": text_content.strip(),
        "tool_use": tool_use,
        "tokens": data.get("usage", {}).get("output_tokens", 0),
        "llm": "claude",
    }


# ── OpenAI fallback ───────────────────────────────────────────────────────────

async def call_openai(
    messages: list[dict],
    system: str = "",
    max_tokens: int = 2000,
) -> dict:
    """
    OpenAI GPT-4o fallback (no tool_use — used for text-only responses).
    Returns: {"content": str, "tool_use": None, "tokens": int, "llm": "openai"}
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set — cannot use fallback")

    full_messages = []
    if system:
        full_messages.append({"role": "system", "content": system})
    full_messages.extend(messages)

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": OPENAI_MODEL,
        "messages": full_messages,
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    tokens = data.get("usage", {}).get("completion_tokens", 0)

    return {"content": content, "tool_use": None, "tokens": tokens, "llm": "openai"}


# ── Main entry point with fallback ────────────────────────────────────────────

async def call_llm(
    messages: list[dict],
    system: str = "",
    tools: list[dict] | None = None,
    max_tokens: int = 2000,
) -> dict:
    """
    Try Claude first. If it fails, fall back to OpenAI.
    Raises ValueError if message contains blocked keywords.
    """
    # Safety check
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    if _contains_blocked_keyword(last_user_msg):
        raise ValueError(
            "⛔ This command contains a restricted keyword and cannot be executed. "
            "If you need to perform a bulk operation, please contact the system administrator."
        )

    try:
        return await call_claude(messages, system, tools, max_tokens)
    except Exception as claude_error:
        print(f"[LLM] Claude failed: {claude_error}. Falling back to OpenAI...")
        try:
            return await call_openai(messages, system, max_tokens=max_tokens)
        except Exception as openai_error:
            raise RuntimeError(
                f"Both Claude and OpenAI failed.\nClaude: {claude_error}\nOpenAI: {openai_error}"
            )