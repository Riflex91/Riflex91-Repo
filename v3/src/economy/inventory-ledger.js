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

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '')).filter(Boolean))];
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
    this.itemPermissions = new Map();
    this.setItemPermissions(options.itemPermissions || {});
    this.sellSafetyResolver = typeof options.sellSafetyResolver === 'function' ? options.sellSafetyResolver : null;
    this.progressionReservations = new Map();
    this.progressionReservationSlots = new Map();
    this.progressionReservationCounts = new Map();
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

  setSellSafetyResolver(resolver) {
    this.sellSafetyResolver = typeof resolver === 'function' ? resolver : null;
    return this.sellSafetyResolver !== null;
  }

  setItemPermissions(value = {}) {
    this.itemPermissions.clear();
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    for (const [name, row] of Object.entries(source).slice(0, 512)) {
      const normalizedName = normalizeName(name);
      if (!normalizedName || !row || typeof row !== 'object' || Array.isArray(row)) continue;
      const permissions = {};
      for (const action of ['sell', 'bank', 'compound', 'upgrade']) {
        if (typeof row[action] === 'boolean') permissions[action] = row[action];
      }
      if (Object.keys(permissions).length) this.itemPermissions.set(normalizedName, permissions);
    }
    return this.itemPermissionSnapshot();
  }

  itemPermissionSnapshot() {
    return Object.fromEntries([...this.itemPermissions.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, row]) => [name, { ...row }]));
  }

  _permission(name, action) {
    const row = this.itemPermissions.get(String(name || ''));
    return row && typeof row[action] === 'boolean' ? row[action] : null;
  }

  _operatorDisposition(row, meta, same) {
    const permissions = this.itemPermissions.get(String(row && row.name || '')) || {};
    if (permissions.compound === true && meta && meta.compound && same >= 3) {
      return { disposition: ItemDisposition.RESERVE_COMPOUND, reasons: ['OPERATOR_COMPOUND_ALLOWED'] };
    }
    if (permissions.upgrade === true && meta && meta.upgrade) {
      return { disposition: ItemDisposition.RESERVE_UPGRADE, reasons: ['OPERATOR_UPGRADE_ALLOWED'] };
    }
    if (permissions.bank === true) return { disposition: ItemDisposition.BANK, reasons: ['OPERATOR_BANK_ALLOWED'] };
    // sell=true is a capability permission, never an immediate disposition.
    // The autonomous lifecycle must first complete gear-value evaluation and
    // then choose SELL vs progression from expected economic value.
    return null;
  }

  setProgressionReservations(reservations) {
    this.progressionReservations.clear();
    this.progressionReservationSlots.clear();
    this.progressionReservationCounts.clear();
    for (const row of Array.isArray(reservations) ? reservations : []) {
      if (!row || !row.name) continue;
      const quantity = Math.max(1, Math.floor(finite(row.quantity, 1)));
      const normalized = {
        name: String(row.name),
        level: Math.max(0, Math.floor(finite(row.level, 0))),
        quantity,
        sourceCharacter: normalizeName(row.sourceCharacter),
        sourceIndex: Number.isInteger(Number(row.sourceIndex)) ? Number(row.sourceIndex) : null,
        goalIds: Array.isArray(row.goalIds) ? row.goalIds.map(String).slice(0, 32) : []
      };
      if (normalized.sourceCharacter && normalized.sourceIndex != null) {
        this.progressionReservationSlots.set(itemKey(normalized.sourceCharacter, normalized.sourceIndex), normalized);
      } else {
        const countKey = `${normalized.sourceCharacter || '*'}|${stackKey(normalized.name, normalized.level)}`;
        const previous = this.progressionReservationCounts.get(countKey);
        this.progressionReservationCounts.set(countKey, {
          ...normalized,
          quantity: (previous ? previous.quantity : 0) + quantity,
          goalIds: uniqueStrings([...(previous ? previous.goalIds : []), ...normalized.goalIds]).slice(0, 32)
        });
      }
      this.progressionReservations.set(`${normalized.sourceCharacter || '*'}|${stackKey(normalized.name, normalized.level)}`, normalized);
    }
    return this.progressionReservationSlots.size + this.progressionReservationCounts.size;
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

  _resolveSellBlockers(row, meta, gameData, contentDrift) {
    let blockers = sellProtectionReasons(meta);
    if (!this.sellSafetyResolver) return blockers;
    try {
      const resolved = this.sellSafetyResolver({ row: clone(row), meta, gameData, contentDrift });
      const extra = Array.isArray(resolved)
        ? resolved
        : resolved && Array.isArray(resolved.blockers)
          ? resolved.blockers
          : [];
      blockers = uniqueStrings([...blockers, ...extra]);
    } catch (_) {
      blockers = uniqueStrings([...blockers, 'SELL_SAFETY_RESOLVER_FAILED']);
    }
    return blockers;
  }

  _baseDisposition(row, gameData, contentDrift, counts, reservationRemaining = new Map()) {
    const reasons = [];
    const meta = gameData && gameData.items && gameData.items[row.name];
    const same = counts.get(stackKey(row.name, row.level)) || 0;
    const hasProtectedFlag = row.locked || row.special;
    const hasExplicitAllow = ['bank', 'compound', 'upgrade'].some((action) => this._permission(row.name, action) === true);
    if (hasProtectedFlag && !hasExplicitAllow) return { disposition: ItemDisposition.KEEP, reasons: [row.locked ? 'ITEM_LOCKED' : 'ITEM_SPECIAL'] };
    if (!meta || typeof meta !== 'object') return { disposition: ItemDisposition.UNDECIDED, reasons: ['ITEM_METADATA_UNKNOWN'] };
    if (this._contentUnsafe(contentDrift, row.name)) return { disposition: ItemDisposition.UNDECIDED, reasons: ['CONTENT_REVALIDATION_REQUIRED'] };

    const exactProgression = this.progressionReservationSlots.get(itemKey(row.character, row.index));
    if (exactProgression && exactProgression.name === row.name && exactProgression.level === row.level) {
      if (this._permission(row.name, 'upgrade') === false) return { disposition: ItemDisposition.KEEP, reasons: ['OPERATOR_UPGRADE_DENIED', 'ACTIVE_GEAR_GOAL_EXACT_ITEM'], reservation: clone(exactProgression) };
      return { disposition: ItemDisposition.RESERVE_PROGRESSION, reasons: ['ACTIVE_GEAR_GOAL_EXACT_ITEM'], reservation: clone(exactProgression) };
    }
    const specificKey = `${row.character}|${stackKey(row.name, row.level)}`;
    const wildcardKey = `*|${stackKey(row.name, row.level)}`;
    const countKey = reservationRemaining.has(specificKey) ? specificKey : reservationRemaining.has(wildcardKey) ? wildcardKey : null;
    if (countKey && reservationRemaining.get(countKey) > 0) {
      reservationRemaining.set(countKey, reservationRemaining.get(countKey) - 1);
      const progression = this.progressionReservationCounts.get(countKey);
      if (this._permission(row.name, 'upgrade') === false) return { disposition: ItemDisposition.KEEP, reasons: ['OPERATOR_UPGRADE_DENIED', 'ACTIVE_GEAR_GOAL_QUANTITY_ALLOCATED'], reservation: clone(progression) };
      return { disposition: ItemDisposition.RESERVE_PROGRESSION, reasons: ['ACTIVE_GEAR_GOAL_QUANTITY_ALLOCATED'], reservation: clone(progression) };
    }

    const lower = String(row.name).toLowerCase();
    if (/^hpot/.test(lower)) return { disposition: ItemDisposition.RESERVE_GROUP, reasons: ['GROUP_HP_POTION_RESERVE'] };
    if (/^mpot/.test(lower)) return { disposition: ItemDisposition.RESERVE_GROUP, reasons: ['GROUP_MP_POTION_RESERVE'] };

    const operator = this._operatorDisposition(row, meta, same);
    if (operator) {
      if (hasProtectedFlag) operator.reasons.push(row.locked ? 'PROTECTED_ITEM_OPERATOR_OVERRIDE' : 'SPECIAL_ITEM_OPERATOR_OVERRIDE');
      return operator;
    }

    if (meta.compound && same >= 3 && this._permission(row.name, 'compound') !== false) return { disposition: ItemDisposition.RESERVE_COMPOUND, reasons: ['COMPOUND_SET_AVAILABLE'] };

    if (this.exchangeAllowlist.has(row.name)) return { disposition: ItemDisposition.EXCHANGE, reasons: ['OPERATOR_EXCHANGE_ALLOWLIST'] };
    if (this.bankAllowlist.has(row.name) && this._permission(row.name, 'bank') !== false) return { disposition: ItemDisposition.BANK, reasons: ['OPERATOR_BANK_ALLOWLIST'] };
    if (this.sellAllowlist.has(row.name) && this._permission(row.name, 'sell') !== false) {
      const blockers = this._resolveSellBlockers(row, meta, gameData, contentDrift);
      if (blockers.length) {
        return {
          disposition: ItemDisposition.UNDECIDED,
          reasons: ['SELL_ALLOWLIST_PROTECTED', ...blockers].slice(0, 12),
          sellProtected: true
        };
      }
      // Preserve the historical observation/planning contract. Alpha27 wraps
      // this provisional SELL and re-routes it through gear + economy checks
      // before any live autonomous sale can be authorized.
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
    // Compound availability is character-local. Three identical copies spread
    // across Merchant/Farmers are not a valid combine set for any one character.
    const countsByCharacter = new Map();
    for (const row of raw) {
      const counts = countsByCharacter.get(row.character) || new Map();
      const key = stackKey(row.name, row.level);
      counts.set(key, (counts.get(key) || 0) + row.q);
      countsByCharacter.set(row.character, counts);
    }

    this.entries.clear();
    const progressionRemaining = new Map([...this.progressionReservationCounts.entries()].map(([key, value]) => [key, Math.max(0, Math.floor(finite(value && value.quantity, 0)))]));
    let hpReserved = 0;
    let mpReserved = 0;
    let truncated = 0;
    let sellProtected = 0;
    for (const row of raw) {
      if (this.entries.size >= this.capacity) { truncated += 1; continue; }
      const classified = this._baseDisposition(row, gameData, contentDrift, countsByCharacter.get(row.character) || new Map(), progressionRemaining);
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
      const permissions = this.itemPermissions.get(row.name) || {};
      const entry = {
        schemaVersion: INVENTORY_LEDGER_SCHEMA_VERSION,
        key: itemKey(row.character, row.index),
        observedAt: at,
        ...row,
        disposition,
        reasons: reasons.slice(0, 12),
        reservation: classified.reservation || null,
        economicTargetLevel: Number.isFinite(Number(classified.economicTargetLevel)) ? Math.max(0, Math.floor(Number(classified.economicTargetLevel))) : null,
        economicDecision: classified.economicDecision ? clone(classified.economicDecision) : null,
        metadataKnown: !!meta,
        metadataType: meta && meta.type || null,
        operatorPermissions: { ...permissions },
        protected: row.locked || row.special,
        protectionReason: row.locked ? 'ITEM_LOCKED' : row.special ? 'ITEM_SPECIAL' : null,
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
        itemPermissions: this.itemPermissionSnapshot(),
        defaultDisposition: ItemDisposition.UNDECIDED,
        sellSafetyResolver: this.sellSafetyResolver ? 'ENABLED' : 'DISABLED',
        sellSafety: sellSafetyStatus(),
        progressionReservationMode: 'EXACT_ITEM_THEN_QUANTITY_ALLOCATED'
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
