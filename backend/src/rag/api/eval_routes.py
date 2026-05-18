from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rag.db import get_session
from rag.models import EvalRun
from rag.schemas import EvalMetrics, EvalRunOut

router = APIRouter(prefix="/eval", tags=["eval"])


@router.get("/runs", response_model=list[EvalRunOut])
async def list_runs(
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
) -> list[EvalRunOut]:
    stmt = select(EvalRun).order_by(EvalRun.created_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        EvalRunOut(
            id=r.id,
            git_sha=r.git_sha,
            metrics=EvalMetrics.model_validate(json.loads(r.metrics_json)),
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/runs/latest", response_model=EvalRunOut)
async def latest_run(session: AsyncSession = Depends(get_session)) -> EvalRunOut:
    stmt = select(EvalRun).order_by(EvalRun.created_at.desc()).limit(1)
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="no eval runs recorded")
    return EvalRunOut(
        id=row.id,
        git_sha=row.git_sha,
        metrics=EvalMetrics.model_validate(json.loads(row.metrics_json)),
        created_at=row.created_at,
    )
