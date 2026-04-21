from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


class LlmUnavailable(RuntimeError):
    pass


def selected_provider() -> str | None:
    provider = (settings.llm_provider or "auto").strip().lower()
    if provider == "auto":
        if settings.openai_api_key:
            return "openai"
        if settings.gemini_api_key:
            return "gemini"
        if settings.ollama_model:
            return "ollama"
        return None
    if provider in {"openai", "gemini", "ollama"}:
        return provider
    return None


def is_llm_configured() -> bool:
    return selected_provider() is not None


def generate_text(system_prompt: str, user_prompt: str) -> str:
    provider = selected_provider()
    if provider == "openai":
        return _openai_text(system_prompt, user_prompt)
    if provider == "gemini":
        return _gemini_generate(system_prompt, user_prompt, expect_json=False)
    if provider == "ollama":
        return _ollama_chat(system_prompt, user_prompt, expect_json=False)
    raise LlmUnavailable("No LLM provider configured")


def generate_json(system_prompt: str, user_prompt: str) -> Any:
    provider = selected_provider()
    if provider == "openai":
        return _openai_json(system_prompt, user_prompt)
    if provider == "gemini":
        payload = _gemini_generate(system_prompt, user_prompt, expect_json=True)
        return json.loads(payload or "{}")
    if provider == "ollama":
        payload = _ollama_chat(system_prompt, user_prompt, expect_json=True)
        return json.loads(payload or "{}")
    raise LlmUnavailable("No LLM provider configured")


def _openai_text(system_prompt: str, user_prompt: str) -> str:
    if not settings.openai_api_key:
        raise LlmUnavailable("OPENAI_API_KEY is required")

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return (response.choices[0].message.content or "").strip()


def _openai_json(system_prompt: str, user_prompt: str) -> Any:
    if not settings.openai_api_key:
        raise LlmUnavailable("OPENAI_API_KEY is required")

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content or "{}")


def _gemini_generate(system_prompt: str, user_prompt: str, *, expect_json: bool) -> str:
    if not settings.gemini_api_key:
        raise LlmUnavailable("GEMINI_API_KEY is required")

    model = settings.gemini_model or "gemini-2.5-flash"
    endpoint = settings.gemini_base_url.rstrip("/") + f"/models/{model}:generateContent"
    body: dict[str, Any] = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}],
            }
        ],
    }
    if expect_json:
        body["generationConfig"] = {"responseMimeType": "application/json"}

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.gemini_api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise LlmUnavailable(f"Gemini request failed: {exc}") from exc

    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(str(part.get("text", "")) for part in parts).strip()


def _ollama_chat(system_prompt: str, user_prompt: str, *, expect_json: bool) -> str:
    model = settings.ollama_model or "qwen2.5:7b"
    endpoint = settings.ollama_base_url.rstrip("/") + "/api/chat"
    body: dict[str, Any] = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if expect_json:
        body["format"] = "json"

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise LlmUnavailable(f"Ollama request failed: {exc}") from exc

    return str(data.get("message", {}).get("content", "")).strip()
