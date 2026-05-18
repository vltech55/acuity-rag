from __future__ import annotations

from dataclasses import dataclass

from rag.core.logging import get_logger

log = get_logger(__name__)


@dataclass(frozen=True)
class RagasMetrics:
    context_precision: float | None
    context_recall: float | None
    answer_relevancy: float | None
    faithfulness: float | None


async def run_ragas(
    questions: list[str],
    answers: list[str],
    contexts: list[list[str]],
    ground_truths: list[str],
) -> RagasMetrics:
    """Best-effort RAGAS evaluation. If ragas isn't installed, returns all-None
    so the surrounding harness can still report custom metrics."""
    try:
        from datasets import Dataset  # type: ignore[import-untyped]
        from ragas import evaluate  # type: ignore[import-untyped]
        from ragas.metrics import (  # type: ignore[import-untyped]
            answer_relevancy,
            context_precision,
            context_recall,
            faithfulness,
        )
    except ImportError as exc:
        log.warning("ragas_unavailable", error=str(exc))
        return RagasMetrics(None, None, None, None)

    ds = Dataset.from_dict(
        {
            "question": questions,
            "answer": answers,
            "contexts": contexts,
            "ground_truth": ground_truths,
        }
    )
    try:
        result = evaluate(
            ds,
            metrics=[context_precision, context_recall, answer_relevancy, faithfulness],
        )
        return RagasMetrics(
            context_precision=float(result["context_precision"]),
            context_recall=float(result["context_recall"]),
            answer_relevancy=float(result["answer_relevancy"]),
            faithfulness=float(result["faithfulness"]),
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("ragas_eval_failed", error=str(exc))
        return RagasMetrics(None, None, None, None)
