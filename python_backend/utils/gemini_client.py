"""
Gemini AI Client - Mockable wrapper for testing.
Uses Gemma 3 27B IT model for all AI operations.
"""
import asyncio
from functools import partial
from google import genai
from config import GEMINI_API_KEY, GEMINI_MODEL


class GeminiClient:
    """Wrapper around Google GenAI SDK. Mock this in tests."""

    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model or GEMINI_MODEL
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def _sync_generate(self, contents, config=None):
        """Synchronous call to the API (runs in thread pool for async)."""
        kwargs = {"model": self.model, "contents": contents}
        if config:
            kwargs["config"] = config
        response = self.client.models.generate_content(**kwargs)
        return response.text or ""

    async def generate(self, prompt: str, system_instruction: str = None) -> str:
        """Generate text from a prompt (runs in thread pool to avoid blocking)."""
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        contents = [{"role": "user", "parts": [{"text": full_prompt}]}]

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, partial(self._sync_generate, contents)
        )
        return result or "No response generated."

    async def generate_with_file(self, prompt: str, file_data: str, mime_type: str) -> str:
        """Generate text from a prompt with an inline file (e.g., PDF resume).
        Gemma 3 27B supports multimodal input including PDFs."""
        contents = [{
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": mime_type, "data": file_data}},
                {"text": prompt},
            ],
        }]

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, partial(self._sync_generate, contents)
        )
        return result or ""


# Singleton instance
gemini = GeminiClient()
