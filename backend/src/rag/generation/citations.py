from __future__ import annotations

import re
from dataclasses import dataclass

from rag.schemas import CitationOut, ChunkOut

_MARKER_RE = re.compile(r"\[S(\d+)\]")


@dataclass(frozen=True)
class ParsedClaim:
    text: str
    markers: list[str]


def parse_markers(answer: str) -> list[str]:
    """Return unique marker IDs (e.g. 'S1') in the order they appear."""
    seen: dict[str, None] = {}
    for m in _MARKER_RE.finditer(answer):
        seen.setdefault(f"S{m.group(1)}", None)
    return list(seen.keys())


def split_into_claims(answer: str) -> list[ParsedClaim]:
    """Split on sentence terminators, attaching trailing markers to each claim."""
    sentences = re.split(r"(?<=[.!?])\s+", answer.strip())
    out: list[ParsedClaim] = []
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        markers = [f"S{m.group(1)}" for m in _MARKER_RE.finditer(s)]
        clean = _MARKER_RE.sub("", s).strip()
        out.append(ParsedClaim(text=clean, markers=markers))
    return out


def resolve_citations(
    markers: list[str],
    lookup: dict[str, ChunkOut],
) -> list[CitationOut]:
    """Resolve marker IDs against the lookup. Unknown markers are dropped silently
    (they indicate the model hallucinated a citation; the grounding layer will flag this)."""
    cites: list[CitationOut] = []
    for m in markers:
        chunk = lookup.get(m)
        if chunk is None:
            continue
        cites.append(
            CitationOut(
                marker=m,
                chunk_id=chunk.id,
                paper_id=chunk.paper_id,
                arxiv_id=chunk.arxiv_id,
                paper_title=chunk.paper_title,
                section=chunk.section,
                content=chunk.content,
            )
        )
    return cites


def hallucinated_markers(answer: str, lookup: dict[str, ChunkOut]) -> list[str]:
    return [m for m in parse_markers(answer) if m not in lookup]
