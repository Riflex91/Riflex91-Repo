'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FalseNoveltyReconciler,
  installTechnicalTargetNavigationFilter,
  installMerchantNoopBackoff,
  installTeacherGuard,
  installUpdateQuiesce
} = require('../src/reliability/alpha20-21-cloud-persistence-recovery');
const { CloudLongTermPersistence, FALLBACK_KEY } = require('../src/control/cloud-long-term-persistence');

function fact(value) { return value == null ? null : { value }; }
function worldFixture(policy = {}) {
  const writes = [];
  return {
    writes,
    entity(type, id) { return type === 'monster' ? { id, firstSeenAt: 1000 } : null; },
    fact(type, id, name) { return fact(policy[name]); },
    observeEntity(type, id, attrs) { writes.push({ type, id, attrs }); Object.assign(policy, attrs); return { type, id }; }
  };
}

test('technical target automatons cannot pin local farm navigation or self-aggro presence', () => {
  const runtime = { localFarming: { _visibleMonsters() { return [{ id: 't1', mtype: 'target' }, { id: 'c1', mtype: 'crab' }]; }, _selfAggro() { return [{ id: 't2', mtype: 'target' }, { id: 'b1', mtype: 'bee' }]; } } };
  const stats = { technicalTargetNavigationIgnores: 0 };
  assert.equal(installTechnicalTargetNavigationFilter(runtime, stats), true);
  assert.deepEqual(runtime.localFarming._visibleMonsters().map((x) => x.mtype), ['crab']);
  assert.deepEqual(runtime.localFarming._selfAggro().map((x) => x.mtype), ['bee']);
  assert.equal(stats.technicalTargetNavigationIgnores, 2);
});

test('false novelty reconciliation restores historical LEGACY_ALLOWED monster but never dangerous or real drift', () => {
  const policy = { contentSafetyDisposition: 'LEGACY_ALLOWED', contentSafetyReason: 'PRE_ALPHA_8_12_KNOWN', contentSafetyUpdatedAt: 900 };
  const world = worldFixture(policy);
  const records = new Map([
    ['monsters:crab', { category: 'monsters', id: 'crab', lifecycle: 'QUARANTINED', fingerprint: 'a', baselineFingerprint: 'a', previousFingerprint: null, changeCount: 0, firstSeenAt: 20000 }],
    ['monsters:redfairy', { category: 'monsters', id: 'redfairy', lifecycle: 'QUARANTINED', fingerprint: 'b', previousFingerprint: null, changeCount: 0, firstSeenAt: 20000 }],
    ['monsters:bee', { category: 'monsters', id: 'bee', lifecycle: 'QUARANTINED', fingerprint: 'c', previousFingerprint: 'old', changeCount: 1, firstSeenAt: 20000 }]
  ]);
  const runtime = { world, contentDrift: { records, stats: { revalidated: 0 }, save() { return true; } }, now: () => 25000, log: null };
  const recovery = new FalseNoveltyReconciler(runtime, { minHistoricalLeadMs: 5000 });
  const result = recovery.beforeTick();
  assert.deepEqual(result.recovered, ['monsters:crab']);
  assert.equal(records.get('monsters:crab').lifecycle, 'OBSERVED');
  assert.equal(records.get('monsters:redfairy').lifecycle, 'QUARANTINED');
  assert.equal(records.get('monsters:bee').lifecycle, 'QUARANTINED');
});

test('auto-quarantine created with the same false-novelty scan is reconciled, explicit quarantine is not', () => {
  const policy = { contentSafetyDisposition: 'QUARANTINED', contentSafetyReason: 'OPERATOR_QUARANTINED', contentSafetyUpdatedAt: 20010 };
  const world = worldFixture(policy);
  const record = { category: 'monsters', id: 'crab', lifecycle: 'QUARANTINED', fingerprint: 'a', previousFingerprint: null, changeCount: 0, firstSeenAt: 20000 };
  const runtime = { world, contentDrift: { records: new Map([['monsters:crab', record]]), stats: {}, save() {} }, now: () => 26000, log: null };
  new FalseNoveltyReconciler(runtime, { minHistoricalLeadMs: 5000, maxAutoQuarantineLagMs: 30000 }).beforeTick();
  assert.equal(record.lifecycle, 'OBSERVED');
  assert.equal(world.writes.at(-1).attrs.contentSafetyDisposition, 'LEGACY_ALLOWED');

  const oldPolicy = { contentSafetyDisposition: 'QUARANTINED', contentSafetyReason: 'OPERATOR_QUARANTINED', contentSafetyUpdatedAt: 5000 };
  const oldWorld = worldFixture(oldPolicy);
  const oldRecord = { category: 'monsters', id: 'crab', lifecycle: 'QUARANTINED', fingerprint: 'a', previousFingerprint: null, changeCount: 0, firstSeenAt: 20000 };
  const oldRuntime = { world: oldWorld, contentDrift: { records: new Map([['monsters:crab', oldRecord]]), stats: {}, save() {} }, now: () => 26000, log: null };
  new FalseNoveltyReconciler(oldRuntime, { minHistoricalLeadMs: 5000, maxAutoQuarantineLagMs: 3000 }).beforeTick();
  assert.equal(oldRecord.lifecycle, 'QUARANTINED');
  assert.equal(oldWorld.writes.length, 0);
});

