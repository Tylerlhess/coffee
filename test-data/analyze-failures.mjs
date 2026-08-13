#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { detect } = await import('../src/lib/text/detectors.js');

function loadTSV(filePath, labelFilter = null, limit = 50) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const cases = [];
  
  for (let i = 1; i < lines.length && cases.length < limit; i++) {
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
const opinionCases = loadTSV(opinionFile, 1, 100);

console.log('Analyzing opinion detection failures...\n');
console.log('Sample of opinion sentences that were NOT detected:\n');

let failureCount = 0;
for (const testCase of opinionCases) {
  const result = detect(testCase.sentence, { sensitivity: 'high' });
  
  if (result.spans.length === 0 && failureCount < 20) {
    console.log(`"${testCase.sentence}"`);
    failureCount++;
  }
}

console.log('\n\nSample of opinion sentences that WERE detected:\n');

let successCount = 0;
for (const testCase of opinionCases) {
  const result = detect(testCase.sentence, { sensitivity: 'high' });
  
  if (result.spans.length > 0 && successCount < 10) {
    console.log(`"${testCase.sentence}"`);
    console.log(`  Detected: ${result.spans.map(s => `${s.category} ("${s.text}")`).join(', ')}`);
    successCount++;
  }
}
