'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionMonitor, EventLog } = require('../src');

test('copied session log includes learning state and condensed diagnostic signals', () => {
  let now = 1000;
  const log = new EventLog({ capacity: 50, now: () => ++now });
  log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', severity: 'info' });
  log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', severity: 'info' });
  log.emit({ component: 'safe-travel', event: 'TRAVEL_FAILED', severity: 'warn', reason: 'NO_PROGRESS' });

  const runtime = {
    log,
    currentPartyFingerprint: { key: 'party-1', classes: ['merchant', 'priest', 'ranger', 'warrior'] },
    currentEncounterFingerprint: { key: 'encounter-1', monster: 'goo' },
    strategicBrainV2: { status: () => ({ quality: { state: 'stable' }, samples: 42 }) },
    adaptivePullLearner: { status: () => ({ mode: 'bounded-adaptive-pull-learning-v1', records: 3 }) },
    encounterLifecycle: { status: () => ({ state: 'IDLE', history: 4 }) },
    partyPerformance: { status: (limit) => ({ limit, records: [{ key: 'x' }] }) },
    status: () => ({
      version: '3.0.0-test',
      running: true,
      mode: 'active',
      character: { name: 'R1', ctype: 'ranger', level: 80, map: 'main', hp: 100, max_hp: 100, mp: 50, max_mp: 50 },
      inventory: {}, economy: {}, travel: {}, supervisor: {}, party: {}, gearProgression: {}
    })
  };

  const monitor = new SessionMonitor({ runtime, log, now: () => now });
  const bundle = JSON.parse(monitor.exportSession());

  assert.equal(bundle.brain.quality.state, 'stable');
  assert.equal(bundle.learning.partyFingerprint.key, 'party-1');
  assert.equal(bundle.learning.encounterFingerprint.key, 'encounter-1');
  assert.equal(bundle.learning.partyPerformance.limit, 128);
  assert.equal(bundle.learning.adaptivePull.records, 3);
  assert.equal(bundle.diagnosticSignals.priority.length, 1);
  assert.equal(bundle.diagnosticSignals.priority[0].event, 'TRAVEL_FAILED');
  const repeated = bundle.diagnosticSignals.repeated.find((row) => row.event === 'COMMAND_EXECUTED');
  assert.equal(repeated.count, 2);
});