test('historical gear evidence can reconcile false item novelty without granting gameplay authority', () => {
  const record = { category: 'items', id: 'wblade', lifecycle: 'QUARANTINED', fingerprint: 'i', previousFingerprint: null, changeCount: 0, firstSeenAt: 20000 };
  const runtime = { world: worldFixture({}), gearProgression: { goals: new Map([['g', { item: 'wblade', firstSeenAt: 1000, lastSeenAt: 15000 }]]) }, contentDrift: { records: new Map([['items:wblade', record]]), stats: {}, save() {} }, now: () => 25000, log: null };
  const recovery = new FalseNoveltyReconciler(runtime, { minHistoricalLeadMs: 5000 });
  assert.deepEqual(recovery.beforeTick().recovered, ['items:wblade']);
  assert.equal(record.lifecycle, 'OBSERVED');
  assert.equal(runtime.world.writes.length, 0);
});

test('Merchant no-op capacity backoff suppresses unchanged home-service thrash and breaks on inventory change', async () => {
  let now = 1000, standbyCalls = 0;
  const character = { name: 'Merchant', ctype: 'merchant', isize: 20, items: [{ name: 'hpot0', q: 10, index: 0 }] };
  const economy = {
    now: () => now,
    runtime: { controlledPartyLogistics: { status: () => ({ lastMerchantStatus: { reservedIncomingSlots: 0 } }) } },
    base: { cfg: { lowSlots: 8 } }, phaseReason: 'X', _c: () => character, _need: () => null,
    async _bankService() { this.phaseReason = 'NO_MORE_SAFE_BANK_ACTIONS'; return false; },
    async _standby() { standbyCalls += 1; return false; }
  };
  const stats = { merchantNoopBackoffsArmed: 0, merchantThrashCyclesSuppressed: 0, merchantNoopBackoffsBrokenByChange: 0 };
  assert.equal(installMerchantNoopBackoff({ economyEquipmentAutonomyV2: economy }, stats, { merchantNoopBackoffMs: 300000 }), true);
  await economy._bankService(); now += 20000; await economy._standby();
  assert.equal(standbyCalls, 0); assert.equal(stats.merchantThrashCyclesSuppressed, 1);
  character.items.push({ name: 'mpot0', q: 10, index: 1 }); now += 1000; await economy._standby();
  assert.equal(standbyCalls, 1); assert.equal(stats.merchantNoopBackoffsBrokenByChange, 1);
});

test('Teacher guard counts failed attempts for 10 minute backoff and removes periodic-only asks', async () => {
  let now = 1000000, remoteCalls = 0;
  const brain = {
    quality: { state: 'healthy' }, lastObservation: { student: { entropy: 0.9, novelty: 0.1, action: 'continue' }, inputs: { a: 1 }, quality: { state: 'healthy' } },
    _cfg(key, fallback) { const values = { 'brain.teacherEnabled': true, 'brain.entropyTeacherThreshold': 0.72, 'brain.noveltyTeacherThreshold': 0.45 }; return key in values ? values[key] : fallback; },
    shouldAskTeacher() { return true; }, teacherRequest() { return { student: this.lastObservation.student, inputs: this.lastObservation.inputs, quality: this.quality }; }
  };
  const cloud = { now: () => now, stats: {}, async askTeacher() { remoteCalls += 1; if (remoteCalls === 1) throw new Error('synthetic remote failure'); return { ok: true }; }, status() { return { ready: true }; } };
  const runtime = { now: () => now, brain, strategicBrainV2: brain, cloudControlPlane: cloud };
  const stats = { teacherClientThrottleBlocks: 0, teacherClientDedupes: 0, teacherRemoteAttempts: 0, teacherRemoteErrors: 0 };
  const state = { strategicTransitionUntil: 0, lastTeacherAttemptAt: 0, lastTeacherFingerprint: null, lastTeacherFingerprintAt: 0 };
  installTeacherGuard(runtime, stats, state);
  await assert.rejects(() => cloud.askTeacher(), /synthetic remote failure/); assert.equal(remoteCalls, 1);
  now += 60 * 1000; assert.equal(await cloud.askTeacher(), false); assert.equal(remoteCalls, 1);
  now += 10 * 60 * 1000; const deduped = await cloud.askTeacher(); assert.equal(deduped.blocked, true); assert.equal(remoteCalls, 1);
  now += 31 * 60 * 1000; await cloud.askTeacher(); assert.equal(remoteCalls, 2);
  brain.lastObservation.student.entropy = 0.1; brain.lastObservation.student.novelty = 0.1; brain.quality.state = 'healthy';
  assert.equal(brain.shouldAskTeacher(), false);
});

