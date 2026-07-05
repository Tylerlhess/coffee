# Detection engine test materials

Source materials and layout for a future **Node test harness** against
`src/lib/text/detectors.js`. No harness code yet — this directory defines what
to test, where data lives, and how upstream corpora map onto Coffee's three
detection goals.

## What Coffee detects (today)

`detect()` is a **local heuristic scanner**. It does not decide truth; it flags
*language cues* in six categories:

| Category | Role in testing |
| --- | --- |
| `opinion` | Opinion markers |
| `certainty` | Overstated certainty / opinion-as-fact |
| `generalization` | Sweeping generalizations |
| `prescriptive` | Normative / value judgments |
| `loaded` | Emotive / combative framing |
| `fallacy` | Named logical-fallacy cue phrases |

There is **no `fact` category** in the engine. The **facts** track tests
*negative control*: objective text should produce **few or no** flags.

## Three test tracks

| Track | Question | Primary upstream source |
| --- | --- | --- |
| [**Facts**](facts.md) | Does objective reporting stay clean? | [cbert_aug `subj`](https://github.com/1024er/cbert_aug/tree/crayon/datasets/subj) (`label=0`) |
| [**Opinions**](opinions.md) | Do subjective / argumentative sentences get flagged? | Same `subj` corpus (`label=1`) + hand-crafted marker cases |
| [**Fallacies**](fallacies.md) | Do fallacy-laden arguments trigger `fallacy` spans? | [Smartybench](https://github.com/ltroin/Smartybench) + Prolog oracles |

## Material breakdown

### Facts (~5,000 objective sentences available)

| Slice | Rows | Purpose |
| --- | ---: | --- |
| `subj/dev.tsv` label `0` | ~450 | Fast regression while tuning rules |
| `subj/test.tsv` label `0` | ~500 | Held-out evaluation |
| `subj/train.tsv` label `0` | ~4,050 | Bulk stress / false-positive rate |
| `test-data/facts/samples.jsonl` | 10 | Hand-picked + schema examples (committed) |

**Metric focus:** false-positive rate — spans per sentence, category counts on
clean objective prose.

### Opinions (~5,000 subjective sentences available)

| Slice | Rows | Purpose |
| --- | ---: | --- |
| `subj/dev.tsv` label `1` | ~450 | Recall on subjective movie language |
| `subj/test.tsv` label `1` | ~500 | Held-out evaluation |
| `subj/train.tsv` label `1` | ~4,050 | Bulk recall sampling |
| `test-data/opinions/samples.jsonl` | 12 | Explicit marker coverage (I think, obviously, should, …) |

**Metric focus:** recall on `opinion` + `certainty` (+ related categories when
markers overlap). The SUBJ label is **sentence-level**; not every subjective
sentence contains a regex hit — document both *document label* and *span
expectations* separately (see [LAYOUT.md](LAYOUT.md)).

### Fallacies (~720+ labeled arguments available)

| Slice | Rows | Purpose |
| --- | ---: | --- |
| `fallacy/llm_generation_2_2.csv` | 219 | Prolog-generated natural-language fallacies |
| `res/*_2_2.json` | 219 each | Same sentences + SmartyPat fallacy type labels |
| `fallacy/good.csv` | 500 | Non-fallacy / valid-reasoning controls |
| `statistics/ruozhiba_label_final.csv` | ~100+ | Human Reddit fallacies + type labels |
| `PrologPrompt/fallacies.pl` | 500+ rules | **Dynamic** case generation oracle |
| `test-data/fallacies/samples.jsonl` | 15 | Mapped examples + Coffee label expectations |

**Metric focus:** fallacy span recall, SmartyPat-type → Coffee-label mapping
coverage, precision on `good.csv` controls.

Smartybench supports **dynamic** expansion: run Prolog oracles → LLM
naturalization (see [fallacies.md](fallacies.md)) to grow the corpus without
manual authoring.

## Directory map

```
docs/testing/          ← spec + breakdown
test-data/             ← fixtures + vendored upstream (offline-ready)
  facts/
  opinions/
  fallacies/
  upstream/            ← SUBJ + Smartybench (~3.5 MB)
  SOURCES.lock.json
```

Full schema and naming rules: [LAYOUT.md](LAYOUT.md).

Upstream fetch instructions (refresh only): [SOURCES.md](SOURCES.md).

**Offline:** all corpora are already in `test-data/upstream/`; see
`test-data/SOURCES.lock.json`.

Per-track detail:

- [facts.md](facts.md)
- [opinions.md](opinions.md)
- [fallacies.md](fallacies.md)

## Future harness (not built yet)

The harness should:

1. Load JSONL from `test-data/{facts,opinions,fallacies}/`
2. Call `detect(text, { sensitivity })` from `detectors.js`
3. Compare spans against each case's `expect` block (see LAYOUT.md)
4. Emit per-track reports: FP rate (facts), recall@category (opinions),
   fallacy hit rate + taxonomy mapping gaps (fallacies)
5. Optionally stream rows from `test-data/upstream/` for nightly bulk runs

Link from the existing smoke-test doc: [../TESTING.md](../TESTING.md).
