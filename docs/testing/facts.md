# Facts track

Tests **false-positive rate** on objective text. Coffee has no `fact` detector;
the engine should stay quiet on factual narration.

## Gold standard

**Document label:** `fact`

**Source of truth:** [cbert_aug SUBJ](https://github.com/1024er/cbert_aug/tree/crayon/datasets/subj) rows with `label = 0` (objective).

Example objective sentences from `dev.tsv`:

| Text (truncated) | SUBJ label |
| --- | ---: |
| "When it comes to entertainment, children deserve better than pokemon 4ever." | 0 |
| "The film starts out as competent but unremarkable..." | 0 |
| "A subtle, poignant picture of goodness that is flawed, compromised and sad." | 0 |

Note: SUBJ `0` means *objective style*, not *verified truth*. Movie-review
corpus objective sentences can still contain dramatic words (*never*, *always*)
that trigger Coffee generalization rules — use relaxed `maxSpans` for bulk runs
(see [LAYOUT.md](LAYOUT.md)).

## What to assert

| Assertion | Smoke suite | Bulk SUBJ dev |
| --- | --- | --- |
| `shouldFlag` | `false` | `false` (soft) |
| `maxSpans` | `0` | `2` |
| `forbiddenCategories` | all flag categories | `fallacy`, `opinion` |

A **pass** means the heuristic layer does not cry wolf on plain reporting.

## Committed samples

`test-data/facts/samples.jsonl` — ten cases:

- **Strict zeros** — encyclopedic / wire-style sentences; expect no spans.
- **SUBJ-derived** — real `label=0` rows with `maxSpans: 2` tolerance.
- **Edge** — one case that *may* legitimately hit `generalization` to document
  known noise (flagged in `notes`).

## Metrics (future harness)

| Metric | Formula |
| --- | --- |
| FP rate (strict) | % samples with `spans.length > 0` on strict set |
| FP rate (tolerant) | % samples with `spans.length > maxSpans` on SUBJ dev |
| FP by category | Count spans per category on label-0 corpus |
| Noise leaders | Top regex rules firing on objective text |

## Relationship to LLM fact/opinion pass

Local `detect()` is **pre-LLM**. Facts track does not replace the analyze
agent's claim typing (`fact`, `opinion`, `opinion-as-fact`). It only guards
the in-page highlighter from flooding objective articles with marks.

## Adding cases

1. Prefer SUBJ `label=0` rows that are short and news-like (adapt extractor later).
2. Add hand-crafted wire copy with zero expected spans for regression anchors.
3. Record `source.row` so bulk imports stay traceable.

See [SOURCES.md](SOURCES.md) for fetch commands.
