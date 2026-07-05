/**
 * Pattern-matching detectors for argumentative / opinion / fallacy language.
 *
 * This module is pure (no DOM, no chrome APIs) so it can run identically in the
 * background worker and inside the content script. It does NOT decide truth — it
 * flags *language indicative* of opinion or faulty reasoning, so a human (or an
 * LLM, downstream) can investigate the flagged spans.
 *
 * Each detector category carries a `weight` used to scale with sensitivity.
 */

export const CATEGORY = Object.freeze({
  OPINION: 'opinion',
  CERTAINTY: 'certainty',
  GENERALIZATION: 'generalization',
  PRESCRIPTIVE: 'prescriptive',
  FALLACY: 'fallacy',
  LOADED: 'loaded',
});

const CATEGORY_LABEL = {
  [CATEGORY.OPINION]: 'Opinion marker',
  [CATEGORY.CERTAINTY]: 'Overstated certainty',
  [CATEGORY.GENERALIZATION]: 'Sweeping generalization',
  [CATEGORY.PRESCRIPTIVE]: 'Prescriptive / normative',
  [CATEGORY.FALLACY]: 'Possible logical fallacy',
  [CATEGORY.LOADED]: 'Loaded / emotive language',
};

/**
 * A rule: { category, label, hint, re, weight }
 * `re` must be a global, case-insensitive regex. `hint` explains *why* it was
 * flagged and what to investigate.
 */
