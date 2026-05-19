"use client";

import { Quote, Clock, ShieldCheck, BookMarked, Search, ChevronRight } from "lucide-react";

const HISTORY = [
  { q: "Compare RRF against learned fusion methods — which is better for production hybrid retrieval?",
    answer_preview: "RRF combines ranked lists from heterogeneous retrievers by summing 1/(k + rank_r(d))…",
    ago: "12 min", lat: 4.28, sources: 5, grounded: "5/5", arxiv: ["2401.12345", "2402.67890"] },
  { q: "What's the best chunking strategy for scientific vs legal documents?",
    answer_preview: "Start with 512-token fixed-size chunks for prose, switch to semantic for highly structured…",
    ago: "1h", lat: 3.12, sources: 3, grounded: "4/4", arxiv: ["2403.11111"] },
  { q: "How does reciprocal rank fusion work and what is the recommended k value?",
    answer_preview: "RRF requires no score normalization, making it especially robust when combining lexical…",
    ago: "1h", lat: 6.41, sources: 5, grounded: "3/3", arxiv: ["2401.12345"] },
  { q: "Is hypothetical document embedding (HyDE) worth the latency?",
    answer_preview: "HyDE improves out-of-domain Recall@5 by 6–11 points but hurts in-domain by 1.4 points…",
    ago: "3h", lat: 5.07, sources: 4, grounded: "5/5", arxiv: ["2405.30912", "2401.12345"] },
  { q: "When does long-context win over retrieval?",
    answer_preview: "Long-context wins on multi-hop tasks but loses on retrieval-shaped tasks by 4 nDCG@10…",
    ago: "5h", lat: 6.92, sources: 6, grounded: "6/6", arxiv: ["2406.04877"] },
  { q: "Is cross-encoder reranking still worth it in 2024?",
    answer_preview: "Cross-encoder reranking adds 80–120ms at k=20 and 2–5× dollar cost. A confidence-gated…",
    ago: "yesterday", lat: 4.18, sources: 5, grounded: "4/4", arxiv: ["2403.18472"] },
  { q: "Can faithfulness be optimized directly at the reranker step?",
    answer_preview: "Faithfulness reranking trains a small cross-encoder to predict per-claim grounding…",
    ago: "yesterday", lat: 4.84, sources: 4, grounded: "3/3", arxiv: ["2407.21118", "2402.67890"] },
  { q: "Is BM25 still a serious baseline in 2024?",
    answer_preview: "Tuned BM25 beats off-the-shelf dense retrievers on 9 / 20 splits across MS-MARCO and BEIR…",
    ago: "2d", lat: 3.62, sources: 3, grounded: "2/3", arxiv: ["2408.05201"] },
  { q: "How sensitive are dense retrievers to query phrasing?",
    answer_preview: "Surface-form changes move Recall@10 by up to 9 points on out-of-domain subsets…",
    ago: "2d", lat: 4.41, sources: 4, grounded: "4/4", arxiv: ["2404.02208"] },
  { q: "What's the per-call cost overhead of citation-grounded decoding?",
    answer_preview: "Citation grounding adds ~8% latency at the verification step; cost overhead is negligible…",
    ago: "3d", lat: 4.02, sources: 3, grounded: "3/3", arxiv: ["2402.67890"] },
];

export default function HistoryPage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto animate-slide-up">
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <div className="text-2xs uppercase tracking-[0.18em] text-subtle">Workspace</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mt-1 text-zinc-50">Inquiry log</h1>
          <p className="text-sm text-muted mt-2 max-w-xl">
            Every inquiry, the answer it produced, and the sources it cited.
            Replay or fork any of them — re-run with a different model, top-k, or rerank gate.
          </p>
        </div>
        <div className="flex items-center gap-2 text-2xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5">
            <ShieldCheck className="h-3 w-3" />
            avg grounded · 0.94
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] text-muted px-2.5 py-0.5">
            <Clock className="h-3 w-3" />
            median 4.4 s
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-md rounded-md border border-white/[0.08] bg-surface/60 px-3 py-1.5 text-sm">
          <Search className="h-3.5 w-3.5 text-subtle" />
          <input
            placeholder="Search past inquiries…"
            className="flex-1 bg-transparent outline-none placeholder:text-subtle text-zinc-100"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-surface/60 p-0.5 text-xs">
          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-zinc-100">All · {HISTORY.length}</span>
          <span className="px-2 py-0.5 rounded text-muted">Mine</span>
          <span className="px-2 py-0.5 rounded text-muted">Shared</span>
        </div>
      </div>

      <ol className="mt-6 relative">
        <div className="absolute left-4 top-3 bottom-3 w-px bg-gradient-to-b from-sienna-500/30 via-white/[0.06] to-transparent"></div>
        {HISTORY.map((h, i) => (
          <li key={i} className="relative pl-12 pb-5 group cursor-pointer">
            <span className="absolute left-[10px] top-1.5 w-3 h-3 rounded-full bg-sienna-500 ring-4 ring-bg group-hover:ring-sienna-500/20 transition" />
            <div className="rounded-lg border border-white/[0.06] bg-surface/60 p-4 hover:border-white/[0.12] transition-colors">
              <div className="flex items-start gap-3">
                <Quote className="h-4 w-4 text-sienna-400/70 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-base text-zinc-50 leading-snug">{h.q}</div>
                  <div className="mt-1.5 text-xs text-muted line-clamp-1 italic">{h.answer_preview}</div>
                </div>
                <div className="text-2xs text-subtle font-mono whitespace-nowrap">{h.ago} ago</div>
                <ChevronRight className="h-3.5 w-3.5 text-subtle group-hover:text-zinc-100 transition" />
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] flex items-center gap-3 text-2xs text-subtle">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span className="font-mono">{h.grounded} grounded</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookMarked className="h-3 w-3" />
                  <span className="font-mono">{h.sources} sources</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{h.lat.toFixed(2)}s</span>
                </span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono">
                  {h.arxiv.slice(0, 2).map((a) => (
                    <span key={a} className="px-1.5 py-0.5 rounded bg-sienna-500/10 text-sienna-300">arXiv:{a}</span>
                  ))}
                  {h.arxiv.length > 2 ? <span className="text-subtle">+{h.arxiv.length - 2}</span> : null}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
