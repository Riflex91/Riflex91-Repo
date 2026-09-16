'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { promisify } = require('node:util');

const gzip = promisify(zlib.gzip);
const DEFAULT_EVENT_LIMIT = 200;
const DEFAULT_DEDUPE_MS = 10 * 60 * 1000;
const DEFAULT_MAX_PENDING_FILES = 200;
const DEFAULT_MAX_PENDING_BYTES = 512 * 1024 * 1024;
const HARD_SEVERITIES = new Set(['ERROR', 'CRITICAL', 'FATAL', 'EMERGENCY', 'ALERT']);
const WARNING_SEVERITIES = new Set(['WARN', 'WARNING']);
const IMPORTANT_PATTERN = /(FAIL(?:ED|URE)?|ERROR|QUARANTIN|SAFE_MODE|RESTART_REQUIRED|CIRCUIT_OPEN|UNAVAILABLE|NOT_LIVE|\bDEAD\b|NO_PROGRESS|DRIFT_DETECTED|TIMEOUT|EXHAUSTED|DEGRADED|REJECTED|DISCONNECTED|OUTAGE)/i;
const SECRET_KEY_PATTERN = /(authorization|password|passwd|secret|token|cookie|api[_-]?key|session[_-]?key|private[_-]?key|credential)/i;

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function bool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}
function safeSegment(value, fallback = 'adventure-land-v3') {
  const text = String(value || fallback).trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return (text || fallback).slice(0, 128);
}
function sanitize(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length <= 16384 ? value : `${value.slice(0, 16384)}…[truncated]`;
  if (typeof value !== 'object') return String(value).slice(0, 1024);
  if (depth >= 12) return '[max-depth]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 500).map((entry) => sanitize(entry, depth + 1, seen));
  const out = {};
  let count = 0;
  for (const [key, entry] of Object.entries(value)) {
    if (count >= 1000) { out.__truncatedKeys = true; break; }
    count += 1;
    out[key] = SECRET_KEY_PATTERN.test(key) ? '[REDACTED]' : sanitize(entry, depth + 1, seen);
  }
  return out;
}
function eventSignal(event) {
  if (!event || typeof event !== 'object') return null;
  const type = String(event.event || event.type || '').slice(0, 200);
  const severity = String(event.severity || '').toUpperCase().slice(0, 40);
  const reason = String(event.reason || event.data && event.data.reason || '').slice(0, 300);
  const component = String(event.component || event.data && event.data.component || '').slice(0, 160);
  const character = String(event.character || event.data && event.data.character || '').slice(0, 160);
  const warningProblem = WARNING_SEVERITIES.has(severity) && IMPORTANT_PATTERN.test(`${type} ${reason}`);
  if (!HARD_SEVERITIES.has(severity) && !warningProblem) return null;
  return {
    seq: Math.max(0, Math.floor(finite(event.seq, 0))),
    type: type || 'UNKNOWN_PROBLEM', severity: severity || 'UNKNOWN', reason: reason || type || 'UNKNOWN_PROBLEM',
    component: component || null, character: character || null,
    fingerprint: `${component || 'unknown'}|${type || 'UNKNOWN_PROBLEM'}|${severity || 'UNKNOWN'}|${reason || 'none'}|${character || 'none'}`
  };
}
function hostSignal(host = {}) {
  if (host.harnessError) {
    const reason = String(host.harnessError).slice(0, 300);
    return { seq: 0, type: 'HOST_HARNESS_ERROR', severity: 'ERROR', reason, component: 'production-host-harness', character: null, fingerprint: `production-host-harness|HOST_HARNESS_ERROR|${reason.slice(0, 180)}` };
  }
  const state = String(host.watchdogState || '').toUpperCase();
  if (state && !['HEALTHY', 'STARTING', 'UNKNOWN'].includes(state)) {
    return { seq: 0, type: 'HOST_WATCHDOG_UNHEALTHY', severity: state === 'CRITICAL' || state === 'DEAD' ? 'CRITICAL' : 'ERROR', reason: state, component: 'host-watchdog', character: null, fingerprint: `host-watchdog|HOST_WATCHDOG_UNHEALTHY|${state}` };
  }
  return null;
}

