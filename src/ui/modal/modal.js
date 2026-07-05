/**
 * Response modal, rendered inside a shadow root so the host page's CSS can
 * neither style nor be styled by it. Presents the analysis as tabbed sections:
 * Summary, Claims, Fallacies, and Questions (with an "Ask" affordance that the
 * content script can route to Grok / an LLM).
 */

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'claims', label: 'Claims', countKey: 'claims' },
  { id: 'fallacies', label: 'Fallacies', countKey: 'fallacies' },
  { id: 'questions', label: 'Questions', countKey: 'questions' },
];

export class DiscernModal {
  constructor({ onAsk } = {}) {
    this.onAsk = onAsk || (() => {});
    this.host = null;
    this.root = null;
    this.result = null;
  }

  async _ensureMounted() {
    if (this.host) return;
    this.host = document.createElement('div');
    this.host.id = 'discern-modal-host';
    this.host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483646;';
    this.root = this.host.attachShadow({ mode: 'open' });

    const cssUrl = chrome.runtime.getURL('src/ui/modal/modal.css');
    const css = await fetch(cssUrl).then((r) => r.text());
    const style = document.createElement('style');
    style.textContent = css;
    this.root.appendChild(style);

    this.container = document.createElement('div');
    this.root.appendChild(this.container);
    document.documentElement.appendChild(this.host);
  }

  async showLoading(label = 'Analyzing…') {
    await this._ensureMounted();
    this.container.innerHTML = shell(`
      <div class="loading">
        <div class="spinner"></div>
        <div>${esc(label)}</div>
      </div>`);
    this._wireChrome();
  }

  async showError(message) {
    await this._ensureMounted();
    this.container.innerHTML = shell(`<div class="error">⚠ ${esc(message)}</div>`);
    this._wireChrome();
  }

  async showResult(result) {
    await this._ensureMounted();
    this.result = result;
    this.container.innerHTML = shell(renderTabs(result) + renderViews(result), result);
    this._wireChrome();
    this._wireTabs();
    this._wireAsk();
    this._wireCopy();
  }

  close() {
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.root = null;
    }
  }

  // --- wiring ---
  _q(sel) {
    return this.root.querySelector(sel);
  }
  _qa(sel) {
    return [...this.root.querySelectorAll(sel)];
  }

  _wireChrome() {
    const close = this._q('.close');
    if (close) close.addEventListener('click', () => this.close());
    const backdrop = this._q('.backdrop');
    if (backdrop)
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    document.addEventListener('keydown', this._onKey = (e) => {
      if (e.key === 'Escape') this.close();
    }, { once: true });
  }

  _wireTabs() {
    this._qa('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this._qa('.tab').forEach((t) => t.setAttribute('aria-selected', 'false'));
        this._qa('.panelview').forEach((p) => p.classList.remove('active'));
        tab.setAttribute('aria-selected', 'true');
        const view = this._q(`#view-${tab.dataset.tab}`);
        if (view) view.classList.add('active');
      });
    });
  }

  _wireAsk() {
    this._qa('button.ask').forEach((btn) => {
      btn.addEventListener('click', () => this.onAsk(btn.dataset.question));
    });
  }

  _wireCopy() {
    const btn = this._q('button.copy');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(JSON.stringify(this.result, null, 2));
      btn.textContent = 'Copied ✓';
      setTimeout(() => (btn.textContent = 'Copy JSON'), 1500);
    });
  }
}

// --- rendering helpers ---------------------------------------------------

function shell(inner, result) {
  const meta = result?.transport
    ? `${result.transport.transport}${result.transport.model ? ' · ' + result.transport.model : ''}${
        result.elapsedMs ? ' · ' + result.elapsedMs + 'ms' : ''
      }`
    : '';
  return `
  <div class="backdrop">
    <div class="panel" role="dialog" aria-label="Discern analysis">
      <div class="header">
        <span class="logo">🔍</span>
        <span class="title">Discern</span>
        <span class="spacer"></span>
        <span class="meta">${esc(meta)}</span>
        <button class="close" aria-label="Close">×</button>
      </div>
      ${inner}
      ${
        result
          ? `<div class="footer"><button class="copy">Copy JSON</button><span>Heuristic flags: ${
              result.localFindings?.stats?.total ?? 0
            }</span></div>`
          : ''
      }
    </div>
  </div>`;
}

function renderTabs(result) {
  const counts = {
    claims: result.claims?.length || 0,
    fallacies: result.fallacies?.length || 0,
    questions: result.questions?.length || 0,
  };
  return `<div class="tabs" role="tablist">${TABS.map(
    (t, i) =>
      `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${i === 0}">${esc(
        t.label,
      )}${t.countKey ? `<span class="count">${counts[t.countKey]}</span>` : ''}</button>`,
  ).join('')}</div>`;
}

function renderViews(result) {
  return `<div class="body">
    <div class="panelview active" id="view-summary">${renderSummary(result)}</div>
    <div class="panelview" id="view-claims">${renderClaims(result.claims)}</div>
    <div class="panelview" id="view-fallacies">${renderFallacies(result.fallacies)}</div>
    <div class="panelview" id="view-questions">${renderQuestions(result.questions, result.meta)}</div>
  </div>`;
}

function renderSummary(result) {
  const s = result.summary
    ? `<p class="summary">${esc(result.summary)}</p>`
    : `<p class="empty">No summary returned.</p>`;
  const stats = result.localFindings?.stats;
  const chips = stats
    ? `<div>${Object.entries(stats.byCategory || {})
        .map(([k, v]) => `<span class="pill">${esc(k)} · ${v}</span>`)
        .join(' ')}</div>`
    : '';
  return s + chips;
}

function renderClaims(claims) {
  if (!claims?.length) return `<p class="empty">No claims extracted.</p>`;
  return claims
    .map((c) => {
      const type = (c.type || 'unverified').toLowerCase();
      const conf = typeof c.confidence === 'number' ? ` · ${Math.round(c.confidence * 100)}%` : '';
      return `<div class="card">
        <span class="pill ${esc(type)}">${esc(type)}${conf}</span>
        <p class="claimtext">${esc(c.text || '')}</p>
        ${c.rationale ? `<p class="rationale">${esc(c.rationale)}</p>` : ''}
        ${
          c.suggestedInvestigation
            ? `<p class="investigate"><b>Investigate:</b> ${esc(c.suggestedInvestigation)}</p>`
            : ''
        }
      </div>`;
    })
    .join('');
}

function renderFallacies(fallacies) {
  if (!fallacies?.length) return `<p class="empty">No logical fallacies detected.</p>`;
  return fallacies
    .map(
      (f) => `<div class="card fallacy">
        <span class="sev">${esc((f.severity || '').toUpperCase())}</span>
        <div class="name">${esc(f.name || 'Fallacy')}</div>
        ${f.excerpt ? `<div class="excerpt">“${esc(f.excerpt)}”</div>` : ''}
        <p class="rationale">${esc(f.explanation || '')}</p>
      </div>`,
    )
    .join('');
}

function renderQuestions(questions, meta) {
  if (!questions?.length) return `<p class="empty">No follow-up questions suggested.</p>`;
  const askLabel = meta?.source === 'x' ? 'Ask Grok' : 'Ask';
  return questions
    .map(
      (q) => `<div class="qitem"><span>${esc(q)}</span>
        <button class="ask" data-question="${esc(q)}">${askLabel}</button></div>`,
    )
    .join('');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}
