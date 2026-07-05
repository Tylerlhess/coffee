# Testing

The text layer (`detectors`, `fluff`, `prompts`, `builder`) is pure ES modules
with no DOM or `chrome` dependencies, so it can be exercised directly in Node.

## Syntax check

```bash
find src -name '*.js' -exec node --check {} \;
```

## Smoke test the analysis pipeline

Save as `smoke.mjs` in the project root and run `node smoke.mjs`:

```js
import { detect } from './src/lib/text/detectors.js';
import { stripFluff } from './src/lib/text/fluff.js';
import { buildAnalysisRequest } from './src/lib/query/builder.js';
import { DEFAULT_CONFIG } from './src/lib/config/defaults.js';

const sample = `As we all know, the policy is obviously a disaster.
Everyone knows the experts say it will destroy the economy.
I think we should never allow this. So you're saying we give up?
Studies show crime always goes up. Click here to subscribe.`;

const cleaned = stripFluff(sample);
const { spans, stats } = detect(cleaned, { sensitivity: 'medium' });
console.log('flags:', stats);
console.log(spans.map(s => `${s.category}: "${s.text}"`).join('\n'));

const req = buildAnalysisRequest(sample, structuredClone(DEFAULT_CONFIG), { source: 'x' });
console.log('messages:', req.messages.map(m => m.role));
console.log('schema:', Object.keys(req.schema.properties));
```

Expected: several fallacy/opinion/generalization flags, two chat messages
(`system`, `user`), and the four-key schema (`summary`, `claims`, `fallacies`,
`questions`).

## Manual end-to-end

1. Load unpacked, configure a provider, **Test connection**.
2. Open a news article → toolbar **Scan** (highlights appear) → **Analyze**
   (modal with Summary/Claims/Fallacies/Questions).
3. Open an X thread → **Analyze** → a question → **Ask Grok** drops `@grok …`
   into the reply box.
4. Right-click selected text → **Coffee: analyze selection**.
```