test('cloud persistence keeps only latest RAM record and cloud failure never clears dirty state', async () => {
  const data = new Map();
  const storage = { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
  let now = 1000;
  const brain = { lastSaveAt: 0, persistenceDisabled: false, persistenceError: null, samples: 1, updates: 1, exportState: () => ({ schemaVersion: 2, samples: 1, updates: 1, network: { ok: true }, diary: [] }), _save() { return true; } };
  const cloud = { credentials: { account: 'default' }, status: () => ({ ready: true }), async _post() { throw new Error('offline'); } };
  const runtime = { root: { localStorage: storage }, now: () => now, log: null, brain, strategicBrainV2: brain, cloudControlPlane: cloud };
  const persistence = new CloudLongTermPersistence(runtime, { fallbackIntervalMs: 30000 });
  brain._save(true); brain._save(true); assert.equal(persistence.dirty.size, 1);
  now += 40000; assert.equal(await persistence.flush(), false); assert.equal(persistence.dirty.size, 1); assert.ok(data.has(FALLBACK_KEY));
  assert.equal(persistence.status().policies.cloudFailureBlocksCombat, false);
});

test('update quiesce blocks new work but preserves updater safety and enables auto-start for reload', async () => {
  let farmTicks = 0, selects = 0, economyCycles = 0, reloads = 0;
  const root = {};
  const runtime = {
    root, now: () => 1000,
    localFarming: { tick() { farmTicks += 1; } },
    farmer: { targetId: null, _selectTarget() { selects += 1; return { target: true }; } },
    economyEquipmentAutonomyV2: { cycle() { economyCycles += 1; return true; } },
    safeAutoUpdater: { root, async _reloadSavedCode() { reloads += 1; return true; }, status() { return { policies: { updateCannotBypassCombatSafety: true } }; } }
  };
  const stats = { localFarmMovesQuiesced: 0, newPullsQuiesced: 0, merchantCyclesQuiesced: 0, autoStartFlagsSet: 0 };
  installUpdateQuiesce(runtime, stats); runtime.__AIO_V3_UPDATE_QUIESCE = true;
  runtime.localFarming.tick(); assert.equal(runtime.farmer._selectTarget({}), null); await runtime.economyEquipmentAutonomyV2.cycle();
  assert.equal(farmTicks, 0); assert.equal(selects, 0); assert.equal(economyCycles, 0);
  await runtime.safeAutoUpdater._reloadSavedCode({ slot: 1 }); assert.equal(reloads, 1); assert.equal(root.AIO_V3_AUTOSTART, true);
  const status = runtime.safeAutoUpdater.status(); assert.equal(status.policies.safetyStillRequiredBeforeApply, true); assert.equal(status.policies.autoStartAfterSuccessfulReload, true);
});

test('server teacher budget keeps 1500-neuron reserve under 10000 hard cap and counts post-inference overruns as consumed', async () => {
  const mod = await import('../../cloudflare-dashboard/src/alpha20-21-control-plane.js');
  assert.equal(mod.HARD_NEURON_LIMIT, 10000); assert.equal(mod.RESERVED_NEURONS, 1500);
  assert.deepEqual(mod.CONSUMED_TEACHER_STATUSES, ['success', 'budget-overrun-blocked']);
  const open = mod.teacherBudgetPlan(0, 1000, 10000, 200); assert.equal(open.usableLimit, 8500); assert.equal(open.allowed, true);
  const closed = mod.teacherBudgetPlan(8499, 5000, 10000, 200); assert.equal(closed.allowed, false); assert.ok(closed.used + closed.available <= 8500);
});
