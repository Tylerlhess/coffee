/**
 * Content extraction with pluggable site adapters.
 *
 * Adapters turn a live DOM into structured `segments` (article paragraphs or
 * thread messages) plus metadata. The X/Twitter adapter understands the
 * conversation-feed structure; the generic adapter falls back to a readability-
 * style main-content heuristic. Adding a new site = add one adapter object.
 *
 * This module touches the DOM, so it only runs in the content script.
 */

/** @typedef {{ author?: string, text: string, kind: 'article'|'message' }} Segment */

const X_HOSTS = ['twitter.com', 'x.com', 'mobile.twitter.com'];

/** X / Twitter conversation adapter. */
const xAdapter = {
  id: 'x',
  matches: (host) => X_HOSTS.some((h) => host === h || host.endsWith('.' + h)),
  extract() {
    const articles = Array.from(document.querySelectorAll('article[role="article"]'));
    const segments = [];
    for (const a of articles) {
      const textEl = a.querySelector('[data-testid="tweetText"]') || a;
      const text = (textEl.innerText || '').trim();
      if (!text) continue;
      const authorEl = a.querySelector('[data-testid="User-Name"]');
      const author = authorEl ? authorEl.innerText.split('\n')[0] : undefined;
      segments.push({ author, text, kind: 'message', el: a });
    }
    return {
      source: 'x',
      title: document.title,
      url: location.href,
      segments,
      /** X-specific affordance: a question the user could ask Grok in-thread. */
      grokCapable: true,
    };
  },
};

/** Generic article adapter (readability-lite). */
const genericAdapter = {
  id: 'generic',
  matches: () => true,
  extract() {
    const root = pickMainContent();
    const blocks = Array.from(
      root.querySelectorAll('p, li, blockquote, h1, h2, h3'),
    )
      .map((el) => ({ el, text: (el.innerText || '').trim() }))
      .filter((b) => b.text.length >= 25 && !isLikelyChrome(b.el));

    const segments = blocks.map((b) => ({ text: b.text, kind: 'article', el: b.el }));
    return {
      source: 'article',
      title: extractTitle(),
      url: location.href,
      segments,
      grokCapable: false,
    };
  },
};

const ADAPTERS = [xAdapter, genericAdapter];

/** Choose the first matching adapter for the current page. */
export function getAdapter(host = location.hostname) {
  return ADAPTERS.find((a) => a.matches(host)) || genericAdapter;
}

/** Extract structured content from the current page. */
export function extractPage() {
  return getAdapter().extract();
}

/**
 * Flatten an extraction result into a single LLM-ready string, preserving
 * authorship for threads so the model can attribute claims.
 */
export function segmentsToText(extraction, { maxSegments = 60 } = {}) {
  const segs = extraction.segments.slice(0, maxSegments);
  return segs
    .map((s) => (s.author ? `${s.author}: ${s.text}` : s.text))
    .join('\n\n');
}

// --- helpers -------------------------------------------------------------

function pickMainContent() {
  const candidates = [
    document.querySelector('main'),
    document.querySelector('article'),
    document.querySelector('[role="main"]'),
    document.querySelector('#content, .content, .post, .article-body'),
  ].filter(Boolean);

  if (candidates.length) {
    // Prefer the candidate with the most paragraph text.
    return candidates.sort(
      (a, b) => textLen(b) - textLen(a),
    )[0];
  }
  return document.body;
}

function textLen(el) {
  return (el.innerText || '').length;
}

function isLikelyChrome(el) {
  const cls = (el.className || '').toString().toLowerCase();
  const inNav = el.closest('nav, header, footer, aside, [role="navigation"]');
  return !!inNav || /(nav|menu|footer|header|sidebar|comment-meta|byline)/.test(cls);
}

function extractTitle() {
  const og = document.querySelector('meta[property="og:title"]');
  if (og && og.content) return og.content;
  const h1 = document.querySelector('h1');
  return (h1 && h1.innerText.trim()) || document.title;
}
