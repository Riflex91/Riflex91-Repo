'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assessDebugHealth } = require('../host/debug-health-assessor');
const { DebugTelemetryExporter } = require('../host/debug-telemetry-exporter');

function snapshotWithHealth({ state = 'HEALTHY', watchdogState = 'HEALTHY', watchdogReason = null, groupState = 'HEALTHY', recoveryStage = null, pending = 0, pendingCritical = 0 } = {}) {
  return {
    type: 'AIO_V3_DEBUG_SNAPSHOT',
    status: {
      operations: {
        health: {
          state,
          watchdog: { state: watchdogState, reason: watchdogReason },
          groupLiveness: { state: groupState },
          recovery: recoveryStage ? { lastPlan: { stage: recoveryStage } } : {},
          alerting: { pending, pendingCritical }
        }
      }
    },
    heartbeat: {
      health: { state, watchdogState, watchdogReason, groupState },
      recovery: { stage: recoveryStage },
      alerts: { pending, pendingCritical }
    }
  };
}

test('debug health assessment stays healthy for a running healthy bot and treats restart count as evidence only', () => {
  const assessment = assessDebugHealth(
    snapshotWithHealth(),
    [{ seq: 1, severity: 'info', event: 'HEARTBEAT' }],
    { processRunning: true, restartCount: 7 }
  );

  assert.equal(assessment.state, 'HEALTHY');
  assert.deepEqual(assessment.reasons, []);
  assert.equal(assessment.evidence.restartCount, 7);
  assert.equal(assessment.actionAuthority, false);
  assert.equal(assessment.gameplayActionAuthority, false);
  assert.equal(assessment.codeRepairAuthority, false);
});

test('debug health assessment marks explicit degraded and restart-required evidence critical', () => {
  const assessment = assessDebugHealth(
    snapshotWithHealth({
      state: 'DEGRADED',
      watchdogState: 'DEGRADED',
      watchdogReason: 'NO_RUNTIME_PROGRESS',
      groupState: 'DEGRADED',
      recoveryStage: 'HOST_RESTART',
      pending: 2,
      pendingCritical: 1
    }),
    [{ seq: 9, severity: 'error', event: 'RUNTIME_WATCHDOG_STATE_CHANGED' }],
    { processRunning: false, restartCount: 4 }
  );

  assert.equal(assessment.state, 'CRITICAL');
  for (const reason of [
    'HOST_PROCESS_NOT_RUNNING',
    'RUNTIME_HEALTH_DEGRADED',
    'WATCHDOG_DEGRADED',
    'GROUP_LIVENESS_DEGRADED',
    'RECOVERY_HOST_RESTART_REQUIRED',
    'CRITICAL_ALERT_PENDING',
    'RECENT_ERROR_EVENT'
  ]) assert.equal(assessment.reasons.includes(reason), true, reason);
  assert.equal(assessment.evidence.watchdogReason, 'NO_RUNTIME_PROGRESS');
});

test('watch states and warning events classify as degraded without inventing a critical failure', () => {
  const assessment = assessDebugHealth(
    snapshotWithHealth({ state: 'WATCH', watchdogState: 'WATCH' }),
    [{ seq: 2, severity: 'warn', event: 'PARTY_OBSERVATION_DELAYED' }],
    { processRunning: true }
  );

  assert.equal(assessment.state, 'DEGRADED');
  assert.equal(assessment.reasons.includes('RUNTIME_HEALTH_WATCH'), true);
  assert.equal(assessment.reasons.includes('WATCHDOG_WATCH'), true);
  assert.equal(assessment.reasons.includes('RECENT_WARNING_EVENT'), true);
  assert.equal(assessment.reasons.includes('RECENT_ERROR_EVENT'), false);
});

test('telemetry exporter stores the bounded host assessment inside the existing snapshot contract', async () => {
  let posted = null;
  const exporter = new DebugTelemetryExporter({
    now: () => 50000,
    endpoint: 'https://example.supabase.co/functions/v1/bot-debug-ingest',
    token: 'host-secret',
    botId: 'pi-main',
    fetch: async (_url, request) => {
      posted = JSON.parse(request.body);
      return { ok: true, status: 200 };
    }
  });
  const botClient = {
    debugSnapshot: async () => snapshotWithHealth({ state: 'WATCH', watchdogState: 'WATCH', watchdogReason: 'STALE_SNAPSHOT' }),
    debugEvents: async () => ({ events: [{ seq: 1, severity: 'warn', event: 'WATCH' }] })
  };

  const result = await exporter.tick(botClient, { processRunning: true, restartCount: 2, harnessStartedAt: 1000 });
  assert.equal(result.sent, true);
  assert.equal(result.healthState, 'DEGRADED');
  assert.equal(posted.schemaVersion, 1);
  assert.equal(posted.snapshot.type, 'AIO_V3_DEBUG_SNAPSHOT');
  assert.equal(posted.snapshot.hostAssessment.type, 'AIO_V3_DEBUG_HEALTH_ASSESSMENT');
  assert.equal(posted.snapshot.hostAssessment.state, 'DEGRADED');
  assert.equal(posted.snapshot.hostAssessment.evidence.restartCount, 2);
  assert.equal(posted.snapshot.hostAssessment.actionAuthority, false);
  assert.equal(posted.snapshot.hostAssessment.codeRepairAuthority, false);
  assert.equal(exporter.status().lastPayload.healthState, 'DEGRADED');
});
