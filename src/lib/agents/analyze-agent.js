/**
 * The core analysis agent: classify opinion vs fact and detect logical fallacies.
 * It composes the query builder + provider abstraction. This is the reference
 * implementation other agents should mirror.
 */

import { buildAnalysisRequest } from '../query/builder.js';
import { runAnalysis } from '../api/provider.js';

export const analyzeAgent = {
  id: 'analyze',
  label: 'Opinion / Fact Analyzer',
  description:
    'Separates facts from opinions, flags opinions-presented-as-fact, and names logical fallacies.',
  enabledKey: 'analyze',

  /**
   * @param {{ text: string, meta?: object }} input
   * @param {{ config: object }} ctx
   * @returns {Promise<object>} normalized result
   */
  async run(input, ctx) {
    const { config } = ctx;
    const request = buildAnalysisRequest(input.text, config, input.meta || {});

    const started = performance.now();
    const result = await runAnalysis(config, request);
    const elapsedMs = Math.round(performance.now() - started);

    return normalize({
      agent: 'analyze',
      data: result.data,
      localFindings: request.localFindings,
      cleaned: request.cleaned,
      transport: result.meta,
      elapsedMs,
      meta: input.meta || {},
    });
  },
};

/** Guarantee a stable shape regardless of what the model/server returned. */
function normalize(out) {
  const d = out.data || {};
  return {
    agent: out.agent,
    summary: typeof d.summary === 'string' ? d.summary : '',
    claims: Array.isArray(d.claims) ? d.claims : [],
    fallacies: Array.isArray(d.fallacies) ? d.fallacies : [],
    questions: Array.isArray(d.questions) ? d.questions : [],
    localFindings: out.localFindings,
    transport: out.transport,
    elapsedMs: out.elapsedMs,
    meta: out.meta,
  };
}
