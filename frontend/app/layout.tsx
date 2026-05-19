import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Production RAG · Hybrid retrieval with citations",
    template: "%s · Production RAG",
  },
  description: "BM25 + pgvector hybrid retrieval with reciprocal rank fusion, cross-encoder reranking, and citation-grounded generation.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Production RAG · Hybrid retrieval with citations",
    description: "BM25 + pgvector hybrid retrieval with reciprocal rank fusion and citation-grounded generation.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
