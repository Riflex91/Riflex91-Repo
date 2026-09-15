'use strict';

const ALPHA20_22_MODE = 'alpha20.22-live-smoke-recovery-v1';
const CM_QUOTA_BACKOFF_MS = 2 * 60 * 1000;
const CLOUD_NETWORK_BACKOFF_MIN_MS = 30 * 1000;
const CLOUD_NETWORK_BACKOFF_MAX_MS = 5 * 60 * 1000;

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function text(value, max = 240) { return String(value == null ? '' : value).slice(0, max); }
function clone(value) { try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
function isD1QuotaMessage(value) { return /D1_DAILY_ROW_READ_LIMIT|\b7500\b|daily row read limit|exceeded D1'?s free tier daily row read/i.test(String(value || '')); }
function isNetworkMessage(value) { return /failed to fetch|networkerror|network request failed|load failed/i.test(String(value || '')); }
function isStorageQuotaMessage(value) { return /QuotaExceededError|exceeded the quota|quota.*storage|storage.*quota/i.test(String(value || '')); }
function nextUtcReset(now) { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 1, 0, 0); }
function rootFn(runtime, name) { const root = runtime && runtime.root; return root && (root[name] || root.parent && root.parent[name]) || null; }

function installLocalFarmTerrainGuard(runtime, stats) {
  const local = runtime && runtime.localFarming;
  if (!local || local.__alpha2022TerrainGuardInstalled || typeof local._boundedDestination !== 'function') return false;
  const base = local._boundedDestination.bind(local);
  local._boundedDestination = (character, plan) => {
    const direct = base(character, plan);
    if (!direct) return direct;
    const canMoveTo = rootFn(runtime, 'can_move_to');
    if (typeof canMoveTo !== 'function') return direct;
    const can = (x, y) => { try { return canMoveTo.call(runtime.root, x, y) !== false; } catch (_) { return null; } };
    const directPassable = can(direct.x, direct.y);
    if (directPassable == null || directPassable === true) return direct;
    const cx = finite(character && character.x, NaN), cy = finite(character && character.y, NaN), px = finite(plan && plan.x, NaN), py = finite(plan && plan.y, NaN);
    if (![cx, cy, px, py].every(Number.isFinite)) return direct;
    const dx = px - cx, dy = py - cy, distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance <= 0) return direct;
    const baseAngle = Math.atan2(dy, dx), factors = [1, 0.8, 0.65, 0.5, 0.35], offsets = [0, 25, -25, 45, -45, 70, -70, 95, -95, 125, -125];
    let best = null;
    for (const factor of factors) {
      const step = Math.max(16, direct.step * factor);
      for (const degrees of offsets) {
        if (factor === 1 && degrees === 0) continue;
        const angle = baseAngle + degrees * Math.PI / 180;
        const candidate = { x: cx + Math.cos(angle) * step, y: cy + Math.sin(angle) * step, step };
        if (can(candidate.x, candidate.y) !== true) continue;
        const remaining = Math.hypot(px - candidate.x, py - candidate.y);
        if (remaining >= distance - 2) continue;
        const score = remaining + Math.abs(degrees) * 0.2 + (1 - factor) * 8;
        if (!best || score < best.score) best = { ...candidate, score, terrainAdjusted: true, angleOffsetDeg: degrees, originalX: direct.x, originalY: direct.y };
      }
    }
    if (best) { stats.localFarmTerrainReroutes += 1; return best; }
    stats.localFarmBlockedWaypoints += 1;
    return null;
  };
  if (typeof local.status === 'function') {
    const baseStatus = local.status.bind(local);
    local.status = () => ({ ...baseStatus(), alpha20_22: { terrainGuard: true, blockedDirectMoveNeverIssued: true, terrainReroutes: stats.localFarmTerrainReroutes, blockedWaypoints: stats.localFarmBlockedWaypoints } });
  }
  local.__alpha2022TerrainGuardInstalled = true;
  return true;
}

