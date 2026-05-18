# Production RAG: Hybrid Search + Evals

End-to-end Retrieval-Augmented Generation over a corpus of arXiv ML/AI papers.
Hybrid retrieval (BM25 + pgvector) fused via Reciprocal Rank Fusion, cross-encoder
reranking, citation-grounded streaming answers, a grounding judge that detects
hallucinated claims, and an evaluation harness measuring precision@k, recall@k,
MRR, and faithfulness.

> **Why this exists:** most RAG systems shipped to production cannot answer
> *"is it actually working?"*. This one can — every change is measured against
> a held-out test set, and every claim in every answer is scored for
> faithfulness against its cited sources.

---

## Architecture

```
arXiv corpus → pypdf → tiktoken chunker → OpenAI embeddings → Postgres (pgvector + tsvector)

User query ──┬─→ BM25 (ts_rank_cd) ─┐
             └─→ pgvector cosine ──┴─→ RRF (k=60) → cross-encoder rerank top-20
                                                              │
                                                              ▼
                                              Claude (citation-enforced)
                                                              │
                                                  ┌───────────┴───────────┐
                                                  ▼                       ▼
                                          SSE token stream         LLM-as-judge
                                                                   grounding score
```

Full mermaid diagram: [`docs/architecture.md`](./docs/architecture.md).

## Stack

- **Backend:** Python 3.11, FastAPI (async), Pydantic v2, SQLAlchemy 2 async + asyncpg, Alembic, structlog
- **DB:** PostgreSQL 16 with `pgvector` (HNSW index) and `tsvector` (GIN index)
- **LLM:** Claude `claude-sonnet-4-6` for generation, judging, and test-set generation
- **Embeddings:** OpenAI `text-embedding-3-small` (1536-dim)
- **Reranker:** `cross-encoder/ms-marco-MiniLM-L-6-v2` (local, CPU)
- **Eval:** custom precision@k / recall@k / MRR + RAGAS (optional)
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, Radix Popover
- **Infra:** docker-compose (Postgres + backend + frontend), Makefile-driven workflow

## Quick start

```bash
# 1. configure
cp .env.example .env
# Edit .env to set ANTHROPIC_API_KEY and OPENAI_API_KEY

# 2. boot
make up
make migrate

# 3. populate
make ingest            # fetch ~100 recent cs.AI / cs.CL / cs.LG papers
make gen-test-set      # derive a 50-question eval set from the corpus

# 4. open
#   http://localhost:3000      chat UI
#   http://localhost:3000/eval eval dashboard
#   http://localhost:8000/docs OpenAPI

# 5. measure
make eval
```

## Endpoints

| Method | Path                | Purpose                                      |
| ------ | ------------------- | -------------------------------------------- |
| GET    | `/health`           | Liveness                                     |
| GET    | `/ready`            | Readiness (db + provider keys)               |
| POST   | `/search`           | Hybrid retrieval only (no generation)        |
| POST   | `/chat`             | Streaming SSE: sources → tokens → grounding  |
| GET    | `/eval/runs`        | Historical eval runs                         |
| GET    | `/eval/runs/latest` | Most recent eval run                         |

`POST /chat` SSE event sequence: `sources` → `token` (many) → `citations`
→ `grounding` → `done`. The frontend uses this to render the source list,
stream the answer, then attach popovers to citation markers and show a
faithfulness meter.

## Key design choices

| Decision                              | Rationale                                                            |
| ------------------------------------- | -------------------------------------------------------------------- |
| Hybrid retrieval over single ranker   | BM25 wins rare terms, semantic wins paraphrase; RRF fuses without scale calibration |
| RRF with k=60                         | Original Cormack et al. value; flattens single-ranker dominance      |
| Generated column for `content_tsv`    | Postgres keeps the BM25 vector in sync; no risk of stale state       |
| HNSW over IVFFlat                     | Better recall at low query latency for our corpus size               |
| Inline citation markers, not JSON     | Streamable; markers validated post-stream against retrieved set      |
| Separate grounding judge              | The author model is a poor judge of itself; a second pass scores faithfulness |
| Test set derived from ingested corpus | Avoids contamination — questions written *against papers we indexed* |
| Idempotent ingestion by arXiv ID      | Re-running `make ingest` is safe; never double-embeds                |
| Each eval run records git SHA         | Regressions are attributable to a specific commit                    |

## Project layout

```
01-production-rag/
├── backend/
│   ├── src/rag/
│   │   ├── core/           config, logging, llm clients
│   │   ├── ingestion/      arxiv fetch, chunking, embed, pipeline
│   │   ├── retrieval/      bm25, semantic, RRF, rerank, hybrid
│   │   ├── generation/     prompts, citations, guardrails, streaming answer
│   │   ├── eval/           metrics, test set, faithfulness, RAGAS, runner
│   │   ├── api/            health, search, chat, eval routes
│   │   ├── models.py       SQLAlchemy: papers, chunks, eval_runs
│   │   ├── schemas.py      Pydantic request/response models
│   │   └── main.py         FastAPI app with request-id middleware
│   ├── alembic/            migrations (pgvector extension + HNSW + GIN)
│   ├── scripts/            seed_corpus, generate_test_set, run_eval
│   └── tests/              chunking, RRF, citations, metrics
├── frontend/
│   ├── app/                /, /eval (Next.js App Router)
│   ├── components/         chat, answer-text, citation-marker, grounding-meter, eval-dashboard, sources-list
│   └── lib/                api client, utils
├── eval/
│   ├── test_questions.jsonl
│   └── results/            eval-<timestamp>.json + latest.json
├── docs/
│   ├── architecture.md     mermaid diagram + design rationale
│   └── eval-results.md     methodology
├── docker-compose.yml
├── Makefile
└── .env.example
```

## Make targets

```
make up             start postgres + backend + frontend
make migrate        apply alembic migrations
make ingest         fetch arXiv corpus + chunk + embed (idempotent)
make gen-test-set   derive eval test set from ingested corpus
make eval           run eval harness; write eval/results/eval-*.json
make test           pytest (chunking, RRF, citations, metrics)
make lint           ruff check + mypy strict
make psql           open psql shell against running db
make down           stop containers
make clean          stop + drop volumes (destructive)
```

## What this isn't (yet)

- Multi-tenant isolation (Project 5 covers that)
- Live LLM cost dashboards (Project 6 covers that)
- Human review queue for low-faithfulness answers (Project 4 covers that)

This repo is the *retrieval + measurement* foundation that the other projects
in the portfolio build on.

## License

MIT.
