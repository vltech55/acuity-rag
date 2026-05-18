from __future__ import annotations

import json
import time
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from rag.core.logging import get_logger
from rag.db import get_session
from rag.generation.answer import stream_answer
from rag.retrieval.hybrid import retrieve
from rag.schemas import ChatRequest

router = APIRouter(prefix="/chat", tags=["chat"])
log = get_logger(__name__)


@router.post("")
async def chat(
    req: ChatRequest,
    session: AsyncSession = Depends(get_session),
) -> EventSourceResponse:
    start = time.perf_counter()
    chunks = await retrieve(session, req.query, top_k=req.top_k)

    async def event_stream() -> AsyncIterator[dict[str, str]]:
        yield {
            "event": "sources",
            "data": json.dumps({"chunks": [c.model_dump(mode="json") for c in chunks]}),
        }

        async for event in stream_answer(req.query, chunks):
            yield event

        yield {
            "event": "done",
            "data": json.dumps({"latency_ms": round((time.perf_counter() - start) * 1000, 2)}),
        }

    return EventSourceResponse(event_stream())
