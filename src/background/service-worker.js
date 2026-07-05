/**
 * Background service worker — the only place that holds API keys and talks to
 * the network. Content scripts and UI surfaces ask it to run agents via
 * message passing; secrets never enter page context.
 */

import { getConfig } from '../lib/config/store.js';
import { MSG, ok, fail } from '../lib/util/messaging.js';
import { getAgent, listAgents } from '../lib/agents/registry.js';
import { testProvider } from '../lib/api/provider.js';
import { log } from '../lib/util/logger.js';

const CONTEXT_MENU_ID = 'coffee-analyze-selection';

// --- lifecycle -----------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Coffee: analyze selection',
    contexts: ['selection'],
  });
  log.info('installed');
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    // Ask the content script to analyze the current selection and show the modal.
    chrome.tabs.sendMessage(tab.id, {
      type: MSG.SCAN_REQUEST,
      payload: { mode: 'selection', text: info.selectionText || '' },
    });
  }
});

chrome.action.onClicked?.addListener?.(() => {
  // Popup is the default action; nothing to do here. Kept for clarity.
});

// --- message router ------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handle(message)
    .then((data) => sendResponse(ok(data)))
    .catch((err) => {
      log.error(message?.type, err);
      sendResponse(fail(err));
    });
  return true; // keep the channel open for async response
});

async function handle(message) {
  const { type, payload = {} } = message || {};
  switch (type) {
    case MSG.PING:
      return { pong: true, ts: Date.now() };

    case MSG.GET_CONFIG: {
      const config = await getConfig();
      // Never leak secrets to page-context callers; redact keys.
      return redact(config);
    }

    case MSG.LIST_AGENTS: {
      const config = await getConfig();
      return listAgents(config);
    }

    case MSG.ANALYZE:
      return runAgent(payload);

    case 'coffee:testProvider': {
      // Called from the options page (extension context), config passed inline.
      return testProvider(payload.config);
    }

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

/**
 * Run a named agent. Defaults to the analyze agent.
 * @param {{ agentId?: string, text: string, meta?: object, claims?: Array }} payload
 */
async function runAgent(payload) {
  const config = await getConfig();
  const agentId = payload.agentId || 'analyze';
  const agent = getAgent(agentId);
  if (!agent) throw new Error(`No such agent: ${agentId}`);

  if (agentId === 'analyze' && (!payload.text || payload.text.trim().length < 20)) {
    throw new Error('Not enough text to analyze. Select more, or open a fuller page.');
  }

  return agent.run(payload, { config });
}

function redact(config) {
  const clone = structuredClone(config);
  if (clone.openai) clone.openai.apiKey = clone.openai.apiKey ? '••••••' : '';
  if (clone.mcp) clone.mcp.apiKey = clone.mcp.apiKey ? '••••••' : '';
  return clone;
}
