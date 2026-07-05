/**
 * Default configuration for the Discern extension.
 *
 * The config is intentionally provider-agnostic. Two transport standards are
 * supported out of the box:
 *   - `openai`: any OpenAI-compatible Chat Completions endpoint
 *               (OpenAI, Azure OpenAI, Groq, Together, local llama.cpp, etc.)
 *   - `mcp`:    a Model Context Protocol server exposing an analysis tool
 *               over the Streamable HTTP transport (JSON-RPC 2.0).
 *
 * Secrets (API keys) live in chrome.storage.local and never touch page context.
 */

export const SENSITIVITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
});

export const PROVIDER = Object.freeze({
  OPENAI: 'openai',
  MCP: 'mcp',
});

export const DEFAULT_CONFIG = Object.freeze({
  /** Active provider: 'openai' | 'mcp'. */
  provider: PROVIDER.OPENAI,

  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.2,
    /** Some gateways reject response_format; toggle off if needed. */
    useJsonResponseFormat: true,
  },

  mcp: {
    /** Streamable HTTP endpoint of the MCP server, e.g. https://host/mcp */
    endpoint: '',
    apiKey: '',
    /** Tool the server exposes that performs the analysis. */
    toolName: 'analyze_text',
    /** Optional protocol version negotiated at initialize. */
    protocolVersion: '2025-06-18',
  },

  detection: {
    /** Auto-scan and highlight when a page finishes loading. */
    highlightOnLoad: false,
    /** Controls how aggressively the pattern matcher fires. */
    sensitivity: SENSITIVITY.MEDIUM,
    /** Show the floating toolbar button on pages. */
    showToolbar: true,
  },

  analysis: {
    detectFallacies: true,
    detectOpinionAsFact: true,
    suggestQuestions: true,
    /** Hard cap on characters sent to the model after fluff-stripping. */
    maxChars: 12000,
  },

  /**
   * Agent registry toggles. The system is designed so new agents
   * (research, fact-check, source-finder, ...) can be registered without
   * touching the transport or UI layers.
   */
  agents: {
    analyze: true,
    research: false,
    factcheck: false,
  },

  ui: {
    theme: 'auto', // 'auto' | 'light' | 'dark'
  },

  version: 1,
});

/** Deep-merge stored config over defaults so new keys appear after upgrades. */
export function withDefaults(stored) {
  return mergeDeep(structuredClone(DEFAULT_CONFIG), stored || {});
}

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (isObject(target[key]) && isObject(source[key])) {
      mergeDeep(target[key], source[key]);
    } else if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
}
