'use strict';

const { EvidenceKind } = require('../world/world-model');
const { ContentDisposition, BUILT_IN_DANGEROUS_MONSTERS } = require('../farmer/content-safety');
const { isFarmableMonsterType } = require('../autonomy/local-farm-planner');
const { installCloudLongTermPersistence } = require('../control/cloud-long-term-persistence');

const ALPHA20_21_MODE = 'alpha20.21-cloud-persistence-recovery-v1';
const DANGEROUS = new Set(BUILT_IN_DANGEROUS_MONSTERS.map((x) => String(x).toLowerCase()));
const NON_FARM = new Set(['target']);

function finite(value, fallback = null) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clone(value) { try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
function stable(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
}
function hashString(value) {
  const text = String(value || ''); let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
function inventoryRows(character) { const rows = character && (character.inventory || character.items); return Array.isArray(rows) ? rows.filter(Boolean) : []; }

function installTechnicalTargetNavigationFilter(runtime, stats) {
  const local = runtime && runtime.localFarming;
  if (!local || local.__alpha2021TechnicalTargetFilterInstalled) return false;
  const wrap = (method) => {
    if (typeof local[method] !== 'function') return;
    const base = local[method].bind(local);
    local[method] = (...args) => {
      const rows = base(...args) || [];
      const safe = rows.filter((entity) => isFarmableMonsterType(entity && entity.mtype));
      stats.technicalTargetNavigationIgnores += rows.length - safe.length;
      return safe;
    };
  };
  wrap('_visibleMonsters'); wrap('_selfAggro');
  local.__alpha2021TechnicalTargetFilterInstalled = true;
  return true;
}

class FalseNoveltyReconciler {
  constructor(runtime, options = {}) {
    this.runtime = runtime; this.world = runtime.world; this.monitor = runtime.contentDrift;
    this.now = runtime.now || (() => Date.now()); this.log = runtime.log || null;
    this.minHistoricalLeadMs = Math.max(1000, finite(options.minHistoricalLeadMs, 15000));
    this.maxAutoQuarantineLagMs = Math.max(1000, finite(options.maxAutoQuarantineLagMs, 30000));
    this.intervalMs = Math.max(1000, finite(options.intervalMs, 5000)); this.lastRunAt = -Infinity; this.lastResult = null;
    this.stats = { runs: 0, inspected: 0, monsterRecovered: 0, itemRecovered: 0, dangerousSkipped: 0, technicalSkipped: 0, realDriftSkipped: 0, noHistorySkipped: 0, explicitQuarantineSkipped: 0, errors: 0 };
  }
  _event(event, severity = 'info', reason = null, data = {}) { try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'alpha20.21-content-recovery', event, severity, reason, data }); } catch (_) {} }
  _fact(id, name) { try { const fact = this.world && this.world.fact && this.world.fact('monster-policy', id, name); return fact && fact.value != null ? fact.value : null; } catch (_) { return null; } }
  _falseNoveltyShape(record) { return !!record && record.lifecycle === 'QUARANTINED' && !record.previousFingerprint && finite(record.changeCount, 0) === 0; }
  _monsterHistory(id, noveltyAt) {
    try { const entity = this.world && this.world.entity && this.world.entity('monster', id); const first = finite(entity && entity.firstSeenAt); return first != null && noveltyAt != null && noveltyAt - first >= this.minHistoricalLeadMs ? first : null; } catch (_) { return null; }
  }
  _itemHistory(id, noveltyAt) {
    const candidates = []; const gear = this.runtime.gearProgression;
    if (gear && gear.goals instanceof Map) for (const goal of gear.goals.values()) if (goal && goal.item === id) candidates.push(finite(goal.firstSeenAt));
    const market = this.runtime.economyEquipmentAutonomyV2 && this.runtime.economyEquipmentAutonomyV2.marketHistory;
    if (market && market.history instanceof Map) for (const [key, samples] of market.history) { if (!String(key).startsWith(`${id}:`) || !Array.isArray(samples)) continue; for (const sample of samples) candidates.push(finite(sample && sample.at)); }
    const ledger = this.runtime.inventoryLedger;
    if (ledger && ledger.entries instanceof Map) for (const row of ledger.entries.values()) if (row && row.name === id) candidates.push(finite(row.observedAt));
    const earliest = candidates.filter((x) => x != null).sort((a, b) => a - b)[0];
    return earliest != null && noveltyAt != null && noveltyAt - earliest >= this.minHistoricalLeadMs ? earliest : null;
  }
  _markObserved(record, at) { record.lifecycle = 'OBSERVED'; record.baselineFingerprint = record.fingerprint; record.previousFingerprint = null; record.lastSeenAt = at; if (this.monitor && this.monitor.stats) this.monitor.stats.revalidated = finite(this.monitor.stats.revalidated, 0) + 1; }
  _recoverMonster(record, at) {
    const id = String(record.id || ''), normalized = id.toLowerCase(); if (!id) return false;
    if (DANGEROUS.has(normalized)) { this.stats.dangerousSkipped += 1; return false; }
    if (NON_FARM.has(normalized)) { this.stats.technicalSkipped += 1; return false; }
    const noveltyAt = finite(record.firstSeenAt), historyAt = this._monsterHistory(id, noveltyAt);
    if (historyAt == null) { this.stats.noHistorySkipped += 1; return false; }
    const disposition = this._fact(id, 'contentSafetyDisposition'), reason = this._fact(id, 'contentSafetyReason'), policyAt = finite(this._fact(id, 'contentSafetyUpdatedAt'));
    if (disposition === ContentDisposition.LEGACY_ALLOWED || disposition === ContentDisposition.APPROVED) this._markObserved(record, at);
    else if (disposition === ContentDisposition.QUARANTINED && reason === 'OPERATOR_QUARANTINED' && policyAt != null && noveltyAt != null && Math.abs(policyAt - noveltyAt) <= this.maxAutoQuarantineLagMs) {
      this.world.observeEntity('monster-policy', id, { contentSafetyDisposition: ContentDisposition.LEGACY_ALLOWED, contentSafetyReason: 'RECOVERED_FALSE_NOVELTY_HISTORICAL_CONTENT', contentSafetyUpdatedAt: at }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
      this._markObserved(record, at);
    } else { this.stats.explicitQuarantineSkipped += 1; return false; }
    this.stats.monsterRecovered += 1;
    this._event('FALSE_NOVELTY_MONSTER_RECOVERED', 'warn', 'HISTORICAL_CONTENT_RECONCILED', { monster: id, historicalFirstSeenAt: historyAt, noveltyAt, previousDisposition: disposition });
    return true;
  }
  _recoverItem(record, at) {
    const id = String(record.id || ''), noveltyAt = finite(record.firstSeenAt); if (!id) return false;
    const historyAt = this._itemHistory(id, noveltyAt); if (historyAt == null) { this.stats.noHistorySkipped += 1; return false; }
    this._markObserved(record, at); this.stats.itemRecovered += 1;
    this._event('FALSE_NOVELTY_ITEM_RECOVERED', 'warn', 'HISTORICAL_ITEM_EVIDENCE_RECONCILED', { item: id, historicalFirstSeenAt: historyAt, noveltyAt });
    return true;
  }
  beforeTick() {
    const at = this.now(); if (at - this.lastRunAt < this.intervalMs) return this.lastResult; this.lastRunAt = at; this.stats.runs += 1; const recovered = [];
    if (!(this.monitor && this.monitor.records instanceof Map)) return this.lastResult = { at, recovered, reason: 'CONTENT_DRIFT_RECORDS_UNAVAILABLE' };
    for (const record of this.monitor.records.values()) {
      try {
        if (!record || record.lifecycle !== 'QUARANTINED' || !['monsters', 'items'].includes(record.category)) continue;
        this.stats.inspected += 1;
        if (!this._falseNoveltyShape(record)) { this.stats.realDriftSkipped += 1; continue; }
        const ok = record.category === 'monsters' ? this._recoverMonster(record, at) : this._recoverItem(record, at);
        if (ok) recovered.push(`${record.category}:${record.id}`);
      } catch (error) { this.stats.errors += 1; this._event('FALSE_NOVELTY_RECOVERY_ERROR', 'warn', 'RECORD_LEFT_FAIL_CLOSED', { message: String(error && error.message || error).slice(0, 220) }); }
    }
    if (recovered.length && this.monitor && typeof this.monitor.save === 'function') try { this.monitor.save({ force: false }); } catch (_) {}
    return this.lastResult = { at, recovered, recoveredCount: recovered.length };
  }
  status() { return { schemaVersion: 1, mode: 'false-novelty-reconciler-v3', lastRunAt: Number.isFinite(this.lastRunAt) ? this.lastRunAt : null, lastResult: clone(this.lastResult), stats: { ...this.stats }, policies: { dangerousNeverRecovered: [...DANGEROUS].sort(), technicalTargetsNeverRecovered: [...NON_FARM].sort(), genuineFingerprintChangesNeverRecovered: true, historicalEvidenceRequired: true } }; }
}

