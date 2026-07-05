# MCP integration contract

Discern speaks the **Model Context Protocol** over the **Streamable HTTP**
transport (JSON-RPC 2.0). When the provider is set to `mcp`, every analysis is a
single `tools/call`.

## Handshake

The client (`src/lib/api/mcp-client.js`) performs, against your configured
`endpoint`:

1. `POST initialize` with
   ```json
   {
     "protocolVersion": "2025-06-18",
     "capabilities": { "tools": {} },
     "clientInfo": { "name": "Discern", "version": "0.1.0" }
   }
   ```
   If the server returns an `Mcp-Session-Id` header, it is echoed on every
   subsequent request.
2. `POST notifications/initialized` (a JSON-RPC notification, no `id`).
3. `POST tools/call`.

`Accept: application/json, text/event-stream` is sent; both a plain JSON body
and an SSE stream (the client reads the final `data:` JSON-RPC message) are
supported. A bearer token from the settings is sent as `Authorization` when set.

## The analysis tool

Default tool name: **`analyze_text`** (configurable). Discern calls it with:

```json
{
  "name": "analyze_text",
  "arguments": {
    "text": "…cleaned, fluff-stripped content…",
    "messages": [ { "role": "system", "content": "…" }, { "role": "user", "content": "…" } ],
    "schema": { /* the ANALYSIS_SCHEMA, see below */ }
  }
}
```

A server may use either the convenient `text` argument or the full `messages`
array. It should return the analysis as JSON, via **either**:

- `result.structuredContent` — a JSON object matching the schema (preferred), or
- `result.content` — a `[{ "type": "text", "text": "<json string>" }]` array.

`result.isError: true` (with a text reason) surfaces as an error in the modal.

## Expected result schema

```jsonc
{
  "summary": "string",
  "claims": [
    {
      "text": "string",
      "type": "fact | opinion | opinion-as-fact | unverified | prediction",
      "confidence": 0.0,
      "rationale": "string",
      "suggestedInvestigation": "string"
    }
  ],
  "fallacies": [
    { "name": "string", "excerpt": "string", "explanation": "string", "severity": "low|medium|high" }
  ],
  "questions": ["string"]
}
```

This is the same schema used for OpenAI's `response_format` JSON mode, defined in
`src/lib/query/prompts.js` (`ANALYSIS_SCHEMA`). Reusing one schema across both
transports is deliberate: future agents (research, fact-check) declare their own
schemas the same way and remain transport-agnostic.

## Minimal server sketch (Node, illustrative)

```js
// POST /mcp — JSON-RPC 2.0
// Route methods: initialize, notifications/initialized, tools/list, tools/call
// For tools/call -> name "analyze_text":
//   const { messages } = params.arguments;
//   const json = await yourLLM.chat({ messages, response_format: 'json' });
//   return { content: [{ type: 'text', text: json }] };
```

Any compliant MCP framework (the official TypeScript/Python SDKs) can expose
this tool; Discern only requires the handshake and result shape above.
