from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True)
class BM25Hit:
    chunk_id: UUID
    paper_id: UUID
    arxiv_id: str
    paper_title: str
    section: str | None
    content: str
    score: float
    rank: int


# plainto_tsquery handles arbitrary user input safely (no parse errors on punctuation).
# ts_rank_cd uses cover density so multi-word matches outscore single-word matches.
_BM25_SQL = """
SELECT
    c.id AS chunk_id,
    c.paper_id AS paper_id,
    p.arxiv_id AS arxiv_id,
    p.title AS paper_title,
    c.section AS section,
    c.content AS content,
    ts_rank_cd(c.content_tsv, q) AS score
FROM chunks c
JOIN papers p ON p.id = c.paper_id
CROSS JOIN plainto_tsquery('english', :query) AS q
WHERE c.content_tsv @@ q
ORDER BY score DESC
LIMIT :limit
"""


async def bm25_search(session: AsyncSession, query: str, limit: int) -> list[BM25Hit]:
    rows = (
        await session.execute(text(_BM25_SQL), {"query": query, "limit": limit})
    ).mappings().all()
    return [
        BM25Hit(
            chunk_id=r["chunk_id"],
            paper_id=r["paper_id"],
            arxiv_id=r["arxiv_id"],
            paper_title=r["paper_title"],
            section=r["section"],
            content=r["content"],
            score=float(r["score"]),
            rank=i + 1,
        )
        for i, r in enumerate(rows)
    ]
