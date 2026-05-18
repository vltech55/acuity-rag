from __future__ import annotations

import asyncio
import json
import re

from rag.core.llm import claude_message
from rag.core.logging import get_logger
from rag.generation.citations import ParsedClaim, split_into_claims
from rag.schemas import ChunkOut, GroundingScore

log = get_logger(__name__)

_JUDGE_SYSTEM = """You are an entailment judge. Given a CLAIM and one or more SOURCES,
output a single JSON object: {"entailment": <float in [0,1]>, "rationale": "<short reason>"}.
- 1.0 = the claim is fully supported by the source(s)
- 0.5 = the claim is partly supported but adds unsupported details
- 0.0 = the claim contradicts or has no basis in the source(s)
Output JSON only, no preamble."""


_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


async def _judge_claim(claim: ParsedClaim, sources_text: str) -> float:
    user = (
        f"<sources>\n{sources_text}\n</sources>\n\n"
        f"<claim>\n{claim.text}\n</claim>"
    )
    raw = await claude_message(
        _JUDGE_SYSTEM,
        [{"role": "user", "content": user}],
        max_tokens=200,
        temperature=0.0,
    )
    match = _JSON_RE.search(raw)
    if match is None:
        log.warning("judge_no_json", raw=raw[:200])
        return 0.0
    try:
        data = json.loads(match.group(0))
        return float(max(0.0, min(1.0, data.get("entailment", 0.0))))
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        log.warning("judge_parse_failed", error=str(exc), raw=raw[:200])
        return 0.0


async def score_grounding(
    answer: str,
    lookup: dict[str, ChunkOut],
    *,
    threshold: float = 0.6,
) -> list[GroundingScore]:
    """For each claim with citations, ask Claude to score entailment against the cited chunks.

    Claims without citations get entailment=0 and grounded=False — that surfaces hallucinations.
    """
    claims = split_into_claims(answer)
    if not claims:
        return []

    async def score_one(c: ParsedClaim, idx: int) -> GroundingScore:
        if not c.markers:
            return GroundingScore(marker=f"claim_{idx}", entailment=0.0, grounded=False)
        cited_chunks = [lookup[m] for m in c.markers if m in lookup]
        if not cited_chunks:
            return GroundingScore(marker=",".join(c.markers), entailment=0.0, grounded=False)
        sources_text = "\n\n".join(
            f"[{m}] {lookup[m].content}" for m in c.markers if m in lookup
        )
        ent = await _judge_claim(c, sources_text)
        return GroundingScore(
            marker=",".join(c.markers),
            entailment=ent,
            grounded=ent >= threshold,
        )

    return await asyncio.gather(*[score_one(c, i) for i, c in enumerate(claims)])
