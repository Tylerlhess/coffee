/**
 * Provider abstraction. Hides whether a request is fulfilled by an
 * OpenAI-compatible endpoint or an MCP server behind a single `runAnalysis`.
 *
 * Agents depend on this interface, not on a concrete transport — so a future
 * research/fact-check agent can reuse exactly the same plumbing.
 */

import { PROVIDER } from '../config/defaults.js';
import { chatJson } from './openai-client.js';
import { McpClient } from './mcp-client.js';

/**
 * @param {object} config full merged config
 * @param {{messages: Array, schema: object, cleaned: string}} request
 * @returns {Promise<{ data: object, raw: string, meta: object }>}
 */
export async function runAnalysis(config, request) {
  if (config.provider === PROVIDER.MCP) {
    return runViaMcp(config, request);
  }
  return runViaOpenAI(config, request);
}

async function runViaOpenAI(config, request) {
  const out = await chatJson(config.openai, request.messages, { schema: request.schema });
  return {
    data: out.data,
    raw: out.raw,
    meta: { transport: 'openai', model: out.model, usage: out.usage },
  };
}

async function runViaMcp(config, request) {
  const client = new McpClient(config.mcp);
  await client.initialize();

  // Pass both the cleaned text and the chat messages so servers can use either
  // a structured `text` argument or the raw conversation.
  const args = {
    text: request.cleaned,
    messages: request.messages,
    schema: request.schema,
  };
  const out = await client.callTool(config.mcp.toolName, args);
  return {
    data: out.data,
    raw: out.raw,
    meta: { transport: 'mcp', tool: config.mcp.toolName, sessionId: client.sessionId },
  };
}

/** Connectivity test for the options page. */
export async function testProvider(config) {
  if (config.provider === PROVIDER.MCP) {
    const client = new McpClient(config.mcp);
    await client.initialize();
    const tools = await client.listTools();
    const found = tools.some((t) => t.name === config.mcp.toolName);
    return {
      ok: true,
      detail: `Connected. ${tools.length} tool(s); "${config.mcp.toolName}" ${found ? 'available' : 'NOT found'}.`,
    };
  }
  const { ping } = await import('./openai-client.js');
  await ping(config.openai);
  return { ok: true, detail: `Connected to ${config.openai.baseUrl}.` };
}
