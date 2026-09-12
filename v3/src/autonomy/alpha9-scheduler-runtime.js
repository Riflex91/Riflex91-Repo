'use strict';

const { StabilityRuntime } = require('../stability/stability-runtime');
const { Alpha9Runtime: Alpha9FoundationRuntime } = require('./alpha9-runtime');

class Alpha9Runtime extends Alpha9FoundationRuntime {
  constructor(options = {}) {
    super(options);
    this.pendingLocalFarmMove = null;
    this.lastLocalFarmExecution = null;
    this.localFarmRequestTtlMs = Math.max(1000, Math.min(10000, Number(options.localFarmRequestTtlMs) || 4000));
    this._installSchedulerOwnedLocalNavigation();
  }

  _installSchedulerOwnedLocalNavigation() {
    const farmer = this.farmer;
    if (!farmer || farmer.__alpha9SchedulerLocalNavigationInstalled || typeof farmer._activeStep !== 'function') return;
    const baseActiveStep = farmer._activeStep.bind(farmer);
    farmer._activeStep = (context) => {
      const result = baseActiveStep(context);
      this._executePendingLocalFarmMove(context);
      return result;
    };
    farmer.__alpha9SchedulerLocalNavigationInstalled = true;
  }

  _queueLocalFarmMove(args, goal) {
    const now = this.now();
    if (this.pendingLocalFarmMove && this.pendingLocalFarmMove.expiresAt > now) {
      return { executed: false, shadow: true, planned: true, coalesced: true, reason: 'LOCAL_FARM_MOVE_ALREADY_QUEUED', requestId: this.pendingLocalFarmMove.id };
    }
    const request = {
      id: `local-farm-move-${now}`,
      at: now,
      expiresAt: now + this.localFarmRequestTtlMs,
      action: 'move',
      args: [Number(args[0]), Number(args[1])],
      goal: goal ? { ...goal } : null
    };
    this.pendingLocalFarmMove = request;
    this.log.emit({ component: 'local-farming', event: 'LOCAL_FARM_MOVE_QUEUED', reason: 'SCHEDULER_OWNED', data: { requestId: request.id, expiresAt: request.expiresAt, goal: request.goal, x: Math.round(request.args[0]), y: Math.round(request.args[1]) } });
    return { executed: false, shadow: true, planned: true, reason: 'SCHEDULER_OWNED_LOCAL_MOVE_PLANNED', requestId: request.id };
  }

  _planningAdapter() {
    const real = this.adapter;
    return {
      mode: real.mode,
      stabilityStatus: () => typeof real.stabilityStatus === 'function' ? real.stabilityStatus() : { movement: {} },
      command: (action, args = []) => {
        if (action !== 'move') return { executed: false, reason: 'LOCAL_NAVIGATION_MOVE_ONLY' };
        if (real.mode !== 'active') return { executed: false, shadow: true, planned: true, reason: 'SHADOW_LOCAL_FARM_MOVE_PREVIEW' };
        return this._queueLocalFarmMove(args, this.localFarming.goal);
      }
    };
  }

  _discardPendingLocalFarmMove(reason, request = this.pendingLocalFarmMove) {
    if (!request) return false;
    if (this.pendingLocalFarmMove && request.id === this.pendingLocalFarmMove.id) this.pendingLocalFarmMove = null;
    this.lastLocalFarmExecution = { at: this.now(), requestId: request.id, executed: false, reason, goal: request.goal || null };
    this.log.emit({ component: 'local-farming', event: 'LOCAL_FARM_MOVE_DISCARDED', severity: reason === 'REQUEST_EXPIRED' ? 'warn' : 'info', reason, data: this.lastLocalFarmExecution });
    return true;
  }

