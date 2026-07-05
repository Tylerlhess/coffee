/**
 * In-page highlighter. Wraps detected phrases in <mark> elements without
 * destroying the page's event handlers, using a TreeWalker over text nodes.
 *
 * DOM module — content script only.
 */

import { CATEGORY } from './detectors.js';

const MARK_CLASS = 'coffee-mark';
const MARK_ATTR = 'data-coffee';

const CATEGORY_COLOR = {
  [CATEGORY.OPINION]: 'opinion',
  [CATEGORY.CERTAINTY]: 'certainty',
  [CATEGORY.GENERALIZATION]: 'generalization',
  [CATEGORY.PRESCRIPTIVE]: 'prescriptive',
  [CATEGORY.FALLACY]: 'fallacy',
  [CATEGORY.LOADED]: 'loaded',
};

/**
 * Highlight phrase occurrences inside a root element.
 * @param {{text:string, category:string, label:string, hint:string}[]} spans
 * @param {Element} [root=document.body]
 * @returns {number} count of marks created
 */
export function highlight(spans, root = document.body) {
  clearHighlights(root);
  if (!spans?.length) return 0;

  // Build one case-insensitive regex of all distinct phrases (longest first so
  // overlapping phrases prefer the more specific match).
  const byPhrase = new Map();
  for (const s of spans) {
    const key = s.text.toLowerCase();
    if (!byPhrase.has(key)) byPhrase.set(key, s);
  }
  const phrases = [...byPhrase.keys()].sort((a, b) => b.length - a.length);
  if (phrases.length === 0) return 0;

  const re = new RegExp('(' + phrases.map(escapeRe).join('|') + ')', 'gi');

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || p.isContentEditable) {
        return NodeFilter.FILTER_REJECT;
      }
      if (p.closest(`.${MARK_CLASS}`)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);

  let count = 0;
  for (const node of targets) {
    count += wrapMatches(node, re, byPhrase);
  }
  return count;
}

function wrapMatches(textNode, re, byPhrase) {
  const text = textNode.nodeValue;
  re.lastIndex = 0;
  if (!re.test(text)) return 0;
  re.lastIndex = 0;

  const frag = document.createDocumentFragment();
  let last = 0;
  let m;
  let made = 0;
  while ((m = re.exec(text)) !== null) {
    const matched = m[0];
    if (m.index > last) {
      frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    }
    const span = byPhrase.get(matched.toLowerCase());
    const mark = document.createElement('mark');
    mark.className = MARK_CLASS;
    mark.setAttribute(MARK_ATTR, CATEGORY_COLOR[span?.category] || 'opinion');
    mark.title = `${span?.label || 'Flagged'} — ${span?.hint || ''}`;
    mark.textContent = matched;
    frag.appendChild(mark);
    last = m.index + matched.length;
    made++;
    if (matched.length === 0) re.lastIndex++; // safety
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  if (made > 0) textNode.parentNode.replaceChild(frag, textNode);
  return made;
}

/** Remove all Coffee marks, restoring original text nodes. */
export function clearHighlights(root = document.body) {
  const marks = root.querySelectorAll(`.${MARK_CLASS}`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
  return marks.length;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
