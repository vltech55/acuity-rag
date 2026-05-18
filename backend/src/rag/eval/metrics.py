from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RetrievalResult:
    retrieved_arxiv_ids: list[str]  # in rank order
    expected_arxiv_ids: set[str]


def precision_at_k(r: RetrievalResult, k: int) -> float:
    if k <= 0:
        return 0.0
    topk = r.retrieved_arxiv_ids[:k]
    if not topk:
        return 0.0
    hits = sum(1 for a in topk if a in r.expected_arxiv_ids)
    return hits / len(topk)


def recall_at_k(r: RetrievalResult, k: int) -> float:
    if not r.expected_arxiv_ids:
        return 0.0
    topk = set(r.retrieved_arxiv_ids[:k])
    hits = len(topk & r.expected_arxiv_ids)
    return hits / len(r.expected_arxiv_ids)


def reciprocal_rank(r: RetrievalResult) -> float:
    for i, a in enumerate(r.retrieved_arxiv_ids, start=1):
        if a in r.expected_arxiv_ids:
            return 1.0 / i
    return 0.0


def aggregate(results: list[RetrievalResult], k: int) -> dict[str, float]:
    if not results:
        return {"precision_at_k": 0.0, "recall_at_k": 0.0, "mrr": 0.0, "n": 0}
    n = len(results)
    return {
        "precision_at_k": sum(precision_at_k(r, k) for r in results) / n,
        "recall_at_k": sum(recall_at_k(r, k) for r in results) / n,
        "mrr": sum(reciprocal_rank(r) for r in results) / n,
        "n": n,
    }
