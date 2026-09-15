'use strict';

const { assessDebugHealth } = require('./debug-health-assessor');
const { assessFunctionalHealth } = require('./functional-health-assessor');

const DEFAULT_EVENT_LIMIT = 200;
const DEFAULT_TIMEOUT_MS = 5000;
const MIN_PRODUCTION_INTERVAL_MS = 60 * 1000;
const DEFAULT_MIN_INTERVAL_MS = 2 * 60 * 1000;
const MAX_TELEMETRY_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_MAX_BACKOFF_MS = 30 * 60 * 1000;
const MAX_SUPPORTED_EXPORTERS = 4;
const MONTHLY_BUDGET_DAYS = 31;
const EDGE_MONTHLY_INVOCATION_BUDGET = 500000;

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

class DebugTelemetryExporter {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now()); this.fetch = options.fetch || globalThis.fetch;
    this.endpoint = normalizeEndpoint(options.endpoint || options.url, options.allowInsecureLoopbackForTests === true);
    this.token = options.token ? String(options.token) : null; this.botId = String(options.botId || 'adventure-land-v3').slice(0, 128);
    this.eventLimit = Math.max(1, Math.min(200, Math.floor(finite(options.eventLimit, DEFAULT_EVENT_LIMIT))));
    this.timeoutMs = Math.max(500, Math.min(30000, Math.floor(finite(options.timeoutMs, DEFAULT_TIMEOUT_MS))));
    this.minIntervalMs = Math.max(MIN_PRODUCTION_INTERVAL_MS, Math.min(MAX_TELEMETRY_INTERVAL_MS, Math.floor(finite(options.minIntervalMs, DEFAULT_MIN_INTERVAL_MS))));
    this.maxBackoffMs = Math.max(this.minIntervalMs, Math.min(60 * 60 * 1000, Math.floor(finite(options.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS))));
    this.lastEventSeq = Math.max(0, Math.floor(finite(options.lastEventSeq, 0))); this.nextAttemptAt = 0; this.failuresInRow = 0;
    this.lastAttemptAt = null; this.lastSuccessAt = null; this.lastError = null; this.lastPayload = null;
    this.stats = { attempts: 0, successes: 0, failures: 0, skippedDisabled: 0, skippedBackoff: 0, eventsSent: 0 };
  }
  enabled() { return !!(this.endpoint && this.token && typeof this.fetch === 'function'); }
  _backoffMs() { if (this.failuresInRow <= 0) return this.minIntervalMs; return Math.min(this.maxBackoffMs, this.minIntervalMs * Math.pow(2, Math.min(8, this.failuresInRow - 1))); }
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
    if (now < this.nextAttemptAt) { this.stats.skippedBackoff += 1; return { sent: false, reason: 'DEBUG_TELEMETRY_BACKOFF', nextAttemptAt: this.nextAttemptAt }; }
    this.stats.attempts += 1; this.lastAttemptAt = now;
    try {
      const snapshot = await botClient.debugSnapshot(); const eventBatch = await botClient.debugEvents(this.lastEventSeq, this.eventLimit);
      const events = Array.isArray(eventBatch && eventBatch.events) ? eventBatch.events : [];
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
      this.lastPayload = { at: now, eventCount: events.length, maxSeq, healthState: enrichedSnapshot.hostAssessment.state, healthReasons: enrichedSnapshot.hostAssessment.reasons.slice(), functionalState: enrichedSnapshot.functionalAssessment.state, functionalReasons: enrichedSnapshot.functionalAssessment.reasons.slice() };
      this.stats.successes += 1; this.stats.eventsSent += events.length;
      return { sent: true, eventCount: events.length, maxSeq, healthState: enrichedSnapshot.hostAssessment.state, functionalState: enrichedSnapshot.functionalAssessment.state };
    } catch (error) {
      this.stats.failures += 1; this.failuresInRow += 1; const message = String(error && error.message || error || 'DEBUG_TELEMETRY_FAILED').slice(0, 256);
      this.lastError = { at: now, message }; this.nextAttemptAt = now + this._backoffMs(); return { sent: false, reason: 'DEBUG_TELEMETRY_FAILED', error: clone(this.lastError), nextAttemptAt: this.nextAttemptAt };
    }
  }
  status() {
    const projectedPerExporter = projectedMonthlyInvocations(this.minIntervalMs, 1);
    const projectedFourExporters = projectedMonthlyInvocations(this.minIntervalMs, MAX_SUPPORTED_EXPORTERS);
    return {
      mode: 'host-write-only-debug-telemetry', enabled: this.enabled(), endpointConfigured: !!this.endpoint, tokenConfigured: !!this.token, botId: this.botId,
      eventLimit: this.eventLimit, timeoutMs: this.timeoutMs, minIntervalMs: this.minIntervalMs, maxBackoffMs: this.maxBackoffMs,
      quotaPolicy: {
        hardMinimumIntervalMs: MIN_PRODUCTION_INTERVAL_MS,
        defaultIntervalMs: DEFAULT_MIN_INTERVAL_MS,
        maxIntervalMs: MAX_TELEMETRY_INTERVAL_MS,
        monthlyBudgetDays: MONTHLY_BUDGET_DAYS,
        edgeMonthlyInvocationBudget: EDGE_MONTHLY_INVOCATION_BUDGET,
        projectedPerExporter,
        projectedFourExporters,
        withinBudgetAtFourExporters: projectedFourExporters <= EDGE_MONTHLY_INVOCATION_BUDGET
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
  MAX_SUPPORTED_EXPORTERS,
  MONTHLY_BUDGET_DAYS,
  EDGE_MONTHLY_INVOCATION_BUDGET,
  projectedMonthlyInvocations,
  normalizeEndpoint
};
