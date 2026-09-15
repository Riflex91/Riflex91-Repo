'use strict';

const ASSESSMENT_SCHEMA_VERSION = 1;
const MAX_REASONS = 16;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nonNegativeInt(value, fallback = 0) {
  return Math.max(0, Math.floor(finite(value, fallback)));
}

function bounded(value, max = 128) {
  const text = String(value == null ? '' : value).slice(0, max);
  return text || null;
}

function upper(value) {
  return String(value == null ? '' : value).trim().toUpperCase();
}

function assessDebugHealth(snapshot = {}, events = [], host = {}) {
  const status = snapshot && typeof snapshot.status === 'object' ? snapshot.status : {};
  const operations = status && typeof status.operations === 'object' ? status.operations : {};
  const statusHealth = operations && typeof operations.health === 'object'
    ? operations.health
    : status && typeof status.health === 'object' ? status.health : {};
  const heartbeat = snapshot && typeof snapshot.heartbeat === 'object' ? snapshot.heartbeat : {};
  const beaconHealth = heartbeat && typeof heartbeat.health === 'object' ? heartbeat.health : {};
  const beaconRecovery = heartbeat && typeof heartbeat.recovery === 'object' ? heartbeat.recovery : {};
  const beaconAlerts = heartbeat && typeof heartbeat.alerts === 'object' ? heartbeat.alerts : {};
  const watchdog = statusHealth && typeof statusHealth.watchdog === 'object' ? statusHealth.watchdog : {};
  const group = statusHealth && typeof statusHealth.groupLiveness === 'object' ? statusHealth.groupLiveness : {};
  const recovery = statusHealth && typeof statusHealth.recovery === 'object' ? statusHealth.recovery : {};
  const alerting = statusHealth && typeof statusHealth.alerting === 'object' ? statusHealth.alerting : {};

  const runtimeHealthState = upper(statusHealth.state || beaconHealth.state) || null;
  const watchdogState = upper(watchdog.state || beaconHealth.watchdogState) || null;
  const watchdogReason = bounded(watchdog.reason || beaconHealth.watchdogReason);
  const groupState = upper(group.state || beaconHealth.groupState) || null;
  const recoveryStage = upper(
    beaconRecovery.stage ||
    recovery.stage ||
    recovery.lastPlan && recovery.lastPlan.stage
  ) || null;
  const pendingAlerts = nonNegativeInt(
    beaconAlerts.pending == null ? alerting.pending : beaconAlerts.pending,
    0
  );
  const pendingCriticalAlerts = nonNegativeInt(
    beaconAlerts.pendingCritical == null ? alerting.pendingCritical : beaconAlerts.pendingCritical,
    0
  );

  const rows = Array.isArray(events) ? events.slice(0, 200) : [];
  let recentErrorEvents = 0;
  let recentWarningEvents = 0;
  for (const row of rows) {
    const severity = String(row && row.severity || '').toLowerCase();
    if (severity === 'error' || severity === 'fatal') recentErrorEvents += 1;
    else if (severity === 'warn' || severity === 'warning') recentWarningEvents += 1;
  }

  let severity = 0;
  const reasons = [];
  const add = (code, level) => {
    severity = Math.max(severity, level);
    if (reasons.length < MAX_REASONS && !reasons.includes(code)) reasons.push(code);
  };

  const processRunningKnown = Object.prototype.hasOwnProperty.call(host || {}, 'processRunning');
  if (processRunningKnown && host.processRunning !== true) add('HOST_PROCESS_NOT_RUNNING', 2);
  if (runtimeHealthState === 'DEGRADED' || runtimeHealthState === 'CRITICAL') add('RUNTIME_HEALTH_DEGRADED', 2);
  else if (runtimeHealthState === 'WATCH') add('RUNTIME_HEALTH_WATCH', 1);
  if (watchdogState === 'DEGRADED' || watchdogState === 'CRITICAL') add('WATCHDOG_DEGRADED', 2);
  else if (watchdogState === 'WATCH') add('WATCHDOG_WATCH', 1);
  if (groupState === 'DEGRADED' || groupState === 'CRITICAL') add('GROUP_LIVENESS_DEGRADED', 2);
  else if (groupState === 'WATCH') add('GROUP_LIVENESS_WATCH', 1);
  if (recoveryStage === 'HOST_RESTART') add('RECOVERY_HOST_RESTART_REQUIRED', 2);
  if (pendingCriticalAlerts > 0) add('CRITICAL_ALERT_PENDING', 2);
  if (recentErrorEvents > 0) add('RECENT_ERROR_EVENT', 2);
  if (recentWarningEvents > 0) add('RECENT_WARNING_EVENT', 1);

  return {
    schemaVersion: ASSESSMENT_SCHEMA_VERSION,
    type: 'AIO_V3_DEBUG_HEALTH_ASSESSMENT',
    state: severity >= 2 ? 'CRITICAL' : severity === 1 ? 'DEGRADED' : 'HEALTHY',
    reasons,
    evidence: {
      processRunning: processRunningKnown ? host.processRunning === true : null,
      restartCount: nonNegativeInt(host && host.restartCount, 0),
      runtimeHealthState,
      watchdogState,
      watchdogReason,
      groupState,
      recoveryStage,
      pendingAlerts,
      pendingCriticalAlerts,
      recentErrorEvents,
      recentWarningEvents,
      eventCount: rows.length
    },
    classificationOnly: true,
    actionAuthority: false,
    gameplayActionAuthority: false,
    codeRepairAuthority: false
  };
}

module.exports = {
  ASSESSMENT_SCHEMA_VERSION,
  assessDebugHealth
};
