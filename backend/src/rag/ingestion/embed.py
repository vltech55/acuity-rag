from __future__ import annotations

from collections.abc import Sequence

from rag.core.llm import embed_texts
from rag.core.logging import get_logger

log = get_logger(__name__)

_BATCH = 100


async def embed_chunks(texts: Sequence[str]) -> list[list[float]]:
    """Embed `texts` in batches of 100 to stay under provider request-size limits."""
    out: list[list[float]] = []
    for start in range(0, len(texts), _BATCH):
        batch = list(texts[start : start + _BATCH])
        vectors = await embed_texts(batch)
        out.extend(vectors)
        log.info("embed_batch", from_=start, to=start + len(batch), total=len(texts))
    return out
