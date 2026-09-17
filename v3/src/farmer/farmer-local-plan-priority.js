'use strict';

const { TaskState } = require('../core/task');
const { ensurePatchRegistry } = require('../core/patch-registry');

const LOCAL_PLAN_PRIORITY_MODE = 'safe-local-plan-priority-v1';

function hpRatio(character) {
  const max = Number(character && character.max_hp) || 0;
  if (max <= 0) return 1;
  return Math.max(0, Math.min(1, (Number(character && character.hp) || 0) / max));
}

function hasSelfAggro(snapshot) {
  const name = snapshot && snapshot.character && snapshot.character.name;
  if (!name) return false;
  return (snapshot.entities || []).some((entity) => entity && entity.mtype && !entity.dead && entity.target === name);
}

class FarmerLocalPlanPriority {
  constructor(runtime) {
    if (!runtime || !runtime.farmer || !runtime.localFarming) throw new Error('runtime farmer and localFarming required');
    this.runtime = runtime;
    this.yieldArmed = true;
    this.stats = { yields: 0, bypassedForSafety: 0, rearmedAfterPlan: 0 };
    this._install();
  }

  _event(event, reason, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (log && typeof log.emit === 'function') {
      log.emit({ component: 'pre-farming-reliability', event, severity: 'info', reason, data });
    }
  }

  _install() {
    const farmer = this.runtime.farmer;
    if (farmer.__localPlanPriorityInstalled || typeof farmer.step !== 'function') return;
    const registry = ensurePatchRegistry(this.runtime);
    const policy = this;
    registry.register({
      moduleId: 'reliability.farmer-local-plan-priority',
      target: farmer,
      method: 'step',
      targetMethod: 'farmer.step',
      kind: 'decorate',
      order: 100,
      patch(next) {
        return function localPlanPriorityStep(context = {}) {
          const local = policy.runtime.localFarming;
          const rawSnapshot = policy.runtime.lastSnapshot || context.snapshot;
          const character = rawSnapshot && rawSnapshot.character;
          const isMerchant = String(character && (character.ctype || character.type) || '').toLowerCase() === 'merchant';

          if (local && local.currentPlan) {
            if (!policy.yieldArmed) policy.stats.rearmedAfterPlan += 1;
            policy.yieldArmed = true;
            return next.call(this, context);
          }

          const safetyBypass = !character || character.rip === true || hasSelfAggro(rawSnapshot) ||
            hpRatio(character) < Number(local && local.config && local.config.engageHpRatio || 0.7) ||
            ['BLOCKED', 'RECOVER', 'ENGAGE', 'TRAVEL'].includes(String(farmer.state || ''));
          if (safetyBypass) {
            policy.stats.bypassedForSafety += 1;
            return next.call(this, context);
          }

          const noApprovedSpawnKnown = local && local.lastDecision && local.lastDecision.reason === 'NO_APPROVED_LOCAL_SPAWN';
          if (!isMerchant && local && local.enabled !== false && policy.yieldArmed && !farmer.targetId && !noApprovedSpawnKnown) {
            policy.yieldArmed = false;
            policy.stats.yields += 1;
            policy._event('FARMER_LOCAL_PLAN_PRIORITY_YIELD', 'LOCAL_PLAN_FIRST_TURN', {
              character: character.name || null,
              farmerState: farmer.state || null
            });
            return { state: TaskState.WAITING, reason: 'LOCAL_PLAN_PRIORITY', stableWait: true };
          }

          return next.call(this, context);
        };
      }
    });
    farmer.__localPlanPriorityInstalled = true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: LOCAL_PLAN_PRIORITY_MODE,
      actionAuthority: false,
      oneSchedulerTurnOnly: true,
      safetyBypass: true,
      yieldArmed: this.yieldArmed,
      stats: { ...this.stats }
    };
  }
}

function installFarmerLocalPlanPriority(runtime) {
  return new FarmerLocalPlanPriority(runtime);
}

module.exports = { FarmerLocalPlanPriority, installFarmerLocalPlanPriority, LOCAL_PLAN_PRIORITY_MODE };