  _localMoveExecutionAllowed(context, request) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    if (!snapshot || !character) return { allowed: false, reason: 'SNAPSHOT_UNAVAILABLE' };
    if (!request || request.expiresAt <= this.now()) return { allowed: false, reason: 'REQUEST_EXPIRED' };
    if (character.rip) return { allowed: false, reason: 'CHARACTER_DEAD' };
    if (this.adapter.mode !== 'active') return { allowed: false, reason: 'MODE_NOT_ACTIVE' };
    if (!this.farmer.enabled) return { allowed: false, reason: 'FARMER_DISABLED' };
    if (this.pendingEmergencyRetreat) return { allowed: false, reason: 'EMERGENCY_RETREAT_PRIORITY' };
    if (this.farmer.targetId) return { allowed: false, reason: 'COMBAT_TARGET_PRIORITY' };
    if (['ENGAGE', 'TRAVEL', 'RECOVER', 'BLOCKED'].includes(this.farmer.state)) return { allowed: false, reason: `FARMER_${this.farmer.state}_PRIORITY` };
    if (ratioSafe(character.hp, character.max_hp) < this.farmer.config.recoverHpRatio) return { allowed: false, reason: 'RECOVERY_PRIORITY' };
    if (request.goal && request.goal.map && character.map && request.goal.map !== character.map) return { allowed: false, reason: 'CROSS_MAP_FORBIDDEN' };
    if ((snapshot.entities || []).some((entity) => entity && entity.mtype && !entity.dead && (entity.hp == null || Number(entity.hp) > 0))) return { allowed: false, reason: 'SAFE_LIVE_TARGET_PRIORITY' };
    const movement = typeof this.adapter.stabilityStatus === 'function' ? this.adapter.stabilityStatus().movement : null;
    if (movement && movement.circuitOpen) return { allowed: false, reason: 'MOVEMENT_CIRCUIT_OPEN' };
    if (movement && movement.pendingOutcomeId) return { allowed: false, reason: 'MOVE_OUTCOME_PENDING' };
    return { allowed: true, reason: 'SCHEDULER_OWNED_LOCAL_MOVE' };
  }

  _executePendingLocalFarmMove(context) {
    const request = this.pendingLocalFarmMove;
    if (!request) return false;
    const gate = this._localMoveExecutionAllowed(context, request);
    if (!gate.allowed) {
      this._discardPendingLocalFarmMove(gate.reason, request);
      return false;
    }
    this.pendingLocalFarmMove = null;
    const result = context.adapter.command('move', request.args);
    this.farmer.lastActionAt = this.now();
    this.lastLocalFarmExecution = {
      at: this.now(),
      requestId: request.id,
      executed: !!result.executed,
      shadow: !!result.shadow,
      reason: result.reason || gate.reason,
      outcomeId: result.outcomeId || null,
      goal: request.goal || null,
      x: request.args[0],
      y: request.args[1]
    };
    if (this.localFarming.lastMove && this.localFarming.lastMove.goal && request.goal && this.localFarming.lastMove.goal.monster === request.goal.monster) {
      this.localFarming.lastMove.schedulerExecution = { ...this.lastLocalFarmExecution };
    }
    this.log.emit({
      component: 'local-farming',
      event: result.executed || result.shadow ? 'LOCAL_FARM_MOVE_EXECUTED' : 'LOCAL_FARM_MOVE_EXECUTION_FAILED',
      severity: result.executed || result.shadow ? 'info' : 'warn',
      reason: result.reason || gate.reason,
      data: this.lastLocalFarmExecution
    });
    return !!result.executed || !!result.shadow;
  }

  tick() {
    StabilityRuntime.prototype.tick.call(this);
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return;
    this._restoreBrainOnce();
    this._propagateSafetyIncident();
    const profile = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const paused = this.adapter.mode !== 'active' || !this.farmer.enabled || snapshot.character.rip === true;
    const progressStatus = this.progressWatchdog.observe(snapshot, { paused });
    this._handleProgressReassessment();
    const localContext = { snapshot, gameData, world: this.world, party: profile, adapter: this.adapter };
    const localStatusBefore = this.localFarming.status(localContext);
    const brainContext = this._brainContext(snapshot, profile, gameData, localStatusBefore, progressStatus);
    this.brain.observe(brainContext);
    if (this._canSeekSpawn(snapshot) && !this.pendingLocalFarmMove) {
      this.lastLocalFarmStep = this.localFarming.step({ ...localContext, adapter: this._planningAdapter() }, this.brain.preference());
    } else {
      this.lastLocalFarmStep = { acted: false, reason: this.pendingLocalFarmMove ? 'SCHEDULER_LOCAL_MOVE_PENDING' : 'LOCAL_FARMING_NOT_ELIGIBLE' };
    }
    this._persistBrainMaybe(false);
  }

  status() {
    const base = super.status();
    return {
      ...base,
      localFarming: {
        ...base.localFarming,
        schedulerOwned: true,
        pendingSchedulerMove: this.pendingLocalFarmMove ? { ...this.pendingLocalFarmMove } : null,
        lastSchedulerExecution: this.lastLocalFarmExecution,
        requestTtlMs: this.localFarmRequestTtlMs
      }
    };
  }
}

function ratioSafe(value, max) {
  const d = Number(max) || 0;
  return d > 0 ? Math.max(0, Math.min(1, (Number(value) || 0) / d)) : 1;
}

module.exports = { Alpha9Runtime };
