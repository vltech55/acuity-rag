from __future__ import annotations

from rag.ingestion.chunking import chunk_text


def test_short_text_one_chunk() -> None:
    chunks = chunk_text("The cat sat on the mat.", chunk_size=256, overlap=32)
    assert len(chunks) == 1
    assert "cat" in chunks[0].content


def test_chunks_respect_token_budget() -> None:
    # Build text well over 1k tokens by repeating distinct sentences.
    sentences = [f"This is sentence number {i} containing some unique content." for i in range(200)]
    text = " ".join(sentences)
    chunks = chunk_text(text, chunk_size=128, overlap=16)
    assert len(chunks) > 1
    assert all(c.token_count <= 128 for c in chunks)


def test_overlap_creates_repetition_between_chunks() -> None:
    sentences = [f"Distinct phrase alpha-{i}." for i in range(40)]
    text = " ".join(sentences)
    chunks = chunk_text(text, chunk_size=64, overlap=24)
    assert len(chunks) >= 2
    # The tail of chunk 0 should appear in the head of chunk 1.
    tail = chunks[0].content[-40:]
    assert any(
        word in chunks[1].content for word in tail.split() if word.startswith("alpha-")
    )


def test_section_boundary_detected() -> None:
    text = (
        "Some preamble before any header.\n\n"
        "Introduction\n"
        "This paper introduces something. We do an experiment.\n\n"
        "Methods\n"
        "Our method has two steps. Step one. Step two."
    )
    chunks = chunk_text(text, chunk_size=512, overlap=32)
    sections = {c.section for c in chunks}
    assert "introduction" in sections
    assert "methods" in sections


def test_overlap_must_be_smaller_than_size() -> None:
    import pytest

    with pytest.raises(ValueError):
        chunk_text("hi", chunk_size=64, overlap=64)
