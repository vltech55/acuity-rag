from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from rag.db import get_session
from rag.retrieval.hybrid import retrieve
from rag.schemas import SearchRequest, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search(
    req: SearchRequest,
    session: AsyncSession = Depends(get_session),
) -> SearchResponse:
    start = time.perf_counter()
    try:
        chunks = await retrieve(session, req.query, top_k=req.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    elapsed = (time.perf_counter() - start) * 1000
    return SearchResponse(query=req.query, chunks=chunks, latency_ms=round(elapsed, 2))
