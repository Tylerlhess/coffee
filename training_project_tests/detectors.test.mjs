import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detect, CATEGORY } from '../src/lib/text/detectors.js';

function spanCategories(result) {
  return [...new Set(result.spans.map((s) => s.category))];
}

function spanLabels(result) {
  return [...new Set(result.spans.map((s) => s.label))];
}

function spanTexts(result) {
  return result.spans.map((s) => s.text.toLowerCase());
}

function hasCategory(result, cat) {
  return result.spans.some((s) => s.category === cat);
}

function hasLabel(result, label) {
  return result.spans.some((s) => s.label === label);
}

function hasSubstring(result, sub) {
  return result.spans.some((s) => s.text.toLowerCase().includes(sub.toLowerCase()));
}

// ─── Facts track (negative control) ────────────────────────────────────────
// Objective, factual text should produce few or zero detection spans.

describe('Facts track — negative control', () => {
  it('wire-style financial news produces zero spans', () => {
    const r = detect(
      'The European Central Bank held its main refinancing rate at 4.50 percent on Thursday.',
    );
    assert.equal(r.spans.length, 0, 'Expected no spans on neutral wire copy');
  });

  it('geographic fact produces zero spans', () => {
    const r = detect(
      'Mount Everest rises 8,849 meters above sea level according to the 2020 Nepal-China survey.',
    );
    assert.equal(r.spans.length, 0);
  });

  it('spacecraft fact produces zero spans', () => {
    const r = detect('The spacecraft entered orbit at 0623 UTC after a nine-month cruise.');
    assert.equal(r.spans.length, 0);
  });

  it('factual use of "never" allows at most 1 generalization span', () => {
    const r = detect('The policy never applied to rural counties during the pilot phase.');
    const genCount = r.spans.filter((s) => s.category === CATEGORY.GENERALIZATION).length;
    assert.ok(genCount <= 1, `Expected at most 1 generalization span, got ${genCount}`);
    assert.ok(
      !hasCategory(r, CATEGORY.FALLACY),
      'Factual "never" should not trigger a fallacy',
    );
  });

  it('Smartybench valid-reasoning control has no fallacy spans', () => {
    const r = detect(
      'Talks to the general public, Sanctuary Advisory Council and Georgia Law Enforcement working groups also helped increase awareness of the lionfish issue and conveyed removal plans for the region.',
    );
    assert.ok(!hasCategory(r, CATEGORY.FALLACY), 'Should not flag valid reasoning as fallacy');
    assert.equal(r.spans.length, 0, 'Expected zero spans on valid reasoning');
  });

  it('IRD background text (Smartybench control) has no fallacy spans', () => {
    const r = detect(
      "Background: Prior Practice and Impetus for Change The IRD's previous practice was, generally, not to assess a PILON.",
    );
    assert.ok(!hasCategory(r, CATEGORY.FALLACY));
    assert.equal(r.spans.length, 0);
  });

  it('SUBJ label=0 movie plot text stays within maxSpans tolerance', () => {
    const texts = [
      'When it comes to entertainment , children deserve better than pokemon 4ever .',
      'A subtle , poignant picture of goodness that is flawed , compromised and sad .',
      'The film starts out as competent but unremarkable . . . and gradually grows into something of considerable power .',
      'Will she get it , or will death get her first ?',
    ];
    for (const text of texts) {
      const r = detect(text);
      assert.ok(r.spans.length <= 2, `"${text.slice(0, 50)}…" produced ${r.spans.length} spans (max 2)`);
    }
  });

  it('scientific report text produces zero spans', () => {
    const r = detect(
      'The sample contained 42% silica by weight as measured by X-ray fluorescence spectroscopy.',
    );
    assert.equal(r.spans.length, 0);
  });

  it('historical date fact produces zero spans', () => {
    const r = detect('The Berlin Wall fell on November 9, 1989.');
    assert.equal(r.spans.length, 0);
  });
});

// ─── Opinions track ────────────────────────────────────────────────────────
// Subjective / argumentative text should be flagged.

