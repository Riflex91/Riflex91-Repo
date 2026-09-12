'use strict';

const { sellProtectionReasons } = require('./sell-safety');

const BANK_CAPACITY_SCHEMA_VERSION = 1;
const BANK_CAPACITY_MODE = 'observation-planning-only';
const BankSpaceAction = Object.freeze({
  DEPOSIT_STACK: 'DEPOSIT_STACK',
  DEPOSIT_FREE_SLOT: 'DEPOSIT_FREE_SLOT',
  CONSOLIDATE_BANK_STACKS: 'CONSOLIDATE_BANK_STACKS',
  EXPAND_BANK_PACK: 'EXPAND_BANK_PACK',
  EMERGENCY_RECLAIM: 'EMERGENCY_RECLAIM',
  BLOCK_INVENTORY_PRODUCING_WORK: 'BLOCK_INVENTORY_PRODUCING_WORK'
});

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function observedCost(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function hasOwn(value, key) {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key);
}
function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}
function itemIdentity(item) {
  if (!item || !item.name) return null;
  return `${String(item.name)}:${Math.max(0, Math.floor(finite(item.level, 0)))}`;
}
function packCatalogRow(name, value) {
  if (Array.isArray(value)) {
    return {
      name: String(name),
      map: value[0] == null ? null : String(value[0]),
      goldCost: observedCost(value[1]),
      shellCost: observedCost(value[2]),
      source: 'bank_packs-array'
    };
  }
  if (value && typeof value === 'object') {
    return {
      name: String(name),
      map: value.map == null && value.place == null ? null : String(value.map == null ? value.place : value.map),
      goldCost: observedCost(value.gold == null ? value.goldCost : value.gold),
      shellCost: observedCost(value.shells == null ? value.shellCost : value.shells),
      source: 'bank_packs-object'
    };
  }
  return { name: String(name), map: null, goldCost: null, shellCost: null, source: 'observed-bank-only' };
}

