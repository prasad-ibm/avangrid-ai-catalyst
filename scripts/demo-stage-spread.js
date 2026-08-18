#!/usr/bin/env node
'use strict';
/**
 * Applies scripts/demo-stage-spread.sql against DATABASE_URL.
 *
 *   set DATABASE_URL=postgresql://...   (public proxy URL for local runs)
 *   node scripts/demo-stage-spread.js
 *
 * Idempotent — safe to re-run. Prints the resulting board/radar layout.
 */
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'demo-stage-spread.sql'), 'utf8');
  await pool.query(sql);
  const r = await query(
    `SELECT uc.stage, uc.name, f.composite, f.quadrant, s.roi_p50, p.verdict
       FROM use_cases uc
       LEFT JOIN feasibility_scores  f ON f.use_case_id = uc.id
       LEFT JOIN evaluation_summaries s ON s.use_case_id = uc.id
       LEFT JOIN panel_verdicts      p ON p.use_case_id = uc.id
      WHERE uc.workspace_id = (SELECT id FROM workspaces WHERE name='Avangrid' ORDER BY created_at DESC LIMIT 1)
      ORDER BY CASE uc.stage WHEN 'intake' THEN 1 WHEN 'bxt' THEN 2 WHEN 'advisory' THEN 3
                             WHEN 'panel' THEN 4 WHEN 'approved' THEN 5 ELSE 9 END`
  );
  console.log('\nStage      Composite  Quadrant      ROI(P50)  Verdict          Use case');
  console.log('-'.repeat(96));
  for (const x of r.rows) {
    console.log(
      String(x.stage).padEnd(10),
      String(x.composite ?? '—').padStart(8),
      String(x.quadrant ?? '—').padEnd(13),
      String(x.roi_p50 ?? '—').padStart(7),
      '  ',
      String(x.verdict ?? '(none)').padEnd(16),
      x.name
    );
  }
  console.log(`\nUpdated ${r.rows.length} use cases across the pipeline.`);
  await pool.end();
}
main().catch((e) => { console.error('demo-stage-spread failed:', e.message); process.exit(1); });