function merchantSignature(economy) {
  const c = economy && typeof economy._c === 'function' ? economy._c() : null;
  const inv = inventoryRows(c).map((item) => [String(item.name || ''), Math.max(0, finite(item.level, 0)), Math.max(1, finite(item.q, 1))]).sort((a, b) => stable(a).localeCompare(stable(b)));
  let reserved = 0;
  try { const status = economy.runtime && economy.runtime.controlledPartyLogistics && economy.runtime.controlledPartyLogistics.status && economy.runtime.controlledPartyLogistics.status(); reserved = Math.max(0, finite(status && status.lastMerchantStatus && status.lastMerchantStatus.reservedIncomingSlots, 0)); } catch (_) {}
  let need = null; try { need = economy && typeof economy._need === 'function' ? economy._need() : null; } catch (_) {}
  const capacity = Math.max(0, Math.floor(finite(c && c.isize, inv.length))), occupied = inventoryRows(c).filter((item) => item && finite(item.index, 0) < capacity).length, free = Math.max(0, capacity - occupied);
  const low = Math.max(4, finite(economy && economy.base && economy.base.cfg && economy.base.cfg.lowSlots, 8)), effective = Math.max(0, free - reserved);
  return { signature: hashString(stable({ inv, capacity, reserved, need: need ? [need.reason, need.report && need.report.name, need.priority] : null })), effectiveFreeSlots: effective, critical: effective <= Math.max(2, low - 2), need };
}

