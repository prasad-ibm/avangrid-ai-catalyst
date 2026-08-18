/**
 * Seed the "Avangrid" enterprise workspace + 5 top use cases, fully populated
 * across all 5 gate modules (BXT, Feasibility, Advisory, Summary, Verdict)
 * so every module in the app can be visualized end-to-end.
 *
 * Deterministic — safe to re-run (idempotent: deletes the Avangrid workspace,
 * which cascades to use cases + gates, then re-inserts).
 *
 * Business content reflects an energy-utility AI portfolio; platform/technical
 * fields are mapped to the Microsoft stack (Azure AI Foundry / Microsoft 365
 * Copilot / Copilot Studio / Power Apps / Microsoft Fabric / Azure OpenAI),
 * advised against the Azure Well-Architected Framework (AWAF) + Microsoft CAF.
 *
 *   node scripts/seed-avangrid.js
 *
 * NOTE: DB column names and framework JSON keys (gemini_seats,
 * monthly_gcp_consumption, appsheet_plan, vertex_approved, gadf, google_caf)
 * are the app's internal schema identifiers and are intentionally left as-is;
 * only the VALUES are Microsoft/Avangrid-mapped, matching the UI labels.
 */
const { pool, query } = require('../db');

const WS = {
  name: 'Avangrid',
  industry: 'Energy & Utilities (Electric & Gas)',
  company_size: '7,000+',
  annual_revenue: '$8B+',
  region: 'US Northeast (NY, New England)',
  data_residency: 'US (Azure East US / Azure Confidential Computing)',
  cloud_provider: 'Microsoft Azure',
  workspace_edition: 'Microsoft 365 E5 + Azure Enterprise Agreement',
  gemini_seats: 12000,               // schema col: Microsoft 365 Copilot seats
  monthly_gcp_consumption: '$1.5M-$3M', // schema col: monthly Azure consumption
  appsheet_plan: 'Power Platform Enterprise', // schema col: low-code plan
  vertex_approved: true,             // schema col: Azure AI Foundry approved
  gartner_level: 3,
  ai_engineers: 140,
  mlops_maturity: 'Intermediate–Advanced (Azure ML pipelines, model registry, MLOps in Azure AI Foundry)',
  citizen_dev_program: true,
  compliance_frameworks: ['NERC CIP', 'SOC 2', 'ISO 27001', 'NIST CSF', 'CCPA'],
  eu_ai_act_tier: 'Limited / High risk (grid-safety use cases)',
  ai_priorities: 'Grid reliability & resilience, storm response, customer self-service, asset uptime, revenue assurance',
  ai_budget: '$25M-$40M FY26',
  delivery_model: 'Hybrid (COE-led build on Azure AI Foundry + citizen dev on Power Apps / Copilot Studio)',
  ai_goal: 'Deploy 20+ production AI agents across grid operations, customer, and back office within 18 months, governed by the Azure Well-Architected Framework.',
};

