from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    anthropic_api_key: str = Field(default="")
    openai_api_key: str = Field(default="")
    anthropic_model: str = Field(default="claude-sonnet-4-6")
    openai_embedding_model: str = Field(default="text-embedding-3-small")
    embedding_dim: int = Field(default=1536)

    reranker_model: str = Field(default="cross-encoder/ms-marco-MiniLM-L-6-v2")

    database_url: str = Field(default="postgresql+asyncpg://rag:rag@postgres:5432/rag")

    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")
    cors_origins: str = Field(default="http://localhost:3000")

    chunk_size_tokens: int = Field(default=512)
    chunk_overlap_tokens: int = Field(default=64)
    retrieve_top_k_bm25: int = Field(default=20)
    retrieve_top_k_semantic: int = Field(default=20)
    rrf_k: int = Field(default=60)
    rerank_top_k: int = Field(default=5)

    arxiv_query: str = Field(default="cat:cs.AI OR cat:cs.CL OR cat:cs.LG")
    arxiv_max_papers: int = Field(default=100)

    @field_validator("cors_origins")
    @classmethod
    def _split_origins(cls, v: str) -> str:
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