function installMerchantNoopBackoff(runtime, stats, options = {}) {
  const economy = runtime && runtime.economyEquipmentAutonomyV2;
  if (!economy || economy.__alpha2021NoopBackoffInstalled || typeof economy._bankService !== 'function' || typeof economy._standby !== 'function') return false;
  const backoffMs = Math.max(60000, finite(options.merchantNoopBackoffMs, 5 * 60 * 1000)), baseBank = economy._bankService.bind(economy), baseStandby = economy._standby.bind(economy);
  economy._bankService = async (...args) => { const result = await baseBank(...args); if (economy.phaseReason === 'NO_MORE_SAFE_BANK_ACTIONS') { const state = merchantSignature(economy); economy.__alpha2021NoopCapacityBackoff = { at: economy.now(), until: economy.now() + backoffMs, signature: state.signature }; stats.merchantNoopBackoffsArmed += 1; } return result; };
  economy._standby = async (...args) => {
    const backoff = economy.__alpha2021NoopCapacityBackoff;
    if (backoff && economy.now() < backoff.until) {
      const state = merchantSignature(economy);
      if (!state.critical && !state.need && state.signature === backoff.signature) { economy.lastDecision = { at: economy.now(), action: 'STANDBY', reason: 'NO_SAFE_BANK_ACTION_BACKOFF', backoffUntil: backoff.until, effectiveFreeSlots: state.effectiveFreeSlots }; stats.merchantThrashCyclesSuppressed += 1; return false; }
      economy.__alpha2021NoopCapacityBackoff = null; stats.merchantNoopBackoffsBrokenByChange += 1;
    } else if (backoff) economy.__alpha2021NoopCapacityBackoff = null;
    return baseStandby(...args);
  };
  economy.__alpha2021NoopBackoffInstalled = true; economy.__alpha2021NoopBackoffMs = backoffMs; return true;
}

