'use strict';

const SAFE_AUTO_UPDATER_MODE = 'safe-github-auto-updater-v1';
const DEFAULT_REPO_RAW = 'https://raw.githubusercontent.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public/main/v3';

function finite(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value, max = 300) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function versionParts(value) {
  const matches = String(value || '').match(/\d+/g) || [];
  return matches.map((x) => Number(x) || 0);
}

function compareVersions(a, b) {
  const aa = versionParts(a), bb = versionParts(b);
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i += 1) {
    const av = aa[i] || 0, bv = bb[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function releaseVersionFromSource(source) {
  const match = String(source || '').match(/RELEASE_VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
  return match ? match[1] : null;
}

function characterOf(runtime) {
  return runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || null;
}

function entitiesOf(runtime) {
  return runtime && runtime.lastSnapshot && Array.isArray(runtime.lastSnapshot.entities)
    ? runtime.lastSnapshot.entities
    : [];
}

class SafeAutoUpdater {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = options.root || runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = options.now || runtime.now || (() => Date.now());
    this.log = options.log || runtime.log || null;
    this.fetchFn = options.fetch || this.root && this.root.fetch || (typeof fetch === 'function' ? fetch : null);
    const globalConfig = this.root && this.root.AIO_V3_AUTO_UPDATE_CONFIG && typeof this.root.AIO_V3_AUTO_UPDATE_CONFIG === 'object'
      ? this.root.AIO_V3_AUTO_UPDATE_CONFIG : {};
    this.config = {
      enabled: globalConfig.enabled !== false,
      rawBaseUrl: text(globalConfig.rawBaseUrl || DEFAULT_REPO_RAW, 700).replace(/\/+$/, ''),
      checkIntervalMs: Math.max(60000, finite(globalConfig.checkIntervalMs, 300000)),
      safeHoldMs: Math.max(3000, finite(globalConfig.safeHoldMs, 8000)),
      minHpRatio: Math.max(0.7, Math.min(1, finite(globalConfig.minHpRatio, 0.90))),
      emergencyCooldownMs: Math.max(5000, finite(globalConfig.emergencyCooldownMs, 20000)),
      maxBundleBytes: Math.max(250000, finite(globalConfig.maxBundleBytes, 6000000)),
      autoApply: globalConfig.autoApply !== false
    };
    this.localVersion = text(options.localVersion || this.root && this.root.AIO_V3 && this.root.AIO_V3.version || '', 80) || '0.0.0';
    this.lastCheckAt = 0;
    this.lastCheckError = null;
    this.remoteVersion = null;
    this.pendingVersion = null;
    this.pendingSince = 0;
    this.safeSince = 0;
    this.lastSafety = { safe: false, reasons: ['NOT_EVALUATED'] };
    this.lastApply = null;
    this.busy = false;
    this.stats = {
      checks: 0,
      updatesFound: 0,
      safeDeferrals: 0,
      downloads: 0,
      validations: 0,
      saves: 0,
      reloads: 0,
      rollbacks: 0,
      failures: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'safe-auto-updater', event, severity, reason, data }); } catch (_) {}
  }

  _binding(name) {
    if (this.root && typeof this.root[name] === 'function') return { fn: this.root[name], owner: this.root };
    if (this.parent && typeof this.parent[name] === 'function') return { fn: this.parent[name], owner: this.parent };
    return null;
  }

  _recentEmergency() {
    const row = this.runtime.lastEmergencyDisengage;
    const at = finite(row && (row.at || row.ts), 0);
    return !!at && this.now() - at < this.config.emergencyCooldownMs;
  }

  _economyBusy() {
    const tx = this.runtime.transactionEngine && typeof this.runtime.transactionEngine.status === 'function'
      ? this.runtime.transactionEngine.status() : null;
    if (tx && (finite(tx.active, 0) > 0 || finite(tx.recovering, 0) > 0)) return true;
    const economy = this.runtime.economyEquipmentAutonomyV2;
    const status = economy && typeof economy.status === 'function' ? economy.status() : null;
    if (status && status.busy) return true;
    const logistics = this.runtime.controlledPartyLogistics;
    const logisticsStatus = logistics && typeof logistics.status === 'function' ? logistics.status() : null;
    return !!(logisticsStatus && (logisticsStatus.pendingSupply || logisticsStatus.pendingGrant || logisticsStatus.pendingOutbound));
  }

  safety() {
    const c = characterOf(this.runtime) || {};
    const reasons = [];
    const hpRatio = finite(c.max_hp, 0) > 0 ? finite(c.hp, 0) / finite(c.max_hp, 1) : 0;
    if (!c.name) reasons.push('CHARACTER_UNKNOWN');
    if (c.rip || c.dead) reasons.push('CHARACTER_DEAD');
    if (hpRatio < this.config.minHpRatio) reasons.push('HP_BELOW_UPDATE_THRESHOLD');
    const self = String(c.name || '');
    const threats = entitiesOf(this.runtime).filter((row) => row && row.mtype && !row.dead && !row.rip && String(row.target || '') === self);
    if (threats.length) reasons.push('ACTIVE_AGGRO');
    const targetId = c.target != null ? String(c.target) : '';
    if (targetId && entitiesOf(this.runtime).some((row) => row && String(row.id || '') === targetId && row.mtype && !row.dead && !row.rip)) reasons.push('ACTIVE_COMBAT_TARGET');
    const farmer = this.runtime.farmer && typeof this.runtime.farmer.status === 'function' ? this.runtime.farmer.status() : null;
    if (farmer && ['ENGAGE', 'RETREAT', 'RECOVER'].includes(String(farmer.state || '').toUpperCase())) reasons.push(`FARMER_${String(farmer.state).toUpperCase()}`);
    if (this._recentEmergency()) reasons.push('RECENT_EMERGENCY');
    if (this._economyBusy()) reasons.push('ECONOMY_OR_TRANSFER_BUSY');
    const safe = reasons.length === 0;
    this.lastSafety = { at: this.now(), safe, hpRatio: Number(hpRatio.toFixed(3)), threats: threats.length, reasons };
    if (safe) {
      if (!this.safeSince) this.safeSince = this.now();
    } else {
      this.safeSince = 0;
    }
    return this.lastSafety;
  }

  _stableSafe() {
    const safety = this.safety();
    return safety.safe && this.safeSince > 0 && this.now() - this.safeSince >= this.config.safeHoldMs;
  }

  async _fetchText(url, timeoutMs = 12000) {
    if (!this.fetchFn) throw new Error('fetch unavailable');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await this.fetchFn.call(this.root, url, { cache: 'no-store', signal: controller && controller.signal });
      if (!response || !response.ok) throw new Error(`HTTP ${response && response.status}`);
      return await response.text();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async check() {
    if (!this.config.enabled || this.busy || !this.fetchFn) return false;
    this.busy = true;
    try {
      const source = await this._fetchText(`${this.config.rawBaseUrl}/src/release-version.js`);
      const version = releaseVersionFromSource(source);
      if (!version) throw new Error('REMOTE_RELEASE_VERSION_INVALID');
      this.stats.checks += 1;
      this.lastCheckAt = this.now();
      this.remoteVersion = version;
      this.lastCheckError = null;
      if (compareVersions(version, this.localVersion) > 0) {
        if (this.pendingVersion !== version) {
          this.pendingVersion = version;
          this.pendingSince = this.now();
          this.stats.updatesFound += 1;
          this._event('AUTO_UPDATE_AVAILABLE', 'info', 'NEWER_RELEASE_FOUND', { localVersion: this.localVersion, remoteVersion: version });
        }
        return true;
      }
      if (this.pendingVersion && compareVersions(version, this.localVersion) <= 0) {
        this.pendingVersion = null;
        this.pendingSince = 0;
      }
      return false;
    } catch (error) {
      this.stats.failures += 1;
      this.lastCheckError = { at: this.now(), message: text(error && error.message || error, 240) };
      this._event('AUTO_UPDATE_CHECK_FAILED', 'warn', 'REMOTE_CHECK_FAILED', this.lastCheckError);
      return false;
    } finally {
      this.busy = false;
    }
  }

  _validateBundle(code, version) {
    const body = String(code || '');
    const bytes = body.length;
    const ok = bytes >= 10000
      && bytes <= this.config.maxBundleBytes
      && body.includes('Adventure Land AiO Bot')
      && body.includes(String(version))
      && body.includes('AIO_V3');
    this.stats.validations += 1;
    return { ok, bytes, reason: ok ? null : 'BUNDLE_VALIDATION_FAILED' };
  }

  _activeSlot() {
    const binding = this._binding('get_active_code_slot');
    if (!binding) return null;
    try {
      const value = binding.fn.call(binding.owner);
      if (value && typeof value === 'object') {
        return { slot: value.slot != null ? value.slot : value.id != null ? value.id : value.name, name: value.name || null, raw: value };
      }
      return { slot: value, name: null, raw: value };
    } catch (_) {
      return null;
    }
  }

  async _saveCode(slotInfo, code) {
    const api = this.parent && this.parent.api_call;
    if (typeof api !== 'function') throw new Error('SAVE_CODE_API_UNAVAILABLE');
    const slot = slotInfo && slotInfo.slot;
    if (slot == null || slot === '') throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
    const payload = { slot, name: slotInfo.name || `AIO v3 ${slot}`, code };
    const result = api.call(this.parent, 'save_code', payload);
    if (result && typeof result.then === 'function') await result;
    this.stats.saves += 1;
    return true;
  }

  async _reloadSavedCode(slotInfo) {
    const load = this._binding('load_code');
    if (!load) throw new Error('LOAD_CODE_UNAVAILABLE');
    const oldApi = this.root && this.root.AIO_V3;
    let oldStopped = false;
    try {
      if (oldApi && typeof oldApi.stop === 'function') {
        oldApi.stop();
        oldStopped = true;
      }
    } catch (_) {}
    try { if (this.root) this.root.AIO_V3 = null; } catch (_) {}
    try {
      const result = load.fn.call(load.owner, slotInfo.slot);
      if (result && typeof result.then === 'function') await result;
      this.stats.reloads += 1;
      return true;
    } catch (error) {
      try { if (this.root && !this.root.AIO_V3) this.root.AIO_V3 = oldApi; } catch (_) {}
      if (oldStopped && oldApi && typeof oldApi.start === 'function') {
        try {
          const restart = oldApi.start();
          if (restart && typeof restart.then === 'function') await restart;
          this.stats.rollbacks += 1;
          this._event('AUTO_UPDATE_RUNTIME_ROLLBACK', 'warn', 'NEW_RELEASE_RELOAD_FAILED', { slot: slotInfo && slotInfo.slot, oldVersion: this.localVersion });
        } catch (_) {}
      }
      throw error;
    }
  }

  async applyPending() {
    if (!this.pendingVersion || !this.config.autoApply || this.busy) return false;
    if (!this._stableSafe()) {
      this.stats.safeDeferrals += 1;
      return false;
    }
    this.busy = true;
    const version = this.pendingVersion;
    try {
      const code = await this._fetchText(`${this.config.rawBaseUrl}/dist/aio-v3.js`, 20000);
      this.stats.downloads += 1;
      const validation = this._validateBundle(code, version);
      if (!validation.ok) throw new Error(validation.reason);
      if (!this._stableSafe()) throw new Error('SAFETY_CHANGED_DURING_DOWNLOAD');
      const slot = this._activeSlot();
      if (!slot) throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
      await this._saveCode(slot, code);
      this.lastApply = { at: this.now(), from: this.localVersion, to: version, slot: slot.slot, bytes: validation.bytes, saved: true, reloaded: false };
      this._event('AUTO_UPDATE_SAVED', 'info', 'SAFE_RELEASE_PERSISTED', { from: this.localVersion, to: version, slot: slot.slot, bytes: validation.bytes });
      await this._reloadSavedCode(slot);
      this.lastApply.reloaded = true;
      return true;
    } catch (error) {
      this.stats.failures += 1;
      this.lastApply = { at: this.now(), from: this.localVersion, to: version, saved: !!(this.lastApply && this.lastApply.saved), reloaded: false, error: text(error && error.message || error, 240) };
      this._event('AUTO_UPDATE_APPLY_FAILED', 'warn', 'SAFE_UPDATE_FAILED', this.lastApply);
      return false;
    } finally {
      this.busy = false;
    }
  }

  async cycle() {
    if (!this.config.enabled) return false;
    this.safety();
    const now = this.now();
    if (!this.pendingVersion && now - this.lastCheckAt >= this.config.checkIntervalMs) await this.check();
    if (this.pendingVersion) return this.applyPending();
    return false;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: SAFE_AUTO_UPDATER_MODE,
      localVersion: this.localVersion,
      remoteVersion: this.remoteVersion,
      pendingVersion: this.pendingVersion,
      pendingSince: this.pendingSince || null,
      safeSince: this.safeSince || null,
      lastSafety: { ...this.lastSafety },
      lastCheckAt: this.lastCheckAt || null,
      lastCheckError: this.lastCheckError,
      lastApply: this.lastApply,
      busy: this.busy,
      config: { ...this.config },
      stats: { ...this.stats },
      policies: {
        checksMayRunWhileUnsafe: true,
        applyRequiresStableSafeWindow: true,
        noDowngrades: true,
        bundleValidatedBeforeSave: true,
        activeCodeSlotOnly: true,
        failedReloadRestartsPreviousRuntime: true,
        noRemoteGameplayAuthority: true,
        updateCannotBypassCombatSafety: true
      }
    };
  }
}

function installSafeAutoUpdater(runtime, options = {}) {
  if (runtime.safeAutoUpdater) return runtime.safeAutoUpdater;
  const updater = new SafeAutoUpdater(runtime, options);
  runtime.safeAutoUpdater = updater;
  return updater;
}

module.exports = {
  SAFE_AUTO_UPDATER_MODE,
  SafeAutoUpdater,
  installSafeAutoUpdater,
  compareVersions,
  releaseVersionFromSource
};
