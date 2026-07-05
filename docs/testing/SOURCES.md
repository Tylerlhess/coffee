# Upstream sources

Bulk corpora are **vendored** under `test-data/upstream/` (~3.5 MB) so the test
harness runs **without network access**. Checksums: `test-data/SOURCES.lock.json`.

The commands below are only needed to **refresh** vendored files from upstream.

## Opinion / fact — cbert_aug SUBJ

| | |
| --- | --- |
| **Repo** | https://github.com/1024er/cbert_aug |
| **Branch** | `crayon` |
| **Path** | `datasets/subj/` |
| **Files** | `dev.tsv`, `test.tsv`, `train.tsv`, `train_dev.tsv` |

### Format

Tab-separated, header row:

```
sentence    label
```

| Label | Meaning | Coffee track |
| ---: | --- | --- |
| `0` | Objective (plot summary, factual narration) | **fact** (negative control) |
| `1` | Subjective (review tone, evaluative language) | **opinion** |

### Sizes (approximate)

| File | Total rows | Label 0 | Label 1 |
| --- | ---: | ---: | ---: |
| `dev.tsv` | 900 | ~450 | ~450 |
| `test.tsv` | 1,000 | ~500 | ~500 |
| `train.tsv` | 8,100 | ~4,050 | ~4,050 |

Origin: classic **SUBJ** movie-review subjectivity corpus (Pang & Lee). Sentences
are short, movie-domain, and **sentence-level** — they do not mark which token
is subjective.

### Fetch (manual)

```bash
mkdir -p test-data/upstream/subj
BASE=https://raw.githubusercontent.com/1024er/cbert_aug/crayon/datasets/subj
for f in dev test train; do
  curl -sL "$BASE/$f.tsv" -o "test-data/upstream/subj/$f.tsv"
done
```

---

## Logical fallacies — Smartybench (SmartyPat-Bench)

| | |
| --- | --- |
| **Repo** | https://github.com/ltroin/Smartybench |
| **Paper site** | https://remarkably-mind-blowing-lab.github.io/smarty-pat-logic-bench/ |
| **HF mirror** | https://huggingface.co/datasets/zhx123/Smarty (CSV; encoding issues — prefer GitHub) |

SmartyPat uses **Prolog logic oracles** to generate fallacies, then LLMs
(Claude 3.7 extended thinking, etc.) to naturalize them into English.

### Key files

| Path | ~Rows | Role |
| --- | ---: | --- |
| `fallacy/llm_generation_2_2.csv` | 219 | One fallacy sentence per line (accident-fallacy / rule-misapplication style) |
| `fallacy/good.csv` | 500 | Valid reasoning / non-fallacy controls |
| `res/claude_3_7_sonnet_2_2.json` | 219 | Annotations: `logic_error`, `logic_fallacies[]`, `details` |
| `res/claude_3_7_sonnet_good.json` | 500 | Annotations for controls |
| `statistics/ruozhiba_label_final.csv` | 100+ | Reddit-sourced fallacies with type + explanation |
| `PrologPrompt/fallacies.pl` | 500+ rules | Prolog oracle — **dynamic generation** |
| `PrologPrompt/prompt.py` | — | LLM prompts per fallacy type |

### `llm_generation_2_2.csv`

Single column, quoted CSV — one natural-language argument per row. Example:

```
"If a library has a ""silence please"" rule, and this is interpreted to mean
absolutely no sound whatsoever, therefore turning pages or typing quietly is
not allowed."
```

### `res/*_2_2.json` record shape

```json
{
  "id": 1,
  "sentence": "...",
  "logic_error": "yes",
  "logic_fallacies": ["Accident fallacy", "False Analogy"],
  "details": "..."
}
```

### Prolog oracle fallacy types (`prompt.py`)

| Prolog key | Typical SmartyPat label |
| --- | --- |
| `accident_fallacy` | Accident fallacy |
| `false_analogy` | False Analogy |
| `false_premise` | False Premise |
| `improper_transposition` | Improper transposition |
| `false_cause` | False cause |
| `wrong_direction` | Wrong direction |
| `inverse_error` | Inverse error |
| `improper_dist` | Improper distribution |
| `fallacy_of_composition` | Fallacy of composition |
| `contextomy` | Contextomy |
| `begging_the_question` | Begging the question |

### Dynamic test generation

To grow fallacy cases without hand-writing JSONL:

1. **Extend** `PrologPrompt/fallacies.pl` or run `prompt.py` against a Prolog
   template (accident, false cause, …).
2. **Naturalize** Prolog pairs to English (Smartybench uses Claude; harness can
   use any LLM or template strings for deterministic CI).
3. **Validate** with the Prolog oracle (same as SmartyPat).
4. **Append** to `test-data/fallacies/generated.jsonl` with
   `source: { generator: "smartybench-prolog", template: "accident_fallacy" }`.

For CI without LLM calls, use the committed `llm_generation_2_2.csv` rows
directly.

### Fetch (manual)

```bash
mkdir -p test-data/upstream/smartybench/{fallacy,res,PrologPrompt,statistics}
BASE=https://raw.githubusercontent.com/ltroin/Smartybench/main
curl -sL "$BASE/fallacy/llm_generation_2_2.csv" -o test-data/upstream/smartybench/fallacy/llm_generation_2_2.csv
curl -sL "$BASE/fallacy/good.csv" -o test-data/upstream/smartybench/fallacy/good.csv
curl -sL "$BASE/res/claude_3_7_sonnet_2_2.json" -o test-data/upstream/smartybench/res/claude_3_7_sonnet_2_2.json
curl -sL "$BASE/res/claude_3_7_sonnet_good.json" -o test-data/upstream/smartybench/res/claude_3_7_sonnet_good.json
curl -sL "$BASE/statistics/ruozhiba_label_final.csv" -o test-data/upstream/smartybench/statistics/ruozhiba_label_final.csv
curl -sL "$BASE/PrologPrompt/fallacies.pl" -o test-data/upstream/smartybench/PrologPrompt/fallacies.pl
```

---

## License / attribution notes

- Verify licenses on both repos before publishing a bundled test pack.
- Cite SmartyPat-Bench when using Smartybench-derived cases.
- SUBJ/cbert_aug is widely used in NLP research; retain original sentence text
  only for local testing unless redistribution is permitted.
