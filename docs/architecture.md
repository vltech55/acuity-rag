# Architecture

```mermaid
flowchart LR
    subgraph Ingest["Ingestion (offline)"]
        A[arXiv API] --> B[PDF text<br/>pypdf]
        B --> C[Sentence-aware<br/>chunker<br/>tiktoken]
        C --> D[OpenAI<br/>text-embedding-3-small]
        D --> E[(Postgres<br/>+ pgvector<br/>+ tsvector)]
    end

    subgraph Query["Query path (online)"]
        Q[User question] --> R1[BM25<br/>ts_rank_cd]
        Q --> R2[Semantic<br/>pgvector cosine]
        E --> R1
        E --> R2
        R1 --> F[RRF<br/>k=60]
        R2 --> F
        F --> X[Cross-encoder<br/>rerank top-20]
        X --> G[Claude<br/>citation-grounded<br/>generation]
        G --> H[Token stream<br/>SSE]
        G --> I[Grounding judge<br/>LLM-as-judge]
        I --> J[Faithfulness score<br/>per claim]
    end

    subgraph Eval["Eval harness"]
        T[Test set<br/>JSONL] --> EV[Eval runner]
        EV --> M1[precision@5<br/>recall@5<br/>MRR]
        EV --> M2[Faithfulness<br/>mean entailment]
        EV --> M3[RAGAS<br/>optional]
        EV --> S[(eval_runs table)]
        S --> UI[Eval dashboard]
    end
```

## Why hybrid retrieval

BM25 wins on rare terms ("LoRA", "Megatron"); semantic wins on paraphrase
("how do we reduce GPU memory during fine-tuning?"). Reciprocal Rank Fusion
combines them without needing to calibrate score scales across the two
methods — a chunk that ranks well in *either* ranking floats to the top, and
chunks that rank well in *both* dominate.

The cross-encoder reranks the top ~20 fused candidates. Cross-encoders see
the query and document together (unlike bi-encoders that embed them
separately) so they trade throughput for materially higher precision on
the final top-5.

## Why citations are enforced in the prompt, not the schema

Claude's structured output works for one-shot JSON but is hard to stream
incrementally. Inline markers (`[S1]`, `[S2]`) let us stream tokens to the
client immediately, then resolve markers to chunk records at the end. A
hallucinated marker ID (one not present in the retrieved set) is detected
deterministically post-stream, so the LLM cannot smuggle made-up citations.

## Why a separate grounding judge

The model that wrote the answer is a poor judge of its own work. We run a
second pass with `temperature=0` asking Claude to score each claim against
*only* its cited sources. Claims that score below 0.6 entailment are
flagged in the UI — that's the difference between "the model said it" and
"the sources support it."
