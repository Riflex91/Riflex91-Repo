'use strict';

const { scoreItem } = require('../economy/gear-progression');
const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, gradeForLevel } = require('./alpha27-utils');

const SELF_GEAR_MODE = 'alpha27-merchant-self-gear-v1';
const SLOTS = Object.freeze(['mainhand','offhand','helmet','chest','pants','shoes','gloves','cape','amulet','belt','orb','ring1','ring2','earring1','earring2']);

function slotItem(character, slot) {
  const item = character && character.slots && character.slots[slot];
  return item && item.name ? item : null;
}

class Alpha27MerchantSelfGear {
  constructor(runtime, atomic, shared) {
    this.runtime = runtime;
    this.atomic = atomic;
    this.root = runtime.root || globalThis;
    this.now = shared.now;
    this.log = shared.log;
    this.options = shared.options;
    this.pending = null;
    this.lastAction = null;
    this.sequence = 0;
    this.stats = {
      candidates: 0,
      spareUpgrades: 0,
      equippedUnequips: 0,
      compoundsFromSpares: 0,
      mutationsCommitted: 0,
      reequips: 0,
      failures: 0,
      holds: 0
    };
    runtime.merchantSelfGear = this;
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'alpha27-merchant-self-gear', event, severity, reason, data }); } catch (_) {}
  }

  _freeSlots() {
    const c = characterOf(this.runtime) || {};
    const items = inventoryOf(this.root);
    const capacity = Math.max(items.length, Math.floor(finite(c.isize, items.length)));
    return Math.max(0, capacity - items.slice(0, capacity).filter(Boolean).length);
  }

  _candidate() {
    const c = characterOf(this.runtime);
    const gd = gameDataOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant' || !c.slots) return null;
    const inv = inventoryOf(this.root);
    const candidates = [];

    for (const slot of SLOTS) {
      const equipped = slotItem(c, slot);
      if (!equipped || equipped.locked || equipped.l || equipped.special || equipped.p) continue;
      const meta = gd.items && gd.items[equipped.name];
      if (!meta) continue;
      const level = levelOf(equipped);
      const nextScore = scoreItem(meta, level + 1, 'merchant');
      const currentScore = scoreItem(meta, level, 'merchant');
      const improvement = nextScore.total - currentScore.total;
      if (!(improvement > 0)) continue;
      const value = Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0));

      if (meta.compound && level < this.options.maxCompoundLevel && gradeForLevel(meta, level) < 4 && value <= this.options.compoundValueCap) {
        const spares = inv.filter((row) => row && row.name === equipped.name && levelOf(row) === level && !row.locked && !row.l && !row.special && !row.p);
        if (spares.length >= 3) {
          const budget = this.atomic.mutationAttemptBudget({ type: 'COMPOUND', character: c.name, item: equipped.name, level });
          if (budget.allowed) candidates.push({ type: 'COMPOUND', slot, item: equipped.name, level, indices: spares.slice(0, 3).map((row) => row.index), improvement, survivalImprovement: nextScore.survival - currentScore.survival, usesEquippedItem: false });
        }
      }

      if (meta.upgrade && level < this.options.maxUpgradeLevel && gradeForLevel(meta, level) < 4 && value <= this.options.upgradeValueCap) {
        const spares = inv.filter((row) => row && row.name === equipped.name && levelOf(row) === level && !row.locked && !row.l && !row.special && !row.p);
        const budget = this.atomic.mutationAttemptBudget({ type: 'UPGRADE', character: c.name, item: equipped.name, level });
        if (budget.allowed) candidates.push({
          type: 'UPGRADE',
          slot,
          item: equipped.name,
          level,
          indices: spares.length ? [spares[0].index] : [],
          improvement,
          survivalImprovement: nextScore.survival - currentScore.survival,
          usesEquippedItem: spares.length === 0
        });
      }
    }

    candidates.sort((a, b) => (
      Number(b.survivalImprovement > 0) - Number(a.survivalImprovement > 0)
      || b.improvement - a.improvement
      || a.level - b.level
      || a.item.localeCompare(b.item)
      || a.slot.localeCompare(b.slot)
    ));
    return candidates[0] || null;
  }

  _operation(candidate) {
    const id = `selfgear-${this.now().toString(36)}-${(++this.sequence).toString(36)}`;
    return {
      id,
      startedAt: this.now(),
      stage: candidate.usesEquippedItem ? 'UNEQUIP' : 'MUTATE',
      ...clone(candidate),
      targetLevel: candidate.level + 1,
      transactionId: null,
      originalInventoryIndex: candidate.indices && candidate.indices[0] != null ? candidate.indices[0] : null
    };
  }

  authorizesRequest(request, index, entry) {
    const p = this.pending;
    if (!p || !request || !(request.metadata && request.metadata.selfGear === true) || String(request.metadata.selfGearOperationId || '') !== String(p.id)) return false;
    if (String(request.type || '').toUpperCase() !== p.type || String(entry && entry.name || '') !== p.item || levelOf(entry) !== p.level) return false;
    return Array.isArray(request.indices) ? request.indices.map(Number).includes(Number(index)) : Number(request.index) === Number(index);
  }

  authorizesTransaction(tx, index, entry) {
    const p = this.pending;
    if (!p || !tx || !(tx.metadata && tx.metadata.selfGear === true) || String(tx.metadata.selfGearOperationId || '') !== String(p.id)) return false;
    if (String(tx.type || '') !== p.type || String(entry && entry.name || '') !== p.item || levelOf(entry) !== p.level) return false;
    return Array.isArray(tx.indices) ? tx.indices.map(Number).includes(Number(index)) : Number(tx.index) === Number(index);
  }

  _findResult(level) {
    return inventoryOf(this.root).find((row) => row && row.name === this.pending.item && levelOf(row) === level && !row.locked && !row.l && !row.special && !row.p) || null;
  }

  async _unequip() {
    const p = this.pending;
    const c = characterOf(this.runtime);
    if (!p || !c || !slotItem(c, p.slot) || this._freeSlots() < 1) return false;
    if (!this.runtime.adapter || typeof this.runtime.adapter.command !== 'function') return false;
    const command = this.runtime.adapter.command('unequip', [p.slot]);
    if (!command || command.executed !== true) return false;
    await Promise.resolve(command.value);
    const verified = await this.atomic.verifyEventually(() => {
      const live = characterOf(this.runtime);
      return !slotItem(live, p.slot) && !!inventoryOf(this.root).find((row) => row && row.name === p.item && levelOf(row) === p.level);
    });
    if (!verified) return false;
    const row = inventoryOf(this.root).find((item) => item && item.name === p.item && levelOf(item) === p.level && !item.locked && !item.l && !item.special && !item.p);
    if (!row) return false;
    p.indices = [row.index];
    p.originalInventoryIndex = row.index;
    p.stage = 'MUTATE';
    this.stats.equippedUnequips += 1;
    this.lastAction = { at: this.now(), action: 'UNEQUIP', result: 'VERIFIED', operationId: p.id, slot: p.slot, item: p.item, index: row.index };
    this._event('MERCHANT_SELF_GEAR_UNEQUIPPED', 'info', 'READY_FOR_CONTROLLED_UPGRADE', this.lastAction);
    return true;
  }

  async _mutate() {
    const p = this.pending;
    if (!p || !Array.isArray(p.indices) || !p.indices.length) return false;
    const ledger = this.runtime.inventoryLedger;
    if (!ledger || typeof ledger.get !== 'function') return false;
    for (const index of p.indices) if (!ledger.get(characterOf(this.runtime).name, index)) return false;
    const request = {
      type: p.type,
      character: characterOf(this.runtime).name,
      index: p.indices[0],
      indices: p.indices.slice(),
      metadata: {
        source: 'ALPHA27_MERCHANT_SELF_GEAR',
        selfGear: true,
        selfGearOperationId: p.id,
        selfGearSlot: p.slot,
        targetLevel: p.targetLevel
      }
    };
    const planned = this.runtime.transactionEngine.planAtomic(request, { ledger: this.runtime.inventoryLedger, snapshot: this.runtime.lastSnapshot });
    if (!planned || planned.accepted !== true || !planned.transaction) {
      this.lastAction = { at: this.now(), action: 'MUTATE', result: 'WAIT', reason: planned && planned.reason || 'SELF_GEAR_TRANSACTION_PLAN_REJECTED', operationId: p.id };
      return false;
    }
    p.transactionId = planned.transaction.id;
    const result = await this.runtime.controlledMerchant.execute(planned.transaction.id);
    this.lastAction = { at: this.now(), action: p.type, result: clone(result), operationId: p.id, transactionId: planned.transaction.id };
    if (!result || result.committed !== true) {
      if (result && result.released === true) { this.pending = null; return true; }
      this.stats.failures += 1;
      if (p.usesEquippedItem) p.stage = 'REEQUIP_FALLBACK';
      else this.pending = null;
      return true;
    }
    this.stats.mutationsCommitted += 1;
    if (p.type === 'UPGRADE') this.stats.spareUpgrades += p.usesEquippedItem ? 0 : 1;
    else this.stats.compoundsFromSpares += 1;
    p.outcome = result.outcome || null;
    p.stage = result.outcome === 'SUCCESS' ? 'EQUIP_RESULT' : p.usesEquippedItem ? 'REEQUIP_FALLBACK' : 'DONE';
    return true;
  }

  async _equip(level, reason) {
    const p = this.pending;
    const item = this._findResult(level);
    if (!p || !item || !this.runtime.adapter || typeof this.runtime.adapter.command !== 'function') return false;
    const command = this.runtime.adapter.command('equip', [item.index, p.slot]);
    if (!command || command.executed !== true) return false;
    await Promise.resolve(command.value);
    const verified = await this.atomic.verifyEventually(() => {
      const equipped = slotItem(characterOf(this.runtime), p.slot);
      return !!equipped && equipped.name === p.item && levelOf(equipped) === level;
    });
    if (!verified) return false;
    this.stats.reequips += 1;
    this.lastAction = { at: this.now(), action: 'EQUIP', result: 'VERIFIED', reason, operationId: p.id, slot: p.slot, item: p.item, level };
    this._event('MERCHANT_SELF_GEAR_EQUIPPED', 'info', reason, this.lastAction);
    this.pending = null;
    return true;
  }

  async cycle() {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant' || String(this.runtime.adapter && this.runtime.adapter.mode || '') !== 'active') return false;
    if (this.atomic.merchantInCombat() || this.atomic.merchantBusy || this.atomic.serviceTravelBusy) return false;

    if (!this.pending) {
      const candidate = this._candidate();
      if (!candidate) return false;
      if (candidate.usesEquippedItem && this._freeSlots() < 1) { this.stats.holds += 1; return false; }
      this.stats.candidates += 1;
      this.pending = this._operation(candidate);
      this._event('MERCHANT_SELF_GEAR_STARTED', 'info', 'EQUIPPED_GEAR_IMPROVEMENT', clone(this.pending));
    }

    const p = this.pending;
    if (p.stage === 'UNEQUIP') return this._unequip();
    if (p.stage === 'MUTATE') return this._mutate();
    if (p.stage === 'EQUIP_RESULT') return this._equip(p.targetLevel, 'SELF_GEAR_IMPROVEMENT_COMMITTED');
    if (p.stage === 'REEQUIP_FALLBACK') {
      if (await this._equip(p.level, 'SELF_GEAR_MUTATION_FAILED_REEQUIP_SURVIVOR')) return true;
      this.stats.failures += 1;
      this.lastAction = { at: this.now(), action: 'HOLD', result: 'FAILED_SAFE', reason: 'SELF_GEAR_FALLBACK_NOT_AVAILABLE', operationId: p.id, slot: p.slot, item: p.item, level: p.level };
      this._event('MERCHANT_SELF_GEAR_FAILED_SAFE', 'error', this.lastAction.reason, this.lastAction);
      this.pending = null;
      return true;
    }
    if (p.stage === 'DONE') { this.pending = null; return true; }
    return false;
  }

  status() {
    return {
      mode: SELF_GEAR_MODE,
      active: !!this.pending,
      pending: clone(this.pending),
      lastAction: clone(this.lastAction),
      policy: {
        spareUpgradePreferred: true,
        compoundRequiresThreeInventorySpares: true,
        equippedUpgradeMayTemporarilyUnequip: true,
        reEquipVerifiedAfterMutation: true,
        mutationRiskBudgetRespected: true
      },
      stats: clone(this.stats)
    };
  }
}

module.exports = { Alpha27MerchantSelfGear, SELF_GEAR_MODE };
