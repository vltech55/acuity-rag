from __future__ import annotations

import asyncio
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from rag.core.config import settings
from rag.core.logging import get_logger
from rag.retrieval.bm25 import BM25Hit, bm25_search
from rag.retrieval.rerank import rerank
from rag.retrieval.semantic import SemanticHit, semantic_search
from rag.schemas import ChunkOut

log = get_logger(__name__)


@dataclass
class _Fused:
    chunk_id: UUID
    paper_id: UUID
    arxiv_id: str
    paper_title: str
    section: str | None
    content: str
    bm25_score: float | None
    semantic_score: float | None
    bm25_rank: int | None
    semantic_rank: int | None
    rrf_score: float


def reciprocal_rank_fusion(
    bm25: list[BM25Hit],
    semantic: list[SemanticHit],
    *,
    k: int,
) -> list[_Fused]:
    """RRF: for each result, score = sum_{rankings} 1 / (k + rank).

    Higher k flattens the contribution of any single ranker; the brief defaults k=60
    which is the value from the original Cormack et al. paper.
    """
    by_id: dict[UUID, _Fused] = {}

    for hit in bm25:
        by_id[hit.chunk_id] = _Fused(
            chunk_id=hit.chunk_id,
            paper_id=hit.paper_id,
            arxiv_id=hit.arxiv_id,
            paper_title=hit.paper_title,
            section=hit.section,
            content=hit.content,
            bm25_score=hit.score,
            semantic_score=None,
            bm25_rank=hit.rank,
            semantic_rank=None,
            rrf_score=1.0 / (k + hit.rank),
        )

    for hit in semantic:
        existing = by_id.get(hit.chunk_id)
        if existing is None:
            by_id[hit.chunk_id] = _Fused(
                chunk_id=hit.chunk_id,
                paper_id=hit.paper_id,
                arxiv_id=hit.arxiv_id,
                paper_title=hit.paper_title,
                section=hit.section,
                content=hit.content,
                bm25_score=None,
                semantic_score=hit.score,
                bm25_rank=None,
                semantic_rank=hit.rank,
                rrf_score=1.0 / (k + hit.rank),
            )
        else:
            existing.semantic_score = hit.score
            existing.semantic_rank = hit.rank
            existing.rrf_score += 1.0 / (k + hit.rank)

    return sorted(by_id.values(), key=lambda x: x.rrf_score, reverse=True)


async def retrieve(
    session: AsyncSession,
    query: str,
    *,
    top_k: int | None = None,
) -> list[ChunkOut]:
    """Hybrid retrieval: BM25 + semantic, fused via RRF, then cross-encoder reranked.

    Returns the final top-k ChunkOut, ranked by rerank score if available else by RRF.
    """
    final_k = top_k or settings.rerank_top_k

    bm25_hits, sem_hits = await asyncio.gather(
        bm25_search(session, query, settings.retrieve_top_k_bm25),
        semantic_search(session, query, settings.retrieve_top_k_semantic),
    )

    fused = reciprocal_rank_fusion(bm25_hits, sem_hits, k=settings.rrf_k)
    log.info(
        "retrieve_fused",
        query_len=len(query),
        bm25=len(bm25_hits),
        semantic=len(sem_hits),
        fused=len(fused),
    )

    rerank_pool = fused[: max(final_k * 4, 20)]
    rerank_scores = await rerank(query, [(query, f.content) for f in rerank_pool])

    if rerank_scores is not None:
        scored = sorted(
            zip(rerank_pool, rerank_scores, strict=True),
            key=lambda x: x[1],
            reverse=True,
        )
        winners = [(f, s) for f, s in scored[:final_k]]
        results: list[ChunkOut] = []
        for rank_i, (f, rscore) in enumerate(winners, start=1):
            results.append(
                ChunkOut(
                    id=f.chunk_id,
                    paper_id=f.paper_id,
                    chunk_index=0,
                    content=f.content,
                    section=f.section,
                    arxiv_id=f.arxiv_id,
                    paper_title=f.paper_title,
                    bm25_score=f.bm25_score,
                    semantic_score=f.semantic_score,
                    rrf_score=f.rrf_score,
                    rerank_score=float(rscore),
                    final_rank=rank_i,
                )
            )
        return results

    results = []
    for rank_i, f in enumerate(fused[:final_k], start=1):
        results.append(
            ChunkOut(
                id=f.chunk_id,
                paper_id=f.paper_id,
                chunk_index=0,
                content=f.content,
                section=f.section,
                arxiv_id=f.arxiv_id,
                paper_title=f.paper_title,
                bm25_score=f.bm25_score,
                semantic_score=f.semantic_score,
                rrf_score=f.rrf_score,
                rerank_score=None,
                final_rank=rank_i,
            )
        )
    return results
