from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from rag.core.llm import embed_query


@dataclass(frozen=True)
class SemanticHit:
    chunk_id: UUID
    paper_id: UUID
    arxiv_id: str
    paper_title: str
    section: str | None
    content: str
    score: float  # similarity in [0,1] (1 = identical)
    rank: int


# pgvector's `<=>` operator returns cosine distance (lower is better).
# We expose similarity = 1 - distance so higher is always better, consistent with bm25.
_SEMANTIC_SQL = text(
    """
    SELECT
        c.id AS chunk_id,
        c.paper_id AS paper_id,
        p.arxiv_id AS arxiv_id,
        p.title AS paper_title,
        c.section AS section,
        c.content AS content,
        1 - (c.embedding <=> CAST(:vec AS vector)) AS similarity
    FROM chunks c
    JOIN papers p ON p.id = c.paper_id
    ORDER BY c.embedding <=> CAST(:vec AS vector)
    LIMIT :limit
    """
).bindparams(bindparam("vec"), bindparam("limit"))


def _vector_literal(v: list[float]) -> str:
    return "[" + ",".join(f"{x:.7f}" for x in v) + "]"


async def semantic_search(session: AsyncSession, query: str, limit: int) -> list[SemanticHit]:
    vec = await embed_query(query)
    rows = (
        await session.execute(
            _SEMANTIC_SQL,
            {"vec": _vector_literal(vec), "limit": limit},
        )
    ).mappings().all()
    return [
        SemanticHit(
            chunk_id=r["chunk_id"],
            paper_id=r["paper_id"],
            arxiv_id=r["arxiv_id"],
            paper_title=r["paper_title"],
            section=r["section"],
            content=r["content"],
            score=float(r["similarity"]),
            rank=i + 1,
        )
        for i, r in enumerate(rows)
    ]
