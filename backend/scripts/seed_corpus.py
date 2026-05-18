from __future__ import annotations

import argparse
import asyncio

from rag.core.config import settings
from rag.core.logging import configure_logging, get_logger
from rag.db import SessionLocal
from rag.ingestion.pipeline import ingest_corpus


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the corpus from arXiv")
    parser.add_argument("--query", default=settings.arxiv_query)
    parser.add_argument("--max-papers", type=int, default=settings.arxiv_max_papers)
    args = parser.parse_args()

    configure_logging()
    log = get_logger("seed")
    log.info("ingest_start", query=args.query, max_papers=args.max_papers)

    async with SessionLocal() as session:
        result = await ingest_corpus(session, args.query, args.max_papers)

    log.info(
        "ingest_done",
        papers=result.papers_ingested,
        chunks=result.chunks_created,
        seconds=result.duration_seconds,
    )


if __name__ == "__main__":
    asyncio.run(main())
