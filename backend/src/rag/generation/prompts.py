from __future__ import annotations

from rag.schemas import ChunkOut

SYSTEM_PROMPT = """You are a precise research assistant grounded in retrieved sources.

RULES:
1. Answer ONLY using facts present in the provided <sources>. If the sources do not contain the answer, say so plainly. Do not draw on outside knowledge.
2. Every factual claim MUST end with one or more citation markers like [S1], [S2]. Markers reference the source IDs given in <sources>.
3. Use only marker IDs that appear in <sources>. Never invent citations.
4. Keep answers tight: a focused 2-6 sentence response unless the question requires more.
5. If multiple sources disagree, surface the disagreement and cite each side.
6. Quote sparingly. Prefer paraphrase with citations over long quotes.
"""


def format_sources_block(chunks: list[ChunkOut]) -> tuple[str, dict[str, ChunkOut]]:
    """Render the <sources> block injected into the user message.

    Returns the block plus a marker→chunk lookup so callers can resolve citations later.
    """
    lines: list[str] = ["<sources>"]
    lookup: dict[str, ChunkOut] = {}
    for i, c in enumerate(chunks, start=1):
        marker = f"S{i}"
        lookup[marker] = c
        section = f" — section: {c.section}" if c.section else ""
        lines.append(f"[{marker}] arXiv:{c.arxiv_id} — {c.paper_title}{section}")
        lines.append(c.content.strip())
        lines.append("")
    lines.append("</sources>")
    return "\n".join(lines), lookup


def build_user_message(query: str, chunks: list[ChunkOut]) -> tuple[str, dict[str, ChunkOut]]:
    block, lookup = format_sources_block(chunks)
    msg = (
        f"{block}\n\n"
        f"<question>\n{query}\n</question>\n\n"
        "Answer the question using only the sources above. "
        "End every claim with citation markers like [S1] or [S2][S3]."
    )
    return msg, lookup
