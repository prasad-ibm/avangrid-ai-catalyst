/* ==========================================================================
 * ai-service.js — Azure OpenAI integration for the Executive Review Panel + AI Assist
 *
 * Uses the Azure OpenAI Chat Completions REST API via Node's built-in https
 * (no SDK dependency, so it deploys cleanly on Railway). Reads the endpoint and
 * key from the environment. This is the "Copilot" inference path that powers the
 * live Executive Panel and the AI Assist hints.
 *
 * If no key/endpoint is present, or a call fails, callers fall back to the
 * scripted content already in the front-end — the feature degrades gracefully
 * and never breaks the page.
 *
 * Env:
 *   AZURE_OPENAI_ENDPOINT   e.g. https://my-resource.openai.azure.com
 *   AZURE_OPENAI_API_KEY    the resource key (header: api-key)
 *   AZURE_OPENAI_DEPLOYMENT the deployment name (default: gpt-4o-mini)
 *   AZURE_OPENAI_API_VERSION (default: 2024-06-01)
 * ========================================================================== */
'use strict';

const https = require('https');

const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-06-01';
const API_KEY = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY || '';
const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/+$/, '');
// Surfaced to callers as the model label.
const MODEL = DEPLOYMENT;

function isEnabled() {
  return Boolean(API_KEY && ENDPOINT);
}

/**
 * Low-level call to Azure OpenAI chat completions. Returns the model's text.
 * Rejects on network / API / parse errors so the caller can fall back.
 */
