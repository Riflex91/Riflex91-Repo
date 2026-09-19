'use strict';

const MERCHANT_PARTY_HISTORY_SCHEMA_VERSION = 1;
const MERCHANT_PARTY_HISTORY_MODE = 'persistent-trusted-party-history-v1';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function normalizeName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function normalizeClass(value) {
  const ctype = String(value == null ? '' : value).trim().toLowerCase();
  return ctype || null;
}

function uniqueNames(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeName).filter(Boolean))];
}

function normalizeGear(gear, maxSlots = 32) {
  if (!gear || typeof gear !== 'object' || Array.isArray(gear)) return {};
  const out = {};
  for (const slot of Object.keys(gear).sort().slice(0, maxSlots)) {
    const item = gear[slot];
    if (!item || typeof item !== 'object' || !item.name) continue;
    out[slot] = {
      name: String(item.name),
      level: Math.max(0, Math.floor(finite(item.level, 0))),
      locked: !!(item.locked || item.l),
      special: !!(item.special || item.p)
    };
  }
  return out;
}

class MerchantPartyHistory {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'aio-v3-merchant-party-history-v1';
    this.capacity = Math.max(4, Math.min(128, Math.floor(finite(options.capacity, 32))));
    this.saveIntervalMs = Math.max(5000, Math.min(5 * 60 * 1000, Math.floor(finite(options.saveIntervalMs, 30000))));
    this.records = new Map();
    this.loaded = false;
    this.lastSavedAt = null;
    this.stats = {
      observations: 0,
      remembered: 0,
      updated: 0,
      rejectedUntrusted: 0,
      rejectedMissingIdentity: 0,
      loads: 0,
      loadErrors: 0,
      saves: 0,
      saveErrors: 0,
      evicted: 0
    };
    this.load();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'merchant-party-history', event, severity, reason, data }); } catch (_) {}
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    const ls = this.root && this.root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
      return {
        get: (key) => ls.getItem(key),
        set: (key, value) => { ls.setItem(key, value); return true; }
      };
    }
    return null;
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || Number(data.schemaVersion) !== MERCHANT_PARTY_HISTORY_SCHEMA_VERSION || !Array.isArray(data.records)) {
        throw new Error('unsupported merchant party history schema');
      }
      for (const row of data.records) {
        const name = normalizeName(row && row.name);
        const ctype = normalizeClass(row && row.ctype);
        if (!name || !ctype) continue;
        this.records.set(name, {
          name,
          ctype,
          level: Math.max(0, Math.floor(finite(row.level, 0))),
          gear: normalizeGear(row.gear),
          firstPartyAt: Math.max(0, finite(row.firstPartyAt, 0)),
          lastPartyAt: Math.max(0, finite(row.lastPartyAt, 0)),
          lastGearAt: Math.max(0, finite(row.lastGearAt, 0)),
          observations: Math.max(1, Math.floor(finite(row.observations, 1)))
        });
      }
      this._prune();
      this.stats.loads += 1;
      return true;
    } catch (error) {
      this.records.clear();
      this.stats.loadErrors += 1;
      this._event('MERCHANT_PARTY_HISTORY_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', {
        message: String(error && error.message || error)
      });
      return false;
    }
  }

  _prune() {
    if (this.records.size <= this.capacity) return;
    const rows = [...this.records.values()].sort((a, b) => finite(a.lastPartyAt, 0) - finite(b.lastPartyAt, 0));
    while (this.records.size > this.capacity && rows.length) {
      const victim = rows.shift();
      this.records.delete(victim.name);
      this.stats.evicted += 1;
      this._event('MERCHANT_PARTY_HISTORY_EVICTED', 'warn', 'HISTORY_CAPACITY', { name: victim.name });
    }
  }

  save(options = {}) {
    const backend = this._backend();
    if (!backend) return false;
    const now = this.now();
    if (options.force !== true && this.lastSavedAt != null && now - this.lastSavedAt < this.saveIntervalMs) return false;
    try {
      const payload = {
        schemaVersion: MERCHANT_PARTY_HISTORY_SCHEMA_VERSION,
        savedAt: now,
        records: [...this.records.values()].map((row) => clone(row))
      };
      backend.set(this.key, JSON.stringify(payload));
      this.lastSavedAt = now;
      this.stats.saves += 1;
      return true;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('MERCHANT_PARTY_HISTORY_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', {
        message: String(error && error.message || error)
      });
      return false;
    }
  }

  observe(context = {}) {
    const merchantName = normalizeName(context.merchantName);
    const partyNames = uniqueNames(context.partyNames).filter((name) => name !== merchantName);
    const trusted = new Set(uniqueNames(context.trustedNames));
    const status = context.registry && typeof context.registry.status === 'function'
      ? context.registry.status()
      : context.registry;
    const registryRows = Array.isArray(status && status.characters) ? status.characters : [];
    const byName = new Map(registryRows.filter(Boolean).map((row) => [normalizeName(row.name), row]));
    const now = this.now();
    let changed = false;

    for (const name of partyNames) {
      this.stats.observations += 1;
      if (!trusted.size || !trusted.has(name)) {
        this.stats.rejectedUntrusted += 1;
        continue;
      }
      const observed = byName.get(name);
      const ctype = normalizeClass(observed && (observed.ctype || observed.type));
      if (!observed || !ctype) {
        this.stats.rejectedMissingIdentity += 1;
        continue;
      }

      const previous = this.records.get(name);
      const observedGear = normalizeGear(observed.gear);
      const useObservedGear = Object.keys(observedGear).length > 0;
      const record = {
        name,
        ctype,
        level: Math.max(0, Math.floor(finite(observed.level, previous && previous.level || 0))),
        gear: useObservedGear ? observedGear : clone(previous && previous.gear, {}),
        firstPartyAt: previous ? previous.firstPartyAt : now,
        lastPartyAt: now,
        lastGearAt: useObservedGear ? now : previous ? previous.lastGearAt : 0,
        observations: previous ? previous.observations + 1 : 1
      };
      this.records.set(name, record);
      if (previous) this.stats.updated += 1;
      else {
        this.stats.remembered += 1;
        this._event('MERCHANT_PARTY_MEMBER_REMEMBERED', 'info', 'TRUSTED_PARTY_MEMBER_OBSERVED', {
          name,
          ctype,
          level: record.level
        });
      }
      changed = true;
    }

    this._prune();
    if (changed) this.save();
    return changed;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => b.lastPartyAt - a.lastPartyAt || a.name.localeCompare(b.name))
      .map((row) => clone(row));
  }

  get(name) {
    const record = this.records.get(normalizeName(name));
    return record ? clone(record) : null;
  }

  planningRows(context = {}) {
    const currentParty = new Set(uniqueNames(context.currentPartyNames));
    const status = context.registry && typeof context.registry.status === 'function'
      ? context.registry.status()
      : context.registry;
    const liveRows = Array.isArray(status && status.characters) ? status.characters : [];
    const liveNames = new Set(liveRows.filter(Boolean).map((row) => normalizeName(row.name)).filter(Boolean));
    const now = this.now();
    const out = [];

    for (const record of this.records.values()) {
      if (currentParty.has(record.name)) continue;
      // Only synthesize a planning row when the character is not currently in
      // the Merchant's active party. Never reuse stale inventory as physical
      // authority; remembered rows intentionally expose an empty inventory.
      out.push({
        name: record.name,
        ctype: record.ctype,
        level: record.level,
        gear: clone(record.gear, {}),
        inventory: [],
        online: false,
        presence: 'REMEMBERED_OFFLINE',
        available: false,
        availability: 'UNAVAILABLE',
        rememberedOffline: true,
        rememberedPartyMember: true,
        lastPartyAt: record.lastPartyAt,
        stateConfidence: liveNames.has(record.name) ? 0.65 : 0.6,
        firstObservedAt: record.firstPartyAt,
        lastSeenAt: record.lastPartyAt,
        lastUpdatedAt: record.lastPartyAt,
        observationAgeMs: Math.max(0, now - record.lastPartyAt)
      });
    }
    return out;
  }

  status() {
    return {
      schemaVersion: MERCHANT_PARTY_HISTORY_SCHEMA_VERSION,
      mode: MERCHANT_PARTY_HISTORY_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      capacity: this.capacity,
      rememberedMembers: this.records.size,
      members: this.list(),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  MerchantPartyHistory,
  MERCHANT_PARTY_HISTORY_SCHEMA_VERSION,
  MERCHANT_PARTY_HISTORY_MODE
};
