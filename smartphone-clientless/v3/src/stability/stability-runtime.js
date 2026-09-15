'use strict';

const { Runtime } = require('../runtime');
const { VERSION } = require('../version');
const { TaskState } = require('../core/task');
const { StabilityGameAdapter } = require('../game/stability-adapter');
const { StableScheduler } = require('../core/stable-scheduler');
const { ResilientWorldPersistence } = require('../world/resilient-persistence');
const { KnowledgeAgingPolicy, installKnowledgeAging, installStaleRiskGuard } = require('../world/knowledge-aging');
const { CombatStabilitySupervisor } = require('./combat-stability-supervisor');

class StabilityRuntime extends Runtime {
  constructor(options = {}) {
    super(options);
    // Runtime alpha.8.13 remains the historical base implementation. The
    // stability runtime owns the phase-freeze version without rewriting that
    // large proven file, and all emitted events use the phase version.
    this.log.version = VERSION;

    if (!options.adapter) {
      this.adapter = new StabilityGameAdapter({
        root: this.root,
        parent: options.parent,
        log: this.log,
        mode: options.mode || 'shadow',
        now: this.now,
        commandOutcomeCapacity: options.commandOutcomeCapacity,
        commandOutcomePendingCapacity: options.commandOutcomePendingCapacity,
        commandOutcomeTimeoutMs: options.commandOutcomeTimeoutMs,
        commandOutcomeMoveMinDelta: options.commandOutcomeMoveMinDelta,
        movementMaxFailures: options.movementMaxFailures,
        movementCircuitMs: options.movementCircuitMs
      });
    }

    if (!options.scheduler) {
      this.scheduler = new StableScheduler({
        now: this.now,
        log: this.log,
        completedCapacity: options.schedulerCompletedCapacity
      });
    }

    if (!options.persistence) {
      this.persistence = new ResilientWorldPersistence({
        root: this.root,
        storage: options.storage,
        now: this.now,
        log: this.log,
        minIntervalMs: options.persistenceIntervalMs || 30000,
        maxBytes: options.persistenceMaxBytes,
        retryBaseMs: options.persistenceRetryBaseMs,
        retryMaxMs: options.persistenceRetryMaxMs,
        saveCircuitAfter: options.persistenceSaveCircuitAfter,
        saveCircuitMs: options.persistenceSaveCircuitMs
      });
      this.worldLoaded = false;
    }

    this.knowledgeAging = new KnowledgeAgingPolicy({
      now: this.now,
      freshMs: options.knowledgeFreshMs,
      staleMs: options.knowledgeStaleMs,
      minFreshness: options.knowledgeMinFreshness
    });
    installKnowledgeAging(this.world, this.knowledgeAging);
    installStaleRiskGuard(this.combatRisk, this.world, this.knowledgeAging, {
      weight: options.staleKnowledgeRiskWeight
    });

    this.stability = new CombatStabilitySupervisor({
      runtime: this,
      adapter: this.adapter,
      log: this.log,
      now: this.now,
      capacity: options.stabilityOutcomeCapacity
    });

    this._installFarmerStableWaitContract();
    this._installKitingCircuitGuard();
  }

  _installFarmerStableWaitContract() {
    const farmer = this.farmer;
    if (!farmer || farmer.__stableWaitContractInstalled) return;
    const baseStep = farmer.step.bind(farmer);
    farmer.step = (context) => {
      const result = baseStep(context) || { state: TaskState.RUNNING };
      const snapshot = context && context.snapshot;
      const character = snapshot && snapshot.character;
      if (!character) return { state: TaskState.WAITING, reason: 'SNAPSHOT_UNAVAILABLE', stableWait: true };
      if (character.rip) return { state: TaskState.WAITING, reason: 'CHARACTER_DEAD', stableWait: true };
      if (farmer.state === 'BLOCKED') {
        return { state: TaskState.WAITING, reason: farmer.stateReason || 'FARMER_BLOCKED', stableWait: true };
      }
      if (result.state === TaskState.WAITING) return { ...result, stableWait: true };
      return result;
    };
    farmer.__stableWaitContractInstalled = true;
  }

  _installKitingCircuitGuard() {
    const farmer = this.farmer;
    if (!farmer || farmer.__kitingCircuitGuardInstalled || typeof farmer._engage !== 'function') return;
    const baseEngage = farmer._engage.bind(farmer);
    farmer._engage = (context, target) => {
      const snapshot = context && context.snapshot;
      const adapter = context && context.adapter;
      if (snapshot && snapshot.character && target && farmer.kiting && adapter && typeof adapter.stabilityStatus === 'function') {
        const decision = farmer.kiting.evaluate(snapshot.character, target);
        const movement = adapter.stabilityStatus().movement;
        if (decision && decision.shouldMove && movement && movement.circuitOpen) {
          if (typeof farmer._event === 'function') {
            farmer._event('FARMER_KITE_SUPPRESSED', 'warn', 'MOVEMENT_CIRCUIT_OPEN', {
              circuitUntil: movement.circuitUntil,
              failureStreak: movement.failureStreak,
              targetId: target.id || null,
              targetType: target.mtype || null
            });
          }
          return;
        }
      }
      return baseEngage(context, target);
    };
    farmer.__kitingCircuitGuardInstalled = true;
  }

  _phaseMessage(message) {
    return String(message || '').replace(/\[AIO v3 [^\]]+\]/, `[AIO v3 ${VERSION}]`);
  }

  _announce(message, event) {
    const resolved = this._phaseMessage(message);
    this.log.emit({ component: 'runtime', event, data: { message: resolved, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(resolved);
    return true;
  }

  _restoreWorldOnce() {
    if (this.worldLoaded) return;
    this.persistence.load(this.world);
    const status = this.persistence.status();
    this.worldLoaded = status.loadComplete === true || (status.loaded === true && status.loadComplete == null);
  }

  start() {
    if (this.timer) return false;
    this._restoreWorldOnce();
    this.startedAt = this.startedAt || this.now();
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STARTED', data: { version: VERSION, mode: this.adapter.mode, tickMs: this.tickMs } });
    const modeNote = this.adapter.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    this._announce(`[AIO v3 ${VERSION}] STARTED | mode=${this.adapter.mode} | ${modeNote}`, 'VISIBLE_STARTUP');
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return true;
  }

  _armEmergencyRetreat(snapshot, entity, emergency, at) {
    if (this.adapter && typeof this.adapter.supersedeMovement === 'function') {
      this.adapter.supersedeMovement('EMERGENCY_RETREAT_OVERRIDE');
    }
    return super._armEmergencyRetreat(snapshot, entity, emergency, at);
  }

  tick() {
    super.tick();
    this.stability.process();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: VERSION,
      stability: {
        commandOutcomes: this.adapter && typeof this.adapter.stabilityStatus === 'function'
          ? this.adapter.stabilityStatus()
          : null,
        combat: this.stability.status(),
        knowledgeAging: this.knowledgeAging.status(this.world),
        stableScheduler: this.scheduler instanceof StableScheduler
      }
    };
  }
}

module.exports = { StabilityRuntime };
