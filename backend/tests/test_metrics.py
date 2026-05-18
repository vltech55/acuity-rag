from __future__ import annotations

from rag.eval.metrics import (
    RetrievalResult,
    aggregate,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)


def test_precision_at_k_basic() -> None:
    r = RetrievalResult(
        retrieved_arxiv_ids=["a", "b", "c", "d", "e"],
        expected_arxiv_ids={"a", "c"},
    )
    assert precision_at_k(r, 5) == 2 / 5


def test_recall_at_k_basic() -> None:
    r = RetrievalResult(
        retrieved_arxiv_ids=["a", "b", "c"],
        expected_arxiv_ids={"a", "c", "z"},
    )
    assert recall_at_k(r, 3) == 2 / 3


def test_mrr_first_hit_position() -> None:
    r = RetrievalResult(
        retrieved_arxiv_ids=["x", "y", "a", "b"],
        expected_arxiv_ids={"a"},
    )
    assert reciprocal_rank(r) == 1 / 3


def test_aggregate_averages() -> None:
    results = [
        RetrievalResult(["a", "b"], {"a"}),
        RetrievalResult(["x", "a"], {"a"}),
    ]
    agg = aggregate(results, 2)
    assert agg["n"] == 2
    assert abs(agg["precision_at_k"] - 0.5) < 1e-9
    assert agg["recall_at_k"] == 1.0
    assert abs(agg["mrr"] - 0.75) < 1e-9


def test_empty_inputs_safe() -> None:
    r = RetrievalResult(retrieved_arxiv_ids=[], expected_arxiv_ids=set())
    assert precision_at_k(r, 5) == 0.0
    assert recall_at_k(r, 5) == 0.0
    assert reciprocal_rank(r) == 0.0
