'use strict';

const { sellProtectionReasons, sellSafetyStatus } = require('./sell-safety');

const INVENTORY_LEDGER_SCHEMA_VERSION = 1;
const INVENTORY_LEDGER_MODE = 'observation-planning-only';
const ItemDisposition = Object.freeze({
  KEEP: 'KEEP',
  RESERVE_GROUP: 'RESERVE_GROUP',
  RESERVE_PROGRESSION: 'RESERVE_PROGRESSION',
  RESERVE_COMPOUND: 'RESERVE_COMPOUND',
  RESERVE_UPGRADE: 'RESERVE_UPGRADE',
  SELL: 'SELL',
  BANK: 'BANK',
  EXCHANGE: 'EXCHANGE',
  UNDECIDED: 'UNDECIDED'
});

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function itemKey(character, index) {
  return `${String(character || '')}:${Number.isFinite(Number(index)) ? Number(index) : 'x'}`;
}

function stackKey(name, level) {
  return `${String(name || '')}:${Math.max(0, Math.floor(finite(level, 0)))}`;
}

function asSet(value) {
  return new Set(Array.isArray(value) ? value.map(String) : []);
}

class InventoryLedger {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(64, Math.min(5000, Math.floor(finite(options.capacity, 1024))));
    this.staleAfterMs = Math.max(5000, Math.min(30 * 60 * 1000, finite(options.staleAfterMs, 60000)));
    this.workspaceSlots = Math.max(1, Math.min(16, Math.floor(finite(options.workspaceSlots, 3))));
    this.groupPotionReserve = {
      hp: Math.max(0, Math.min(100000, Math.floor(finite(options.groupHpPotionReserve, 200)))),
      mp: Math.max(0, Math.min(100000, Math.floor(finite(options.groupMpPotionReserve, 200))))
    };
    this.sellAllowlist = asSet(options.sellAllowlist);
    this.bankAllowlist = asSet(options.bankAllowlist);
    this.exchangeAllowlist = asSet(options.exchangeAllowlist);
    this.progressionReservations = new Map();
    this.entries = new Map();
    this.lastObservedAt = null;
    this.lastSummary = null;
    this.stats = {
      observations: 0,
      items: 0,
      truncated: 0,
      invalidIndexes: 0,
      outOfRangeRejected: 0,
      undecided: 0,
      reserved: 0,
      sellCandidates: 0,
      sellProtected: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'inventory-ledger', event, severity, reason, data });
  }

  setProgressionReservations(reservations) {
    this.progressionReservations.clear();
    for (const row of Array.isArray(reservations) ? reservations : []) {
      if (!row || !row.name) continue;
      const key = stackKey(row.name, row.level);
      const quantity = Math.max(1, Math.floor(finite(row.quantity, 1)));
      this.progressionReservations.set(key, {
        name: String(row.name), level: Math.max(0, Math.floor(finite(row.level, 0))), quantity,
        goalIds: Array.isArray(row.goalIds) ? row.goalIds.map(String).slice(0, 32) : []
      });
    }
    return this.progressionReservations.size;
  }

  _registryRows(registry) {
    if (!registry) return [];
    const status = typeof registry.status === 'function' ? registry.status() : registry;
    return Array.isArray(status && status.characters) ? status.characters : [];
  }

  _contentUnsafe(contentDrift, name) {
    if (!name || !contentDrift) return false;
    try {
      if (typeof contentDrift.requiresRevalidation === 'function') return contentDrift.requiresRevalidation('items', name) === true;
      if (Array.isArray(contentDrift.records)) {
        const row = contentDrift.records.find((record) => record && record.category === 'items' && record.id === name);
        return !!row && row.lifecycle === 'QUARANTINED';
      }
    } catch (_) {}
    return false;
  }

  _baseDisposition(row, gameData, contentDrift, counts) {
    const reasons = [];
    const meta = gameData && gameData.items && gameData.items[row.name];
    if (row.locked || row.special) return { disposition: ItemDisposition.KEEP, reasons: [row.locked ? 'ITEM_LOCKED' : 'ITEM_SPECIAL'] };
    if (!meta || typeof meta !== 'object') return { disposition: ItemDisposition.UNDECIDED, reasons: ['ITEM_METADATA_UNKNOWN'] };
    if (this._contentUnsafe(contentDrift, row.name)) return { disposition: ItemDisposition.UNDECIDED, reasons: ['CONTENT_REVALIDATION_REQUIRED'] };

    const progression = this.progressionReservations.get(stackKey(row.name, row.level));
    if (progression) return { disposition: ItemDisposition.RESERVE_PROGRESSION, reasons: ['ACTIVE_GEAR_GOAL'], reservation: clone(progression) };

    const lower = String(row.name).toLowerCase();
    if (/^hpot/.test(lower)) return { disposition: ItemDisposition.RESERVE_GROUP, reasons: ['GROUP_HP_POTION_RESERVE'] };
    if (/^mpot/.test(lower)) return { disposition: ItemDisposition.RESERVE_GROUP, reasons: ['GROUP_MP_POTION_RESERVE'] };

    const same = counts.get(stackKey(row.name, row.level)) || 0;
    if (meta.compound === true && same >= 3) return { disposition: ItemDisposition.RESERVE_COMPOUND, reasons: ['COMPOUND_SET_AVAILABLE'] };

    if (this.exchangeAllowlist.has(row.name)) return { disposition: ItemDisposition.EXCHANGE, reasons: ['OPERATOR_EXCHANGE_ALLOWLIST'] };
    if (this.bankAllowlist.has(row.name)) return { disposition: ItemDisposition.BANK, reasons: ['OPERATOR_BANK_ALLOWLIST'] };
    if (this.sellAllowlist.has(row.name)) {
      const blockers = sellProtectionReasons(meta);
      if (blockers.length) {
        return {
          disposition: ItemDisposition.UNDECIDED,
          reasons: ['SELL_ALLOWLIST_PROTECTED', ...blockers].slice(0, 12),
          sellProtected: true
        };
      }
      return { disposition: ItemDisposition.SELL, reasons: ['OPERATOR_SELL_ALLOWLIST'] };
    }

    return { disposition: ItemDisposition.UNDECIDED, reasons };
  }

  observe(context = {}) {
    const at = finite(context.observedAt, this.now());
    const registryRows = this._registryRows(context.registry);
    const gameData = context.gameData || {};
    const contentDrift = context.contentDrift || null;
    const liveCharacter = context.liveCharacter && typeof context.liveCharacter === 'object' ? context.liveCharacter : null;
    const selfName = liveCharacter && normalizeName(liveCharacter.name);
    const reportedIsize = liveCharacter ? finite(liveCharacter.isize) : null;
    const fallbackLength = liveCharacter && Array.isArray(liveCharacter.items) ? liveCharacter.items.length : null;
    const authoritativeCapacity = reportedIsize == null
      ? fallbackLength
      : Math.max(0, Math.floor(reportedIsize));
    const capacitySource = reportedIsize == null ? 'items.length-fallback' : 'character.isize';
    const raw = [];
    let invalidIndexes = 0;
    let outOfRangeRejected = 0;

    for (const character of registryRows.slice(0, 128)) {
      const name = normalizeName(character && character.name);
      if (!name || !Array.isArray(character.inventory)) continue;
      for (const item of character.inventory) {
        if (!item || !item.name) continue;
        const index = finite(item.index);
        if (index == null || !Number.isInteger(index) || index < 0) {
          invalidIndexes += 1;
          continue;
        }
        if (selfName && name === selfName && authoritativeCapacity != null && index >= authoritativeCapacity) {
          outOfRangeRejected += 1;
          continue;
        }
        raw.push({
          character: name,
          index,
          name: String(item.name),
          level: Math.max(0, Math.floor(finite(item.level, 0))),
          q: Math.max(1, Math.floor(finite(item.q, 1))),
          locked: item.locked === true,
          special: item.special === true,
          confidence: Math.max(0, Math.min(1, finite(character.stateConfidence, 0)))
        });
      }
    }
    raw.sort((a, b) => a.character.localeCompare(b.character) || a.index - b.index || a.name.localeCompare(b.name));
    const counts = new Map();
    for (const row of raw) counts.set(stackKey(row.name, row.level), (counts.get(stackKey(row.name, row.level)) || 0) + row.q);

    this.entries.clear();
    let hpReserved = 0;
    let mpReserved = 0;
    let truncated = 0;
    let sellProtected = 0;
    for (const row of raw) {
      if (this.entries.size >= this.capacity) { truncated += 1; continue; }
      const classified = this._baseDisposition(row, gameData, contentDrift, counts);
      let disposition = classified.disposition;
      const reasons = classified.reasons.slice();
      if (classified.sellProtected === true) sellProtected += 1;
      const lower = row.name.toLowerCase();
      if (disposition === ItemDisposition.RESERVE_GROUP && /^hpot/.test(lower)) {
        if (hpReserved >= this.groupPotionReserve.hp) { disposition = ItemDisposition.UNDECIDED; reasons.push('GROUP_RESERVE_ALREADY_SATISFIED'); }
        else hpReserved += row.q;
      }
      if (disposition === ItemDisposition.RESERVE_GROUP && /^mpot/.test(lower)) {
        if (mpReserved >= this.groupPotionReserve.mp) { disposition = ItemDisposition.UNDECIDED; reasons.push('GROUP_RESERVE_ALREADY_SATISFIED'); }
        else mpReserved += row.q;
      }
      const meta = gameData && gameData.items && gameData.items[row.name];
      const entry = {
        schemaVersion: INVENTORY_LEDGER_SCHEMA_VERSION,
        key: itemKey(row.character, row.index),
        observedAt: at,
        ...row,
        disposition,
        reasons: reasons.slice(0, 12),
        reservation: classified.reservation || null,
        metadataKnown: !!meta,
        metadataType: meta && meta.type || null,
        actionAuthority: false
      };
      this.entries.set(entry.key, entry);
    }

    const selfOccupied = selfName ? [...this.entries.values()].filter((row) => row.character === selfName).length : null;
    const freeSlots = authoritativeCapacity == null || selfOccupied == null ? null : Math.max(0, authoritativeCapacity - selfOccupied);
    const pressure = authoritativeCapacity && selfOccupied != null ? Math.max(0, Math.min(1, selfOccupied / authoritativeCapacity)) : null;
    const dispositionCounts = {};
    for (const value of Object.values(ItemDisposition)) dispositionCounts[value] = 0;
    for (const row of this.entries.values()) dispositionCounts[row.disposition] = (dispositionCounts[row.disposition] || 0) + 1;

    this.lastObservedAt = at;
    this.stats.observations += 1;
    this.stats.items = this.entries.size;
    this.stats.truncated += truncated;
    this.stats.invalidIndexes += invalidIndexes;
    this.stats.outOfRangeRejected += outOfRangeRejected;
    this.stats.undecided = dispositionCounts.UNDECIDED || 0;
    this.stats.reserved = [...this.entries.values()].filter((row) => String(row.disposition).startsWith('RESERVE_') || row.disposition === ItemDisposition.KEEP).length;
    this.stats.sellCandidates = dispositionCounts.SELL || 0;
    this.stats.sellProtected = sellProtected;
    this.lastSummary = {
      at,
      characters: new Set([...this.entries.values()].map((row) => row.character)).size,
      entries: this.entries.size,
      quantity: [...this.entries.values()].reduce((sum, row) => sum + row.q, 0),
      dispositions: dispositionCounts,
      groupReserve: { hpRequired: this.groupPotionReserve.hp, hpObservedReserved: hpReserved, mpRequired: this.groupPotionReserve.mp, mpObservedReserved: mpReserved },
      selfInventory: {
        name: selfName,
        capacity: authoritativeCapacity,
        capacitySource,
        occupied: selfOccupied,
        freeSlots,
        pressure,
        workspaceSlots: this.workspaceSlots,
        workspaceAvailable: freeSlots == null ? null : freeSlots >= this.workspaceSlots,
        invalidIndexesRejected: invalidIndexes,
        outOfRangeRejected
      }
    };
    if (truncated) this._event('INVENTORY_LEDGER_TRUNCATED', 'warn', 'CAPACITY_LIMIT', { capacity: this.capacity, dropped: truncated });
    if (invalidIndexes) this._event('INVENTORY_INDEX_INVALID', 'warn', 'INVALID_INVENTORY_INDEX', { rejected: invalidIndexes });
    if (outOfRangeRejected) this._event('INVENTORY_INDEX_OUT_OF_RANGE', 'warn', 'CHARACTER_ISIZE_BOUND', {
      character: selfName,
      isize: authoritativeCapacity,
      rejected: outOfRangeRejected
    });
    if (sellProtected) this._event('INVENTORY_SELL_PROTECTED', 'info', 'SELL_ALLOWLIST_CANNOT_OVERRIDE_PROTECTED_METADATA', { rejected: sellProtected });
    if (freeSlots != null && freeSlots < this.workspaceSlots) this._event('INVENTORY_PRESSURE_HIGH', 'warn', 'WORKSPACE_RESERVE_VIOLATED', { freeSlots, workspaceSlots: this.workspaceSlots });
    return this.status();
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.capacity, Math.floor(finite(limit, 100))));
    return [...this.entries.values()].slice(0, n).map(clone);
  }

  get(character, index) {
    const row = this.entries.get(itemKey(character, index));
    return row ? clone(row) : null;
  }

  status() {
    const now = this.now();
    return {
      schemaVersion: INVENTORY_LEDGER_SCHEMA_VERSION,
      mode: INVENTORY_LEDGER_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      destructiveActionsEnabled: false,
      sellExecutionEnabled: false,
      bankExecutionEnabled: false,
      compoundExecutionEnabled: false,
      upgradeExecutionEnabled: false,
      exchangeExecutionEnabled: false,
      capacity: this.capacity,
      workspaceSlots: this.workspaceSlots,
      lastObservedAt: this.lastObservedAt,
      observationAgeMs: this.lastObservedAt == null ? null : Math.max(0, now - this.lastObservedAt),
      stale: this.lastObservedAt != null && now - this.lastObservedAt > this.staleAfterMs,
      summary: clone(this.lastSummary),
      policy: {
        groupPotionReserve: clone(this.groupPotionReserve),
        sellAllowlist: [...this.sellAllowlist].sort(),
        bankAllowlist: [...this.bankAllowlist].sort(),
        exchangeAllowlist: [...this.exchangeAllowlist].sort(),
        defaultDisposition: ItemDisposition.UNDECIDED,
        sellSafety: sellSafetyStatus()
      },
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  InventoryLedger,
  INVENTORY_LEDGER_SCHEMA_VERSION,
  INVENTORY_LEDGER_MODE,
  ItemDisposition,
  stackKey
};
