from __future__ import annotations

import asyncio
import io
from dataclasses import dataclass
from datetime import datetime

import arxiv
import httpx
from pypdf import PdfReader
from tenacity import retry, stop_after_attempt, wait_exponential

from rag.core.logging import get_logger

log = get_logger(__name__)


@dataclass(frozen=True)
class ArxivPaper:
    arxiv_id: str
    title: str
    authors: list[str]
    abstract: str
    primary_category: str
    published_at: datetime
    pdf_url: str
    text: str


def _normalize_arxiv_id(entry_id: str) -> str:
    # entry_id looks like http://arxiv.org/abs/2401.12345v2 — strip prefix and version
    short = entry_id.rsplit("/", 1)[-1]
    return short.split("v")[0] if "v" in short else short


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=20))
async def _download_pdf(client: httpx.AsyncClient, url: str) -> bytes:
    resp = await client.get(url, timeout=60.0, follow_redirects=True)
    resp.raise_for_status()
    return resp.content


def _extract_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    parts: list[str] = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception as exc:  # noqa: BLE001
            log.warning("pdf_page_extract_failed", error=str(exc))
    return "\n\n".join(p.strip() for p in parts if p.strip())


async def fetch_papers(query: str, max_results: int) -> list[ArxivPaper]:
    """Fetch metadata + full text for up to `max_results` arXiv papers matching `query`.

    Skips papers whose PDF cannot be downloaded or parsed instead of failing the batch.
    """
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending,
    )
    client_arxiv = arxiv.Client(page_size=50, delay_seconds=3, num_retries=3)

    results = await asyncio.to_thread(lambda: list(client_arxiv.results(search)))
    log.info("arxiv_metadata_fetched", count=len(results))

    papers: list[ArxivPaper] = []
    async with httpx.AsyncClient() as http:
        for r in results:
            arxiv_id = _normalize_arxiv_id(r.entry_id)
            try:
                pdf_bytes = await _download_pdf(http, r.pdf_url)
            except Exception as exc:  # noqa: BLE001
                log.warning("pdf_download_failed", arxiv_id=arxiv_id, error=str(exc))
                continue
            text = await asyncio.to_thread(_extract_text, pdf_bytes)
            if len(text) < 500:
                log.warning("pdf_text_too_short", arxiv_id=arxiv_id, len=len(text))
                continue
            papers.append(
                ArxivPaper(
                    arxiv_id=arxiv_id,
                    title=r.title.strip(),
                    authors=[a.name for a in r.authors],
                    abstract=r.summary.strip(),
                    primary_category=r.primary_category,
                    published_at=r.published,
                    pdf_url=r.pdf_url,
                    text=text,
                )
            )
            log.info("paper_ready", arxiv_id=arxiv_id, chars=len(text))

    return papers
