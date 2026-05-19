"use client";

import { Check, X } from "lucide-react";
import type { GroundingScore } from "@/lib/api";

export function GroundingMeter({ scores }: { scores: GroundingScore[] }) {
  if (!scores.length) {
    return <div className="text-2xs text-subtle">No grounding scores yet.</div>;
  }
  return (
    <div className="rounded-md border border-white/[0.04] bg-white/[0.02] overflow-hidden">
      <table className="w-full text-2xs">
        <thead>
          <tr className="text-left text-subtle bg-white/[0.02]">
            <th className="px-3 py-1.5 font-medium">Marker</th>
            <th className="px-3 py-1.5 font-medium">Entailment</th>
            <th className="px-3 py-1.5 font-medium">Grounded</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i} className="border-t border-white/[0.04]">
              <td className="px-3 py-1.5 font-mono text-zinc-200">{s.marker}</td>
              <td className="px-3 py-1.5 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 w-8">{s.entailment.toFixed(2)}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden max-w-[80px]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${s.entailment * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-3 py-1.5">
                {s.grounded ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <X className="h-3 w-3 text-rose-400" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
