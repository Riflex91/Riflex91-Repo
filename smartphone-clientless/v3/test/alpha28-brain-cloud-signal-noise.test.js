'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha28BrainCloud } = require('../src/reliability/alpha28-brain-cloud');

test('Alpha28 brain/cloud enablement is informational and does not enter alert escalation', () => {
  const values = { 'brain.mode': 'shadow', 'cloud.enabled': false, 'runtime.brainAuditMs': 5000 };
  const emitted = [];
  const runtime = {
    controlPlane: {
      get(key, fallback) { return values[key] === undefined ? fallback : values[key]; }
    },
    alpha25ControlCenterBrain: {
      patchSettings(patch) {
        Object.assign(values, patch);
        return { changed: Object.keys(patch) };
      }
    },
    planner: { rank: (rows) => rows },
    strategicBrainV2: { observe: () => null },
    cloudControlPlane: { status: () => ({ ready: true }) }
  };
  const bridge = new Alpha28BrainCloud(runtime, {
    now: () => 100,
    log: { emit: (row) => emitted.push(row) },
    stats: { brainCloudSettingPatches: 0, brainCanaryPlannerDecisions: 0 }
  });

  assert.equal(bridge.ensureSettings(), true);
  const enablement = emitted.find((row) => row.event === 'ALPHA28_BRAIN_CLOUD_ENABLED');
  assert.ok(enablement);
  assert.equal(enablement.severity, 'info');
  assert.equal(enablement.reason, 'OPERATOR_REQUESTED_ON');
});
