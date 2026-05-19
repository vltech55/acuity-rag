"""Seed a tiny in-memory corpus directly to Postgres.

Bypasses arXiv fetch + PDF parsing + the heavy chunker import chain so the
demo works on a memory-constrained VPS. Embeddings still go through the real
OpenAI text-embedding-3-small endpoint, so retrieval is real.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from openai import AsyncOpenAI

from rag.core.config import settings
from rag.db import SessionLocal
from rag.models import Chunk, Paper

PAPERS: list[dict] = [
    {
        "arxiv_id": "2401.12345",
        "title": "Hybrid Retrieval with Reciprocal Rank Fusion for Dense and Sparse Search",
        "authors": "L. Chen, A. Patel, M. Suzuki",
        "abstract": (
            "We study reciprocal rank fusion (RRF) as a parameter-free combiner of "
            "lexical BM25 and dense vector retrieval. Across BEIR benchmarks, RRF with "
            "k=60 outperforms either retriever alone by 4.2 nDCG@10 on average."
        ),
        "primary_category": "cs.IR",
        "published_at": datetime(2024, 1, 18, tzinfo=timezone.utc),
        "pdf_url": "https://arxiv.org/pdf/2401.12345",
        "chunks": [
            "Reciprocal rank fusion (RRF) combines ranked lists from heterogeneous retrievers without requiring score normalization. Given document d and a set of rankers R, RRF scores d as the sum of 1 / (k + rank_r(d)) for r in R, where k is a small constant (typically 60).",
            "We benchmark BM25 + dense embeddings (E5-large-v2) on 14 BEIR datasets. Hybrid retrieval with RRF improves nDCG@10 by 4.2 points over BM25 alone and 2.8 points over dense alone. Gains are largest on out-of-domain queries.",
            "Compared to learned fusion (e.g., a linear combination tuned on dev set), RRF is competitive without supervision and is robust to retriever-quality skew. It is the recommended default for production hybrid pipelines.",
            "Ablation: changing k from 10 to 200 moves nDCG by less than 0.5 points across datasets, confirming RRF's parameter insensitivity. The retriever choice matters far more than the fusion hyperparameter.",
        ],
    },
    {
        "arxiv_id": "2402.67890",
        "title": "Citation-Grounded Generation: Reducing Hallucination in Retrieval-Augmented Question Answering",
        "authors": "R. Okafor, J. Lindgren, S. Park",
        "abstract": (
            "We propose a constrained decoding scheme that forces large language models "
            "to attribute each generated claim to a retrieved chunk. Faithfulness as "
            "measured by RAGAS rises from 0.71 to 0.94 with minimal latency overhead."
        ),
        "primary_category": "cs.CL",
        "published_at": datetime(2024, 2, 22, tzinfo=timezone.utc),
        "pdf_url": "https://arxiv.org/pdf/2402.67890",
        "chunks": [
            "Hallucination in retrieval-augmented generation stems from the model generating text not grounded in retrieved evidence. We define faithfulness as the fraction of generated claims supported by at least one retrieved chunk.",
            "Our approach injects citation markers ([1], [2], ...) inline during generation, with the prompt instructing the model to attribute every factual sentence. A post-hoc verifier discards completions where any claim lacks support.",
            "On the RAGAS benchmark, faithfulness improves from 0.71 (vanilla RAG with GPT-4) to 0.94 with citation grounding. Answer relevance is unchanged within noise. Latency increases by 8% due to the verification step.",
            "Failure modes: when retrieval misses the relevant passage entirely, the model occasionally fabricates a plausible citation index. Recall@5 above 0.85 is a strong predictor of low hallucination rates downstream.",
        ],
    },
    {
        "arxiv_id": "2403.11111",
        "title": "Chunking Strategies for Long-Document Question Answering",
        "authors": "T. Ahmed, K. Volkov",
        "abstract": (
            "We compare fixed-size, sentence-boundary, and semantic chunking across "
            "scientific papers and legal contracts. Semantic chunking helps on legal "
            "text but offers no measurable gain on scientific papers under a 512-token budget."
        ),
        "primary_category": "cs.CL",
        "published_at": datetime(2024, 3, 7, tzinfo=timezone.utc),
        "pdf_url": "https://arxiv.org/pdf/2403.11111",
        "chunks": [
            "Chunk size and boundary policy materially affect retrieval quality. We compare 256, 512, and 1024 token fixed-size chunks against sentence-aware and embedding-similarity-based semantic chunks.",
            "On scientific QA over arXiv papers, 512-token fixed-size chunks with 64-token overlap achieve the best Recall@5 (0.86). Increasing to 1024 tokens slightly hurts precision; sub-256 tokens lose multi-sentence context.",
            "On contract QA, semantic chunking that respects section boundaries outperforms fixed-size by 6 points Recall@5. The clause-aligned chunks let the retriever match coherent legal arguments rather than fragments.",
            "Recommendation: start with 512-token fixed-size chunks with light overlap. Move to semantic chunking only for highly structured documents (legal, financial filings) where boundaries carry semantic weight.",
        ],
    },
]


async def main() -> None:
    print(f"[seed] embedding model: {settings.openai_embedding_model}")
    print(f"[seed] DB:               {settings.database_url}")
    print(f"[seed] papers:           {len(PAPERS)}")
    print(f"[seed] chunks total:     {sum(len(p['chunks']) for p in PAPERS)}")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    all_texts = [c for p in PAPERS for c in p["chunks"]]
    print("[seed] requesting embeddings ...")
    resp = await client.embeddings.create(
        model=settings.openai_embedding_model,
        input=all_texts,
    )
    embeddings = [d.embedding for d in resp.data]
    print(f"[seed] received {len(embeddings)} embeddings, dim={len(embeddings[0])}")

    cursor = 0
    async with SessionLocal() as session:
        for paper_meta in PAPERS:
            paper = Paper(
                id=uuid4(),
                arxiv_id=paper_meta["arxiv_id"],
                title=paper_meta["title"],
                authors=paper_meta["authors"],
                abstract=paper_meta["abstract"],
                primary_category=paper_meta["primary_category"],
                published_at=paper_meta["published_at"],
                pdf_url=paper_meta["pdf_url"],
            )
            session.add(paper)
            await session.flush()

            for idx, content in enumerate(paper_meta["chunks"]):
                emb = embeddings[cursor]
                cursor += 1
                session.add(
                    Chunk(
                        id=uuid4(),
                        paper_id=paper.id,
                        chunk_index=idx,
                        content=content,
                        token_count=len(content) // 4,
                        section=None,
                        embedding=emb,
                    )
                )
            print(f"[seed]   inserted {paper_meta['arxiv_id']}: {len(paper_meta['chunks'])} chunks")

        await session.commit()
    print("[seed] done.")


if __name__ == "__main__":
    asyncio.run(main())
