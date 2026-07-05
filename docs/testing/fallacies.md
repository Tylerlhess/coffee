# Fallacies track

Tests **fallacy cue recall** using Smartybench (SmartyPat-Bench) and controls
for false positives.

## Gold standard

**Document label:** `fallacy` (positive) or `fact`/`non-fallacy` (controls)

Coffee's `fallacy` category uses **named cue phrases** in `detectors.js`:

| Coffee label | Cue pattern (summary) |
| --- | --- |
| Straw man | "so you're saying", "what you're really saying" |
| Whataboutism / tu quoque | "what about", "but you also", "you people" |
| Slippery slope | "if we allow", "next thing you know", "slippery slope" |
| False dilemma | "either … or", "you're either" |
| Appeal to authority (uncited) | "experts say", "studies show" (without citation nearby) |
| No true Scotsman | "real americans", "true fan" |
| Bandwagon | "everyone is doing", "join the millions" |
| Ad hominem | "you're just", "typical … shill" |
| Post hoc | "after … then", "ever since … we have" |

SmartyPat annotates **formal logic fallacies** (accident, false analogy, false
premise, …). Taxonomies differ — use `fallacy-type-map.json` for crosswalk.

## Smartybench corpora

### Generated fallacies (`llm_generation_2_2.csv` + `res/*_2_2.json`)

219 Prolog-derived arguments. Dominant SmartyPat types on this slice:

- Accident fallacy (rigid rule misapplication)
- False Analogy
- Often multiple types per sentence

Example:

> If a library has a "silence please" rule, and this is interpreted to mean
> absolutely no sound whatsoever, therefore turning pages or typing quietly is
> not allowed.

Gold: `logic_error: "yes"`, `logic_fallacies: ["Accident fallacy", "False Analogy"]`

Coffee may **not** flag these — many SmartyPat cases express fallacies through
structure, not Coffee's cue phrases. Cases with `mappingGap: true` document this.

### Controls (`good.csv` + `res/*_good.json`)

500 valid-reasoning sentences. Expect **no** `fallacy` spans (same assertions as
[facts track](facts.md) but legal/policy domain).

### Reddit fallacies (`ruozhiba_label_final.csv`)

Columns: `id`, question/title, fallacy type(s), explanation sentence.

Rich **false analogy**, **false premise**, **equivocation** examples — mostly
**mapping gaps** for Coffee today; valuable for LLM-layer tests later.

## Dynamic generation (Smartybench)

Use when static 219 rows are exhausted:

```
PrologPrompt/fallacies.pl
        │
        ▼  has_rule / rule_unreasonable_interpretation / …
PrologPrompt/prompt.py  ──►  new Prolog pairs
        │
        ▼  LLM naturalization (optional for CI)
fallacy/*.csv / generated.jsonl
        │
        ▼  res/*.json annotation (optional)
test-data/fallacies/
```

**Deterministic CI path:** template-fill from `fallacies.pl` without LLM:

```
has_rule(pool, no_diving_shallow_end).
rule_unreasonble_interpretation(no_diving_shallow_end, never_submerge_head_for_any_reason).
```

→ "If a pool has a no diving rule, therefore you can never put your head
underwater for any reason."

**Exploratory path:** run Smartybench `prompt.py` to expand oracles, naturalize
with your configured provider, validate in Prolog, append to `generated.jsonl`.

## Type mapping

See `test-data/fallacies/fallacy-type-map.json`:

| SmartyPat type | Coffee label | Coverage |
| --- | --- | --- |
| Accident fallacy | Slippery slope | partial — structural similarity |
| False Analogy | — | gap |
| False Premise | — | gap |
| Equivocation | — | gap |
| False cause | Post hoc | partial |
| Bandwagon (reddit) | Bandwagon | direct |
| Appeal to authority | Appeal to authority (uncited) | partial — needs "studies show" phrasing |

Harness reports **mapping coverage %** separately from **cue recall %**.

## Committed samples

`test-data/fallacies/samples.jsonl`:

- Smartybench rows (with `mappingGap` where needed)
- Hand cases hitting each Coffee fallacy label
- `good.csv`-style controls (`shouldFlag: false`)
- Reddit-derived gaps for roadmap

## Metrics (future harness)

| Metric | Description |
| --- | --- |
| Cue recall | % hand cases with expected `coffeeLabelsAny` hit |
| SmartyPat coverage | % annotated fallacies with any `fallacy` span |
| Mapping gap rate | % SmartyPat types with no Coffee label mapping |
| Control FP | Fallacy spans on `good.csv` |
| Per-label PR | Precision/recall per Coffee fallacy label |

## Roadmap

1. **Phase 1** — cue-phrase suite (committed samples + good controls).
2. **Phase 2** — bulk Smartybench 219 + mapping gap report.
3. **Phase 3** — Prolog generator feeds nightly `generated.jsonl`.
4. **Phase 4** — add regex rules for high-frequency SmartyPat types (false analogy,
   false premise).

See [SOURCES.md](SOURCES.md) for fetch commands.
