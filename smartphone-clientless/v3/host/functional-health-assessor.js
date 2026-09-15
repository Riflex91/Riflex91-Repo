'use strict';

const FUNCTIONAL_HEALTH_SCHEMA_VERSION = 1;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function upper(value) { return String(value == null ? '' : value).trim().toUpperCase(); }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function firstObject(...values) { for (const value of values) { if (value && typeof value === 'object' && !Array.isArray(value)) return value; } return {}; }
function clampText(value, max = 96) { const text = String(value == null ? '' : value).slice(0, max); return text || null; }

function latestPerformance(status) {
  const perf = firstObject(status.performance, status.telemetry && status.telemetry.performance);
  const current = object(perf.current);
  const recent = Array.isArray(perf.recent) ? perf.recent : [];
  return Object.keys(current).length ? current : object(recent[recent.length - 1]);
}

function assessFunctionalHealth(snapshot = {}, events = [], options = {}) {
  const status = object(snapshot.status);
  const runtime = firstObject(status.runtime, status);
  const farmer = firstObject(status.farmer, runtime.farmer);
  const merchant = firstObject(status.merchantService, status.merchant, runtime.merchantService, runtime.merchant);
  const perf = latestPerformance(status);
  const rows = Array.isArray(events) ? events.slice(0, 200) : [];
  const now = finite(options.now, Date.now());
  const farmerWatchMs = Math.max(30000, finite(options.farmerWatchMs, 90000));
  const farmerCriticalMs = Math.max(farmerWatchMs, finite(options.farmerCriticalMs, 180000));
  const merchantWatchMs = Math.max(60000, finite(options.merchantWatchMs, 180000));
  const merchantCriticalMs = Math.max(merchantWatchMs, finite(options.merchantCriticalMs, 600000));

  const farmerEnabled = farmer.enabled === true;
  const farmerState = upper(farmer.state) || null;
  const farmerActivityExpected = farmerEnabled && !['IDLE', 'WAITING', 'DISABLED', 'STOPPED'].includes(farmerState || '');
  const perfSeconds = Math.max(0, finite(perf.seconds, 0));
  const kills = Math.max(0, finite(perf.kills, 0));
  const monsterHpLost = Math.max(0, finite(perf.monsterHpLost, 0));
  const xp = Math.max(0, finite(perf.xp, 0));
  const combatProgress = kills > 0 || monsterHpLost > 0 || xp > 0;

  const merchantEnabled = merchant.enabled === true;
  const merchantState = upper(merchant.state || merchant.operation && merchant.operation.state) || null;
  const merchantPending = Math.max(0, finite(merchant.pending, finite(merchant.queueDepth, finite(merchant.queued, 0))));
  const merchantLastActionAt = finite(merchant.lastActionAt, finite(merchant.lastSuccessAt, finite(merchant.lastCompletedAt, null)));
  const merchantAgeMs = merchantLastActionAt == null ? null : Math.max(0, now - merchantLastActionAt);
  const merchantWorkExpected = merchantEnabled && (merchantPending > 0 || ['EXECUTING', 'PLANNING', 'SERVICE', 'WORKING', 'ACTIVE'].includes(merchantState || ''));

  let severity = 0;
  const reasons = [];
  const add = (code, level) => { severity = Math.max(severity, level); if (!reasons.includes(code)) reasons.push(code); };

  if (farmerActivityExpected && !combatProgress && perfSeconds >= farmerCriticalMs / 1000) add('FARMER_NO_COMBAT_PROGRESS', 2);
  else if (farmerActivityExpected && !combatProgress && perfSeconds >= farmerWatchMs / 1000) add('FARMER_COMBAT_PROGRESS_WATCH', 1);

  if (merchantWorkExpected && merchantAgeMs != null && merchantAgeMs >= merchantCriticalMs) add('MERCHANT_NO_SERVICE_PROGRESS', 2);
  else if (merchantWorkExpected && merchantAgeMs != null && merchantAgeMs >= merchantWatchMs) add('MERCHANT_SERVICE_PROGRESS_WATCH', 1);

  for (const row of rows) {
    const event = upper(row && row.event);
    const reason = upper(row && row.reason);
    if (/FARMER|COMBAT/.test(event) && /NO_PROGRESS|STALLED|DEADLOCK/.test(reason)) add('FARMER_PROGRESS_EVENT', 2);
    if (/MERCHANT/.test(event) && /NO_PROGRESS|STALLED|DEADLOCK/.test(reason)) add('MERCHANT_PROGRESS_EVENT', 2);
  }

  return {
    schemaVersion: FUNCTIONAL_HEALTH_SCHEMA_VERSION,
    type: 'AIO_V3_FUNCTIONAL_HEALTH_ASSESSMENT',
    state: severity >= 2 ? 'CRITICAL' : severity === 1 ? 'DEGRADED' : 'HEALTHY',
    reasons: reasons.slice(0, 16),
    subsystems: {
      combat: { state: reasons.some(r => r.startsWith('FARMER_')) ? (severity >= 2 ? 'CRITICAL' : 'DEGRADED') : 'HEALTHY', farmerEnabled, farmerState, activityExpected: farmerActivityExpected, progress: combatProgress, windowSeconds: perfSeconds, kills, monsterHpLost, xp },
      merchant: { state: reasons.some(r => r.startsWith('MERCHANT_')) ? (severity >= 2 ? 'CRITICAL' : 'DEGRADED') : 'HEALTHY', merchantEnabled, merchantState, workExpected: merchantWorkExpected, pending: merchantPending, lastActionAt: merchantLastActionAt, progressAgeMs: merchantAgeMs }
    },
    classificationOnly: true,
    actionAuthority: false,
    gameplayActionAuthority: false,
    codeRepairAuthority: false
  };
}

module.exports = { FUNCTIONAL_HEALTH_SCHEMA_VERSION, assessFunctionalHealth };
