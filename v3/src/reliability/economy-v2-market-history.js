'use strict';

const MARKET_HISTORY_MODE = 'persistent-market-history-v1';
function finite(value, fallback = null) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function levelOf(item) { return Math.max(0, Math.floor(finite(item && item.level, 0) || 0)); }
function clone(value) { try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
function itemKey(name, level = 0) { return `${String(name || '')}:${Math.max(0, Number(level) || 0)}`; }
function storageOf(root) { const s = root && root.localStorage; return s && typeof s.getItem === 'function' && typeof s.setItem === 'function' ? s : null; }

class PersistentMarketHistory {
  constructor({ root = globalThis, oracle = null, now = () => Date.now(), key = 'aio-v3:economy-v2-market-history:v1', maxItems = 96, maxSamplesPerItem = 48, saveIntervalMs = 15000, maxSerializedBytes = 180000 } = {}) {
    this.root = root; this.oracle = oracle; this.now = now; this.key = key;
    this.maxItems = Math.max(16, Math.min(256, Number(maxItems) || 96));
    this.maxSamplesPerItem = Math.max(8, Math.min(128, Number(maxSamplesPerItem) || 48));
    this.saveIntervalMs = Math.max(5000, Number(saveIntervalMs) || 15000);
    this.maxSerializedBytes = Math.max(40000, Number(maxSerializedBytes) || 180000);
    this.history = new Map(); this.loaded = false; this.persistenceDisabled = false; this.lastSavedAt = null; this.lastObservedAt = null;
    this.stats = { loads: 0, loadErrors: 0, observations: 0, saves: 0, saveErrors: 0, quotaCompactions: 0, prunedItems: 0, prunedSamples: 0 };
    this.load();
  }
  load() {
    if (this.loaded) return false; this.loaded = true; const s = storageOf(this.root); if (!s) return false;
    try { const parsed = JSON.parse(s.getItem(this.key) || 'null'); if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.items)) return false;
      for (const row of parsed.items) if (row && row.key && Array.isArray(row.samples)) this.history.set(row.key, row.samples.slice(-this.maxSamplesPerItem));
      this.stats.loads += 1; return true;
    } catch (_) { this.stats.loadErrors += 1; return false; }
  }
  _compact() {
    for (const [key, samples] of this.history) if (samples.length > this.maxSamplesPerItem) { this.stats.prunedSamples += samples.length - this.maxSamplesPerItem; this.history.set(key, samples.slice(-this.maxSamplesPerItem)); }
    if (this.history.size <= this.maxItems) return;
    const ordered = [...this.history.entries()].sort((a, b) => finite(a[1].at(-1) && a[1].at(-1).at, 0) - finite(b[1].at(-1) && b[1].at(-1).at, 0));
    while (this.history.size > this.maxItems && ordered.length) { this.history.delete(ordered.shift()[0]); this.stats.prunedItems += 1; }
  }
  _payload() { return { schemaVersion: 1, mode: MARKET_HISTORY_MODE, savedAt: this.now(), items: [...this.history.entries()].map(([key, samples]) => ({ key, samples })) }; }
  save(force = false) {
    if (this.persistenceDisabled) return false; const now = this.now(); if (!force && this.lastSavedAt != null && now - this.lastSavedAt < this.saveIntervalMs) return false;
    const s = storageOf(this.root); if (!s) return false; this._compact();
    const write = () => { const payload = JSON.stringify(this._payload()); if (payload.length > this.maxSerializedBytes) throw new Error('MARKET_HISTORY_SIZE_CAP'); s.setItem(this.key, payload); this.lastSavedAt = now; this.stats.saves += 1; return true; };
    try { return write(); } catch (_) {
      this.stats.saveErrors += 1;
      try { for (const [key, samples] of this.history) this.history.set(key, samples.slice(-8)); this.stats.quotaCompactions += 1; return write(); }
      catch (_) { this.stats.saveErrors += 1; this.persistenceDisabled = true; return false; }
    }
  }
  observe(itemName, level = 0) {
    if (!itemName || !this.oracle || typeof this.oracle.quote !== 'function') return null; const quote = this.oracle.quote(itemName, level); if (!quote) return null;
    const sample = { at: this.now(), fairValue: finite(quote.fairValue), medianAsk: finite(quote.medianAsk), maxBid: finite(quote.maxBid), sampleCount: Math.max(0, finite(quote.sampleCount, 0)), confidence: Math.max(0, Math.min(1, finite(quote.confidence, 0))), source: quote.source || 'unknown', marketBacked: /^market-/.test(String(quote.source || '')) };
    const key = itemKey(itemName, level), list = this.history.get(key) || [], previous = list.at(-1);
    if (!previous || previous.fairValue !== sample.fairValue || previous.medianAsk !== sample.medianAsk || previous.maxBid !== sample.maxBid || previous.sampleCount !== sample.sampleCount || sample.at - previous.at >= 30000) { list.push(sample); this.history.set(key, list.slice(-this.maxSamplesPerItem)); this.stats.observations += 1; this.lastObservedAt = sample.at; }
    this._compact(); return this.analysis(itemName, level);
  }
  observeMany(items = []) { const seen = new Set(), out = []; for (const item of items) { if (!item || !item.name) continue; const key = itemKey(item.name, levelOf(item)); if (seen.has(key)) continue; seen.add(key); const row = this.observe(item.name, levelOf(item)); if (row) out.push(row); } this.save(false); return out; }
  analysis(itemName, level = 0) {
    const key = itemKey(itemName, level), samples = this.history.get(key) || [], market = samples.filter((x) => x.marketBacked && x.fairValue != null), latest = samples.at(-1) || null;
    let trendPct = null; if (market.length >= 2 && market[0].fairValue > 0) trendPct = (market.at(-1).fairValue - market[0].fairValue) / market[0].fairValue;
    const spreadPct = latest && latest.medianAsk != null && latest.maxBid != null && latest.medianAsk > 0 ? (latest.medianAsk - latest.maxBid) / latest.medianAsk : null;
    const volumeEvidence = market.reduce((sum, x) => sum + Math.max(1, x.sampleCount || 0), 0);
    const liquidity = Math.max(0, Math.min(1, volumeEvidence / 24)) * (spreadPct == null ? 0.7 : Math.max(0.15, 1 - Math.max(0, spreadPct)));
    return { key, name: itemName, level: Math.max(0, Number(level) || 0), observations: samples.length, marketObservations: market.length, currentFairValue: latest && latest.fairValue != null ? latest.fairValue : null, trendPct, spreadPct, liquidity: Number(liquidity.toFixed(4)), confidence: latest ? latest.confidence : 0, latest: clone(latest) };
  }
  status() { return { schemaVersion: 1, mode: MARKET_HISTORY_MODE, trackedItems: this.history.size, lastObservedAt: this.lastObservedAt, lastSavedAt: this.lastSavedAt, persistenceDisabled: this.persistenceDisabled, stats: { ...this.stats } }; }
}

module.exports = { PersistentMarketHistory, MARKET_HISTORY_MODE, itemKey, levelOf, finite, clone, storageOf };