function installCloudBackoff(runtime, stats, state) {
  const cloud = runtime && runtime.cloudControlPlane;
  if (!cloud || cloud.__alpha2022BackoffInstalled || typeof cloud._post !== 'function' || typeof cloud.cycle !== 'function') return false;
  const basePost = cloud._post.bind(cloud), baseCycle = cloud.cycle.bind(cloud);
  const nowFn = () => cloud.now ? cloud.now() : (runtime.now ? runtime.now() : Date.now());
  const arm = (message) => {
    const now = nowFn();
    if (isD1QuotaMessage(message)) {
      state.cloudBackoffUntil = Math.max(state.cloudBackoffUntil, nextUtcReset(now) + 60 * 1000);
      state.cloudBackoffReason = 'D1_DAILY_ROW_READ_LIMIT'; state.networkFailureStreak = 0; stats.cloudD1QuotaBackoffs += 1;
    } else if (isNetworkMessage(message)) {
      state.networkFailureStreak += 1;
      const delay = Math.min(CLOUD_NETWORK_BACKOFF_MAX_MS, CLOUD_NETWORK_BACKOFF_MIN_MS * Math.pow(2, Math.min(4, state.networkFailureStreak - 1)));
      state.cloudBackoffUntil = Math.max(state.cloudBackoffUntil, now + delay); state.cloudBackoffReason = 'NETWORK_FAILURE_BACKOFF'; stats.cloudNetworkBackoffs += 1;
    }
  };
  cloud._post = async (...args) => {
    const now = nowFn();
    if (state.cloudBackoffUntil > now) {
      const error = new Error(`CLOUD_BACKOFF_ACTIVE:${state.cloudBackoffReason || 'UNKNOWN'}`); error.retryAfterMs = state.cloudBackoffUntil - now; throw error;
    }
    try {
      const result = await basePost(...args);
      state.networkFailureStreak = 0;
      if (state.cloudBackoffReason === 'NETWORK_FAILURE_BACKOFF') { state.cloudBackoffUntil = 0; state.cloudBackoffReason = null; }
      return result;
    } catch (error) { arm(error && error.message || error); throw error; }
  };
  cloud.cycle = (...args) => {
    if (state.cloudBackoffUntil > nowFn()) { stats.cloudCyclesSuppressed += 1; return Promise.resolve(false); }
    return baseCycle(...args);
  };
  if (typeof cloud.status === 'function') {
    const baseStatus = cloud.status.bind(cloud);
    cloud.status = () => ({ ...baseStatus(), alpha20_22Backoff: { active: state.cloudBackoffUntil > nowFn(), until: state.cloudBackoffUntil || null, reason: state.cloudBackoffReason, networkFailureStreak: state.networkFailureStreak, serverQuotaRecognized: true } });
  }
  cloud.__alpha2022BackoffInstalled = true;
  return true;
}

function installPersistenceBackoff(runtime, stats, state) {
  const persistence = runtime && runtime.cloudLongTermPersistence;
  if (!persistence || persistence.__alpha2022BackoffInstalled || typeof persistence.beforeTick !== 'function') return false;
  const baseBeforeTick = persistence.beforeTick.bind(persistence);
  persistence.beforeTick = (...args) => {
    const now = persistence.now ? persistence.now() : Date.now();
    if (state.cloudBackoffUntil > now) { stats.persistenceCyclesSuppressed += 1; return false; }
    return baseBeforeTick(...args);
  };
  if (typeof persistence.status === 'function') {
    const baseStatus = persistence.status.bind(persistence);
    persistence.status = () => ({ ...baseStatus(), alpha20_22Backoff: { active: state.cloudBackoffUntil > (persistence.now ? persistence.now() : Date.now()), until: state.cloudBackoffUntil || null, reason: state.cloudBackoffReason } });
  }
  persistence.__alpha2022BackoffInstalled = true;
  return true;
}

