import type { ChunkOut, CitationOut, GroundingScore } from "@/lib/api";

const CHUNKS: ChunkOut[] = [
  {
    id: "c1",
    paper_id: "p1",
    chunk_index: 0,
    content:
      "Reciprocal rank fusion (RRF) combines ranked lists from heterogeneous retrievers without requiring score normalization. Given document d and a set of rankers R, RRF scores d as the sum of 1/(k + rank_r(d)) for r in R, where k is a small constant (typically 60).",
    section: "§3 Method",
    arxiv_id: "2401.12345",
    paper_title: "Hybrid Retrieval with Reciprocal Rank Fusion for Dense and Sparse Search",
    bm25_score: 18.42,
    semantic_score: 0.617,
    rrf_score: 0.0312,
    rerank_score: 0.94,
    final_rank: 1,
  },
  {
    id: "c2",
    paper_id: "p1",
    chunk_index: 1,
    content:
      "We benchmark BM25 + dense embeddings (E5-large-v2) on 14 BEIR datasets. Hybrid retrieval with RRF improves nDCG@10 by 4.2 points over BM25 alone and 2.8 points over dense alone. Gains are largest on out-of-domain queries.",
    section: "§4.1 Empirical Results",
    arxiv_id: "2401.12345",
    paper_title: "Hybrid Retrieval with Reciprocal Rank Fusion for Dense and Sparse Search",
    bm25_score: 15.81,
    semantic_score: 0.534,
    rrf_score: 0.0294,
    rerank_score: 0.91,
    final_rank: 2,
  },
  {
    id: "c3",
    paper_id: "p2",
    chunk_index: 0,
    content:
      "On the RAGAS benchmark, faithfulness improves from 0.71 (vanilla RAG with GPT-4) to 0.94 with citation grounding. Answer relevance is unchanged within noise. Latency increases by 8% due to the verification step.",
    section: "§5.2 Faithfulness gains",
    arxiv_id: "2402.67890",
    paper_title: "Citation-Grounded Generation: Reducing Hallucination in Retrieval-Augmented QA",
    bm25_score: 12.07,
    semantic_score: 0.481,
    rrf_score: 0.0273,
    rerank_score: 0.88,
    final_rank: 3,
  },
  {
    id: "c4",
    paper_id: "p1",
    chunk_index: 2,
    content:
      "Compared to learned fusion (e.g., a linear combination tuned on dev set), RRF is competitive without supervision and is robust to retriever-quality skew. It is the recommended default for production hybrid pipelines.",
    section: "§4.3 Comparison to learned fusion",
    arxiv_id: "2401.12345",
    paper_title: "Hybrid Retrieval with Reciprocal Rank Fusion for Dense and Sparse Search",
    bm25_score: 10.92,
    semantic_score: 0.468,
    rrf_score: 0.0258,
    rerank_score: 0.83,
    final_rank: 4,
  },
  {
    id: "c5",
    paper_id: "p1",
    chunk_index: 3,
    content:
      "Ablation: changing k from 10 to 200 moves nDCG by less than 0.5 points across datasets, confirming RRF's parameter insensitivity. The retriever choice matters far more than the fusion hyperparameter.",
    section: "§4.4 Ablation",
    arxiv_id: "2401.12345",
    paper_title: "Hybrid Retrieval with Reciprocal Rank Fusion for Dense and Sparse Search",
    bm25_score: 9.18,
    semantic_score: 0.472,
    rrf_score: 0.0244,
    rerank_score: 0.79,
    final_rank: 5,
  },
];

const ANSWER =
  "Reciprocal rank fusion (RRF) combines ranked lists from heterogeneous retrievers by summing 1 / (k + rank_r(d)) across all rankers, where k is a small constant — typically 60 [S1]. The method requires no score normalization, which makes it especially robust when combining lexical signals (BM25) with dense embeddings.\n\nOn the BEIR benchmark, hybrid retrieval with RRF improves nDCG@10 by 4.2 points over BM25 alone and 2.8 points over dense embeddings alone, with the biggest gains on out-of-domain queries [S2]. This generalization benefit is why RRF is recommended as the default for production hybrid pipelines [S4].\n\nNotably, RRF is parameter-insensitive: sweeping k from 10 to 200 moves nDCG by less than 0.5 points [S5]. Combined with citation-grounded generation, this approach pushes RAGAS faithfulness from 0.71 to 0.94 [S3].";

const CITATIONS: CitationOut[] = CHUNKS.map((c, i) => ({
  marker: `S${i + 1}`,
  chunk_id: c.id,
  paper_id: c.paper_id,
  arxiv_id: c.arxiv_id,
  paper_title: c.paper_title,
  section: c.section,
  content: c.content,
}));

const GROUNDING: GroundingScore[] = [
  { marker: "S1", entailment: 0.98, grounded: true },
  { marker: "S2", entailment: 0.96, grounded: true },
  { marker: "S4", entailment: 0.92, grounded: true },
  { marker: "S5", entailment: 0.95, grounded: true },
  { marker: "S3", entailment: 0.94, grounded: true },
];

export const DEMO_CHAT = {
  question: "Compare RRF against learned fusion methods — which is better for production hybrid retrieval?",
  chunks: CHUNKS,
  answer: ANSWER,
  citations: CITATIONS,
  grounding: GROUNDING,
  latencyMs: 4283,
};
