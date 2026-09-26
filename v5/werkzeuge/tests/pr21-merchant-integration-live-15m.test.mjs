import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('werkzeuge/pr21-merchant-integration-live-15m.js', 'utf8');
const authorization = JSON.parse(fs.readFileSync('roadmap/pr21-merchant-live-execution-authorization.json', 'utf8'));

function sandbox({ health = 'HEALTHY', dropped = 0, captureErrors = 0 } = {}) {
  let clock = 0;
  class FakeDate extends Date {
    static now() { return clock; }
    constructor(value) { super(value === undefined ? clock : value); }
  }
  const operations = {
    status: () => ({
      contractVersion: 3,
      captureErrors,
      telemetry: { dropped, queued: 0 },
      control: { allowElevated: false },
      health: {
        state: health,
        snapshotAgeMs: 1000,
        heartbeatAgeMs: 1000
      },
      reliability: { rawGameplayActionAuthority: false }
    }),
    hostHeartbeat: () => ({ type: 'heartbeat', observedAt: clock }),
    reconciliationStatus: () => ({
      schemaVersion: 1,
      observedClean: true,
      blockers: [],
      actionAuthority: false,
      rawGameplayActionAuthority: false
    }),
    peekTelemetry: () => []
  };
  const runtime = { timer: {}, status: () => ({ running: true }) };
  const box = {
    character: { name: 'MerchantA', ctype: 'merchant', id: 'm1' },
    AIO_V3: { __runtime: runtime, operations },
    performance_trick: () => true,
    Date: FakeDate,
    Promise,
    Object,
    Array,
    JSON,
    Number,
    String,
    Math,
    Set,
    console,
    setTimeout(fn, ms) {
      clock += Math.max(0, Number(ms) || 0);
      queueMicrotask(fn);
      return 1;
    },
    clearTimeout() {},
    queueMicrotask
  };
  box.globalThis = box;
  box.parent = box;
  return box;
}

async function settle() {
  for (let i = 0; i < 6; i += 1) await new Promise(resolve => setImmediate(resolve));
}

test('PR21 live execution authorization is exact checkpoint-scoped and no-write', () => {
  assert.equal(authorization.status, 'AUTHORIZED_ONE_SHOT_EXTERNAL_RUNTIME_CHECKPOINT');
  assert.equal(authorization.checkpointId, 'PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT');
  assert.equal(authorization.scope.testId, 'pr21-merchant-integration-live-15m');
  assert.equal(authorization.scope.targetDurationMs, 900000);
  assert.equal(authorization.scope.sampleIntervalMs, 5000);
  assert.equal(authorization.scope.maximumSampleGapMs, 15000);
  assert.equal(authorization.scope.expectedSamplesForTarget, 181);
  assert.equal(authorization.scope.maximumUses, 1);
  assert.equal(authorization.safety.testHarnessObserverOnly, true);
  assert.equal(authorization.safety.testHarnessGameplayWrites, 0);
  assert.equal(authorization.safety.testHarnessRawWriteCalls, 0);
  assert.equal(authorization.safety.normalRuntimeAllowedByHarness, false);
});

test('PR21 15m package auto-runs 181 clean samples and exposes terminal evidence', async () => {
  const box = sandbox();
  vm.runInNewContext(source, box, { filename: 'pr21-merchant-integration-live-15m.js' });
  await settle();
  const status = box.V5PR21MerchantIntegrationLive15m.status();
  assert.equal(status.status, 'BESTANDEN');
  assert.equal(status.terminal, true);
  assert.equal(status.sampleCount, 181);
  assert.equal(status.durationMs, 900000);
  assert.equal(status.evidence.status, 'EVIDENCE_READY_TARGET_REACHED');
  assert.equal(status.evidence.samples.length, 181);
  assert.equal(status.evidence.activeAuthorityIds[0], 'runtime:merchant');
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.authorityIssuedByHarness, false);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(status.sameIntentRetry, false);
});

test('PR21 live package fails closed immediately on unhealthy runtime', async () => {
  const box = sandbox({ health: 'DEGRADED' });
  vm.runInNewContext(source, box, { filename: 'pr21-merchant-integration-live-15m.js' });
  await settle();
  const status = box.V5PR21MerchantIntegrationLive15m.status();
  assert.equal(status.status, 'NICHT_BESTANDEN');
  assert.equal(status.terminal, true);
  assert.ok(status.blocker.includes('HEALTH_NOT_HEALTHY'));
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
});

test('PR21 live package is observer-only with no direct gameplay or raw transport path', () => {
  for (const marker of [
    'socket.emit(', '.socket.emit(', 'api_call(', 'attack(', 'smart_move(',
    'use_skill(', 'loot(', 'respawn(', 'change_server(', 'craft(', 'exchange(',
    'upgrade(', 'compound(', 'buy(', 'sell(', 'send_item(', 'send_gold(',
    'start_character(', 'command_character('
  ]) assert.equal(source.includes(marker), false, marker);
  for (const marker of [
    "const TEST_ID = 'pr21-merchant-integration-live-15m'",
    "const TARGET_DURATION_MS = 900_000",
    "const SAMPLE_INTERVAL_MS = 5_000",
    "const MAX_SAMPLE_GAP_MS = 15_000",
    "const EXPECTED_SAMPLES = 181",
    "runtimeAuthorityId: 'runtime:merchant'",
    "status: 'EVIDENCE_READY_TARGET_REACHED'",
    'Promise.resolve().then(run)'
  ]) assert.ok(source.includes(marker), marker);
});
