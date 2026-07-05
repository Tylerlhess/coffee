/**
 * Fluff stripping & normalization.
 *
 * Goal: shrink an article or message thread down to its load-bearing claims
 * before it is sent to an LLM. This reduces tokens/cost and improves signal by
 * removing boilerplate, navigation chrome, calls-to-action, and decoration.
 *
 * Pure module — safe in worker and content script.
 */

// Lines that are almost always non-content chrome.
const BOILERPLATE_LINE = [
  /^\s*(share|tweet|reply|retweet|like|follow|subscribe|sign up|log in|read more|continue reading)\b/i,
  /^\s*(advertisement|sponsored|promoted|related articles?|recommended for you|trending|most read)\b/i,
  /^\s*(cookie|privacy policy|terms of service|all rights reserved|©|copyright)\b/i,
  /^\s*(click here|tap here|learn more|see more|show (more|less))\b/i,
  /^\s*\d+\s*(comments?|likes?|shares?|views?|reposts?)\s*$/i,
  /^\s*(home|menu|search|settings|notifications)\s*$/i,
];

// Phrases removed inline (filler that adds words but not claims).
const FILLER_PHRASE = [
  /\bas we all know\b/gi,
  /\bneedless to say\b/gi,
  /\bat the end of the day\b/gi,
  /\bwhen all is said and done\b/gi,
  /\bit goes without saying\b/gi,
  /\bin today'?s (day and age|world)\b/gi,
  /\bin this (article|post|thread|piece),?\b/gi,
  /\bwithout further ado\b/gi,
];

const URL_RE = /\bhttps?:\/\/\S+/gi;
const HANDLE_RE = /(^|\s)@[A-Za-z0-9_]{2,30}/g; // keep leading space
const HASHTAG_RE = /(^|\s)#[\p{L}0-9_]+/gu;
// Strip most emoji / pictographs / symbols.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️‍]/gu;

/**
 * @param {string} input
 * @param {object} opts
 * @param {boolean} [opts.keepHandles=true] keep @handles (useful for X threads)
 * @param {boolean} [opts.keepHashtags=false]
 * @returns {string}
 */
export function stripFluff(input, opts = {}) {
  const { keepHandles = true, keepHashtags = false } = opts;
  if (!input) return '';

  let text = String(input).replace(/\r\n?/g, '\n');

  // Drop markdown image/link syntax but keep link text.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Strip markdown emphasis / headings / blockquote / code fences markers.
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/[*_`>#]+/g, '');

  text = text.replace(URL_RE, '');
  text = text.replace(EMOJI_RE, '');
  if (!keepHandles) text = text.replace(HANDLE_RE, '$1');
  if (!keepHashtags) text = text.replace(HASHTAG_RE, '$1');

  for (const re of FILLER_PHRASE) text = text.replace(re, '');

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !BOILERPLATE_LINE.some((re) => re.test(l)))
    // Drop ultra-short fragments that are usually UI labels, keep real sentences.
    .filter((l) => l.length > 2);

  // Collapse repeated whitespace and tidy edges left by inline removals
  // (e.g. a dangling comma where a filler phrase used to be).
  const cleaned = lines
    .map((l) => l.replace(/\s{2,}/g, ' ').replace(/^[\s,;:–—-]+/, '').trim())
    .filter((l) => l.length > 2)
    .map((l) => l.charAt(0).toUpperCase() + l.slice(1));

  return dedupeAdjacent(cleaned).join('\n').trim();
}

/** Remove consecutive duplicate lines (common in scraped threads). */
function dedupeAdjacent(lines) {
  const out = [];
  for (const l of lines) {
    if (out[out.length - 1] !== l) out.push(l);
  }
  return out;
}

/** Truncate on a sentence boundary near `maxChars`, never mid-word. */
export function truncate(text, maxChars) {
  if (!text || text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastStop = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('\n'),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  );
  const cut = lastStop > maxChars * 0.6 ? lastStop + 1 : slice.lastIndexOf(' ');
  return slice.slice(0, cut > 0 ? cut : maxChars).trim() + ' …[truncated]';
}
