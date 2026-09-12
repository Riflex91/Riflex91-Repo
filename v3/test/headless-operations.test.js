'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventLog } = require('../src/core/event-log');
const { WorldModel, EvidenceKind } = require('../src/world/world-model');
const { TelemetryOutbox } = require('../src/ops/telemetry-outbox');
const { ControlGateway } = require('../src/ops/control-gateway');
const { StateReplica, HeadlessHealth } = require('../src/ops/state-replica');
const { HeadlessOperations } = require('../src/ops/headless-operations');

test('TelemetryOutbox is bounded, ordered and dashboard failure independent', () => {
  let now = 1000;
  const log = new EventLog({ capacity: 1000, now: () => ++now, runId: 'headless-telemetry' });
  const outbox = new TelemetryOutbox({ capacity: 100 });
  for (let i = 0; i < 125; i++) log.emit({ component: 'test', event: 'E', data: { i } });
  assert.equal(outbox.capture(log), 125);
  assert.equal(outbox.status().queued, 100);
  assert.equal(outbox.status().dropped, 25);
  const first = outbox.drain(5);
  assert.equal(first.length, 5);
  assert.equal(first[0].data.i, 25);
  assert.equal(first[4].data.i, 29);
});

test('ControlGateway deduplicates, expires and blocks every risk-increasing remote action by default', () => {
  let now = 10000;
  const calls = [];
  const gateway = new ControlGateway({ now: () => now, execute: (action, params) => { calls.push({ action, params }); return action === 'SHOW_STATUS' ? { huge: 'x'.repeat(10000) } : 'ok'; } });
  const safe = gateway.submit({ commandId: 'c1', action: 'SET_MODE', params: { mode: 'shadow' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(safe.status, 'EXECUTED');
  assert.equal(calls.length, 1);
  const duplicate = gateway.submit({ commandId: 'c1', action: 'SET_MODE', params: { mode: 'shadow' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(duplicate.duplicate, true);
  assert.equal(calls.length, 1);

  for (const [id, action, params] of [
    ['c2', 'SET_MODE', { mode: 'active' }],
    ['c3', 'SET_FARMER_ENABLED', { enabled: true }],
    ['c4', 'SET_TARGET_POLICY', { policy: 'allow' }],
    ['c5', 'REMOVE_TARGET_EXCLUSION', { value: 'automatron' }],
    ['c6', 'APPROVE_MONSTER_CONTENT', { mtype: 'newboss' }]
  ]) {
    const result = gateway.submit({ commandId: id, action, params, issuedAt: 9000, expiresAt: 11000 });
    assert.equal(result.status, 'REJECTED');
    assert.equal(result.reason, 'ELEVATED_CONTROL_DISABLED');
  }

  const unknown = gateway.submit({ commandId: 'c7', action: 'EVAL_JAVASCRIPT', params: {}, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(unknown.status, 'REJECTED');
  assert.equal(unknown.reason, 'ACTION_NOT_ALLOWED');

  const statusResult = gateway.submit({ commandId: 'c-status', action: 'SHOW_STATUS', params: {}, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(statusResult.status, 'EXECUTED');
  assert.equal(statusResult.value.huge.length, 10000);
  const statusDuplicate = gateway.submit({ commandId: 'c-status', action: 'SHOW_STATUS', params: {}, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(statusDuplicate.duplicate, true);
  assert.equal(statusDuplicate.value, undefined);

  now = 12000;
  const expired = gateway.submit({ commandId: 'c8', action: 'SHOW_STATUS', params: {}, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(expired.status, 'EXPIRED');
  assert.equal(calls.length, 2);
});

test('ControlGateway can execute elevated actions only after explicit host opt-in', () => {
  const calls = [];
  const gateway = new ControlGateway({
    now: () => 10000,
    allowElevated: true,
    execute: (action, params) => { calls.push({ action, params }); return 'ok'; }
  });
  const result = gateway.submit({ commandId: 'e1', action: 'SET_MODE', params: { mode: 'active' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(result.status, 'EXECUTED');
  assert.equal(calls.length, 1);
});

test('StateReplica coalesces to the newest bounded world snapshot', () => {
  let now = 1000;
  const world = new WorldModel({ now: () => now });
  const replica = new StateReplica({ now: () => now, maxBytes: 900000 });
  world.observeEntity('monster', 'goo', { maps: ['main'] }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  assert.equal(replica.capture(world), true);
  const firstRevision = replica.peek().revision;
  now += 100;
  world.observeEntity('monster', 'bee', { maps: ['main'] }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  assert.equal(replica.capture(world), true);
  const latest = replica.take();
  assert.ok(latest.revision > firstRevision);
  assert.match(latest.serialized, /bee/);
  assert.equal(replica.peek(), null);
});

test('StateReplica contains serialization faults instead of breaking operations', () => {
  const replica = new StateReplica();
  const broken = { revision: 1, serialize: () => { throw new Error('broken-state'); } };
  assert.equal(replica.capture(broken), false);
  assert.equal(replica.status().captureErrors, 1);
  assert.match(replica.status().lastError, /broken-state/);
});

test('HeadlessHealth exposes supervisor freshness states without DOM assumptions', () => {
  let now = 1000;
  const health = new HeadlessHealth({ now: () => now, watchAfterMs: 2000, degradedAfterMs: 5000 });
  health.noteStart();
  health.noteTick();
  health.noteSnapshot();
  assert.equal(health.status().state, 'HEALTHY');
  now += 3000;
  assert.equal(health.status().state, 'WATCH');
  now += 3000;
  assert.equal(health.status().state, 'DEGRADED');
  assert.equal(health.status().domRequired, false);
  assert.equal(health.status().dashboardRequired, false);
});

test('HeadlessOperations safe control works with no DOM or game_log and always emits audit telemetry', () => {
  let now = 10000;
  const log = new EventLog({ now: () => now, runId: 'ops-test' });
  const runtime = {
    log,
    world: new WorldModel({ now: () => now }),
    lastHeartbeat: now,
    lastSnapshot: { observedAt: now },
    startedAt: now,
    setMode: (mode) => mode,
    setFarmerEnabled: (enabled) => enabled,
    setFarmerTargetPolicy: (policy) => policy,
    addFarmerTargetExclusion: (value) => value,
    removeFarmerTargetExclusion: () => true,
    combatRisk: { approveMonsterType: () => ({}), quarantineMonsterType: () => ({}) },
    persistence: { maybeSave: () => true },
    status: () => ({ mode: 'shadow' })
  };
  const ops = new HeadlessOperations({ runtime, log, now: () => now });
  const result = ops.submit({ commandId: 'remote-1', action: 'SET_MODE', params: { mode: 'shadow' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(result.status, 'EXECUTED');
  const events = ops.drainTelemetry(20);
  assert.ok(events.some((event) => event.event === 'CONTROL_COMMAND_EXECUTED'));
  const status = ops.status();
  assert.equal(status.transport, 'host-provided');
  assert.equal(status.health.state, 'HEALTHY');
  assert.equal(status.health.domRequired, false);
  assert.equal(status.health.gameLogRequired, false);
  assert.equal(status.health.dashboardRequired, false);
});
