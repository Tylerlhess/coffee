# Test data layout

All committed fixtures live under `test-data/`. Bulk upstream downloads are
**not** committed — only manifests, samples, and maps.

## Directory tree

```
test-data/
├── README.md
├── facts/
│   ├── manifest.json       # upstream pointers + slice sizes
│   └── samples.jsonl       # committed gold cases (small)
├── opinions/
│   ├── manifest.json
│   └── samples.jsonl
├── fallacies/
│   ├── manifest.json
│   ├── fallacy-type-map.json   # SmartyPat ↔ Coffee label mapping
│   └── samples.jsonl
└── upstream/               # vendored TSV/CSV/JSON/Prolog (~3.5 MB, committed)
    ├── subj/
    │   ├── dev.tsv
    │   ├── test.tsv
    │   └── train.tsv
    └── smartybench/
        ├── llm_generation_2_2.csv
        ├── good.csv
        ├── ruozhiba_label_final.csv
        └── res/
            └── claude_3_7_sonnet_2_2.json
```

Add to `.gitignore` only if you fork and prefer fetching locally (default: **committed**).

```
# optional — only when not vendoring upstream
# test-data/upstream/
```

## Case file format (`*.jsonl`)

One JSON object per line. Shared fields:

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Stable id, e.g. `fact-dev-042`, `fallacy-sb-001` |
| `track` | yes | `fact` \| `opinion` \| `fallacy` |
| `text` | yes | Input string passed to `detect()` |
| `source` | no | Upstream provenance (dataset, split, row, url) |
| `labels.document` | yes | Gold document class: `fact`, `opinion`, or `fallacy` |
| `labels.expect` | yes | Machine-checkable expectations (see below) |
| `notes` | no | Human rationale, known gaps |

### `labels.expect` blocks

#### Facts (negative control)

```json
{
  "shouldFlag": false,
  "maxSpans": 0,
  "forbiddenCategories": ["opinion", "certainty", "fallacy"]
}
```

Relaxations for bulk SUBJ runs (objective movie plots often contain words like
*never* or *always* in narrative):

```json
{
  "shouldFlag": false,
  "maxSpans": 2,
  "maxSpansPerCategory": { "generalization": 1 }
}
```

#### Opinions

```json
{
  "shouldFlag": true,
  "categoriesAny": ["opinion", "certainty", "prescriptive", "loaded"],
  "substringsAny": ["I think", "obviously"]
}
```

`categoriesAny` — at least one span must match one listed category.

`substringsAny` — optional; at least one flagged span text must contain one
substring (case-insensitive).

#### Fallacies

```json
{
  "shouldFlag": true,
  "categoriesAny": ["fallacy"],
  "coffeeLabelsAny": ["Slippery slope", "False dilemma"],
  "smartyPatTypesAny": ["Accident fallacy"],
  "mappingGap": false
}
```

`coffeeLabelsAny` — expected `span.label` from `detectors.js` fallacy rules.

`smartyPatTypesAny` — gold types from Smartybench annotations (for taxonomy
coverage reports, even when Coffee has no matching rule).

`mappingGap: true` — documented known miss; harness should count but not fail.

### Sensitivity

Optional top-level field:

```json
"sensitivity": "medium"
```

Default `medium` if omitted. Run high-sensitivity cases in a separate suite to
measure noise.

## Manifest format (`manifest.json`)

Each track directory has a manifest describing upstream slices:

```json
{
  "track": "fact",
  "version": 1,
  "upstream": {
    "repo": "1024er/cbert_aug",
    "branch": "crayon",
    "path": "datasets/subj",
    "license": "research — verify before redistribution"
  },
  "slices": [
    {
      "file": "dev.tsv",
      "labelFilter": 0,
      "documentLabel": "fact",
      "approxRows": 450,
      "defaultExpect": { "shouldFlag": false, "maxSpans": 2 }
    }
  ],
  "committedSamples": "samples.jsonl"
}
```

## ID conventions

| Pattern | Meaning |
| --- | --- |
| `fact-{split}-{row}` | Converted SUBJ row (`fact-dev-003`) |
| `opinion-{split}-{row}` | Converted SUBJ row |
| `opinion-hand-{n}` | Hand-authored marker case |
| `fallacy-sb-{row}` | Smartybench `llm_generation_2_2.csv` row |
| `fallacy-sb-good-{row}` | Control from `good.csv` |
| `fallacy-reddit-{id}` | `ruozhiba_label_final.csv` |
| `fallacy-hand-{n}` | Hand-authored cue-phrase case |

## Bulk conversion (future script)

Pseudocode for SUBJ → JSONL:

```
for row in read_tsv("dev.tsv"):
  label = int(row.label)
  track = "fact" if label == 0 else "opinion"
  write({
    id: f"{track}-dev-{row.index}",
    track, text: row.sentence,
    source: { dataset: "cbert_aug/subj", split: "dev", row: row.index },
    labels: {
      document: track,
      expect: defaultExpectFromManifest(track)
    }
  })
```

Smartybench JSON → JSONL joins `llm_generation_2_2.csv` line *n* with
`res/claude_3_7_sonnet_2_2.json[n-1]` for `logic_fallacies` gold labels.

## Evaluation tiers

| Tier | Data | When to run |
| --- | --- | --- |
| **Smoke** | `test-data/*/samples.jsonl` | Every commit |
| **Dev** | `upstream/subj/dev.tsv` converted | Rule changes |
| **Full** | train + test + all Smartybench slices | Pre-release / nightly |