// 5 use cases. Each carries: intake fields + all 5 gate payloads.
const USE_CASES = [
  {
    name: 'Customer Self-Service Assistant',
    department: 'Customer Operations',
    executive_sponsor: 'Chief Customer Officer',
    submitted_by: 'Customer Digital Team',
    contact_email: 'customercare@avangrid.com',
    description: 'Conversational AI self-service for customer queries — billing, outages, start/stop service, payment arrangements — integrated with the CIS/billing system. Deflects 55–70% of call-center volume; customers get instant answers without waiting on hold.',
    business_context: { driver: 'Customer experience + cost-to-serve', expected_value: '55–70% call deflection', users_affected: '3.3M customers', value_usd: 9_500_000 },
    current_state: { process: 'Call center + IVR', monthly_contacts: 380000, current_spend_usd: 14_000_000, effort: 'High' },
    technical_context: { data_sources: 'CIS/billing, outage map, policy KB', platform: 'Microsoft 365 Copilot + Copilot Studio', integration: 'Native connectors', complexity: 'Low' },
    risk_compliance: { data_sensitivity: 'Medium', pii: true, autonomy: 'Advisory', audit_trail: true, adoption_readiness: 'High' },
    bxt: { business_score: 92, experience_score: 89, technology_score: 85, verdict: 'PASS',
      detail: { business: ['Clear ROI', 'Exec sponsor', 'High volume'], experience: ['Customers want self-service', 'Low friction'], technology: ['Off-the-shelf Copilot + Copilot Studio', 'Clean KB'] } },
    feasibility: { composite: 4.4, quadrant: 'Quick Win', risk_tier: 'Low', citizen_dev_pct: 80,
      criteria: { business_value: 5, strategic_alignment: 4, data_value: 4, data_availability: 5, technical_complexity: 5, integration_effort: 4, time_to_value: 5, safety: 4, compliance: 4, user_value: 5 },
      pillars: { strategic: 4.5, technical: 4.6, org: 4.1 } },
    advisory: { tier: 'Adopt', verdict_name: 'Start Simple', recommended_platform: 'Microsoft 365 Copilot + Copilot Studio', gate_resolved: 'gate1_adopt',
      reasoning: { workspace_coverage: 'High — Copilot + Copilot Studio cover conversational self-service natively', custom_workflow: 'Low', ai_complexity: 'Low' },
      journey: [{ phase: 'Adopt', platform: 'Microsoft 365 Copilot', mandate: 'Deploy now' }, { phase: 'Extend', platform: 'Copilot Studio', mandate: 'Add CIS/billing actions' }, { phase: 'Scale', platform: 'Azure AI Foundry Agent Service', mandate: 'If custom logic grows' }] },
    summary: { roi_p10: 210, roi_p50: 470, roi_p90: 900, readiness: 'Ready',
      frameworks: { gadf: 88, google_caf: 84, mckinsey_mit: 90, gartner: 86 },
      governance: [{ item: 'Microsoft Purview DLP', status: 'PASS' }, { item: 'Azure Monitor audit logs', status: 'PASS' }, { item: 'Responsible AI review', status: 'PASS' }, { item: 'PII handling', status: 'WARN' }] },
    verdict: { verdict: 'GO', binding_condition: 'PII redaction layer verified before GA.',
      stances: { business_sponsor: 'Strong Support', risk_assurance: 'Support', cio: 'Support', chair: 'GO' },
      deliberation: [{ turn: 1, persona: 'BS', text: 'Highest-volume, lowest-risk win — greenlight.' }, { turn: 2, persona: 'RA', text: 'Acceptable with PII redaction verified.' }] },
  },
  {
    name: 'Outage Prediction & Storm Response',
    department: 'Grid Operations',
    executive_sponsor: 'VP Electric Operations',
    submitted_by: 'Grid Analytics',
    contact_email: 'gridops@avangrid.com',
    description: 'Fuses weather forecasts, grid telemetry, and historical outage data to predict outage locations and volumes ahead of storms, enabling pre-staging of crews and materials. Cuts restoration time (SAIDI/CAIDI) 15–25% during major events.',
    business_context: { driver: 'Reliability + storm cost', expected_value: '15–25% faster restoration', users_affected: 'Ops + customers', value_usd: 28_000_000 },
    current_state: { process: 'Manual storm planning + reactive dispatch', current_spend_usd: 5_000_000, effort: 'Very High', coverage: 'Limited predictive lead time' },
    technical_context: { data_sources: 'SCADA/AMI telemetry, NOAA weather, outage history', platform: 'Azure AI Foundry + Microsoft Fabric + Azure IoT', integration: 'Batch + streaming', complexity: 'Medium' },
    risk_compliance: { data_sensitivity: 'High', pii: false, autonomy: 'Supervised', audit_trail: true, adoption_readiness: 'Medium' },
    bxt: { business_score: 95, experience_score: 66, technology_score: 74, verdict: 'PASS',
      detail: { business: ['Direct reliability impact', 'Exec sponsor'], experience: ['Dispatcher workflow change needed'], technology: ['Fabric + Azure AI Foundry viable', 'Data across systems'] } },
    feasibility: { composite: 3.9, quadrant: 'Big Bet', risk_tier: 'Medium', citizen_dev_pct: 34,
      criteria: { business_value: 5, strategic_alignment: 5, data_value: 5, data_availability: 4, technical_complexity: 3, integration_effort: 3, time_to_value: 3, safety: 4, compliance: 4, user_value: 4 },
      pillars: { strategic: 4.7, technical: 3.3, org: 3.7 } },
    advisory: { tier: 'Extend', verdict_name: 'Scale Smart', recommended_platform: 'Power Apps / Copilot Studio + Azure AI Foundry', gate_resolved: 'gate2_lowcode',
      reasoning: { workspace_coverage: 'Partial', custom_workflow: 'High — crew staging + dispatch logic', ai_complexity: 'Medium — geospatial outage prediction' },
      journey: [{ phase: 'Adopt', platform: 'Microsoft 365 Copilot', mandate: 'Dispatcher assist' }, { phase: 'Extend', platform: 'Power Apps / Copilot Studio', mandate: 'Storm staging app (current tier)' }, { phase: 'Scale', platform: 'Azure AI Foundry Agent Service', mandate: 'Autonomous pre-staging agent' }] },
    summary: { roi_p10: 320, roi_p50: 720, roi_p90: 1520, readiness: 'Conditional',
      frameworks: { gadf: 76, google_caf: 72, mckinsey_mit: 84, gartner: 80 },
      governance: [{ item: 'Microsoft Purview DLP', status: 'PASS' }, { item: 'Azure Monitor audit logs', status: 'PASS' }, { item: 'NERC CIP controls', status: 'WARN' }, { item: 'Human-in-the-loop dispatch', status: 'WARN' }] },
    verdict: { verdict: 'CONDITIONAL GO', binding_condition: 'All crew-dispatch actions require human approval; NERC CIP control mapping signed off before storm season.',
      stances: { business_sponsor: 'Strong Support', risk_assurance: 'Conditional', cio: 'Conditional', chair: 'CONDITIONAL GO' },
      deliberation: [{ turn: 1, persona: 'BS', text: 'Faster restoration protects customers and reduces storm cost — pursue.' }, { turn: 2, persona: 'RA', text: 'Supervised dispatch only, NERC CIP sign-off required.' }] },
  },
  {
    name: 'Vegetation Management Prioritization',
    department: 'Asset Management',
    executive_sponsor: 'VP Asset Management',
    submitted_by: 'Vegetation Program',
    contact_email: 'vegetation@avangrid.com',
    description: 'Combines satellite/LiDAR imagery with growth models and outage history to predict where vegetation will encroach on power lines, prioritizing trim cycles by risk. 15–25% reduction in tree-caused outages and smarter spend allocation.',
    business_context: { driver: 'Reliability + O&M efficiency', expected_value: '15–25% fewer tree-caused outages', users_affected: 'Vegetation + Ops', value_usd: 32_000_000 },
    current_state: { process: 'Fixed-cycle trimming + manual inspection', current_spend_usd: 90_000_000, effort: 'High', accuracy: 'Cycle-based, not risk-based' },
    technical_context: { data_sources: 'Satellite/LiDAR imagery, growth models, outage history', platform: 'Azure AI Foundry + Microsoft Fabric + Azure OpenAI', integration: 'API + batch', complexity: 'High' },
    risk_compliance: { data_sensitivity: 'Medium', pii: false, autonomy: 'Supervised', audit_trail: true, adoption_readiness: 'Medium' },
    bxt: { business_score: 90, experience_score: 62, technology_score: 70, verdict: 'CONDITIONAL',
      detail: { business: ['Large O&M reallocation impact'], experience: ['Planner trust in risk models'], technology: ['Azure AI Foundry vision mature', 'Imagery ingestion effort'] } },
    feasibility: { composite: 3.7, quadrant: 'Big Bet', risk_tier: 'Medium', citizen_dev_pct: 22,
      criteria: { business_value: 5, strategic_alignment: 5, data_value: 5, data_availability: 4, technical_complexity: 3, integration_effort: 2, time_to_value: 3, safety: 4, compliance: 4, user_value: 4 },
      pillars: { strategic: 4.7, technical: 3.0, org: 3.6 } },
    advisory: { tier: 'Build', verdict_name: 'Engineer It', recommended_platform: 'Azure AI Foundry + Microsoft Fabric', gate_resolved: 'gate3_build',
      reasoning: { workspace_coverage: 'None', custom_workflow: 'High', ai_complexity: 'High — geospatial vision + growth models' },
      journey: [{ phase: 'Adopt', platform: 'Microsoft 365 Copilot', mandate: 'Program copilot' }, { phase: 'Extend', platform: 'Power Apps', mandate: 'Field prioritization app' }, { phase: 'Scale', platform: 'Azure AI Foundry', mandate: 'Production models (current tier)' }] },
    summary: { roi_p10: 260, roi_p50: 600, roi_p90: 1260, readiness: 'Conditional',
      frameworks: { gadf: 71, google_caf: 74, mckinsey_mit: 85, gartner: 82 },
      governance: [{ item: 'Microsoft Purview DLP', status: 'PASS' }, { item: 'Model monitoring (drift)', status: 'WARN' }, { item: 'Azure Monitor audit logs', status: 'PASS' }, { item: 'Change management', status: 'WARN' }] },
    verdict: { verdict: 'CONDITIONAL GO', binding_condition: 'Phase-1 pilot on two operating districts; go/no-go on measured outage reduction before scale.',
      stances: { business_sponsor: 'Support', risk_assurance: 'Conditional', cio: 'Conditional', chair: 'CONDITIONAL GO' },
      deliberation: [{ turn: 1, persona: 'BS', text: 'Risk-based trimming reallocates a $90M program — high leverage.' }, { turn: 2, persona: 'CI', text: 'Prove outage-reduction lift in a bounded pilot first.' }] },
  },
  {
    name: 'Predictive Asset Maintenance',
    department: 'Substation & Grid Assets',
    executive_sponsor: 'VP Engineering',
    submitted_by: 'Reliability Engineering',
    contact_email: 'reliability@avangrid.com',
    description: 'Fuses IoT sensor data from transformers and substations with maintenance history to predict failure windows and auto-generate work orders with parts and crew plans. 25–40% reduction in unplanned equipment failures.',
    business_context: { driver: 'Uptime + asset health', expected_value: '25–40% fewer unplanned failures', users_affected: 'Maintenance + Ops', value_usd: 45_000_000 },
    current_state: { process: 'Time-based preventive maintenance', current_spend_usd: 8_500_000, effort: 'High', downtime: 'Baseline unplanned failure rate' },
    technical_context: { data_sources: 'IoT sensors (Azure IoT Hub), maintenance history', platform: 'Azure AI Foundry + Microsoft Fabric + Azure IoT + Azure Functions', integration: 'Streaming', complexity: 'High' },
    risk_compliance: { data_sensitivity: 'Medium', pii: false, autonomy: 'Supervised', audit_trail: true, adoption_readiness: 'Medium' },
    bxt: { business_score: 93, experience_score: 64, technology_score: 68, verdict: 'CONDITIONAL',
      detail: { business: ['Major reliability savings'], experience: ['Technician adoption of AI work orders'], technology: ['Sensor data quality', 'Streaming pipeline effort'] } },
    feasibility: { composite: 3.6, quadrant: 'Big Bet', risk_tier: 'Medium-High', citizen_dev_pct: 18,
      criteria: { business_value: 5, strategic_alignment: 5, data_value: 5, data_availability: 3, technical_complexity: 2, integration_effort: 2, time_to_value: 3, safety: 4, compliance: 4, user_value: 4 },
      pillars: { strategic: 4.8, technical: 2.7, org: 3.6 } },
    advisory: { tier: 'Build', verdict_name: 'Engineer It', recommended_platform: 'Azure AI Foundry + Azure IoT + Microsoft Fabric', gate_resolved: 'gate3_build',
      reasoning: { workspace_coverage: 'None', custom_workflow: 'High', ai_complexity: 'High — predictive models on streaming IoT' },
      journey: [{ phase: 'Adopt', platform: 'Microsoft 365 Copilot', mandate: 'Report copilot' }, { phase: 'Extend', platform: 'Power Apps', mandate: 'Work-order app' }, { phase: 'Scale', platform: 'Azure AI Foundry', mandate: 'Predictive models (current tier)' }] },
    summary: { roi_p10: 300, roi_p50: 710, roi_p90: 1500, readiness: 'Conditional',
      frameworks: { gadf: 69, google_caf: 70, mckinsey_mit: 86, gartner: 81 },
      governance: [{ item: 'Microsoft Purview DLP', status: 'PASS' }, { item: 'Data quality (sensors)', status: 'WARN' }, { item: 'Safety review (auto work orders)', status: 'WARN' }, { item: 'Azure Monitor audit logs', status: 'PASS' }] },
    verdict: { verdict: 'CONDITIONAL GO', binding_condition: 'Auto-generated work orders require supervisor approval until model precision >90% on the pilot substation fleet.',
      stances: { business_sponsor: 'Strong Support', risk_assurance: 'Conditional', cio: 'Conditional', chair: 'CONDITIONAL GO' },
      deliberation: [{ turn: 1, persona: 'BS', text: '$45M reliability upside — top priority.' }, { turn: 2, persona: 'RA', text: 'Safety: supervised work orders until precision proven.' }] },
  },
  {
    name: 'Revenue Assurance & Non-Technical Loss Detection',
    department: 'Metering & Billing',
    executive_sponsor: 'VP Customer & Revenue',
    submitted_by: 'Revenue Assurance',
    contact_email: 'revenue@avangrid.com',
    description: 'Correlates AMI meter data with billing records to detect energy theft, meter tampering, and billing leakage before it compounds. Recovers 1–3% of revenue that leaks silently through non-technical loss.',
    business_context: { driver: 'Revenue recovery', expected_value: '1–3% revenue recovered', users_affected: 'Revenue + Metering', value_usd: 24_000_000 },
    current_state: { process: 'Manual exception review of billing anomalies', current_spend_usd: 4_500_000, effort: 'Very High', coverage: 'Low sample rate' },
    technical_context: { data_sources: 'AMI meter reads, billing/CIS, field inspection logs', platform: 'Microsoft Fabric + Azure AI Foundry', integration: 'Batch + API', complexity: 'High' },
    risk_compliance: { data_sensitivity: 'High', pii: true, autonomy: 'Supervised', audit_trail: true, adoption_readiness: 'Medium' },
    bxt: { business_score: 89, experience_score: 68, technology_score: 66, verdict: 'CONDITIONAL',
      detail: { business: ['Direct $ recovery'], experience: ['Analyst trust in anomaly flags'], technology: ['Anomaly models on AMI data', 'CIS integration effort'] } },
    feasibility: { composite: 3.5, quadrant: 'Big Bet', risk_tier: 'Medium', citizen_dev_pct: 26,
      criteria: { business_value: 5, strategic_alignment: 4, data_value: 5, data_availability: 3, technical_complexity: 3, integration_effort: 2, time_to_value: 3, safety: 4, compliance: 4, user_value: 4 },
      pillars: { strategic: 4.4, technical: 2.9, org: 3.7 } },
    advisory: { tier: 'Build', verdict_name: 'Engineer It', recommended_platform: 'Microsoft Fabric + Azure AI Foundry', gate_resolved: 'gate3_build',
      reasoning: { workspace_coverage: 'None', custom_workflow: 'High', ai_complexity: 'High — anomaly detection + case management' },
      journey: [{ phase: 'Adopt', platform: 'Microsoft 365 Copilot', mandate: 'Analyst copilot' }, { phase: 'Extend', platform: 'Power BI in Microsoft Fabric + Copilot Studio', mandate: 'Case dashboards' }, { phase: 'Scale', platform: 'Azure AI Foundry', mandate: 'Detection models (current tier)' }] },
    summary: { roi_p10: 240, roi_p50: 550, roi_p90: 1160, readiness: 'Conditional',
      frameworks: { gadf: 68, google_caf: 71, mckinsey_mit: 82, gartner: 79 },
      governance: [{ item: 'Microsoft Purview DLP', status: 'PASS' }, { item: 'Data quality (AMI)', status: 'WARN' }, { item: 'Model monitoring', status: 'WARN' }, { item: 'Azure Monitor audit logs', status: 'PASS' }] },
    verdict: { verdict: 'CONDITIONAL GO', binding_condition: 'Advisory-only flags in phase 1; no automated field dispatch until validated against 3 months of confirmed cases.',
      stances: { business_sponsor: 'Support', risk_assurance: 'Conditional', cio: 'Conditional', chair: 'CONDITIONAL GO' },
      deliberation: [{ turn: 1, persona: 'BS', text: '$24M recoverable — strong case.' }, { turn: 2, persona: 'CI', text: 'Advisory first; validate before automated dispatch.' }] },
  },
];

