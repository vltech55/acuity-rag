"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Send, Sparkles, BookMarked, Clock, ShieldCheck, Quote } from "lucide-react";
import { API_BASE, type ChunkOut, type CitationOut, type GroundingScore } from "@/lib/api";
import { DEMO_CHAT } from "./demo-data";
import { AnswerText } from "./answer-text";
import { SourcesList } from "./sources-list";
import { GroundingMeter } from "./grounding-meter";
import { Card, CardBody } from "@/components/ui/card";

type Phase = "idle" | "retrieving" | "streaming" | "scoring" | "done" | "error";

const SAMPLE_QUERIES = [
  "How does reciprocal rank fusion work?",
  "Best chunking strategy for scientific vs legal docs?",
  "Compare RRF vs learned fusion methods",
  "How is hallucination measured in RAG?",
];

export function Chat() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [chunks, setChunks] = useState<ChunkOut[]>([]);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<CitationOut[]>([]);
  const [grounding, setGrounding] = useState<GroundingScore[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const sp = useSearchParams();

  useEffect(() => {
    if (sp?.get("demo") === "1") {
      setQuestion(DEMO_CHAT.question);
      setChunks(DEMO_CHAT.chunks);
      setAnswer(DEMO_CHAT.answer);
      setCitations(DEMO_CHAT.citations);
      setGrounding(DEMO_CHAT.grounding);
      setLatencyMs(DEMO_CHAT.latencyMs);
      setPhase("done");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setChunks([]); setAnswer(""); setCitations([]);
    setGrounding([]); setLatencyMs(null); setError(null);
  }

  async function submit(e: React.FormEvent | null, override?: string) {
    if (e) e.preventDefault();
    const q = (override ?? input).trim();
    if (!q || phase === "streaming" || phase === "retrieving") return;
    reset();
    setQuestion(q);
    setPhase("retrieving");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: 5 }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`backend ${resp.status}`);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const re = /\r?\n\r?\n/;
        let m;
        while ((m = re.exec(buffer))) {
          const raw = buffer.slice(0, m.index);
          buffer = buffer.slice(m.index + m[0].length);
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
      if (event === "sources") { setChunks(obj.chunks as ChunkOut[]); setPhase("streaming"); }
      else if (event === "token") { setAnswer((prev) => prev + (obj.text as string)); }
      else if (event === "citations") { setCitations(obj.citations as CitationOut[]); setPhase("scoring"); }
      else if (event === "grounding") { setGrounding(obj.grounding as GroundingScore[]); }
      else if (event === "done") { setLatencyMs(obj.latency_ms as number); }
    } catch {}
  }

  const isLoading = phase === "streaming" || phase === "retrieving";
  const groundedPct = grounding.length === 0
    ? null
    : (grounding.filter((g) => g.grounded).length / grounding.length) * 100;
  const groundedCount = grounding.filter((g) => g.grounded).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 px-6 py-8 max-w-6xl mx-auto w-full animate-slide-up">
      <div className="space-y-5 min-w-0">
        {phase === "idle" && !answer ? (
          <div className="text-center py-12">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-sienna-500/30 bg-sienna-500/10 mb-5">
              <BookMarked className="h-5 w-5 text-sienna-400" />
            </div>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-50">
              Read the literature, faster.
            </h1>
            <p className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">
              Ask anything across the indexed papers. Hybrid retrieval (BM25 + dense),
              cross-encoder reranking, and answers cited line-by-line back to the source.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(null, q)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-xs text-muted hover:border-sienna-500/40 hover:text-zinc-100 hover:bg-sienna-500/[0.06] transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {question ? (
          <div className="border-l-2 border-sienna-500/40 pl-4 py-1">
            <div className="text-2xs uppercase tracking-[0.15em] text-subtle mb-1">Inquiry</div>
            <div className="font-serif text-lg text-zinc-100 leading-snug">{question}</div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>
        ) : null}

        {(answer || isLoading) && (
          <Card>
            <CardBody className="space-y-3">
              {phase === "retrieving" ? (
                <div className="text-sm text-subtle flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sienna-400" />
                  <span>Searching the corpus · BM25 ∪ pgvector ANN · RRF fusion</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.15em] text-subtle pb-1">
                  <Quote className="h-3 w-3 text-sienna-400" />
                  Grounded answer
                </div>
              )}
              <div className="font-serif text-[15.5px] leading-[1.75] text-zinc-100">
                <AnswerText text={answer} citations={citations} />
              </div>
              {phase !== "retrieving" && (answer || latencyMs !== null) ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-white/[0.06] text-2xs text-subtle">
                  {groundedPct !== null ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> {groundedCount}/{grounding.length} claims grounded
                      <span className="text-subtle">({groundedPct.toFixed(0)}%)</span>
                    </span>
                  ) : null}
                  {latencyMs !== null ? (
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {(latencyMs / 1000).toFixed(2)}s</span>
                  ) : null}
                  <span className="inline-flex items-center gap-1"><BookMarked className="h-3 w-3" /> {chunks.length} sources</span>
                  <span className="font-mono text-subtle">claude-sonnet-4-6</span>
                </div>
              ) : null}
            </CardBody>
            {grounding.length > 0 ? (
              <details className="border-t border-white/[0.06] px-5 py-3 text-2xs text-subtle">
                <summary className="cursor-pointer hover:text-zinc-200 inline-flex items-center gap-1">
                  Per-claim grounding breakdown
                </summary>
                <div className="mt-3"><GroundingMeter scores={grounding} /></div>
              </details>
            ) : null}
          </Card>
        )}

        <form onSubmit={(e) => submit(e)} className="sticky bottom-4 mt-6">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-surface/95 px-3 py-2 backdrop-blur-xl shadow-glow">
            <Sparkles className="h-4 w-4 text-sienna-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Reading…" : "Ask anything about the indexed literature"}
              className="flex-1 bg-transparent text-sm placeholder:text-subtle focus:outline-none font-serif"
              disabled={isLoading}
            />
            <kbd className="hidden md:inline-flex h-5 px-1 items-center rounded border border-white/10 bg-white/[0.04] text-[10px] text-subtle">⌘↵</kbd>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-sienna-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sienna-400 disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Inquire
            </button>
          </div>
        </form>
      </div>

      <aside className="lg:sticky lg:top-20 self-start">
        <SourcesList chunks={chunks} />
      </aside>
    </div>
  );
}
