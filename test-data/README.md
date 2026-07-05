# Test data

Committed fixtures and **vendored upstream corpora** for the detection-engine
test harness. Everything needed to build and test offline is in this tree.

| Directory | Track | Contents |
| --- | --- | --- |
| `facts/` | Objective / negative control | `manifest.json`, `samples.jsonl` |
| `opinions/` | Subjective / argumentative | `manifest.json`, `samples.jsonl` |
| `fallacies/` | Logical fallacy cues | `manifest.json`, `samples.jsonl`, `fallacy-type-map.json` |
| `upstream/` | **Bulk corpora (vendored)** | SUBJ TSV + Smartybench CSV/JSON/Prolog |
| `SOURCES.lock.json` | Reproducibility | SHA-256 checksums per vendored file |

## Offline inventory (~3.4 MB)

| Corpus | Rows / files | Use |
| --- | --- | --- |
| `upstream/subj/*.tsv` | 18,000 sentences | Facts (`label=0`) + opinions (`label=1`) |
| `upstream/smartybench/fallacy/llm_generation_2_2.csv` | 219 | Fallacy positives |
| `upstream/smartybench/fallacy/good.csv` | 500 | Non-fallacy controls |
| `upstream/smartybench/res/*.json` | 720 annotated | SmartyPat type labels |
| `upstream/smartybench/statistics/ruozhiba_label_final.csv` | 500 | Reddit fallacies |
| `upstream/smartybench/PrologPrompt/fallacies.pl` | 500+ rules | Dynamic case generation |

Smoke-tier committed samples: 37 cases across `*/samples.jsonl`.

Spec: [docs/testing/README.md](../docs/testing/README.md).
