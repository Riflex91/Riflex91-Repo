'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_MINIMUM_VERSION,
  compareNumericVersions,
  validateLiveSessionSet
} = require('../src/ops/live-recovery-log-validator');

function event(seq, ts, eventName, reason = null, data = {}) {
  return {
    seq,
    ts: new Date(ts).toISOString(),
    runId: 'test-run',
    version: DEFAULT_MINIMUM_VERSION,
    severity: 'info',
    component: 'test',
    event: eventName,
    character: null,
    taskId: null,
    reason,
    reasonDetails: null,
    data
  };
}

function session(name, ctype, events, overrides = {}) {
  const version = overrides.version || DEFAULT_MINIMUM_VERSION;
  return {
    schemaVersion: 1,
    kind: 'aio-v3-session-log',
    sessionId: `session-${name}`,
    startedAt: 1000,
    generatedAt: 9000,
    durationMs: 8000,
    version,
    summary: {
      version,
      character: { name, ctype, map: 'main' },
      supervisor: { state: 'HEALTHY', reasons: [] }
    },
    eventLog: {
      completeRetainedLog: overrides.completeRetainedLog !== false,
      events
    }
  };
}

function passingSet() {
  const base = Date.UTC(2026, 8, 16, 20, 0, 0);
  const objective = {
    id: 'regroup-1',
    kind: 'TEAM_REGROUP',
    leaderName: 'My_Ranger1',
    map: 'main',
    x: -87,
    y: 673
  };
  const leader = session('My_Ranger1', 'ranger', [
    event(1, base + 100, 'TEAM_CROSS_MAP_REGROUP_REQUIRED', 'CROSS_MAP_REGROUP_REQUIRED'),
    event(2, base + 200, 'ALPHA28_TEAM_REGROUP_OBJECTIVE_PUBLISHED', 'TEAM_MAP_SPLIT_CONTROLLED_REGROUP', {
      objective,
      memberMaps: [
        { name: 'My_Ranger1', map: 'main' },
        { name: 'My_Ranger2', map: 'winterland' },
        { name: 'My_Ranger3', map: 'winterland' }
      ]
    }),
    event(3, base + 4200, 'FARMER_TARGET_SELECTED', 'PLANNER_TOP_SAFE_LIVE_TARGET'),
    event(4, base + 4300, 'FARMER_ATTACK_REQUESTED', 'TARGET_IN_RANGE')
  ]);
  const follower2 = session('My_Ranger2', 'ranger', [
    event(1, base + 500, 'ALPHA28_CROSS_MAP_OBJECTIVE_RECEIVED', 'VALIDATED_LEADER_REGROUP_OBJECTIVE', { kind: 'TEAM_REGROUP' }),
    event(2, base + 700, 'ALPHA28_TEAM_REGROUP_STARTED', 'CONTROLLED_TEAM_REGROUP_TRAVEL'),
    event(3, base + 3000, 'ALPHA28_TEAM_REGROUP_COMPLETED', 'ARRIVAL_VERIFIED'),
    event(4, base + 4200, 'FARMER_TARGET_SELECTED', 'PLANNER_TOP_SAFE_LIVE_TARGET'),
    event(5, base + 4400, 'FARMER_ATTACK_REQUESTED', 'TARGET_IN_RANGE')
  ]);
  const follower3 = session('My_Ranger3', 'ranger', [
    event(1, base + 550, 'ALPHA28_CROSS_MAP_OBJECTIVE_RECEIVED', 'VALIDATED_LEADER_REGROUP_OBJECTIVE', { kind: 'TEAM_REGROUP' }),
    event(2, base + 750, 'ALPHA28_TEAM_REGROUP_STARTED', 'CONTROLLED_TEAM_REGROUP_TRAVEL'),
    event(3, base + 3500, 'ALPHA28_TEAM_REGROUP_COMPLETED', 'ARRIVAL_VERIFIED'),
    event(4, base + 4250, 'FARMER_TARGET_SELECTED', 'PLANNER_TOP_SAFE_LIVE_TARGET'),
    event(5, base + 4450, 'FARMER_ATTACK_REQUESTED', 'TARGET_IN_RANGE')
  ]);
  const merchant = session('My_Merchant', 'merchant', [
    event(1, base + 1000, 'MERCHANT_SERVICE_PLAN', 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED'),
    event(2, base + 1500, 'LIVE_POTION_VENDOR_ARRIVAL_ATTESTED', 'VERIFIED_SERVICE_TRAVEL_CONTINUES_TO_BUY', { itemName: 'mpot0' }),
    event(3, base + 1600, 'LIVE_POTION_RESTOCK_COMMITTED', 'CURRENT_DELIVERY_DEFICIT_PURCHASED', { itemName: 'mpot0', quantity: 4203 })
  ]);
  return [leader, follower2, follower3, merchant];
}

test('numeric alpha versions compare by release numbers', () => {
  assert.equal(compareNumericVersions('3.0.0-alpha.20.55', DEFAULT_MINIMUM_VERSION), -1);
  assert.equal(compareNumericVersions(DEFAULT_MINIMUM_VERSION, DEFAULT_MINIMUM_VERSION), 0);
  assert.equal(compareNumericVersions('3.0.0-alpha.20.103', DEFAULT_MINIMUM_VERSION), 1);
});

test('passes only after both follower regroups complete, combat resumes, and merchant commits restock', () => {
  const result = validateLiveSessionSet(passingSet());
  assert.equal(result.passed, true);
  assert.deepEqual(result.group.splitFollowers.sort(), ['My_Ranger2', 'My_Ranger3']);
  assert.equal(result.sessions.filter((row) => row.role === 'farmer').every((row) => row.passed), true);
  assert.equal(result.sessions.find((row) => row.role === 'merchant').passed, true);
});

test('fails the pre-fix farmer pattern where regroup is published but followers never receive it', () => {
  const sessions = passingSet();
  sessions[1].eventLog.events = [
    event(1, Date.UTC(2026, 8, 16, 20, 0, 1), 'TEAM_CROSS_MAP_REGROUP_REQUIRED', 'CROSS_MAP_REGROUP_REQUIRED'),
    event(2, Date.UTC(2026, 8, 16, 20, 0, 2), 'SUPERVISOR_STATE_CHANGED', 'NO_PROGRESS_SAFE_MODE')
  ];
  const result = validateLiveSessionSet(sessions);
  assert.equal(result.passed, false);
  assert.ok(result.failures.some((row) => row.scope === 'My_Ranger2' && row.id === 'regroup-received-started-completed'));
  assert.ok(result.failures.some((row) => row.scope === 'My_Ranger2' && row.id === 'no-progress-safe-mode-absent'));
});

test('fails the pre-fix merchant vendor loop when arrival never continues to a purchase commit', () => {
  const sessions = passingSet();
  const merchant = sessions[3];
  const base = Date.UTC(2026, 8, 16, 20, 0, 0);
  merchant.eventLog.events = [
    event(1, base + 1000, 'MERCHANT_SERVICE_PLAN', 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED'),
    event(2, base + 1500, 'ALPHA27_SERVICE_TRAVEL_COMPLETED', 'SERVICE_DESTINATION_REACHED', { requestedDestination: 'mpot0' }),
    event(3, base + 1700, 'ALPHA27_SERVICE_TRAVEL_COMPLETED', 'SERVICE_DESTINATION_REACHED', { requestedDestination: 'mpot0' }),
    event(4, base + 1900, 'ALPHA27_SERVICE_TRAVEL_COMPLETED', 'SERVICE_DESTINATION_REACHED', { requestedDestination: 'mpot0' })
  ];
  const result = validateLiveSessionSet(sessions);
  assert.equal(result.passed, false);
  assert.ok(result.failures.some((row) => row.scope === 'My_Merchant' && row.id === 'verified-vendor-arrival-observed'));
  assert.ok(result.failures.some((row) => row.scope === 'My_Merchant' && row.id === 'potion-restock-commit-observed'));
});

test('fails when combat happened before regroup but not after the party recovered', () => {
  const sessions = passingSet();
  const base = Date.UTC(2026, 8, 16, 20, 0, 0);
  sessions[0].eventLog.events = sessions[0].eventLog.events.filter((row) => !['FARMER_TARGET_SELECTED', 'FARMER_ATTACK_REQUESTED'].includes(row.event));
  sessions[0].eventLog.events.unshift(
    event(0, base + 50, 'FARMER_TARGET_SELECTED', 'PLANNER_TOP_SAFE_LIVE_TARGET'),
    event(0.5, base + 60, 'FARMER_ATTACK_REQUESTED', 'TARGET_IN_RANGE')
  );
  const result = validateLiveSessionSet(sessions);
  assert.equal(result.passed, false);
  assert.ok(result.failures.some((row) => row.scope === 'My_Ranger1' && row.id === 'attack-requested-after-recovery'));
});

test('fails incomplete retained logs because absence of recovery evidence cannot be proven', () => {
  const sessions = passingSet();
  sessions[2].eventLog.completeRetainedLog = false;
  const result = validateLiveSessionSet(sessions);
  assert.equal(result.passed, false);
  assert.ok(result.failures.some((row) => row.scope === 'My_Ranger3' && row.id === 'complete-retained-log'));
});

test('rejects alpha.20.55 even if synthetic recovery evidence is present', () => {
  const sessions = passingSet().map((row) => ({
    ...row,
    version: '3.0.0-alpha.20.55',
    summary: { ...row.summary, version: '3.0.0-alpha.20.55' }
  }));
  const result = validateLiveSessionSet(sessions);
  assert.equal(result.passed, false);
  assert.ok(result.failures.filter((row) => row.id === 'minimum-version').length >= 4);
});
