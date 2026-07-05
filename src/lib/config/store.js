/**
 * Promise-based wrapper over chrome.storage.local for reading/writing config.
 * Centralizes the single source of truth so every surface (background, content,
 * popup, options) reads the same merged-with-defaults shape.
 */

import { withDefaults, DEFAULT_CONFIG } from './defaults.js';

const STORAGE_KEY = 'coffee.config';

export async function getConfig() {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  return withDefaults(raw[STORAGE_KEY]);
}

export async function setConfig(partialOrFull) {
  const current = await getConfig();
  const next = withDefaults({ ...current, ...partialOrFull });
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

/** Replace the entire config (used by the options page Save button). */
export async function replaceConfig(fullConfig) {
  const next = withDefaults(fullConfig);
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export async function resetConfig() {
  await chrome.storage.local.set({ [STORAGE_KEY]: structuredClone(DEFAULT_CONFIG) });
  return structuredClone(DEFAULT_CONFIG);
}

/** Subscribe to config changes. Returns an unsubscribe function. */
export function onConfigChanged(callback) {
  const listener = (changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
      callback(withDefaults(changes[STORAGE_KEY].newValue));
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
