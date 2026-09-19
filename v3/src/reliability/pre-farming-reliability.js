'use strict';

const { BankCapacityManager, BANK_CAPACITY_SCHEMA_VERSION } = require('../economy/bank-capacity-manager');
const { fingerprint } = require('../world/content-drift');

const PRE_FARMING_RELIABILITY_SCHEMA_VERSION = 1;
const CONTENT_FINGERPRINT_PROFILE = 'stable-runtime-fields-v1';

const VOLATILE_CONTENT_KEYS = new Set([
  'cache', 'cached', 'cachekey', 'characters', 'chests', 'client', 'clients', 'entities',
  'last', 'lastupdate', 'lastupdated', 'last_update', 'loaded', 'loading', 'objects',
  'players', 'renderer', 'runtime', 'runtimestate', 'runtime_state', 'seen', 'session',
  'sessionid', 'session_id', 'socket', 'timestamp', 'updated', 'updatedat', 'updated_at'
]);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finiteObserved(value) {
  if (value == null || value === '' || typeof value === 'boolean') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ownObservedNumber(object, key) {
  if (!object || typeof object !== 'object' || !Object.prototype.hasOwnProperty.call(object, key)) return null;
  return finiteObserved(object[key]);
}

function supplyEvidenceComplete(supplies) {
  return ownObservedNumber(supplies, 'hpPotions') != null &&
    ownObservedNumber(supplies, 'mpPotions') != null &&
    ownObservedNumber(supplies, 'freeSlots') != null;
}

function serviceEvidenceComplete(report) {
  if (!report || typeof report !== 'object' || !report.name || !report.map) return false;
  return finiteObserved(report.at) != null &&
    ownObservedNumber(report, 'x') != null &&
    ownObservedNumber(report, 'y') != null &&
    supplyEvidenceComplete(report.supplies);
}

function hasObservableBankSnapshot(character) {
  const bank = character && character.bank;
  if (!bank || typeof bank !== 'object' || Array.isArray(bank)) return false;
  return Object.values(bank).some((value) => Array.isArray(value));
}

function volatileContentKey(key) {
  const raw = String(key || '');
  const lower = raw.toLowerCase();
  return raw.startsWith('__') || raw.startsWith('_runtime') || raw.startsWith('$runtime') || VOLATILE_CONTENT_KEYS.has(lower);
}

function sanitizeVolatileContent(value, depth = 0, stats = { stripped: 0 }) {
  if (depth > 8) return { value: '[depth-limit]', stripped: stats.stripped };
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { value, stripped: stats.stripped };
  }
  if (typeof value === 'function' || typeof value === 'undefined' || typeof value === 'symbol') {
    stats.stripped += 1;
    return { value: undefined, stripped: stats.stripped };
  }
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value.slice(0, 256)) {
      const child = sanitizeVolatileContent(item, depth + 1, stats);
      out.push(child.value);
    }
    return { value: out, stripped: stats.stripped };
  }
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort().slice(0, 512)) {
      if (volatileContentKey(key)) {
        stats.stripped += 1;
        continue;
      }
      const child = sanitizeVolatileContent(value[key], depth + 1, stats);
      if (child.value !== undefined) out[key] = child.value;
    }
    return { value: out, stripped: stats.stripped };
  }
  return { value: String(value), stripped: stats.stripped };
}

class ObservableBankCapacityManager extends BankCapacityManager {
  constructor(options = {}) {
    super(options);
    this.observabilityState = 'UNKNOWN';
    this.notObservableReason = null;
    this.notObservableTransitions = 0;
  }

