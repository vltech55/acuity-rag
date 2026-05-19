"use client";

import {
  Settings as SettingsIcon,
  Cpu,
  ScissorsLineDashed,
  Filter,
  Beaker,
  KeyRound,
  Webhook,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto animate-slide-up">
      <div className="mb-1">
        <div className="text-2xs uppercase tracking-[0.18em] text-subtle">Workspace</div>
        <h1 className="font-serif text-3xl font-medium tracking-tight mt-1 text-zinc-50">Settings</h1>
        <p className="text-sm text-muted mt-2 max-w-2xl">
          The knobs that matter. Defaults are tuned for scientific corpora; tighten reranking and chunking for stricter domains.
        </p>
      </div>

      <div className="mt-7 space-y-4">

        <Section
          icon={<Cpu className="h-4 w-4 text-sienna-400" />}
          title="Retrieval pipeline"
          subtitle="Stage-by-stage configuration of the hybrid retriever"
        >
          <Row label="Lexical retriever" value="BM25 over content_tsv" hint="GIN-indexed Postgres tsvector · english analyzer">
            <Chip ok>active</Chip>
          </Row>
          <Row label="Dense retriever" value="pgvector · HNSW (m=16, ef=64)" hint="cosine distance · 1536-d · text-embedding-3-small">
            <Chip ok>active</Chip>
          </Row>
          <Row label="Fusion" value="Reciprocal Rank Fusion (k = 60)" hint="parameter-free combiner — robust to retriever-quality skew">
            <Chip ok>RRF</Chip>
          </Row>
          <Row label="Re-ranking" value="cross-encoder / ms-marco-MiniLM-L-6-v2" hint="rerank top-15 → keep top-5 · gated on RRF score &lt; 0.022">
            <Chip ok>active · gated</Chip>
          </Row>
          <Row label="HyDE" value="off — domain-detection gate" hint="enable for out-of-domain queries · +6–11 pt Recall@5 on OOD">
            <Chip>disabled</Chip>
          </Row>
        </Section>

        <Section
          icon={<ScissorsLineDashed className="h-4 w-4 text-sienna-400" />}
          title="Chunking"
          subtitle="How documents are split before embedding"
        >
          <Row label="Strategy" value="Fixed-size, sentence-aware" hint="best Recall@5 across scientific QA">
            <Chip ok>default</Chip>
          </Row>
          <Row label="Chunk size" value="512 tokens · 64 overlap" hint="empirical sweet spot for prose · widen for tables/figures" />
          <Row label="Min chunk size" value="120 tokens" hint="drop fragments smaller than this — usually figure captions" />
          <Row label="Boilerplate stripping" value="references, citations, page numbers" hint="regex + heuristic · ~9% bytes recovered on arXiv" />
        </Section>

        <Section
          icon={<Filter className="h-4 w-4 text-sienna-400" />}
          title="Generation"
          subtitle="Decoder + verifier configuration"
        >
          <Row label="Model" value="claude-sonnet-4-6" hint="default · falls back to opus-4-7 on high-stakes mode">
            <Chip ok>locked</Chip>
          </Row>
          <Row label="Top-k context" value="5 chunks · ~2,500 tokens" hint="reranked + deduped" />
          <Row label="Citation enforcement" value="markered post-hoc verifier" hint="discards completions where any claim lacks support">
            <Chip ok>strict</Chip>
          </Row>
          <Row label="Faithfulness gate" value="reject if grounded &lt; 0.7" hint="auto re-runs once with widened k before failing the answer">
            <Chip ok>0.70</Chip>
          </Row>
        </Section>

        <Section
          icon={<Beaker className="h-4 w-4 text-sienna-400" />}
          title="Evaluations"
          subtitle="Cadence and gold sets"
        >
          <Row label="Cadence" value="nightly @ 03:00 UTC" hint="48-question fixed test set + 6 unit-tests" />
          <Row label="Metrics" value="P@5, R@5, MRR, faithfulness, RAGAS-4" hint="RAGAS evaluated against gpt-4o-judge" />
          <Row label="Gate on PR" value="P@5 must not drop &gt; 2 pts vs main" hint="enforced by CI · blocks merge on regression">
            <Chip ok>enabled</Chip>
          </Row>
        </Section>

        <Section
          icon={<KeyRound className="h-4 w-4 text-sienna-400" />}
          title="Secrets · access"
          subtitle="Where the keys live and who can reach them"
        >
          <Row label="LLM provider keys" value="Anthropic, OpenAI" hint="rotated weekly · sealed via age + KMS · audit-logged">
            <Chip ok>healthy</Chip>
          </Row>
          <Row label="Database" value="postgres://rag@…/rag" hint="encrypted at rest · per-tenant row-level isolation">
            <Chip ok>RLS</Chip>
          </Row>
          <Row label="API token" value="acu_•••••••••••3a1f" hint="exposes /chat and /eval as read-only">
            <button className="font-mono text-2xs text-sienna-300 hover:text-sienna-200">rotate</button>
          </Row>
        </Section>

        <Section
          icon={<Webhook className="h-4 w-4 text-sienna-400" />}
          title="Notifications"
          subtitle="Where regressions and eval results land"
        >
          <Row label="Slack · #acuity-evals" value="nightly eval summary + faithfulness drops" hint="fires when any metric drops &gt; 1 pt overnight">
            <Chip ok>connected</Chip>
          </Row>
          <Row label="Email digest" value="weekly · Monday 09:00 UTC" hint="metric deltas + top-3 inquiries by token spend" />
          <Row label="Webhook" value="acuity.example/webhooks/eval" hint="POST {run_id, metrics, deltas} · HMAC-signed" />
        </Section>

      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/[0.06] bg-surface/60 overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-sienna-500/10 flex items-center justify-center">{icon}</div>
          <div>
            <div className="font-serif text-base font-medium text-zinc-50">{title}</div>
            {subtitle ? <div className="text-2xs text-subtle">{subtitle}</div> : null}
          </div>
        </div>
        <button className="text-2xs text-subtle hover:text-zinc-100">Edit</button>
      </header>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </section>
  );
}

function Row({ label, value, hint, children }: { label: string; value: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr_auto] gap-4 items-center px-5 py-3.5">
      <div className="text-2xs uppercase tracking-[0.12em] text-subtle">{label}</div>
      <div>
        <div className="text-sm text-zinc-100 font-mono">{value}</div>
        {hint ? <div className="text-2xs text-muted mt-0.5">{hint}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Chip({ children, ok = false }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${ok ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20" : "bg-white/[0.04] text-muted ring-1 ring-white/[0.06]"}`}>
      {ok ? <Check className="h-2.5 w-2.5" /> : null}
      {children}
    </span>
  );
}
