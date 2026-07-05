/**
 * Query builder: turns raw page/selection text into a concise, provider-ready
 * request. This is the bridge between the text layer and the API layer.
 */

import { stripFluff, truncate } from '../text/fluff.js';
import { detect } from '../text/detectors.js';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  schemaReminder,
  ANALYSIS_SCHEMA,
} from './prompts.js';

/**
 * @param {string} rawText
 * @param {object} config the merged extension config
 * @param {object} meta { source, title, keepHandles }
 * @returns {{
 *   messages: Array<{role:string, content:string}>,
 *   cleaned: string,
 *   localFindings: object,
 *   schema: object
 * }}
 */
export function buildAnalysisRequest(rawText, config, meta = {}) {
  const cleaned = truncate(
    stripFluff(rawText, {
      keepHandles: meta.keepHandles ?? meta.source === 'x',
      keepHashtags: false,
    }),
    config.analysis.maxChars,
  );

  // Run the local heuristic so the model gets concrete spans to verify, and so
  // the UI can show instant results before the network round-trip returns.
  const localFindings = detect(cleaned, {
    sensitivity: config.detection.sensitivity,
  });

  const userPrompt = buildUserPrompt(cleaned, config.analysis, {
    source: meta.source,
    title: meta.title,
    hints: localFindings.phrases,
  });

  const system = config.openai?.useJsonResponseFormat
    ? SYSTEM_PROMPT
    : `${SYSTEM_PROMPT}\n${schemaReminder()}`;

  return {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    cleaned,
    localFindings,
    schema: ANALYSIS_SCHEMA,
  };
}
