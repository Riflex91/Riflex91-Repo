'use strict';

const { GameAdapter } = require('./adapter');
const { CommandOutcomeTracker, CommandOutcomeState, entityById, inventoryCount } = require('./command-outcomes');

class StabilityGameAdapter extends GameAdapter {
  constructor(options = {}) {
    super(options);
    this.outcomes = options.outcomes || new CommandOutcomeTracker({
      now: this.now,
      log: this.log,
      capacity: options.commandOutcomeCapacity,
      pendingCapacity: options.commandOutcomePendingCapacity,
      defaultTimeoutMs: options.commandOutcomeTimeoutMs,
      moveMinDelta: options.commandOutcomeMoveMinDelta
    });
    this.movementMaxFailures = Math.max(1, Number(options.movementMaxFailures) || 3);
    this.movementCircuitMs = Math.max(1000, Number(options.movementCircuitMs) || 15000);
    this.movementFailureStreak = 0;
    this.movementCircuitUntil = 0;
    this.pendingMovementOutcomeId = null;
    this.lastMovementOutcome = null;
    this.lastMovementFailure = null;
  }

  _beforeState(action, args) {
    const snapshot = this.lastSnapshot || super.snapshot();
    if (!snapshot || !snapshot.character) return null;
    const c = snapshot.character;
    const targetId = action === 'attack' ? args[0] : (action === 'use_skill' ? args[1] : null);
    const target = entityById(snapshot, targetId);
    return {
      observedAt: snapshot.observedAt,
      map: c.map || null,
      x: c.x,
      y: c.y,
      moving: !!c.moving,
      hp: c.hp,
      mp: c.mp,
      hpPotionCount: inventoryCount(snapshot, 'hpot'),
      mpPotionCount: inventoryCount(snapshot, 'mpot'),
      targetId: targetId == null ? null : String(targetId),
      targetPresent: !!target,
      targetHp: target && target.hp != null ? Number(target.hp) : null
    };
  }

  _movementCircuitOpen(now = this.now()) {
    if (this.movementCircuitUntil && now >= this.movementCircuitUntil) {
      this.movementCircuitUntil = 0;
      this.movementFailureStreak = 0;
      if (this.log) this.log.emit({ component: 'adapter', event: 'MOVEMENT_CIRCUIT_CLOSED' });
    }
    return this.movementCircuitUntil > now;
  }

  _recordMovementFailure(reason, outcome = null) {
    const now = this.now();
    this.movementFailureStreak += 1;
    this.lastMovementFailure = {
      at: now,
      reason: reason || 'MOVEMENT_FAILED',
      failureStreak: this.movementFailureStreak,
      outcomeId: outcome && outcome.id || null
    };
    if (this.movementFailureStreak >= this.movementMaxFailures) {
      this.movementCircuitUntil = Math.max(this.movementCircuitUntil, now + this.movementCircuitMs);
      if (this.log) this.log.emit({
        component: 'adapter',
        event: 'MOVEMENT_CIRCUIT_OPENED',
        severity: 'warn',
        reason: this.lastMovementFailure.reason,
        data: {
          failureStreak: this.movementFailureStreak,
          maxFailures: this.movementMaxFailures,
          circuitUntil: this.movementCircuitUntil,
          circuitMs: this.movementCircuitMs
        }
      });
    }
  }

  _reconcileMovement() {
    if (!this.pendingMovementOutcomeId) return null;
    const outcome = this.outcomes.get(this.pendingMovementOutcomeId);
    if (!outcome || outcome.state === CommandOutcomeState.PENDING) return outcome;
    this.pendingMovementOutcomeId = null;
    this.lastMovementOutcome = outcome;
    if (outcome.state === CommandOutcomeState.CONFIRMED) {
      this.movementFailureStreak = 0;
      this.lastMovementFailure = null;
    } else {
      this._recordMovementFailure(outcome.reason || 'MOVE_OUTCOME_TIMEOUT', outcome);
    }
    return outcome;
  }

  supersedeMovement(reason = 'SUPERSEDED') {
    if (!this.pendingMovementOutcomeId) return false;
    const id = this.pendingMovementOutcomeId;
    this.pendingMovementOutcomeId = null;
    if (this.log) this.log.emit({
      component: 'adapter',
      event: 'MOVEMENT_OUTCOME_SUPERSEDED',
      severity: 'warn',
      reason,
      data: { outcomeId: id }
    });
    return true;
  }

  snapshot() {
    const snapshot = super.snapshot();
    this.outcomes.observe(snapshot);
    this._reconcileMovement();
    return snapshot;
  }

  command(action, args = []) {
    const now = this.now();
    const isMovement = action === 'move' || action === 'smart_move' || action === 'town';
    if (isMovement) {
      this._reconcileMovement();
      if (this._movementCircuitOpen(now)) {
        return {
          executed: false,
          accepted: false,
          reason: 'MOVEMENT_CIRCUIT_OPEN',
          circuitUntil: this.movementCircuitUntil
        };
      }
      if (this.pendingMovementOutcomeId) {
        const pending = this.outcomes.get(this.pendingMovementOutcomeId);
        if (pending && pending.state === CommandOutcomeState.PENDING) {
          return {
            executed: true,
            accepted: false,
            coalesced: true,
            reason: 'MOVE_OUTCOME_PENDING',
            outcomeId: pending.id,
            outcomeState: pending.state
          };
        }
        this.pendingMovementOutcomeId = null;
      }
    }

    const before = this.mode === 'active' ? this._beforeState(action, args) : null;
    const result = super.command(action, args);

    if (!result.executed) {
      if (isMovement && !result.shadow && !result.coalesced) this._recordMovementFailure(result.reason || 'MOVE_COMMAND_FAILED');
      return result;
    }

    const outcome = this.outcomes.issue({ action, args, before });
    if (isMovement) this.pendingMovementOutcomeId = outcome.id;
    return {
      ...result,
      accepted: true,
      verified: false,
      outcomeId: outcome.id,
      outcomeState: outcome.state
    };
  }

  commandOutcome(id) {
    return this.outcomes.get(id);
  }

  takeCommandOutcomes(limit = 100) {
    return this.outcomes.drainTerminal(limit);
  }

  stabilityStatus() {
    const now = this.now();
    this._reconcileMovement();
    return {
      outcomes: this.outcomes.status(),
      movement: {
        pendingOutcomeId: this.pendingMovementOutcomeId,
        failureStreak: this.movementFailureStreak,
        maxFailures: this.movementMaxFailures,
        circuitOpen: this._movementCircuitOpen(now),
        circuitUntil: this.movementCircuitUntil || null,
        circuitRemainingMs: Math.max(0, this.movementCircuitUntil - now),
        lastOutcome: this.lastMovementOutcome,
        lastFailure: this.lastMovementFailure
      }
    };
  }
}

module.exports = { StabilityGameAdapter };