  observe(context = {}) {
    const character = context.character || {};
    if (!hasObservableBankSnapshot(character)) {
      const persisted = context.bankCatalog && context.bankCatalog.usable === true
        ? context.bankCatalog.snapshot
        : null;
      const capacities = persisted && persisted.packCapacities && typeof persisted.packCapacities === 'object'
        ? persisted.packCapacities
        : null;
      if (persisted && Array.isArray(persisted.rows) && capacities && Object.keys(capacities).length) {
        const syntheticBank = {};
        for (const [pack, rawCapacity] of Object.entries(capacities)) {
          const capacity = Math.max(0, Math.floor(finite(rawCapacity, 0)));
          if (!/^items\d+$/.test(String(pack)) || capacity <= 0) continue;
          syntheticBank[pack] = Array(capacity).fill(null);
        }
        for (const row of persisted.rows) {
          const pack = row && String(row.pack || '');
          const index = Math.floor(finite(row && row.index, -1));
          if (!syntheticBank[pack] || index < 0 || index >= syntheticBank[pack].length || !row.name) continue;
          syntheticBank[pack][index] = {
            name: String(row.name),
            level: Math.max(0, Math.floor(finite(row.level, 0))),
            q: Math.max(1, Math.floor(finite(row.quantity, 1)))
          };
        }
        if (Object.keys(syntheticBank).length) {
          const result = super.observe({
            ...context,
            character: { ...character, bank: syntheticBank }
          });
          this.observabilityState = 'PLANNING_ONLY';
          this.notObservableReason = 'LIVE_BANK_SNAPSHOT_UNAVAILABLE_USING_PERSISTED_CATALOG';
          this.lastObservation = {
            ...result,
            observable: true,
            observationState: 'PLANNING_ONLY',
            reason: this.notObservableReason,
            catalogSource: 'persisted-bank-catalog',
            planningOnly: true,
            liveBankVisible: false,
            actionAuthority: false,
            physicalActionAuthority: false,
            persistedObservedAt: finite(persisted.observedAt)
          };
          return clone(this.lastObservation);
        }
      }
      const previous = this.observabilityState;
      this.observabilityState = 'NOT_OBSERVABLE';
      this.notObservableReason = 'BANK_SNAPSHOT_UNAVAILABLE';
      this.pressureHistory = [];
      this.lastObservation = {
        schemaVersion: BANK_CAPACITY_SCHEMA_VERSION,
        observedAt: Number.isFinite(Number(context.observedAt)) ? Number(context.observedAt) : this.now(),
        character: {
          name: character.name || null,
          map: character.map || null,
          gold: Number.isFinite(Number(character.gold)) ? Math.max(0, Number(character.gold)) : null
        },
        observable: false,
        observationState: 'NOT_OBSERVABLE',
        reason: this.notObservableReason,
        catalogSource: 'bank-snapshot-unavailable',
        packs: [],
        totals: {
          capacity: null,
          occupied: null,
          free: null,
          compatibleStackHeadroom: null,
          consolidationSlotsRecoverable: null
        },
        unlockedPackCount: null,
        lockedPackCount: null,
        pressureNow: false,
        sustainedPressure: false,
        actionAuthority: false
      };
      this.stats.observations += 1;
      if (previous !== this.observabilityState) {
        this.notObservableTransitions += 1;
        this._event('BANK_CAPACITY_NOT_OBSERVABLE', 'info', this.notObservableReason, {
          character: character.name || null,
          map: character.map || null
        });
      }
      return clone(this.lastObservation);
    }

    const result = super.observe(context);
    this.observabilityState = 'OBSERVED';
    this.notObservableReason = null;
    this.lastObservation = {
      ...result,
      observable: true,
      observationState: 'OBSERVED',
      reason: null
    };
    return clone(this.lastObservation);
  }

