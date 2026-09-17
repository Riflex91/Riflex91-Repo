'use strict';

const ALPHA32_NAVIGATION_MERCHANT_RECOVERY_MODE = 'alpha32-navigation-merchant-recovery-v1';

const STALE_TRANSACTION_REASONS = new Set([
  'INVENTORY_INDEX_OUT_OF_RANGE',
  'LEDGER_ITEM_NOT_FOUND',
  'ITEM_IDENTITY_CHANGED',
  'LEDGER_DISPOSITION_CHANGED',
  'ITEM_QUANTITY_CHANGED',
  'LIVE_ITEM_IDENTITY_MISMATCH',
  'LIVE_ITEM_QUANTITY_MISMATCH',
  'BANK_REQUIRES_FULL_STACK'
]);

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function characterOf(runtime) {
  const root = runtime && runtime.root;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function hpRatio(character) {
  const hp = finite(character && character.hp);
  const maxHp = finite(character && (character.max_hp != null ? character.max_hp : character.maxHp));
  if (hp == null || maxHp == null || maxHp <= 0) return 1;
  return Math.max(0, Math.min(1, hp / maxHp));
}

function isMerchant(character) {
  return !!(character && String(character.ctype || character.type || '').toLowerCase() === 'merchant');
}

function itemQuantity(character, prefix) {
  const items = character && Array.isArray(character.items) ? character.items : [];
  let total = 0;
  for (const item of items) {
    if (!item || !String(item.name || '').startsWith(prefix)) continue;
    total += Math.max(1, Math.floor(finite(item.q, 1)));
  }
  return total;
}

function hashDirection(value) {
  const text = String(value || 'local');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = ((hash * 31) + text.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 2) ? 1 : -1;
}

class Alpha32NavigationMerchantRecovery {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;

    this.merchantRecoveryTriggerHpRatio = clamp(options.merchantRecoveryTriggerHpRatio == null ? 0.50 : options.merchantRecoveryTriggerHpRatio, 0.20, 0.80);
    this.merchantRecoveryResumeHpRatio = clamp(options.merchantRecoveryResumeHpRatio == null ? 0.72 : options.merchantRecoveryResumeHpRatio, this.merchantRecoveryTriggerHpRatio + 0.05, 0.95);
    this.merchantPotionCooldownMs = Math.max(500, Math.min(5000, finite(options.merchantPotionCooldownMs, 1100)));
    this.localDetourMaxAttempts = Math.max(2, Math.min(12, Math.floor(finite(options.localDetourMaxAttempts, 7))));
    this.localDetourMaxRegressionFactor = clamp(options.localDetourMaxRegressionFactor == null ? 0.40 : options.localDetourMaxRegressionFactor, 0.10, 0.80);

    this.merchantRecoveryActive = false;
    this.lastMerchantPotionAt = -Infinity;
    this.lastMerchantRecoveryState = null;
    this.merchantTravelAbortPending = false;
    this.gearDeliveryBackoffUntil = 0;
    this.localDetours = new Map();

    this.stats = {
      blockedTargetIdsFiltered: 0,
      blockedTargetSelectionCycles: 0,
      localFarmDetours: 0,
      localFarmDetourExhaustions: 0,
      staleMerchantTransactionsReleased: 0,
      merchantRecoveryEntries: 0,
      merchantRecoveryExits: 0,
      merchantRecoveryPotionAttempts: 0,
      merchantRecoveryPotionAccepted: 0,
      merchantRecoveryNoPotion: 0,
      merchantWorkHolds: 0,
      merchantTravelSafetyAborts: 0,
      merchantTravelAbortFailures: 0,
      gearDeliveryBudgetBackoffs: 0,
      gearDeliveryBackoffSkips: 0
    };

    this.blockedTargetSelectionInstalled = this._installBlockedTargetSelection();
    this.localFarmDetourInstalled = this._installLocalFarmDetour();
    this.staleMerchantTransactionReleaseInstalled = this._installStaleMerchantTransactionRelease();
    this.merchantSafetyGatesInstalled = this._installMerchantSafetyGates();
    this.merchantAutonomyHoldInstalled = this._installMerchantAutonomyHold();
    this.gearDeliveryBackoffInstalled = this._installGearDeliveryBackoff();
    this.installedAt = this.now();

    this._event('ALPHA32_NAVIGATION_MERCHANT_RECOVERY_INSTALLED', 'warn', 'LIVE_LOG_VERIFIED_RECOVERY', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha32-navigation-merchant-recovery', event, severity, reason, data }); } catch (_) {}
  }

  _terrain() {
    return this.runtime.farmerTerrainNavigationHotfix || null;
  }

  _blockedTargetIds() {
    const terrain = this._terrain();
    if (!terrain || !(terrain.blockedTargets instanceof Map)) return new Set();
    try { if (typeof terrain._pruneBlocked === 'function') terrain._pruneBlocked(); } catch (_) {}
    const now = this.now();
    return new Set([...terrain.blockedTargets.entries()].filter(([, until]) => finite(until, 0) > now).map(([id]) => String(id)));
  }

  _installBlockedTargetSelection() {
    const farmer = this.runtime.farmer;
    const reliability = this.runtime.preFarmingReliability;
    if (!farmer || typeof farmer._selectTarget !== 'function' || farmer.__alpha32BlockedTargetSelectionInstalled) return false;
    const base = farmer._selectTarget.bind(farmer);
    farmer._selectTarget = (context) => {
      const blocked = this._blockedTargetIds();
      const safeIds = reliability && reliability.safeEntityIds;
      if (!blocked.size || !(safeIds instanceof Set)) return base(context);

      const filtered = new Set([...safeIds].filter((id) => !blocked.has(String(id))));
      const removed = Math.max(0, safeIds.size - filtered.size);
      if (!removed) return base(context);

      this.stats.blockedTargetIdsFiltered += removed;
      this.stats.blockedTargetSelectionCycles += 1;
      reliability.safeEntityIds = filtered;
      try {
        return base(context);
      } finally {
        reliability.safeEntityIds = safeIds;
      }
    };
    farmer.__alpha32BlockedTargetSelectionInstalled = true;
    return true;
  }

  _canMoveTo(x, y) {
    const parent = this.root && this.root.parent || this.root;
    const fn = this.root && this.root.can_move_to || parent && parent.can_move_to;
    if (typeof fn !== 'function') return null;
    try { return fn.call(this.root, x, y) !== false; } catch (_) { return false; }
  }

  _localFarmDetour(character, plan) {
    const cx = finite(character && character.x);
    const cy = finite(character && character.y);
    const px = finite(plan && plan.x);
    const py = finite(plan && plan.y);
    if ([cx, cy, px, py].some((value) => value == null)) return null;

    const dx = px - cx;
    const dy = py - cy;
    const remaining = Math.hypot(dx, dy);
    if (!Number.isFinite(remaining) || remaining <= 0) return null;

    const local = this.runtime.localFarming;
    const config = local && local.config || {};
    const speed = Math.max(1, finite(character && character.speed, 40));
    const minStep = Math.max(16, finite(config.minStep, 50));
    const maxStep = Math.max(minStep, finite(config.maxStep, 120));
    const stepSeconds = clamp(config.stepSeconds == null ? 2.5 : config.stepSeconds, 0.5, 4);
    const baseStep = Math.min(remaining, Math.max(minStep, Math.min(maxStep, speed * stepSeconds)));
    const planId = String(plan && plan.id || `${plan && plan.monster || 'spawn'}:${px}:${py}`);
    const previous = this.localDetours.get(planId) || { attempts: 0, direction: hashDirection(planId) };
    if (previous.attempts >= this.localDetourMaxAttempts) {
      this.stats.localFarmDetourExhaustions += 1;
      return null;
    }

    const preferred = previous.direction || 1;
    const offsets = [preferred * 75, preferred * 90, preferred * 105, preferred * 120, -preferred * 75, -preferred * 90, -preferred * 105, -preferred * 120];
    const scales = [1, 0.75, 0.5, 0.35];
    const baseAngle = Math.atan2(dy, dx);
    let best = null;

    for (const scale of scales) {
      const step = Math.max(16, baseStep * scale);
      const maxRegression = Math.max(12, step * this.localDetourMaxRegressionFactor);
      for (const offsetDeg of offsets) {
        const angle = baseAngle + offsetDeg * Math.PI / 180;
        const x = cx + Math.cos(angle) * step;
        const y = cy + Math.sin(angle) * step;
        if (this._canMoveTo(x, y) !== true) continue;
        const after = Math.hypot(px - x, py - y);
        const regression = after - remaining;
        if (regression > maxRegression) continue;
        const score = Math.max(0, regression) * 10 + Math.abs(Math.abs(offsetDeg) - 90) * 0.06 + (1 - scale) * 3;
        const candidate = { x, y, step, remaining, after, regression, offsetDeg, score, terrainDetour: true };
        if (!best || candidate.score < best.score) best = candidate;
      }
    }

    if (!best) return null;
    const direction = best.offsetDeg < 0 ? -1 : 1;
    this.localDetours.set(planId, { attempts: previous.attempts + 1, direction, at: this.now() });
    if (plan && typeof plan === 'object') plan.lastProgressAt = this.now();
    this.stats.localFarmDetours += 1;
    this._event('ALPHA32_LOCAL_FARM_DETOUR_SELECTED', previous.attempts === 0 ? 'warn' : 'info', 'LATERAL_PROGRESS_TEMPORARILY_ALLOWED', {
      planId,
      monster: plan && plan.monster || null,
      attempt: previous.attempts + 1,
      offsetDeg: best.offsetDeg,
      regression: Number(best.regression.toFixed(2)),
      remaining: Number(best.remaining.toFixed(2)),
      after: Number(best.after.toFixed(2))
    });
    return best;
  }

  _installLocalFarmDetour() {
    const local = this.runtime.localFarming;
    if (!local || typeof local._boundedDestination !== 'function' || local.__alpha32LateralDetourInstalled) return false;
    const base = local._boundedDestination.bind(local);
    local._boundedDestination = (character, plan) => {
      const waypoint = base(character, plan);
      const planId = String(plan && plan.id || '');
      if (waypoint) {
        if (planId) this.localDetours.delete(planId);
        return waypoint;
      }
      return this._localFarmDetour(character, plan);
    };
    local.__alpha32LateralDetourInstalled = true;
    return true;
  }

  _installStaleMerchantTransactionRelease() {
    const executor = this.runtime.controlledMerchant;
    const engine = this.runtime.transactionEngine;
    if (!executor || typeof executor.execute !== 'function' || !engine || typeof engine.cancel !== 'function' || executor.__alpha32StaleTransactionReleaseInstalled) return false;
    const base = executor.execute.bind(executor);
    executor.execute = async (transactionId) => {
      const result = await base(transactionId);
      const reason = String(result && result.reason || '');
      if (!result || result.executed === true || result.committed === true || !STALE_TRANSACTION_REASONS.has(reason)) return result;
      const tx = typeof engine.get === 'function' ? engine.get(String(transactionId)) : null;
      if (!tx || ['COMMITTED', 'ABORTED', 'FAILED_SAFE'].includes(String(tx.state || ''))) return result;
      const cancelReason = `PREFLIGHT_ABORTED:${reason}`;
      const cancelled = engine.cancel(tx.id, cancelReason) !== false;
      if (cancelled) {
        this.stats.staleMerchantTransactionsReleased += 1;
        this._event('ALPHA32_STALE_MERCHANT_TRANSACTION_RELEASED', 'warn', reason, { transactionId: tx.id, type: tx.type || null, cancelReason });
      }
      return { ...result, aborted: cancelled, staleReservationReleased: cancelled, cancelReason: cancelled ? cancelReason : null };
    };
    executor.__alpha32StaleTransactionReleaseInstalled = true;
    return true;
  }

  _updateMerchantRecoveryState() {
    const c = characterOf(this.runtime);
    if (!isMerchant(c) || c.rip === true || c.dead === true) {
      this.merchantRecoveryActive = false;
      return false;
    }
    const ratio = hpRatio(c);
    const previous = this.merchantRecoveryActive;
    if (!previous && ratio <= this.merchantRecoveryTriggerHpRatio) this.merchantRecoveryActive = true;
    else if (previous && ratio >= this.merchantRecoveryResumeHpRatio) this.merchantRecoveryActive = false;

    if (this.merchantRecoveryActive !== previous) {
      if (this.merchantRecoveryActive) this.stats.merchantRecoveryEntries += 1;
      else this.stats.merchantRecoveryExits += 1;
      this.lastMerchantRecoveryState = { at: this.now(), active: this.merchantRecoveryActive, hpRatio: ratio };
      this._event('ALPHA32_MERCHANT_RECOVERY_STATE_CHANGED', this.merchantRecoveryActive ? 'warn' : 'info', this.merchantRecoveryActive ? 'LOW_HP_RECOVERY_REQUIRED' : 'HP_RECOVERY_COMPLETE', {
        hpRatio: Number(ratio.toFixed(4)),
        triggerHpRatio: this.merchantRecoveryTriggerHpRatio,
        resumeHpRatio: this.merchantRecoveryResumeHpRatio
      });
    }
    return this.merchantRecoveryActive;
  }

  _merchantRecoveryRequired() {
    return this._updateMerchantRecoveryState();
  }

  _gatePreflight(system, flag) {
    if (!system || typeof system._preflight !== 'function' || system[flag]) return false;
    const base = system._preflight.bind(system);
    system._preflight = (...args) => {
      const result = base(...args);
      if (!result || result.ok !== true) return result;
      if (!this._merchantRecoveryRequired()) return result;
      this.stats.merchantWorkHolds += 1;
      return { ok: false, reason: 'MERCHANT_HP_RECOVERY_REQUIRED', hpRatio: hpRatio(characterOf(this.runtime)) };
    };
    system[flag] = true;
    return true;
  }

  _installMerchantSafetyGates() {
    let installed = false;
    installed = this._gatePreflight(this.runtime.controlledMerchant, '__alpha32MerchantHpGateInstalled') || installed;
    installed = this._gatePreflight(this.runtime.controlledMerchantService, '__alpha32MerchantHpGateInstalled') || installed;
    installed = this._gatePreflight(this.runtime.controlledMerchantProduction, '__alpha32MerchantHpGateInstalled') || installed;
    installed = this._gatePreflight(this.runtime.controlledTravel, '__alpha32MerchantHpGateInstalled') || installed;
    return installed;
  }

  _installMerchantAutonomyHold() {
    let installed = false;
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    const merchant = alpha27 && alpha27.merchant;
    if (merchant && typeof merchant.tick === 'function' && !merchant.__alpha32MerchantRecoveryHoldInstalled) {
      const baseTick = merchant.tick.bind(merchant);
      merchant.tick = (...args) => {
        if (this._merchantRecoveryRequired()) {
          this.stats.merchantWorkHolds += 1;
          return false;
        }
        return baseTick(...args);
      };
      merchant.__alpha32MerchantRecoveryHoldInstalled = true;
      installed = true;
    }

    if (typeof this.runtime._merchantServiceCycle === 'function' && !this.runtime.__alpha32MerchantServiceRecoveryHoldInstalled) {
      const baseCycle = this.runtime._merchantServiceCycle.bind(this.runtime);
      this.runtime._merchantServiceCycle = (...args) => {
        if (this._merchantRecoveryRequired()) {
          this.stats.merchantWorkHolds += 1;
          return null;
        }
        return baseCycle(...args);
      };
      this.runtime.__alpha32MerchantServiceRecoveryHoldInstalled = true;
      installed = true;
    }
    return installed;
  }

  _abortActiveMerchantTravel() {
    const travel = this.runtime.controlledTravel;
    if (!travel || typeof travel.status !== 'function' || typeof travel.abort !== 'function' || this.merchantTravelAbortPending) return false;
    let status = null;
    try { status = travel.status(); } catch (_) { return false; }
    if (!status || status.busy !== true || !status.activePlanId) return false;

    const planId = status.activePlanId;
    this.merchantTravelAbortPending = true;
    Promise.resolve(travel.abort('MERCHANT_HP_RECOVERY_REQUIRED'))
      .then((result) => {
        if (result && result.aborted === true) {
          this.stats.merchantTravelSafetyAborts += 1;
          this._event('ALPHA32_MERCHANT_TRAVEL_ABORTED_FOR_RECOVERY', 'warn', 'MERCHANT_HP_RECOVERY_REQUIRED', { planId });
          return;
        }
        this.stats.merchantTravelAbortFailures += 1;
        this._event('ALPHA32_MERCHANT_TRAVEL_ABORT_FAILED', 'warn', result && result.reason || 'TRAVEL_ABORT_NOT_CONFIRMED', { planId });
      })
      .catch((error) => {
        this.stats.merchantTravelAbortFailures += 1;
        this._event('ALPHA32_MERCHANT_TRAVEL_ABORT_FAILED', 'error', 'TRAVEL_ABORT_REJECTED', { planId, message: String(error && error.message || error) });
      })
      .finally(() => { this.merchantTravelAbortPending = false; });
    return true;
  }

  _merchantServiceBudgetRetryAt() {
    const service = this.runtime.controlledMerchantService;
    const now = this.now();
    if (!service) return now + 5000;
    try { if (typeof service._rawBudget === 'function') service._rawBudget(); } catch (_) {}
    const rows = Array.isArray(service.actionTimes) ? service.actionTimes.filter((at) => Number.isFinite(Number(at))) : [];
    const windowMs = Math.max(1000, finite(service.actionWindowMs, 60000));
    if (!rows.length) return now + Math.min(5000, windowMs);
    return Math.max(now + 1000, Math.min(now + 60000, Math.min(...rows) + windowMs + 50));
  }

  _installGearDeliveryBackoff() {
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    const merchant = alpha27 && alpha27.merchant;
    if (!merchant || typeof merchant.deliverGearGoal !== 'function' || merchant.__alpha32GearBudgetBackoffInstalled) return false;
    const base = merchant.deliverGearGoal.bind(merchant);
    merchant.deliverGearGoal = async (...args) => {
      const now = this.now();
      if (now < this.gearDeliveryBackoffUntil) {
        this.stats.gearDeliveryBackoffSkips += 1;
        return false;
      }
      const result = await base(...args);
      const reason = String(merchant.lastMerchantAction && merchant.lastMerchantAction.result && merchant.lastMerchantAction.result.reason || '');
      if (reason === 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED') {
        this.gearDeliveryBackoffUntil = this._merchantServiceBudgetRetryAt();
        this.stats.gearDeliveryBudgetBackoffs += 1;
        this._event('ALPHA32_GEAR_DELIVERY_BUDGET_BACKOFF', 'info', reason, { retryAt: this.gearDeliveryBackoffUntil, retryAfterMs: Math.max(0, this.gearDeliveryBackoffUntil - now) });
      }
      return result;
    };
    merchant.__alpha32GearBudgetBackoffInstalled = true;
    return true;
  }

  _driveMerchantRecovery() {
    const c = characterOf(this.runtime);
    if (!isMerchant(c) || !this._merchantRecoveryRequired()) return false;
    const adapter = this.runtime.adapter;
    if (!adapter || String(adapter.mode || '') !== 'active' || typeof adapter.command !== 'function') return true;
    const now = this.now();
    if (now - this.lastMerchantPotionAt < this.merchantPotionCooldownMs) return true;
    if (itemQuantity(c, 'hpot') <= 0) {
      this.stats.merchantRecoveryNoPotion += 1;
      this.lastMerchantPotionAt = now;
      this._event('ALPHA32_MERCHANT_RECOVERY_BLOCKED', 'warn', 'NO_HP_POTION_AVAILABLE', { hpRatio: hpRatio(c) });
      return true;
    }

    this.stats.merchantRecoveryPotionAttempts += 1;
    let result = null;
    try { result = adapter.command('use_hp', []); } catch (_) { result = null; }
    this.lastMerchantPotionAt = now;
    if (result && result.executed === true && result.accepted !== false) this.stats.merchantRecoveryPotionAccepted += 1;
    this._event('ALPHA32_MERCHANT_HP_POTION_REQUESTED', 'warn', 'LOW_HP_RECOVERY_REQUIRED', {
      hpRatio: Number(hpRatio(c).toFixed(4)),
      executed: !!(result && result.executed),
      accepted: result && result.accepted == null ? null : !!result.accepted,
      reason: result && result.reason || null
    });
    return true;
  }

  beforeTick() {
    this._installMerchantSafetyGates();
    this._installMerchantAutonomyHold();
    this._installGearDeliveryBackoff();
    if (this._merchantRecoveryRequired()) this._abortActiveMerchantTravel();
    this._driveMerchantRecovery();
    return true;
  }

  status() {
    const c = characterOf(this.runtime);
    return {
      schemaVersion: 1,
      mode: ALPHA32_NAVIGATION_MERCHANT_RECOVERY_MODE,
      installedAt: this.installedAt || null,
      blockedTargetSelectionInstalled: this.blockedTargetSelectionInstalled,
      localFarmDetourInstalled: this.localFarmDetourInstalled,
      staleMerchantTransactionReleaseInstalled: this.staleMerchantTransactionReleaseInstalled,
      merchantSafetyGatesInstalled: this.merchantSafetyGatesInstalled,
      merchantAutonomyHoldInstalled: this.merchantAutonomyHoldInstalled,
      gearDeliveryBackoffInstalled: this.gearDeliveryBackoffInstalled,
      navigation: {
        blockedTargetFallbackRespectsTerrainCooldown: true,
        boundedLateralDetours: true,
        detourMaxAttempts: this.localDetourMaxAttempts,
        detourMaxRegressionFactor: this.localDetourMaxRegressionFactor,
        activeDetourPlans: this.localDetours.size
      },
      merchant: {
        recoveryActive: this.merchantRecoveryActive,
        hpRatio: isMerchant(c) ? hpRatio(c) : null,
        triggerHpRatio: this.merchantRecoveryTriggerHpRatio,
        resumeHpRatio: this.merchantRecoveryResumeHpRatio,
        potionCooldownMs: this.merchantPotionCooldownMs,
        lastPotionAt: Number.isFinite(this.lastMerchantPotionAt) ? this.lastMerchantPotionAt : null,
        travelAbortPending: this.merchantTravelAbortPending,
        gearDeliveryBackoffUntil: this.gearDeliveryBackoffUntil || null,
        staleTransactionReasons: [...STALE_TRANSACTION_REASONS]
      },
      stats: { ...this.stats }
    };
  }
}

function installAlpha32NavigationMerchantRecovery(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha32NavigationMerchantRecovery) return runtime.alpha32NavigationMerchantRecovery;
  const hotfix = new Alpha32NavigationMerchantRecovery(runtime, options);
  runtime.alpha32NavigationMerchantRecovery = hotfix;
  return hotfix;
}

module.exports = {
  ALPHA32_NAVIGATION_MERCHANT_RECOVERY_MODE,
  STALE_TRANSACTION_REASONS,
  Alpha32NavigationMerchantRecovery,
  installAlpha32NavigationMerchantRecovery
};
