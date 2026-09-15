'use strict';

const { ACTIVE_CLOUDFLARE_BASE_URL } = require('../control/cloud-free-tier-budget');

const SAFE_AUTO_UPDATER_MODE = 'safe-cloudflare-auto-updater-v2';
const DEFAULT_REPO_RAW = `${ACTIVE_CLOUDFLARE_BASE_URL}/v3`;

function finite(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value, max = 300) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function errorDetails(error, max = 240) {
  if (error == null) return { reason: 'UNKNOWN_ERROR' };
  if (typeof error !== 'object') return { reason: text(error, max) || 'UNKNOWN_ERROR' };
  const rawReason = error.reason != null ? error.reason
    : error.message != null ? error.message
      : error.error != null ? error.error
        : error.code != null ? error.code
          : error.statusText != null ? error.statusText
            : null;
  const details = { reason: text(rawReason == null ? 'STRUCTURED_ERROR' : rawReason, max) || 'STRUCTURED_ERROR' };
  for (const key of ['failed', 'success', 'code', 'status', 'place', 'response']) {
    const value = error[key];
    if (value == null) continue;
    if (typeof value === 'string') details[key] = text(value, max);
    else if (typeof value === 'number' || typeof value === 'boolean') details[key] = value;
  }
  return details;
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

function liveMonster(entity) {
  return !!(entity && entity.mtype && !entity.dead && !entity.rip && (entity.hp == null || Number(entity.hp) > 0));
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
    const retryBase = Math.max(5000, finite(globalConfig.applyRetryBaseMs, 30000));
    const configuredHandshakeTimeout = options.reloadHandshakeTimeoutMs != null ? options.reloadHandshakeTimeoutMs : globalConfig.reloadHandshakeTimeoutMs;
    const configuredHandshakePoll = options.reloadHandshakePollMs != null ? options.reloadHandshakePollMs : globalConfig.reloadHandshakePollMs;
    this.config = {
      enabled: globalConfig.enabled !== false,
      rawBaseUrl: text(globalConfig.rawBaseUrl || DEFAULT_REPO_RAW, 700).replace(/\/+$/, ''),
      checkIntervalMs: Math.max(60000, finite(globalConfig.checkIntervalMs, 300000)),
      safeHoldMs: Math.max(3000, finite(globalConfig.safeHoldMs, 8000)),
      minHpRatio: Math.max(0.7, Math.min(1, finite(globalConfig.minHpRatio, 0.90))),
      emergencyCooldownMs: Math.max(5000, finite(globalConfig.emergencyCooldownMs, 20000)),
      maxBundleBytes: Math.max(250000, finite(globalConfig.maxBundleBytes, 6000000)),
      autoApply: globalConfig.autoApply !== false,
      drainEnabled: globalConfig.drainEnabled !== false,
      applyRetryBaseMs: retryBase,
      applyRetryMaxMs: Math.max(retryBase, finite(globalConfig.applyRetryMaxMs, 300000)),
      reloadHandshakeTimeoutMs: Math.max(50, finite(configuredHandshakeTimeout, 10000)),
      reloadHandshakePollMs: Math.max(5, finite(configuredHandshakePoll, 100))
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
    this.applyFailureStreak = 0;
    this.nextApplyAt = 0;
    this.busy = false;
    this.stats = {
      checks: 0,
      updatesFound: 0,
      safeDeferrals: 0,
      applyBackoffDeferrals: 0,
      downloads: 0,
      validations: 0,
      saves: 0,
      reloads: 0,
      reloadHandshakeSuccesses: 0,
      reloadHandshakeFailures: 0,
      rollbacks: 0,
      drainStarts: 0,
      drainStops: 0,
      drainGuardInstalls: 0,
      failures: 0
    };
    this._installDrainGuards();
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

  _drainActive() {
    return !!(this.runtime.autoUpdateDrain && this.runtime.autoUpdateDrain.active);
  }

  _setDrainActive(active, reason) {
    if (!this.config.drainEnabled && active) return false;
    const now = this.now();
    const previous = this.runtime.autoUpdateDrain && typeof this.runtime.autoUpdateDrain === 'object'
      ? this.runtime.autoUpdateDrain : null;
    if (active) {
      this._installDrainGuards();
      if (previous && previous.active && previous.targetVersion === this.pendingVersion) {
        previous.reason = reason || previous.reason;
        previous.updatedAt = now;
        return true;
      }
      this.runtime.autoUpdateDrain = {
        active: true,
        since: now,
        updatedAt: now,
        targetVersion: this.pendingVersion || null,
        reason: reason || 'UPDATE_PENDING'
      };
      this.stats.drainStarts += 1;
      this._event('AUTO_UPDATE_DRAIN_STARTED', 'info', reason || 'UPDATE_PENDING', {
        targetVersion: this.pendingVersion || null
      });
      return true;
    }
    if (!previous || !previous.active) return false;
    this.runtime.autoUpdateDrain = {
      ...previous,
      active: false,
      updatedAt: now,
      endedAt: now,
      endReason: reason || 'DRAIN_RELEASED'
    };
    this.stats.drainStops += 1;
    this._event('AUTO_UPDATE_DRAIN_STOPPED', 'info', reason || 'DRAIN_RELEASED', {
      targetVersion: previous.targetVersion || null
    });
    return true;
  }

  _installDrainGuards() {
    let installed = 0;
    const runtime = this.runtime;
    const farmer = runtime.farmer;
    if (farmer && typeof farmer.step === 'function' && farmer.step.__aioV3AutoUpdateDrainGuard !== true) {
      const baseStep = farmer.step;
      const updater = this;
      const wrapped = function autoUpdateDrainFarmerStep(context) {
        if (!updater._drainActive() || !context || !context.snapshot || !context.snapshot.character || !context.adapter || context.adapter.mode !== 'active') {
          return baseStep.call(farmer, context);
        }
        const snapshot = context.snapshot;
        const self = String(snapshot.character.name || '');
        const rows = Array.isArray(snapshot.entities) ? snapshot.entities : [];
        const state = String(farmer.state || '').toUpperCase();
        const target = farmer.targetId == null ? null : rows.find((entity) => liveMonster(entity) && String(entity.id || '') === String(farmer.targetId));
        const incoming = rows.find((entity) => liveMonster(entity) && String(entity.target || '') === self) || null;
        if (state === 'RECOVER' || state === 'RETREAT') return baseStep.call(farmer, context);
        if (target && (state === 'ENGAGE' || String(target.target || '') === self)) return baseStep.call(farmer, context);
        if (incoming) {
          farmer.targetId = String(incoming.id);
          farmer.targetType = incoming.mtype || null;
          try { if (typeof farmer._transition === 'function') farmer._transition('ENGAGE', 'AUTO_UPDATE_DRAIN_AGGRO'); } catch (_) {}
          return baseStep.call(farmer, context);
        }
        try {
          if (typeof farmer._needsRecovery === 'function' && typeof farmer._maybePotion === 'function') {
            farmer._maybePotion(context, farmer._needsRecovery(snapshot));
          }
        } catch (_) {}
        try { if (typeof farmer._clearTarget === 'function') farmer._clearTarget('AUTO_UPDATE_DRAIN'); } catch (_) {}
        try { if (typeof farmer._transition === 'function' && state !== 'REASSESS') farmer._transition('REASSESS', 'AUTO_UPDATE_DRAIN'); } catch (_) {}
        return { state: 'RUNNING', reason: 'AUTO_UPDATE_DRAIN' };
      };
      wrapped.__aioV3AutoUpdateDrainGuard = true;
      farmer.step = wrapped;
      installed += 1;
    }

    const economy = runtime.economyEquipmentAutonomyV2;
    if (economy && typeof economy.cycle === 'function' && economy.cycle.__aioV3AutoUpdateDrainGuard !== true) {
      const baseCycle = economy.cycle;
      const updater = this;
      const wrapped = async function autoUpdateDrainEconomyCycle(...args) {
        if (updater._drainActive()) {
          economy.lastDecision = { at: economy.now ? economy.now() : updater.now(), action: 'HOLD', reason: 'AUTO_UPDATE_DRAIN' };
          return false;
        }
        return baseCycle.apply(economy, args);
      };
      wrapped.__aioV3AutoUpdateDrainGuard = true;
      economy.cycle = wrapped;
      installed += 1;
    }

    const logistics = runtime.controlledPartyLogistics;
    if (logistics && typeof logistics.tick === 'function' && logistics.tick.__aioV3AutoUpdateDrainGuard !== true) {
      const baseTick = logistics.tick;
      const updater = this;
      const wrapped = function autoUpdateDrainLogisticsTick(snapshot) {
        if (!updater._drainActive()) return baseTick.call(logistics, snapshot);
        if (!snapshot || !snapshot.character) return null;
        try { if (typeof logistics._prune === 'function') logistics._prune(); } catch (_) {}
        try {
          if (typeof logistics._isMerchant === 'function' && logistics._isMerchant(snapshot)) {
            if (typeof logistics._verifyPendingSupply === 'function') logistics._verifyPendingSupply(snapshot);
          } else if (typeof logistics._verifyPendingOutbound === 'function') {
            logistics._verifyPendingOutbound(snapshot);
          }
        } catch (_) {}
        logistics.lastDecision = { at: logistics.now ? logistics.now() : updater.now(), action: 'HOLD', reason: 'AUTO_UPDATE_DRAIN' };
        return logistics.lastDecision;
      };
      wrapped.__aioV3AutoUpdateDrainGuard = true;
      logistics.tick = wrapped;
      installed += 1;
    }

    if (installed) this.stats.drainGuardInstalls += installed;
    return installed;
  }

  _resetApplyBackoff() {
    this.applyFailureStreak = 0;
    this.nextApplyAt = 0;
  }

  _scheduleApplyBackoff() {
    this.applyFailureStreak += 1;
    const exponent = Math.min(8, this.applyFailureStreak - 1);
    const delayMs = Math.min(this.config.applyRetryMaxMs, this.config.applyRetryBaseMs * (2 ** exponent));
    this.nextApplyAt = this.now() + delayMs;
    return delayMs;
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
    const threats = entitiesOf(this.runtime).filter((row) => liveMonster(row) && String(row.target || '') === self);
    if (threats.length) reasons.push('ACTIVE_AGGRO');
    const targetId = c.target != null ? String(c.target) : '';
    if (targetId && entitiesOf(this.runtime).some((row) => liveMonster(row) && String(row.id || '') === targetId)) reasons.push('ACTIVE_COMBAT_TARGET');
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
          this._resetApplyBackoff();
          this.stats.updatesFound += 1;
          this._event('AUTO_UPDATE_AVAILABLE', 'info', 'NEWER_RELEASE_FOUND', { localVersion: this.localVersion, remoteVersion: version });
        }
        return true;
      }
      if (this.pendingVersion && compareVersions(version, this.localVersion) <= 0) {
        this.pendingVersion = null;
        this.pendingSince = 0;
        this._resetApplyBackoff();
        this._setDrainActive(false, 'REMOTE_NOT_NEWER');
      }
      return false;
    } catch (error) {
      this.stats.failures += 1;
      this.lastCheckError = { at: this.now(), ...errorDetails(error) };
      this._event('AUTO_UPDATE_CHECK_FAILED', 'warn', 'REMOTE_CHECK_FAILED', this.lastCheckError);
      return false;
    } finally {
      this.busy = false;
    }
  }

  _validateBundle(code, version) {
    const body = String(code || '');
    const bytes = body.length;
    const embeddedVersion = releaseVersionFromSource(body);
    const versionMatches = embeddedVersion ? embeddedVersion === String(version) : body.includes(String(version));
    const ok = bytes >= 10000
      && bytes <= this.config.maxBundleBytes
      && body.includes('Adventure Land AiO Bot')
      && versionMatches
      && body.includes('AIO_V3');
    this.stats.validations += 1;
    return { ok, bytes, embeddedVersion, reason: ok ? null : 'BUNDLE_VALIDATION_FAILED' };
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
    const slot = slotInfo && slotInfo.slot;
    if (slot == null || slot === '') throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
    const name = slotInfo.name || `AIO v3 ${slot}`;
    const upload = this._binding('upload_code');
    let result;
    let method;
    if (upload) {
      method = 'upload_code';
      result = upload.fn.call(upload.owner, slot, name, code);
    } else {
      const api = this.parent && this.parent.api_call;
      if (typeof api !== 'function') throw new Error('SAVE_CODE_API_UNAVAILABLE');
      method = 'api_call:save_code';
      result = api.call(this.parent, 'save_code', { slot, name, code, auto: true, electron: true }, { timeout: 15000 });
    }
    if (result && typeof result.then === 'function') result = await result;
    if (result && result.failed === true) throw result;
    this.stats.saves += 1;
    return { method, response: result == null ? null : result };
  }

  _sleep(ms) {
    const timer = this.root && typeof this.root.setTimeout === 'function'
      ? this.root.setTimeout
      : (typeof setTimeout === 'function' ? setTimeout : null);
    if (!timer) return Promise.resolve();
    return new Promise((resolve) => timer.call(this.root, resolve, ms));
  }

  _reloadHandshakeState(oldApi, expectedVersion) {
    const api = this.root && this.root.AIO_V3;
    if (!api) return { ok: false, reason: 'API_MISSING' };
    if (api === oldApi) return { ok: false, reason: 'OLD_API_STILL_ACTIVE' };
    const apiVersion = text(api.version, 80);
    if (apiVersion !== String(expectedVersion || '')) return { ok: false, reason: 'API_VERSION_MISMATCH', apiVersion };
    let status = null;
    try { status = typeof api.status === 'function' ? api.status() : null; } catch (error) {
      return { ok: false, reason: 'STATUS_FAILED', message: text(error && error.message || error, 180) };
    }
    if (!status || String(status.version || '') !== String(expectedVersion || '')) {
      return { ok: false, reason: 'STATUS_VERSION_MISMATCH', apiVersion, statusVersion: status && status.version || null };
    }
    if (status.running !== true) return { ok: false, reason: 'RUNTIME_NOT_RUNNING', apiVersion };
    const nextRuntime = api.__runtime || null;
    const oldRuntime = oldApi && oldApi.__runtime || null;
    if (!nextRuntime || nextRuntime === oldRuntime) return { ok: false, reason: 'RUNTIME_INSTANCE_NOT_REPLACED', apiVersion };
    const activityAt = Math.max(finite(nextRuntime.startedAt, 0), finite(nextRuntime.lastHeartbeat, 0));
    if (!activityAt) return { ok: false, reason: 'RUNTIME_BOOT_ACTIVITY_MISSING', apiVersion };
    return {
      ok: true,
      reason: 'RELOAD_CONFIRMED',
      apiVersion,
      statusVersion: status.version,
      running: true,
      startedAt: finite(nextRuntime.startedAt, 0) || null,
      heartbeatAt: finite(nextRuntime.lastHeartbeat, 0) || null
    };
  }

  async _waitForReloadHandshake(oldApi, expectedVersion) {
    const startedWall = Date.now();
    const deadline = startedWall + this.config.reloadHandshakeTimeoutMs;
    let state = { ok: false, reason: 'NOT_CHECKED' };
    do {
      state = this._reloadHandshakeState(oldApi, expectedVersion);
      if (state.ok) {
        this.stats.reloadHandshakeSuccesses += 1;
        return state;
      }
      await this._sleep(this.config.reloadHandshakePollMs);
    } while (Date.now() < deadline);
    this.stats.reloadHandshakeFailures += 1;
    const error = new Error('NEW_RELEASE_BOOT_NOT_CONFIRMED');
    error.code = 'NEW_RELEASE_BOOT_NOT_CONFIRMED';
    error.response = state.reason;
    throw error;
  }

  async _rollbackRuntime(oldApi, oldWasRunning, slotInfo, reason) {
    const current = this.root && this.root.AIO_V3;
    if (current && current !== oldApi && typeof current.stop === 'function') {
      try {
        const stopped = current.stop();
        if (stopped && typeof stopped.then === 'function') await stopped;
      } catch (_) {}
    }
    try { if (this.root) this.root.AIO_V3 = oldApi || null; } catch (_) {}
    if (oldWasRunning && oldApi && typeof oldApi.start === 'function') {
      try {
        const restart = oldApi.start();
        if (restart && typeof restart.then === 'function') await restart;
      } catch (_) {}
    }
    this.stats.rollbacks += 1;
    this._event('AUTO_UPDATE_RUNTIME_ROLLBACK', 'warn', reason || 'NEW_RELEASE_RELOAD_FAILED', {
      slot: slotInfo && slotInfo.slot,
      oldVersion: this.localVersion,
      targetVersion: this.pendingVersion || null
    });
  }

  async _reloadSavedCode(slotInfo, expectedVersion = this.pendingVersion) {
    const load = this._binding('load_code');
    if (!load) throw new Error('LOAD_CODE_UNAVAILABLE');
    const oldApi = this.root && this.root.AIO_V3;
    let oldWasRunning = !!oldApi;
    try {
      if (oldApi && typeof oldApi.status === 'function') oldWasRunning = !!oldApi.status().running;
      else if (oldApi && oldApi.__runtime) oldWasRunning = !!oldApi.__runtime.timer;
    } catch (_) {}
    try {
      if (oldApi && typeof oldApi.stop === 'function') {
        const stopped = oldApi.stop();
        if (stopped && typeof stopped.then === 'function') await stopped;
      }
    } catch (_) {}
    try { if (this.root) this.root.AIO_V3 = null; } catch (_) {}
    try {
      const result = load.fn.call(load.owner, slotInfo.slot);
      if (result && typeof result.then === 'function') await result;
      const handshake = await this._waitForReloadHandshake(oldApi, expectedVersion);
      this.stats.reloads += 1;
      return handshake;
    } catch (error) {
      await this._rollbackRuntime(oldApi, oldWasRunning, slotInfo,
        error && error.code === 'NEW_RELEASE_BOOT_NOT_CONFIRMED' ? 'NEW_RELEASE_BOOT_NOT_CONFIRMED' : 'NEW_RELEASE_RELOAD_FAILED');
      throw error;
    }
  }

  async applyPending() {
    if (!this.pendingVersion || !this.config.autoApply || this.busy) {
      if (!this.config.autoApply) this._setDrainActive(false, 'AUTO_APPLY_DISABLED');
      return false;
    }
    if (this.nextApplyAt && this.now() < this.nextApplyAt) {
      this.stats.applyBackoffDeferrals += 1;
      this._setDrainActive(false, 'APPLY_BACKOFF');
      return false;
    }
    this._setDrainActive(true, 'UPDATE_PENDING');
    if (!this._stableSafe()) {
      this.stats.safeDeferrals += 1;
      return false;
    }
    this.busy = true;
    const version = this.pendingVersion;
    const attempt = { at: this.now(), from: this.localVersion, to: version, saved: false, reloaded: false };
    try {
      const code = await this._fetchText(`${this.config.rawBaseUrl}/dist/aio-v3.js`, 20000);
      this.stats.downloads += 1;
      const validation = this._validateBundle(code, version);
      attempt.bytes = validation.bytes;
      attempt.bundleVersion = validation.embeddedVersion || version;
      if (!validation.ok) throw new Error(validation.reason);
      if (!this._stableSafe()) throw new Error('SAFETY_CHANGED_DURING_DOWNLOAD');
      const slot = this._activeSlot();
      if (!slot) throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
      attempt.slot = slot.slot;
      const save = await this._saveCode(slot, code);
      attempt.saved = true;
      attempt.saveMethod = save.method;
      this.lastApply = { ...attempt };
      this._resetApplyBackoff();
      this._event('AUTO_UPDATE_SAVED', 'info', 'SAFE_RELEASE_PERSISTED', { from: this.localVersion, to: version, slot: slot.slot, bytes: validation.bytes, saveMethod: save.method });
      const handshake = await this._reloadSavedCode(slot, version);
      attempt.reloaded = true;
      attempt.handshake = handshake;
      this.lastApply = { ...attempt };
      this._setDrainActive(false, 'RELOAD_CONFIRMED');
      return true;
    } catch (error) {
      this.stats.failures += 1;
      const details = errorDetails(error);
      const retryInMs = this._scheduleApplyBackoff();
      this.lastApply = {
        ...attempt,
        error: details,
        errorReason: details.reason,
        retryInMs,
        nextApplyAt: this.nextApplyAt
      };
      this._setDrainActive(false, 'APPLY_FAILED_BACKOFF');
      this._event('AUTO_UPDATE_APPLY_FAILED', 'warn', 'SAFE_UPDATE_FAILED', this.lastApply);
      return false;
    } finally {
      this.busy = false;
    }
  }

  async cycle() {
    if (!this.config.enabled) {
      this._setDrainActive(false, 'UPDATER_DISABLED');
      return false;
    }
    this._installDrainGuards();
    this.safety();
    const now = this.now();
    if (!this.pendingVersion && now - this.lastCheckAt >= this.config.checkIntervalMs) await this.check();
    if (!this.pendingVersion) {
      this._setDrainActive(false, 'NO_PENDING_UPDATE');
      return false;
    }
    if (this.nextApplyAt && now < this.nextApplyAt) {
      this._setDrainActive(false, 'APPLY_BACKOFF');
      this.stats.applyBackoffDeferrals += 1;
      return false;
    }
    return this.applyPending();
  }

  status() {
    return {
      schemaVersion: 2,
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
      applyFailureStreak: this.applyFailureStreak,
      nextApplyAt: this.nextApplyAt || null,
      busy: this.busy,
      drain: this.runtime.autoUpdateDrain ? { ...this.runtime.autoUpdateDrain } : null,
      config: { ...this.config },
      stats: { ...this.stats },
      policies: {
        checksMayRunWhileUnsafe: true,
        publicCloudflareReleaseMirror: true,
        releaseMirrorUsesExistingWorkerAndR2: true,
        applyCreatesStableSafeWindow: true,
        applyRequiresStableSafeWindow: true,
        applyFailuresUseExponentialBackoff: true,
        structuredApiErrorsPreserved: true,
        publicUploadCodePreferred: true,
        noDowngrades: true,
        bundleValidatedBeforeSave: true,
        activeCodeSlotOnly: true,
        reloadRequiresVersionAndRunningRuntimeHandshake: true,
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
  DEFAULT_REPO_RAW,
  SafeAutoUpdater,
  installSafeAutoUpdater,
  compareVersions,
  releaseVersionFromSource,
  errorDetails
};