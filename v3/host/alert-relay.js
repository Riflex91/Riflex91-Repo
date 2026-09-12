'use strict';

const ALERT_RELAY_SCHEMA_VERSION = 1;

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

class AlertRelay {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.botClient = options.botClient || null;
    this.store = options.store || null;
    this.transports = (Array.isArray(options.transports) ? options.transports : []).slice(0, 16).map((row, index) => ({
      name: boundedText(row && row.name || `transport-${index + 1}`, 64),
      send: row && typeof row.send === 'function' ? row.send : null,
      severities: new Set(Array.isArray(row && row.severities) ? row.severities.map((value) => String(value).toUpperCase()) : ['CRITICAL']),
      required: row && row.required === false ? false : true
    })).filter((row) => row.send);
    this.capacity = Math.max(20, Math.min(5000, Math.floor(finite(options.capacity, 500))));
    this.ingestLimit = Math.max(1, Math.min(500, Math.floor(finite(options.ingestLimit, 100))));
    this.maxAttempts = Math.max(1, Math.min(20, Math.floor(finite(options.maxAttempts, 8))));
    this.baseBackoffMs = Math.max(1000, Math.min(60 * 60 * 1000, finite(options.baseBackoffMs, 5000)));
    this.maxBackoffMs = Math.max(this.baseBackoffMs, Math.min(24 * 60 * 60 * 1000, finite(options.maxBackoffMs, 15 * 60 * 1000)));
    this.state = { schemaVersion: ALERT_RELAY_SCHEMA_VERSION, records: [] };
    this.durableReady = false;
    this.lastError = null;
    this.stats = {
      ingested: 0,
      alreadySpooled: 0,
      claims: 0,
      claimedAlerts: 0,
      deliveries: 0,
      deliveryFailures: 0,
      persistFailures: 0,
      spoolFullBlocks: 0,
      droppedDelivered: 0
    };
    this._load();
  }

  _setError(code, error) {
    this.lastError = { code, message: String(error && error.message || error || code).slice(0, 256), at: this.now() };
  }

  _sanitizeRecord(row) {
    if (!row || typeof row !== 'object' || !row.id || !row.alert) return null;
    return {
      id: String(row.id).slice(0, 128),
      alert: clone(row.alert),
      firstSeenAt: finite(row.firstSeenAt, this.now()),
      botClaimedAt: finite(row.botClaimedAt, null),
      completedAt: finite(row.completedAt, null),
      transportState: row.transportState && typeof row.transportState === 'object' ? clone(row.transportState) : {}
    };
  }

  _load() {
    if (!this.store || typeof this.store.load !== 'function' || typeof this.store.save !== 'function') {
      this._setError('DURABLE_STORE_REQUIRED', new Error('durable store required'));
      return;
    }
    try {
      const loaded = this.store.load({ schemaVersion: ALERT_RELAY_SCHEMA_VERSION, records: [] });
      if (!loaded || loaded.schemaVersion !== ALERT_RELAY_SCHEMA_VERSION || !Array.isArray(loaded.records)) {
        this._setError('SPOOL_SCHEMA_INVALID', new Error('alert spool schema invalid'));
        return;
      }
      const records = [];
      for (const row of loaded.records.slice(-this.capacity)) {
        const clean = this._sanitizeRecord(row);
        if (clean) records.push(clean);
      }
      this.state = { schemaVersion: ALERT_RELAY_SCHEMA_VERSION, records };
      this.durableReady = true;
      this.lastError = null;
    } catch (error) {
      this._setError('SPOOL_LOAD_FAILED', error);
    }
  }

  _snapshot() {
    return { schemaVersion: ALERT_RELAY_SCHEMA_VERSION, records: clone(this.state.records) };
  }

  _persist() {
    if (!this.store || typeof this.store.save !== 'function') {
      this.durableReady = false;
      this.stats.persistFailures += 1;
      this._setError('DURABLE_STORE_REQUIRED', new Error('durable store required'));
      return false;
    }
    try {
      const ok = this.store.save(this._snapshot());
      if (ok === false) throw new Error('store save returned false');
      this.durableReady = true;
      this.lastError = null;
      return true;
    } catch (error) {
      this.durableReady = false;
      this.stats.persistFailures += 1;
      this._setError('SPOOL_PERSIST_FAILED', error);
      return false;
    }
  }

  _recordById(id) {
    const wanted = String(id || '');
    return this.state.records.find((row) => row.id === wanted) || null;
  }

  _pruneDeliveredForSpace(required = 1) {
    let removed = 0;
    while (this.state.records.length + required > this.capacity) {
      const index = this.state.records.findIndex((row) => row.completedAt != null);
      if (index < 0) break;
      this.state.records.splice(index, 1);
      removed += 1;
    }
    this.stats.droppedDelivered += removed;
    return this.state.records.length + required <= this.capacity;
  }

  _transportNamesFor(alert) {
    const severity = String(alert && alert.severity || 'INFO').toUpperCase();
    return this.transports.filter((row) => row.severities.has(severity)).map((row) => row.name);
  }

  _ensureTransportState(record) {
    for (const name of this._transportNamesFor(record.alert)) {
      if (!record.transportState[name]) {
        record.transportState[name] = { attempts: 0, deliveredAt: null, nextAttemptAt: 0, lastError: null };
      }
    }
  }

  _isComplete(record) {
    const names = this._transportNamesFor(record.alert);
    if (!names.length) return false;
    for (const transport of this.transports) {
      if (!names.includes(transport.name) || transport.required === false) continue;
      const state = record.transportState[transport.name];
      if (!state || state.deliveredAt == null) return false;
    }
    return true;
  }

  async ingest() {
    if (!this.durableReady) return { ingested: 0, claimed: 0, blocked: true, reason: this.lastError && this.lastError.code || 'DURABLE_STORE_UNAVAILABLE' };
    if (!this.botClient || typeof this.botClient.pendingAlerts !== 'function' || typeof this.botClient.claimAlerts !== 'function') {
      this._setError('BOT_ALERT_HANDSHAKE_UNAVAILABLE', new Error('pendingAlerts/claimAlerts required'));
      return { ingested: 0, claimed: 0, blocked: true, reason: 'BOT_ALERT_HANDSHAKE_UNAVAILABLE' };
    }

    let pending;
    try {
      pending = await this.botClient.pendingAlerts(this.ingestLimit);
      if (!Array.isArray(pending)) throw new Error('pendingAlerts must return an array');
    } catch (error) {
      this._setError('BOT_PENDING_ALERTS_FAILED', error);
      return { ingested: 0, claimed: 0, blocked: true, reason: 'BOT_PENDING_ALERTS_FAILED' };
    }

    const before = this._snapshot();
    const claimable = [];
    let ingested = 0;
    for (const alert of pending.slice(0, this.ingestLimit)) {
      if (!alert || !alert.id) continue;
      const id = String(alert.id).slice(0, 128);
      let record = this._recordById(id);
      if (!record) {
        if (!this._pruneDeliveredForSpace(1)) {
          this.stats.spoolFullBlocks += 1;
          break;
        }
        record = {
          id,
          alert: clone(alert),
          firstSeenAt: this.now(),
          botClaimedAt: null,
          completedAt: null,
          transportState: {}
        };
        this._ensureTransportState(record);
        this.state.records.push(record);
        this.stats.ingested += 1;
        ingested += 1;
      } else {
        this.stats.alreadySpooled += 1;
      }
      claimable.push(id);
    }

    if (ingested > 0 && !this._persist()) {
      this.state = before;
      return { ingested: 0, claimed: 0, blocked: true, reason: 'SPOOL_PERSIST_BEFORE_CLAIM_FAILED' };
    }

    const exactClaimIds = claimable.filter((id) => {
      const row = this._recordById(id);
      return row && row.botClaimedAt == null;
    });
    if (!exactClaimIds.length) return { ingested, claimed: 0, blocked: false };

    try {
      const claimedRows = await this.botClient.claimAlerts(exactClaimIds.slice(0, this.ingestLimit));
      const claimedIds = new Set((Array.isArray(claimedRows) ? claimedRows : []).map((row) => row && row.id).filter(Boolean).map(String));
      const claimedAt = this.now();
      for (const id of exactClaimIds) {
        if (!claimedIds.has(id)) continue;
        const row = this._recordById(id);
        if (row) row.botClaimedAt = claimedAt;
      }
      this.stats.claims += 1;
      this.stats.claimedAlerts += claimedIds.size;
      this._persist();
      return { ingested, claimed: claimedIds.size, blocked: false };
    } catch (error) {
      this._setError('BOT_ALERT_CLAIM_FAILED', error);
      return { ingested, claimed: 0, blocked: false, claimDeferred: true, reason: 'BOT_ALERT_CLAIM_FAILED' };
    }
  }

  _backoff(attempts) {
    return Math.min(this.maxBackoffMs, this.baseBackoffMs * Math.pow(2, Math.max(0, attempts - 1)));
  }

  async flush(limit = 100) {
    const now = this.now();
    const max = Math.max(1, Math.min(500, Math.floor(finite(limit, 100))));
    let attempted = 0;
    let delivered = 0;
    let failed = 0;

    for (const record of this.state.records) {
      if (attempted >= max || record.completedAt != null) continue;
      this._ensureTransportState(record);
      const names = this._transportNamesFor(record.alert);
      if (!names.length) continue;

      for (const transport of this.transports) {
        if (attempted >= max || !names.includes(transport.name)) continue;
        const state = record.transportState[transport.name];
        if (state.deliveredAt != null || state.attempts >= this.maxAttempts || now < finite(state.nextAttemptAt, 0)) continue;
        attempted += 1;
        state.attempts += 1;
        try {
          const result = await transport.send(clone(record.alert));
          if (result === false || result && result.ok === false) throw new Error('transport reported failure');
          state.deliveredAt = this.now();
          state.nextAttemptAt = 0;
          state.lastError = null;
          delivered += 1;
          this.stats.deliveries += 1;
        } catch (error) {
          state.lastError = boundedText(error && error.message || error || 'transport failure', 256);
          state.nextAttemptAt = this.now() + this._backoff(state.attempts);
          failed += 1;
          this.stats.deliveryFailures += 1;
        }
        if (!this._persist()) return { attempted, delivered, failed, blocked: true, reason: 'SPOOL_PERSIST_AFTER_TRANSPORT_FAILED' };
      }
      if (this._isComplete(record) && record.completedAt == null) {
        record.completedAt = this.now();
        if (!this._persist()) return { attempted, delivered, failed, blocked: true, reason: 'SPOOL_PERSIST_COMPLETION_FAILED' };
      }
    }
    return { attempted, delivered, failed, blocked: false };
  }

  pending(limit = 100) {
    const max = Math.max(0, Math.min(500, Math.floor(finite(limit, 0))));
    return this.state.records.filter((row) => row.completedAt == null).slice(0, max).map(clone);
  }

  status() {
    const pending = this.state.records.filter((row) => row.completedAt == null);
    return {
      schemaVersion: ALERT_RELAY_SCHEMA_VERSION,
      mode: 'durable-host-alert-relay',
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      operatorAckAuthority: false,
      durableReady: this.durableReady,
      capacity: this.capacity,
      retained: this.state.records.length,
      pending: pending.length,
      pendingCritical: pending.filter((row) => String(row.alert && row.alert.severity).toUpperCase() === 'CRITICAL').length,
      transports: this.transports.map((row) => ({ name: row.name, severities: Array.from(row.severities), required: row.required })),
      lastError: clone(this.lastError),
      stats: { ...this.stats }
    };
  }
}

module.exports = { AlertRelay, ALERT_RELAY_SCHEMA_VERSION };
