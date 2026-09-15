'use strict';

const { assessDebugHealth } = require('./debug-health-assessor');
const { assessFunctionalHealth } = require('./functional-health-assessor');

const DEFAULT_EVENT_LIMIT = 200;
const DEFAULT_TIMEOUT_MS = 5000;
const MIN_PRODUCTION_INTERVAL_MS = 60 * 1000;
const DEFAULT_MIN_INTERVAL_MS = 2 * 60 * 1000;
const MAX_TELEMETRY_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_MAX_BACKOFF_MS = 30 * 60 * 1000;
const FAST_LANE_COOLDOWN_MS = 30 * 1000;
const FAST_LANE_DEDUPE_MS = 10 * 60 * 1000;
const MAX_FAST_LANE_FINGERPRINTS = 512;
const MAX_SUPPORTED_EXPORTERS = 4;
const MONTHLY_BUDGET_DAYS = 31;
const EDGE_MONTHLY_INVOCATION_BUDGET = 500000;
const HARD_SEVERITIES = new Set(['ERROR', 'CRITICAL', 'FATAL', 'EMERGENCY', 'ALERT']);
const WARNING_SEVERITIES = new Set(['WARN', 'WARNING']);
const IMPORTANT_PATTERN = /(FAIL(?:ED|URE)?|ERROR|QUARANTIN|SAFE_MODE|RESTART_REQUIRED|CIRCUIT_OPEN|UNAVAILABLE|NOT_LIVE|\bDEAD\b|NO_PROGRESS|DRIFT_DETECTED|TIMEOUT|EXHAUSTED|DEGRADED|REJECTED|DISCONNECTED|OUTAGE)/i;

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clone(value) { if (value == null) return value; return JSON.parse(JSON.stringify(value)); }
function normalizeEndpoint(value, allowInsecureLoopbackForTests = false) {
  if (!value) return null;
  let parsed; try { parsed = new URL(String(value)); } catch (_) { throw new Error('DEBUG_TELEMETRY_ENDPOINT_INVALID'); }
  const loopback = parsed.hostname === '127.0.0.1' || parsed.hostname === '::1' || parsed.hostname === 'localhost';
  if (parsed.protocol !== 'https:' && !(allowInsecureLoopbackForTests === true && parsed.protocol === 'http:' && loopback)) throw new Error('DEBUG_TELEMETRY_HTTPS_REQUIRED');
  return parsed.toString();
}
function projectedMonthlyInvocations(intervalMs, exporters = MAX_SUPPORTED_EXPORTERS) {
  const interval = Math.max(1, finite(intervalMs, DEFAULT_MIN_INTERVAL_MS));
  const count = Math.max(1, Math.floor(finite(exporters, MAX_SUPPORTED_EXPORTERS)));
  return Math.ceil((MONTHLY_BUDGET_DAYS * 24 * 60 * 60 * 1000 / interval) * count);
}
function signalText(value, max = 400) {
  const text = String(value == null ? '' : value).trim();
  return text.length <= max ? text : text.slice(0, max);
}
function criticalSignal(event) {
  if (!event || typeof event !== 'object') return null;
  const eventType = signalText(event.event || event.type, 200);
  const severity = signalText(event.severity, 40).toUpperCase();
  const reason = signalText(event.reason || event.data && event.data.reason, 300);
  const component = signalText(event.component || event.data && event.data.component, 160);
  const character = signalText(event.character || event.data && event.data.character, 160);
  const importantWarning = WARNING_SEVERITIES.has(severity) && IMPORTANT_PATTERN.test(`${eventType} ${reason}`);
  if (!HARD_SEVERITIES.has(severity) && !importantWarning) return null;
  return {
    eventType: eventType || 'UNKNOWN_ALERT',
    severity,
    reason,
    fingerprint: `${component || 'unknown'}|${eventType || 'UNKNOWN_ALERT'}|${severity || 'UNKNOWN'}|${reason || 'none'}|${character || 'none'}`
  };
}

