from __future__ import annotations

from rag.generation.guardrails import score_grounding
from rag.schemas import ChunkOut


async def answer_faithfulness(answer: str, lookup: dict[str, ChunkOut]) -> float:
    """Mean entailment across claims in `answer`.

    Returns 0.0 for empty answers — that's the correct floor: nothing said, nothing grounded.
    """
    scores = await score_grounding(answer, lookup)
    if not scores:
        return 0.0
    return sum(s.entailment for s in scores) / len(scores)
