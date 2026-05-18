"use client";

import type { ChunkOut } from "@/lib/api";

export function SourcesList({ chunks }: { chunks: ChunkOut[] }) {
  if (!chunks.length) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        Retrieved sources ({chunks.length})
      </div>
      <ol className="space-y-2 text-sm">
        {chunks.map((c, i) => (
          <li
            key={c.id}
            className="rounded border border-neutral-800 bg-neutral-900/50 p-2"
          >
            <div className="flex items-center justify-between text-xs">
              <a
                href={`https://arxiv.org/abs/${c.arxiv_id}`}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline"
              >
                [S{i + 1}] arXiv:{c.arxiv_id}
              </a>
              <span className="font-mono text-neutral-500">
                {c.rerank_score !== null
                  ? `rerank ${c.rerank_score.toFixed(2)}`
                  : `rrf ${c.rrf_score?.toFixed(3)}`}
              </span>
            </div>
            <div className="mt-1 text-neutral-200">{c.paper_title}</div>
            {c.section ? (
              <div className="text-xs text-neutral-500 italic">{c.section}</div>
            ) : null}
            <div className="mt-1 line-clamp-3 text-xs text-neutral-400">
              {c.content}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
