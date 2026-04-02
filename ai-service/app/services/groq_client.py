from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

import httpx


class GroqClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.base_url = os.getenv("GROQ_API_BASE_URL", "https://api.groq.com/openai/v1")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> str:
        payload = await self._request_payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            json_mode=False,
        )
        text = self._extract_text(payload)
        if not text:
            raise RuntimeError("Groq returned an empty text response.")
        return text

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        payload = await self._request_payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            json_mode=True,
        )
        text = self._extract_text(payload)
        if not text:
            raise RuntimeError("Groq returned an empty JSON response.")
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Groq returned invalid JSON: {text[:300]}") from exc

    async def _request_payload(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        json_mode: bool,
    ) -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")

        url = f"{self.base_url}/chat/completions"
        body: Dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": max(float(temperature), 1e-8),
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, headers=headers, json=body)
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                detail = response.text[:1000] if response.text else "No response body."
                raise RuntimeError(
                    f"Groq request failed with status {response.status_code}: {detail}"
                ) from exc
            return response.json()

    def _extract_text(self, payload: Dict[str, Any]) -> Optional[str]:
        choices = payload.get("choices") or []
        if not choices:
            return None
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content.strip() or None
        return None
