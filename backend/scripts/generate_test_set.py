"""Generate a 50-question test set from the ingested corpus.

Strategy: for each paper, ask Claude to produce a single retrieval-style question
that only that paper's abstract+title can answer well. The paper's arxiv_id becomes
the ground-truth expected match. This gives us a real eval set without manual labor.

Run once after `make ingest`. Output is written to /app/../eval/test_questions.jsonl.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import random
import re
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from rag.core.llm import claude_message
from rag.core.logging import configure_logging, get_logger
from rag.db import SessionLocal
from rag.models import Paper

log = get_logger("gen_test_set")

_SYSTEM = """You write retrieval evaluation questions for a RAG benchmark.

Given a paper's title and abstract, output ONE specific, factual question that:
- can be answered ONLY by content from this paper (specific method/result/dataset)
- avoids generic wording ("what is deep learning")
- is 8-20 words
- does NOT mention the paper title or authors

Output a single JSON object: {"question": "..."}"""

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


async def _question_for_paper(title: str, abstract: str) -> str | None:
    user = f"<title>{title}</title>\n<abstract>{abstract[:2000]}</abstract>"
    raw = await claude_message(
        _SYSTEM,
        [{"role": "user", "content": user}],
        max_tokens=200,
        temperature=0.3,
    )
    m = _JSON_RE.search(raw)
    if m is None:
        return None
    try:
        return str(json.loads(m.group(0))["question"]).strip()
    except (json.JSONDecodeError, KeyError, TypeError):
        return None


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="/app/../eval/test_questions.jsonl")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    configure_logging()
    out_path = Path(args.out).resolve()
    random.seed(args.seed)

    async with SessionLocal() as session:  # type: AsyncSession
        rows = (await session.execute(select(Paper).order_by(func.random()).limit(args.limit))).scalars().all()

    log.info("papers_sampled", n=len(rows))
    lines: list[str] = [
        "# Auto-generated retrieval test set: each question is derived from one paper's abstract.",
        "# expected_arxiv_ids[0] is the source paper; retrieval should rank that paper's chunks high.",
    ]
    for p in rows:
        q = await _question_for_paper(p.title, p.abstract)
        if not q:
            log.warning("question_gen_failed", arxiv_id=p.arxiv_id)
            continue
        lines.append(
            json.dumps(
                {
                    "question": q,
                    "expected_arxiv_ids": [p.arxiv_id],
                    "notes": f"derived from {p.arxiv_id}: {p.title[:80]}",
                }
            )
        )
        log.info("question_added", arxiv_id=p.arxiv_id, q=q[:80])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log.info("test_set_written", path=str(out_path), n=len(lines) - 2)


if __name__ == "__main__":
    asyncio.run(main())
