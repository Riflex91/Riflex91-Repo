'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AccountCharacterTransport } = require('../src/party/account-character-transport');
const { ContentDriftStorageHotfix } = require('../src/content/content-drift-storage-hotfix');
const { ContentDriftSemanticRecovery } = require('../src/content/content-drift-semantic-recovery');
const { WorldModel } = require('../src/world/world-model');
const { ContentSafetyGate, ContentDisposition } = require('../src/farmer/content-safety');

function rootForTransport(active) {
  const calls = { direct: [], cm: [] };
  const root = {
    character: { name: 'My_Merchant' },
    get_active_characters: () => ({ ...active }),
    command_character(name, code) { calls.direct.push([name, code]); },
    send_cm(name, payload) { calls.cm.push([name, payload]); }
  };
  return { root, calls };
}

test('account transport never calls command_character for a trusted but locally unobserved character', async () => {
  const { root, calls } = rootForTransport({ My_Merchant: 'self' });
  const transport = new AccountCharacterTransport({
    root,
    trustedNames: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']
  });
  const result = await transport.send('My_Ranger3', { hello: true }, { receiver: '__TEST_RECEIVER', sender: 'My_Merchant' });
  assert.equal(result.transport, 'send_cm');
  assert.equal(calls.direct.length, 0);
  assert.equal(calls.cm.length, 1);
  assert.equal(transport.status().stats.directSkippedUnobserved, 1);
});

test('account transport still uses command_character when target is explicitly observed active', async () => {
  const { root, calls } = rootForTransport({ My_Merchant: 'self', My_Ranger1: 'code' });
  const transport = new AccountCharacterTransport({
    root,
    trustedNames: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']
  });
  const result = await transport.send('My_Ranger1', { hello: true }, { receiver: '__TEST_RECEIVER', sender: 'My_Merchant' });
  assert.equal(result.transport, 'command_character');
  assert.equal(calls.direct.length, 1);
  assert.equal(calls.cm.length, 0);
});

test('content drift storage failure preserves every semantic record and capacity', () => {
  let writes = 0;
  const records = new Map(Array.from({ length: 900 }, (_, i) => [`monsters:m${i}`, {
    category: 'monsters', id: `m${i}`, lifecycle: i % 3 === 0 ? 'QUARANTINED' : 'OBSERVED'
  }]));
  const monitor = {
    records,
    capacity: 2048,
    stats: { saveErrors: 0 },
    save() {
      writes += 1;
      this.stats.saveErrors += 1;
      return false;
    }
  };
  const runtime = { contentDrift: monitor, now: () => 1234, log: null };
  const hotfix = new ContentDriftStorageHotfix(runtime);
  assert.equal(monitor.save({ force: true }), false);
  assert.equal(records.size, 900);
  assert.equal(monitor.capacity, 2048);
  assert.equal(hotfix.status().sessionWriteBlocked, true);
  assert.equal(hotfix.status().stats.semanticCompactionsPrevented, 1);
  assert.equal(monitor.save({ force: true }), false);
  assert.equal(writes, 1);
  assert.equal(records.size, 900);
});

function recoveryFixture() {
  let now = 1000;
  const world = new WorldModel({ now: () => now });
  const contentSafety = new ContentSafetyGate({ now: () => now });
  const records = new Map();
  const monitor = { records, stats: { revalidated: 0 } };
  const runtime = {
    world,
    contentDrift: monitor,
    combatRisk: { contentSafety },
    now: () => now,
    log: null
  };
  return {
    world,
    contentSafety,
    monitor,
    runtime,
    setNow(value) { now = value; }
  };
}

function falseNoveltyRecord(id, firstSeenAt, extra = {}) {
  return {
    schemaVersion: 1,
    key: `monsters:${id}`,
    category: 'monsters',
    id,
    lifecycle: 'QUARANTINED',
    fingerprint: `fp-${id}`,
    baselineFingerprint: `fp-${id}`,
    previousFingerprint: null,
    samples: 1,
    changeCount: 0,
    firstSeenAt,
    lastSeenAt: firstSeenAt,
    ...extra
  };
}

test('semantic recovery restores only historical monster falsely recreated as novelty', () => {
  const f = recoveryFixture();
  f.world.observeEntity('monster', 'crab', { hp: 400 });
  f.setNow(100000);
  f.monitor.records.set('monsters:crab', falseNoveltyRecord('crab', 100000));
  f.contentSafety.quarantine(f.world, 'crab');

  f.setNow(100100);
  const recovery = new ContentDriftSemanticRecovery(f.runtime, { minHistoricalLeadMs: 15000 });
  const result = recovery.beforeTick();
  assert.deepEqual(result.recovered, ['crab']);
  const decision = f.contentSafety.evaluate({ mtype: 'crab' }, f.world);
  assert.equal(decision.allowed, true);
  assert.equal(decision.disposition, ContentDisposition.LEGACY_ALLOWED);
  assert.equal(f.monitor.records.get('monsters:crab').lifecycle, 'OBSERVED');
});

test('semantic recovery keeps genuinely new, changed, dangerous and manual quarantines blocked', () => {
  const f = recoveryFixture();

  f.setNow(90000);
  f.world.observeEntity('monster', 'oldchanged', { hp: 100 });
  f.world.observeEntity('monster', 'redfairy', { hp: 100 });
  f.setNow(99500);
  f.world.observeEntity('monster', 'brandnew', { hp: 100 });

  f.setNow(100000);
  f.monitor.records.set('monsters:brandnew', falseNoveltyRecord('brandnew', 100000));
  f.monitor.records.set('monsters:oldchanged', falseNoveltyRecord('oldchanged', 100000, {
    previousFingerprint: 'old-fp', changeCount: 1
  }));
  f.monitor.records.set('monsters:redfairy', falseNoveltyRecord('redfairy', 100000));
  f.contentSafety.quarantine(f.world, 'brandnew');
  f.contentSafety.quarantine(f.world, 'oldchanged');
  f.contentSafety.quarantine(f.world, 'redfairy');

  // Manual quarantine sufficiently later than the false-novelty timestamp must
  // not be reclassified as the historical auto-quarantine bug.
  f.setNow(200000);
  f.world.observeEntity('monster', 'manual', { hp: 100 });
  f.monitor.records.set('monsters:manual', falseNoveltyRecord('manual', 100000));
  f.contentSafety.quarantine(f.world, 'manual');

  f.setNow(200100);
  const recovery = new ContentDriftSemanticRecovery(f.runtime, {
    minHistoricalLeadMs: 15000,
    maxAutoQuarantineLagMs: 30000
  });
  recovery.beforeTick();

  for (const id of ['brandnew', 'oldchanged', 'redfairy', 'manual']) {
    assert.equal(f.contentSafety.evaluate({ mtype: id }, f.world).allowed, false, id);
  }
  assert.equal(recovery.status().stats.recovered, 0);
});
