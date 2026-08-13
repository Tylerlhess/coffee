import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detect } from '../src/lib/text/detectors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function fixJsonl(line) {
  let s = line.trim();
  const opens = (s.match(/{/g) || []).length;
  const closes = (s.match(/}/g) || []).length;
  for (let i = 0; i < opens - closes; i++) s += '}';
  return s;
}

function loadJsonl(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(fixJsonl(l)));
}

function assertExpect(testCase) {
  const expect = testCase.labels.expect;
  const r = detect(testCase.text, { sensitivity: 'medium' });

  if (expect.shouldFlag === false) {
    const maxSpans = expect.maxSpans ?? 0;
    assert.ok(
      r.spans.length <= maxSpans,
      `[${testCase.id}] expected <= ${maxSpans} spans, got ${r.spans.length}`,
    );
    if (expect.forbiddenCategories) {
      for (const s of r.spans) {
        assert.ok(
          !expect.forbiddenCategories.includes(s.category),
          `[${testCase.id}] forbidden category "${s.category}" found in span "${s.text}"`,
        );
      }
    }
    if (expect.maxSpansPerCategory) {
      for (const [cat, max] of Object.entries(expect.maxSpansPerCategory)) {
        const count = r.spans.filter((s) => s.category === cat).length;
        assert.ok(
          count <= max,
          `[${testCase.id}] category "${cat}": expected <= ${max} spans, got ${count}`,
        );
      }
    }
    return;
  }

  if (expect.shouldFlag === true) {
    if (expect.softPass || expect.mappingGap) return;

    assert.ok(
      r.spans.length > 0,
      `[${testCase.id}] expected at least one span but got none`,
    );

    if (expect.categoriesAny) {
      const found = r.spans.some((s) => expect.categoriesAny.includes(s.category));
      assert.ok(
        found,
        `[${testCase.id}] expected at least one category from [${expect.categoriesAny}], got [${[...new Set(r.spans.map((s) => s.category))]}]`,
      );
    }

    if (expect.coffeeLabelsAny) {
      const found = r.spans.some((s) => expect.coffeeLabelsAny.includes(s.label));
      assert.ok(
        found,
        `[${testCase.id}] expected label from [${expect.coffeeLabelsAny}], got [${[...new Set(r.spans.map((s) => s.label))]}]`,
      );
    }

    if (expect.substringsAny) {
      const found = expect.substringsAny.some((sub) =>
        r.spans.some((s) => s.text.toLowerCase().includes(sub.toLowerCase())),
      );
      assert.ok(
        found,
        `[${testCase.id}] expected substring match from [${expect.substringsAny}], matched spans: [${r.spans.map((s) => s.text)}]`,
      );
    }
  }
}

describe('JSONL harness — facts/samples.jsonl', () => {
  const cases = loadJsonl('test-data/facts/samples.jsonl');
  for (const c of cases) {
    it(`${c.id}: ${c.text.slice(0, 60)}…`, () => {
      assertExpect(c);
    });
  }
});

describe('JSONL harness — opinions/samples.jsonl', () => {
  const cases = loadJsonl('test-data/opinions/samples.jsonl');
  for (const c of cases) {
    it(`${c.id}: ${c.text.slice(0, 60)}…`, () => {
      assertExpect(c);
    });
  }
});

describe('JSONL harness — fallacies/samples.jsonl', () => {
  const cases = loadJsonl('test-data/fallacies/samples.jsonl');
  for (const c of cases) {
    it(`${c.id}: ${c.text.slice(0, 60)}…`, () => {
      assertExpect(c);
    });
  }
});
