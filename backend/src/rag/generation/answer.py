from __future__ import annotations

import json
from collections.abc import AsyncIterator

from rag.core.llm import claude_message, claude_stream
from rag.core.logging import get_logger
from rag.generation.citations import parse_markers, resolve_citations
from rag.generation.guardrails import score_grounding
from rag.generation.prompts import SYSTEM_PROMPT, build_user_message
from rag.schemas import ChunkOut

log = get_logger(__name__)


async def stream_answer(
    query: str,
    chunks: list[ChunkOut],
) -> AsyncIterator[dict[str, str]]:
    """Yield SSE events: many `token` events, then one `citations` event, then `grounding`.

    Caller is expected to wrap with `sources` (first) and `done` (last) events.
    """
    if not chunks:
        yield {
            "event": "token",
            "data": json.dumps({"text": "I have no retrieved sources to answer from."}),
        }
        yield {"event": "citations", "data": json.dumps({"citations": []})}
        yield {"event": "grounding", "data": json.dumps({"grounding": []})}
        return

    user_msg, lookup = build_user_message(query, chunks)

    collected: list[str] = []
    async for delta in claude_stream(
        SYSTEM_PROMPT,
        [{"role": "user", "content": user_msg}],
        max_tokens=900,
        temperature=0.2,
    ):
        collected.append(delta)
        yield {"event": "token", "data": json.dumps({"text": delta})}

    full = "".join(collected)

    citations = resolve_citations(parse_markers(full), lookup)
    yield {
        "event": "citations",
        "data": json.dumps({"citations": [c.model_dump(mode="json") for c in citations]}),
    }

    grounding = await score_grounding(full, lookup)
    yield {
        "event": "grounding",
        "data": json.dumps({"grounding": [g.model_dump(mode="json") for g in grounding]}),
    }

    log.info(
        "answer_complete",
        len=len(full),
        citations=len(citations),
        grounded=sum(1 for g in grounding if g.grounded),
        total_claims=len(grounding),
    )


async def generate_answer(
    query: str,
    chunks: list[ChunkOut],
) -> tuple[str, dict[str, ChunkOut]]:
    """Non-streaming variant for evals and scripted use. Returns (answer_text, marker_lookup)."""
    if not chunks:
        return "", {}
    user_msg, lookup = build_user_message(query, chunks)
    answer = await claude_message(
        SYSTEM_PROMPT,
        [{"role": "user", "content": user_msg}],
        max_tokens=900,
        temperature=0.2,
    )
    return answer, lookup
