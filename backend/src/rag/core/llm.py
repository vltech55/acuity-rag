from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache
from typing import Any

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from rag.core.config import settings
from rag.core.logging import get_logger

log = get_logger(__name__)


class LLMError(Exception):
    pass


@lru_cache(maxsize=1)
def anthropic_client() -> AsyncAnthropic:
    if not settings.anthropic_api_key:
        raise LLMError("ANTHROPIC_API_KEY not set")
    return AsyncAnthropic(api_key=settings.anthropic_api_key)


@lru_cache(maxsize=1)
def openai_client() -> AsyncOpenAI:
    if not settings.openai_api_key:
        raise LLMError("OPENAI_API_KEY not set")
    return AsyncOpenAI(api_key=settings.openai_api_key)


_RETRY = AsyncRetrying(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=1, max=20),
    retry=retry_if_exception_type((TimeoutError, ConnectionError)),
    reraise=True,
)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = openai_client()
    async for attempt in _RETRY:
        with attempt:
            resp = await client.embeddings.create(
                model=settings.openai_embedding_model,
                input=texts,
            )
            return [d.embedding for d in resp.data]
    raise LLMError("embed_texts retries exhausted")


async def embed_query(text: str) -> list[float]:
    out = await embed_texts([text])
    return out[0]


async def claude_message(
    system: str,
    messages: list[dict[str, Any]],
    *,
    max_tokens: int = 1024,
    temperature: float = 0.2,
) -> str:
    client = anthropic_client()
    async for attempt in _RETRY:
        with attempt:
            resp = await client.messages.create(
                model=settings.anthropic_model,
                system=system,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return "".join(
                block.text for block in resp.content if getattr(block, "type", "") == "text"
            )
    raise LLMError("claude_message retries exhausted")


async def claude_stream(
    system: str,
    messages: list[dict[str, Any]],
    *,
    max_tokens: int = 1024,
    temperature: float = 0.2,
) -> AsyncIterator[str]:
    client = anthropic_client()
    async with client.messages.stream(
        model=settings.anthropic_model,
        system=system,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    ) as stream:
        async for text in stream.text_stream:
            yield text