function installCmQuotaBackoff(runtime, stats, state) {
  const transport = runtime && runtime.partyAccountCommunication && runtime.partyAccountCommunication.transport;
  if (!transport || transport.__alpha2022CmQuotaBackoffInstalled || typeof transport.send !== 'function') return false;
  const baseSend = transport.send.bind(transport), nowFn = () => transport.now ? transport.now() : (runtime.now ? runtime.now() : Date.now());
  transport.send = async (targetName, payload, options = {}) => {
    const target = String(targetName || ''); const now = nowFn(); const until = finite(state.cmBackoff.get(target), 0);
    let observedActive = false; try { observedActive = Array.isArray(transport.activeNames()) && transport.activeNames().includes(target); } catch (_) {}
    if (!observedActive && until > now) { stats.cmQuotaSendsSuppressed += 1; return { delivered: false, transport: 'send_cm', target, reason: 'CM_STORAGE_QUOTA_BACKOFF', retryAfterMs: until - now }; }
    try {
      const result = await baseSend(targetName, payload, options);
      if (result && result.delivered) state.cmBackoff.delete(target);
      return result;
    } catch (error) {
      if (!isStorageQuotaMessage(error && error.message || error)) throw error;
      state.cmBackoff.set(target, now + CM_QUOTA_BACKOFF_MS); stats.cmQuotaBackoffs += 1;
      return { delivered: false, transport: 'send_cm', target, reason: 'CM_STORAGE_QUOTA_BACKOFF', retryAfterMs: CM_QUOTA_BACKOFF_MS };
    }
  };
  if (typeof transport.status === 'function') {
    const baseStatus = transport.status.bind(transport);
    transport.status = () => { const now = nowFn(); return { ...baseStatus(), alpha20_22CmQuotaBackoff: { backoffMs: CM_QUOTA_BACKOFF_MS, active: [...state.cmBackoff.entries()].filter(([, until]) => until > now).map(([name, until]) => ({ name, until, remainingMs: until - now })), directAuthorityWidened: false } }; };
  }
  transport.__alpha2022CmQuotaBackoffInstalled = true;
  return true;
}

class Alpha2022LiveSmokeRecovery {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime; this.now = runtime.now || (() => Date.now()); this.installedAt = this.now();
    this.stats = { localFarmTerrainReroutes: 0, localFarmBlockedWaypoints: 0, cloudD1QuotaBackoffs: 0, cloudNetworkBackoffs: 0, cloudCyclesSuppressed: 0, persistenceCyclesSuppressed: 0, cmQuotaBackoffs: 0, cmQuotaSendsSuppressed: 0 };
    this.state = { cloudBackoffUntil: 0, cloudBackoffReason: null, networkFailureStreak: 0, cmBackoff: new Map() };
    this.terrainInstalled = false; this.cloudBackoffInstalled = false; this.persistenceBackoffInstalled = false; this.cmBackoffInstalled = false;
    this._installLatePieces();
  }
  _installLatePieces() {
    if (!this.terrainInstalled) this.terrainInstalled = installLocalFarmTerrainGuard(this.runtime, this.stats);
    if (!this.cloudBackoffInstalled) this.cloudBackoffInstalled = installCloudBackoff(this.runtime, this.stats, this.state);
    if (!this.persistenceBackoffInstalled) this.persistenceBackoffInstalled = installPersistenceBackoff(this.runtime, this.stats, this.state);
    if (!this.cmBackoffInstalled) this.cmBackoffInstalled = installCmQuotaBackoff(this.runtime, this.stats, this.state);
  }
  beforeTick() { this._installLatePieces(); return true; }
  status() {
    const now = this.now();
    return { schemaVersion: 1, mode: ALPHA20_22_MODE, installedAt: this.installedAt, terrainInstalled: this.terrainInstalled, cloudBackoffInstalled: this.cloudBackoffInstalled, persistenceBackoffInstalled: this.persistenceBackoffInstalled, cmBackoffInstalled: this.cmBackoffInstalled, cloudBackoff: { active: this.state.cloudBackoffUntil > now, until: this.state.cloudBackoffUntil || null, reason: this.state.cloudBackoffReason }, cmBackoffs: [...this.state.cmBackoff.entries()].filter(([, until]) => until > now).map(([name, until]) => ({ name, until })), stats: { ...this.stats }, policies: { directCommandCharacterAuthorityWidened: false, dangerousContentFailClosed: true, movementCircuitPreserved: true, blockedTerrainMoveNeverIssued: true, cloudFailureBlocksCombat: false, storageQuotaNeverDeletesGameOwnedCmKeys: true } };
  }
}

function installAlpha2022LiveSmokeRecovery(runtime) { if (runtime.alpha2022LiveSmokeRecovery) return runtime.alpha2022LiveSmokeRecovery; return runtime.alpha2022LiveSmokeRecovery = new Alpha2022LiveSmokeRecovery(runtime); }

module.exports = { ALPHA20_22_MODE, CM_QUOTA_BACKOFF_MS, Alpha2022LiveSmokeRecovery, installAlpha2022LiveSmokeRecovery, installLocalFarmTerrainGuard, installCloudBackoff, installPersistenceBackoff, installCmQuotaBackoff, isD1QuotaMessage, isStorageQuotaMessage };
