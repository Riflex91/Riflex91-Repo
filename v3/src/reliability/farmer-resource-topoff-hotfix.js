'use strict';

const FARMER_RESOURCE_TOPOFF_MODE = 'aggressive-precise-resource-topoff-v1';

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ratio(value, max) {
  const denominator = finite(max);
  if (denominator == null || denominator <= 0) return 1;
  return Math.max(0, Math.min(1, (finite(value) || 0) / denominator));
}

function potionCount(inventory, prefix) {
  return (Array.isArray(inventory) ? inventory : []).reduce((sum, item) => {
    if (!item || !String(item.name || '').startsWith(prefix)) return sum;
    return sum + Math.max(1, Number(item.q) || 1);
  }, 0);
}

class FarmerResourceTopoffHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer || !runtime.adapter) throw new Error('runtime farmer and adapter required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.adapter = runtime.adapter;
    this.root = runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.targetRatio = Math.max(0.90, Math.min(1, Number(options.targetRatio) || 0.985));
    this.criticalHpRatio = Math.max(0.40, Math.min(0.90, Number(options.criticalHpRatio) || 0.72));
    this.cooldownMs = Math.max(600, Math.min(3000, Number(options.cooldownMs) || 650));
    this.lastAttemptAt = -Infinity;
    this.lastUse = null;
    this.lastSupply = null;
    this.stats = {
      evaluations: 0,
      hpRequests: 0,
      mpRequests: 0,
      cooldownWaits: 0,
      alreadyToppedOff: 0,
      potionUnavailable: 0,
      preciseAdapterUses: 0,
      commandFailures: 0
    };
    this.installed = false;
    this._installPrecisePotionAdapter();
    this._installFarmerPotionPolicy();
    this.installed = true;
    this._event('FARMER_RESOURCE_TOPOFF_INSTALLED', 'info', null, {
      targetRatio: this.targetRatio,
      criticalHpRatio: this.criticalHpRatio,
      cooldownMs: this.cooldownMs
    });
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'farmer-resource-topoff', event, severity, reason, data }); } catch (_) {}
  }

  _useFn() {
    const fn = this.root && this.root.use || this.parent && this.parent.use;
    return typeof fn === 'function' ? fn : null;
  }

  _canUse(token) {
    const fn = this.root && this.root.can_use || this.parent && this.parent.can_use;
    if (typeof fn !== 'function') return true;
    try { return fn.call(this.root, token) !== false; } catch (_) { return false; }
  }

  _installPrecisePotionAdapter() {
    if (this.adapter.__precisePotionTopoffInstalled) return;
    const baseCommand = this.adapter.command.bind(this.adapter);
    this.adapter.command = (action, args = []) => {
      if ((action === 'use_hp' || action === 'use_mp') && this.adapter.mode === 'active') {
        const direct = this.root && this.root[action] || this.parent && this.parent[action];
        const use = this._useFn();
        if (typeof direct !== 'function' && use) {
          const token = action;
          if (!this._canUse(token)) return { executed: false, reason: 'POTION_COOLDOWN', action, resolvedAction: 'use' };
          try {
            const value = use.call(this.root, token);
            this.stats.preciseAdapterUses += 1;
            if (this.log && typeof this.log.emit === 'function') {
              this.log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', data: { action, resolvedAction: 'use', token } });
            }
            return { executed: true, value, action, resolvedAction: 'use', token };
          } catch (error) {
            if (this.log && typeof this.log.emit === 'function') {
              this.log.emit({ component: 'adapter', event: 'COMMAND_FAILED', severity: 'error', reason: String(error && error.message || error), data: { action, resolvedAction: 'use', token } });
            }
            return { executed: false, reason: 'COMMAND_FAILED', error, action, resolvedAction: 'use' };
          }
        }
      }
      return baseCommand(action, args);
    };
    this.adapter.__precisePotionTopoffInstalled = true;
  }

  supply(snapshot) {
    const character = snapshot && snapshot.character;
    const inventory = character && character.inventory || [];
    const hpPotions = potionCount(inventory, 'hpot');
    const mpPotions = potionCount(inventory, 'mpot');
    const status = {
      hpPotions,
      mpPotions,
      hpReady: hpPotions > 0,
      mpReady: mpPotions > 0,
      ready: hpPotions > 0 && mpPotions > 0
    };
    this.lastSupply = status;
    return status;
  }

  topOff(snapshot, adapter = this.adapter) {
    const character = snapshot && snapshot.character;
    if (!character || character.rip || String(character.ctype || '').toLowerCase() === 'merchant') return false;
    this.stats.evaluations += 1;
    const now = this.now();
    if (now - this.lastAttemptAt < this.cooldownMs) {
      this.stats.cooldownWaits += 1;
      return false;
    }

    const hpRatio = ratio(character.hp, character.max_hp);
    const mpRatio = ratio(character.mp, character.max_mp);
    const supply = this.supply(snapshot);
    const hpNeeded = hpRatio < this.targetRatio;
    const mpNeeded = mpRatio < this.targetRatio;
    if (!hpNeeded && !mpNeeded) {
      this.stats.alreadyToppedOff += 1;
      return false;
    }

    let action = null;
    if (hpNeeded && hpRatio <= this.criticalHpRatio && supply.hpReady) action = 'use_hp';
    else if (mpNeeded && supply.mpReady && (!hpNeeded || !supply.hpReady || (1 - mpRatio) >= (1 - hpRatio))) action = 'use_mp';
    else if (hpNeeded && supply.hpReady) action = 'use_hp';
    else if (mpNeeded && supply.mpReady) action = 'use_mp';

    if (!action) {
      this.stats.potionUnavailable += 1;
      this.lastUse = { at: now, action: null, executed: false, reason: 'REQUIRED_POTION_UNAVAILABLE', hpRatio, mpRatio, supply };
      this._event('FARMER_RESOURCE_TOPOFF_UNAVAILABLE', 'warn', 'REQUIRED_POTION_UNAVAILABLE', { hpRatio, mpRatio, supply });
      return false;
    }

    this.lastAttemptAt = now;
    const result = adapter && typeof adapter.command === 'function'
      ? adapter.command(action, [])
      : { executed: false, reason: 'ADAPTER_UNAVAILABLE' };
    if (action === 'use_hp') this.stats.hpRequests += 1;
    else this.stats.mpRequests += 1;
    if (!result.executed && !result.shadow && result.reason !== 'POTION_COOLDOWN') this.stats.commandFailures += 1;
    if (result.executed || result.shadow) this.farmer.lastPotionAt = now;
    this.lastUse = {
      at: now,
      action,
      executed: !!result.executed,
      shadow: !!result.shadow,
      reason: result.reason || null,
      hpRatio,
      mpRatio,
      supply
    };
    this._event('FARMER_RESOURCE_TOPOFF_REQUESTED', result.executed || result.shadow ? 'info' : 'warn', result.reason || null, { ...this.lastUse });
    return !!(result.executed || result.shadow);
  }

  _installFarmerPotionPolicy() {
    if (this.farmer.__resourceTopoffInstalled) return;
    this.farmer.config.useHpRatio = this.targetRatio;
    this.farmer.config.useMpRatio = this.targetRatio;
    this.farmer.config.potionCooldownMs = this.cooldownMs;
    this.farmer._maybePotion = (context) => this.topOff(context && context.snapshot, context && context.adapter || this.adapter);
    this.farmer.__resourceTopoffInstalled = true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: FARMER_RESOURCE_TOPOFF_MODE,
      installed: this.installed,
      targetRatio: this.targetRatio,
      criticalHpRatio: this.criticalHpRatio,
      cooldownMs: this.cooldownMs,
      precisePotionSelection: true,
      requiresHpAndMpSupplyForTeamCombat: true,
      lastUse: this.lastUse ? { ...this.lastUse } : null,
      lastSupply: this.lastSupply ? { ...this.lastSupply } : null,
      stats: { ...this.stats }
    };
  }
}

function installFarmerResourceTopoffHotfix(runtime, options = {}) {
  return new FarmerResourceTopoffHotfix(runtime, options);
}

module.exports = {
  FarmerResourceTopoffHotfix,
  installFarmerResourceTopoffHotfix,
  FARMER_RESOURCE_TOPOFF_MODE
};
