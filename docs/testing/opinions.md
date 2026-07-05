# Opinions track

Tests **recall** on subjective and argumentative language. Coffee maps these
mostly to `opinion`, `certainty`, `prescriptive`, and `loaded` — not a single
`opinion` bit.

## Gold standard

**Document label:** `opinion`

**Primary source:** SUBJ rows with `label = 1` (subjective).

Example subjective sentences from `dev.tsv`:

| Text (truncated) | SUBJ label |
| --- | ---: |
| "10 minutes into the film you'll be white-knuckled and unable to look away." | 1 |
| "[raimi's] matured quite a bit with spider-man, even though it's one of the most plain white toast comic book films you'll ever see." | 1 |
| "A look into the underground world of bruce haack..." | 1 |

SUBJ labels **review tone**, not explicit cue phrases. Many subjective sentences
will **not** match Coffee regexes — track both:

1. **Document recall** — eventual LLM / classifier layer (out of scope for `detect()`).
2. **Span recall** — hand-crafted cases with known markers (committed samples).

## Coffee rules under test

| Category | Example triggers |
| --- | --- |
| `opinion` | "I think", "in my opinion", "arguably" |
| `certainty` | "obviously", "everyone knows", "proven" |
| `prescriptive` | "should", "must", "the only way" |
| `loaded` | "disastrous", "insane", "corrupt" |
| `generalization` | "always", "never", "everyone" |

Fallacy cues are tested in the [fallacies track](fallacies.md).

## Committed samples

`test-data/opinions/samples.jsonl` — twelve hand-authored cases covering each
non-fallacy category plus two SUBJ-derived rows with relaxed expectations.

Each case sets `categoriesAny` and often `substringsAny` for deterministic CI.

## Bulk SUBJ usage

When converting `label=1` rows automatically:

```json
"expect": {
  "shouldFlag": true,
  "categoriesAny": ["opinion", "certainty", "prescriptive", "loaded", "generalization"],
  "softPass": true
}
```

`softPass: true` (harness convention) — count as recall denominator but do not
fail CI if zero spans; report as *uncaptured subjective* for rule tuning.

Hand-crafted marker cases must **not** use `softPass`.

## Metrics (future harness)

| Metric | Description |
| --- | --- |
| Span recall (strict) | % hand cases with ≥1 expected category hit |
| Marker coverage | Per-regex hit rate on hand suite |
| SUBJ capture rate | % label-1 rows with any span (informational) |
| Category confusion | Subjective text triggering only `generalization` |

## Tuning loop

1. Run smoke `samples.jsonl` after editing `RULES` in `detectors.js`.
2. Sample 100 random SUBJ train `label=1` rows — inspect misses.
3. Add new hand cases for each new rule before merging.

See [SOURCES.md](SOURCES.md) for fetch commands.