function generate(prompt, { temperature = 0.7, maxOutputTokens = 2048 } = {}) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) return reject(new Error('AZURE_OPENAI_API_KEY not set'));
    if (!ENDPOINT) return reject(new Error('AZURE_OPENAI_ENDPOINT not set'));

    let hostname;
    try { hostname = new URL(ENDPOINT).hostname; }
    catch (e) { return reject(new Error('Invalid AZURE_OPENAI_ENDPOINT: ' + e.message)); }

    const body = JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxOutputTokens,
      response_format: { type: 'json_object' },
    });

    const options = {
      hostname,
      path: `/openai/deployments/${encodeURIComponent(DEPLOYMENT)}/chat/completions?api-version=${encodeURIComponent(API_VERSION)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 25000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error('Azure OpenAI HTTP ' + res.statusCode + ': ' + data.slice(0, 300)));
        }
        try {
          const json = JSON.parse(data);
          const text = json &&
            json.choices && json.choices[0] &&
            json.choices[0].message && json.choices[0].message.content;
          if (!text) return reject(new Error('Azure OpenAI: empty response'));
          resolve(text);
        } catch (e) { reject(new Error('Azure OpenAI parse error: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('Azure OpenAI request timed out')); });
    req.write(body);
    req.end();
  });
}

/** Safely extract the first JSON object/array from a model response string. */
function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch (e) { /* fall through */ }
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf(']'), text.lastIndexOf('}'));
  if (start !== -1 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  throw new Error('No JSON found in model output');
}

/* --------------------------------------------------------------------------
 * Executive Review Panel deliberation
 * ------------------------------------------------------------------------ */

function buildDeliberationPrompt(ctx) {
  const c = ctx || {};
  return [
    'You are simulating an enterprise AI Investment Committee reviewing a proposed AI use case.',
    'Four personas deliberate over exactly 7 turns and reach a committee verdict.',
    '',
    'PERSONAS (use these exact codes):',
    '  BS = Business Sponsor (Executive Sponsor) — champions ROI and business value',
    '  RA = Risk & Assurance Officer (Chief Risk Officer) — compliance, data residency, regulatory risk',
    '  CI = Chief Information Officer (CIO) — architecture, integration, technical readiness',
    '  CC = Committee Chair (IC Moderator) — synthesises and issues the final verdict',
    '',
    'TURN ORDER (exactly 7 turns): BS, RA, CI, BS, RA, CI, CC.',
    'The CC turn (last) must state the final committee decision and any binding condition.',
    '',
    'IMPORTANT CONTEXT — this is a MICROSOFT AZURE platform. Reference ONLY Microsoft technologies',
    '(Azure AI Foundry, Azure AI Foundry Agent Service, Microsoft 365 Copilot, Copilot Studio,',
    'Power Apps, Microsoft Fabric, Azure OpenAI, Azure Confidential Computing).',
    'Do NOT mention Google, Gemini, Vertex, AWS, or any non-Microsoft vendor.',
    '',
    'USE CASE UNDER REVIEW:',
    '  Name: ' + (c.name || 'Untitled AI use case'),
    '  Department: ' + (c.department || 'n/a'),
    '  Description: ' + (c.description || 'n/a'),
    '  Feasibility composite (0-5): ' + (c.composite != null ? c.composite : 'n/a'),
    '  Quadrant: ' + (c.quadrant || 'n/a'),
    '  Advisory tier: ' + (c.tier || 'n/a') + ' (recommended platform: ' + (c.platform || 'n/a') + ')',
    '  ROI P50: ' + (c.roiP50 != null ? c.roiP50 + '%' : 'n/a') + ' over 24 months',
    '  Governance status: ' + (c.governance || 'n/a'),
    '  Prior verdict signal (from readiness): ' + (c.verdictHint || 'CONDITIONAL GO'),
    '',
    'Return ONLY valid JSON (no markdown) with this exact shape:',
    '{',
    '  "deliberation": [ { "p": "BS", "say": "<one turn, 2-4 sentences, may use <b>bold</b> for key figures>" }, ... 7 items ... ],',
    '  "stances": [',
    '    { "persona": "BS", "label": "Business Sponsor", "value": "Support|Conditional|Oppose" },',
    '    { "persona": "RA", "label": "Risk & Assurance", "value": "Support|Conditional|Oppose" },',
    '    { "persona": "CI", "label": "CIO", "value": "Support|Conditional|Oppose" }',
    '  ],',
    '  "verdict": "GO|CONDITIONAL GO|NO-GO",',
    '  "condition": "<the single binding condition if CONDITIONAL GO, else empty string>"',
    '}',
  ].join('\n');
}

/**
 * Generate a live deliberation from Azure OpenAI. Resolves to the panel-shaped
 * object, or rejects (caller falls back to scripted content).
 */
async function deliberate(ctx) {
  const raw = await generate(buildDeliberationPrompt(ctx), { temperature: 0.8, maxOutputTokens: 2048 });
  const obj = parseJsonLoose(raw);

  // Validate the shape so we never hand the UI something broken.
  if (!obj || !Array.isArray(obj.deliberation) || obj.deliberation.length < 4) {
    throw new Error('Azure OpenAI deliberation: invalid shape');
  }
  const ok = { BS: 1, RA: 1, CI: 1, CC: 1 };
  obj.deliberation = obj.deliberation
    .filter((t) => t && ok[t.p] && typeof t.say === 'string')
    .slice(0, 7);
  if (!obj.deliberation.length) throw new Error('Azure OpenAI deliberation: no valid turns');
  if (!obj.verdict) obj.verdict = 'CONDITIONAL GO';

  // Normalise stances to the panel's shape: { persona, label, value, klass }.
  var STANCE_CLASS = { Support: 'stance--support', Conditional: 'stance--conditional', Oppose: 'stance--oppose' };
  var LABELS = { BS: 'Business Sponsor', RA: 'Risk & Assurance', CI: 'CIO' };
  if (!Array.isArray(obj.stances) || !obj.stances.length) {
    obj.stances = ['BS', 'RA', 'CI'].map(function (p) {
      return { persona: p, label: LABELS[p], value: 'Conditional', klass: 'stance--conditional' };
    });
  } else {
    obj.stances = obj.stances.map(function (s) {
      var value = (s.value || 'Conditional');
      var persona = s.persona || '';
      return {
        persona: persona,
        label: s.label || LABELS[persona] || persona,
        value: value,
        klass: STANCE_CLASS[value] || 'stance--conditional',
      };
    });
  }
  if (typeof obj.condition !== 'string') obj.condition = '';
  obj.source = 'copilot';
  obj.model = MODEL;
  return obj;
}

/* --------------------------------------------------------------------------
 * AI Assist — short contextual hint for a given gate/tab
 * ------------------------------------------------------------------------ */

async function assist(ctx) {
  const c = ctx || {};
  const prompt = [
    'You are an AI advisor embedded in a Microsoft Azure AI use-case evaluation platform.',
    'Give ONE concise, practical hint (max 2 sentences) for the current step.',
    'Reference only Microsoft technologies (Azure AI Foundry, Azure AI Foundry Agent Service,',
    'Microsoft 365 Copilot, Copilot Studio, Power Apps, Microsoft Fabric). No other vendors.',
    '',
    'Current gate/step: ' + (c.step || 'intake'),
    'Use case: ' + (c.name || 'n/a') + ' | Department: ' + (c.department || 'n/a'),
    'Notes: ' + (c.notes || 'n/a'),
    '',
    'Return ONLY valid JSON: { "hint": "<your hint>" }',
  ].join('\n');
  const raw = await generate(prompt, { temperature: 0.6, maxOutputTokens: 256 });
  const obj = parseJsonLoose(raw);
  if (!obj || typeof obj.hint !== 'string') throw new Error('assist: invalid shape');
  return { hint: obj.hint, source: 'copilot', model: MODEL };
}

module.exports = { isEnabled, deliberate, assist, generate, MODEL };
