/**
 * Research agent (scaffold).
 *
 * Demonstrates the extension seam: when enabled, it would take the strongest
 * claims surfaced by the analyze agent and dispatch deeper investigation —
 * e.g. an MCP server exposing a `web_search` / `deep_research` tool, or an
 * OpenAI tool-calling loop. The interface is identical to analyzeAgent, so the
 * background worker and UI need no changes to support it.
 *
 * It is wired into the registry but disabled by default until a research-capable
 * provider/tool is configured.
 */

import { runAnalysis } from '../api/provider.js';
import { SYSTEM_PROMPT } from '../query/prompts.js';

export const researchAgent = {
  id: 'research',
  label: 'Research (experimental)',
  description:
    'Investigates the top claims using a research-capable provider/tool and returns sources.',
  enabledKey: 'research',
  experimental: true,

  async run(input, ctx) {
    const { config } = ctx;
    if (!config.agents?.research) {
      return disabled('Research agent is off. Enable it in Coffee settings once a research-capable tool is configured.');
    }

    const claims = (input.claims || []).slice(0, 5).map((c) => c.text || c).filter(Boolean);
    if (claims.length === 0) {
      return disabled('No claims provided to research.');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          'For each claim below, find supporting or refuting evidence and return JSON:',
          '{ "findings": [ { "claim": string, "verdict": "supported|refuted|mixed|unclear", "evidence": string, "sources": [string] } ] }',
          '',
          ...claims.map((c, i) => `${i + 1}. ${c}`),
        ].join('\n'),
      },
    ];

    const result = await runAnalysis(config, {
      messages,
      cleaned: claims.join('\n'),
      schema: null,
    });
    return { agent: 'research', findings: result.data?.findings || [], transport: result.meta };
  },
};

function disabled(message) {
  return { agent: 'research', disabled: true, message, findings: [] };
}
