'use strict';

const CLOUD_STORAGE_KEY = 'aio-v3:cloud-control:v1';

function finite(value, fallback = 0) { if (value == null || value === '') return fallback; const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function text(value, max = 200) { return String(value == null ? '' : value).trim().slice(0, max); }
function safeClone(value) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
function storage(root) { try { return root && (root.localStorage || root.parent && root.parent.localStorage) || null; } catch (_) { return null; } }
function characterOf(runtime) { return runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || null; }
function isMerchant(runtime) { return String(characterOf(runtime) && characterOf(runtime).ctype || '').toLowerCase() === 'merchant'; }
function normalizeBaseUrl(value) { const v = text(value, 400).replace(/\/+$/, ''); return /^https:\/\//i.test(v) || /^http:\/\/localhost(?::\d+)?$/i.test(v) ? v : ''; }

class CloudControlPlane {
  constructor(options = {}) {
    if (!options.runtime) throw new Error('runtime required');
    this.runtime = options.runtime;
    this.control = options.controlPlane || null;
    this.brain = options.brain || null;
    this.root = options.root || this.runtime.root || globalThis;
    this.now = options.now || this.runtime.now || (() => Date.now());
    this.log = options.log || this.runtime.log || null;
    this.onSettingsChanged = typeof options.onSettingsChanged === 'function' ? options.onSettingsChanged : null;
    this.fetchFn = options.fetch || this.root && this.root.fetch || (typeof fetch === 'function' ? fetch : null);
    this.credentials = { baseUrl: '', writeKey: '', account: 'default' };
    this.explicitGlobalConfig = false;
    this.lastRuntimePushAt = 0;
    this.lastConfigPullAt = 0;
    this.lastTeacherAt = 0;
    this.lastSuccessAt = 0;
    this.lastError = null;
    this.busy = false;
    this.pendingFeedback = [];
    this.remoteRevision = 0;
    this.remoteUpdatedAt = 0;
    this.stats = { runtimePushes: 0, configPulls: 0, configChanges: 0, extendedConfigChanges: 0, teacherCalls: 0, teacherBlocked: 0, teacherErrors: 0, feedbackPushes: 0, brainImports: 0, failures: 0 };
    this._load();
  }

  _storage() { return storage(this.root); }

  _load() {
    const s = this._storage();
    let stored = null;
    try { stored = s ? JSON.parse(s.getItem(CLOUD_STORAGE_KEY) || 'null') : null; } catch (_) {}
    const globalCfg = this.root && this.root.AIO_V3_CLOUD_CONFIG && typeof this.root.AIO_V3_CLOUD_CONFIG === 'object' ? this.root.AIO_V3_CLOUD_CONFIG : {};
    this.explicitGlobalConfig = !!(normalizeBaseUrl(globalCfg.baseUrl || '') && text(globalCfg.writeKey || '', 500));
    this.credentials.baseUrl = normalizeBaseUrl(globalCfg.baseUrl || stored && stored.baseUrl || '');
    this.credentials.writeKey = text(globalCfg.writeKey || stored && stored.writeKey || '', 500);
    this.credentials.account = text(globalCfg.account || stored && stored.account || 'default', 100) || 'default';
  }

  configure(input = {}) {
    if (input.baseUrl != null) this.credentials.baseUrl = normalizeBaseUrl(input.baseUrl);
    if (input.writeKey != null) this.credentials.writeKey = text(input.writeKey, 500);
    if (input.account != null) this.credentials.account = text(input.account, 100) || 'default';
    const s = this._storage();
    try { if (s) s.setItem(CLOUD_STORAGE_KEY, JSON.stringify(this.credentials)); } catch (_) {}
    return this.status();
  }

  clearCredentials() {
    this.credentials = { baseUrl: '', writeKey: '', account: 'default' };
    this.explicitGlobalConfig = false;
    const s = this._storage();
    try { if (s) s.removeItem(CLOUD_STORAGE_KEY); } catch (_) {}
    return this.status();
  }

  _enabled() { return !!(this.control && this.control.get('cloud.enabled', false) && this.credentials.baseUrl && this.credentials.writeKey && this.fetchFn); }

  async _post(path, body, timeoutMs = 10000) {
    if (!this.fetchFn) throw new Error('fetch unavailable');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await this.fetchFn.call(this.root, this.credentials.baseUrl + path, {
        method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, signal: controller && controller.signal,
        body: JSON.stringify({ ...body, writeKey: this.credentials.writeKey })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload && payload.ok === false) throw new Error(text(payload && payload.error || `HTTP ${response.status}`, 300));
      return payload || {};
    } finally { if (timer) clearTimeout(timer); }
  }

  _runtimeSnapshot() {
    const c = characterOf(this.runtime) || {};
    const perf = this.runtime.performance && this.runtime.performance.status ? this.runtime.performance.status() : null;
    const alpha23 = this.runtime.alpha23CombatStabilityHotfix && this.runtime.alpha23CombatStabilityHotfix.status ? this.runtime.alpha23CombatStabilityHotfix.status() : null;
    const alpha24 = this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix && this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix.status ? this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix.status() : null;
    const economy = this.runtime.economyEquipmentAutonomyV2 && this.runtime.economyEquipmentAutonomyV2.status ? this.runtime.economyEquipmentAutonomyV2.status() : null;
    let registry = null; try { registry = this.runtime.characterRegistry && this.runtime.characterRegistry.status ? this.runtime.characterRegistry.status() : null; } catch (_) {}
    let events = []; try { events = this.runtime.log && this.runtime.log.list ? this.runtime.log.list(Math.max(10, Math.min(120, finite(this.control && this.control.get('cloud.eventBatchSize', 80), 80)))) : []; } catch (_) {}
    return {
      schemaVersion: 2,
      updatedAt: this.now(),
      character: { name: c.name || null, ctype: c.ctype || null, level: finite(c.level, 0), map: c.map || null, x: finite(c.x, null), y: finite(c.y, null), hp: finite(c.hp, 0), max_hp: finite(c.max_hp, 0), mp: finite(c.mp, 0), max_mp: finite(c.max_mp, 0), gold: finite(c.gold, 0), rip: !!c.rip, range: finite(c.range, null), speed: finite(c.speed, null), attack: finite(c.attack, null) },
      mode: this.runtime.adapter && this.runtime.adapter.mode || null,
      farmer: this.runtime.farmer && this.runtime.farmer.status ? this.runtime.farmer.status() : null,
      performance: perf,
      party: registry,
      combat: { alpha23, alpha24, lastRiskSkip: safeClone(this.runtime.lastRiskSkip), lastEmergencyDisengage: safeClone(this.runtime.lastEmergencyDisengage) },
      economy,
      brain: this.brain && this.brain.status ? this.brain.status() : null,
      control: this.control && this.control.status ? this.control.status() : null,
      events: safeClone(events) || []
    };
  }

  async pushRuntime() {
    const c = characterOf(this.runtime); if (!c || !c.name) return false;
    const result = await this._post('/api/v3/runtime', { account: this.credentials.account, character: c.name, status: this._runtimeSnapshot() });
    this.stats.runtimePushes += 1; this.lastRuntimePushAt = this.now(); this.lastSuccessAt = this.now(); return result;
  }

  async syncState() {
    const c = characterOf(this.runtime); if (!c || !c.name) return false;
    const body = { account: this.credentials.account, character: c.name, configRevision: this.control && this.control.revision || 0, brainState: this.brain && this.brain.exportState ? this.brain.exportState() : null };
    const result = await this._post('/api/v3/sync', body, 12000);
    this.stats.configPulls += 1; this.lastConfigPullAt = this.now(); this.lastSuccessAt = this.now();
    if (result.settings && this.control) {
      const patch = this.control.patch(result.settings.values || result.settings, { source: 'cloudflare-d1', revision: result.settings.revision, updatedAt: result.settings.updatedAt });
      const applied = this.control.applyHot(this.runtime, patch.changed);
      if (patch.changed.length) {
        this.stats.configChanges += patch.changed.length;
        if (this.onSettingsChanged) {
          try { this.onSettingsChanged(patch.changed); this.stats.extendedConfigChanges += patch.changed.length; }
          catch (error) { if (this.log) this.log.emit({ component: 'cloud-control-plane', event: 'REMOTE_EXTENDED_SETTINGS_FAILED', severity: 'warn', reason: text(error && error.message || error, 240) }); }
        }
      }
      this.remoteRevision = Math.max(this.remoteRevision, finite(result.settings.revision, 0)); this.remoteUpdatedAt = Math.max(this.remoteUpdatedAt, finite(result.settings.updatedAt, 0));
      if (patch.changed.length && this.log) this.log.emit({ component: 'cloud-control-plane', event: 'REMOTE_SETTINGS_APPLIED', data: { changed: patch.changed.map((row) => row.key), hotApplied: applied.applied, restartRequired: applied.restartRequired, extendedApplied: !!this.onSettingsChanged, revision: this.remoteRevision } });
    }
    if (result.brainState && this.brain && this.brain.importState && finite(result.brainState.samples, 0) > finite(this.brain.samples, 0)) {
      if (this.brain.importState(result.brainState)) this.stats.brainImports += 1;
    }
    return result;
  }

  async askTeacher() {
    if (!isMerchant(this.runtime) || !this.brain || !this.brain.shouldAskTeacher || !this.brain.shouldAskTeacher()) return false;
    const requestState = this.brain.teacherRequest('adaptive-budget'); if (!requestState) return false;
    const result = await this._post('/api/v3/brain/teacher', { account: this.credentials.account, character: characterOf(this.runtime).name, dailyLimit: this.control && this.control.get('brain.dailyNeuronLimit', 10000), budgetTargetFraction: this.control && this.control.get('brain.budgetTargetFraction', 0.995), state: requestState }, 30000);
    this.stats.teacherCalls += 1; this.lastTeacherAt = this.now(); this.lastSuccessAt = this.now();
    if (result.blocked) { this.stats.teacherBlocked += 1; return result; }
    if (result.decision && this.brain.ingestTeacher) this.brain.ingestTeacher(result.decision, { neurons: result.neurons });
    return result;
  }

  async pushFeedback(feedback) {
    if (!feedback) return false;
    const c = characterOf(this.runtime) || {};
    const result = await this._post('/api/v3/brain/feedback', { account: this.credentials.account, character: c.name || 'unknown', feedback }, 10000);
    this.stats.feedbackPushes += 1; this.lastSuccessAt = this.now(); return result;
  }

  async cycle() {
    if (this.busy || !this._enabled()) return false;
    this.busy = true;
    try {
      const now = this.now();
      const pushMs = Math.max(2000, finite(this.control.get('cloud.runtimePushMs', 5000), 5000));
      const pullMs = Math.max(5000, finite(this.control.get('cloud.configPullMs', 15000), 15000));
      if (now - this.lastRuntimePushAt >= pushMs) await this.pushRuntime();
      if (now - this.lastConfigPullAt >= pullMs) await this.syncState();
      if (isMerchant(this.runtime) && this.brain && this.brain.shouldAskTeacher && this.brain.shouldAskTeacher()) await this.askTeacher();
      if (this.pendingFeedback.length) { const next = this.pendingFeedback[0]; await this.pushFeedback(next); this.pendingFeedback.shift(); }
      this.lastError = null; return true;
    } catch (error) {
      this.stats.failures += 1; this.lastError = { at: this.now(), message: text(error && error.message || error, 300) };
      if (this.log) this.log.emit({ component: 'cloud-control-plane', event: 'CLOUD_CONTROL_CYCLE_FAILED', severity: 'warn', reason: this.lastError.message, data: { localSafetyUnaffected: true } });
      return false;
    } finally { this.busy = false; }
  }

  status() {
    return {
      schemaVersion: 2, mode: 'cloudflare-v3-control-plane-v2', enabledBySettings: !!(this.control && this.control.get('cloud.enabled', false)), ready: !!(this.credentials.baseUrl && this.credentials.writeKey && this.fetchFn), explicitGlobalConfig: this.explicitGlobalConfig,
      configured: { baseUrl: this.credentials.baseUrl || null, account: this.credentials.account, writeKeyPresent: !!this.credentials.writeKey },
      busy: this.busy, lastRuntimePushAt: this.lastRuntimePushAt, lastConfigPullAt: this.lastConfigPullAt, lastTeacherAt: this.lastTeacherAt, lastSuccessAt: this.lastSuccessAt, lastError: this.lastError, remoteRevision: this.remoteRevision, remoteUpdatedAt: this.remoteUpdatedAt, pendingFeedback: this.pendingFeedback.length, stats: { ...this.stats },
      policies: { secretsNeverExposedInStatus: true, onlyMerchantCallsTeacher: true, cloudFailureDoesNotBlockLocalRuntime: true, remoteSettingsValidatedLocally: true, remoteExtendedSettingsUseLocalApplyPath: true, brainOutcomeEvaluationOwnedByAlpha25: true, brainHasNoDirectExecutorAccess: true }
    };
  }
}

module.exports = { CLOUD_STORAGE_KEY, CloudControlPlane, normalizeBaseUrl };
