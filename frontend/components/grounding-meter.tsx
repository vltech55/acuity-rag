"use client";

import type { GroundingScore } from "@/lib/api";

export function GroundingMeter({ scores }: { scores: GroundingScore[] }) {
  if (!scores.length) {
    return <div className="text-xs text-neutral-500">No grounding scores yet.</div>;
  }
  const mean = scores.reduce((a, s) => a + s.entailment, 0) / scores.length;
  const grounded = scores.filter((s) => s.grounded).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">Faithfulness</span>
        <span className="font-mono text-neutral-200">{mean.toFixed(2)}</span>
      </div>
      <div className="grounding-bar" />
      <div className="text-xs text-neutral-500">
        {grounded}/{scores.length} claims supported by citations
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-neutral-400 hover:text-neutral-200">
          Per-claim breakdown
        </summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-neutral-500">
              <th>Markers</th>
              <th>Entailment</th>
              <th>Grounded</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i} className="border-t border-neutral-800">
                <td className="py-1 font-mono text-neutral-300">{s.marker}</td>
                <td className="py-1 font-mono">{s.entailment.toFixed(2)}</td>
                <td className="py-1">
                  {s.grounded ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
