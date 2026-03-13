class GeminiClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    async def generate(self, prompt: str) -> str:
        # TODO: Integrate Gemini SDK.
        return "[placeholder response]"
