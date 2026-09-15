'use strict';

const CLOUD_STORAGE_KEY = 'aio-v3:cloud-control:v1';
const LEGACY_V2_STABLE_PREFIX = 'ALBOT27:stable-config:';
const { ACTIVE_CLOUDFLARE_BASE_URL, readCloudRequestBudget, reserveCloudRequest } = require('./cloud-free-tier-budget');

function finite(value, fallback = 0) { if (value == null || value === '') return fallback; const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function text(value, max = 200) { return String(value == null ? '' : value).trim().slice(0, max); }
function safeClone(value) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
function parseObject(value) { try { const out = JSON.parse(String(value || 'null')); return out && typeof out === 'object' ? out : null; } catch (_) { return null; } }
function storage(root) { try { return root && (root.localStorage || root.parent && root.parent.localStorage) || null; } catch (_) { return null; } }
function characterOf(runtime) { return runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || null; }
function isMerchant(runtime) { return String(characterOf(runtime) && characterOf(runtime).ctype || '').toLowerCase() === 'merchant'; }
function normalizeBaseUrl(value) { const v = text(value, 400).replace(/\/+$/, ''); return /^https:\/\//i.test(v) || /^http:\/\/localhost(?::\d+)?$/i.test(v) ? v : ''; }
function validCredentials(value) { return !!(value && normalizeBaseUrl(value.baseUrl || '') && text(value.writeKey || '', 500)); }

function legacyV2DashboardCredentials(store, runtime, root) {
  if (!store) return null;
  const candidates = [];
  const addConfig = (config, source) => {
    if (!config || typeof config !== 'object') return;
    const baseUrl = normalizeBaseUrl(config.webDashboardConnectionUrl || config.webDashboardUrl || config.dashboardUrl || '');
    const writeKey = text(config.webDashboardWriteKey || config.dashboardWriteKey || '', 500);
    if (!baseUrl || !writeKey) return;
    candidates.push({ baseUrl, writeKey, account: 'default', source });
  };
  const localCharacter = text(characterOf(runtime) && characterOf(runtime).name || root && root.character && root.character.name || root && root.parent && root.parent.character && root.parent.character.name || '', 80);
  if (localCharacter) {
    try {
      const stable = parseObject(store.getItem(LEGACY_V2_STABLE_PREFIX + localCharacter));
      addConfig(stable && stable.config, 'v2-stable-config');
    } catch (_) {}
  }
  if (!candidates.length && typeof store.length === 'number' && typeof store.key === 'function') {
    const count = Math.min(Math.max(0, store.length), 250);
    for (let i = 0; i < count; i += 1) {
      let key = '';
      try { key = String(store.key(i) || ''); } catch (_) { continue; }
      if (!key.startsWith('ALBOT27:')) continue;
      let parsed = null;
      try { parsed = parseObject(store.getItem(key)); } catch (_) { continue; }
      if (!parsed) continue;
      if (key.startsWith(LEGACY_V2_STABLE_PREFIX)) addConfig(parsed.config, 'v2-stable-config-scan');
      else if (key.endsWith(':config')) addConfig(parsed, 'v2-account-config');
      if (candidates.length) break;
    }
  }
  return candidates[0] || null;
}

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
    this.credentialSource = 'none';
    this.explicitGlobalConfig = false;
    this.legacyCredentialsMigrated = false;
    this.autoEnableSuggested = false;
    this.lastRuntimePushAt = 0;
    this.lastConfigPullAt = 0;
    this.lastTeacherAt = 0;
    this.lastSuccessAt = 0;
    this.lastError = null;
    this.busy = false;
    this.pendingFeedback = [];
    this.remoteRevision = 0;
    this.remoteUpdatedAt = 0;
    this.stats = { runtimePushes: 0, configPulls: 0, configChanges: 0, extendedConfigChanges: 0, teacherCalls: 0, teacherBlocked: 0, teacherErrors: 0, feedbackPushes: 0, brainImports: 0, failures: 0, legacyCredentialMigrations: 0, cloudRequestsReserved: 0, cloudRequestsBlocked: 0 };
    this._load();
  }

  _storage() { return storage(this.root); }

  _load() {
    const store = this._storage();
    let stored = null;
    try { stored = store ? parseObject(store.getItem(CLOUD_STORAGE_KEY)) : null; } catch (_) {}
    const globalCfg = this.root && this.root.AIO_V3_CLOUD_CONFIG && typeof this.root.AIO_V3_CLOUD_CONFIG === 'object' ? this.root.AIO_V3_CLOUD_CONFIG : {};
    const globalWriteKey = text(globalCfg.writeKey || '', 500);
    const storedWriteKey = text(stored && stored.writeKey || '', 500);
    const globalCredentials = { baseUrl: normalizeBaseUrl(globalCfg.baseUrl || '') || (globalWriteKey ? ACTIVE_CLOUDFLARE_BASE_URL : ''), writeKey: globalWriteKey, account: text(globalCfg.account || 'default', 100) || 'default' };
    const storedCredentials = { baseUrl: normalizeBaseUrl(stored && stored.baseUrl || '') || (storedWriteKey ? ACTIVE_CLOUDFLARE_BASE_URL : ''), writeKey: storedWriteKey, account: text(stored && stored.account || 'default', 100) || 'default' };
    const legacy = legacyV2DashboardCredentials(store, this.runtime, this.root);
    this.explicitGlobalConfig = validCredentials(globalCredentials);
    if (this.explicitGlobalConfig) {
      this.credentials = globalCredentials;
      this.credentialSource = 'global-v3-config';
    } else if (validCredentials(storedCredentials)) {
      this.credentials = storedCredentials;
      this.credentialSource = 'local-v3-storage';
    } else if (validCredentials(legacy)) {
      this.credentials = { baseUrl: legacy.baseUrl, writeKey: legacy.writeKey, account: legacy.account || 'default' };
      this.credentialSource = legacy.source || 'v2-legacy';
      this.legacyCredentialsMigrated = true;
      this.stats.legacyCredentialMigrations += 1;
      try { if (store) store.setItem(CLOUD_STORAGE_KEY, JSON.stringify(this.credentials)); } catch (_) {}
      if (this.log) this.log.emit({ component: 'cloud-control-plane', event: 'V2_CLOUD_CREDENTIALS_MIGRATED', data: { source: this.credentialSource, baseUrl: this.credentials.baseUrl, writeKeyMigrated: true, secretExposed: false } });
    }
    this.autoEnableSuggested = this.explicitGlobalConfig || this.legacyCredentialsMigrated;
  }

  configure(input = {}) {
    if (input.baseUrl != null) this.credentials.baseUrl = normalizeBaseUrl(input.baseUrl);
    if (input.writeKey != null) this.credentials.writeKey = text(input.writeKey, 500);
    if (!this.credentials.baseUrl && this.credentials.writeKey) this.credentials.baseUrl = ACTIVE_CLOUDFLARE_BASE_URL;
    if (input.account != null) this.credentials.account = text(input.account, 100) || 'default';
    this.credentialSource = 'runtime-configure';
    const store = this._storage();
    try { if (store) store.setItem(CLOUD_STORAGE_KEY, JSON.stringify(this.credentials)); } catch (_) {}
    return this.status();
  }

  clearCredentials() {
    this.credentials = { baseUrl: '', writeKey: '', account: 'default' };
    this.credentialSource = 'none';
    this.explicitGlobalConfig = false;
    this.legacyCredentialsMigrated = false;
    this.autoEnableSuggested = false;
    const store = this._storage();
    try { if (store) store.removeItem(CLOUD_STORAGE_KEY); } catch (_) {}
    return this.status();
  }

  _enabled() { return !!(this.control && this.control.get('cloud.enabled', false) && this.credentials.baseUrl && this.credentials.writeKey && this.fetchFn); }

  async _post(path, body, timeoutMs = 10000) {
    if (!this.fetchFn) throw new Error('fetch unavailable');
    const character = text(characterOf(this.runtime) && characterOf(this.runtime).name || 'unknown', 80) || 'unknown';
    const budget = reserveCloudRequest({ root: this.root, character, now: this.now() });
    if (!budget.ok) {
      this.stats.cloudRequestsBlocked += 1;
      const error = new Error(`CLOUDFLARE_FREE_TIER_GUARD: ${budget.reason}`);
      error.code = budget.reason;
      error.freeTierBudget = budget;
      throw error;
    }
    this.stats.cloudRequestsReserved += 1;
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
    const localCharacter = text(c.name || 'unknown', 80) || 'unknown';
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
      cloud: {
        ready: !!(this.credentials.baseUrl && this.credentials.writeKey && this.fetchFn),
        enabledBySettings: !!(this.control && this.control.get('cloud.enabled', false)),
        lastSuccessAt: this.lastSuccessAt,
        lastError: safeClone(this.lastError),
        freeTierBudget: readCloudRequestBudget({ root: this.root, character: localCharacter, now: this.now() })
      },
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
      const pushMs = Math.max(15000, finite(this.control.get('cloud.runtimePushMs', 15000), 15000));
      const pullMs = Math.max(30000, finite(this.control.get('cloud.configPullMs', 30000), 30000));
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
      schemaVersion: 2, mode: 'cloudflare-v3-control-plane-v2', enabledBySettings: !!(this.control && this.control.get('cloud.enabled', false)), ready: !!(this.credentials.baseUrl && this.credentials.writeKey && this.fetchFn), explicitGlobalConfig: this.explicitGlobalConfig, legacyCredentialsMigrated: this.legacyCredentialsMigrated, credentialSource: this.credentialSource,
      configured: { baseUrl: this.credentials.baseUrl || null, account: this.credentials.account, writeKeyPresent: !!this.credentials.writeKey },
      freeTierBudget: readCloudRequestBudget({ root: this.root, character: text(characterOf(this.runtime) && characterOf(this.runtime).name || 'unknown', 80) || 'unknown', now: this.now() }),
      busy: this.busy, lastRuntimePushAt: this.lastRuntimePushAt, lastConfigPullAt: this.lastConfigPullAt, lastTeacherAt: this.lastTeacherAt, lastSuccessAt: this.lastSuccessAt, lastError: this.lastError, remoteRevision: this.remoteRevision, remoteUpdatedAt: this.remoteUpdatedAt, pendingFeedback: this.pendingFeedback.length, stats: { ...this.stats },
      policies: { secretsNeverExposedInStatus: true, onlyMerchantCallsTeacher: true, cloudFailureDoesNotBlockLocalRuntime: true, remoteSettingsValidatedLocally: true, remoteExtendedSettingsUseLocalApplyPath: true, brainOutcomeEvaluationOwnedByAlpha25: true, brainHasNoDirectExecutorAccess: true, v2DashboardCredentialsCanMigrateLocally: true, cloudRequestsFailClosedAtFreeTierBudget: true, activeCloudflareEndpointDefaultsAutomatically: true }
    };
  }
}

module.exports = { CLOUD_STORAGE_KEY, LEGACY_V2_STABLE_PREFIX, CloudControlPlane, normalizeBaseUrl, legacyV2DashboardCredentials };
