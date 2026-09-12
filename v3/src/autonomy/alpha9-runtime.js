'use strict';

const { StabilityRuntime } = require('../stability/stability-runtime');
const { EvidenceKind } = require('../world/world-model');
const { LocalSpawnNavigator, ProgressWatchdog } = require('./local-farming');
const { StrategyBrain } = require('../brain/strategy-brain');

function ratio(value, max) {
  const d = Number(max) || 0;
  if (d <= 0) return 1;
  return Math.max(0, Math.min(1, (Number(value) || 0) / d));
}

class Alpha9Runtime extends StabilityRuntime {
  constructor(options = {}) {
    super(options);
    this.localFarming = options.localFarming || new LocalSpawnNavigator({
      now: this.now,
      log: this.log,
      planner: this.planner,
      maxStep: options.localFarmMaxStep,
      arrivalRadius: options.localFarmArrivalRadius,
      moveCooldownMs: options.localFarmMoveCooldownMs,
      goalHoldMs: options.localFarmGoalHoldMs,
      arrivalHoldMs: options.localFarmArrivalHoldMs
    });
    this.progressWatchdog = options.progressWatchdog || new ProgressWatchdog({
      now: this.now,
      log: this.log,
      watchAfterMs: options.progressWatchAfterMs,
      degradedAfterMs: options.progressDegradedAfterMs,
      cooldownMs: options.progressCooldownMs
    });
    this.brain = options.brain || new StrategyBrain({
      now: this.now,
      log: this.log,
      hiddenSize: 24,
      replayCapacity: options.brainReplayCapacity || 512,
      diaryCapacity: options.brainDiaryCapacity || 80,
      outcomeMs: options.brainOutcomeMs,
      decisionIntervalMs: options.brainDecisionIntervalMs,
      minInfluenceConfidence: options.brainMinInfluenceConfidence,
      influenceHoldMs: options.brainInfluenceHoldMs,
      seed: options.brainSeed,
      replaySeed: options.brainReplaySeed
    });
    this.lastFarmSnapshot = null;
    this.lastLocalFarmStep = null;
    this.brainStateRestored = false;
    this.brainStateRestoreAttempted = false;
    this.brainStateLastSavedAt = 0;
    this.brainStateLastSavedUpdates = -1;
    this.brainPersistenceIntervalMs = Math.max(10000, Number(options.brainPersistenceIntervalMs) || 60000);
    this.brainStateMaxBytes = Math.max(50000, Math.min(750000, Number(options.brainStateMaxBytes) || 350000));
    this.brainStateLastError = null;
  }

  _farmSnapshot(snapshot, gameData, profile) {
    const filtered = super._farmSnapshot(snapshot, gameData, profile);
    this.lastFarmSnapshot = filtered;
    return filtered;
  }

  _brainFact() {
    return this.world && typeof this.world.fact === 'function' ? this.world.fact('brain', 'strategy', 'state') : null;
  }

  _restoreBrainOnce() {
    if (this.brainStateRestoreAttempted || !this.worldLoaded) return false;
    this.brainStateRestoreAttempted = true;
    const fact = this._brainFact();
    const state = fact && fact.value;
    if (state == null) {
      this.brainStateRestored = true;
      this.log.emit({ component: 'brain', event: 'BRAIN_STORAGE_EMPTY' });
      return false;
    }
    const restored = this.brain.restoreState(state);
    this.brainStateRestored = restored;
    this.brainStateLastError = restored ? null : this.brain.lastRestoreError;
    this.log.emit({ component: 'brain', event: restored ? 'BRAIN_STATE_RESTORED' : 'BRAIN_STATE_RESTORE_FAILED', severity: restored ? 'info' : 'warn', reason: restored ? null : 'BRAIN_STATE_INVALID', data: { influenceForcedOff: true, message: this.brainStateLastError } });
    return restored;
  }

