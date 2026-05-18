from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from rag.core.logging import configure_logging, get_logger
from rag.eval.runner import run_eval


async def main() -> None:
    parser = argparse.ArgumentParser(description="Run RAG eval harness")
    parser.add_argument(
        "--test-set",
        default="/app/../eval/test_questions.jsonl",
        help="Path to JSONL test set",
    )
    parser.add_argument(
        "--out-dir",
        default="/app/../eval/results",
        help="Where to write eval-*.json artifacts",
    )
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument(
        "--no-ragas",
        action="store_true",
        help="Skip RAGAS even if installed",
    )
    args = parser.parse_args()

    configure_logging()
    log = get_logger("eval")
    test_set = Path(args.test_set).resolve()
    out_dir = Path(args.out_dir).resolve()
    log.info("eval_start", test_set=str(test_set), out_dir=str(out_dir), top_k=args.top_k)

    payload = await run_eval(
        test_set,
        out_dir,
        top_k=args.top_k,
        use_ragas=not args.no_ragas,
    )

    m = payload["metrics"]
    print()  # noqa: T201
    print("=== Eval Summary ===")  # noqa: T201
    print(f"N:               {m['n']}")  # noqa: T201
    print(f"Precision@5:     {m['precision_at_5']:.4f}")  # noqa: T201
    print(f"Recall@5:        {m['recall_at_5']:.4f}")  # noqa: T201
    print(f"MRR:             {m['mrr']:.4f}")  # noqa: T201
    print(f"Faithfulness:    {m['faithfulness']:.4f}")  # noqa: T201
    if m["ragas_context_precision"] is not None:
        print(f"RAGAS ctx prec:  {m['ragas_context_precision']:.4f}")  # noqa: T201
        print(f"RAGAS ctx rec:   {m['ragas_context_recall']:.4f}")  # noqa: T201
        print(f"RAGAS ans rel:   {m['ragas_answer_relevancy']:.4f}")  # noqa: T201
        print(f"RAGAS faith:     {m['ragas_faithfulness']:.4f}")  # noqa: T201


if __name__ == "__main__":
    asyncio.run(main())