class ProblemDiagnosticsArchive {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.enabledFlag = bool(options.enabled, false);
    this.botId = safeSegment(options.botId);
    this.spoolDir = path.resolve(String(options.spoolDir || path.join(process.cwd(), 'var', 'v3-diagnostics')));
    this.eventLimit = Math.max(1, Math.min(500, Math.floor(finite(options.eventLimit, DEFAULT_EVENT_LIMIT))));
    this.dedupeMs = Math.max(30000, Math.min(24 * 60 * 60 * 1000, Math.floor(finite(options.dedupeMs, DEFAULT_DEDUPE_MS))));
    this.maxPendingFiles = Math.max(10, Math.min(10000, Math.floor(finite(options.maxPendingFiles, DEFAULT_MAX_PENDING_FILES))));
    this.maxPendingBytes = Math.max(10 * 1024 * 1024, Math.floor(finite(options.maxPendingBytes, DEFAULT_MAX_PENDING_BYTES)));
    this.uploader = options.uploader || null;
    this.lastEventSeq = Math.max(0, Math.floor(finite(options.lastEventSeq, 0)));
    this.lastCaptureAt = null; this.lastBundle = null; this.lastError = null; this.lastUploadResult = null;
    this.fingerprints = new Map();
    this.stats = { ticks: 0, captures: 0, deduped: 0, failures: 0, bridgeFailuresCaptured: 0, prunedFiles: 0, prunedBytes: 0, uploadFlushes: 0 };
  }
  enabled() { return this.enabledFlag; }
  _remember(fingerprint, now) {
    this.fingerprints.set(fingerprint, now);
    for (const [key, at] of this.fingerprints) if (now - at >= this.dedupeMs) this.fingerprints.delete(key);
    if (this.fingerprints.size > 1024) {
      const overflow = [...this.fingerprints.entries()].sort((a, b) => a[1] - b[1]).slice(0, this.fingerprints.size - 1024);
      for (const [key] of overflow) this.fingerprints.delete(key);
    }
  }
  _isDuplicate(fingerprint, now) { const at = this.fingerprints.get(fingerprint); return at != null && now - at < this.dedupeMs; }
  async _ensureDirs() { await fs.mkdir(path.join(this.spoolDir, 'pending'), { recursive: true }); }
  async _enforceRetention() {
    const pendingDir = path.join(this.spoolDir, 'pending');
    let rows = [];
    try {
      const names = await fs.readdir(pendingDir);
      for (const name of names.filter((entry) => /^problem-.*\.json\.gz$/.test(entry))) {
        const fullPath = path.join(pendingDir, name);
        try { const stat = await fs.stat(fullPath); rows.push({ name, fullPath, bytes: stat.size, mtimeMs: stat.mtimeMs }); } catch (_) {}
      }
    } catch (error) { if (error && error.code === 'ENOENT') return; throw error; }
    rows.sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name));
    let bytes = rows.reduce((sum, row) => sum + row.bytes, 0);
    while (rows.length > this.maxPendingFiles || bytes > this.maxPendingBytes) {
      const row = rows.shift(); if (!row) break;
      await fs.rm(row.fullPath, { force: true }); await fs.rm(`${row.fullPath}.meta.json`, { force: true });
      bytes -= row.bytes; this.stats.prunedFiles += 1; this.stats.prunedBytes += row.bytes;
    }
  }
  _bundleId(now, signal) {
    const digest = crypto.createHash('sha256').update(`${this.botId}|${now}|${signal.fingerprint}|${signal.seq}`).digest('hex').slice(0, 12);
    return `${new Date(now).toISOString().replace(/[:.]/g, '-')}-${digest}`;
  }
  async _writeBundle(bundle, signal) {
    await this._ensureDirs();
    const compressed = await gzip(Buffer.from(`${JSON.stringify(bundle)}\n`, 'utf8'), { level: 6 });
    const sha256 = crypto.createHash('sha256').update(compressed).digest('hex');
    const filename = `problem-${bundle.bundleId}.json.gz`;
    const finalPath = path.join(this.spoolDir, 'pending', filename);
    const tempPath = `${finalPath}.part-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
    await fs.writeFile(tempPath, compressed, { flag: 'wx', mode: 0o600 });
    await fs.rename(tempPath, finalPath);
    const metadata = { schemaVersion: 1, bundleId: bundle.bundleId, botId: this.botId, capturedAt: bundle.capturedAt, day: bundle.capturedAt.slice(0, 10), severity: signal.severity, reason: signal.reason, sha256, bytes: compressed.length, filename };
    await fs.writeFile(`${finalPath}.meta.json`, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o600 });
    await fs.writeFile(path.join(this.spoolDir, 'latest-problem.json'), `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o600 });
    await this._enforceRetention();
    return { ...metadata, localPath: finalPath };
  }
  async flush() {
    if (!this.uploader || typeof this.uploader.flush !== 'function') return { uploaded: 0, reason: 'DIAGNOSTICS_UPLOADER_UNAVAILABLE' };
    this.stats.uploadFlushes += 1;
    this.lastUploadResult = await this.uploader.flush(this.spoolDir);
    return this.lastUploadResult;
  }
  async tick(botClient, host = {}) {
    this.stats.ticks += 1;
    if (!this.enabled()) return { captured: false, reason: 'PROBLEM_DIAGNOSTICS_DISABLED' };
    const now = this.now();
    const externalHostSignal = hostSignal(host);
    const hasBridge = !!(botClient && typeof botClient.debugEvents === 'function' && typeof botClient.debugSnapshot === 'function');
    if (!hasBridge && !externalHostSignal) return { captured: false, reason: 'PROBLEM_DIAGNOSTICS_BOT_CLIENT_UNAVAILABLE' };

    try {
      let events = [];
      let maxSeq = this.lastEventSeq;
      let bridgeError = null;
      if (hasBridge) {
        try {
          const batch = await botClient.debugEvents(this.lastEventSeq, this.eventLimit);
          events = Array.isArray(batch && batch.events) ? batch.events : [];
          maxSeq = events.reduce((max, row) => Math.max(max, Math.floor(finite(row && row.seq, 0))), this.lastEventSeq);
        } catch (error) {
          bridgeError = String(error && error.message || error).slice(0, 256);
          if (!externalHostSignal) throw error;
        }
      } else {
        bridgeError = 'BOT_CLIENT_UNAVAILABLE';
      }

      const signals = events.map(eventSignal).filter(Boolean);
      if (externalHostSignal) signals.unshift(externalHostSignal);
      const signal = signals.find((row) => !this._isDuplicate(row.fingerprint, now)) || null;
      if (!signal) {
        if (signals.length) this.stats.deduped += 1;
        this.lastEventSeq = maxSeq;
        const upload = await this.flush();
        return { captured: false, reason: signals.length ? 'PROBLEM_DIAGNOSTICS_DEDUPED' : 'PROBLEM_DIAGNOSTICS_NO_PROBLEM', maxSeq, upload };
      }

      let snapshot = null;
      if (hasBridge && !bridgeError) {
        try { snapshot = await botClient.debugSnapshot(); }
        catch (error) { bridgeError = String(error && error.message || error).slice(0, 256); if (!externalHostSignal) throw error; }
      }
      if (bridgeError) this.stats.bridgeFailuresCaptured += 1;

      const bundleId = this._bundleId(now, signal);
      const bundle = {
        schemaVersion: 1, type: 'AIO_V3_PROBLEM_DIAGNOSTICS_BUNDLE', bundleId, botId: this.botId, capturedAt: new Date(now).toISOString(),
        trigger: sanitize(signal), cursor: { afterSeq: this.lastEventSeq, maxSeq },
        host: sanitize({ processRunning: host.processRunning === true, restartCount: Math.max(0, Math.floor(finite(host.restartCount, 0))), harnessStartedAt: host.harnessStartedAt == null ? null : finite(host.harnessStartedAt, null), watchdogState: host.watchdogState || null, harnessError: host.harnessError || null }),
        bridge: { available: hasBridge && !bridgeError, error: bridgeError },
        snapshot: sanitize(snapshot), events: sanitize(events)
      };
      const written = await this._writeBundle(bundle, signal);
      this.lastEventSeq = maxSeq; this.lastCaptureAt = now; this.lastBundle = { ...written }; this.lastError = null; this.stats.captures += 1; this._remember(signal.fingerprint, now);
      const upload = await this.flush();
      return { captured: true, bundle: { ...written }, maxSeq, upload };
    } catch (error) {
      this.stats.failures += 1;
      this.lastError = { at: now, message: String(error && error.message || error).slice(0, 256) };
      return { captured: false, reason: 'PROBLEM_DIAGNOSTICS_FAILED', error: { ...this.lastError } };
    }
  }
  status() {
    const lastBundle = this.lastBundle ? { ...this.lastBundle } : null;
    if (lastBundle) delete lastBundle.localPath;
    return {
      mode: 'host-problem-diagnostics-archive', enabled: this.enabled(), botId: this.botId, spoolDir: this.spoolDir,
      eventLimit: this.eventLimit, dedupeMs: this.dedupeMs, maxPendingFiles: this.maxPendingFiles, maxPendingBytes: this.maxPendingBytes,
      lastEventSeq: this.lastEventSeq, lastCaptureAt: this.lastCaptureAt, lastBundle,
      lastError: this.lastError && { ...this.lastError }, lastUploadResult: this.lastUploadResult && { ...this.lastUploadResult },
      uploader: this.uploader && typeof this.uploader.status === 'function' ? this.uploader.status() : null,
      credentialsExposed: false, gameplayActionAuthority: false, rawGameplayActionAuthority: false, stats: { ...this.stats }
    };
  }
}

module.exports = { ProblemDiagnosticsArchive, DEFAULT_EVENT_LIMIT, DEFAULT_DEDUPE_MS, DEFAULT_MAX_PENDING_FILES, DEFAULT_MAX_PENDING_BYTES, sanitize, eventSignal, hostSignal };
