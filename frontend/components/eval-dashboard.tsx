"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Target,
  Search,
  Trophy,
  ShieldCheck,
  GitCommit,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { fetchEvalHistory, fetchLatestEval, type EvalRunOut } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function EvalDashboard() {
  const [latest, setLatest] = useState<EvalRunOut | null>(null);
  const [history, setHistory] = useState<EvalRunOut[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [l, h] = await Promise.all([fetchLatestEval(), fetchEvalHistory(20)]);
        setLatest(l);
        setHistory(h);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  const series = useMemo(() => {
    const reversed = [...history].reverse();
    return reversed.map((r) => ({
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      "P@5": Number(r.metrics.precision_at_5.toFixed(3)),
      "R@5": Number(r.metrics.recall_at_5.toFixed(3)),
      MRR: Number(r.metrics.mrr.toFixed(3)),
      Faith: Number(r.metrics.faithfulness.toFixed(3)),
    }));
  }, [history]);

  if (err) return <div className="p-6 text-rose-300">Failed: {err}</div>;
  if (!latest) {
    return (
      <div className="p-6 text-subtle">
        No eval runs yet. Run <code className="text-sienna-300">make eval</code>.
      </div>
    );
  }

  const m = latest.metrics;
  const first = history[history.length - 1]?.metrics;
  const deltaP = first ? ((m.precision_at_5 - first.precision_at_5) / first.precision_at_5) * 100 : 0;
  const deltaR = first ? ((m.recall_at_5 - first.recall_at_5) / first.recall_at_5) * 100 : 0;
  const deltaM = first ? ((m.mrr - first.mrr) / first.mrr) * 100 : 0;
  const deltaF = first ? ((m.faithfulness - first.faithfulness) / first.faithfulness) * 100 : 0;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full space-y-6 animate-slide-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xs uppercase tracking-[0.18em] text-subtle">Experiment log</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mt-1 text-zinc-50">Retrieval & generation</h1>
          <p className="text-sm text-muted mt-2 max-w-lg">
            {history.length} runs over the last 4 weeks · evaluated on a fixed {m.n}-question test set ·
            latest commit{" "}
            <code className="text-sienna-300">{latest.git_sha ?? "—"}</code>
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-300 px-2.5 py-1 text-2xs">
          <TrendingUp className="h-3 w-3" />
          +{deltaF.toFixed(1)}% faithfulness · +{deltaP.toFixed(1)}% precision
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <EvalMetric icon={<Target className="h-3.5 w-3.5" />} label="Precision @5"  value={m.precision_at_5} delta={deltaP} color="#c97a4e" />
        <EvalMetric icon={<Search className="h-3.5 w-3.5" />} label="Recall @5"     value={m.recall_at_5}    delta={deltaR} color="#67c39a" />
        <EvalMetric icon={<Trophy className="h-3.5 w-3.5" />} label="MRR"            value={m.mrr}            delta={deltaM} color="#b89b6f" />
        <EvalMetric icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Faithfulness" value={m.faithfulness} delta={deltaF} color="#db8b5f" />
      </div>

      <Card>
        <CardHeader
          title="Metric progression"
          subtitle={`A 28-day learning curve across ${history.length} runs`}
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={series} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                {["P@5", "R@5", "MRR", "Faith"].map((k, i) => {
                  const c = ["#c97a4e", "#67c39a", "#b89b6f", "#db8b5f"][i];
                  return (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid stroke="rgba(245,222,179,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="#8a7560" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis stroke="#8a7560" fontSize={11} tickLine={false} axisLine={false} tickMargin={4} width={48} />
              <Tooltip
                contentStyle={{ background: "#221b16", border: "1px solid rgba(245,222,179,0.1)", borderRadius: 8, fontSize: 12, color: "#f0e6d6" }}
                cursor={{ stroke: "rgba(245,222,179,0.12)", strokeWidth: 1 }}
              />
              {[
                { k: "P@5",   c: "#c97a4e" },
                { k: "R@5",   c: "#67c39a" },
                { k: "MRR",   c: "#b89b6f" },
                { k: "Faith", c: "#db8b5f" },
              ].map((s) => (
                <Area key={s.k} type="monotone" dataKey={s.k} stroke={s.c} strokeWidth={2} fill={`url(#g-${s.k})`} isAnimationActive={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-4 text-2xs text-subtle">
            <Legend color="#c97a4e" label="Precision @5" />
            <Legend color="#67c39a" label="Recall @5" />
            <Legend color="#b89b6f" label="MRR" />
            <Legend color="#db8b5f" label="Faithfulness" />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="RAGAS benchmark" subtitle="Latest run, independent harness" />
          <CardBody className="grid grid-cols-2 gap-3">
            <RagasCell label="Context Precision" value={m.ragas_context_precision} />
            <RagasCell label="Context Recall"    value={m.ragas_context_recall} />
            <RagasCell label="Answer Relevancy"  value={m.ragas_answer_relevancy} />
            <RagasCell label="Faithfulness"      value={m.ragas_faithfulness} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Run history"
            subtitle={`${history.length} runs · sortable`}
            action={<button className="text-2xs text-subtle hover:text-zinc-100">All <ArrowUpRight className="inline h-3 w-3" /></button>}
          />
          <div className="px-3 pb-3 space-y-1 max-h-[340px] overflow-y-auto">
            {history.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/[0.03]">
                <GitCommit className="h-3.5 w-3.5 text-subtle" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-zinc-200 truncate">{r.git_sha ?? "—"}</div>
                  <div className="text-2xs text-subtle">{new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                </div>
                <span className="text-2xs font-mono text-sienna-300 w-12 text-right">{r.metrics.precision_at_5.toFixed(3)}</span>
                <span className="text-2xs font-mono text-emerald-300 w-12 text-right">{r.metrics.recall_at_5.toFixed(3)}</span>
                <span className="text-2xs font-mono text-amber-300 w-12 text-right">{r.metrics.faithfulness.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-muted">{label}</span>
    </span>
  );
}

function EvalMetric({ icon, label, value, delta, color }: { icon: React.ReactNode; label: string; value: number; delta: number; color: string }) {
  const positive = delta > 0.5;
  return (
    <div className="rounded-lg border border-white/[0.06] bg-surface/60 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.15em] text-subtle">
          <span style={{ color }}>{icon}</span> {label}
        </div>
        <span className={`text-2xs font-medium ${positive ? "text-emerald-300" : "text-rose-300"}`}>
          {positive ? "+" : ""}{delta.toFixed(1)}%
        </span>
      </div>
      <div className="mt-2 font-serif text-3xl font-medium tabular-nums">{value.toFixed(3)}</div>
    </div>
  );
}

function RagasCell({ label, value }: { label: string; value: number | null }) {
  if (value == null) return (
    <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="text-2xs uppercase tracking-[0.15em] text-subtle">{label}</div>
      <div className="text-lg font-mono mt-1 text-subtle">—</div>
    </div>
  );
  const pct = value * 100;
  const color = value > 0.9 ? "#67c39a" : value > 0.75 ? "#db8b5f" : "#f43f5e";
  return (
    <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="text-2xs uppercase tracking-[0.15em] text-subtle">{label}</div>
      <div className="font-serif text-2xl font-medium mt-1 tabular-nums">{value.toFixed(3)}</div>
      <div className="mt-2 h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
