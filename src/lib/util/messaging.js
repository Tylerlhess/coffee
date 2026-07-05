/**
 * Message contract between content scripts / UI surfaces and the background
 * service worker. Using a single typed envelope keeps the protocol auditable.
 */

export const MSG = Object.freeze({
  ANALYZE: 'coffee:analyze',
  PING: 'coffee:ping',
  GET_CONFIG: 'coffee:getConfig',
  LIST_AGENTS: 'coffee:listAgents',
  SCAN_REQUEST: 'coffee:scanRequest', // background -> content (toolbar/menu)
});

/**
 * Send a message to the background worker and await its response.
 * Rejects if the worker reports an error so callers can use try/catch.
 */
export function sendToBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(new Error(err.message));
      if (response && response.ok === false) {
        return reject(new Error(response.error || 'Unknown background error'));
      }
      resolve(response ? response.data : undefined);
    });
  });
}

/** Send a message to a specific tab's content script. */
export function sendToTab(tabId, type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type, payload }, (response) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(new Error(err.message));
      resolve(response);
    });
  });
}

export function ok(data) {
  return { ok: true, data };
}

export function fail(error) {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}
