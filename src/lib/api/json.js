/**
 * Robust JSON extraction from model output. Models sometimes wrap JSON in code
 * fences or add a stray sentence; this recovers the first valid object.
 */

export function parseModelJson(content) {
  if (content && typeof content === 'object') return content; // already parsed
  const text = String(content || '').trim();

  // 1) direct parse
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }

  // 2) fenced ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* fall through */
    }
  }

  // 3) first balanced { ... } block
  const start = text.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(start, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error('Model did not return valid JSON.');
}