  _persistBrainMaybe(force = false) {
    if (!this.world || !this.brain) return false;
    const now = this.now();
    if (!force && now - this.brainStateLastSavedAt < this.brainPersistenceIntervalMs && this.brain.student.updates === this.brainStateLastSavedUpdates) return false;
    let state;
    let serialized;
    try {
      state = this.brain.exportState();
      serialized = JSON.stringify(state);
    } catch (error) {
      this.brainStateLastError = String(error && error.message || error);
      this.log.emit({ component: 'brain', event: 'BRAIN_STATE_SAVE_SKIPPED', severity: 'warn', reason: 'SERIALIZE_ERROR', data: { message: this.brainStateLastError } });
      return false;
    }
    if (serialized.length > this.brainStateMaxBytes) {
      this.brainStateLastError = 'BRAIN_STATE_SIZE_LIMIT';
      this.log.emit({ component: 'brain', event: 'BRAIN_STATE_SAVE_SKIPPED', severity: 'warn', reason: 'BRAIN_STATE_SIZE_LIMIT', data: { bytes: serialized.length, maxBytes: this.brainStateMaxBytes } });
      return false;
    }
    this.world.observeEntity('brain', 'strategy', { schemaVersion: 1, state }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
    this.brainStateLastSavedAt = now;
    this.brainStateLastSavedUpdates = this.brain.student.updates;
    this.brainStateLastError = null;
    this.log.emit({ component: 'brain', event: 'BRAIN_STATE_STAGED_FOR_PERSISTENCE', data: { bytes: serialized.length, updates: this.brain.student.updates, forced: force } });
    return true;
  }

  _brainContext(snapshot, profile, gameData, localStatus, progressStatus) {
    const stability = this.adapter && typeof this.adapter.stabilityStatus === 'function' ? this.adapter.stabilityStatus() : {};
    const status = super.status();
    return {
      snapshot,
      party: profile,
      gameData,
      farmer: this.farmerStatus(),
      combatEmergency: status.combatEmergency,
      contentSafety: status.combatRisk && status.combatRisk.contentSafety,
      localFarming: localStatus,
      progress: progressStatus,
      performance: this.performance.status(),
      movement: stability && stability.movement || {},
      persistence: this.persistence.status(),
      headlessHealth: { state: snapshot ? 'HEALTHY' : 'DEGRADED' },
      world: this.world.summary(),
      noveltyCount: this.lastDiscovery && this.lastDiscovery.newEntities || 0
    };
  }

  _canSeekSpawn(snapshot) {
    if (!snapshot || !snapshot.character || snapshot.character.rip) return false;
    if (this.adapter.mode !== 'active' && this.adapter.mode !== 'shadow') return false;
    if (!this.farmer.enabled || this.farmer.targetId) return false;
    if (this.pendingEmergencyRetreat) return false;
    if (this.farmer.state === 'ENGAGE' || this.farmer.state === 'RECOVER' || this.farmer.state === 'BLOCKED') return false;
    if (ratio(snapshot.character.hp, snapshot.character.max_hp) < this.farmer.config.recoverHpRatio) return false;
    const filtered = this.lastFarmSnapshot;
    if (filtered && Array.isArray(filtered.entities) && filtered.entities.some((entity) => entity && entity.mtype && !entity.dead && (entity.hp == null || Number(entity.hp) > 0))) return false;
    return true;
  }

  _handleProgressReassessment() {
    if (this.adapter.mode !== 'active') return false;
    if (this.farmer.state === 'ENGAGE' || this.farmer.state === 'RECOVER') return false;
    if (!this.progressWatchdog.requestReassessment()) return false;
    this.localFarming.reset('PROGRESS_WATCHDOG');
    this.farmer.lastShadowPlanAt = -Infinity;
    if (typeof this.farmer._clearTarget === 'function') this.farmer._clearTarget('PROGRESS_WATCHDOG');
    if (typeof this.farmer._transition === 'function') this.farmer._transition('REASSESS', 'PROGRESS_WATCHDOG');
    return true;
  }

  setBrainInfluenceEnabled(enabled) {
    const resolved = this.brain.setInfluenceEnabled(enabled === true);
    this._announce(`[AIO v3] BRAIN INFLUENCE | ${resolved ? 'enabled' : 'disabled'} | strategic local preference only`, 'VISIBLE_BRAIN_INFLUENCE_CHANGED');
    return resolved;
  }

  submitBrainTeacher(input) {
    const snapshot = this.lastSnapshot;
    if (!snapshot) return { accepted: false, reason: 'SNAPSHOT_UNAVAILABLE' };
    const profile = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const localContext = { snapshot, gameData, world: this.world, party: profile, adapter: this.adapter };
    const localStatus = this.localFarming.status(localContext);
    const progressStatus = this.progressWatchdog.status();
    return this.brain.submitTeacher(input, this._brainContext(snapshot, profile, gameData, localStatus, progressStatus));
  }

  tick() {
    super.tick();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return;
    this._restoreBrainOnce();
    const profile = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const paused = this.adapter.mode !== 'active' || !this.farmer.enabled || snapshot.character.rip === true;
    const progressStatus = this.progressWatchdog.observe(snapshot, { paused });
    this._handleProgressReassessment();
    const localContext = { snapshot, gameData, world: this.world, party: profile, adapter: this.adapter };
    const localStatusBefore = this.localFarming.status(localContext);
    const brainContext = this._brainContext(snapshot, profile, gameData, localStatusBefore, progressStatus);
    this.brain.observe(brainContext);
    if (this._canSeekSpawn(snapshot)) this.lastLocalFarmStep = this.localFarming.step(localContext, this.brain.preference());
    else this.lastLocalFarmStep = { acted: false, reason: 'LOCAL_FARMING_NOT_ELIGIBLE' };
    this._persistBrainMaybe(false);
  }

  stop() {
    this._persistBrainMaybe(true);
    return super.stop();
  }

  status() {
    const base = super.status();
    const snapshot = this.lastSnapshot;
    let localContext = null;
    if (snapshot && snapshot.character) {
      localContext = { snapshot, gameData: this.adapter.getGameData() || {}, world: this.world, party: this._partyProfile(snapshot), adapter: this.adapter };
    }
    return {
      ...base,
      localFarming: {
        ...this.localFarming.status(localContext),
        lastStep: this.lastLocalFarmStep,
        progress: this.progressWatchdog.status()
      },
      brain: {
        ...this.brain.status(),
        persistence: {
          restored: this.brainStateRestored,
          restoreAttempted: this.brainStateRestoreAttempted,
          lastSavedAt: this.brainStateLastSavedAt || null,
          lastSavedUpdates: this.brainStateLastSavedUpdates,
          maxBytes: this.brainStateMaxBytes,
          lastError: this.brainStateLastError
        },
        research: this.brain.researchSummary()
      }
    };
  }
}

module.exports = { Alpha9Runtime };
