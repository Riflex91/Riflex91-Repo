'use strict';

const LEGACY_OWNERSHIP_GUARD_MODE = 'alpha27-merchant-legacy-ownership-guard-v1';
const DELEGATION_REASON = 'ALPHA27_MERCHANT_AUTHORITY_OWNS_LIVE_ACTIONS';

function characterOf(runtime) {
  const root = runtime && runtime.root;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function alpha27OwnsMerchant(runtime) {
  const c = characterOf(runtime);
  const convergence = runtime && runtime.alpha27CombatMerchantConvergence;
  return !!(c && String(c.ctype || c.type || '').toLowerCase() === 'merchant' && convergence && convergence.merchant);
}

function markDelegated(runtime, controller, controllerName, action = 'DELEGATED') {
  if (!controller) return false;
  const now = runtime && typeof runtime.now === 'function' ? runtime.now() : Date.now();
  controller.lastDecision = {
    at: now,
    action,
    reason: DELEGATION_REASON,
    owner: 'alpha27',
    suppressedController: controllerName
  };
  return false;
}

function guardCycle(runtime, controller, controllerName) {
  if (!controller || typeof controller.cycle !== 'function' || controller.__alpha27OwnershipCycleGuarded) return false;
  const original = controller.cycle.bind(controller);
  controller.__alpha27OwnershipOriginalCycle = original;
  controller.cycle = async (...args) => {
    if (alpha27OwnsMerchant(runtime)) return markDelegated(runtime, controller, controllerName);
    return original(...args);
  };
  controller.__alpha27OwnershipCycleGuarded = true;
  return true;
}

function guardPrimitive(runtime, controller, methodName, controllerName) {
  if (!controller || typeof controller[methodName] !== 'function') return false;
  const marker = `__alpha27OwnershipGuarded_${methodName}`;
  if (controller[marker]) return false;
  const original = controller[methodName].bind(controller);
  controller[`__alpha27OwnershipOriginal_${methodName}`] = original;
  controller[methodName] = (...args) => {
    if (alpha27OwnsMerchant(runtime)) return markDelegated(runtime, controller, controllerName, `SUPPRESSED_${methodName}`);
    return original(...args);
  };
  controller[marker] = true;
  return true;
}

function emitInstalled(runtime, state) {
  try {
    if (runtime && runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({
        component: 'alpha27-merchant-legacy-ownership-guard',
        event: 'ALPHA27_MERCHANT_SINGLE_OWNER_GUARD_INSTALLED',
        severity: 'info',
        reason: DELEGATION_REASON,
        data: { ...state }
      });
    }
  } catch (_) {}
}

function installAlpha27MerchantLegacyOwnershipGuard(runtime) {
  if (!runtime) throw new Error('runtime required');

  const v2 = runtime.economyEquipmentAutonomyV2 || null;
  const legacy = runtime.merchantEconomyAutonomy || null;
  const changes = {
    v2Cycle: guardCycle(runtime, v2, 'economy-equipment-autonomy-v2'),
    legacyCycle: guardCycle(runtime, legacy, 'merchant-economy-autonomy'),
    legacyMove: guardPrimitive(runtime, legacy, '_move', 'merchant-economy-autonomy'),
    legacyServiceMove: guardPrimitive(runtime, legacy, '_serviceMove', 'merchant-economy-autonomy')
  };

  const existing = runtime.alpha27MerchantLegacyOwnershipGuard;
  const state = existing || {
    mode: LEGACY_OWNERSHIP_GUARD_MODE,
    installedAt: typeof runtime.now === 'function' ? runtime.now() : Date.now()
  };
  Object.assign(state, {
    reason: DELEGATION_REASON,
    ownershipActive: alpha27OwnsMerchant(runtime),
    v2Present: !!v2,
    legacyPresent: !!legacy,
    guarded: {
      v2Cycle: !!(v2 && v2.__alpha27OwnershipCycleGuarded),
      legacyCycle: !!(legacy && legacy.__alpha27OwnershipCycleGuarded),
      legacyMove: !!(legacy && legacy.__alpha27OwnershipGuarded__move),
      legacyServiceMove: !!(legacy && legacy.__alpha27OwnershipGuarded__serviceMove)
    },
    status() {
      return {
        mode: LEGACY_OWNERSHIP_GUARD_MODE,
        reason: DELEGATION_REASON,
        ownershipActive: alpha27OwnsMerchant(runtime),
        v2Present: !!runtime.economyEquipmentAutonomyV2,
        legacyPresent: !!runtime.merchantEconomyAutonomy,
        guarded: { ...state.guarded }
      };
    }
  });
  runtime.alpha27MerchantLegacyOwnershipGuard = state;
  if (!existing && Object.values(changes).some(Boolean)) emitInstalled(runtime, state.status());
  return state;
}

module.exports = {
  LEGACY_OWNERSHIP_GUARD_MODE,
  DELEGATION_REASON,
  alpha27OwnsMerchant,
  installAlpha27MerchantLegacyOwnershipGuard
};
