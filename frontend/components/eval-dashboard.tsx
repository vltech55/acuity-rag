"use client";

import { useEffect, useState } from "react";
import { fetchEvalHistory, fetchLatestEval, type EvalRunOut } from "@/lib/api";

function Metric({
  label,
  value,
  fmt = "0.000",
}: {
  label: string;
  value: number | null;
  fmt?: "0.000" | "0";
}) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="text-xl font-mono mt-1">
        {value === null ? "—" : fmt === "0" ? value.toFixed(0) : value.toFixed(3)}
      </div>
    </div>
  );
}

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

  if (err) return <div className="p-6 text-red-300">Failed: {err}</div>;
  if (!latest) {
    return (
      <div className="p-6 text-neutral-400">
        No eval runs yet. Run <code className="text-sky-400">make eval</code>.
      </div>
    );
  }

  const m = latest.metrics;
  return (
    <div className="px-6 py-6 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Latest Eval</h1>
        <div className="text-sm text-neutral-400">
          {new Date(latest.created_at).toLocaleString()} · git {latest.git_sha ?? "—"} · n={m.n}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Precision@5" value={m.precision_at_5} />
        <Metric label="Recall@5" value={m.recall_at_5} />
        <Metric label="MRR" value={m.mrr} />
        <Metric label="Faithfulness" value={m.faithfulness} />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">RAGAS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Ctx Precision" value={m.ragas_context_precision} />
          <Metric label="Ctx Recall" value={m.ragas_context_recall} />
          <Metric label="Answer Rel." value={m.ragas_answer_relevancy} />
          <Metric label="Faithfulness" value={m.ragas_faithfulness} />
        </div>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
          History ({history.length})
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-800">
              <th className="py-2">When</th>
              <th>SHA</th>
              <th>P@5</th>
              <th>R@5</th>
              <th>MRR</th>
              <th>Faith.</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => (
              <tr key={r.id} className="border-b border-neutral-900">
                <td className="py-1">{new Date(r.created_at).toLocaleString()}</td>
                <td className="py-1 font-mono text-neutral-400">{r.git_sha ?? "—"}</td>
                <td className="py-1 font-mono">{r.metrics.precision_at_5.toFixed(3)}</td>
                <td className="py-1 font-mono">{r.metrics.recall_at_5.toFixed(3)}</td>
                <td className="py-1 font-mono">{r.metrics.mrr.toFixed(3)}</td>
                <td className="py-1 font-mono">{r.metrics.faithfulness.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