describe('Opinions track — detection of subjective markers', () => {
  it('detects "I think" and "obviously"', () => {
    const r = detect('I think this policy is obviously a disaster for working families.');
    assert.ok(r.spans.length > 0, 'Should flag opinion markers');
    assert.ok(hasSubstring(r, 'I think'), 'Should detect "I think"');
    assert.ok(hasSubstring(r, 'obviously'), 'Should detect "obviously"');
  });

  it('detects "In my humble opinion", "should", "never"', () => {
    const r = detect('In my humble opinion, the bill should never pass the Senate.');
    assert.ok(r.spans.length > 0);
    assert.ok(hasSubstring(r, 'In my humble opinion'));
  });

  it('detects "Everyone knows" (certainty + generalization)', () => {
    const r = detect('Everyone knows the experts say it will destroy the economy.');
    assert.ok(r.spans.length > 0);
    assert.ok(
      hasCategory(r, CATEGORY.CERTAINTY) || hasCategory(r, CATEGORY.GENERALIZATION),
    );
  });

  it('detects "Frankly", "the only way", "corrupt"', () => {
    const r = detect(
      'Frankly, the only way forward is to reject this corrupt deal outright.',
    );
    assert.ok(r.spans.length > 0);
    assert.ok(hasSubstring(r, 'Frankly') || hasSubstring(r, 'the only way') || hasSubstring(r, 'corrupt'));
  });

  it('detects "must", "crush", "wreck"', () => {
    const r = detect(
      'We must crush the opposition before they wreck what is left of the city.',
    );
    assert.ok(hasCategory(r, CATEGORY.PRESCRIPTIVE) || hasCategory(r, CATEGORY.LOADED));
    assert.ok(r.spans.length >= 2, 'Multiple markers expected');
  });

  it('detects "Arguably" and "always"', () => {
    const r = detect('Arguably, the media always gets these stories wrong.');
    assert.ok(hasCategory(r, CATEGORY.OPINION) || hasCategory(r, CATEGORY.GENERALIZATION));
    assert.ok(hasSubstring(r, 'Arguably') || hasSubstring(r, 'always'));
  });

  it('detects "The real truth is", "nobody can deny", "outrageous"', () => {
    const r = detect(
      'The real truth is that nobody can deny how outrageous this outcome is.',
    );
    assert.ok(r.spans.length >= 2);
    assert.ok(hasCategory(r, CATEGORY.OPINION) || hasCategory(r, CATEGORY.CERTAINTY));
  });

  it('detects "Honestly", "need to", "insane"', () => {
    const r = detect('Honestly, we need to ban this insane practice immediately.');
    assert.ok(r.spans.length >= 2);
    assert.ok(hasSubstring(r, 'Honestly') || hasSubstring(r, 'need to') || hasSubstring(r, 'insane'));
  });

  it('detects "should", "clearly", "never" combined', () => {
    const r = detect(
      'The government should have to prove every claim, but clearly they never will.',
    );
    assert.ok(r.spans.length >= 2);
    assert.ok(
      hasCategory(r, CATEGORY.PRESCRIPTIVE) ||
        hasCategory(r, CATEGORY.CERTAINTY) ||
        hasCategory(r, CATEGORY.GENERALIZATION),
    );
  });

  it('detects hedging language "presumably"', () => {
    const r = detect('The outcome is presumably going to affect millions of people.');
    assert.ok(hasSubstring(r, 'presumably'));
    assert.ok(hasCategory(r, CATEGORY.OPINION));
  });
});

// ─── Fallacies track ───────────────────────────────────────────────────────
// Named logical fallacy cue phrases should trigger fallacy-category spans.

