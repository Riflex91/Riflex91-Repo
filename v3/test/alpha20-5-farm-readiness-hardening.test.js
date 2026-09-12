'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlledFarmerLoot } = require('../src/farmer/controlled-farmer-loot');
const { ControlledAutoRespawn } = require('../src/ops/controlled-auto-respawn');

function snap({ rip = false, ctype = 'ranger' } = {}) {
  return {
    character: {
      name: 'FarmerA', ctype, map: 'main', x: 0, y: 0,
      hp: rip ? 0 : 1000, max_hp: 1000, mp: 500, max_mp: 500,
      gold: 100, rip, isize: 4, inventory: [null, null, null, null]
    },
    entities: [], objects: [], party: []
  };
}

function recorder() {
  const events = [];
  return { events, emit(entry) { events.push(entry); } };
}

test('loot and get_chests preserve the owning parent execution context', () => {
  let now = 1000;
  let lootCalls = 0;
  const parent = {
    get_chests() {
      assert.equal(this, parent);
      return { chest1: {} };
    },
    loot() {
      assert.equal(this, parent);
      lootCalls += 1;
    }
  };
  const root = { parent };
  const loot = new ControlledFarmerLoot({ root, now: () => now, getMode: () => 'active' });
  const result = loot.tick(snap());
  assert.equal(result.executed, true);
  assert.equal(lootCalls, 1);
  assert.equal(result.requestId, 1);
});

test('respawn preserves the owning parent execution context', () => {
  let now = 0;
  let respawnCalls = 0;
  const parent = {
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main', rip: true },
    respawn() {
      assert.equal(this, parent);
      respawnCalls += 1;
    }
  };
  const root = { parent };
  const respawn = new ControlledAutoRespawn({ root, now: () => now, getMode: () => 'active', deathGraceMs: 500 });
  respawn.tick(snap({ rip: true }));
  now = 500;
  const result = respawn.tick(snap({ rip: true }));
  assert.equal(result.executed, true);
  assert.equal(respawnCalls, 1);
  assert.equal(result.deathSequence, 1);
  assert.equal(result.attempt, 1);
});

test('a late rejection from an old respawn request cannot contaminate a newer death state', async () => {
  let now = 0;
  let rejectOld;
  const oldPromise = new Promise((resolve, reject) => { rejectOld = reject; });
  const log = recorder();
  const root = {
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main', rip: true },
    respawn: () => oldPromise
  };
  root.parent = root;
  const respawn = new ControlledAutoRespawn({ root, now: () => now, log, getMode: () => 'active', deathGraceMs: 500, retryMs: 1000 });

  respawn.tick(snap({ rip: true }));
  now = 500;
  const first = respawn.tick(snap({ rip: true }));
  assert.equal(first.deathSequence, 1);
  assert.equal(first.attempt, 1);

  root.character.rip = false;
  now = 600;
  respawn.tick(snap({ rip: false }));
  root.character.rip = true;
  now = 700;
  respawn.tick(snap({ rip: true }));
  assert.equal(respawn.status().deathSequence, 2);
  assert.equal(respawn.status().lastError, null);

  rejectOld(new Error('late old request failure'));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(respawn.status().deathSequence, 2);
  assert.equal(respawn.status().lastError, null);
  const rejected = log.events.find((event) => event.event === 'AUTO_RESPAWN_CALL_REJECTED');
  assert.ok(rejected);
  assert.equal(rejected.data.deathSequence, 1);
  assert.equal(rejected.data.attempt, 1);
});