function teacherSignal(runtime, state) {
  const brain = runtime && (runtime.strategicBrainV2 || runtime.brain), observation = brain && brain.lastObservation;
  if (!brain || !observation) return false;
  if (brain._cfg && brain._cfg('brain.teacherEnabled', true) === false) return false;
  const entropy = finite(observation.student && observation.student.entropy, 0), novelty = finite(observation.student && observation.student.novelty, 0);
  const entropyThreshold = brain._cfg ? finite(brain._cfg('brain.entropyTeacherThreshold', 0.72), 0.72) : 0.72, noveltyThreshold = brain._cfg ? finite(brain._cfg('brain.noveltyTeacherThreshold', 0.45), 0.45) : 0.45;
  const quality = String(brain.quality && brain.quality.state || 'warming');
  return entropy >= entropyThreshold || novelty >= noveltyThreshold || ['watch', 'degraded', 'quarantine'].includes(quality) || (state && state.strategicTransitionUntil > (runtime.now ? runtime.now() : Date.now()));
}

function installTeacherGuard(runtime, stats, state, options = {}) {
  const brain = runtime && (runtime.strategicBrainV2 || runtime.brain), cloud = runtime && runtime.cloudControlPlane;
  if (!brain || !cloud || cloud.__alpha2021TeacherGuardInstalled || typeof cloud.askTeacher !== 'function') return false;
  const minAttemptMs = Math.max(10 * 60 * 1000, finite(options.teacherMinAttemptMs, 10 * 60 * 1000)), dedupeMs = Math.max(minAttemptMs, finite(options.teacherDedupeMs, 30 * 60 * 1000)), baseAsk = cloud.askTeacher.bind(cloud);
  brain.__alpha2021OriginalShouldAskTeacher = typeof brain.shouldAskTeacher === 'function' ? brain.shouldAskTeacher.bind(brain) : null;
  brain.shouldAskTeacher = () => teacherSignal(runtime, state);
  cloud.askTeacher = async () => {
    if (!teacherSignal(runtime, state)) return false;
    const now = cloud.now ? cloud.now() : Date.now();
    if (state.lastTeacherAttemptAt && now - state.lastTeacherAttemptAt < minAttemptMs) { stats.teacherClientThrottleBlocks += 1; return false; }
    let requestState = null; try { requestState = brain.teacherRequest && brain.teacherRequest('alpha20.21-signal'); } catch (_) {}
    const fingerprint = hashString(stable(requestState && { student: requestState.student, quality: requestState.quality, inputs: requestState.inputs }));
    if (fingerprint && fingerprint === state.lastTeacherFingerprint && now - state.lastTeacherFingerprintAt < dedupeMs) { state.lastTeacherAttemptAt = now; stats.teacherClientDedupes += 1; return { ok: true, blocked: true, reason: 'client teacher state deduped', cached: true }; }
    state.lastTeacherAttemptAt = now; state.lastTeacherFingerprint = fingerprint; state.lastTeacherFingerprintAt = now; stats.teacherRemoteAttempts += 1;
    try { return await baseAsk(); } catch (error) { if (cloud.stats) cloud.stats.teacherErrors = finite(cloud.stats.teacherErrors, 0) + 1; stats.teacherRemoteErrors += 1; throw error; }
  };
  if (typeof cloud.status === 'function') { const baseStatus = cloud.status.bind(cloud); cloud.status = () => ({ ...baseStatus(), alpha20_21TeacherGuard: { minAttemptMs, dedupeMs, lastAttemptAt: state.lastTeacherAttemptAt || null, lastFingerprintAt: state.lastTeacherFingerprintAt || null, signalRequired: true, failedAttemptsCountForBackoff: true } }); }
  cloud.__alpha2021TeacherGuardInstalled = true; return true;
}

