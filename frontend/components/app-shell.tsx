"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { BookOpen, FlaskConical, LineChart, Github, Command, Library, History, Settings as SettingsIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const NAV = [
  { href: "/", label: "Lab", icon: FlaskConical },
  { href: "/library", label: "Library", icon: Library },
  { href: "/history", label: "History", icon: History },
  { href: "/eval", label: "Evaluations", icon: LineChart },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-bg/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 mr-2 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-sienna-400 to-sienna-600 blur-sm opacity-40 group-hover:opacity-60 transition" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sienna-400 to-sienna-600">
                <FlaskConical className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[15px] leading-none font-medium tracking-tight text-zinc-50">Acuity</span>
              <span className="text-2xs uppercase tracking-[0.15em] text-subtle">RAG</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "text-zinc-50 bg-white/[0.05]"
                      : "text-muted hover:text-zinc-100 hover:bg-white/[0.03]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1 max-w-md mx-auto">
            <div className="hidden md:flex items-center gap-2 rounded-md border border-white/[0.06] bg-surface/60 px-3 py-1.5 text-xs text-subtle">
              <Command className="h-3 w-3" />
              <span className="flex-1">Find a paper, a chunk, or a run…</span>
              <kbd className="h-4 px-1 inline-flex items-center rounded border border-white/10 bg-white/[0.04] text-[10px] text-subtle">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`${API_BASE}/docs`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-xs text-muted hover:text-zinc-100"
            >
              <BookOpen className="h-3.5 w-3.5" /> API
            </a>
            <a href="#" className="hidden md:inline-flex items-center gap-1 text-xs text-muted hover:text-zinc-100">
              <Github className="h-3.5 w-3.5" /> Source
            </a>
            <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-2xs">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse-dot" />
              indexed · 3 papers
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="border-t border-white/[0.06] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-2xs text-subtle flex items-center justify-between">
          <span>BM25 + pgvector · reciprocal rank fusion · cross-encoder rerank · citation-grounded generation</span>
          <span className="font-mono">v1.4.2</span>
        </div>
      </footer>
    </div>
  );
}
