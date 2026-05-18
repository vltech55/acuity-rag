from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from rag import __version__
from rag.core.config import settings
from rag.db import get_session
from rag.schemas import HealthOut, ReadyOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
async def health() -> HealthOut:
    return HealthOut(status="ok", version=__version__)


@router.get("/ready", response_model=ReadyOut)
async def ready(session: AsyncSession = Depends(get_session)) -> ReadyOut:
    db_ok = False
    try:
        await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return ReadyOut(
        status="ok" if db_ok else "degraded",
        db=db_ok,
        embeddings=bool(settings.openai_api_key),
        generation=bool(settings.anthropic_api_key),
    )
