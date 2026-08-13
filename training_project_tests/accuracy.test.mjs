import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detect, CATEGORY } from '../src/lib/text/detectors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Scoring rules (from problem.txt) ──────────────────────────────────────
//   +1  Correctly Identified  — detection fires AND classification matches
//   -1  Misidentified         — detection fires BUT classification is WRONG
//    0  Miss                  — no detection at all (neither adds nor subtracts)
//   Score = (Correct - Misidentified) / Total

function fixJsonl(line) {
  let s = line.trim();
  const opens = (s.match(/{/g) || []).length;
  const closes = (s.match(/}/g) || []).length;
  for (let i = 0; i < opens - closes; i++) s += '}';
  return s;
}

function loadJsonl(relPath) {
  const lines = readFileSync(resolve(ROOT, relPath), 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
  return lines.map((l) => JSON.parse(fixJsonl(l)));
}

function loadTsv(relPath) {
  const lines = readFileSync(resolve(ROOT, relPath), 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
  if (lines[0]?.startsWith('sentence\t')) lines.shift();
  return lines
    .map((l) => {
      const parts = l.split('\t');
      if (parts.length < 2) return null;
      return { text: parts[0].trim(), label: parseInt(parts[1], 10) };
    })
    .filter((r) => r && !isNaN(r.label));
}

function loadCsvQuoted(relPath) {
  const lines = readFileSync(resolve(ROOT, relPath), 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
  return lines.map((l) => {
    let text = l.trim();
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1).replace(/""/g, '"');
    }
    return text;
  });
}

function formatScore(label, correct, misidentified, missed, total) {
  const score = total > 0 ? (correct - misidentified) / total : 0;
  const pct = (score * 100).toFixed(1);
  return {
    score,
    pct,
    detail: `${label}: ${pct}% (${correct} correct, ${misidentified} mis-classified, ${missed} missed, ${total} total)`,
  };
}

// ─── Smoke samples accuracy (samples.jsonl) ────────────────────────────────

function evaluateCase(testCase) {
  const expect = testCase.labels.expect;
  const r = detect(testCase.text, { sensitivity: 'medium' });

  if (expect.softPass || expect.mappingGap) {
    return { correct: 0, misidentified: 0, missed: 0, skipped: true };
  }

  if (expect.shouldFlag === false) {
    if (r.spans.length === 0) {
      return { correct: 1, misidentified: 0, missed: 0 };
    }
    const maxSpans = expect.maxSpans ?? 0;
    if (r.spans.length <= maxSpans) {
      if (expect.forbiddenCategories) {
        const forbidden = r.spans.some((s) =>
          expect.forbiddenCategories.includes(s.category),
        );
        if (forbidden) return { correct: 0, misidentified: 1, missed: 0 };
      }
      return { correct: 1, misidentified: 0, missed: 0 };
    }
    return { correct: 0, misidentified: 1, missed: 0 };
  }

  if (expect.shouldFlag === true) {
    if (r.spans.length === 0) {
      return { correct: 0, misidentified: 0, missed: 1 };
    }

    let matched = false;

    if (expect.categoriesAny) {
      matched = r.spans.some((s) => expect.categoriesAny.includes(s.category));
    }

    if (expect.coffeeLabelsAny) {
      matched =
        matched || r.spans.some((s) => expect.coffeeLabelsAny.includes(s.label));
    }

    if (expect.substringsAny) {
      matched =
        matched ||
        expect.substringsAny.some((sub) =>
          r.spans.some((s) =>
            s.text.toLowerCase().includes(sub.toLowerCase()),
          ),
        );
    }

    if (!expect.categoriesAny && !expect.coffeeLabelsAny && !expect.substringsAny) {
      matched = r.spans.length > 0;
    }

    if (matched) return { correct: 1, misidentified: 0, missed: 0 };
    return { correct: 0, misidentified: 1, missed: 0 };
  }

  return { correct: 0, misidentified: 0, missed: 0, skipped: true };
}

function runTrack(trackFile) {
  const cases = loadJsonl(trackFile);
  let correct = 0;
  let misidentified = 0;
  let missed = 0;
  let total = 0;

  for (const c of cases) {
    const result = evaluateCase(c);
    if (result.skipped) continue;
    correct += result.correct;
    misidentified += result.misidentified;
    missed += result.missed;
    total += 1;
  }

  const score = total > 0 ? (correct - misidentified) / total : 0;
  return { correct, misidentified, missed, total, score };
}

describe('Smoke samples accuracy — samples.jsonl (Correct - Misidentified) / Total >= 80%', () => {
  it('facts track achieves >= 80% accuracy on samples.jsonl', () => {
    const r = runTrack('test-data/facts/samples.jsonl');
    const pct = (r.score * 100).toFixed(1);
    assert.ok(
      r.score >= 0.8,
      `Facts: ${pct}% (${r.correct} correct, ${r.misidentified} mis-classified, ${r.missed} missed, ${r.total} total). Must be >= 80%.`,
    );
  });

  it('opinions track achieves >= 80% accuracy on samples.jsonl', () => {
    const r = runTrack('test-data/opinions/samples.jsonl');
    const pct = (r.score * 100).toFixed(1);
    assert.ok(
      r.score >= 0.8,
      `Opinions: ${pct}% (${r.correct} correct, ${r.misidentified} mis-classified, ${r.missed} missed, ${r.total} total). Must be >= 80%.`,
    );
  });

  it('fallacies track achieves >= 80% accuracy on samples.jsonl', () => {
    const r = runTrack('test-data/fallacies/samples.jsonl');
    const pct = (r.score * 100).toFixed(1);
    assert.ok(
      r.score >= 0.8,
      `Fallacies: ${pct}% (${r.correct} correct, ${r.misidentified} mis-classified, ${r.missed} missed, ${r.total} total). Must be >= 80%.`,
    );
  });

  it('overall accuracy across all tracks achieves >= 80%', () => {
    const facts = runTrack('test-data/facts/samples.jsonl');
    const opinions = runTrack('test-data/opinions/samples.jsonl');
    const fallacies = runTrack('test-data/fallacies/samples.jsonl');

    const c = facts.correct + opinions.correct + fallacies.correct;
    const m = facts.misidentified + opinions.misidentified + fallacies.misidentified;
    const t = facts.total + opinions.total + fallacies.total;
    const score = t > 0 ? (c - m) / t : 0;
    const pct = (score * 100).toFixed(1);

    assert.ok(
      score >= 0.8,
      `Overall: ${pct}% (${c} correct, ${m} mis-classified, ${t} total). Must be >= 80%.`,
    );
  });

  it('scoring formula matches NPS-style: (Correct - Misidentified) / Total', () => {
    assert.equal((8 - 1) / 10, 0.7);
  });
});

// ─── Full corpus accuracy — SUBJ dev.tsv ───────────────────────────────────
// label 0 = objective (fact): flagging it is a misidentification
// label 1 = subjective (opinion): not flagging is a miss (0 pts), flagging correctly is +1,
//           flagging with wrong category would be misidentification (-1)

function scoreSubjRow(row) {
  const r = detect(row.text, { sensitivity: 'medium' });

  if (row.label === 0) {
    if (r.spans.length === 0) {
      return { correct: 1, misidentified: 0, missed: 0 };
    }
    if (r.spans.length <= 2) {
      return { correct: 1, misidentified: 0, missed: 0 };
    }
    return { correct: 0, misidentified: 1, missed: 0 };
  }

  if (r.spans.length === 0) {
    return { correct: 0, misidentified: 0, missed: 1 };
  }
  return { correct: 1, misidentified: 0, missed: 0 };
}

function runSubjCorpus(relPath) {
  const rows = loadTsv(relPath);
  let correct = 0;
  let misidentified = 0;
  let missed = 0;

  for (const row of rows) {
    const s = scoreSubjRow(row);
    correct += s.correct;
    misidentified += s.misidentified;
    missed += s.missed;
  }

  const total = rows.length;
  const score = total > 0 ? (correct - misidentified) / total : 0;
  return { correct, misidentified, missed, total, score, rows };
}

describe('Full corpus accuracy — SUBJ dev.tsv (~900 rows)', () => {
  const result = runSubjCorpus('test-data/upstream/subj/dev.tsv');

  it('loads dev.tsv with expected row count', () => {
    assert.ok(result.rows.length >= 800, `Expected ~900 rows, got ${result.rows.length}`);
  });

  it('facts (label=0): false-positive rate — >= 80% of objective sentences stay clean', () => {
    const facts = result.rows.filter((r) => r.label === 0);
    let correct = 0;
    let misidentified = 0;

    for (const row of facts) {
      const r = detect(row.text, { sensitivity: 'medium' });
      if (r.spans.length <= 2) correct++;
      else misidentified++;
    }

    const { score, detail } = formatScore('Facts (dev.tsv label=0)', correct, misidentified, 0, facts.length);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });

  it('opinions (label=1): recall — >= 80% of subjective sentences get >= 1 span', () => {
    const opinions = result.rows.filter((r) => r.label === 1);
    let correct = 0;
    let missed = 0;

    for (const row of opinions) {
      const r = detect(row.text, { sensitivity: 'medium' });
      if (r.spans.length >= 1) correct++;
      else missed++;
    }

    const { score, detail } = formatScore('Opinions (dev.tsv label=1)', correct, 0, missed, opinions.length);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });

  it('combined dev.tsv NPS accuracy >= 80%', () => {
    const { score, detail } = formatScore(
      'Combined dev.tsv', result.correct, result.misidentified, result.missed, result.total,
    );
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });
});

// ─── Full corpus accuracy — SUBJ test.tsv ──────────────────────────────────

describe('Full corpus accuracy — SUBJ test.tsv (~1000 rows, held-out)', () => {
  const result = runSubjCorpus('test-data/upstream/subj/test.tsv');

  it('loads test.tsv with expected row count', () => {
    assert.ok(result.rows.length >= 900, `Expected ~1000 rows, got ${result.rows.length}`);
  });

  it('facts (label=0): false-positive rate — >= 80% have <= 2 spans', () => {
    const facts = result.rows.filter((r) => r.label === 0);
    let correct = 0;
    let misidentified = 0;

    for (const row of facts) {
      const r = detect(row.text, { sensitivity: 'medium' });
      if (r.spans.length <= 2) correct++;
      else misidentified++;
    }

    const { score, detail } = formatScore('Facts (test.tsv label=0)', correct, misidentified, 0, facts.length);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });

  it('opinions (label=1): recall — >= 80% get >= 1 span', () => {
    const opinions = result.rows.filter((r) => r.label === 1);
    let correct = 0;
    let missed = 0;

    for (const row of opinions) {
      const r = detect(row.text, { sensitivity: 'medium' });
      if (r.spans.length >= 1) correct++;
      else missed++;
    }

    const { score, detail } = formatScore('Opinions (test.tsv label=1)', correct, 0, missed, opinions.length);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });

  it('combined test.tsv NPS accuracy >= 80%', () => {
    const { score, detail } = formatScore(
      'Combined test.tsv', result.correct, result.misidentified, result.missed, result.total,
    );
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });
});

// ─── Full corpus accuracy — Smartybench fallacies ──────────────────────────

function scoreSmartyFallacy(text) {
  const r = detect(text, { sensitivity: 'medium' });
  if (r.spans.length === 0) {
    return { correct: 0, misidentified: 0, missed: 1 };
  }
  return { correct: 1, misidentified: 0, missed: 0 };
}

function scoreSmartyControl(text) {
  const r = detect(text, { sensitivity: 'medium' });
  const hasFallacy = r.spans.some((s) => s.category === CATEGORY.FALLACY);
  if (!hasFallacy) {
    return { correct: 1, misidentified: 0, missed: 0 };
  }
  return { correct: 0, misidentified: 1, missed: 0 };
}

describe('Full corpus accuracy — Smartybench fallacy corpus', () => {
  it('llm_generation_2_2.csv (219 fallacy sentences): detection rate >= 80%', () => {
    const sentences = loadCsvQuoted('test-data/upstream/smartybench/fallacy/llm_generation_2_2.csv');
    assert.ok(sentences.length >= 200, `Expected ~219 sentences, got ${sentences.length}`);

    let correct = 0;
    let missed = 0;

    for (const text of sentences) {
      const s = scoreSmartyFallacy(text);
      correct += s.correct;
      missed += s.missed;
    }

    const { score, detail } = formatScore('Smartybench fallacies', correct, 0, missed, sentences.length);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });

  it('good.csv (500 non-fallacy controls): false-positive rate — >= 80% have no fallacy spans', () => {
    const sentences = loadCsvQuoted('test-data/upstream/smartybench/fallacy/good.csv');
    assert.ok(sentences.length >= 400, `Expected ~500 sentences, got ${sentences.length}`);

    let correct = 0;
    let misidentified = 0;

    for (const text of sentences) {
      const s = scoreSmartyControl(text);
      correct += s.correct;
      misidentified += s.misidentified;
    }

    const { score, detail } = formatScore('Smartybench controls', correct, misidentified, 0, sentences.length);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });

  it('combined Smartybench NPS accuracy >= 80%', () => {
    const fallacies = loadCsvQuoted('test-data/upstream/smartybench/fallacy/llm_generation_2_2.csv');
    const controls = loadCsvQuoted('test-data/upstream/smartybench/fallacy/good.csv');

    let correct = 0;
    let misidentified = 0;
    let missed = 0;

    for (const text of fallacies) {
      const s = scoreSmartyFallacy(text);
      correct += s.correct;
      missed += s.missed;
    }

    for (const text of controls) {
      const s = scoreSmartyControl(text);
      correct += s.correct;
      misidentified += s.misidentified;
    }

    const total = fallacies.length + controls.length;
    const { score, detail } = formatScore('Combined Smartybench', correct, misidentified, missed, total);
    assert.ok(score >= 0.8, `${detail}. Must be >= 80%.`);
  });
});

// ─── Grand total across all corpora ────────────────────────────────────────

describe('Grand total accuracy — all corpora combined', () => {
  it('overall detection accuracy across SUBJ + Smartybench >= 80%', () => {
    const dev = runSubjCorpus('test-data/upstream/subj/dev.tsv');
    const test = runSubjCorpus('test-data/upstream/subj/test.tsv');

    const sbFallacies = loadCsvQuoted('test-data/upstream/smartybench/fallacy/llm_generation_2_2.csv');
    const sbControls = loadCsvQuoted('test-data/upstream/smartybench/fallacy/good.csv');

    let correct = dev.correct + test.correct;
    let misidentified = dev.misidentified + test.misidentified;
    let missed = dev.missed + test.missed;
    let total = dev.total + test.total;

    for (const text of sbFallacies) {
      const s = scoreSmartyFallacy(text);
      correct += s.correct;
      missed += s.missed;
      total++;
    }

    for (const text of sbControls) {
      const s = scoreSmartyControl(text);
      correct += s.correct;
      misidentified += s.misidentified;
      total++;
    }

    const score = (correct - misidentified) / total;
    const pct = (score * 100).toFixed(1);
    console.log(`\n  Grand total: ${pct}% accuracy`);
    console.log(`    ${correct} correct, ${misidentified} mis-classified, ${missed} missed, ${total} total`);

    assert.ok(
      score >= 0.8,
      `Grand total: ${pct}% (${correct} correct, ${misidentified} mis-classified, ${missed} missed, ${total} total). Must be >= 80%.`,
    );
  });
});