async function upsertWorkspace() {
  // Idempotent by name: delete existing Avangrid (cascades to use cases + gates) then re-insert.
  await query('DELETE FROM workspaces WHERE name = $1', [WS.name]);
  const cols = Object.keys(WS);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const params = cols.map((c) => WS[c]);
  const sql = `INSERT INTO workspaces (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
  const r = await query(sql, params);
  return r.rows[0].id;
}

async function insertUseCase(wsId, uc) {
  const sql = `INSERT INTO use_cases
    (workspace_id, name, department, executive_sponsor, submitted_by, contact_email, description,
     business_context, current_state, technical_context, risk_compliance, stage)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'panel') RETURNING id`;
  const r = await query(sql, [
    wsId, uc.name, uc.department, uc.executive_sponsor, uc.submitted_by, uc.contact_email, uc.description,
    JSON.stringify(uc.business_context), JSON.stringify(uc.current_state),
    JSON.stringify(uc.technical_context), JSON.stringify(uc.risk_compliance),
  ]);
  return r.rows[0].id;
}

function isGenuinelyEvaluated(uc) {
  const stage = (uc.stage || 'panel');
  const name  = (uc.name || '');
  if (stage === 'intake') return false;
  if (/^\s*FE Test UC\s*$/i.test(name)) return false;
  return true;
}

async function insertGates(ucId, uc) {
  if (!isGenuinelyEvaluated(uc)) {
    console.log('  SKIP eval rows (unevaluated):', uc.name);
    return;
  }
  const b = uc.bxt;
  await query(`INSERT INTO bxt_scores (use_case_id,business_score,experience_score,technology_score,verdict,detail)
    VALUES ($1,$2,$3,$4,$5,$6)`, [ucId, b.business_score, b.experience_score, b.technology_score, b.verdict, JSON.stringify(b.detail)]);
  const f = uc.feasibility;
  await query(`INSERT INTO feasibility_scores (use_case_id,composite,quadrant,risk_tier,citizen_dev_pct,criteria,pillars)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`, [ucId, f.composite, f.quadrant, f.risk_tier, f.citizen_dev_pct, JSON.stringify(f.criteria), JSON.stringify(f.pillars)]);
  const a = uc.advisory;
  await query(`INSERT INTO advisory_results (use_case_id,tier,verdict_name,recommended_platform,gate_resolved,reasoning,journey)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`, [ucId, a.tier, a.verdict_name, a.recommended_platform, a.gate_resolved, JSON.stringify(a.reasoning), JSON.stringify(a.journey)]);
  const s = uc.summary;
  await query(`INSERT INTO evaluation_summaries (use_case_id,roi_p10,roi_p50,roi_p90,frameworks,governance,readiness)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`, [ucId, s.roi_p10, s.roi_p50, s.roi_p90, JSON.stringify(s.frameworks), JSON.stringify(s.governance), s.readiness]);
  const v = uc.verdict;
  await query(`INSERT INTO panel_verdicts (use_case_id,verdict,binding_condition,stances,deliberation)
    VALUES ($1,$2,$3,$4,$5)`, [ucId, v.verdict, v.binding_condition, JSON.stringify(v.stances), JSON.stringify(v.deliberation)]);
}

(async () => {
  try {
    console.log('Seeding Avangrid workspace...');
    const wsId = await upsertWorkspace();
    console.log('  workspace id =', wsId);
    for (const uc of USE_CASES) {
      const ucId = await insertUseCase(wsId, uc);
      await insertGates(ucId, uc);
      console.log('  seeded use case:', uc.name, '->', ucId, '(all 5 gates)');
    }
    const check = await query(`
      SELECT u.name,
        (bxt.use_case_id IS NOT NULL) b, (fs.use_case_id IS NOT NULL) f,
        (ar.use_case_id IS NOT NULL) a, (es.use_case_id IS NOT NULL) s, (pv.use_case_id IS NOT NULL) v
      FROM use_cases u
      JOIN workspaces w ON w.id=u.workspace_id AND w.name='Avangrid'
      LEFT JOIN bxt_scores bxt ON bxt.use_case_id=u.id
      LEFT JOIN feasibility_scores fs ON fs.use_case_id=u.id
      LEFT JOIN advisory_results ar ON ar.use_case_id=u.id
      LEFT JOIN evaluation_summaries es ON es.use_case_id=u.id
      LEFT JOIN panel_verdicts pv ON pv.use_case_id=u.id
      ORDER BY u.created_at`);
    console.log('\nVerification (all should be true across b/f/a/s/v):');
    console.table(check.rows);
    console.log('DONE — Avangrid + 5 use cases seeded across all 5 modules.');
  } catch (e) {
    console.error('SEED FAILED:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
