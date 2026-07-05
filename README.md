# 🔍 Discern — Sort Opinion from Fact

A Manifest V3 browser extension that helps readers cut through confusing or
misleading social-media threads and articles. It:

- **Highlights argumentative language** in-page using fast local pattern matching
  (opinion markers, overstated certainty, sweeping generalizations, prescriptive
  claims, loaded language, and logical-fallacy cue phrases).
- **Strips fluff** (boilerplate, calls-to-action, URLs, emoji, markdown) and
  builds a **concise LLM query** that explicitly asks the model to separate
  facts from opinions, flag **opinions presented as facts**, and **name logical
  fallacies**.
- Sends the page, a selection, or an X/Twitter thread to an LLM over the
  **OpenAI** (Chat Completions) **or MCP** (Model Context Protocol) standard.
- Renders the result in an isolated **response modal** with tabs for Summary,
  Claims, Fallacies, and suggested follow-up **Questions** — including an
  **"Ask Grok"** action that drops a question into the X reply composer.
- Is built as an **extensible agent system** so research and fact-check agents
  can be added without touching the transport or UI layers.

No build step. No bundler. No runtime dependencies — vanilla ES modules only,
which keeps the supply chain trivially auditable.

---

## Install (developer / unpacked)

1. Open `chrome://extensions` (Chrome/Edge/Brave).
2. Toggle **Developer mode** on.
3. **Load unpacked** → select this folder.
4. Click the Discern toolbar icon → **Settings & API keys** and configure a
   provider (see below).

> Firefox: the code is standard MV3; load via `about:debugging` → *This Firefox*
> → *Load Temporary Add-on* and pick `manifest.json`.

---

## Configure a provider

Open **Settings**. Choose one transport:

### OpenAI-compatible
Works with OpenAI and any compatible gateway (Azure OpenAI, Groq, Together,
OpenRouter, or a local `llama.cpp` / Ollama OpenAI shim).

| Field | Example |
| --- | --- |
| Base URL | `https://api.openai.com/v1` |
| API key | `sk-…` |
| Model | `gpt-4o-mini` |

### MCP server (Streamable HTTP)
Point at an MCP server exposing a JSON-returning analysis tool. The client
performs `initialize` → `notifications/initialized` → `tools/call` and parses
the tool result (`structuredContent` or text JSON). See
[`docs/MCP.md`](docs/MCP.md) for the tool contract.

| Field | Example |
| --- | --- |
| Endpoint | `https://your-host/mcp` |
| API key | (optional bearer token) |
| Analysis tool name | `analyze_text` |

Use **Test connection** to verify before saving. **Keys are stored in
`chrome.storage.local` and never enter page context** — only the background
service worker reads them and talks to the network.

---

## Use it

- **Toolbar (bottom-right of any page):** `🔍 Scan` highlights argumentative
  language locally; `⚖️ Analyze` sends the page to the LLM.
- **Popup (toolbar icon):** the same actions plus agent status.
- **Right-click a selection → "Discern: analyze selection."**
- On **x.com / twitter.com**, the thread adapter extracts each post (with
  authors) and the modal's questions show **"Ask Grok"**, which inserts
  `@grok <question>` into the reply box for you to send.

---

## Architecture

```
manifest.json                 MV3 manifest (SW module + content script + WAR)
src/
  background/service-worker.js Only place with keys + network. Message router.
  content/                     Toolbar, highlighting, modal mount, Grok routing.
  lib/
    config/                    Defaults + chrome.storage store (single source).
    util/                      Logger + typed message envelope.
    text/
      detectors.js             Pure pattern matcher (opinion/fallacy cues).
      fluff.js                 Boilerplate/markdown/emoji stripping + truncate.
      extractor.js             Site adapters (X thread / generic article).
      highlighter.js           TreeWalker-based in-page <mark> wrapping.
    query/
      prompts.js               System prompt + JSON analysis schema.
      builder.js               Raw text → cleaned → provider-ready messages.
    api/
      openai-client.js         OpenAI-compatible Chat Completions.
      mcp-client.js            MCP JSON-RPC over Streamable HTTP.
      provider.js              Transport-agnostic runAnalysis() + testProvider().
      json.js                  Tolerant model-JSON extraction.
    agents/
      registry.js              Extensible agent registry.
      analyze-agent.js         Core opinion/fact + fallacy agent.
      research-agent.js        Scaffold (experimental).
      factcheck-agent.js       Scaffold (experimental).
  ui/
    modal/                     Shadow-DOM response modal (style-isolated).
    popup/                     Quick actions + agent status.
    options/                   Full configuration page.
```

### Data flow

```
content script ──extract──▶ adapter ──stripFluff──▶ detect (instant highlight)
       │                                                  │
       └────────── ANALYZE message ──▶ service worker ──▶ agent ──▶ provider
                                              │             (OpenAI | MCP)
       ◀──────── normalized result ───────────┘
       └──▶ shadow-DOM modal (Summary / Claims / Fallacies / Questions)
```

### Why these boundaries
- **Secrets isolation:** keys live only in the SW; the content script gets a
  redacted config and never sees them.
- **Pure text layer:** `detectors`/`fluff`/`prompts`/`builder` have no DOM or
  `chrome` deps, so they run identically in the SW and content script and are
  unit-testable in plain Node.
- **Transport seam:** agents call `runAnalysis(config, request)`; swapping
  OpenAI↔MCP is a config change, not a code change.

---

## Extending it

**Add a new agent** (e.g. a bias profiler):

1. Create `src/lib/agents/bias-agent.js` exporting
   `{ id, label, description, enabledKey, run(input, ctx) }`.
2. `registerAgent(biasAgent)` in `src/lib/agents/registry.js`.
3. Add an `agents.bias` toggle default in `config/defaults.js` and a checkbox in
   the options page.

The background router, messaging, and UI need **no** changes — they dispatch by
agent id and render whatever shape the agent returns.

**Add a new site adapter** (e.g. Reddit/YouTube comments): add one object to
`ADAPTERS` in `src/lib/text/extractor.js` with `matches(host)` and `extract()`.

**Tune detection:** edit the `RULES` array in `src/lib/text/detectors.js`.
Each rule is `{ category, regex, hint, weight }`; sensitivity thresholds live in
the same file.

---

## Testing

The pure pipeline runs in Node with no extension context:

```bash
node --check src/**/*.js                 # syntax
# or run the smoke test in docs/TESTING.md
```

---

## Privacy & safety

- The only network calls are to **the provider you configure**. Nothing else is
  contacted.
- The local heuristic is a *prompt for scrutiny*, not a verdict — it flags
  *language*, never truth. The LLM pass is advisory and can be wrong; treat its
  "facts" as leads to verify, which is exactly what the **Investigate** and
  **Questions** sections are for.
- The system prompt instructs the model to stay neutral and to avoid taking an
  ideological side.

## License

MIT (see headers). Built with vanilla JS and no third-party runtime code.
