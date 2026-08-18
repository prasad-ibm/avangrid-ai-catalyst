-- ============================================================================
-- Avangrid AI Catalyst — demo re-stage + distinct compare radar profiles
-- ----------------------------------------------------------------------------
-- Spreads the 5 seeded use cases across the pipeline board lanes
-- (Intake / BXT / Advisory / Panel / Approved) and sets feasibility + ROI +
-- panel-verdict values so the Compare "spider web" shows five distinct
-- trade-off shapes.
--
-- Compare radar axes are DERIVED (compare.html computeRadar):
--   Safety      <- panel verdict (GO 4.5 / COND 3.0 / NO 1.2 / else feas*0.8)
--   Value       <- roi_p50 / 120 * 5   (0..5, caps at 120%)
--   Strat.Align <- feasibility quadrant
--   Readiness   <- feasibility composite (0..5)
--   Complexity  <- feasibility composite + quadrant bonus (higher = simpler)
--   Compliance  <- panel verdict (GO 4.2 / COND 3.0 / NO 1.5 / else 2.5)
--
-- Idempotent: re-running produces the same end state. Safe to run repeatedly.
-- Scoped to the workspace named 'Avangrid'.
-- ============================================================================

BEGIN;

-- Convenience: resolve the Avangrid workspace once.
-- (Repeated as a subselect below so this file works in a single psql run.)

-- 1) Pipeline lane per use case -------------------------------------------------
UPDATE use_cases uc
   SET stage = v.stage,
       -- Approved is a live, non-archived record in the Approved lane.
       status = CASE WHEN v.stage = 'approved' THEN 'active' ELSE uc.status END,
       updated_at = now()
  FROM (VALUES
    ('Customer Self-Service Assistant',                     'intake'),
    ('Outage Prediction & Storm Response',                  'bxt'),
    ('Vegetation Management Prioritization',                'advisory'),
    ('Predictive Asset Maintenance',                        'panel'),
    ('Revenue Assurance & Non-Technical Loss Detection',    'approved')
  ) AS v(name, stage)
 WHERE uc.name = v.name
   AND uc.workspace_id = (SELECT id FROM workspaces WHERE name = 'Avangrid' ORDER BY created_at DESC LIMIT 1);

-- 2) Feasibility composite + quadrant (drives Readiness / Complexity / Strat) ---
INSERT INTO feasibility_scores (use_case_id, composite, quadrant, risk_tier, citizen_dev_pct)
SELECT uc.id, v.composite, v.quadrant, v.risk_tier, v.cdp
  FROM (VALUES
    ('Customer Self-Service Assistant',                  4.5, 'Quick Win',   'Low',         80),
    ('Outage Prediction & Storm Response',               2.5, 'Big Bet',     'High',        20),
    ('Vegetation Management Prioritization',             3.3, 'Incremental', 'Medium',      45),
    ('Predictive Asset Maintenance',                     3.8, 'Accelerate',  'Medium',      40),
    ('Revenue Assurance & Non-Technical Loss Detection', 4.7, 'Quick Win',   'Low',         70)
  ) AS v(name, composite, quadrant, risk_tier, cdp)
  JOIN use_cases uc
    ON uc.name = v.name
   AND uc.workspace_id = (SELECT id FROM workspaces WHERE name = 'Avangrid' ORDER BY created_at DESC LIMIT 1)
ON CONFLICT (use_case_id) DO UPDATE
   SET composite = EXCLUDED.composite,
       quadrant  = EXCLUDED.quadrant,
       risk_tier = EXCLUDED.risk_tier,
       citizen_dev_pct = EXCLUDED.citizen_dev_pct;

-- 3) ROI band (drives Value axis; roi_p50 caps the axis at 120%) -----------------
INSERT INTO evaluation_summaries (use_case_id, roi_p10, roi_p50, roi_p90, readiness)
SELECT uc.id, v.p10, v.p50, v.p90, v.readiness
  FROM (VALUES
    ('Customer Self-Service Assistant',                  20,  40,  75,  'Ready'),
    ('Outage Prediction & Storm Response',               45, 140, 260,  'Conditional'),
    ('Vegetation Management Prioritization',             30,  66, 120,  'Conditional'),
    ('Predictive Asset Maintenance',                     42,  96, 180,  'Conditional'),
    ('Revenue Assurance & Non-Technical Loss Detection', 60, 120, 230,  'Ready')
  ) AS v(name, p10, p50, p90, readiness)
  JOIN use_cases uc
    ON uc.name = v.name
   AND uc.workspace_id = (SELECT id FROM workspaces WHERE name = 'Avangrid' ORDER BY created_at DESC LIMIT 1)
ON CONFLICT (use_case_id) DO UPDATE
   SET roi_p10 = EXCLUDED.roi_p10,
       roi_p50 = EXCLUDED.roi_p50,
       roi_p90 = EXCLUDED.roi_p90,
       readiness = EXCLUDED.readiness;

-- 4) Panel verdicts: only Panel + Approved have reached the panel --------------
INSERT INTO panel_verdicts (use_case_id, verdict, binding_condition)
SELECT uc.id, v.verdict, v.cond
  FROM (VALUES
    ('Predictive Asset Maintenance',
       'CONDITIONAL GO',
       'Auto-generated work orders require supervisor approval until model precision >90% on the pilot substation fleet.'),
    ('Revenue Assurance & Non-Technical Loss Detection',
       'GO',
       'Advisory-only flags in phase 1; scale after 3 months of confirmed-case validation.')
  ) AS v(name, verdict, cond)
  JOIN use_cases uc
    ON uc.name = v.name
   AND uc.workspace_id = (SELECT id FROM workspaces WHERE name = 'Avangrid' ORDER BY created_at DESC LIMIT 1)
ON CONFLICT (use_case_id) DO UPDATE
   SET verdict = EXCLUDED.verdict,
       binding_condition = EXCLUDED.binding_condition;

-- Intake / BXT / Advisory cases have NOT reached panel: remove any verdict so
-- the board keeps them in their lane and the radar treats Safety/Compliance as
-- "not yet assessed" (falls back to the feasibility-derived value).
DELETE FROM panel_verdicts
 WHERE use_case_id IN (
   SELECT id FROM use_cases
    WHERE name IN (
      'Customer Self-Service Assistant',
      'Outage Prediction & Storm Response',
      'Vegetation Management Prioritization'
    )
      AND workspace_id = (SELECT id FROM workspaces WHERE name = 'Avangrid' ORDER BY created_at DESC LIMIT 1)
 );

COMMIT;

-- Verify:
--   SELECT uc.stage, uc.name, f.composite, f.quadrant, s.roi_p50, p.verdict
--     FROM use_cases uc
--     LEFT JOIN feasibility_scores f ON f.use_case_id=uc.id
--     LEFT JOIN evaluation_summaries s ON s.use_case_id=uc.id
--     LEFT JOIN panel_verdicts p ON p.use_case_id=uc.id
--    WHERE uc.workspace_id=(SELECT id FROM workspaces WHERE name='Avangrid' ORDER BY created_at DESC LIMIT 1)
--    ORDER BY uc.stage;
