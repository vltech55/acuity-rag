from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache

import tiktoken

from rag.core.config import settings

_SECTION_HEADER = re.compile(
    r"^(?:\d+(?:\.\d+)*\.?\s+)?(abstract|introduction|background|related work|method(?:s|ology)?|"
    r"approach|experiments?|results?|analysis|discussion|conclusion|references|appendix)\b",
    re.IGNORECASE | re.MULTILINE,
)

_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z(])")


@dataclass(frozen=True)
class TextChunk:
    index: int
    content: str
    token_count: int
    section: str | None


@lru_cache(maxsize=1)
def _encoder() -> tiktoken.Encoding:
    return tiktoken.get_encoding("cl100k_base")


def _split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    return [s.strip() for s in _SENT_SPLIT.split(text) if s.strip()]


def _split_sections(text: str) -> list[tuple[str | None, str]]:
    """Split text by recognized section headers; returns [(section_name, body), ...]."""
    matches = list(_SECTION_HEADER.finditer(text))
    if not matches:
        return [(None, text)]
    sections: list[tuple[str | None, str]] = []
    if matches[0].start() > 0:
        sections.append((None, text[: matches[0].start()]))
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        section_name = m.group(1).lower()
        sections.append((section_name, text[m.start() : end]))
    return sections


def chunk_text(
    text: str,
    *,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[TextChunk]:
    """Sentence-aware chunking with token budgets and overlap.

    - Respects detected section boundaries (chunks never span sections).
    - Greedy sentence accumulation up to `chunk_size` tokens.
    - Overlap is created by repeating trailing sentences from the previous chunk.
    """
    size = chunk_size or settings.chunk_size_tokens
    over = overlap or settings.chunk_overlap_tokens
    if over >= size:
        raise ValueError("overlap must be smaller than chunk_size")

    enc = _encoder()
    chunks: list[TextChunk] = []
    idx = 0

    for section_name, body in _split_sections(text):
        sentences = _split_sentences(body)
        if not sentences:
            continue
        sent_tokens = [len(enc.encode(s)) for s in sentences]

        buf: list[str] = []
        buf_tok = 0
        i = 0
        while i < len(sentences):
            s, t = sentences[i], sent_tokens[i]
            # If a single sentence exceeds the budget, hard-split it on tokens.
            if t > size:
                if buf:
                    chunks.append(TextChunk(idx, " ".join(buf), buf_tok, section_name))
                    idx += 1
                    buf, buf_tok = [], 0
                ids = enc.encode(s)
                for start in range(0, len(ids), size - over):
                    piece = enc.decode(ids[start : start + size])
                    chunks.append(
                        TextChunk(idx, piece, min(size, len(ids) - start), section_name)
                    )
                    idx += 1
                i += 1
                continue

            if buf_tok + t > size:
                chunks.append(TextChunk(idx, " ".join(buf), buf_tok, section_name))
                idx += 1
                # Build overlap from tail sentences whose tokens sum <= over.
                tail: list[str] = []
                tail_tok = 0
                for j in range(len(buf) - 1, -1, -1):
                    j_tok = len(enc.encode(buf[j]))
                    if tail_tok + j_tok > over:
                        break
                    tail.insert(0, buf[j])
                    tail_tok += j_tok
                buf = tail
                buf_tok = tail_tok
                continue

            buf.append(s)
            buf_tok += t
            i += 1

        if buf:
            chunks.append(TextChunk(idx, " ".join(buf), buf_tok, section_name))
            idx += 1

    return chunks