function installUpdateQuiesce(runtime, stats) {
  const updater = runtime && runtime.safeAutoUpdater; if (!updater || updater.__alpha2021QuiesceInstalled) return false;
  const local = runtime.localFarming;
  if (local && typeof local.tick === 'function' && !local.__alpha2021UpdateQuiesceWrapped) { const base = local.tick.bind(local); local.tick = (...args) => { if (runtime.__AIO_V3_UPDATE_QUIESCE) { stats.localFarmMovesQuiesced += 1; return { at: runtime.now(), action: 'WAIT', reason: 'UPDATE_QUIESCE' }; } return base(...args); }; local.__alpha2021UpdateQuiesceWrapped = true; }
  const farmer = runtime.farmer;
  if (farmer && typeof farmer._selectTarget === 'function' && !farmer.__alpha2021UpdateQuiesceWrapped) { const base = farmer._selectTarget.bind(farmer); farmer._selectTarget = (context) => { if (runtime.__AIO_V3_UPDATE_QUIESCE && farmer.targetId == null) { stats.newPullsQuiesced += 1; return null; } return base(context); }; farmer.__alpha2021UpdateQuiesceWrapped = true; }
  for (const economy of [runtime.economyEquipmentAutonomyV2, runtime.merchantEconomyAutonomy]) {
    if (!economy || typeof economy.cycle !== 'function' || economy.__alpha2021UpdateQuiesceWrapped) continue;
    const base = economy.cycle.bind(economy); economy.cycle = (...args) => { if (runtime.__AIO_V3_UPDATE_QUIESCE) { stats.merchantCyclesQuiesced += 1; return Promise.resolve(false); } return base(...args); }; economy.__alpha2021UpdateQuiesceWrapped = true;
  }
  if (typeof updater._reloadSavedCode === 'function') { const baseReload = updater._reloadSavedCode.bind(updater); updater._reloadSavedCode = async (...args) => { try { if (updater.root) updater.root.AIO_V3_AUTOSTART = true; } catch (_) {} stats.autoStartFlagsSet += 1; return baseReload(...args); }; }
  if (typeof updater.status === 'function') { const baseStatus = updater.status.bind(updater); updater.status = () => { const status = baseStatus(); status.policies = { ...(status.policies || {}), updatePriorityViaControlledQuiesce: true, newGameplayWorkStopsWhileUpdatePending: true, autoStartAfterSuccessfulReload: true, safetyStillRequiredBeforeApply: true }; status.quiescing = !!runtime.__AIO_V3_UPDATE_QUIESCE; return status; }; }
  updater.__alpha2021QuiesceInstalled = true; return true;
}

