export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type ChunkOut = {
  id: string;
  paper_id: string;
  chunk_index: number;
  content: string;
  section: string | null;
  arxiv_id: string;
  paper_title: string;
  bm25_score: number | null;
  semantic_score: number | null;
  rrf_score: number | null;
  rerank_score: number | null;
  final_rank: number;
};

export type CitationOut = {
  marker: string;
  chunk_id: string;
  paper_id: string;
  arxiv_id: string;
  paper_title: string;
  section: string | null;
  content: string;
};

export type GroundingScore = {
  marker: string;
  entailment: number;
  grounded: boolean;
};

export type EvalMetrics = {
  n: number;
  precision_at_5: number;
  recall_at_5: number;
  mrr: number;
  faithfulness: number;
  ragas_context_precision: number | null;
  ragas_context_recall: number | null;
  ragas_answer_relevancy: number | null;
  ragas_faithfulness: number | null;
};

export type EvalRunOut = {
  id: string;
  git_sha: string | null;
  metrics: EvalMetrics;
  created_at: string;
};

export async function fetchLatestEval(): Promise<EvalRunOut | null> {
  const r = await fetch(`${API_BASE}/eval/runs/latest`, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`eval/latest ${r.status}`);
  return (await r.json()) as EvalRunOut;
}

export async function fetchEvalHistory(limit = 20): Promise<EvalRunOut[]> {
  const r = await fetch(`${API_BASE}/eval/runs?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`eval/runs ${r.status}`);
  return (await r.json()) as EvalRunOut[];
}
