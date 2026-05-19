"use client";

import { ExternalLink, BookMarked, FileText } from "lucide-react";
import type { ChunkOut } from "@/lib/api";

export function SourcesList({ chunks }: { chunks: ChunkOut[] }) {
  if (!chunks.length) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-surface/60 p-5">
        <div className="text-2xs uppercase tracking-[0.15em] text-subtle">References</div>
        <div className="mt-3 text-center text-2xs text-subtle">
          <div className="mx-auto h-10 w-10 rounded-full border border-dashed border-white/[0.12] flex items-center justify-center mb-3">
            <BookMarked className="h-4 w-4 text-zinc-600" />
          </div>
          Citations will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-surface/60">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="text-2xs uppercase tracking-[0.15em] text-subtle">References</div>
        <div className="text-2xs text-subtle font-mono">{chunks.length} sources</div>
      </div>
      <ol className="px-2 py-2 space-y-1.5">
        {chunks.map((c, i) => {
          const score = c.rerank_score ?? c.rrf_score ?? 0;
          const scoreLabel = c.rerank_score != null ? "rerank" : "rrf";
          return (
            <li
              key={c.id}
              className="rounded-md px-3 py-2.5 hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded bg-sienna-500/15 text-sienna-300 text-2xs font-medium font-mono">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-serif text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
                      {c.paper_title}
                    </div>
                  </div>
                  <a
                    href={`https://arxiv.org/abs/${c.arxiv_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-2xs font-mono text-sienna-300/90 hover:text-sienna-300"
                  >
                    arXiv:{c.arxiv_id} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  {c.section ? (
                    <div className="mt-1 inline-flex items-center gap-1 text-2xs text-muted italic">
                      <FileText className="h-2.5 w-2.5" /> {c.section}
                    </div>
                  ) : null}
                  <div className="mt-1.5 text-2xs text-muted leading-relaxed line-clamp-3">
                    {c.content}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-2xs text-subtle font-mono">
                    <span>BM25 {c.bm25_score?.toFixed(2) ?? "—"}</span>
                    <span className="text-white/10">·</span>
                    <span>cos {c.semantic_score?.toFixed(2) ?? "—"}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-zinc-300">{scoreLabel} {score.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