describe('Fallacies track — named fallacy detection', () => {
  it('detects Straw man: "So you\'re saying"', () => {
    const r = detect("So you're saying we should just give up on healthcare entirely?");
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Straw man'));
  });

  it('detects Whataboutism: "What about"', () => {
    const r = detect('What about when your party did the same thing in 2019?');
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Whataboutism / tu quoque'));
  });

  it('detects Slippery slope: "If we allow", "next thing you know"', () => {
    const r = detect(
      "If we allow this minor zoning change, next thing you know they'll bulldoze the whole neighborhood.",
    );
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Slippery slope'));
  });

  it('detects False dilemma: "either...or"', () => {
    const r = detect("You're either with us or against freedom itself.");
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'False dilemma'));
  });

  it('detects Appeal to authority (uncited): "Studies show", "experts agree"', () => {
    const r = detect('Studies show the plan fails, and experts agree it is unworkable.');
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Appeal to authority (uncited)'));
  });

  it('detects No true Scotsman: "real Americans"', () => {
    const r = detect('Real Americans would never support a policy like that.');
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'No true Scotsman'));
  });

  it('detects Bandwagon: "Everyone is saying", "join the millions"', () => {
    const r = detect(
      'Everyone is saying we need to join the millions who already switched.',
    );
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Bandwagon'));
  });

  it('detects Ad hominem: "You\'re just", "typical...shill"', () => {
    const r = detect(
      "You're just a typical corporate shill, of course you would say that.",
    );
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Ad hominem'));
  });

  it('detects Post hoc: "Ever since...we have had"', () => {
    const r = detect(
      'Ever since the new mayor took office we have had higher rents, so she caused the housing crisis.',
    );
    assert.ok(hasCategory(r, CATEGORY.FALLACY));
    assert.ok(hasLabel(r, 'Post hoc (correlation ≠ causation)'));
  });

  it('Smartybench non-fallacy control produces no fallacy spans', () => {
    const r = detect(
      "Immediately, Mozart suggested a libretto drawn from Beaumarchais' seditious 1784 play, Le Mariage de Figaro.",
    );
    assert.ok(!hasCategory(r, CATEGORY.FALLACY));
    assert.equal(r.spans.length, 0);
  });

  it('composite paragraph detects multiple categories', () => {
    const text =
      "As we all know, the policy is obviously a disaster. Everyone knows the experts say it will destroy the economy. I think we should never allow this. So you're saying we give up? Studies show crime always goes up.";
    const r = detect(text);
    assert.ok(r.spans.length >= 3, 'Composite text should trigger multiple spans');
    const cats = spanCategories(r);
    assert.ok(cats.length >= 2, 'Multiple categories expected');
  });

  it('fallacy spans have weight 1.5', () => {
    const r = detect("So you're saying we should just give up?");
    const fallacySpans = r.spans.filter((s) => s.category === CATEGORY.FALLACY);
    for (const s of fallacySpans) {
      assert.equal(s.weight, 1.5, `Fallacy span "${s.text}" should have weight 1.5`);
    }
  });
});

// ─── detect() API shape ────────────────────────────────────────────────────

describe('detect() API contract', () => {
  it('returns { spans, stats, phrases } structure', () => {
    const r = detect('I think this is wrong.');
    assert.ok(Array.isArray(r.spans));
    assert.ok(typeof r.stats === 'object');
    assert.ok(Array.isArray(r.phrases));
  });

  it('returns empty result for null/undefined input', () => {
    for (const input of [null, undefined, '', 0]) {
      const r = detect(input);
      assert.equal(r.spans.length, 0);
      assert.equal(r.stats.total, 0);
      assert.equal(r.phrases.length, 0);
    }
  });

  it('stats.total equals spans.length', () => {
    const r = detect('I think obviously everyone must agree.');
    assert.equal(r.stats.total, r.spans.length);
  });

  it('stats.fallacyCount counts only fallacy spans', () => {
    const r = detect("So you're saying we should just give up? I think that's wrong.");
    assert.equal(
      r.stats.fallacyCount,
      r.spans.filter((s) => s.category === CATEGORY.FALLACY).length,
    );
  });

  it('stats.opinionCount sums opinion + certainty categories', () => {
    const r = detect('I think obviously this is clearly wrong.');
    const expected =
      r.spans.filter(
        (s) => s.category === CATEGORY.OPINION || s.category === CATEGORY.CERTAINTY,
      ).length;
    assert.equal(r.stats.opinionCount, expected);
  });

  it('each span has required fields', () => {
    const r = detect('I think this is obviously terrible and should be stopped.');
    for (const s of r.spans) {
      assert.ok(typeof s.start === 'number');
      assert.ok(typeof s.end === 'number');
      assert.ok(typeof s.text === 'string');
      assert.ok(typeof s.category === 'string');
      assert.ok(typeof s.label === 'string');
      assert.ok(typeof s.hint === 'string');
      assert.ok(typeof s.weight === 'number');
      assert.ok(s.end > s.start, 'end must be greater than start');
    }
  });

  it('phrases are deduplicated', () => {
    const r = detect('I think one thing. I think another thing.');
    const phraseSet = new Set(r.phrases);
    assert.equal(r.phrases.length, phraseSet.size, 'phrases should be unique');
  });
});

