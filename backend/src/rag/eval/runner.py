from __future__ import annotations

import asyncio
import json
import subprocess
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from rag.core.logging import get_logger
from rag.db import SessionLocal
from rag.eval.faithfulness import answer_faithfulness
from rag.eval.metrics import RetrievalResult, aggregate
from rag.eval.ragas_runner import run_ragas
from rag.eval.test_set import TestCase, load_test_set
from rag.generation.answer import generate_answer
from rag.models import EvalRun
from rag.retrieval.hybrid import retrieve

log = get_logger(__name__)


@dataclass
class _CaseResult:
    question: str
    expected: list[str]
    retrieved: list[str]
    answer: str
    faithfulness: float


def _git_sha() -> str | None:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL,
        ).decode().strip()
    except Exception:  # noqa: BLE001
        return None


async def _run_case(
    session: AsyncSession,
    case: TestCase,
    top_k: int,
) -> _CaseResult:
    chunks = await retrieve(session, case.question, top_k=top_k)
    retrieved = [c.arxiv_id for c in chunks]
    answer, lookup = await generate_answer(case.question, chunks)
    faith = await answer_faithfulness(answer, lookup) if answer else 0.0
    log.info(
        "eval_case",
        q=case.question[:80],
        expected=case.expected_arxiv_ids,
        retrieved=retrieved,
        faithfulness=round(faith, 3),
    )
    return _CaseResult(
        question=case.question,
        expected=case.expected_arxiv_ids,
        retrieved=retrieved,
        answer=answer,
        faithfulness=faith,
    )


async def run_eval(
    test_set_path: Path,
    out_dir: Path,
    *,
    top_k: int = 5,
    use_ragas: bool = True,
) -> dict[str, object]:
    cases = load_test_set(test_set_path)
    if not cases:
        raise FileNotFoundError(
            f"no test cases found at {test_set_path}. "
            "Add a JSONL file with one {'question': ..., 'expected_arxiv_ids': [...]} per line."
        )

    async with SessionLocal() as session:
        case_results = await asyncio.gather(
            *(_run_case(session, c, top_k) for c in cases)
        )

    retrieval_results = [
        RetrievalResult(
            retrieved_arxiv_ids=cr.retrieved,
            expected_arxiv_ids=set(cr.expected),
        )
        for cr in case_results
    ]
    custom = aggregate(retrieval_results, top_k)
    faithfulness_mean = sum(cr.faithfulness for cr in case_results) / max(len(case_results), 1)

    ragas = None
    if use_ragas:
        # RAGAS needs a single ground truth string per question; concatenate expected paper IDs.
        ragas = await run_ragas(
            questions=[cr.question for cr in case_results],
            answers=[cr.answer for cr in case_results],
            contexts=[cr.retrieved for cr in case_results],
            ground_truths=[", ".join(cr.expected) for cr in case_results],
        )

    metrics: dict[str, object] = {
        "n": custom["n"],
        "precision_at_5": round(custom["precision_at_k"], 4),
        "recall_at_5": round(custom["recall_at_k"], 4),
        "mrr": round(custom["mrr"], 4),
        "faithfulness": round(faithfulness_mean, 4),
        "ragas_context_precision": None if ragas is None else ragas.context_precision,
        "ragas_context_recall": None if ragas is None else ragas.context_recall,
        "ragas_answer_relevancy": None if ragas is None else ragas.answer_relevancy,
        "ragas_faithfulness": None if ragas is None else ragas.faithfulness,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    payload = {
        "created_at": timestamp,
        "git_sha": _git_sha(),
        "top_k": top_k,
        "metrics": metrics,
        "cases": [asdict(cr) for cr in case_results],
    }
    json_path = out_dir / f"eval-{timestamp}.json"
    json_path.write_text(json.dumps(payload, indent=2))

    latest = out_dir / "latest.json"
    latest.write_text(json.dumps(payload, indent=2))

    async with SessionLocal() as session:
        session.add(
            EvalRun(
                git_sha=payload["git_sha"],
                config_json=json.dumps({"top_k": top_k}),
                metrics_json=json.dumps(metrics),
            )
        )
        await session.commit()

    log.info("eval_done", **{k: v for k, v in metrics.items() if v is not None})
    return payload