  planSpace(request = {}, context = {}) {
    const observation = context.observation || this.lastObservation || this.observe(context);
    if (!observation || observation.observable === false || observation.observationState === 'NOT_OBSERVABLE') {
      this.stats.plans += 1;
      this.lastPlan = {
        at: this.now(),
        planned: false,
        reason: 'BANK_SNAPSHOT_NOT_OBSERVABLE',
        actionAuthority: false
      };
      return clone(this.lastPlan);
    }
    const plan = super.planSpace(request, { ...context, observation });
    if (observation.planningOnly === true) {
      this.lastPlan = {
        ...plan,
        planningOnly: true,
        requiresLiveBankRevalidation: true,
        actionAuthority: false,
        executionAuthority: false,
        observationSource: 'persisted-bank-catalog'
      };
      return clone(this.lastPlan);
    }
    return plan;
  }

  status() {
    return {
      ...super.status(),
      observability: {
        state: this.observabilityState,
        reason: this.notObservableReason,
        transitionsToNotObservable: this.notObservableTransitions
      }
    };
  }
}

function createObservableBankCapacityManager(options = {}) {
  return new ObservableBankCapacityManager({
    now: options.now,
    log: options.log,
    workspaceSlots: options.bankWorkspaceSlots == null ? options.inventoryWorkspaceSlots : options.bankWorkspaceSlots,
    protectedGoldReserve: options.bankProtectedGoldReserve,
    protectedShellReserve: options.bankProtectedShellReserve,
    allowShellSpend: options.bankAllowShellSpend === true,
    pressureObservationsRequired: options.bankPressureObservationsRequired
  });
}

