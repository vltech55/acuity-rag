"use client";

import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { API_BASE, type ChunkOut, type CitationOut, type GroundingScore } from "@/lib/api";
import { AnswerText } from "./answer-text";
import { SourcesList } from "./sources-list";
import { GroundingMeter } from "./grounding-meter";

type Phase = "idle" | "retrieving" | "streaming" | "scoring" | "done" | "error";

export function Chat() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [chunks, setChunks] = useState<ChunkOut[]>([]);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<CitationOut[]>([]);
  const [grounding, setGrounding] = useState<GroundingScore[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    setChunks([]);
    setAnswer("");
    setCitations([]);
    setGrounding([]);
    setLatencyMs(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || phase === "streaming" || phase === "retrieving") return;
    reset();
    setPhase("retrieving");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, top_k: 5 }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        throw new Error(`backend ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          handleEvent(raw);
        }
      }
      setPhase("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setPhase("error");
      }
    }
  }

  function handleEvent(raw: string) {
    const lines = raw.split("\n");
    let event = "message";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) return;
    try {
      const obj = JSON.parse(data);
      if (event === "sources") {
        setChunks(obj.chunks as ChunkOut[]);
        setPhase("streaming");
      } else if (event === "token") {
        setAnswer((prev) => prev + (obj.text as string));
      } else if (event === "citations") {
        setCitations(obj.citations as CitationOut[]);
        setPhase("scoring");
      } else if (event === "grounding") {
        setGrounding(obj.grounding as GroundingScore[]);
      } else if (event === "done") {
        setLatencyMs(obj.latency_ms as number);
      }
    } catch {
      // ignore malformed events
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-6 py-6 max-w-6xl mx-auto w-full">
      <div className="space-y-4">
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the indexed papers…"
            className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            disabled={phase === "streaming" || phase === "retrieving"}
          />
          <button
            type="submit"
            disabled={!input.trim() || phase === "streaming" || phase === "retrieving"}
            className="inline-flex items-center gap-1 rounded bg-sky-500 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-sky-400 disabled:opacity-40"
          >
            {phase === "streaming" || phase === "retrieving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Ask
          </button>
        </form>

        {error ? (
          <div className="rounded border border-red-700 bg-red-950/50 p-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {(answer || phase !== "idle") && (
          <div className="rounded border border-neutral-800 bg-neutral-900/40 p-4 min-h-[10rem]">
            {phase === "retrieving" ? (
              <div className="text-sm text-neutral-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Hybrid retrieval…
              </div>
            ) : null}
            <AnswerText text={answer} citations={citations} />
          </div>
        )}

        {grounding.length > 0 && (
          <div className="rounded border border-neutral-800 bg-neutral-900/40 p-4">
            <GroundingMeter scores={grounding} />
          </div>
        )}

        {latencyMs !== null ? (
          <div className="text-xs text-neutral-500">
            Total latency: <span className="font-mono">{latencyMs.toFixed(0)} ms</span>
          </div>
        ) : null}
      </div>

      <aside>
        <SourcesList chunks={chunks} />
      </aside>
    </div>
  );
}
