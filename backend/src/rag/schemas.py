from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChunkOut(BaseModel):
    id: UUID
    paper_id: UUID
    chunk_index: int
    content: str
    section: str | None = None
    arxiv_id: str
    paper_title: str
    bm25_score: float | None = None
    semantic_score: float | None = None
    rrf_score: float | None = None
    rerank_score: float | None = None
    final_rank: int


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResponse(BaseModel):
    query: str
    chunks: list[ChunkOut]
    latency_ms: float


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class CitationOut(BaseModel):
    marker: str
    chunk_id: UUID
    paper_id: UUID
    arxiv_id: str
    paper_title: str
    section: str | None = None
    content: str


class GroundingScore(BaseModel):
    marker: str
    entailment: float
    grounded: bool


class ChatFinalEvent(BaseModel):
    citations: list[CitationOut]
    grounding: list[GroundingScore]
    latency_ms: float


class HealthOut(BaseModel):
    status: str
    version: str


class ReadyOut(BaseModel):
    status: str
    db: bool
    embeddings: bool
    generation: bool


class IngestStats(BaseModel):
    papers_ingested: int
    chunks_created: int
    duration_seconds: float


class EvalMetrics(BaseModel):
    n: int
    precision_at_5: float
    recall_at_5: float
    mrr: float
    faithfulness: float
    ragas_context_precision: float | None = None
    ragas_context_recall: float | None = None
    ragas_answer_relevancy: float | None = None
    ragas_faithfulness: float | None = None


class EvalRunOut(BaseModel):
    id: UUID
    git_sha: str | None
    metrics: EvalMetrics
    created_at: datetime
