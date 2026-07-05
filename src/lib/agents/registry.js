/**
 * Extensible agent registry.
 *
 * An "agent" is a named capability with a stable interface:
 *   { id, label, description, enabledKey, run(input, ctx) -> result }
 *
 * The background worker dispatches to agents by id. New agents (research,
 * fact-check, source-finder, bias-profiler) register here without changing the
 * transport, messaging, or UI layers — that is the whole point of this seam.
 */

import { analyzeAgent } from './analyze-agent.js';
import { researchAgent } from './research-agent.js';
import { factcheckAgent } from './factcheck-agent.js';

const REGISTRY = new Map();

export function registerAgent(agent) {
  if (!agent?.id || typeof agent.run !== 'function') {
    throw new Error('Invalid agent: requires {id, run}.');
  }
  REGISTRY.set(agent.id, agent);
}

export function getAgent(id) {
  return REGISTRY.get(id);
}

/** List agents, annotating each with whether the current config enables it. */
export function listAgents(config) {
  return [...REGISTRY.values()].map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    enabled: config ? !!config.agents?.[a.enabledKey ?? a.id] : false,
    experimental: !!a.experimental,
  }));
}

// Built-in agents. Order here is display order.
registerAgent(analyzeAgent);
registerAgent(researchAgent);
registerAgent(factcheckAgent);
