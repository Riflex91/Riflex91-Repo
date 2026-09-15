'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GroupLivenessMonitor } = require('../src/ops/group-liveness');

function runtimeWith(activeCharacters, now = 20000) {
  const roster = [
    { name: 'My_Merchant', ctype: 'merchant', level: 56, map: 'main' },
    { name: 'My_Ranger1', ctype: 'ranger', level: 59, map: 'main' },
    { name: 'My_Ranger2', ctype: 'ranger', level: 59, map: 'main' },
    { name: 'My_Ranger3', ctype: 'ranger', level: 59, map: 'main' }
  ];
  return {
    now: () => now,
    startedAt: 0,
    root: { get_active_characters: () => ({ ...activeCharacters }) },
    lastSnapshot: {
      character: { name: 'My_Merchant', ctype: 'merchant', level: 56, map: 'main', rip: false },
      party: roster.slice(1).map((row) => ({ name: row.name, type: row.ctype, level: row.level }))
    },
    characterRegistry: {
      status: () => ({
        characters: roster.map((row) => ({
          ...row,
          presence: 'ONLINE',
          online: true,
          available: true,
          dead: false,
          observationAgeMs: row.name === 'My_Merchant' ? 0 : 500,
          primarySource: row.name === 'My_Merchant' ? 'self' : 'visible'
        }))
      })
    }
  };
}

test('visible party members are degraded when their code runtimes are not active', () => {
  const runtime = runtimeWith({ My_Merchant: 'active' });
  const monitor = new GroupLivenessMonitor({ now: runtime.now, runtimeGraceMs: 15000 });
  const status = monitor.evaluate(runtime);

  assert.equal(status.state, 'DEGRADED');
  assert.equal(status.fourCharacterReady, false);
  assert.deepEqual(status.runtimeInactiveMembers.sort(), ['My_Ranger1', 'My_Ranger2', 'My_Ranger3']);
  assert.ok(status.reasons.includes('PARTY_MEMBER_RUNTIME_INACTIVE'));
  assert.equal(status.runtimeActiveCount, 1);
});

test('four-character health requires all four running code sessions after grace', () => {
  const runtime = runtimeWith({
    My_Merchant: 'active',
    My_Ranger1: 'code',
    My_Ranger2: 'active',
    My_Ranger3: 'code'
  });
  const monitor = new GroupLivenessMonitor({ now: runtime.now, runtimeGraceMs: 15000 });
  const status = monitor.evaluate(runtime);

  assert.equal(status.state, 'HEALTHY');
  assert.equal(status.fourCharacterReady, true);
  assert.deepEqual(status.runtimeInactiveMembers, []);
  assert.equal(status.runtimeActiveCount, 4);
});

test('missing active-character API does not manufacture runtime-dead evidence', () => {
  const runtime = runtimeWith({ My_Merchant: 'active' });
  delete runtime.root.get_active_characters;
  const monitor = new GroupLivenessMonitor({ now: runtime.now, runtimeGraceMs: 0 });
  const status = monitor.evaluate(runtime);

  assert.equal(status.runtimeEvidenceRequired, false);
  assert.equal(status.observedRuntimeNames, null);
  assert.deepEqual(status.runtimeInactiveMembers, []);
});