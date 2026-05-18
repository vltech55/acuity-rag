from __future__ import annotations

import asyncio
from functools import lru_cache

from rag.core.config import settings
from rag.core.logging import get_logger

log = get_logger(__name__)


@lru_cache(maxsize=1)
def _load_model() -> object | None:
    """Load a sentence-transformers CrossEncoder. Returns None if reranking is disabled
    or the model can't be loaded (e.g. no internet in CI). Callers should treat None
    as 'skip reranking, keep RRF order'."""
    if not settings.reranker_model:
        return None
    try:
        from sentence_transformers import CrossEncoder  # type: ignore[import-untyped]

        return CrossEncoder(settings.reranker_model)
    except Exception as exc:  # noqa: BLE001
        log.warning("reranker_unavailable", error=str(exc))
        return None


def _score_pairs(model: object, pairs: list[tuple[str, str]]) -> list[float]:
    return [float(s) for s in model.predict(pairs)]  # type: ignore[attr-defined]


async def rerank(query: str, candidates: list[tuple[str, str]]) -> list[float] | None:
    """Score (query, content) pairs with a cross-encoder.

    Returns None if no reranker is configured/available, so the caller can fall back
    to RRF-only ordering without branching on internals.
    """
    model = _load_model()
    if model is None or not candidates:
        return None
    return await asyncio.to_thread(_score_pairs, model, candidates)
