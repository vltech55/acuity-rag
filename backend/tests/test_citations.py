from __future__ import annotations

from uuid import uuid4

from rag.generation.citations import (
    hallucinated_markers,
    parse_markers,
    resolve_citations,
    split_into_claims,
)
from rag.schemas import ChunkOut


def _chunk(marker_idx: int) -> ChunkOut:
    return ChunkOut(
        id=uuid4(),
        paper_id=uuid4(),
        chunk_index=0,
        content=f"content {marker_idx}",
        section=None,
        arxiv_id=f"2401.{marker_idx:05d}",
        paper_title=f"paper {marker_idx}",
        bm25_score=None,
        semantic_score=None,
        rrf_score=None,
        rerank_score=None,
        final_rank=marker_idx,
    )


def test_parse_markers_dedupes_and_preserves_order() -> None:
    text = "First claim [S2]. Second [S1] and again [S1]. Third [S3]."
    assert parse_markers(text) == ["S2", "S1", "S3"]


def test_split_into_claims_attaches_markers() -> None:
    text = "Alpha is real [S1]. Beta builds on alpha [S1][S2]. Gamma stands alone."
    claims = split_into_claims(text)
    assert len(claims) == 3
    assert claims[0].markers == ["S1"]
    assert claims[1].markers == ["S1", "S2"]
    assert claims[2].markers == []


def test_resolve_citations_drops_unknown() -> None:
    lookup = {"S1": _chunk(1), "S2": _chunk(2)}
    out = resolve_citations(["S1", "S2", "S99"], lookup)
    assert [c.marker for c in out] == ["S1", "S2"]


def test_hallucinated_markers_detected() -> None:
    lookup = {"S1": _chunk(1)}
    text = "Real claim [S1]. Made-up claim [S7]."
    assert hallucinated_markers(text, lookup) == ["S7"]
