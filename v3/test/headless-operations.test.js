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

test('ControlGateway deduplicates, expires and blocks elevated remote actions by default', () => {
  let now = 10000;
  const calls = [];
  const gateway = new ControlGateway({ now: () => now, execute: (action, params) => { calls.push({ action, params }); return 'ok'; } });
  const safe = gateway.submit({ commandId: 'c1', action: 'SET_MODE', params: { mode: 'shadow' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(safe.status, 'EXECUTED');
  assert.equal(calls.length, 1);
  const duplicate = gateway.submit({ commandId: 'c1', action: 'SET_MODE', params: { mode: 'shadow' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(duplicate.duplicate, true);
  assert.equal(calls.length, 1);
  const elevated = gateway.submit({ commandId: 'c2', action: 'SET_MODE', params: { mode: 'active' }, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(elevated.status, 'REJECTED');
  assert.equal(elevated.reason, 'ELEVATED_CONTROL_DISABLED');
  now = 12000;
  const expired = gateway.submit({ commandId: 'c3', action: 'SHOW_STATUS', params: {}, issuedAt: 9000, expiresAt: 11000 });
  assert.equal(expired.status, 'EXPIRED');
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
  ops.capture(runtime.world);
  const events = ops.drainTelemetry(20);
  assert.ok(events.some((event) => event.event === 'CONTROL_COMMAND_EXECUTED'));
  assert.equal(ops.status().transport, 'host-provided');
});