class PreFarmingReliabilityPolicy {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.installed = false;
    this.safeEntityIds = new Set();
    this.safeEntitySnapshotAt = null;
    this.stats = {
      merchantFarmerSuppressions: 0,
      merchantScheduleSuppressions: 0,
      merchantLocalFarmSuppressions: 0,
      incidentalVisibleMonstersIgnored: 0,
      unsafeVisibleMonstersBlocked: 0,
      incidentalTargetsFiltered: 0,
      incompleteSupplyReports: 0,
      supplyHolds: 0,
      contentRecordsMigrated: 0,
      contentVolatileFieldsStripped: 0,
      contentFlappingRecordsReobserved: 0
    };
    this.lastSupplyHold = null;
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (log && typeof log.emit === 'function') {
      log.emit({ component: 'pre-farming-reliability', event, severity, reason, data });
    }
  }

  _character() {
    const root = this.runtime && this.runtime.root;
    return root && (root.character || root.parent && root.parent.character) ||
      this.runtime && this.runtime.lastSnapshot && this.runtime.lastSnapshot.character || null;
  }

  _isMerchant() {
    const c = this._character();
    return String(c && (c.ctype || c.type) || '').toLowerCase() === 'merchant';
  }

  _installMerchantBoundary() {
    if (!this._isMerchant()) return;
    const farmer = this.runtime.farmer;
    if (farmer && !farmer.__merchantSchedulingSuppressed && typeof farmer.ensureScheduled === 'function') {
      farmer.__merchantSchedulingSuppressed = true;
      const originalEnsureScheduled = farmer.ensureScheduled.bind(farmer);
      farmer.ensureScheduled = (scheduler, owner) => {
        if (this._isMerchant()) {
          this.stats.merchantScheduleSuppressions += 1;
          return null;
        }
        return originalEnsureScheduled(scheduler, owner);
      };
    }
    if (farmer && farmer.enabled !== false && typeof farmer.setEnabled === 'function') {
      farmer.setEnabled(false);
      this.stats.merchantFarmerSuppressions += 1;
      this._event('MERCHANT_FARMER_FSM_SUPPRESSED', 'info', 'MERCHANT_ROLE_BOUNDARY');
    }
    if (this.runtime.localFarming && this.runtime.localFarming.enabled !== false) {
      this.runtime.localFarming.enabled = false;
      this.stats.merchantLocalFarmSuppressions += 1;
      this._event('MERCHANT_LOCAL_FARMING_SUPPRESSED', 'info', 'MERCHANT_ROLE_BOUNDARY');
    }
  }

  _installSafeFarmSnapshotTracking() {
    const runtime = this.runtime;
    if (runtime.__preFarmingSafeSnapshotTrackingInstalled || typeof runtime._farmSnapshot !== 'function') return;
    runtime.__preFarmingSafeSnapshotTrackingInstalled = true;
    const originalFarmSnapshot = runtime._farmSnapshot.bind(runtime);
    runtime._farmSnapshot = (snapshot, gameData, profile) => {
      const safe = originalFarmSnapshot(snapshot, gameData, profile);
      this.safeEntityIds = new Set((safe && safe.entities || []).filter((row) => row && row.id != null).map((row) => String(row.id)));
      this.safeEntitySnapshotAt = snapshot && snapshot.observedAt != null ? snapshot.observedAt : runtime.now();
      return safe;
    };
  }

  _installLocalFarmArbitration() {
    const local = this.runtime.localFarming;
    const farmer = this.runtime.farmer;
    if (!local || !farmer || local.__preFarmingVisiblePolicyInstalled) return;
    local.__preFarmingVisiblePolicyInstalled = true;
    const originalVisible = local._visibleMonsters.bind(local);
    local._visibleMonsters = (snapshot) => {
      const all = originalVisible(snapshot);
      const characterName = snapshot && snapshot.character && snapshot.character.name;
      const targetId = farmer.targetId == null ? null : String(farmer.targetId);
      const planMonster = local.currentPlan && local.currentPlan.monster ? String(local.currentPlan.monster) : null;
      let unsafeBlocked = 0;
      const blocking = all.filter((entity) => {
        if (characterName && String(entity.target || '') === String(characterName)) return true;
        if (targetId != null && entity.id != null && String(entity.id) === targetId) return true;
        if (planMonster && String(entity.mtype || '') === planMonster) return true;
        const safetyApproved = entity.id != null && this.safeEntityIds.has(String(entity.id));
        if (!safetyApproved) {
          unsafeBlocked += 1;
          return true;
        }
        return false;
      });
      const ignored = Math.max(0, all.length - blocking.length);
      if (ignored) this.stats.incidentalVisibleMonstersIgnored += ignored;
      if (unsafeBlocked) this.stats.unsafeVisibleMonstersBlocked += unsafeBlocked;
      return blocking;
    };

    if (farmer.__preFarmingTargetPolicyInstalled || typeof farmer._safeLiveMonsters !== 'function') return;
    farmer.__preFarmingTargetPolicyInstalled = true;
    const originalSafeLive = farmer._safeLiveMonsters.bind(farmer);
    farmer._safeLiveMonsters = (snapshot, party) => {
      const all = originalSafeLive(snapshot, party);
      const plan = local.currentPlan;
      const plannedMonster = plan && plan.monster ? String(plan.monster) : null;
      if (!plannedMonster) return all;
      const characterName = snapshot && snapshot.character && snapshot.character.name;
      const filtered = all.filter((entity) => {
        if (characterName && String(entity.target || '') === String(characterName)) return true;
        return String(entity.mtype || '') === plannedMonster;
      });
      this.stats.incidentalTargetsFiltered += Math.max(0, all.length - filtered.length);
      return filtered;
    };
  }

  _installNullableSupplyTelemetry() {
    const bridge = this.runtime.partyTelemetry;
    if (!bridge || bridge.__nullableSupplyEvidenceInstalled || typeof bridge._cleanReport !== 'function') return;
    bridge.__nullableSupplyEvidenceInstalled = true;
    const originalClean = bridge._cleanReport.bind(bridge);
    bridge._cleanReport = (report, sender) => {
      const clean = originalClean(report, sender);
      if (!clean) return clean;
      const source = report && report.supplies;
      const fields = ['inventorySize', 'inventoryLimit', 'freeSlots', 'hpPotions', 'mpPotions'];
      const supplies = { ...(clean.supplies || {}) };
      for (const field of fields) {
        const observed = ownObservedNumber(source, field);
        supplies[field] = observed == null ? null : Math.max(0, observed);
      }
      clean.x = ownObservedNumber(report, 'x');
      clean.y = ownObservedNumber(report, 'y');
      clean.map = report && typeof report.map === 'string' && report.map.trim() ? report.map.trim() : null;
      supplies.complete = supplyEvidenceComplete(supplies);
      supplies.evidence = supplies.complete ? 'COMPLETE' : 'INCOMPLETE';
      clean.serviceEvidenceComplete = serviceEvidenceComplete({ ...clean, supplies });
      if (!clean.serviceEvidenceComplete) this.stats.incompleteSupplyReports += 1;
      clean.supplies = supplies;
      return clean;
    };
  }

  _installSupplyPlannerBoundary() {
    const planner = this.runtime.merchantServicePlanner;
    if (!planner || planner.__nullableSupplyPlannerInstalled || typeof planner._need !== 'function' || typeof planner.plan !== 'function') return;
    planner.__nullableSupplyPlannerInstalled = true;
    const originalNeed = planner._need.bind(planner);
    const originalPlan = planner.plan.bind(planner);
    planner._need = (report) => {
      if (!serviceEvidenceComplete(report)) return null;
      return originalNeed(report);
    };
    planner.plan = (input = {}) => {
      const now = planner.now();
      const freshCombatReports = (Array.isArray(input.reports) ? input.reports : []).filter((report) => {
        if (!report || !report.name || String(report.ctype || '').toLowerCase() === 'merchant') return false;
        const at = finiteObserved(report.at);
        if (at == null || now - at > planner.reportTtlMs) return false;
        if (report.rip === true || report.active === false) return false;
        return true;
      });
      const incomplete = freshCombatReports.filter((report) => !serviceEvidenceComplete(report));
      const result = originalPlan(input);
      if (!incomplete.length) return result;
      const actionableComplete = freshCombatReports.some((report) => serviceEvidenceComplete(report) && originalNeed(report));
      if (actionableComplete) return result;
      if (!result || result.kind !== 'STAND_OPEN') return result;
      const hold = planner._plan('HOLD', 'SUPPLY_EVIDENCE_INSUFFICIENT', {
        incompleteReports: incomplete.slice(0, 8).map((report) => ({ name: report.name, at: report.at }))
      });
      this.stats.supplyHolds += 1;
      this.lastSupplyHold = clone(hold);
      return hold;
    };
  }

  _installStableContentFingerprinting() {
    const monitor = this.runtime.contentDrift;
    if (!monitor || monitor.__stableContentProfileInstalled || typeof monitor._observe !== 'function') return;
    monitor.__stableContentProfileInstalled = true;
    const originalObserve = monitor._observe.bind(monitor);
    monitor._observe = (category, id, value, options = {}) => {
      if (!['maps', 'npcs'].includes(String(category))) return originalObserve(category, id, value, options);
      const sanitized = sanitizeVolatileContent(value);
      this.stats.contentVolatileFieldsStripped += sanitized.stripped;
      const key = `${String(category)}:${String(id)}`;
      const current = monitor.records && monitor.records.get(key);
      const fp = fingerprint(sanitized.value);
      if (current && current.semanticFingerprintProfile !== CONTENT_FINGERPRINT_PROFILE) {
        const legacyLifecycle = current.lifecycle;
        const legacyChangeCount = Number(current.changeCount) || 0;
        current.fingerprint = fp.hash;
        current.baselineFingerprint = fp.hash;
        current.previousFingerprint = null;
        current.bytes = fp.bytes;
        current.semanticFingerprintProfile = CONTENT_FINGERPRINT_PROFILE;
        current.semanticProfileMigratedAt = monitor.now();
        if (legacyLifecycle === 'QUARANTINED' && legacyChangeCount >= 3 && sanitized.stripped > 0) {
          current.semanticMigrationPending = true;
          current.semanticStableSamples = 0;
        }
        this.stats.contentRecordsMigrated += 1;
        this._event('CONTENT_FINGERPRINT_PROFILE_MIGRATED', 'info', 'VOLATILE_FIELDS_EXCLUDED', {
          category: String(category),
          id: String(id),
          legacyLifecycle,
          legacyChangeCount,
          strippedFields: sanitized.stripped,
          controlAuthorityGranted: false
        });
      }
      const row = originalObserve(category, id, sanitized.value, options);
      const updated = monitor.records && monitor.records.get(key);
      if (updated && updated.semanticMigrationPending === true) {
        if (updated.fingerprint === fp.hash && (!row || row.kind === 'UNCHANGED')) {
          updated.semanticStableSamples = Math.max(0, Number(updated.semanticStableSamples) || 0) + 1;
        } else {
          updated.semanticStableSamples = 0;
        }
        if (updated.semanticStableSamples >= 3 && updated.lifecycle === 'QUARANTINED') {
          updated.semanticMigrationPending = false;
          updated.lifecycle = 'OBSERVED';
          updated.baselineFingerprint = updated.fingerprint;
          updated.previousFingerprint = null;
          updated.lastSeenAt = monitor.now();
          if (monitor.stats) monitor.stats.revalidated += 1;
          if (typeof monitor.save === 'function') monitor.save({ force: true });
          this.stats.contentFlappingRecordsReobserved += 1;
          this._event('CONTENT_LEGACY_VOLATILE_QUARANTINE_REOBSERVED', 'info', 'STABLE_SEMANTIC_FINGERPRINT', {
            category: String(category),
            id: String(id),
            fingerprint: updated.fingerprint,
            stableSamples: updated.semanticStableSamples,
            lifecycle: 'OBSERVED',
            controlAuthorityGranted: false
          });
        }
      }
      return row;
    };
  }

  _install() {
    if (this.installed) return;
    this._installMerchantBoundary();
    this._installSafeFarmSnapshotTracking();
    this._installLocalFarmArbitration();
    this._installNullableSupplyTelemetry();
    this._installSupplyPlannerBoundary();
    this._installStableContentFingerprinting();
    this.installed = true;
  }

  beforeTick() {
    if (this._isMerchant()) this._installMerchantBoundary();
  }

  status() {
    return {
      schemaVersion: PRE_FARMING_RELIABILITY_SCHEMA_VERSION,
      mode: 'pre-farming-reliability-hardening',
      actionAuthority: false,
      merchantFarmerFsmAllowed: false,
      merchantFarmerSchedulingAllowed: false,
      incidentalVisibleMonsterNavigationBlock: false,
      unsafeOrUnknownVisibleMonsterStillBlocksNavigation: true,
      selfAggroStillBlocksNavigation: true,
      selectedOrPlannedTargetsStillBlockNavigation: true,
      incompleteSupplyTreatedAsZero: false,
      incompleteLocationTreatedAsZero: false,
      contentFingerprintProfile: CONTENT_FINGERPRINT_PROFILE,
      contentMigrationControlAuthority: false,
      bankOutsideObservableContextTreatedAsFull: false,
      safeEntitySnapshotAt: this.safeEntitySnapshotAt,
      lastSupplyHold: clone(this.lastSupplyHold),
      stats: clone(this.stats)
    };
  }
}

function installPreFarmingReliability(runtime) {
  return new PreFarmingReliabilityPolicy(runtime);
}

module.exports = {
  PRE_FARMING_RELIABILITY_SCHEMA_VERSION,
  CONTENT_FINGERPRINT_PROFILE,
  ObservableBankCapacityManager,
  PreFarmingReliabilityPolicy,
  createObservableBankCapacityManager,
  installPreFarmingReliability,
  hasObservableBankSnapshot,
  supplyEvidenceComplete,
  serviceEvidenceComplete,
  sanitizeVolatileContent
};
