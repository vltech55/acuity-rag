from __future__ import annotations

from uuid import uuid4

from rag.retrieval.bm25 import BM25Hit
from rag.retrieval.hybrid import reciprocal_rank_fusion
from rag.retrieval.semantic import SemanticHit


def _bm25(rank: int, score: float = 1.0) -> BM25Hit:
    return BM25Hit(
        chunk_id=uuid4(),
        paper_id=uuid4(),
        arxiv_id=f"2401.{rank:05d}",
        paper_title=f"paper {rank}",
        section=None,
        content="x",
        score=score,
        rank=rank,
    )


def _sem(chunk_id, paper_id, arxiv_id, rank: int, score: float = 0.9) -> SemanticHit:
    return SemanticHit(
        chunk_id=chunk_id,
        paper_id=paper_id,
        arxiv_id=arxiv_id,
        paper_title=f"paper {rank}",
        section=None,
        content="x",
        score=score,
        rank=rank,
    )


def test_rrf_combines_disjoint_results() -> None:
    bm25 = [_bm25(1), _bm25(2)]
    sem = [
        SemanticHit(
            chunk_id=uuid4(),
            paper_id=uuid4(),
            arxiv_id="2401.99999",
            paper_title="other",
            section=None,
            content="x",
            score=0.9,
            rank=1,
        )
    ]
    fused = reciprocal_rank_fusion(bm25, sem, k=60)
    assert len(fused) == 3


def test_rrf_boosts_results_in_both_rankings() -> None:
    shared_chunk = uuid4()
    shared_paper = uuid4()
    bm25 = [
        BM25Hit(
            chunk_id=shared_chunk,
            paper_id=shared_paper,
            arxiv_id="2401.00001",
            paper_title="shared",
            section=None,
            content="x",
            score=1.0,
            rank=2,
        ),
        _bm25(1),
    ]
    sem = [_sem(shared_chunk, shared_paper, "2401.00001", rank=2)]
    fused = reciprocal_rank_fusion(bm25, sem, k=60)
    # Shared chunk gets RRF contribution from both rankings → should outrank single-source hits.
    assert fused[0].chunk_id == shared_chunk
    assert fused[0].bm25_score is not None
    assert fused[0].semantic_score is not None


def test_rrf_score_formula() -> None:
    bm25 = [_bm25(1)]
    sem: list = []
    fused = reciprocal_rank_fusion(bm25, sem, k=60)
    assert abs(fused[0].rrf_score - 1 / (60 + 1)) < 1e-9
