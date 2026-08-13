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
  rule(CATEGORY.OPINION, /\b(amazing|incredible|wonderful|fantastic|brilliant|beautiful|stunning|remarkable|extraordinary|exceptional|magnificent|marvelous|superb|excellent)\b/gi,
    'Positive evaluative language — subjective assessment rather than objective description.', 0.7),
  rule(CATEGORY.OPINION, /\b(terrible|awful|horrible|dreadful|poor|bad|disappointing|unfortunate|sad|tragic|disturbing|bizarre|strange|weird|odd)\b/gi,
    'Negative/unusual evaluative language — subjective characterization.', 0.7),
  rule(CATEGORY.OPINION, /\b(interesting|compelling|engaging|touching|moving|powerful|effective|impressive|noteworthy|significant)\b/gi,
    'Evaluative descriptors common in subjective assessments.', 0.6),
  rule(CATEGORY.OPINION, /\b(classic|legendary|iconic|historic|memorable|unforgettable|unique|special|rare)\b/gi,
    'Subjective qualitative assessments.', 0.6),
  rule(CATEGORY.OPINION, /\b(seems?|appears?|looks? like|sounds? like|feels? like|comes? across as)\b/gi,
    'Perception-based framing indicating subjective interpretation.', 0.5),
  rule(CATEGORY.OPINION, /\b(manages? to|fails? to|struggles? to|attempts? to|tries to|seeks to|aims? to)\b/gi,
    'Evaluative framing of actions/efforts — subjective judgment of success/failure.', 0.5),
  rule(CATEGORY.OPINION, /\b(finds? (himself|herself|themselves|itself)|becomes?|turns? (into|out)|ends? up|winds? up|comes? to)\b/gi,
    'Narrative transformation/realization language — subjective story framing.', 0.6),
  rule(CATEGORY.OPINION, /\b(experience|journey|adventure|quest|story|tale|saga|epic)\b/gi,
    'Narrative framing terms — subjective story characterization.', 0.6),
  rule(CATEGORY.OPINION, /\b(discovers?|learns?|realizes?|understands?|recognizes?|encounters?|meets?)\b/gi,
    'Character development language — narrative subjective framing.', 0.5),
  rule(CATEGORY.OPINION, /\b(escapes?|flees?|runs? (from|away)|pursues?|chases?|hunts?|searches? for|looks? for)\b/gi,
    'Plot action language — narrative subjective framing.', 0.5),
  rule(CATEGORY.OPINION, /\b(decides?|chooses?|determines?|resolves? to|sets? out to|embarks?|begins?|starts?)\b/gi,
    'Character agency language — narrative decision framing.', 0.5),
  rule(CATEGORY.OPINION, /\b(faces?|confronts?|deals? with|overcomes?|survives?|endures?|suffers?)\b/gi,
    'Challenge/conflict language — narrative subjective framing.', 0.5),
  rule(CATEGORY.OPINION, /\b(hopes?|dreams?|fears?|worries?|wants?|wishes?|desires?|longs? for)\b/gi,
    'Character motivation/emotion language — subjective internal states.', 0.6),
  rule(CATEGORY.OPINION, /\b(forced to|compelled to|obliged to|required to)\b/gi,
    'Necessity framing — narrative constraint language.', 0.5),
  rule(CATEGORY.OPINION, /\b(relationship|romance|friendship|bond|connection|partnership)\b/gi,
    'Social dynamic language — subjective relational framing.', 0.5),
  rule(CATEGORY.OPINION, /\b(follows?|tracks?|chronicles?|depicts?|portrays?|shows?|reveals?|explores?|examines?)\b/gi,
    'Narrative presentation language — subjective framing of content.', 0.5),
  rule(CATEGORY.OPINION, /\b(gets?|receives?|obtains?|acquires?|gains?|loses?|lost)\b/gi,
    'Change of state language — narrative transformation.', 0.5),
  rule(CATEGORY.OPINION, /\b(returns?|returned|arrives?|arrived|leaves?|left|goes?|went|comes?|came)\b/gi,
    'Movement/journey language — narrative transitions.', 0.45),
  rule(CATEGORY.OPINION, /\b(tries?|tried|attempts?|attempted|seeks?|sought)\b/gi,
    'Effort/attempt language — character agency.', 0.5),
  rule(CATEGORY.OPINION, /\b(takes?|took|brings?|brought|gives?|gave|offers?|offered|provides?|provided)\b/gi,
    'Transaction/exchange language — narrative action.', 0.45),
  rule(CATEGORY.OPINION, /\b(makes?|made|creates?|created|builds?|built|forms?|formed)\b/gi,
    'Creation language — narrative transformation.', 0.45),
  rule(CATEGORY.OPINION, /\b(joins?|joined|enters?|entered|becomes? part of)\b/gi,
    'Membership/belonging language — narrative transition.', 0.5),
  rule(CATEGORY.OPINION, /\b(says?|said|tells?|told|asks?|asked|answers?|answered|replies?|replied|responds?|responded)\b/gi,
    'Dialogue/communication language — narrative interaction.', 0.45),
  rule(CATEGORY.OPINION, /\b(talks? about|speaks? about|discusses?|discussed|mentions?|mentioned|explains?|explained)\b/gi,
    'Discourse language — narrative communication.', 0.45),
  rule(CATEGORY.OPINION, /\b(is (found|discovered|captured|arrested|killed|murdered|seen|heard|caught))\b/gi,
    'Passive narrative events — story development.', 0.5),
  rule(CATEGORY.OPINION, /\b(spends?|spent|wastes?|wasted|invests?|invested)\b/gi,
    'Resource allocation language — narrative action.', 0.45),
  rule(CATEGORY.OPINION, /\b(knows?|knew|thinks?|thought|believes?|believed)\b/gi,
    'Cognitive state language — character perspective.', 0.45),
  rule(CATEGORY.OPINION, /\b(loves?|loved|hates?|hated|likes?|liked|enjoys?|enjoyed|prefers?|preferred)\b/gi,
    'Preference/emotion language — subjective character state.', 0.5),
  rule(CATEGORY.OPINION, /\b(helps?|helped|supports?|supported|aids?|aided|assists?|assisted)\b/gi,
    'Support/assistance language — narrative action.', 0.45),
  rule(CATEGORY.OPINION, /\b(fights?|fought|battles?|battled|opposes?|opposed|resists?|resisted)\b/gi,
    'Conflict/resistance language — narrative tension.', 0.5),
  rule(CATEGORY.OPINION, /\b(leads?|led|guides?|guided|directs?|directed|controls?|controlled)\b/gi,
    'Leadership/guidance language — narrative roles.', 0.45),
  rule(CATEGORY.OPINION, /\b(lives?|lived)\b/gi,
    'Life narrative language — story context.', 0.35),

  rule(CATEGORY.OPINION, /\b(set in|takes? place (in|at)|located (in|at))\b/gi,
    'Setting specification — narrative context framing.', 0.45),
  rule(CATEGORY.OPINION, /\b(resorts? to|turns? to|relies? on|depends? on)\b/gi,
    'Dependency/recourse language — narrative choice under constraint.', 0.45),
  rule(CATEGORY.OPINION, /\b((his|her|their|its) (life|family|father|mother|son|daughter|friend|home|world|past))\b/gi,
    'Personal narrative elements — story character context.', 0.45),
  rule(CATEGORY.OPINION, /\b(after|before|when|while|during|until) (he|she|they|it)\b/gi,
    'Temporal narrative connectors with pronouns — story sequencing.', 0.4),

  rule(CATEGORY.OPINION, /\b(grew up|growing up|grew|raised (in|by)|born (in|into))\b/gi,
    'Origin/upbringing language — narrative backstory.', 0.5),
  rule(CATEGORY.OPINION, /\b(marries?|married|divorces?|divorced|weds?|wedded)\b/gi,
    'Relationship status change language — narrative life events.', 0.5),
  rule(CATEGORY.OPINION, /\b(dies?|died|death of|passes? away|passed away|kills?|killed)\b/gi,
    'Death/mortality language — narrative stakes.', 0.45),
  rule(CATEGORY.OPINION, /\b(falls? in love|fell in love|falling for)\b/gi,
    'Romance development language — narrative arc.', 0.5),
  rule(CATEGORY.OPINION, /\b(grew|moved|traveled|travelled|lived|worked|studied|taught|trained)\b/gi,
    'Past life activity verbs — narrative history.', 0.4),
  rule(CATEGORY.OPINION, /\b(befriends?|befriended|betrays?|betrayed|saves?|saved|rescues?|rescued)\b/gi,
    'Relationship action language — narrative interpersonal dynamics.', 0.5),
  rule(CATEGORY.OPINION, /\b(investigates?|investigated|solves?|solved|uncovers?|uncovered)\b/gi,
    'Investigation language — narrative mystery/discovery arc.', 0.5),
  rule(CATEGORY.OPINION, /\b(threatens?|threatened|attacks?|attacked|defends?|defended)\b/gi,
    'Threat/defense language — narrative conflict.', 0.5),
  rule(CATEGORY.OPINION, /\b(convinces?|convinced|persuades?|persuaded|tricks?|tricked|deceives?|deceived|manipulates?|manipulated)\b/gi,
    'Influence language — narrative social manipulation.', 0.5),
  rule(CATEGORY.OPINION, /\b(hides?|hid|hidden|conceals?|concealed|sneaks?|sneaked|sneaks?)\b/gi,
    'Concealment language — narrative secrecy.', 0.5),
  rule(CATEGORY.OPINION, /\b(confesses?|confessed|admits?|admitted|reveals? (that|the))\b/gi,
    'Revelation language — narrative disclosure.', 0.5),
  rule(CATEGORY.OPINION, /\b(promises?|promised|swears?|swore|vows?|vowed)\b/gi,
    'Commitment language — narrative pledge/oath.', 0.5),
  rule(CATEGORY.OPINION, /\b(abandons?|abandoned|deserts?|deserted|quits?|quit)\b/gi,
    'Abandonment language — narrative separation/loss.', 0.5),
  rule(CATEGORY.OPINION, /\b(travels?|traveled|journeys?|journeyed|ventures?|ventured)\b/gi,
    'Travel/journey language — narrative movement.', 0.5),
  rule(CATEGORY.OPINION, /\b(reunites?|reunited|returns? (home|to)|reuniting)\b/gi,
    'Reunion language — narrative return/restoration.', 0.5),
  rule(CATEGORY.OPINION, /\b(trapped|imprisoned|captured|confined|stuck|stranded)\b/gi,
    'Entrapment language — narrative constraint.', 0.5),
  rule(CATEGORY.OPINION, /\b(transforms?|transformed|changes?|changed)\b/gi,
    'Transformation language — narrative arc.', 0.45),
  rule(CATEGORY.OPINION, /\b(witnesses?|witnessed|watches?|watched|observes?|observed) (as|the|a|an|his|her|their)\b/gi,
    'Observational language with object — narrative POV.', 0.5),
  rule(CATEGORY.OPINION, /\b(struggles?|struggled|struggling (with|against|to))\b/gi,
    'Struggle language — narrative challenge.', 0.5),
  rule(CATEGORY.OPINION, /\b(seeks?|sought|searching for) (the|a|an|his|her|their)\b/gi,
    'Quest language with object — narrative goal.', 0.5),
  rule(CATEGORY.OPINION, /\b((he|she|they|it) (is|was|has been|becomes?) (a|an|the))\b/gi,
    'Pronoun-based character introduction — narrative framing.', 0.4),
  rule(CATEGORY.OPINION, /\b(agrees?|agreed|refuses?|refused|accepts?|accepted|rejects?|rejected)\b/gi,
    'Consent/refusal language — narrative decision points.', 0.5),
  rule(CATEGORY.OPINION, /\b(realizes?|realized|discovers?|discovered) (that|the|a|his|her)\b/gi,
    'Realization with object — narrative epiphany.', 0.5),
  rule(CATEGORY.OPINION, /\b(warns?|warned|reminds?|reminded|informs?|informed|notifies?|notified)\b/gi,
    'Communication of information language — narrative information transfer.', 0.5),
  rule(CATEGORY.OPINION, /\b(spends? (time|years|days|his|her|their))\b/gi,
    'Time expenditure with object — narrative temporal scope.', 0.5),
  rule(CATEGORY.OPINION, /\b((must|has to|have to|needs? to) (find|save|stop|escape|return|discover))\b/gi,
    'Narrative imperative with action — story stakes.', 0.55),

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
  rule(CATEGORY.LOADED, /\b(love|adore|hate|despise|loathe|cherish|treasure)\b/gi,
    'Strong emotive preference language indicating subjective stance.', 0.7),

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
