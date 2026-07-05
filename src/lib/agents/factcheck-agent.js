/**
 * Fact-check agent (scaffold).
 *
 * Future home for claim-by-claim verification against a knowledge source or a
 * dedicated fact-check MCP tool. Mirrors the agent interface so it slots into
 * the registry and UI with no other changes. Disabled by default.
 */

import { runAnalysis } from '../api/provider.js';

export const factcheckAgent = {
  id: 'factcheck',
  label: 'Fact-check (experimental)',
  description: 'Verifies individual factual claims and assigns a verdict with rationale.',
  enabledKey: 'factcheck',
  experimental: true,

  async run(input, ctx) {
    const { config } = ctx;
    if (!config.agents?.factcheck) {
      return { agent: 'factcheck', disabled: true, message: 'Fact-check agent is off. Enable it in Discern settings.', verdicts: [] };
    }

    const factual = (input.claims || [])
      .filter((c) => c.type === 'fact' || c.type === 'opinion-as-fact' || c.type === 'unverified')
      .slice(0, 8)
      .map((c) => c.text);

    if (factual.length === 0) {
      return { agent: 'factcheck', verdicts: [], message: 'No checkable factual claims found.' };
    }

    const messages = [
      { role: 'system', content: 'You are a careful fact-checker. Cite reasoning. Respond JSON only.' },
      {
        role: 'user',
        content: [
          'Assess each claim. Return JSON: { "verdicts": [ { "claim": string, "verdict": "true|false|misleading|unverifiable", "rationale": string } ] }',
          '',
          ...factual.map((c, i) => `${i + 1}. ${c}`),
        ].join('\n'),
      },
    ];

    const result = await runAnalysis(config, { messages, cleaned: factual.join('\n'), schema: null });
    return { agent: 'factcheck', verdicts: result.data?.verdicts || [], transport: result.meta };
  },
};
