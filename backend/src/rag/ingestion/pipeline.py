from __future__ import annotations

import time
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rag.core.logging import get_logger
from rag.ingestion.arxiv_fetch import ArxivPaper, fetch_papers
from rag.ingestion.chunking import chunk_text
from rag.ingestion.embed import embed_chunks
from rag.models import Chunk, Paper

log = get_logger(__name__)


@dataclass(frozen=True)
class IngestResult:
    papers_ingested: int
    chunks_created: int
    duration_seconds: float


async def _paper_exists(session: AsyncSession, arxiv_id: str) -> bool:
    stmt = select(Paper.id).where(Paper.arxiv_id == arxiv_id)
    return (await session.execute(stmt)).scalar_one_or_none() is not None


async def ingest_paper(session: AsyncSession, p: ArxivPaper) -> int:
    """Persist one paper and its chunks. Returns the number of chunks created.

    Idempotent: skips papers already present (by arxiv_id).
    """
    if await _paper_exists(session, p.arxiv_id):
        log.info("paper_skip_exists", arxiv_id=p.arxiv_id)
        return 0

    paper = Paper(
        arxiv_id=p.arxiv_id,
        title=p.title,
        authors=", ".join(p.authors),
        abstract=p.abstract,
        primary_category=p.primary_category,
        published_at=p.published_at,
        pdf_url=p.pdf_url,
    )
    session.add(paper)
    await session.flush()

    text_chunks = chunk_text(p.text)
    if not text_chunks:
        log.warning("no_chunks", arxiv_id=p.arxiv_id)
        await session.commit()
        return 0

    embeddings = await embed_chunks([c.content for c in text_chunks])

    for tc, vec in zip(text_chunks, embeddings, strict=True):
        session.add(
            Chunk(
                paper_id=paper.id,
                chunk_index=tc.index,
                content=tc.content,
                token_count=tc.token_count,
                section=tc.section,
                embedding=vec,
            )
        )
    await session.commit()
    log.info("paper_ingested", arxiv_id=p.arxiv_id, chunks=len(text_chunks))
    return len(text_chunks)


async def ingest_corpus(
    session: AsyncSession,
    query: str,
    max_papers: int,
) -> IngestResult:
    start = time.perf_counter()
    papers = await fetch_papers(query, max_papers)
    chunks_total = 0
    papers_done = 0
    for p in papers:
        try:
            n = await ingest_paper(session, p)
            chunks_total += n
            if n > 0:
                papers_done += 1
        except Exception as exc:  # noqa: BLE001
            log.exception("ingest_paper_failed", arxiv_id=p.arxiv_id, error=str(exc))
            await session.rollback()

    return IngestResult(
        papers_ingested=papers_done,
        chunks_created=chunks_total,
        duration_seconds=round(time.perf_counter() - start, 2),
    )
