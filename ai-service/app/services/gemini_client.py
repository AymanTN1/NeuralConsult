from __future__ import annotations

import base64
import json
import os
from typing import Any, Dict, Optional

import httpx


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.base_url = os.getenv("GEMINI_API_BASE_URL", "https://generativelanguage.googleapis.com")

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
            response_mime_type="text/plain",
        )
        text = self._extract_text(payload)
        if not text:
            raise RuntimeError("Gemini returned an empty text response.")
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
            response_mime_type="application/json",
        )
        text = self._extract_text(payload)
        if not text:
            raise RuntimeError("Gemini returned an empty JSON response.")

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Gemini returned invalid JSON: {text[:300]}") from exc

    async def generate_json_with_inline_data(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        inline_data: bytes,
        mime_type: str,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        payload = await self._request_payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            response_mime_type="application/json",
            inline_data=inline_data,
            inline_mime_type=mime_type,
        )
        text = self._extract_text(payload)
        if not text:
            raise RuntimeError("Gemini returned an empty multimodal JSON response.")
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Gemini returned invalid multimodal JSON: {text[:300]}") from exc

    async def _request_payload(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        response_mime_type: str,
        inline_data: bytes | None = None,
        inline_mime_type: str | None = None,
    ) -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        url = (
            f"{self.base_url}/v1beta/models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )
        parts: list[dict[str, Any]] = [{"text": user_prompt}]
        if inline_data:
            parts.append({
                "inline_data": {
                    "mime_type": inline_mime_type or "application/octet-stream",
                    "data": base64.b64encode(inline_data).decode("utf-8"),
                }
            })

        body = {
            "system_instruction": {
                "parts": [{"text": system_prompt}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": parts,
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": response_mime_type,
            },
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(url, json=body)
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                detail = response.text[:1000] if response.text else "No response body."
                raise RuntimeError(
                    f"Gemini request failed with status {response.status_code}: {detail}"
                ) from exc
            return response.json()

    def _extract_text(self, payload: Dict[str, Any]) -> Optional[str]:
        candidates = payload.get("candidates") or []
        if not candidates:
            return None
        content = candidates[0].get("content") or {}
        parts = content.get("parts") or []
        texts = [part.get("text", "") for part in parts if part.get("text")]
        return "\n".join(texts).strip() or None
