'use strict';

const ALERT_SCHEMA_VERSION = 1;
const SEVERITIES = new Set(['INFO', 'WARNING', 'CRITICAL']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function boundedText(value, max = 256) {
  return value == null ? null : String(value).slice(0, max);
}
function compactData(value, maxBytes = 4096) {
  if (value == null) return {};
  try {
    const text = JSON.stringify(value);
    if (text.length <= maxBytes) return JSON.parse(text);
    return { truncated: true, originalBytes: text.length };
  } catch (_) {
    return { serializationFailed: true };
  }
}

class AlertEscalationManager {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.capacity = Math.max(20, Math.min(2000, Math.floor(finite(options.capacity, 250))));
    this.dedupeWindowMs = Math.max(1000, Math.min(60 * 60 * 1000, finite(options.dedupeWindowMs, 60000)));
    this.warningEscalateAfterMs = Math.max(5000, Math.min(24 * 60 * 60 * 1000, finite(options.warningEscalateAfterMs, 10 * 60 * 1000)));
    this.maxNewPerWindow = Math.max(1, Math.min(500, Math.floor(finite(options.maxNewPerWindow, 30))));
    this.rateWindowMs = Math.max(1000, Math.min(60 * 60 * 1000, finite(options.rateWindowMs, 60000)));
    this.alerts = [];
    this.sequence = 0;
    this.windowStarts = [];
    this.stats = {
      emitted: 0,
      deduped: 0,
      suppressed: 0,
      escalated: 0,
      acknowledged: 0,
      delivered: 0,
      dropped: 0
    };
  }

  _pruneRateWindow(now) {
    const cutoff = now - this.rateWindowMs;
    while (this.windowStarts.length && this.windowStarts[0] <= cutoff) this.windowStarts.shift();
  }

  _findDedupe(key, now) {
    if (!key) return null;
    for (let i = this.alerts.length - 1; i >= 0; i -= 1) {
      const row = this.alerts[i];
      if (row.dedupeKey !== key) continue;
      if (now - row.lastAt > this.dedupeWindowMs) return null;
      return row;
    }
    return null;
  }

  emit(input = {}) {
    const now = finite(input.at, this.now());
    const severity = SEVERITIES.has(String(input.severity || '').toUpperCase())
      ? String(input.severity).toUpperCase() : 'INFO';
    const type = boundedText(input.type || input.event || 'ALERT', 128) || 'ALERT';
    const reason = boundedText(input.reason, 256);
    const dedupeKey = boundedText(input.dedupeKey || `${type}:${reason || ''}`, 256);
    const existing = this._findDedupe(dedupeKey, now);
    if (existing) {
      existing.lastAt = now;
      existing.occurrences += 1;
      existing.lastData = compactData(input.data);
      if (severity === 'CRITICAL' && existing.severity !== 'CRITICAL') {
        existing.severity = 'CRITICAL';
        existing.escalatedAt = now;
        existing.pendingDelivery = true;
        this.stats.escalated += 1;
      }
      this.stats.deduped += 1;
      return { accepted: true, deduped: true, alert: clone(existing) };
    }

    this._pruneRateWindow(now);
    if (this.windowStarts.length >= this.maxNewPerWindow) {
      this.stats.suppressed += 1;
      return { accepted: false, reason: 'ALERT_RATE_LIMIT', suppressed: true };
    }
    this.windowStarts.push(now);

    const alert = {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: `alert-${++this.sequence}`,
      createdAt: now,
      lastAt: now,
      severity,
      type,
      reason,
      dedupeKey,
      occurrences: 1,
      data: compactData(input.data),
      lastData: null,
      pendingDelivery: true,
      deliveryCount: 0,
      deliveredAt: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      escalatedAt: null
    };
    this.alerts.push(alert);
    this.stats.emitted += 1;
    if (this.alerts.length > this.capacity) {
      const overflow = this.alerts.length - this.capacity;
      this.alerts.splice(0, overflow);
      this.stats.dropped += overflow;
    }
    return { accepted: true, deduped: false, alert: clone(alert) };
  }

  sweep(at = this.now()) {
    const now = finite(at, this.now());
    let escalated = 0;
    for (const row of this.alerts) {
      if (row.severity !== 'WARNING' || row.acknowledgedAt != null || row.escalatedAt != null) continue;
      if (now - row.createdAt < this.warningEscalateAfterMs) continue;
      row.severity = 'CRITICAL';
      row.escalatedAt = now;
      row.pendingDelivery = true;
      escalated += 1;
      this.stats.escalated += 1;
    }
    return { escalated, at: now };
  }

  acknowledge(id, options = {}) {
    const wanted = String(id || '');
    const row = this.alerts.find((alert) => alert.id === wanted);
    if (!row) return { acknowledged: false, reason: 'ALERT_NOT_FOUND' };
    if (row.acknowledgedAt != null) return { acknowledged: true, duplicate: true, alert: clone(row) };
    row.acknowledgedAt = this.now();
    row.acknowledgedBy = boundedText(options.by || 'operator', 128);
    row.pendingDelivery = false;
    this.stats.acknowledged += 1;
    return { acknowledged: true, duplicate: false, alert: clone(row) };
  }

  peek(limit = 100) {
    this.sweep();
    const n = Math.max(0, Math.min(this.alerts.length, Math.floor(finite(limit, 0))));
    return this.alerts.slice(this.alerts.length - n).map(clone);
  }

  pending(limit = 100) {
    this.sweep();
    const n = Math.max(0, Math.min(500, Math.floor(finite(limit, 0))));
    return this.alerts.filter((row) => row.pendingDelivery && row.acknowledgedAt == null).slice(0, n).map(clone);
  }

  claim(ids = []) {
    const now = this.now();
    const wanted = new Set((Array.isArray(ids) ? ids : []).slice(0, 500).map((id) => String(id || '')).filter(Boolean));
    const claimed = [];
    for (const row of this.alerts) {
      if (!wanted.has(row.id) || !row.pendingDelivery || row.acknowledgedAt != null) continue;
      row.pendingDelivery = false;
      row.deliveryCount += 1;
      row.deliveredAt = now;
      this.stats.delivered += 1;
      claimed.push(clone(row));
    }
    return claimed;
  }

  drain(limit = 100) {
    const rows = this.pending(limit);
    return this.claim(rows.map((row) => row.id));
  }

  status() {
    const pending = this.alerts.filter((row) => row.pendingDelivery && row.acknowledgedAt == null);
    return {
      schemaVersion: ALERT_SCHEMA_VERSION,
      mode: 'host-transported-alerts',
      actionAuthority: false,
      transportOwnedByHost: true,
      capacity: this.capacity,
      retained: this.alerts.length,
      pending: pending.length,
      pendingCritical: pending.filter((row) => row.severity === 'CRITICAL').length,
      dedupeWindowMs: this.dedupeWindowMs,
      warningEscalateAfterMs: this.warningEscalateAfterMs,
      maxNewPerWindow: this.maxNewPerWindow,
      rateWindowMs: this.rateWindowMs,
      stats: { ...this.stats }
    };
  }
}

module.exports = { AlertEscalationManager, ALERT_SCHEMA_VERSION, SEVERITIES };
