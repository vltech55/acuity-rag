"use client";

import {
  BookOpen,
  ExternalLink,
  Search,
  Filter,
  FileText,
  Layers,
  Calendar,
  Plus,
} from "lucide-react";

const PAPERS = [
  {
    arxiv_id: "2401.12345",
    title: "Hybrid Retrieval with Reciprocal Rank Fusion for Dense and Sparse Search",
    authors: "L. Chen, A. Patel, M. Suzuki",
    category: "cs.IR",
    published: "Jan 18, 2024",
    chunks: 4,
    avg_chars: 248,
    abstract:
      "We study reciprocal rank fusion (RRF) as a parameter-free combiner of lexical BM25 and dense vector retrieval. Across BEIR benchmarks, RRF with k=60 outperforms either retriever alone by 4.2 nDCG@10 on average.",
    tags: ["retrieval", "hybrid", "rrf"],
  },
  {
    arxiv_id: "2402.67890",
    title: "Citation-Grounded Generation: Reducing Hallucination in Retrieval-Augmented QA",
    authors: "R. Okafor, J. Lindgren, S. Park",
    category: "cs.CL",
    published: "Feb 22, 2024",
    chunks: 4,
    avg_chars: 213,
    abstract:
      "A constrained decoding scheme that forces LLMs to attribute each generated claim to a retrieved chunk. Faithfulness as measured by RAGAS rises from 0.71 to 0.94 with minimal latency overhead.",
    tags: ["faithfulness", "ragas", "citations"],
  },
  {
    arxiv_id: "2403.11111",
    title: "Chunking Strategies for Long-Document Question Answering",
    authors: "T. Ahmed, K. Volkov",
    category: "cs.CL",
    published: "Mar 7, 2024",
    chunks: 4,
    avg_chars: 196,
    abstract:
      "We compare fixed-size, sentence-boundary, and semantic chunking across scientific papers and legal contracts. Semantic chunking helps on legal text but offers no measurable gain on scientific papers under a 512-token budget.",
    tags: ["chunking", "legal", "long-doc"],
  },
  {
    arxiv_id: "2403.18472",
    title: "Cross-Encoder Reranking is Not Free: A Latency Analysis for Production RAG",
    authors: "M. Friedman, P. Olusola",
    category: "cs.IR",
    published: "Mar 24, 2024",
    chunks: 5,
    avg_chars: 224,
    abstract:
      "Cross-encoder reranking adds 80–120ms on commodity GPUs at k=20 and 2–5x dollar cost. We propose a confidence-gated rerank that skips ~62% of queries with no measurable nDCG@5 loss.",
    tags: ["rerank", "latency", "cost"],
  },
  {
    arxiv_id: "2404.02208",
    title: "On the Sensitivity of Dense Retrievers to Prompt Phrasing",
    authors: "Y. Sasaki, R. Banerjee, J. Whittaker",
    category: "cs.CL",
    published: "Apr 2, 2024",
    chunks: 6,
    avg_chars: 188,
    abstract:
      "Small surface-form changes in query phrasing (e.g. \"explain X\" vs \"what is X\") move Recall@10 by up to 9 points on out-of-domain BEIR subsets. We characterize a fingerprinting probe and suggest mitigations.",
    tags: ["retrieval", "robustness", "evaluation"],
  },
  {
    arxiv_id: "2405.30912",
    title: "HyDE Revisited: When Hypothetical Documents Help (and Hurt)",
    authors: "E. Marchetti, C. Lapointe",
    category: "cs.IR",
    published: "May 12, 2024",
    chunks: 5,
    avg_chars: 207,
    abstract:
      "Hypothetical document embeddings improve out-of-domain Recall@5 by 6–11 points but hurt in-domain by 1.4 points. Domain-detection gating recovers most of the win without the loss.",
    tags: ["hyde", "out-of-domain", "embedding"],
  },
  {
    arxiv_id: "2406.04877",
    title: "Long-Context vs Retrieval: A Cost–Quality Pareto Study",
    authors: "B. Niemi, T. Adesanya",
    category: "cs.CL",
    published: "Jun 8, 2024",
    chunks: 7,
    avg_chars: 241,
    abstract:
      "Across 14 QA datasets, long-context (200k tokens) wins on multi-hop tasks but loses on retrieval-shaped tasks by 4 nDCG@10 — at 8× the cost. Hybrid prompting recovers parity at 2.1× cost.",
    tags: ["long-context", "cost", "pareto"],
  },
  {
    arxiv_id: "2407.21118",
    title: "Faithfulness as a Decoder: A Reranker That Optimizes Citation Coverage",
    authors: "G. Hartmann, S. Pillai",
    category: "cs.CL",
    published: "Jul 18, 2024",
    chunks: 5,
    avg_chars: 219,
    abstract:
      "We reframe reranking as faithfulness maximization, training a small cross-encoder to predict per-claim grounding. Outperforms standard ms-marco rerankers by 3.8 RAGAS-faithfulness points.",
    tags: ["rerank", "faithfulness", "training"],
  },
  {
    arxiv_id: "2408.05201",
    title: "BM25 Is Still a Tough Baseline in 2024",
    authors: "K. Yeoh, A. Vargas, C. Wilkes",
    category: "cs.IR",
    published: "Aug 4, 2024",
    chunks: 4,
    avg_chars: 195,
    abstract:
      "A 2024 audit of MS-MARCO, BEIR-14, and 6 enterprise datasets finds that tuned BM25 beats off-the-shelf dense retrievers on 9 / 20 splits — including 3 of the most-cited enterprise benchmarks.",
    tags: ["bm25", "baseline", "audit"],
  },
];

