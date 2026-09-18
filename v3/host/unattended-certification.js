'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const CERTIFICATION_SCHEMA_VERSION = 1;
const CERTIFICATION_TYPE = 'AIO_V3_UNATTENDED_CERTIFICATION_EVIDENCE';
const CERTIFICATION_MAX_CLOCK_SKEW_MS = 2 * 60 * 1000;
const CURRENT_RECONCILIATION_MAX_AGE_MS = 60 * 1000;
const GATE_ORDER = Object.freeze(['canary', '1h', '24h', '72h', '7d']);
const CERTIFICATION_GATES = Object.freeze({
  canary: Object.freeze({ name: 'canary', durationMs: 15 * 60 * 1000, pollMs: 15 * 1000, maxGapMs: 60 * 1000, prerequisite: null, requireRecoveryDrill: true, requireAlertCanary: true, requireRuntimeAudit: false }),
  '1h': Object.freeze({ name: '1h', durationMs: 60 * 60 * 1000, pollMs: 30 * 1000, maxGapMs: 90 * 1000, prerequisite: 'canary', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: false }),
  '24h': Object.freeze({ name: '24h', durationMs: 24 * 60 * 60 * 1000, pollMs: 30 * 1000, maxGapMs: 90 * 1000, prerequisite: '1h', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: true }),
  '72h': Object.freeze({ name: '72h', durationMs: 72 * 60 * 60 * 1000, pollMs: 30 * 1000, maxGapMs: 90 * 1000, prerequisite: '24h', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: true }),
  '7d': Object.freeze({ name: '7d', durationMs: 7 * 24 * 60 * 60 * 1000, pollMs: 30 * 1000, maxGapMs: 90 * 1000, prerequisite: '72h', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: true })
});

const SECRET_KEY_PATTERN = /(authorization|password|passwd|secret|token|cookie|api[_-]?key|session[_-]?key|private[_-]?key|credential)/i;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}
function sanitize(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 4096);
  if (typeof value !== 'object') return bounded(value, 512);
  if (depth >= 10) return '[max-depth]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 200).map((entry) => sanitize(entry, depth + 1, seen));
  const out = {};
  for (const [key, entry] of Object.entries(value).slice(0, 500)) {
    out[key] = SECRET_KEY_PATTERN.test(key) ? '[REDACTED]' : sanitize(entry, depth + 1, seen);
  }
  return out;
}
function stableRowForHash(row) {
  return JSON.stringify({
    schemaVersion: row.schemaVersion,
    type: row.type,
    seq: row.seq,
    kind: row.kind,
    at: row.at,
    payload: row.payload,
    prevHash: row.prevHash
  });
}
function hashRow(row) {
  return crypto.createHash('sha256').update(stableRowForHash(row), 'utf8').digest('hex');
}
function gateDefinition(name, overrides = null) {
  const base = CERTIFICATION_GATES[String(name || '')];
  if (!base) throw new Error('CERTIFICATION_GATE_INVALID');
  if (!overrides) return { ...base };
  return {
    ...base,
    ...overrides,
    name: base.name,
    prerequisite: Object.prototype.hasOwnProperty.call(overrides, 'prerequisite') ? overrides.prerequisite : base.prerequisite
  };
}
function previousGate(name) {
  const index = GATE_ORDER.indexOf(String(name || ''));
  return index > 0 ? GATE_ORDER[index - 1] : null;
}

class HashChainedCertificationEvidence {
  constructor(options = {}) {
    if (!options.filePath) throw new Error('CERTIFICATION_EVIDENCE_PATH_REQUIRED');
    this.filePath = path.resolve(String(options.filePath));
    this.now = options.now || (() => Date.now());
    this.maxBytes = Math.max(64 * 1024, Math.min(1024 * 1024 * 1024, finite(options.maxBytes, 256 * 1024 * 1024)));
    this.maxClockSkewMs = Math.max(0, Math.min(10 * 60 * 1000, finite(options.maxClockSkewMs, CERTIFICATION_MAX_CLOCK_SKEW_MS)));
  }

