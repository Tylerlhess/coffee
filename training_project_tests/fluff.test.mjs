import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripFluff, truncate } from '../src/lib/text/fluff.js';

describe('stripFluff', () => {
  it('removes URLs', () => {
    const out = stripFluff('Check this out https://example.com and tell me.');
    assert.ok(!out.includes('https://'));
  });

  it('removes emoji', () => {
    const out = stripFluff('Great news! 🎉 The deal is done.');
    assert.ok(!out.includes('🎉'));
    assert.ok(out.includes('deal'));
  });

  it('removes boilerplate lines', () => {
    const input = 'Real content here.\nShare\nSubscribe\nRead more\nAnother sentence.';
    const out = stripFluff(input);
    assert.ok(!out.toLowerCase().includes('subscribe'));
    assert.ok(!out.toLowerCase().includes('read more'));
    assert.ok(out.includes('Real content'));
  });

  it('removes filler phrases', () => {
    const out = stripFluff('As we all know, the economy is struggling.');
    assert.ok(!out.toLowerCase().includes('as we all know'));
    assert.ok(out.toLowerCase().includes('economy'));
  });

  it('strips markdown emphasis and links', () => {
    const out = stripFluff('Read [this article](https://example.com) for **more** info.');
    assert.ok(!out.includes('['));
    assert.ok(!out.includes('**'));
    assert.ok(out.includes('this article'));
  });

  it('removes @handles when keepHandles is false', () => {
    const out = stripFluff('Hey @username check this out', { keepHandles: false });
    assert.ok(!out.includes('@username'));
  });

  it('keeps @handles by default', () => {
    const out = stripFluff('Hey @username check this out');
    assert.ok(out.includes('@username'));
  });

  it('removes hashtags by default', () => {
    const out = stripFluff('Big news #breaking in politics today.');
    assert.ok(!out.includes('#breaking'));
  });

  it('deduplicates adjacent identical lines', () => {
    const out = stripFluff('Same line.\nSame line.\nSame line.\nDifferent line.');
    const lines = out.split('\n');
    for (let i = 1; i < lines.length; i++) {
      assert.notEqual(lines[i], lines[i - 1], 'Adjacent lines should not be identical');
    }
  });

  it('returns empty string for falsy input', () => {
    assert.equal(stripFluff(''), '');
    assert.equal(stripFluff(null), '');
    assert.equal(stripFluff(undefined), '');
  });

  it('drops ultra-short fragments', () => {
    const out = stripFluff('OK\nA\nThis is a real sentence.');
    assert.ok(out.includes('real sentence'));
  });

  it('capitalizes first letter of each output line', () => {
    const out = stripFluff('this is a test sentence about policy.');
    assert.ok(out.startsWith('T'), 'First letter should be capitalized');
  });
});

describe('truncate', () => {
  it('returns original text when under maxChars', () => {
    const text = 'Short sentence.';
    assert.equal(truncate(text, 100), text);
  });

  it('truncates long text and adds ellipsis marker', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth very long sentence that goes on and on and on and on.';
    const result = truncate(text, 50);
    assert.ok(result.length < text.length, 'Should be shorter than original');
    assert.ok(result.includes('…[truncated]'));
  });

  it('prefers sentence boundaries for truncation', () => {
    const text = 'First sentence. Second sentence. Third sentence is much longer and extends beyond the limit.';
    const result = truncate(text, 40);
    assert.ok(
      result.includes('First sentence.') || result.includes('…[truncated]'),
    );
  });

  it('returns falsy input as-is', () => {
    assert.equal(truncate('', 100), '');
    assert.equal(truncate(null, 100), null);
  });
});
