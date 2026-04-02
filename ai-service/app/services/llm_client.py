from __future__ import annotations

from typing import Any, Dict

from app.services.gemini_client import GeminiClient
from app.services.groq_client import GroqClient


class DefaultLlmClient:
    def __init__(self) -> None:
        self.groq = GroqClient()
        self.gemini = GeminiClient()

    @property
    def provider(self) -> str:
        if self.groq.is_configured():
            return "groq"
        if self.gemini.is_configured():
            return "gemini"
        return "none"

    @property
    def model(self) -> str:
        if self.provider == "groq":
            return self.groq.model
        if self.provider == "gemini":
            return self.gemini.model
        return "none"

    def is_configured(self) -> bool:
        return self.provider != "none"

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        if self.provider == "groq":
            return await self.groq.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
        if self.provider == "gemini":
            return await self.gemini.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
        raise RuntimeError("No LLM provider configured.")

    async def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> str:
        if self.provider == "groq":
            return await self.groq.generate_text(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
        if self.provider == "gemini":
            return await self.gemini.generate_text(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
        raise RuntimeError("No LLM provider configured.")
