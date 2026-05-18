"use client";

import type { CitationOut } from "@/lib/api";
import { CitationMarker } from "./citation-marker";

const MARKER_RE = /\[S(\d+)\]/g;

export function AnswerText({
  text,
  citations,
}: {
  text: string;
  citations: CitationOut[];
}) {
  const byMarker = new Map(citations.map((c) => [c.marker, c]));
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  for (const m of text.matchAll(MARKER_RE)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    const marker = `S${m[1]}`;
    parts.push(
      <CitationMarker key={`${marker}-${i++}`} marker={marker} citation={byMarker.get(marker)} />
    );
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <span className="whitespace-pre-wrap leading-relaxed">{parts}</span>;
}