// ─── Sensitivity levels ────────────────────────────────────────────────────

describe('Sensitivity filtering', () => {
  it('low sensitivity only returns weight >= 1.5 (fallacies)', () => {
    const r = detect(
      "I think we should stop. So you're saying we give up?",
      { sensitivity: 'low' },
    );
    for (const s of r.spans) {
      assert.ok(s.weight >= 1.5, `Low sensitivity should filter out weight ${s.weight}`);
    }
  });

  it('medium sensitivity returns weight >= 1', () => {
    const r = detect('I think obviously we should stop.', { sensitivity: 'medium' });
    for (const s of r.spans) {
      assert.ok(s.weight >= 1, `Medium sensitivity should filter out weight ${s.weight}`);
    }
  });

  it('high sensitivity returns all spans (weight >= 0)', () => {
    const r = detect('I think we should stop.', { sensitivity: 'high' });
    assert.ok(r.spans.length > 0);
  });

  it('low sensitivity filters opinion markers but keeps fallacies', () => {
    const text = "I think this is wrong. So you're saying we should give up?";
    const low = detect(text, { sensitivity: 'low' });
    const med = detect(text, { sensitivity: 'medium' });
    assert.ok(low.spans.length <= med.spans.length);
    assert.ok(low.spans.every((s) => s.category === CATEGORY.FALLACY || s.weight >= 1.5));
  });
});

// ─── Overlap deduplication ─────────────────────────────────────────────────

describe('Overlap deduplication', () => {
  it('does not return overlapping spans', () => {
    const r = detect(
      "Everyone knows the experts say it will destroy everything. So you're saying we give up? What about last year?",
    );
    const sorted = [...r.spans].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(
        sorted[i].start >= sorted[i - 1].end,
        `Span "${sorted[i].text}" overlaps with "${sorted[i - 1].text}"`,
      );
    }
  });

  it('keeps higher-weight span when two overlap', () => {
    const r = detect("Everyone is saying we should join the millions.");
    const fallacySpans = r.spans.filter((s) => s.category === CATEGORY.FALLACY);
    if (fallacySpans.length > 0) {
      assert.ok(
        fallacySpans[0].weight >= 1.5,
        'Higher-weight fallacy span should be kept',
      );
    }
  });
});

// ─── CATEGORY export ───────────────────────────────────────────────────────

describe('CATEGORY constants', () => {
  it('exports all six categories', () => {
    assert.equal(CATEGORY.OPINION, 'opinion');
    assert.equal(CATEGORY.CERTAINTY, 'certainty');
    assert.equal(CATEGORY.GENERALIZATION, 'generalization');
    assert.equal(CATEGORY.PRESCRIPTIVE, 'prescriptive');
    assert.equal(CATEGORY.FALLACY, 'fallacy');
    assert.equal(CATEGORY.LOADED, 'loaded');
  });

  it('CATEGORY is frozen', () => {
    assert.ok(Object.isFrozen(CATEGORY));
  });
});
