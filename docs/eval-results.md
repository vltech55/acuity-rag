# Eval Methodology

## Test set construction

The test set is auto-generated from the ingested corpus by
`scripts/generate_test_set.py`. For each randomly-sampled paper, Claude
produces a single retrieval-style question whose answer can only come from
that paper's abstract. The paper's arXiv ID becomes the ground truth.

This avoids the dataset contamination problem: questions are written
*after* ingestion, against papers you actually indexed, so the eval
measures real retrieval performance and not memorization.

## Metrics

| Metric          | What it measures                                                    |
| --------------- | ------------------------------------------------------------------- |
| Precision@5     | Of top-5 chunks, fraction belonging to the source paper             |
| Recall@5        | Fraction of the source paper's chunks present in top-5              |
| MRR             | Mean reciprocal rank of the first source-paper chunk                |
| Faithfulness    | Mean per-claim entailment from the grounding judge                  |
| RAGAS metrics   | Context precision/recall, answer relevancy, faithfulness (optional) |

## Running

```bash
make ingest           # one-time: fetch + embed corpus
make gen-test-set     # one-time: derive 50 questions from corpus
make eval             # run the harness; writes eval/results/eval-*.json
```

Results are also persisted to the `eval_runs` table and visible at
[/eval](http://localhost:3000/eval) in the UI.

## Reading results

The dashboard shows history across runs so prompt changes and retrieval
tuning are A/B-able against the same test set. Each run records the git
SHA of the code that produced it, so regressions are attributable.
