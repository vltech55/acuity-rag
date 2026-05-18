import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Production RAG",
  description: "Hybrid retrieval + citation-grounded answers, with evals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-neutral-800 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Production RAG
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-400">
            <Link href="/" className="hover:text-neutral-100">Chat</Link>
            <Link href="/eval" className="hover:text-neutral-100">Eval</Link>
            <a
              href={(process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000") + "/docs"}
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-100"
            >
              API
            </a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800 px-6 py-2 text-xs text-neutral-500">
          BM25 + pgvector (RRF) → cross-encoder rerank → citation-grounded generation
        </footer>
      </body>
    </html>
  );
}