class Alpha2021CloudPersistenceRecovery {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required'); this.runtime = runtime; this.now = runtime.now || (() => Date.now()); this.log = runtime.log || null; this.installedAt = this.now();
    this.stats = { technicalTargetNavigationIgnores: 0, merchantNoopBackoffsArmed: 0, merchantThrashCyclesSuppressed: 0, merchantNoopBackoffsBrokenByChange: 0, teacherClientThrottleBlocks: 0, teacherClientDedupes: 0, teacherRemoteAttempts: 0, teacherRemoteErrors: 0, newPullsQuiesced: 0, localFarmMovesQuiesced: 0, merchantCyclesQuiesced: 0, autoStartFlagsSet: 0 };
    this.state = { lastBrainAction: null, strategicTransitionUntil: 0, lastTeacherAttemptAt: 0, lastTeacherFingerprint: null, lastTeacherFingerprintAt: 0 };
    this.options = options;
    this.navigationFilterInstalled = installTechnicalTargetNavigationFilter(runtime, this.stats);
    this.falseNovelty = new FalseNoveltyReconciler(runtime, options.contentRecovery || {});
    this.persistence = installCloudLongTermPersistence(runtime, options.persistence || {});
    this.merchantBackoffInstalled = installMerchantNoopBackoff(runtime, this.stats, options);
    this.teacherGuardInstalled = installTeacherGuard(runtime, this.stats, this.state, options);
    this.updateQuiesceInstalled = installUpdateQuiesce(runtime, this.stats);
  }
  _installLatePieces() {
    if (!this.navigationFilterInstalled) this.navigationFilterInstalled = installTechnicalTargetNavigationFilter(this.runtime, this.stats);
    if (!this.merchantBackoffInstalled) this.merchantBackoffInstalled = installMerchantNoopBackoff(this.runtime, this.stats, this.options);
    if (!this.teacherGuardInstalled) this.teacherGuardInstalled = installTeacherGuard(this.runtime, this.stats, this.state, this.options);
    if (!this.updateQuiesceInstalled) this.updateQuiesceInstalled = installUpdateQuiesce(this.runtime, this.stats);
    if (this.persistence) this.persistence.installAdapters();
  }
  beforeTick() {
    this._installLatePieces();
    const brain = this.runtime.strategicBrainV2 || this.runtime.brain, action = brain && brain.lastObservation && brain.lastObservation.student && brain.lastObservation.student.action || null;
    if (action && this.state.lastBrainAction && action !== this.state.lastBrainAction) this.state.strategicTransitionUntil = this.now() + 60000;
    if (action) this.state.lastBrainAction = action;
    const updater = this.runtime.safeAutoUpdater, pending = !!(updater && updater.pendingVersion);
    if (pending && !this.runtime.__AIO_V3_UPDATE_QUIESCE) { this.runtime.__AIO_V3_UPDATE_QUIESCE = true; try { if (this.log && this.log.emit) this.log.emit({ component: 'alpha20.21-update', event: 'UPDATE_QUIESCE_ENTERED', severity: 'warn', reason: 'NEWER_RELEASE_PENDING', data: { version: updater.pendingVersion, safetyBypassed: false } }); } catch (_) {} }
    else if (!pending && this.runtime.__AIO_V3_UPDATE_QUIESCE) this.runtime.__AIO_V3_UPDATE_QUIESCE = false;
    this.falseNovelty.beforeTick(); if (this.persistence) this.persistence.beforeTick(); return true;
  }
  status() { return { schemaVersion: 1, mode: ALPHA20_21_MODE, installedAt: this.installedAt, navigationFilterInstalled: this.navigationFilterInstalled, merchantBackoffInstalled: this.merchantBackoffInstalled, teacherGuardInstalled: this.teacherGuardInstalled, updateQuiesceInstalled: this.updateQuiesceInstalled, quiescingForUpdate: !!this.runtime.__AIO_V3_UPDATE_QUIESCE, contentRecovery: this.falseNovelty.status(), persistence: this.persistence && this.persistence.status ? this.persistence.status() : null, stats: { ...this.stats }, policies: { commandCharacterAuthorityWidened: false, directGameplayAuthorityAddedToBrain: false, dangerousContentFailClosed: true, technicalTrainingTargetNeverFarmable: true, cloudFailureCannotBlockCombat: true, teacherHardBudgetOwnedByServer: true, updaterStillRequiresSafetyBeforeApply: true } }; }
}

function installAlpha2021CloudPersistenceRecovery(runtime, options = {}) { if (runtime.alpha2021CloudPersistenceRecovery) return runtime.alpha2021CloudPersistenceRecovery; return runtime.alpha2021CloudPersistenceRecovery = new Alpha2021CloudPersistenceRecovery(runtime, options); }

module.exports = { ALPHA20_21_MODE, Alpha2021CloudPersistenceRecovery, FalseNoveltyReconciler, installAlpha2021CloudPersistenceRecovery, installTechnicalTargetNavigationFilter, installMerchantNoopBackoff, installTeacherGuard, installUpdateQuiesce, merchantSignature, teacherSignal, hashString, stable };
