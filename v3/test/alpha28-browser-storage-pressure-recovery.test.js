'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installPartyPersistenceQuotaHotfix } = require('../src/party/party-persistence-quota-hotfix');

function createLocalStorage(entries = {}) {
  const values = new Map(Object.entries(entries).map(([key, value]) => [String(key), String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    values
  };
}

function performancePayload(count, width = 240) {
  return JSON.stringify({
    schemaVersion: 1,
    savedAt: 100000,
    records: Array.from({ length: count }, (_, index) => ({
      encounterKey: `encounter-${index}`,
      partyKey: 'merchant:1|ranger:3',
      samples: index + 1,
      combatSeconds: 900 + index,
      xp: 1000 + index,
      gold: 100 + index,
      damage: 2000 + index,
      kills: index,
      deaths: 0,
      retreats: 0,
      nearDeaths: 0,
      recoverySeconds: 0,
      hpPotions: 0,
      mpPotions: 0,
      merchantTrips: 0,
      skillFailures: 0,
      movementFailures: 0,
      disconnects: 0,
      safetyMarginSum: 1,
      safetyMarginSamples: 1,
      scoreEwma: 0.8,
      scoreVariance: 0.01,
      updatedAt: 1000 + index,
      firstSeenAt: 1000 + index,
      padding: 'x'.repeat(width)
    }))
  });
}

function performanceStore(root, count = 320) {
  const records = new Map(Array.from({ length: count }, (_, index) => [String(index), { updatedAt: 1000 + index }]));
  return {
    root,
    key: 'AIO_V3_PARTY_PERFORMANCE',
    storage: null,
    records,
    stats: { saveFailures: 0 },
    _backend() { return { get: (name) => root.get(name), set: (name, value) => root.set(name, value) }; },
    save() {
      try {
        this._backend().set(this.key, performancePayload(count));
        return true;
      } catch (_) {
        this.stats.saveFailures += 1;
        return false;
      }
    }
  };
}

function lifecycleStore(root) {
  return {
    root,
    key: 'AIO_V3_PARTY_LIFECYCLE',
    storage: null,
    stats: { saveFailures: 0 },
    _backend() { return { get: (name) => root.get(name), set: (name, value) => root.set(name, value) }; },
    save() {
      try {
        this._backend().set(this.key, JSON.stringify({ schemaVersion: 1, records: Array.from({ length: 320 }, (_, index) => ({ updatedAt: index, padding: 'x'.repeat(240) })) }));
        return true;
      } catch (_) {
        this.stats.saveFailures += 1;
        return false;
      }
    }
  };
}

test('quota pressure compacts only persisted party performance history and preserves live in-memory records', () => {
  const localStorage = createLocalStorage({ filler: 'x'.repeat(410000) });
  let setCalls = 0;
  const root = {
    localStorage,
    get(key) { return localStorage.getItem(`store_${key}`); },
    set(key, value) { setCalls += 1; localStorage.setItem(`store_${key}`, value); }
  };
  const partyPerformance = performanceStore(root, 320);
  const runtime = {
    root,
    now: () => 100000,
    log: { emit() {} },
    partyPerformance,
    partyLifecycle: lifecycleStore(root)
  };
  const hotfix = installPartyPersistenceQuotaHotfix(runtime, {
    storageHighWatermarkChars: 500000,
    storageRecoveryThresholdChars: 450000,
    storageRecoveryTargetChars: 425000,
    performanceRetentionCeilingRecords: 256,
    performanceRetentionFloorRecords: 64
  });

  assert.equal(partyPerformance.records.size, 320);
  assert.equal(partyPerformance.save(), true);
  assert.equal(partyPerformance.records.size, 320);
  assert.equal(setCalls, 1);

  const persisted = JSON.parse(localStorage.getItem('store_AIO_V3_PARTY_PERFORMANCE'));
  assert.ok(persisted.records.length < 320);
  assert.ok(persisted.records.length >= 64);
  assert.equal(persisted.records.at(-1).encounterKey, 'encounter-319');
  assert.ok(persisted.records[0].updatedAt >= 1000 + (320 - persisted.records.length));

  const status = hotfix.status();
  assert.equal(status.stores.partyPerformance.quotaBlocked, false);
  assert.equal(status.stores.partyPerformance.historyCompactions, 1);
  assert.ok(status.stores.partyPerformance.historyRecordsDropped > 0);
  assert.ok(status.stores.partyPerformance.historyCharsRecovered > 0);
  assert.equal(status.retention.partyPerformanceOnly, true);
  assert.equal(status.retention.mutatesInMemoryState, false);
  assert.equal(status.retention.touchesContentDrift, false);
  assert.equal(status.retention.touchesPartyLifecycle, false);
});

test('startup recovery reclaims existing historical party performance payload before later safety-critical writes', () => {
  const originalPerformance = performancePayload(320);
  const localStorage = createLocalStorage({
    filler: 'x'.repeat(370000),
    store_AIO_V3_PARTY_PERFORMANCE: originalPerformance
  });
  let setCalls = 0;
  const root = {
    localStorage,
    get(key) { return localStorage.getItem(`store_${key}`); },
    set(key, value) { setCalls += 1; localStorage.setItem(`store_${key}`, value); }
  };
  const runtime = {
    root,
    now: () => 110000,
    log: { emit() {} },
    partyPerformance: performanceStore(root, 320),
    partyLifecycle: lifecycleStore(root)
  };

  const before = [...localStorage.values.entries()].reduce((sum, [key, value]) => sum + key.length + value.length, 0);
  const hotfix = installPartyPersistenceQuotaHotfix(runtime, {
    storageHighWatermarkChars: 500000,
    storageRecoveryThresholdChars: 450000,
    storageRecoveryTargetChars: 425000,
    performanceRetentionCeilingRecords: 256,
    performanceRetentionFloorRecords: 64
  });
  const after = [...localStorage.values.entries()].reduce((sum, [key, value]) => sum + key.length + value.length, 0);

  assert.ok(before >= 450000);
  assert.ok(after < before);
  assert.ok(after <= 425000);
  assert.equal(setCalls, 1);
  assert.equal(hotfix.status().stores.partyPerformance.startupCompactions, 1);
  assert.equal(hotfix.status().stores.partyPerformance.quotaBlocked, false);
});

test('party lifecycle remains fail-closed and is never compacted as historical performance data', () => {
  const localStorage = createLocalStorage({ filler: 'x'.repeat(490000) });
  let setCalls = 0;
  const root = {
    localStorage,
    get(key) { return localStorage.getItem(`store_${key}`); },
    set(key, value) { setCalls += 1; localStorage.setItem(`store_${key}`, value); }
  };
  const lifecycle = lifecycleStore(root);
  const runtime = {
    root,
    now: () => 120000,
    log: { emit() {} },
    partyPerformance: performanceStore(root, 1),
    partyLifecycle: lifecycle
  };
  const hotfix = installPartyPersistenceQuotaHotfix(runtime, {
    storageHighWatermarkChars: 500000,
    storageRecoveryThresholdChars: 450000,
    storageRecoveryTargetChars: 425000
  });

  assert.equal(lifecycle.save(), false);
  assert.equal(setCalls, 0);
  assert.equal(hotfix.status().stores.partyLifecycle.quotaBlocked, true);
  assert.equal(hotfix.status().stores.partyLifecycle.historyCompactions, 0);
  assert.equal(hotfix.status().stores.partyLifecycle.historyRecordsDropped, 0);
});


test('real QuotaExceeded retries once with compacted performance history and avoids repeated raw failures', () => {
  let setCalls = 0;
  let rawQuotaFailures = 0;
  let stored = null;
  const storage = {
    get() { return stored; },
    set(_key, value) {
      setCalls += 1;
      if (String(value).length > 50000) {
        rawQuotaFailures += 1;
        const error = new Error("Failed to execute 'setItem' on 'Storage': Setting the value exceeded the quota.");
        error.name = 'QuotaExceededError';
        throw error;
      }
      stored = String(value);
    }
  };
  const partyPerformance = {
    storage,
    key: 'AIO_V3_PARTY_PERFORMANCE',
    records: new Map(Array.from({ length: 320 }, (_, index) => [String(index), { updatedAt: 1000 + index }])),
    _backend() { return storage; },
    save() {
      try {
        this._backend().set(this.key, performancePayload(320));
        return true;
      } catch (_) {
        return false;
      }
    }
  };
  const runtime = {
    root: {},
    now: () => 130000,
    log: { emit() {} },
    partyPerformance,
    partyLifecycle: null
  };
  const hotfix = installPartyPersistenceQuotaHotfix(runtime, {
    performanceRetentionCeilingRecords: 256,
    performanceRetentionFloorRecords: 64
  });

  assert.equal(partyPerformance.save(), true);
  assert.equal(setCalls, 2);
  assert.equal(rawQuotaFailures, 1);
  assert.equal(JSON.parse(stored).records.length, 64);
  assert.equal(hotfix.status().stores.partyPerformance.quotaRecoveries, 1);
  assert.equal(hotfix.status().stores.partyPerformance.quotaBlocked, false);
  assert.equal(hotfix.status().stores.partyPerformance.forcePerformanceCompaction, true);

  assert.equal(partyPerformance.save(), true);
  assert.equal(setCalls, 3);
  assert.equal(rawQuotaFailures, 1);
});