export default function LibraryPage() {
  const totalChunks = PAPERS.reduce((s, p) => s + p.chunks, 0);
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto animate-slide-up">
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <div className="text-2xs uppercase tracking-[0.18em] text-subtle">Corpus</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mt-1 text-zinc-50">Library</h1>
          <p className="text-sm text-muted mt-2 max-w-lg">
            {PAPERS.length} papers · {totalChunks} chunks · {(totalChunks * 220 / 1024).toFixed(1)} KB indexed body text.
            Sourced from <a href="#" className="text-sienna-400 hover:underline">arXiv cs.IR + cs.CL</a>, filtered by published date and category.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-sienna-500 text-white px-3 py-1.5 text-sm font-medium hover:bg-sienna-400 shadow-glow">
          <Plus className="h-3.5 w-3.5" /> Ingest more papers
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-md rounded-md border border-white/[0.08] bg-surface/60 px-3 py-1.5 text-sm">
          <Search className="h-3.5 w-3.5 text-subtle" />
          <input
            defaultValue=""
            placeholder="Filter by title, author, arxiv ID, tag…"
            className="flex-1 bg-transparent outline-none placeholder:text-subtle text-zinc-100"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-surface/60 px-3 py-1.5 text-xs text-muted hover:text-zinc-100">
          <Filter className="h-3 w-3" /> All categories
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-surface/60 px-3 py-1.5 text-xs text-muted hover:text-zinc-100">
          <Calendar className="h-3 w-3" /> Last 12 months
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {PAPERS.map((p) => (
          <article
            key={p.arxiv_id}
            className="rounded-lg border border-white/[0.06] bg-surface/60 p-5 hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <a
                href={`https://arxiv.org/abs/${p.arxiv_id}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-2xs text-sienna-300/90 hover:text-sienna-300 inline-flex items-center gap-1"
              >
                arXiv:{p.arxiv_id} <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <span className="font-mono text-2xs text-subtle">{p.published}</span>
            </div>
            <h3 className="font-serif text-base font-medium tracking-tight text-zinc-50 leading-snug mb-1.5">
              {p.title}
            </h3>
            <p className="text-2xs italic text-muted mb-3">
              {p.authors} · <span className="not-italic font-mono text-subtle">{p.category}</span>
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
              {p.abstract}
            </p>
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-2xs">
              <div className="flex items-center gap-3 text-subtle">
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-2.5 w-2.5" /> {p.chunks} chunks
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-2.5 w-2.5" /> ~{p.avg_chars} chars/chunk
                </span>
              </div>
              <div className="flex gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="inline-block px-1.5 py-0.5 rounded bg-sienna-500/10 text-sienna-300 font-mono text-2xs">{t}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
