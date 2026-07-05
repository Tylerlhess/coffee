/**
 * Prompt templates and the structured output schema the analysis agent expects.
 *
 * The schema is shared by both transports: OpenAI uses it via response_format /
 * instructions, and MCP servers can validate tool output against it. Keeping it
 * here makes the "contract" explicit and reusable by future agents.
 */

/** JSON Schema (draft-07 subset) for the analysis result. */
export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'claims', 'fallacies', 'questions'],
  properties: {
    summary: {
      type: 'string',
      description: 'One-paragraph neutral overview of what is being argued.',
    },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'type', 'rationale'],
        properties: {
          text: { type: 'string', description: 'The claim, quoted or paraphrased.' },
          type: {
            type: 'string',
            enum: ['fact', 'opinion', 'opinion-as-fact', 'unverified', 'prediction'],
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          rationale: { type: 'string', description: 'Why it was classified this way.' },
          suggestedInvestigation: {
            type: 'string',
            description: 'A concrete way to verify or falsify it.',
          },
        },
      },
    },
    fallacies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'excerpt', 'explanation'],
        properties: {
          name: { type: 'string', description: 'Name of the logical fallacy.' },
          excerpt: { type: 'string', description: 'The offending text.' },
          explanation: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    questions: {
      type: 'array',
      description: 'Sharp follow-up questions to ask an LLM/Grok to investigate.',
      items: { type: 'string' },
    },
  },
};

export const SYSTEM_PROMPT = [
  'You are a neutral critical-reading assistant. Your job is to help a reader',
  'separate opinion from fact and spot weak reasoning in social-media posts,',
  'comment threads, and articles.',
  '',
  'Rules:',
  '- Do NOT take a political or ideological side.',
  '- Distinguish verifiable factual claims from opinions, value judgments, and',
  '  predictions. Flag opinions that are presented with the grammar of fact',
  '  ("opinion-as-fact").',
  '- Explicitly identify logical fallacies (e.g. straw man, ad hominem, false',
  '  dilemma, slippery slope, whataboutism, appeal to authority, bandwagon,',
  '  post hoc, no true Scotsman). Name them precisely.',
  '- For each factual or unverified claim, suggest a concrete, falsifiable way',
  '  to investigate it.',
  '- Be concise. Quote the text you are referring to.',
  '- Respond ONLY with a single JSON object matching the provided schema. No',
  '  prose outside the JSON.',
].join('\n');

/**
 * Build the user-facing instruction body around the cleaned content.
 * @param {string} content cleaned text
 * @param {object} flags { detectFallacies, detectOpinionAsFact, suggestQuestions }
 * @param {object} meta { source, title, hints }
 */
export function buildUserPrompt(content, flags, meta = {}) {
  const asks = [];
  if (flags.detectOpinionAsFact !== false) {
    asks.push('classify each claim as fact / opinion / opinion-as-fact / unverified / prediction');
  }
  if (flags.detectFallacies !== false) {
    asks.push('detect and name every logical fallacy present');
  }
  if (flags.suggestQuestions !== false) {
    asks.push('propose sharp follow-up questions to investigate the strongest claims');
  }

  const hintBlock =
    Array.isArray(meta.hints) && meta.hints.length
      ? `\n\nThe local heuristic pre-flagged these phrases as worth scrutiny (verify, don't assume): ${meta.hints
          .slice(0, 25)
          .map((h) => JSON.stringify(h))
          .join(', ')}`
      : '';

  return [
    `Source type: ${meta.source || 'unknown'}${meta.title ? ` — "${meta.title}"` : ''}.`,
    `Please ${asks.join('; ')}.`,
    'Return JSON only, matching the schema.',
    hintBlock,
    '',
    '--- CONTENT START ---',
    content,
    '--- CONTENT END ---',
  ].join('\n');
}

/** Compact JSON-schema reminder appended when a gateway lacks response_format. */
export function schemaReminder() {
  return (
    'Output must be a JSON object with exactly these top-level keys: ' +
    '"summary" (string), "claims" (array of {text,type,confidence,rationale,suggestedInvestigation}), ' +
    '"fallacies" (array of {name,excerpt,explanation,severity}), ' +
    '"questions" (array of strings).'
  );
}
