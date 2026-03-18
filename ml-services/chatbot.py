"""
NutriAI - chatbot.py (simplified)
==================================
Lightweight chatbot using HuggingFace Inference API directly.
Removed LangGraph/RAG complexity that was causing hangs on Windows.
Falls back to simple HTTP calls — no sentence-transformers, no blocking.
"""

from __future__ import annotations

import os
import json
import logging
import httpx
from datetime import date
from typing import Optional, AsyncIterator
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=False)

log = logging.getLogger("nutriai.chatbot")

_HF_API_URL = "https://router.huggingface.co/v1/chat/completions"
_HF_MODELS  = [
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-32B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
]

# In-memory conversation store (thread_id → messages list)
_conversations: dict[str, list[dict]] = {}


def _build_system_prompt(user_profile: dict) -> str:
    name       = user_profile.get("name", "there")
    goal       = user_profile.get("goal", "maintain")
    cal_target = user_profile.get("target_calories") or user_profile.get("calories") or 2000
    pro_target = user_profile.get("target_protein_g") or user_profile.get("protein_g") or 120
    diet       = user_profile.get("diet", "non_veg")
    weight     = user_profile.get("weight_kg", "")
    activity   = user_profile.get("activity_level", "")

    goal_map = {
        "lose_weight" : "losing weight (calorie deficit)",
        "gain_weight" : "gaining weight (calorie surplus)",
        "maintain"    : "maintaining weight",
        "build_muscle": "building muscle (high protein)",
        "lose"        : "losing weight",
        "gain"        : "gaining weight",
    }
    goal_desc = goal_map.get(goal, goal)

    return f"""You are NutriAI, a friendly and knowledgeable nutrition assistant for Indian college students.

USER PROFILE:
- Name: {name}
- Goal: {goal_desc}
- Daily targets: {cal_target} kcal, {pro_target}g protein
- Diet: {diet}
- Weight: {weight}kg
- Activity: {activity}

INSTRUCTIONS:
- Be warm, practical and concise (3-5 sentences usually).
- Address the user by name occasionally.
- Give advice based on their actual targets.
- Suggest real Indian foods — dal, sabzi, roti, rice, paneer, eggs, etc.
- Give specific calorie/macro numbers when asked.
- Today's date: {date.today().isoformat()}"""


async def chat(
    user_id     : str,
    message     : str,
    user_profile: dict,
    thread_id   : Optional[str] = None,
) -> str:
    thread_id = thread_id or user_id
    hf_key    = os.getenv("HF_API_KEY")

    # Build conversation history
    if thread_id not in _conversations:
        _conversations[thread_id] = []

    history = _conversations[thread_id]
    history.append({"role": "user", "content": message})

    system_prompt = _build_system_prompt(user_profile)
    messages = [{"role": "system", "content": system_prompt}] + history[-20:]  # last 20 msgs

    # Try HuggingFace models
    if hf_key:
        headers = {"Authorization": f"Bearer {hf_key}", "Content-Type": "application/json"}
        for model in _HF_MODELS:
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(
                        _HF_API_URL,
                        headers=headers,
                        json={
                            "model"      : model,
                            "messages"   : messages,
                            "temperature": 0.4,
                            "max_tokens" : 400,
                        }
                    )
                if resp.status_code in (429, 503):
                    log.warning(f"{model} rate limited, trying next")
                    continue
                if resp.status_code == 200:
                    reply = resp.json()["choices"][0]["message"]["content"].strip()
                    history.append({"role": "assistant", "content": reply})
                    _conversations[thread_id] = history[-40:]  # keep last 40
                    log.info(f"Chat response via {model}")
                    return reply
            except Exception as e:
                log.warning(f"{model} failed: {e}")
                continue

    # Fallback if no HF key or all models failed
    log.warning("All HF models failed — using fallback response")
    fallback = (
        f"Hi {user_profile.get('name', 'there')}! "
        "I'm having trouble connecting to my AI backend right now. "
        "Please make sure HF_API_KEY is set in your .env file and try again."
    )
    return fallback


async def stream_chat(
    user_id     : str,
    message     : str,
    user_profile: dict,
    thread_id   : Optional[str] = None,
) -> AsyncIterator[str]:
    """Stream chat — yields full response as one chunk (simplification)."""
    response = await chat(user_id, message, user_profile, thread_id)
    yield response


async def get_graph():
    """Stub for compatibility with main.py startup."""
    log.info("Chatbot ready (lightweight mode) ✅")
    return True


async def get_chat_history(user_id: str, thread_id: Optional[str] = None, limit: int = 20) -> list[dict]:
    thread_id = thread_id or user_id
    history   = _conversations.get(thread_id, [])
    result    = []
    for m in history[-limit:]:
        if m["role"] in ("user", "assistant"):
            result.append({"role": m["role"], "content": m["content"]})
    return result


async def clear_chat_history(user_id: str, thread_id: Optional[str] = None) -> bool:
    thread_id = thread_id or user_id
    _conversations.pop(thread_id, None)
    return True
