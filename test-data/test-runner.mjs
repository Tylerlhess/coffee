#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { detect, CATEGORY } = await import('../src/lib/text/detectors.js');

function loadManifest(trackName) {
  const manifestPath = path.join(__dirname, trackName, 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

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

function loadCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  return lines.map(line => ({ sentence: line.replace(/^"|"$/g, '') }));
}

function evaluateCase(sentence, expect) {
  const result = detect(sentence, { sensitivity: 'high' });
  const categories = [...new Set(result.spans.map(s => s.category))];
  
  if (expect.shouldFlag === false) {
    if (result.spans.length === 0) {
      return { correct: true, misidentified: false };
    }
    
    if (expect.maxSpans !== undefined && result.spans.length <= expect.maxSpans) {
      const forbidden = expect.forbiddenCategories || [];
      const hasForbidden = categories.some(c => forbidden.includes(c));
      if (!hasForbidden) {
        return { correct: true, misidentified: false };
      }
    }
    
    return { correct: false, misidentified: true };
  }
  
  if (expect.shouldFlag === true) {
    if (result.spans.length === 0) {
      return { correct: false, misidentified: false };
    }
    
    if (expect.categoriesAny) {
      const hasMatch = categories.some(c => expect.categoriesAny.includes(c));
      if (hasMatch) {
        return { correct: true, misidentified: false };
      }
      if (expect.softPass && result.spans.length > 0) {
        return { correct: true, misidentified: false };
      }
      return { correct: false, misidentified: true };
    }
    
    return { correct: true, misidentified: false };
  }
  
  return { correct: false, misidentified: false };
}

function runTrack(trackName) {
  const manifest = loadManifest(trackName);
  const results = {
    track: trackName,
    totalCases: 0,
    correctlyIdentified: 0,
    misidentified: 0,
    missed: 0,
  };
  
  for (const slice of manifest.slices) {
    const upstreamPath = path.join(__dirname, manifest.localRoot, slice.file);
    
    let cases = [];
    if (slice.file.endsWith('.tsv')) {
      cases = loadTSV(upstreamPath, slice.labelFilter);
    } else if (slice.file.endsWith('.csv')) {
      cases = loadCSV(upstreamPath);
    }
    
    for (const testCase of cases) {
      results.totalCases++;
      const outcome = evaluateCase(testCase.sentence, slice.defaultExpect);
      
      if (outcome.correct) {
        results.correctlyIdentified++;
      } else if (outcome.misidentified) {
        results.misidentified++;
      } else {
        results.missed++;
      }
    }
  }
  
  return results;
}

function calculateScore(results) {
  const { correctlyIdentified, misidentified, totalCases } = results;
  const score = ((correctlyIdentified - misidentified) / totalCases) * 100;
  return score;
}

console.log('Running detection engine tests...\n');

const tracks = ['facts', 'opinions', 'fallacies'];
const allResults = [];

for (const track of tracks) {
  const results = runTrack(track);
  const score = calculateScore(results);
  allResults.push({ ...results, score });
  
  console.log(`${track.toUpperCase()}:`);
  console.log(`  Total cases: ${results.totalCases}`);
  console.log(`  Correctly identified: ${results.correctlyIdentified}`);
  console.log(`  Misidentified: ${results.misidentified}`);
  console.log(`  Missed: ${results.missed}`);
  console.log(`  Score: ${score.toFixed(2)}%`);
  console.log();
}

const totalCorrect = allResults.reduce((sum, r) => sum + r.correctlyIdentified, 0);
const totalMisidentified = allResults.reduce((sum, r) => sum + r.misidentified, 0);
const totalCases = allResults.reduce((sum, r) => sum + r.totalCases, 0);
const overallScore = ((totalCorrect - totalMisidentified) / totalCases) * 100;

console.log('OVERALL:');
console.log(`  Total cases: ${totalCases}`);
console.log(`  Correctly identified: ${totalCorrect}`);
console.log(`  Misidentified: ${totalMisidentified}`);
console.log(`  Score: ${overallScore.toFixed(2)}%`);
console.log();

if (overallScore >= 80) {
  console.log('✓ PASSED: Score meets 80% threshold');
  process.exit(0);
} else {
  console.log(`✗ FAILED: Score below 80% threshold (need ${(80 - overallScore).toFixed(2)}% more)`);
  process.exit(1);
}
