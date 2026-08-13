import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalysisRequest } from '../src/lib/query/builder.js';
import { DEFAULT_CONFIG } from '../src/lib/config/defaults.js';
import { ANALYSIS_SCHEMA } from '../src/lib/query/prompts.js';

function makeConfig(overrides = {}) {
  return { ...structuredClone(DEFAULT_CONFIG), ...overrides };
}

describe('buildAnalysisRequest', () => {
  const sample =
    "I think the policy is obviously wrong. So you're saying we give up? Studies show it fails.";

  it('returns messages array with system and user roles', () => {
    const req = buildAnalysisRequest(sample, makeConfig());
    assert.equal(req.messages.length, 2);
    assert.equal(req.messages[0].role, 'system');
    assert.equal(req.messages[1].role, 'user');
  });

  it('returns cleaned text after fluff stripping', () => {
    const req = buildAnalysisRequest(
      'Click here to subscribe. ' + sample,
      makeConfig(),
    );
    assert.ok(!req.cleaned.toLowerCase().includes('subscribe'));
  });

  it('returns localFindings with spans from detect()', () => {
    const req = buildAnalysisRequest(sample, makeConfig());
    assert.ok(Array.isArray(req.localFindings.spans));
    assert.ok(req.localFindings.spans.length > 0);
  });

  it('returns the ANALYSIS_SCHEMA', () => {
    const req = buildAnalysisRequest(sample, makeConfig());
    assert.deepEqual(req.schema, ANALYSIS_SCHEMA);
  });

  it('schema has required top-level keys', () => {
    assert.deepEqual(ANALYSIS_SCHEMA.required, [
      'summary',
      'claims',
      'fallacies',
      'questions',
    ]);
  });

  it('user prompt includes content boundary markers', () => {
    const req = buildAnalysisRequest(sample, makeConfig());
    assert.ok(req.messages[1].content.includes('--- CONTENT START ---'));
    assert.ok(req.messages[1].content.includes('--- CONTENT END ---'));
  });

  it('respects maxChars truncation', () => {
    const longText = 'A'.repeat(50000);
    const config = makeConfig();
    config.analysis.maxChars = 100;
    const req = buildAnalysisRequest(longText, config);
    assert.ok(req.cleaned.length <= 120);
  });
});
