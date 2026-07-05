/**
 * Options page. Runs in extension context, so it reads/writes the real config
 * (including secrets) via the config store and can run a live provider test.
 */

import { getConfig, replaceConfig, resetConfig } from '../../lib/config/store.js';
import { testProvider } from '../../lib/api/provider.js';

const $ = (id) => document.getElementById(id);

let current = null;

init();

async function init() {
  current = await getConfig();
  populate(current);
  wire();
  toggleProviderFields();
}

function populate(c) {
  $('provider').value = c.provider;

  $('openai-baseUrl').value = c.openai.baseUrl;
  $('openai-apiKey').value = c.openai.apiKey;
  $('openai-model').value = c.openai.model;
  $('openai-temperature').value = c.openai.temperature;
  $('openai-useJsonResponseFormat').checked = c.openai.useJsonResponseFormat;

  $('mcp-endpoint').value = c.mcp.endpoint;
  $('mcp-apiKey').value = c.mcp.apiKey;
  $('mcp-toolName').value = c.mcp.toolName;

  $('sensitivity').value = c.detection.sensitivity;
  $('showToolbar').checked = c.detection.showToolbar;
  $('highlightOnLoad').checked = c.detection.highlightOnLoad;

  $('detectOpinionAsFact').checked = c.analysis.detectOpinionAsFact;
  $('detectFallacies').checked = c.analysis.detectFallacies;
  $('suggestQuestions').checked = c.analysis.suggestQuestions;
  $('maxChars').value = c.analysis.maxChars;

  $('agent-research').checked = c.agents.research;
  $('agent-factcheck').checked = c.agents.factcheck;
}

function collect() {
  return {
    provider: $('provider').value,
    openai: {
      baseUrl: $('openai-baseUrl').value.trim(),
      apiKey: $('openai-apiKey').value.trim(),
      model: $('openai-model').value.trim(),
      temperature: parseFloat($('openai-temperature').value) || 0.2,
      useJsonResponseFormat: $('openai-useJsonResponseFormat').checked,
    },
    mcp: {
      endpoint: $('mcp-endpoint').value.trim(),
      apiKey: $('mcp-apiKey').value.trim(),
      toolName: $('mcp-toolName').value.trim() || 'analyze_text',
      protocolVersion: current.mcp.protocolVersion,
    },
    detection: {
      sensitivity: $('sensitivity').value,
      showToolbar: $('showToolbar').checked,
      highlightOnLoad: $('highlightOnLoad').checked,
    },
    analysis: {
      detectOpinionAsFact: $('detectOpinionAsFact').checked,
      detectFallacies: $('detectFallacies').checked,
      suggestQuestions: $('suggestQuestions').checked,
      maxChars: clamp(parseInt($('maxChars').value, 10) || 12000, 500, 60000),
    },
    agents: {
      analyze: true,
      research: $('agent-research').checked,
      factcheck: $('agent-factcheck').checked,
    },
    ui: current.ui,
  };
}

function wire() {
  $('provider').addEventListener('change', toggleProviderFields);
  $('save').addEventListener('click', onSave);
  $('reset').addEventListener('click', onReset);
  $('test').addEventListener('click', onTest);
}

function toggleProviderFields() {
  const isMcp = $('provider').value === 'mcp';
  $('openai-fields').style.display = isMcp ? 'none' : '';
  $('mcp-fields').style.display = isMcp ? '' : 'none';
}

async function onSave() {
  current = await replaceConfig(collect());
  flash($('save-result'), 'Saved ✓', 'ok');
}

async function onReset() {
  current = await resetConfig();
  populate(current);
  toggleProviderFields();
  flash($('save-result'), 'Reset to defaults.', 'ok');
}

async function onTest() {
  const el = $('test-result');
  flash(el, 'Testing…', '');
  try {
    const result = await testProvider(collect());
    flash(el, result.detail || 'Connected ✓', 'ok');
  } catch (e) {
    flash(el, e.message || 'Failed', 'error');
  }
}

function flash(el, msg, kind) {
  el.textContent = msg;
  el.className = `test-result ${kind}`;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