class DebugTelemetryExporter {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now()); this.fetch = options.fetch || globalThis.fetch;
    this.endpoint = normalizeEndpoint(options.endpoint || options.url, options.allowInsecureLoopbackForTests === true);
    this.token = options.token ? String(options.token) : null; this.botId = String(options.botId || 'adventure-land-v3').slice(0, 128);
    this.eventLimit = Math.max(1, Math.min(200, Math.floor(finite(options.eventLimit, DEFAULT_EVENT_LIMIT))));
    this.timeoutMs = Math.max(500, Math.min(30000, Math.floor(finite(options.timeoutMs, DEFAULT_TIMEOUT_MS))));
    this.minIntervalMs = Math.max(MIN_PRODUCTION_INTERVAL_MS, Math.min(MAX_TELEMETRY_INTERVAL_MS, Math.floor(finite(options.minIntervalMs, DEFAULT_MIN_INTERVAL_MS))));
    this.maxBackoffMs = Math.max(this.minIntervalMs, Math.min(60 * 60 * 1000, Math.floor(finite(options.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS))));
    this.fastLaneCooldownMs = Math.max(FAST_LANE_COOLDOWN_MS, Math.floor(finite(options.fastLaneCooldownMs, FAST_LANE_COOLDOWN_MS)));
    this.fastLaneDedupeMs = Math.max(this.fastLaneCooldownMs, Math.floor(finite(options.fastLaneDedupeMs, FAST_LANE_DEDUPE_MS)));
    this.lastEventSeq = Math.max(0, Math.floor(finite(options.lastEventSeq, 0))); this.nextAttemptAt = 0; this.failuresInRow = 0;
    this.lastAttemptAt = null; this.lastSuccessAt = null; this.lastFastLaneAt = null; this.lastError = null; this.lastPayload = null;
    this.fastLaneFingerprints = new Map();
    this.stats = { attempts: 0, successes: 0, failures: 0, skippedDisabled: 0, skippedBackoff: 0, eventsSent: 0, fastLaneAttempts: 0, fastLaneSuccesses: 0, fastLaneFailures: 0, fastLaneCooldownBlocks: 0, fastLaneDedupeBlocks: 0 };
  }
  enabled() { return !!(this.endpoint && this.token && typeof this.fetch === 'function'); }
  _backoffMs() { if (this.failuresInRow <= 0) return this.minIntervalMs; return Math.min(this.maxBackoffMs, this.minIntervalMs * Math.pow(2, Math.min(8, this.failuresInRow - 1))); }
  _pruneFastLaneFingerprints(now) {
    for (const [fingerprint, sentAt] of this.fastLaneFingerprints) if (now - sentAt >= this.fastLaneDedupeMs) this.fastLaneFingerprints.delete(fingerprint);
    if (this.fastLaneFingerprints.size <= MAX_FAST_LANE_FINGERPRINTS) return;
    const oldest = [...this.fastLaneFingerprints.entries()].sort((a, b) => a[1] - b[1]).slice(0, this.fastLaneFingerprints.size - MAX_FAST_LANE_FINGERPRINTS);
    for (const [fingerprint] of oldest) this.fastLaneFingerprints.delete(fingerprint);
  }
  _criticalSignals(events) {
    const rows = [];
    const seen = new Set();
    for (const event of events || []) {
      const signal = criticalSignal(event);
      if (!signal || seen.has(signal.fingerprint)) continue;
      seen.add(signal.fingerprint); rows.push(signal);
    }
    return rows;
  }
  _fastLaneDecision(events, now) {
    const signals = this._criticalSignals(events);
    if (!signals.length) return { eligible: false, reason: 'NO_CRITICAL_SIGNAL', signals: [] };
    this._pruneFastLaneFingerprints(now);
    const fresh = signals.filter((signal) => {
      const sentAt = this.fastLaneFingerprints.get(signal.fingerprint);
      return sentAt == null || now - sentAt >= this.fastLaneDedupeMs;
    });
    if (!fresh.length) return { eligible: false, reason: 'FAST_LANE_DEDUPED', signals };
    if (this.lastAttemptAt != null && now - this.lastAttemptAt < this.fastLaneCooldownMs) return { eligible: false, reason: 'FAST_LANE_COOLDOWN', signals: fresh };
    return { eligible: true, reason: 'CRITICAL_SIGNAL', signals: fresh };
  }
  _rememberCriticalSignals(events, now) {
    for (const signal of this._criticalSignals(events)) this.fastLaneFingerprints.set(signal.fingerprint, now);
    this._pruneFastLaneFingerprints(now);
  }
  async _post(payload) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null; let timer = null;
    if (controller) timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(this.endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}`, 'x-aio-v3-bot-id': this.botId }, body: JSON.stringify(payload), signal: controller ? controller.signal : undefined });
      if (!response || response.ok !== true) { const status = response && Number(response.status) || 0; throw new Error(`DEBUG_TELEMETRY_HTTP_${status || 'FAILED'}`); }
      return true;
    } finally { if (timer) clearTimeout(timer); }
  }
  async tick(botClient, host = {}) {
    const now = this.now();
    if (!this.enabled()) { this.stats.skippedDisabled += 1; return { sent: false, reason: 'DEBUG_TELEMETRY_DISABLED' }; }
    if (!botClient || typeof botClient.debugSnapshot !== 'function' || typeof botClient.debugEvents !== 'function') return { sent: false, reason: 'DEBUG_TELEMETRY_BOT_CLIENT_UNAVAILABLE' };

    const regularDue = now >= this.nextAttemptAt;
    let eventBatch = null;
    let events = [];
    let fastLane = { eligible: false, reason: 'REGULAR_DUE', signals: [] };
    if (!regularDue) {
      try {
        eventBatch = await botClient.debugEvents(this.lastEventSeq, this.eventLimit);
        events = Array.isArray(eventBatch && eventBatch.events) ? eventBatch.events : [];
        fastLane = this._fastLaneDecision(events, now);
      } catch (_) {
        this.stats.skippedBackoff += 1;
        return { sent: false, reason: 'DEBUG_TELEMETRY_BACKOFF', nextAttemptAt: this.nextAttemptAt };
      }
      if (!fastLane.eligible) {
        if (fastLane.reason === 'FAST_LANE_COOLDOWN') this.stats.fastLaneCooldownBlocks += 1;
        if (fastLane.reason === 'FAST_LANE_DEDUPED') this.stats.fastLaneDedupeBlocks += 1;
        this.stats.skippedBackoff += 1;
        return { sent: false, reason: 'DEBUG_TELEMETRY_BACKOFF', fastLaneReason: fastLane.reason, nextAttemptAt: this.nextAttemptAt };
      }
    }

    this.stats.attempts += 1; this.lastAttemptAt = now;
    if (fastLane.eligible) this.stats.fastLaneAttempts += 1;
    try {
      const snapshot = await botClient.debugSnapshot();
      if (!eventBatch) {
        eventBatch = await botClient.debugEvents(this.lastEventSeq, this.eventLimit);
        events = Array.isArray(eventBatch && eventBatch.events) ? eventBatch.events : [];
        fastLane = this._fastLaneDecision(events, now);
      }
      const maxSeq = events.reduce((max, row) => Math.max(max, Math.floor(finite(row && row.seq, 0))), this.lastEventSeq);
      const copiedSnapshot = clone(snapshot); const enrichedSnapshot = copiedSnapshot && typeof copiedSnapshot === 'object' && !Array.isArray(copiedSnapshot) ? copiedSnapshot : {};
      enrichedSnapshot.functionalAssessment = assessFunctionalHealth(enrichedSnapshot, events, { now });
      enrichedSnapshot.hostAssessment = assessDebugHealth(enrichedSnapshot, events, host);
      if (enrichedSnapshot.functionalAssessment.state === 'CRITICAL') {
        enrichedSnapshot.hostAssessment.state = 'CRITICAL';
        for (const reason of enrichedSnapshot.functionalAssessment.reasons) if (!enrichedSnapshot.hostAssessment.reasons.includes(reason)) enrichedSnapshot.hostAssessment.reasons.push(reason);
      } else if (enrichedSnapshot.functionalAssessment.state === 'DEGRADED' && enrichedSnapshot.hostAssessment.state === 'HEALTHY') {
        enrichedSnapshot.hostAssessment.state = 'DEGRADED';
        for (const reason of enrichedSnapshot.functionalAssessment.reasons) if (!enrichedSnapshot.hostAssessment.reasons.includes(reason)) enrichedSnapshot.hostAssessment.reasons.push(reason);
      }
      const payload = { schemaVersion: 1, type: 'AIO_V3_DEBUG_TELEMETRY_BATCH', botId: this.botId, observedAt: now, cursor: { afterSeq: this.lastEventSeq, maxSeq }, host: { processRunning: host.processRunning === true, restartCount: Math.max(0, Math.floor(finite(host.restartCount, 0))), harnessStartedAt: host.harnessStartedAt == null ? null : finite(host.harnessStartedAt, null) }, snapshot: enrichedSnapshot, events: clone(events) };
      await this._post(payload); this.lastEventSeq = maxSeq; this.failuresInRow = 0; this.nextAttemptAt = now + this.minIntervalMs; this.lastSuccessAt = now; this.lastError = null;
      this._rememberCriticalSignals(events, now);
      if (fastLane.eligible) { this.lastFastLaneAt = now; this.stats.fastLaneSuccesses += 1; }
      this.lastPayload = { at: now, eventCount: events.length, maxSeq, healthState: enrichedSnapshot.hostAssessment.state, healthReasons: enrichedSnapshot.hostAssessment.reasons.slice(), functionalState: enrichedSnapshot.functionalAssessment.state, functionalReasons: enrichedSnapshot.functionalAssessment.reasons.slice(), fastLane: fastLane.eligible, fastLaneReason: fastLane.reason };
      this.stats.successes += 1; this.stats.eventsSent += events.length;
      return { sent: true, eventCount: events.length, maxSeq, healthState: enrichedSnapshot.hostAssessment.state, functionalState: enrichedSnapshot.functionalAssessment.state, fastLane: fastLane.eligible, fastLaneReason: fastLane.reason };
    } catch (error) {
      this.stats.failures += 1; this.failuresInRow += 1;
      if (fastLane.eligible) this.stats.fastLaneFailures += 1;
      const message = String(error && error.message || error || 'DEBUG_TELEMETRY_FAILED').slice(0, 256);
      this.lastError = { at: now, message }; this.nextAttemptAt = now + this._backoffMs(); return { sent: false, reason: 'DEBUG_TELEMETRY_FAILED', fastLane: fastLane.eligible, error: clone(this.lastError), nextAttemptAt: this.nextAttemptAt };
    }
  }
  status() {
    const projectedPerExporter = projectedMonthlyInvocations(this.minIntervalMs, 1);
    const projectedFourExporters = projectedMonthlyInvocations(this.minIntervalMs, MAX_SUPPORTED_EXPORTERS);
    const projectedFastLaneCeilingFourExporters = projectedMonthlyInvocations(this.fastLaneCooldownMs, MAX_SUPPORTED_EXPORTERS);
    return {
      mode: 'host-write-only-debug-telemetry', enabled: this.enabled(), endpointConfigured: !!this.endpoint, tokenConfigured: !!this.token, botId: this.botId,
      eventLimit: this.eventLimit, timeoutMs: this.timeoutMs, minIntervalMs: this.minIntervalMs, maxBackoffMs: this.maxBackoffMs,
      fastLane: { enabled: true, cooldownMs: this.fastLaneCooldownMs, dedupeMs: this.fastLaneDedupeMs, lastFastLaneAt: this.lastFastLaneAt, rememberedFingerprints: this.fastLaneFingerprints.size },
      quotaPolicy: {
        hardMinimumIntervalMs: MIN_PRODUCTION_INTERVAL_MS,
        defaultIntervalMs: DEFAULT_MIN_INTERVAL_MS,
        maxIntervalMs: MAX_TELEMETRY_INTERVAL_MS,
        monthlyBudgetDays: MONTHLY_BUDGET_DAYS,
        edgeMonthlyInvocationBudget: EDGE_MONTHLY_INVOCATION_BUDGET,
        projectedPerExporter,
        projectedFourExporters,
        projectedFastLaneCeilingFourExporters,
        withinBudgetAtFourExporters: projectedFourExporters <= EDGE_MONTHLY_INVOCATION_BUDGET,
        fastLaneCeilingWithinBudgetAtFourExporters: projectedFastLaneCeilingFourExporters <= EDGE_MONTHLY_INVOCATION_BUDGET
      },
      lastEventSeq: this.lastEventSeq, nextAttemptAt: this.nextAttemptAt, failuresInRow: this.failuresInRow, lastAttemptAt: this.lastAttemptAt, lastSuccessAt: this.lastSuccessAt,
      lastError: clone(this.lastError), lastPayload: clone(this.lastPayload), actionAuthority: false, gameplayActionAuthority: false, rawGameplayActionAuthority: false,
      inboundCommandChannel: false, secretsExposedToBrowser: false, stats: { ...this.stats }
    };
  }
}
module.exports = {
  DebugTelemetryExporter,
  DEFAULT_EVENT_LIMIT,
  DEFAULT_TIMEOUT_MS,
  MIN_PRODUCTION_INTERVAL_MS,
  DEFAULT_MIN_INTERVAL_MS,
  MAX_TELEMETRY_INTERVAL_MS,
  DEFAULT_MAX_BACKOFF_MS,
  FAST_LANE_COOLDOWN_MS,
  FAST_LANE_DEDUPE_MS,
  MAX_SUPPORTED_EXPORTERS,
  MONTHLY_BUDGET_DAYS,
  EDGE_MONTHLY_INVOCATION_BUDGET,
  projectedMonthlyInvocations,
  criticalSignal,
  normalizeEndpoint
};