class BankCapacityManager {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.workspaceSlots = Math.max(1, Math.min(32, Math.floor(finite(options.workspaceSlots, 3))));
    this.protectedGoldReserve = Math.max(0, finite(options.protectedGoldReserve, 1000000));
    this.protectedShellReserve = Math.max(0, finite(options.protectedShellReserve, 0));
    this.allowShellSpend = options.allowShellSpend === true;
    this.pressureObservationsRequired = Math.max(2, Math.min(20, Math.floor(finite(options.pressureObservationsRequired, 3))));
    this.pressureHistory = [];
    this.lastObservation = null;
    this.lastPlan = null;
    this.stats = {
      observations: 0,
      plans: 0,
      stackTargets: 0,
      freeSlotTargets: 0,
      consolidationPlans: 0,
      expansionPlans: 0,
      reclaimPlans: 0,
      selectiveBlocks: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'bank-capacity', event, severity, reason, data });
    }
  }

  _catalog(bank, bankPacks) {
    const names = new Set();
    if (bankPacks && typeof bankPacks === 'object') Object.keys(bankPacks).forEach((name) => names.add(name));
    if (bank && typeof bank === 'object') {
      for (const [name, value] of Object.entries(bank)) if (Array.isArray(value)) names.add(name);
    }
    const rows = [];
    for (const name of names) {
      const source = bankPacks && typeof bankPacks === 'object' ? bankPacks[name] : null;
      rows.push(packCatalogRow(name, source));
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }

  _contentUnsafe(contentDrift, itemName) {
    if (!contentDrift || !itemName) return false;
    try {
      if (typeof contentDrift.requiresRevalidation === 'function') return contentDrift.requiresRevalidation('items', itemName) === true;
    } catch (_) {}
    return false;
  }

  _bankItemSafety(item, gameData, contentDrift) {
    if (!item || !item.name) return { protected: true, reasons: ['BANK_ITEM_UNKNOWN'] };
    const reasons = [];
    if (item.l === true || item.locked === true) reasons.push('BANK_ITEM_LOCKED');
    if (item.p || item.special) reasons.push('BANK_ITEM_SPECIAL');
    if (hasOwn(item, 'level') && Math.max(0, finite(item.level, 0)) > 0) reasons.push('BANK_ITEM_LEVELLED');
    const meta = gameData && gameData.items && gameData.items[item.name];
    if (!meta) reasons.push('BANK_ITEM_METADATA_UNKNOWN');
    if (this._contentUnsafe(contentDrift, item.name)) reasons.push('BANK_ITEM_CONTENT_REVALIDATION_REQUIRED');
    if (meta) reasons.push(...sellProtectionReasons(meta));
    return { protected: unique(reasons).length > 0, reasons: unique(reasons) };
  }

  _packView(row, bank, gameData, contentDrift) {
    const items = bank && Array.isArray(bank[row.name]) ? bank[row.name] : null;
    const unlocked = !!items;
    const capacity = unlocked ? items.length : 0;
    let occupied = 0;
    let protectedSlots = 0;
    const compatibleStacks = [];
    const identities = new Map();
    if (items) {
      items.forEach((item, index) => {
        if (!item || !item.name) return;
        occupied += 1;
        const safety = this._bankItemSafety(item, gameData, contentDrift);
        if (safety.protected) protectedSlots += 1;
        const meta = gameData && gameData.items && gameData.items[item.name];
        const stackMax = Math.max(1, Math.floor(finite(meta && meta.s, 1)));
        const quantity = Math.max(1, Math.floor(finite(item.q, 1)));
        const identity = itemIdentity(item);
        if (!identity) return;
        const current = identities.get(identity) || [];
        current.push({ index, quantity, stackMax, name: String(item.name), level: Math.max(0, Math.floor(finite(item.level, 0))) });
        identities.set(identity, current);
        if (stackMax > quantity) compatibleStacks.push({ index, name: String(item.name), level: Math.max(0, Math.floor(finite(item.level, 0))), quantity, stackMax, headroom: stackMax - quantity });
      });
    }
    const consolidation = [];
    for (const stacks of identities.values()) {
      if (stacks.length < 2) continue;
      for (let i = 0; i < stacks.length; i += 1) {
        for (let j = i + 1; j < stacks.length; j += 1) {
          if (stacks[i].stackMax > 1 && stacks[i].quantity + stacks[j].quantity <= stacks[i].stackMax) {
            consolidation.push({ fromIndex: stacks[j].index, toIndex: stacks[i].index, name: stacks[i].name, level: stacks[i].level, combinedQuantity: stacks[i].quantity + stacks[j].quantity, stackMax: stacks[i].stackMax });
          }
        }
      }
    }
    return {
      ...row,
      unlocked,
      capacity,
      occupied,
      free: Math.max(0, capacity - occupied),
      protectedSlots,
      reservedSlots: protectedSlots,
      workspaceSlots: this.workspaceSlots,
      workspaceAvailable: unlocked && Math.max(0, capacity - occupied) >= this.workspaceSlots,
      compatibleStacks,
      consolidation
    };
  }

  observe(context = {}) {
    const character = context.character || {};
    const bank = character.bank && typeof character.bank === 'object' ? character.bank : {};
    const gameData = context.gameData || {};
    const catalog = this._catalog(bank, context.bankPacks || {});
    const packs = catalog.map((row) => this._packView(row, bank, gameData, context.contentDrift || null));
    const unlocked = packs.filter((row) => row.unlocked);
    const locked = packs.filter((row) => !row.unlocked);
    const totals = {
      capacity: unlocked.reduce((sum, row) => sum + row.capacity, 0),
      occupied: unlocked.reduce((sum, row) => sum + row.occupied, 0),
      free: unlocked.reduce((sum, row) => sum + row.free, 0),
      compatibleStackHeadroom: unlocked.reduce((sum, row) => sum + row.compatibleStacks.reduce((inner, stack) => inner + stack.headroom, 0), 0),
      consolidationSlotsRecoverable: unlocked.reduce((sum, row) => sum + row.consolidation.length, 0)
    };
    const pressureNow = totals.free < this.workspaceSlots;
    this.pressureHistory.push({ at: finite(context.observedAt, this.now()), pressure: pressureNow });
    this.pressureHistory = this.pressureHistory.slice(-this.pressureObservationsRequired);
    const sustainedPressure = this.pressureHistory.length >= this.pressureObservationsRequired && this.pressureHistory.every((row) => row.pressure);
    this.lastObservation = {
      schemaVersion: BANK_CAPACITY_SCHEMA_VERSION,
      observedAt: finite(context.observedAt, this.now()),
      character: { name: character.name || null, map: character.map || null, gold: Math.max(0, finite(character.gold, 0)) },
      catalogSource: context.bankPacks && Object.keys(context.bankPacks).length ? 'observed-bank_packs' : 'observed-bank-only',
      packs,
      totals,
      unlockedPackCount: unlocked.length,
      lockedPackCount: locked.length,
      pressureNow,
      sustainedPressure,
      actionAuthority: false
    };
    this.stats.observations += 1;
    if (pressureNow) this._event('BANK_CAPACITY_PRESSURE', sustainedPressure ? 'warn' : 'info', sustainedPressure ? 'SUSTAINED_CAPACITY_PRESSURE' : 'CAPACITY_PRESSURE_OBSERVED', { free: totals.free, workspaceSlots: this.workspaceSlots, observations: this.pressureHistory.length });
    return clone(this.lastObservation);
  }

  _stackTarget(request, observation) {
    const name = String(request.item || request.name || '').trim();
    const level = Math.max(0, Math.floor(finite(request.level, 0)));
    const quantity = Math.max(1, Math.floor(finite(request.quantity, 1)));
    if (!name) return null;
    for (const pack of observation.packs.filter((row) => row.unlocked)) {
      const stack = pack.compatibleStacks.find((row) => row.name === name && row.level === level && row.headroom >= quantity);
      if (stack) return { action: BankSpaceAction.DEPOSIT_STACK, pack: pack.name, slot: stack.index, headroom: stack.headroom, quantity };
    }
    return null;
  }

  _freeTarget(observation) {
    const pack = observation.packs.filter((row) => row.unlocked && row.free > 0).sort((a, b) => b.free - a.free || a.name.localeCompare(b.name))[0];
    return pack ? { action: BankSpaceAction.DEPOSIT_FREE_SLOT, pack: pack.name, freeBefore: pack.free } : null;
  }

  _consolidation(observation) {
    for (const pack of observation.packs.filter((row) => row.unlocked)) {
      if (pack.consolidation.length) return { action: BankSpaceAction.CONSOLIDATE_BANK_STACKS, pack: pack.name, move: clone(pack.consolidation[0]), destructive: false, executionAuthority: false };
    }
    return null;
  }

  _expansion(observation, context = {}) {
    const currentMap = String(context.currentMap == null ? observation.character.map || '' : context.currentMap);
    const gold = Math.max(0, finite(context.gold, observation.character.gold));
    const shells = Math.max(0, finite(context.shells, 0));
    const candidates = observation.packs.filter((row) => !row.unlocked).map((row) => {
      const choices = [];
      if (Number.isFinite(row.goldCost) && row.goldCost >= 0 && gold - row.goldCost >= this.protectedGoldReserve) choices.push({ currency: 'gold', cost: row.goldCost, reserveAfter: gold - row.goldCost });
      if (this.allowShellSpend && Number.isFinite(row.shellCost) && row.shellCost >= 0 && shells - row.shellCost >= this.protectedShellReserve) choices.push({ currency: 'shells', cost: row.shellCost, reserveAfter: shells - row.shellCost });
      choices.sort((a, b) => a.cost - b.cost || a.currency.localeCompare(b.currency));
      return { row, payment: choices[0] || null, sameMap: !row.map || row.map === currentMap };
    }).filter((candidate) => candidate.payment);
    candidates.sort((a, b) => Number(b.sameMap) - Number(a.sameMap) || a.payment.cost - b.payment.cost || a.row.name.localeCompare(b.row.name));
    const picked = candidates[0];
    if (!picked) return null;
    return {
      action: BankSpaceAction.EXPAND_BANK_PACK,
      pack: picked.row.name,
      map: picked.row.map,
      currency: picked.payment.currency,
      cost: picked.payment.cost,
      reserveAfter: picked.payment.reserveAfter,
      protectedReserve: picked.payment.currency === 'gold' ? this.protectedGoldReserve : this.protectedShellReserve,
      requiresTravel: !!picked.row.map && picked.row.map !== currentMap,
      exactlyOneExpansion: true,
      executionAuthority: false
    };
  }

  _reclaimBlockers(entry, meta, contentDrift, minimumReserve) {
    const blockers = [];
    if (!entry || entry.disposition !== 'SELL') blockers.push('NOT_POSITIVELY_DISPOSABLE');
    if (!entry || entry.metadataKnown !== true) blockers.push('ITEM_METADATA_UNKNOWN');
    if (entry && (entry.locked || entry.special)) blockers.push(entry.locked ? 'ITEM_LOCKED' : 'ITEM_SPECIAL');
    if (entry && String(entry.disposition || '').startsWith('RESERVE_')) blockers.push('ITEM_RESERVED');
    if (entry && this._contentUnsafe(contentDrift, entry.name)) blockers.push('CONTENT_REVALIDATION_REQUIRED');
    blockers.push(...sellProtectionReasons(meta));
    const quantity = Math.max(1, Math.floor(finite(entry && entry.q, 1)));
    if (quantity <= minimumReserve) blockers.push('PROTECTED_MINIMUM_RESERVE');
    return unique(blockers);
  }

  _lossScore(entry, meta, minimumReserve) {
    const quantity = Math.max(1, Math.floor(finite(entry.q, 1)));
    const surplus = Math.max(0, quantity - minimumReserve);
    const replacementCost = Math.max(0, finite(meta && (meta.g == null ? meta.gold : meta.g), 0));
    const rarityPenalty = Math.max(0, finite(meta && (meta.rarity == null ? meta.rare : meta.rarity), 0));
    const acquisitionPenalty = Math.max(0, finite(meta && meta.difficulty, 0));
    const progressionPenalty = String(entry.disposition || '').includes('PROGRESSION') ? 1000000000 : 0;
    const groupPenalty = String(entry.disposition || '').includes('GROUP') ? 1000000000 : 0;
    return replacementCost + rarityPenalty * 1000000 + acquisitionPenalty * 100000 + progressionPenalty + groupPenalty + (surplus > 0 ? 1000 / surplus : 1000000000);
  }

  _reclaim(context = {}) {
    const ledger = context.ledger;
    const entries = ledger && typeof ledger.list === 'function' ? ledger.list(5000) : [];
    const status = ledger && typeof ledger.status === 'function' ? ledger.status() : null;
    if (!status || status.stale === true) return null;
    const gameData = context.gameData || {};
    const minimumReserves = context.minimumReserves && typeof context.minimumReserves === 'object' ? context.minimumReserves : {};
    const candidates = [];
    for (const entry of entries) {
      if (!entry || !entry.name) continue;
      const meta = gameData.items && gameData.items[entry.name];
      const minimumReserve = Math.max(0, Math.floor(finite(minimumReserves[entry.name], 0)));
      const blockers = this._reclaimBlockers(entry, meta, context.contentDrift || null, minimumReserve);
      if (blockers.length) continue;
      candidates.push({
        character: entry.character,
        index: entry.index,
        item: entry.name,
        level: Math.max(0, Math.floor(finite(entry.level, 0))),
        observedQuantity: Math.max(1, Math.floor(finite(entry.q, 1))),
        protectedMinimumReserve: minimumReserve,
        quantity: 1,
        lossScore: this._lossScore(entry, meta, minimumReserve),
        reasons: ['POSITIVE_SELL_DISPOSITION', 'SELL_SAFETY_CLEAR', 'MINIMUM_RESERVE_PRESERVED']
      });
    }
    candidates.sort((a, b) => a.lossScore - b.lossScore || a.item.localeCompare(b.item) || a.index - b.index);
    return candidates[0] || null;
  }

  planSpace(request = {}, context = {}) {
    const observation = context.observation || this.lastObservation || this.observe(context);
    if (!observation) return { planned: false, reason: 'BANK_OBSERVATION_UNAVAILABLE' };
    this.stats.plans += 1;
    const stack = this._stackTarget(request, observation);
    if (stack) {
      this.stats.stackTargets += 1;
      return this._remember({ planned: true, reason: 'COMPATIBLE_STACK_AVAILABLE', ...stack, destructive: false });
    }
    const free = this._freeTarget(observation);
    if (free) {
      this.stats.freeSlotTargets += 1;
      return this._remember({ planned: true, reason: 'FREE_BANK_SLOT_AVAILABLE', ...free, destructive: false });
    }
    const consolidation = this._consolidation(observation);
    if (consolidation) {
      this.stats.consolidationPlans += 1;
      return this._remember({ planned: true, reason: 'SAFE_STACK_CONSOLIDATION_AVAILABLE', ...consolidation });
    }

    const depositBlocked = request.depositBlocked === true || !!String(request.item || request.name || '').trim();
    if (observation.sustainedPressure || depositBlocked) {
      const expansion = this._expansion(observation, context);
      if (expansion) {
        this.stats.expansionPlans += 1;
        return this._remember({ planned: true, reason: depositBlocked ? 'SAFE_DEPOSIT_BLOCKED_EXPANSION_AVAILABLE' : 'SUSTAINED_CAPACITY_PRESSURE', ...expansion });
      }
    }

    const reclaim = this._reclaim(context);
    if (reclaim) {
      this.stats.reclaimPlans += 1;
      return this._remember({
        planned: true,
        reason: 'EMERGENCY_RECLAIM_MINIMAL_SAFE_CANDIDATE',
        action: BankSpaceAction.EMERGENCY_RECLAIM,
        candidate: reclaim,
        destructive: true,
        exactlyOneUnit: true,
        reobserveRequiredBeforeNextDecision: true,
        bulkSellForbidden: true,
        executionAuthority: false
      });
    }

    this.stats.selectiveBlocks += 1;
    return this._remember({
      planned: true,
      reason: 'NO_SAFE_SPACE_RECOVERY_ACTION',
      action: BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK,
      blockInventoryProducingWork: true,
      globalBotStop: false,
      independentSubsystemsMayContinue: ['combat', 'party', 'monitoring', 'travel-without-loot', 'safe-non-inventory-work'],
      executionAuthority: false
    });
  }

  _remember(plan) {
    this.lastPlan = { at: this.now(), ...clone(plan) };
    this._event('BANK_SPACE_PLAN', plan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK ? 'warn' : 'info', plan.reason, { action: plan.action, pack: plan.pack || null, item: plan.candidate && plan.candidate.item || null });
    return clone(this.lastPlan);
  }

  status() {
    return {
      schemaVersion: BANK_CAPACITY_SCHEMA_VERSION,
      mode: BANK_CAPACITY_MODE,
      actionAuthority: false,
      destructiveActionAuthority: false,
      automaticSellEnabled: false,
      automaticExpansionEnabled: false,
      workspaceSlots: this.workspaceSlots,
      protectedGoldReserve: this.protectedGoldReserve,
      protectedShellReserve: this.protectedShellReserve,
      shellSpendAllowed: this.allowShellSpend,
      pressureObservationsRequired: this.pressureObservationsRequired,
      observation: clone(this.lastObservation),
      lastPlan: clone(this.lastPlan),
      workGate: this.lastPlan && this.lastPlan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK ? {
        inventoryProducingWorkBlocked: true,
        globalBotStop: false,
        reason: this.lastPlan.reason
      } : { inventoryProducingWorkBlocked: false, globalBotStop: false, reason: null },
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  BankCapacityManager,
  BANK_CAPACITY_SCHEMA_VERSION,
  BANK_CAPACITY_MODE,
  BankSpaceAction,
  packCatalogRow,
  itemIdentity
};
