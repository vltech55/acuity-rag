from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TestCase:
    question: str
    expected_arxiv_ids: list[str]
    notes: str | None = None


def load_test_set(path: Path) -> list[TestCase]:
    """Load JSONL test set. Each line: {"question": ..., "expected_arxiv_ids": [...], "notes": ...}.

    Missing-file → empty list (lets the eval runner produce a clear error message)."""
    if not path.exists():
        return []
    cases: list[TestCase] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        obj = json.loads(line)
        cases.append(
            TestCase(
                question=obj["question"],
                expected_arxiv_ids=list(obj["expected_arxiv_ids"]),
                notes=obj.get("notes"),
            )
        )
    return cases
