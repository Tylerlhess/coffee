#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { detect } = await import('../src/lib/text/detectors.js');

function loadTSV(filePath, labelFilter = null) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const cases = [];
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length < 2) continue;
    
    const sentence = parts[0];
    const label = parseInt(parts[1], 10);
    
    if (labelFilter !== null && label !== labelFilter) continue;
    
    cases.push({ sentence, label });
  }
  
  return cases;
}

const opinionFile = path.join(__dirname, 'upstream/subj/test.tsv');
const opinionCases = loadTSV(opinionFile, 1);

const wordFreq = {};

for (const testCase of opinionCases) {
  const result = detect(testCase.sentence, { sensitivity: 'high' });
  
  if (result.spans.length === 0) {
    const words = testCase.sentence.toLowerCase().match(/\b[a-z]+\b/g) || [];
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
}

const sorted = Object.entries(wordFreq)
  .filter(([word, count]) => count >= 20 && word.length > 3)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 100);

console.log('Most common words in undetected opinion sentences:');
console.log('(These may indicate patterns we are missing)\n');

for (const [word, count] of sorted) {
  console.log(`${word}: ${count}`);
}
