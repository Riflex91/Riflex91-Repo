'use strict';

const { bankRows } = require('./merchant-production-planner');

const PERSISTENT_BANK_CATALOG_MODE = 'persistent-bank-catalog-v1';

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

class PersistentBankCatalog {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3-bank-catalog-v1';
    this.maxAgeMs = Math.max(60000, Number(options.maxAgeMs || 30 * 60 * 1000));
    this.snapshot = null;
    this.lastInvalidation = null;
    this.stats = { observations: 0, persisted: 0, loads: 0, invalidations: 0 };
    this._load();
  }

  _get() {
    try {
      if (this.storage && typeof this.storage.get === 'function') return this.storage.get(this.storageKey);
      const ls = this.root && this.root.localStorage;
      return ls && typeof ls.getItem === 'function' ? ls.getItem(this.storageKey) : null;
    } catch (_) { return null; }
  }

  _set(value) {
    try {
      const text = JSON.stringify(value);
      if (this.storage && typeof this.storage.set === 'function') return this.storage.set(this.storageKey, text) !== false;
      const ls = this.root && this.root.localStorage;
      if (ls && typeof ls.setItem === 'function') { ls.setItem(this.storageKey, text); return true; }
    } catch (_) {}
    return false;
  }

  _load() {
    const raw = this._get();
    if (!raw) return;
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || Number(data.schemaVersion) !== 1 || !data.snapshot) return;
      this.snapshot = clone(data.snapshot);
      this.lastInvalidation = clone(data.lastInvalidation || null);
      this.stats.loads += 1;
    } catch (_) {}
  }

  observe(character) {
    const c = character || this.root && (this.root.character || this.root.parent && this.root.parent.character);
    if (!c || !c.bank || typeof c.bank !== 'object') return false;
    const rows = bankRows(c.bank);
    const packs = Object.keys(c.bank).filter((key) => /^items\d+$/.test(key) && Array.isArray(c.bank[key])).sort();
    const packCapacities = Object.fromEntries(packs.map((pack) => [pack, c.bank[pack].length]));
    const quantities = {};
    for (const row of rows) {
      const key = `${row.name}|${row.level}`;
      quantities[key] = (quantities[key] || 0) + row.quantity;
    }
    this.snapshot = {
      schemaVersion: 1,
      observedAt: this.now(),
      character: c.name || null,
      packs,
      packCapacities,
      rows: clone(rows),
      quantities,
      source: 'LIVE_BANK'
    };
    this.lastInvalidation = null;
    this.stats.observations += 1;
    if (this._set({ schemaVersion: 1, snapshot: this.snapshot, lastInvalidation: null })) this.stats.persisted += 1;
    return true;
  }

  invalidate(reason = 'BANK_MUTATION') {
    this.lastInvalidation = { at: this.now(), reason: String(reason || 'BANK_MUTATION') };
    this.stats.invalidations += 1;
    this._set({ schemaVersion: 1, snapshot: this.snapshot, lastInvalidation: this.lastInvalidation });
  }

  usable() {
    if (!this.snapshot || !Array.isArray(this.snapshot.rows)) return false;
    if (this.lastInvalidation && Number(this.lastInvalidation.at || 0) >= Number(this.snapshot.observedAt || 0)) return false;
    return this.now() - Number(this.snapshot.observedAt || 0) <= this.maxAgeMs;
  }

  needsRefresh() { return !this.usable(); }

  rows() { return this.usable() ? clone(this.snapshot.rows) : []; }

  status() {
    return {
      mode: PERSISTENT_BANK_CATALOG_MODE,
      usable: this.usable(),
      maxAgeMs: this.maxAgeMs,
      snapshot: clone(this.snapshot),
      lastInvalidation: clone(this.lastInvalidation),
      stats: clone(this.stats)
    };
  }
}

module.exports = { PersistentBankCatalog, PERSISTENT_BANK_CATALOG_MODE };
