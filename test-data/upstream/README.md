# Upstream corpora (vendored)

All bulk test data is **committed in this repo** for offline use. No network
required to run the test harness against full corpora.

| Directory | Source | Files |
| --- | --- | --- |
| `subj/` | [cbert_aug `crayon`](https://github.com/1024er/cbert_aug/tree/crayon/datasets/subj) | `dev.tsv`, `test.tsv`, `train.tsv`, `train_dev.tsv` |
| `smartybench/fallacy/` | [Smartybench](https://github.com/ltroin/Smartybench) | `llm_generation_2_2.csv`, `good.csv` |
| `smartybench/res/` | Smartybench annotations | `claude_3_7_sonnet_2_2.json`, `claude_3_7_sonnet_good.json` |
| `smartybench/statistics/` | Smartybench Reddit slice | `ruozhiba_label_final.csv` |
| `smartybench/PrologPrompt/` | Dynamic generation oracles | `fallacies.pl`, `prompt.py`, `conversion.py` |

Pin + checksums: [`../SOURCES.lock.json`](../SOURCES.lock.json).

Refresh from upstream (requires network): see [docs/testing/SOURCES.md](../../docs/testing/SOURCES.md).
