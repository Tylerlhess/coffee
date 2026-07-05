/**
 * OpenAI-compatible Chat Completions client.
 *
 * Works with any endpoint that implements POST {baseUrl}/chat/completions with
 * the standard request/response shape (OpenAI, Azure, Groq, Together, OpenRouter,
 * local servers like llama.cpp / Ollama's OpenAI shim, ...).
 */

import { parseModelJson } from './json.js';

const REQUEST_TIMEOUT_MS = 60_000;

/**
 * @param {object} cfg config.openai
 * @param {Array} messages chat messages
 * @param {object} opts { schema, signal }
 * @returns {Promise<{ data: object, raw: string, usage?: object }>}
 */
export async function chatJson(cfg, messages, opts = {}) {
  if (!cfg.apiKey) throw new Error('No OpenAI API key configured. Open Coffee settings.');
  const url = joinUrl(cfg.baseUrl, '/chat/completions');

  const body = {
    model: cfg.model,
    messages,
    temperature: cfg.temperature ?? 0.2,
  };
  if (cfg.useJsonResponseFormat) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (opts.signal) opts.signal.addEventListener('abort', () => controller.abort());

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    throw new Error(`Network error contacting ${url}: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`OpenAI API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '';
  return {
    data: parseModelJson(content),
    raw: content,
    usage: json.usage,
    model: json.model,
  };
}

/** Lightweight connectivity check used by the options page "Test" button. */
export async function ping(cfg) {
  const url = joinUrl(cfg.baseUrl, '/models');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

function joinUrl(base, path) {
  return base.replace(/\/+$/, '') + path;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
