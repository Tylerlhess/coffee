/**
 * Popup: quick actions + agent status. It does not touch the network itself —
 * it asks the active tab's content script to act, and reads redacted config /
 * agent list from the background worker.
 */

import { sendToBackground } from '../../lib/util/messaging.js';
import { MSG } from '../../lib/util/messaging.js';

const $ = (id) => document.getElementById(id);

init();

async function init() {
  wireActions();
  await Promise.all([loadProvider(), loadAgents()]);
}

function wireActions() {
  $('analyze').addEventListener('click', () => requestScan('analyze'));
  $('scan').addEventListener('click', () => requestScan('scan'));
  $('clear').addEventListener('click', () => requestScan('clear'));
  $('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
}

async function loadProvider() {
  try {
    const config = await sendToBackground(MSG.GET_CONFIG);
    const label = config.provider === 'mcp' ? 'MCP' : 'OpenAI';
    $('provider').textContent = label;
    const configured =
      config.provider === 'mcp' ? !!config.mcp.endpoint : !!config.openai.apiKey;
    if (!configured) {
      setStatus('No provider configured — open Settings.', 'error');
    }
  } catch (e) {
    $('provider').textContent = '—';
  }
}

async function loadAgents() {
  try {
    const agents = await sendToBackground(MSG.LIST_AGENTS);
    const ul = $('agent-list');
    ul.innerHTML = '';
    for (const a of agents) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="dot ${a.enabled ? 'on' : ''}"></span>
        <span>${escapeHtml(a.label)}</span>
        ${a.experimental ? '<span class="badge">beta</span>' : ''}`;
      ul.appendChild(li);
    }
  } catch {
    $('agent-list').innerHTML = '<li class="muted">Could not load agents.</li>';
  }
}

async function requestScan(mode) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    if (mode === 'clear') {
      // Re-inject a tiny clear call via the content script message path.
      await chrome.tabs.sendMessage(tab.id, { type: MSG.SCAN_REQUEST, payload: { mode: 'scan' } });
      setStatus('Re-scanned. Use Analyze for the LLM pass.', 'ok');
      window.close();
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: MSG.SCAN_REQUEST, payload: { mode } });
    window.close();
  } catch (e) {
    setStatus('Open a normal web page first (not a browser page).', 'error');
  }
}

function setStatus(msg, kind = '') {
  const el = $('status');
  el.textContent = msg;
  el.className = `status ${kind}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}