  _ensureDirectory() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  readVerified() {
    if (!fs.existsSync(this.filePath)) return [];
    const stat = fs.statSync(this.filePath);
    if (stat.size > this.maxBytes) throw new Error('CERTIFICATION_EVIDENCE_TOO_LARGE');
    const text = fs.readFileSync(this.filePath, 'utf8');
    if (!text.trim()) return [];
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = [];
    let prevHash = null;
    let prevAt = null;
    const now = this.now();
    for (let index = 0; index < lines.length; index += 1) {
      let row;
      try { row = JSON.parse(lines[index]); }
      catch (_) { throw new Error('CERTIFICATION_EVIDENCE_JSON_INVALID_AT_' + (index + 1)); }
      if (!row || row.schemaVersion !== CERTIFICATION_SCHEMA_VERSION || row.type !== CERTIFICATION_TYPE) throw new Error('CERTIFICATION_EVIDENCE_SCHEMA_INVALID_AT_' + (index + 1));
      if (row.seq !== index + 1) throw new Error('CERTIFICATION_EVIDENCE_SEQUENCE_INVALID_AT_' + (index + 1));
      const rowAt = finite(row.at, null);
      if (rowAt == null || rowAt < 0) throw new Error('CERTIFICATION_EVIDENCE_TIME_INVALID_AT_' + (index + 1));
      if (prevAt != null && rowAt < prevAt) throw new Error('CERTIFICATION_EVIDENCE_CLOCK_REGRESSION_AT_' + (index + 1));
      if (rowAt > now + this.maxClockSkewMs) throw new Error('CERTIFICATION_EVIDENCE_CLOCK_AHEAD_AT_' + (index + 1));
      if ((row.prevHash || null) !== prevHash) throw new Error('CERTIFICATION_EVIDENCE_CHAIN_INVALID_AT_' + (index + 1));
      if (row.hash !== hashRow(row)) throw new Error('CERTIFICATION_EVIDENCE_HASH_INVALID_AT_' + (index + 1));
      rows.push(row);
      prevHash = row.hash;
      prevAt = rowAt;
    }
    return rows;
  }

