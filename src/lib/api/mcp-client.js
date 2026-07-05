/**
 * Minimal Model Context Protocol (MCP) client over the Streamable HTTP transport.
 *
 * Implements just enough of the spec to call a tool:
 *   1. POST `initialize`        (JSON-RPC 2.0)
 *   2. POST `notifications/initialized`
 *   3. POST `tools/call`        -> tool result
 *
 * Handles both `application/json` and `text/event-stream` responses, and the
 * `Mcp-Session-Id` header the server may assign at initialize time.
 *
 * Spec: https://modelcontextprotocol.io (Streamable HTTP transport, JSON-RPC 2.0)
 */

import { parseModelJson } from './json.js';

const REQUEST_TIMEOUT_MS = 60_000;

export class McpClient {
  constructor(cfg) {
    this.endpoint = cfg.endpoint;
    this.apiKey = cfg.apiKey;
    this.protocolVersion = cfg.protocolVersion || '2025-06-18';
    this.sessionId = null;
    this._id = 0;
  }

  _headers() {
    const h = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': this.protocolVersion,
    };
    if (this.apiKey) h.Authorization = `Bearer ${this.apiKey}`;
    if (this.sessionId) h['Mcp-Session-Id'] = this.sessionId;
    return h;
  }

  async _rpc(method, params, { notification = false } = {}) {
    if (!this.endpoint) throw new Error('No MCP endpoint configured. Open Coffee settings.');
    const payload = { jsonrpc: '2.0', method };
    if (params !== undefined) payload.params = params;
    if (!notification) payload.id = ++this._id;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res;
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (e) {
      throw new Error(`Network error contacting MCP server: ${e.message}`);
    } finally {
      clearTimeout(timer);
    }

    const assignedSession = res.headers.get('Mcp-Session-Id');
    if (assignedSession) this.sessionId = assignedSession;

    if (notification) return undefined; // 202 Accepted, no body expected
    if (!res.ok) {
      throw new Error(`MCP ${method} HTTP ${res.status}: ${(await safeText(res)).slice(0, 300)}`);
    }

    const message = await readJsonRpc(res);
    if (message.error) {
      throw new Error(`MCP ${method} error ${message.error.code}: ${message.error.message}`);
    }
    return message.result;
  }

  async initialize() {
    const result = await this._rpc('initialize', {
      protocolVersion: this.protocolVersion,
      capabilities: { tools: {} },
      clientInfo: { name: 'Coffee', version: '0.1.0' },
    });
    await this._rpc('notifications/initialized', undefined, { notification: true });
    return result;
  }

  async listTools() {
    const result = await this._rpc('tools/list', {});
    return result?.tools || [];
  }

  /**
   * Call a tool and coerce its result into a parsed JSON object.
   * MCP tool results carry a `content` array; we look for structured/text JSON.
   */
  async callTool(name, args) {
    const result = await this._rpc('tools/call', { name, arguments: args });
    if (result?.isError) {
      const msg = textFromContent(result.content) || 'tool reported an error';
      throw new Error(`MCP tool "${name}" failed: ${msg}`);
    }
    // Prefer the spec's structuredContent if present.
    if (result?.structuredContent && typeof result.structuredContent === 'object') {
      return { data: result.structuredContent, raw: JSON.stringify(result.structuredContent) };
    }
    const text = textFromContent(result?.content);
    return { data: parseModelJson(text), raw: text };
  }
}

/** Read either a plain JSON body or the final data: line of an SSE stream. */
async function readJsonRpc(res) {
  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('text/event-stream')) {
    const body = await res.text();
    const dataLines = body
      .split(/\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .filter(Boolean);
    // The response we care about is the last JSON-RPC message in the stream.
    for (let i = dataLines.length - 1; i >= 0; i--) {
      try {
        const msg = JSON.parse(dataLines[i]);
        if (msg.jsonrpc) return msg;
      } catch {
        /* skip non-JSON keepalive lines */
      }
    }
    throw new Error('No JSON-RPC message found in SSE response.');
  }
  return res.json();
}

function textFromContent(content) {
  if (!Array.isArray(content)) return '';
  return content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n');
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
