/**
 * Content script (classic, injected at document_idle).
 *
 * Responsibilities:
 *   - Inject a small floating toolbar with Scan / Analyze actions.
 *   - Extract page or thread content via the appropriate site adapter.
 *   - Run the local heuristic to highlight argumentative spans instantly.
 *   - Ask the background worker to run the analysis agent (network/keys live
 *     there, not here) and render the response modal.
 *   - Route "Ask Grok / Ask" actions back into the page (X reply box) or
 *     clipboard fallback.
 *
 * Heavy logic lives in ES modules loaded dynamically (content scripts cannot be
 * declared as modules in MV3), keeping this file as a thin orchestrator and
 * avoiding code duplication with the background worker.
 */

(async function main() {
  const u = (p) => chrome.runtime.getURL(p);

  // Dynamically import shared modules (all listed in web_accessible_resources).
  const [{ extractPage, segmentsToText, getAdapter }, { detect }, highlighter, { CoffeeModal }] =
    await Promise.all([
      import(u('src/lib/text/extractor.js')),
      import(u('src/lib/text/detectors.js')),
      import(u('src/lib/text/highlighter.js')),
      import(u('src/ui/modal/modal.js')),
    ]);

  const MSG = {
    ANALYZE: 'coffee:analyze',
    GET_CONFIG: 'coffee:getConfig',
    SCAN_REQUEST: 'coffee:scanRequest',
  };

  const send = (type, payload = {}) =>
    new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, payload }, (res) => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        if (res && res.ok === false) return reject(new Error(res.error));
        resolve(res ? res.data : undefined);
      });
    });

  const modal = new CoffeeModal({ onAsk: handleAsk });
  let config = null;
  try {
    config = await send(MSG.GET_CONFIG);
  } catch {
    config = { detection: { sensitivity: 'medium', showToolbar: true, highlightOnLoad: false } };
  }

  // --- toolbar ---
  if (config.detection?.showToolbar) injectToolbar();
  if (config.detection?.highlightOnLoad) scanAndHighlight();

  // --- background-initiated requests (context menu / popup) ---
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === MSG.SCAN_REQUEST) {
      const { mode, text } = message.payload || {};
      if (mode === 'selection') analyze(text || getSelectionText(), 'selection');
      else if (mode === 'scan') scanAndHighlight();
      else analyzePage();
    }
  });

  // --- actions -------------------------------------------------------------

  function injectToolbar() {
    if (document.getElementById('coffee-toolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'coffee-toolbar';
    bar.innerHTML = `
      <button data-act="scan" title="Highlight argumentative language on this page">🔍 Scan</button>
      <button data-act="analyze" title="Send page to the LLM analyzer">⚖️ Analyze</button>`;
    bar.addEventListener('click', (e) => {
      const act = e.target?.dataset?.act;
      if (act === 'scan') scanAndHighlight();
      if (act === 'analyze') analyzePage();
    });
    document.documentElement.appendChild(bar);
  }

  function scanAndHighlight() {
    const extraction = extractPage();
    const text = segmentsToText(extraction);
    const { spans, stats } = detect(text, { sensitivity: config.detection?.sensitivity || 'medium' });
    const count = highlighter.highlight(spans, document.body);
    toast(`Highlighted ${count} phrase${count === 1 ? '' : 's'} across ${stats.total} flag${stats.total === 1 ? '' : 's'}.`);
  }

  async function analyzePage() {
    const extraction = extractPage();
    const text = segmentsToText(extraction);
    await analyze(text, extraction.source, { title: extraction.title, grokCapable: extraction.grokCapable });
  }

  async function analyze(text, source, extra = {}) {
    if (!text || text.trim().length < 20) {
      modal.showError('Not enough text to analyze. Try selecting a paragraph or opening a fuller page.');
      return;
    }
    const meta = { source: source || 'article', title: extra.title, ...extra };
    await modal.showLoading('Stripping fluff and querying the model…');
    try {
      const result = await send(MSG.ANALYZE, { agentId: 'analyze', text, meta });
      await modal.showResult(result);
    } catch (e) {
      await modal.showError(e.message || String(e));
    }
  }

  // --- "Ask Grok / Ask" routing -------------------------------------------

  function handleAsk(question) {
    const adapter = getAdapter();
    if (adapter.id === 'x' && fillXReply(question)) {
      modal.close();
      toast('Question dropped into the reply box — tag @grok and send.');
      return;
    }
    navigator.clipboard.writeText(question).then(
      () => toast('Question copied to clipboard.'),
      () => toast('Could not copy question.'),
    );
  }

  /** Best-effort: place a Grok-directed question into X's reply composer. */
  function fillXReply(question) {
    const box = document.querySelector('[data-testid^="tweetTextarea"], div[role="textbox"][contenteditable="true"]');
    if (!box) return false;
    box.focus();
    const text = `@grok ${question}`;
    // execCommand still works in contenteditable across Chromium; fall back to textContent.
    const inserted = document.execCommand && document.execCommand('insertText', false, text);
    if (!inserted) box.textContent = text;
    box.dispatchEvent(new InputEvent('input', { bubbles: true }));
    return true;
  }

  // --- utilities -----------------------------------------------------------

  function getSelectionText() {
    return (window.getSelection && window.getSelection().toString()) || '';
  }

  function toast(message) {
    let t = document.getElementById('coffee-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'coffee-toast';
      document.documentElement.appendChild(t);
    }
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove('show'), 3200);
  }
})();