  append(kind, payload = {}, at = this.now()) {
    const rows = this.readVerified();
    const previous = rows.length ? rows[rows.length - 1] : null;
    const timestamp = finite(at, this.now());
    if (timestamp < 0) throw new Error('CERTIFICATION_EVIDENCE_TIME_INVALID');
    if (previous && timestamp < finite(previous.at, timestamp)) throw new Error('CERTIFICATION_EVIDENCE_CLOCK_REGRESSION');
    if (timestamp > this.now() + this.maxClockSkewMs) throw new Error('CERTIFICATION_EVIDENCE_CLOCK_AHEAD');
    const row = {
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      type: CERTIFICATION_TYPE,
      seq: rows.length + 1,
      kind: bounded(kind, 80),
      at: timestamp,
      payload: sanitize(payload),
      prevHash: previous ? previous.hash : null
    };
    row.hash = hashRow(row);
    this._ensureDirectory();
    const fd = fs.openSync(this.filePath, 'a', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(row) + '\n', null, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    try { fs.chmodSync(this.filePath, 0o600); } catch (_) {}
    return clone(row);
  }

  status() {
    try {
      const rows = this.readVerified();
      return {
        valid: true,
        rows: rows.length,
        terminalHash: rows.length ? rows[rows.length - 1].hash : null,
        lastKind: rows.length ? rows[rows.length - 1].kind : null,
        lastAt: rows.length ? rows[rows.length - 1].at : null
      };
    } catch (error) {
      return { valid: false, rows: null, terminalHash: null, error: bounded(error && error.message || error, 220) };
    }
  }
}

function transportConfigured(alertRelay, name) {
  return !!(alertRelay && Array.isArray(alertRelay.transports) && alertRelay.transports.some((row) =>
    row && row.name === name && row.required === true && Array.isArray(row.severities) && row.severities.includes('CRITICAL')));
}

function assessHostCertificationStatus(payload, observedNow = Date.now()) {
  const reasons = [];
  const hostApi = payload && payload.hostApi || {};
  const controller = payload && payload.controller || {};
  const launcher = payload && payload.launcher || {};
  const runtimeHost = payload && payload.runtimeHost || {};
  const watchdog = controller.watchdog || {};
  const beacon = watchdog.lastBeaconSummary || {};
  const reconciliation = controller.reconciliation || {};
  const alertRelay = controller.alertRelay || {};
  const browserSession = runtimeHost.browserSession || {};
  const botClient = runtimeHost.botClient || {};
  const currentReconciliation = reconciliation.current || {};

  if (!payload || payload.ok !== true) reasons.push('HOST_API_PAYLOAD_NOT_OK');
  if (hostApi.listening !== true || hostApi.loopbackOnly !== true || hostApi.authenticated !== true) reasons.push('HOST_API_NOT_SECURE_READY');
  if (!Array.isArray(hostApi.methods) || hostApi.methods.length !== 1 || hostApi.methods[0] !== 'GET') reasons.push('HOST_API_NOT_READONLY');
  if (hostApi.gameplayActionAuthority !== false || hostApi.rawGameplayActionAuthority !== false) reasons.push('HOST_API_AUTHORITY_INVALID');

  if (controller.gameplayActionAuthority !== false || controller.rawGameplayActionAuthority !== false || controller.dashboardDecisionAuthority !== false) reasons.push('CONTROLLER_AUTHORITY_INVALID');
  if (controller.lastHeartbeatError) reasons.push('HOST_HEARTBEAT_ERROR');
  if (controller.lastAlertError) reasons.push('HOST_ALERT_ERROR');

  if (launcher.running !== true) reasons.push('BROWSER_PROCESS_NOT_RUNNING');
  if (launcher.gameplayActionAuthority !== false || launcher.rawGameplayActionAuthority !== false) reasons.push('LAUNCHER_AUTHORITY_INVALID');
  if (launcher.inheritsProcessEnv !== false) reasons.push('BROWSER_SECRET_ISOLATION_INVALID');

  if (runtimeHost.running !== true) reasons.push('HOST_HARNESS_NOT_RUNNING');
  if (finite(runtimeHost.startedAt, null) == null) reasons.push('HOST_START_IDENTITY_MISSING');
  if (runtimeHost.gameplayActionAuthority !== false || runtimeHost.rawGameplayActionAuthority !== false) reasons.push('HOST_HARNESS_AUTHORITY_INVALID');
  if (runtimeHost.browserSessionManaged !== true || runtimeHost.narrowBrowserBridge !== true) reasons.push('BROWSER_SESSION_CONTRACT_INVALID');
  if (runtimeHost.lastTickError) reasons.push('HOST_TICK_ERROR');

  if (browserSession.connected !== true || browserSession.loopbackOnly !== true) reasons.push('CDP_SESSION_NOT_CONNECTED');
  if (browserSession.gameplayActionAuthority !== false || browserSession.rawGameplayActionAuthority !== false || browserSession.genericRemoteEvaluationExposed !== false) reasons.push('CDP_SESSION_AUTHORITY_INVALID');
  if (browserSession.startup && !['READY','STOPPED'].includes(String(browserSession.startup.state || ''))) reasons.push('CDP_STARTUP_NOT_READY');
  const expectedOperations = ['HOST_HEARTBEAT','PENDING_ALERTS','CLAIM_ALERTS','RECONCILIATION_STATUS'];
  if (botClient.mode !== 'narrow-browser-bot-client' || botClient.originAllowed !== true) reasons.push('NARROW_BROWSER_BRIDGE_NOT_READY');
  if (!Array.isArray(botClient.allowedOperations) || botClient.allowedOperations.length !== expectedOperations.length || expectedOperations.some((name) => !botClient.allowedOperations.includes(name))) reasons.push('NARROW_BROWSER_OPERATION_CONTRACT_INVALID');
  if (botClient.arbitraryEvaluateExposed !== false || botClient.genericInvokeExposed !== false || botClient.gameplayActionAuthority !== false || botClient.rawGameplayActionAuthority !== false) reasons.push('NARROW_BROWSER_AUTHORITY_INVALID');
  if (botClient.lastError) reasons.push('NARROW_BROWSER_BRIDGE_ERROR');

  if (watchdog.state !== 'HEALTHY' || watchdog.deadman && watchdog.deadman.dead === true) reasons.push('WATCHDOG_NOT_HEALTHY');
  if (watchdog.gameplayActionAuthority !== false || watchdog.rawGameplayActionAuthority !== false) reasons.push('WATCHDOG_AUTHORITY_INVALID');
  if (!beacon.runId || !Number.isFinite(Number(beacon.seq))) reasons.push('BEACON_IDENTITY_MISSING');
  if (!beacon.health || beacon.health.fourCharacterReady !== true) reasons.push('FOUR_CHARACTER_GROUP_NOT_READY');
  if (beacon.contract && beacon.contract.actionAuthority !== false) reasons.push('BEACON_ACTION_AUTHORITY_INVALID');
  if (!beacon.character || !beacon.character.name || !beacon.character.ctype) reasons.push('LOCAL_CHARACTER_EVIDENCE_MISSING');
  else if (beacon.character.rip === true) reasons.push('LOCAL_CHARACTER_DEAD');

  if (!['IDLE','OBSERVED_CLEAN'].includes(String(reconciliation.state || ''))) reasons.push('RECONCILIATION_NOT_CLEAN');
  if (reconciliation.gameplayActionAuthority !== false || reconciliation.rawGameplayActionAuthority !== false || reconciliation.reconciliationActionAuthority !== false) reasons.push('RECONCILIATION_AUTHORITY_INVALID');
  const currentReconciliationAt = finite(currentReconciliation.observedAt, null);
  const currentReconciliationAgeMs = currentReconciliationAt == null ? null : observedNow - currentReconciliationAt;
  if (currentReconciliationAt == null) reasons.push('CURRENT_RECONCILIATION_EVIDENCE_MISSING');
  else if (currentReconciliationAgeMs < -CERTIFICATION_MAX_CLOCK_SKEW_MS) reasons.push('CURRENT_RECONCILIATION_CLOCK_AHEAD');
  else if (currentReconciliationAgeMs > CURRENT_RECONCILIATION_MAX_AGE_MS) reasons.push('CURRENT_RECONCILIATION_STALE');
  if (currentReconciliation.observedClean !== true || (Array.isArray(currentReconciliation.blockers) && currentReconciliation.blockers.length > 0)) reasons.push('CURRENT_RECONCILIATION_NOT_CLEAN');
  if (currentReconciliation.lastError) reasons.push('CURRENT_RECONCILIATION_READ_ERROR');

  if (alertRelay.durableReady !== true) reasons.push('ALERT_SPOOL_NOT_DURABLE');
  if (finite(alertRelay.pendingCritical, 0) !== 0) reasons.push('CRITICAL_ALERT_PENDING');
  if (alertRelay.gameplayActionAuthority !== false || alertRelay.rawGameplayActionAuthority !== false || alertRelay.operatorAckAuthority !== false) reasons.push('ALERT_RELAY_AUTHORITY_INVALID');
  if (!transportConfigured(alertRelay, 'critical-primary') || !transportConfigured(alertRelay, 'critical-fallback')) reasons.push('DUAL_CRITICAL_ROUTES_NOT_CONFIGURED');

  const facts = {
    runId: beacon.runId || null,
    beaconSeq: finite(beacon.seq),
    fourCharacterReady: !!(beacon.health && beacon.health.fourCharacterReady === true),
    watchdogState: watchdog.state || null,
    restartSuccesses: Math.max(0, Math.floor(finite(watchdog.stats && watchdog.stats.restartSuccesses, 0))),
    restartAttempts: Math.max(0, Math.floor(finite(watchdog.stats && watchdog.stats.restartAttempts, 0))),
    restartBudgetUsed: Math.max(0, Math.floor(finite(watchdog.restartBudget && watchdog.restartBudget.used, 0))),
    restartBudgetMax: Math.max(0, Math.floor(finite(watchdog.restartBudget && watchdog.restartBudget.max, 0))),
    reconciliationState: reconciliation.state || null,
    reconciliationCleanCount: Math.max(0, Math.floor(finite(reconciliation.stats && reconciliation.stats.clean, 0))),
    reconciliationFreshRuns: Math.max(0, Math.floor(finite(reconciliation.stats && reconciliation.stats.freshRuns, 0))),
    pendingCritical: Math.max(0, Math.floor(finite(alertRelay.pendingCritical, 0))),
    browserGeneration: Math.max(0, Math.floor(finite(browserSession.generation, 0))),
    hostTicks: Math.max(0, Math.floor(finite(controller.stats && controller.stats.ticks, 0))),
    currentReconciliationAt,
    currentReconciliationAgeMs,
    currentReconciliationClean: currentReconciliation.observedClean === true,
    currentReconciliationBlockers: Array.isArray(currentReconciliation.blockers) ? currentReconciliation.blockers.slice(0, 32) : [],
    hostStartedAt: finite(runtimeHost.startedAt, null),
    hostApiStartedAt: finite(hostApi.startedAt, null),
    browserPid: finite(launcher.pid, null),
    hostStartIdentity: [finite(runtimeHost.startedAt, null), finite(hostApi.startedAt, null)].filter((value) => value != null).join(':') || null,
    dataComplete: true
  };
  return { ok: reasons.length === 0, reasons, facts };
}

function markerPassed(rows, type) {
  return rows.some((row) => row.kind === 'MARKER' && row.payload && row.payload.type === type && row.payload.ok === true);
}
function markerRow(rows, type) {
  const matches = rows.filter((row) => row.kind === 'MARKER' && row.payload && row.payload.type === type && row.payload.ok === true);
  return matches.length ? matches[matches.length - 1] : null;
}
function controlledRecoveryMarkerEvidence(rows) {
  const row = markerRow(rows, 'controlled_recovery_canary');
  if (!row) return { passed: false, reason: 'CONTROLLED_RECOVERY_CANARY_MISSING' };
  const data = row.payload && row.payload.data || {};
  const previousRunId = data.previousRunId == null ? null : String(data.previousRunId);
  const currentRunId = data.currentRunId == null ? null : String(data.currentRunId);
  const restartBefore = finite(data.restartSuccessesBefore, null);
  const restartAfter = finite(data.restartSuccessesAfter, null);
  const cleanBefore = finite(data.reconciliationCleanBefore, null);
  const cleanAfter = finite(data.reconciliationCleanAfter, null);
  if (!previousRunId || !currentRunId || previousRunId === currentRunId) return { passed: false, reason: 'CONTROLLED_RECOVERY_RUN_ID_NOT_FRESH' };
  if (restartBefore == null || restartAfter == null || restartAfter <= restartBefore) return { passed: false, reason: 'CONTROLLED_RECOVERY_RESTART_NOT_OBSERVED' };
  if (cleanBefore == null || cleanAfter == null || cleanAfter <= cleanBefore || data.reconciliationState !== 'OBSERVED_CLEAN') {
    return { passed: false, reason: 'CONTROLLED_RECOVERY_RECONCILIATION_NOT_CLEAN' };
  }
  return { passed: true, at: row.at, previousRunId, currentRunId, restartSuccessesBefore: restartBefore, restartSuccessesAfter: restartAfter, reconciliationCleanBefore: cleanBefore, reconciliationCleanAfter: cleanAfter };
}

function findStart(rows, gateName) {
  return rows.find((row) => row.kind === 'START' && row.payload && row.payload.gate === gateName) || null;
}

function samplesAfter(rows, start) {
  if (!start) return [];
  return rows.filter((row) => row.seq > start.seq && row.kind === 'SAMPLE' && row.payload && row.payload.assessment);
}

function timeIntegrity(rows, now, maxClockSkewMs = CERTIFICATION_MAX_CLOCK_SKEW_MS) {
  const reasons = [];
  let previousAt = null;
  for (const row of rows) {
    const at = finite(row && row.at, null);
    const seq = row && row.seq == null ? '?' : row.seq;
    if (at == null || at < 0) {
      reasons.push('EVIDENCE_TIME_INVALID_AT_' + seq);
      continue;
    }
    if (previousAt != null && at < previousAt) reasons.push('CLOCK_REGRESSION_AT_' + seq);
    if (at > now + maxClockSkewMs) reasons.push('FUTURE_TIMESTAMP_AT_' + seq);
    previousAt = at;
  }
  return Array.from(new Set(reasons));
}

function runtimeAuditEvidence(rows) {
  const row = markerRow(rows, 'runtime_action_audit_clean');
  if (!row) return { passed: false, reason: 'RUNTIME_ACTION_AUDIT_MISSING' };
  const data = row.payload && row.payload.data || {};
  const sha256 = String(data.sha256 || '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256) || data.reviewed !== true || data.result !== 'CLEAN') {
    return { passed: false, reason: 'RUNTIME_ACTION_AUDIT_INVALID' };
  }
  const unexpected = finite(data.unexpectedRawGameplayActions, null);
  if (unexpected == null || unexpected < 0 || Math.floor(unexpected) !== unexpected) return { passed: false, reason: 'RUNTIME_ACTION_AUDIT_INVALID' };
  if (unexpected > 0) return { passed: false, reason: 'UNEXPECTED_RAW_GAMEPLAY_ACTIONS_OBSERVED', unexpectedRawGameplayActions: unexpected };
  return { passed: true, at: row.at, sha256, sourceName: bounded(data.sourceName, 160), unexpectedRawGameplayActions: 0 };
}

function recoveryDrillEvidence(samples) {
  if (samples.length < 2) return { passed: false, reason: 'RECOVERY_DRILL_SAMPLES_REQUIRED' };
  const first = samples[0].payload.assessment.facts || {};
  const firstRunId = first.runId || null;
  const restartBase = finite(first.restartSuccesses, 0);
  const cleanBase = finite(first.reconciliationCleanCount, 0);
  const freshBase = finite(first.reconciliationFreshRuns, 0);
  for (const row of samples.slice(1)) {
    const facts = row.payload.assessment.facts || {};
    if (
      finite(facts.restartSuccesses, 0) > restartBase &&
      finite(facts.reconciliationCleanCount, 0) > cleanBase &&
      finite(facts.reconciliationFreshRuns, 0) > freshBase &&
      facts.reconciliationState === 'OBSERVED_CLEAN' &&
      firstRunId && facts.runId && facts.runId !== firstRunId
    ) {
      return { passed: true, at: row.at, previousRunId: firstRunId, currentRunId: facts.runId };
    }
  }
  return { passed: false, reason: 'CONTROLLED_RESTART_AND_FRESH_RECONCILIATION_NOT_OBSERVED' };
}

function evaluateCertification(rows, gateInput, now = Date.now()) {
  const gate = typeof gateInput === 'string' ? gateDefinition(gateInput) : { ...gateInput };
  const start = findStart(rows, gate.name);
  const reasons = [];
  if (!start) return { passed: false, complete: false, status: 'FAIL', gate: gate.name, reasons: ['CERTIFICATION_START_MISSING'], blockers: ['CERTIFICATION_START_MISSING'], gameplayActionAuthority: false, rawGameplayActionAuthority: false, restartAuthority: false, operatorAckAuthority: false };

  const integrityReasons = timeIntegrity(rows, now);
  reasons.push(...integrityReasons);

  const samples = samplesAfter(rows, start);
  if (!samples.length) reasons.push('CERTIFICATION_SAMPLES_MISSING');
  const badSample = samples.find((row) => row.payload.assessment.ok !== true);
  if (badSample) reasons.push('UNHEALTHY_SAMPLE_AT_' + badSample.seq);

  const firstSample = samples[0] || null;
  const lastSample = samples[samples.length - 1] || null;
  if (firstSample && firstSample.at - start.at > gate.maxGapMs) reasons.push('INITIAL_SAMPLE_GAP_EXCEEDED');
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i].at - samples[i - 1].at > gate.maxGapMs) {
      reasons.push('SAMPLE_GAP_EXCEEDED_AT_' + samples[i].seq);
      break;
    }
  }

  const elapsedMs = lastSample ? Math.max(0, lastSample.at - start.at) : 0;
  const durationSatisfied = elapsedMs >= gate.durationMs;
  if (!durationSatisfied) reasons.push('DURATION_NOT_SATISFIED');

  if (gate.prerequisite && !markerPassed(rows, 'prerequisite:' + gate.prerequisite)) reasons.push('PREREQUISITE_GATE_NOT_VERIFIED');
  if (gate.requireAlertCanary && !markerPassed(rows, 'dual_route_alert_canary')) reasons.push('DUAL_ROUTE_ALERT_CANARY_MISSING');
  const runtimeAudit = gate.requireRuntimeAudit ? runtimeAuditEvidence(rows) : { passed: true };
  if (!runtimeAudit.passed) reasons.push(runtimeAudit.reason);

  let recovery = { passed: true };
  if (gate.requireRecoveryDrill) {
    recovery = controlledRecoveryMarkerEvidence(rows);
    if (!recovery.passed) recovery = recoveryDrillEvidence(samples);
    if (!recovery.passed) reasons.push(recovery.reason);
  }

  const lastAt = lastSample ? lastSample.at : start.at;
  const staleNow = now - lastAt > gate.maxGapMs;
  if (durationSatisfied && staleNow) reasons.push('FINAL_SAMPLE_STALE');

  const sampleDataComplete = samples.length > 0 && samples.every((row) => row.payload && row.payload.assessment && row.payload.assessment.facts && row.payload.assessment.facts.dataComplete === true);
  if (samples.length && !sampleDataComplete) reasons.push('CERTIFICATION_DATA_INCOMPLETE');

  const uniqueReasons = Array.from(new Set(reasons));
  const hardFailure = uniqueReasons.some((reason) =>
    /^UNHEALTHY_SAMPLE_AT_|^INITIAL_SAMPLE_GAP_EXCEEDED|^SAMPLE_GAP_EXCEEDED|^CLOCK_REGRESSION_AT_|^FUTURE_TIMESTAMP_AT_|^EVIDENCE_TIME_INVALID_AT_|^UNEXPECTED_RAW_GAMEPLAY_ACTIONS_OBSERVED|^CERTIFICATION_DATA_INCOMPLETE/.test(reason)
  );
  const lastEvidenceAt = lastSample ? lastSample.at : start.at;
  const lastFacts = lastSample && lastSample.payload && lastSample.payload.assessment && lastSample.payload.assessment.facts || {};
  const dataComplete = sampleDataComplete;
  return {
    schemaVersion: CERTIFICATION_SCHEMA_VERSION,
    type: 'AIO_V3_UNATTENDED_CERTIFICATION_RESULT',
    gate: gate.name,
    certificationId: start.payload && start.payload.certificationId || null,
    prerequisite: gate.prerequisite,
    startedAt: start.at,
    evaluatedAt: now,
    lastEvidenceAt,
    elapsedMs,
    durationMs: gate.durationMs,
    remainingMs: Math.max(0, gate.durationMs - elapsedMs),
    sampleCount: samples.length,
    maxGapMs: gate.maxGapMs,
    recovery,
    markers: {
      prerequisite: gate.prerequisite ? markerPassed(rows, 'prerequisite:' + gate.prerequisite) : true,
      dualRouteAlertCanary: markerPassed(rows, 'dual_route_alert_canary'),
      runtimeActionAuditClean: runtimeAudit.passed === true
    },
    runtimeActionAudit: runtimeAudit,
    hostStartIdentity: lastFacts.hostStartIdentity || null,
    dataComplete,
    passed: uniqueReasons.length === 0,
    complete: durationSatisfied,
    status: uniqueReasons.length === 0 ? 'PASS' : (hardFailure ? 'FAIL' : 'PENDING'),
    blockers: uniqueReasons,
    reasons: uniqueReasons,
    gameplayActionAuthority: false,
    rawGameplayActionAuthority: false,
    restartAuthority: false,
    operatorAckAuthority: false
  };
}

function verifyPassedEvidence(filePath, expectedGate) {
  const store = new HashChainedCertificationEvidence({ filePath });
  const rows = store.readVerified();
  const finals = rows.filter((row) => row.kind === 'FINAL' && row.payload && row.payload.result);
  const final = finals.length ? finals[finals.length - 1].payload.result : null;
  if (!final || final.passed !== true || final.gate !== expectedGate) throw new Error('CERTIFICATION_PREREQUISITE_NOT_PASSED:' + expectedGate);
  return { gate: expectedGate, terminalHash: store.status().terminalHash, evaluatedAt: final.evaluatedAt };
}

module.exports = {
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFICATION_TYPE,
  CERTIFICATION_MAX_CLOCK_SKEW_MS,
  CURRENT_RECONCILIATION_MAX_AGE_MS,
  GATE_ORDER,
  CERTIFICATION_GATES,
  HashChainedCertificationEvidence,
  assessHostCertificationStatus,
  evaluateCertification,
  recoveryDrillEvidence,
  controlledRecoveryMarkerEvidence,
  runtimeAuditEvidence,
  timeIntegrity,
  verifyPassedEvidence,
  gateDefinition,
  previousGate,
  sanitize
};