const RULES = [
  // --- Opinion markers (subjective framing presented in declarative voice) ---
  rule(CATEGORY.OPINION, /\b(I|we) (think|believe|feel|reckon|suspect|guess)\b/gi,
    'First-person belief framing — a stated opinion, not an established fact.'),
  rule(CATEGORY.OPINION, /\b(in my (humble )?opinion|imo|imho|from my perspective|if you ask me)\b/gi,
    'Explicit opinion signal.'),
  rule(CATEGORY.OPINION, /\b(arguably|seemingly|presumably|supposedly|allegedly)\b/gi,
    'Hedged claim — verify whether evidence actually supports it.'),
  rule(CATEGORY.OPINION, /\b(the (real )?truth is|let'?s be honest|honestly|frankly|the fact (of the matter )?is)\b/gi,
    'Rhetorical truth-assertion often used to smuggle an opinion past scrutiny.'),

  // --- Overstated certainty (opinion-as-fact tells) ---
  rule(CATEGORY.CERTAINTY, /\b(obviously|clearly|undeniably|without a doubt|undoubtedly|of course|needless to say|it'?s no secret)\b/gi,
    'Certainty intensifier — claims framed as self-evident frequently are not.'),
  rule(CATEGORY.CERTAINTY, /\b(everyone knows|nobody can deny|it'?s common knowledge|any reasonable person)\b/gi,
    'Appeal to consensus — investigate whether the claim is actually established.'),
  rule(CATEGORY.CERTAINTY, /\b(proves?|proven|undeniable proof|the science is settled)\b/gi,
    'Strong evidentiary claim — check whether cited evidence supports the conclusion.'),

  // --- Sweeping generalizations ---
  rule(CATEGORY.GENERALIZATION, /\b(always|never|everyone|nobody|no one|all of (them|us)|every single|none of)\b/gi,
    'Absolute quantifier — generalizations rarely survive counter-examples.'),
  rule(CATEGORY.GENERALIZATION, /\b(the (left|right|media|elites|government|corporations) (always|never|all|are all))\b/gi,
    'Group generalization — a single label standing in for a diverse population.'),

  // --- Prescriptive / normative ---
  rule(CATEGORY.PRESCRIPTIVE, /\b(should|must|ought to|have to|need to|the best way|the only way|we cannot allow)\b/gi,
    'Normative claim (what *ought* to be) — a value judgment, not a verifiable fact.'),
  rule(CATEGORY.PRESCRIPTIVE, /\b(the (best|worst|greatest|only) (option|choice|solution|way|thing))\b/gi,
    'Superlative judgment — subjective ranking presented as settled.'),

  // --- Loaded / emotive language ---
  rule(CATEGORY.LOADED, /\b(disastrous|catastrophic|insane|crazy|idiotic|stupid|evil|corrupt|disgraceful|outrageous|shameful|woke|radical)\b/gi,
    'Emotionally loaded term — may signal persuasion over information.'),
  rule(CATEGORY.LOADED, /\b(destroy(ing|ed)?|annihilate|crush(ing|ed)?|wreck(ing|ed)?|slam(med)?|blast(ed)?|owned)\b/gi,
    'Combative framing common in rage-bait and editorializing.'),

  // --- Logical fallacy cue phrases (heuristic; LLM confirms) ---
  fallacy(/\b(so (you'?re|you are) saying|what you'?re really saying)\b/gi, 'Straw man',
    'Possible straw man — re-stating an opponent\'s view in a weaker form.'),
  fallacy(/\b(what about|whatabout|but you also|you people)\b/gi, 'Whataboutism / tu quoque',
    'Deflecting a claim by pointing at a different issue or the accuser.'),
  fallacy(/\b(if we allow|next thing you know|where does it end|slippery slope|before you know it)\b/gi, 'Slippery slope',
    'Chain-of-consequences without justifying each link.'),
  fallacy(/\b(either .{1,40} or|it'?s (us|them) (or|vs)|you'?re either)\b/gi, 'False dilemma',
    'Presents two options as if no others exist.'),
  fallacy(/\b(experts? (say|agree)|studies show|scientists? (say|agree))\b(?![^.?!]{0,60}\b(cited|source|link|doi|http))/gi, 'Appeal to authority (uncited)',
    'Authority invoked without a verifiable source — check who and what study.'),
  fallacy(/\b(real (americans|patriots|men|women)|true (fan|believer|conservative|liberal))\b/gi, 'No true Scotsman',
    'Redefining a group to exclude counter-examples.'),
  fallacy(/\b(everyone is (doing|saying)|join the millions|don'?t be left behind|the majority (of people )?(agree|believe))\b/gi, 'Bandwagon',
    'Popularity treated as evidence of truth.'),
  fallacy(/\b(you'?re just|typical .{1,20} (shill|sheep|bot)|of course (you|he|she|they) would say)\b/gi, 'Ad hominem',
    'Attacks the person rather than the argument.'),
  fallacy(/\b(after .{1,30} then|ever since .{1,30} (we|they) (have|had))\b/gi, 'Post hoc (correlation ≠ causation)',
    'Sequence in time presented as cause and effect.'),
];

function rule(category, re, hint, weight = 1) {
  return { category, label: CATEGORY_LABEL[category], re, hint, weight };
}
function fallacy(re, name, hint, weight = 1.5) {
  return { category: CATEGORY.FALLACY, label: name, re, hint, weight };
}

/** Sensitivity → minimum cumulative weight required to keep a span. */
const SENSITIVITY_THRESHOLD = { low: 1.5, medium: 1, high: 0 };

/**
 * Scan text and return non-overlapping spans, highest-weight first.
 * @returns {{spans: Array, stats: object, phrases: string[]}}
 */
export function detect(text, { sensitivity = 'medium' } = {}) {
  if (!text || typeof text !== 'string') {
    return { spans: [], stats: emptyStats(), phrases: [] };
  }
  const threshold = SENSITIVITY_THRESHOLD[sensitivity] ?? 1;
  const raw = [];

  for (const r of RULES) {
    r.re.lastIndex = 0;
    let m;
    while ((m = r.re.exec(text)) !== null) {
      if (m[0].trim().length === 0) {
        r.re.lastIndex += 1; // guard against zero-width matches
        continue;
      }
      raw.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        category: r.category,
        label: r.label,
        hint: r.hint,
        weight: r.weight,
      });
    }
  }

  const spans = dedupeOverlaps(raw).filter((s) => s.weight >= threshold);
  spans.sort((a, b) => b.weight - a.weight || a.start - b.start);

  return {
    spans,
    stats: summarize(spans),
    phrases: [...new Set(spans.map((s) => s.text))],
  };
}

/** Resolve overlapping matches, keeping the highest-weight one per region. */
function dedupeOverlaps(matches) {
  const sorted = [...matches].sort(
    (a, b) => a.start - b.start || b.weight - a.weight || b.end - a.end,
  );
  const out = [];
  for (const m of sorted) {
    const prev = out[out.length - 1];
    if (prev && m.start < prev.end) {
      if (m.weight > prev.weight) out[out.length - 1] = m; // upgrade
      continue;
    }
    out.push(m);
  }
  return out;
}

function summarize(spans) {
  const byCategory = {};
  for (const s of spans) byCategory[s.category] = (byCategory[s.category] || 0) + 1;
  return {
    total: spans.length,
    byCategory,
    fallacyCount: byCategory[CATEGORY.FALLACY] || 0,
    opinionCount:
      (byCategory[CATEGORY.OPINION] || 0) + (byCategory[CATEGORY.CERTAINTY] || 0),
  };
}

function emptyStats() {
  return { total: 0, byCategory: {}, fallacyCount: 0, opinionCount: 0 };
}
