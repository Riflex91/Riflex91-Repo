'use strict';

const CONTROLLED_BANK_CONSOLIDATION_MODE = 'controlled-live-default-off';
const CONTROLLED_BANK_CONSOLIDATION_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function snap(item) {
  if (!item || !item.name) return null;
  return {
    name: String(item.name),
    level: Math.max(0, Math.floor(finite(item.level, 0))),
    q: Math.max(1, Math.floor(finite(item.q, 1))),
    locked: item.l === true || item.locked === true,
    special: !!(item.p || item.special)
  };
}
function sameIdentity(a, b) {
  return !!a && !!b && a.name === b.name && a.level === b.level;
}
function identityQuantity(items, name, level) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const row = snap(item);
    return row && row.name === name && row.level === level ? sum + row.q : sum;
  }, 0);
}

class ControlledBankConsolidationExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.getGameData = options.getGameData || (() => ({}));
    this.timeoutMs = Math.max(1000, Math.min(30000, finite(options.timeoutMs, 8000)));
    this.verifyDelayMs = Math.max(0, Math.min(1000, finite(options.verifyDelayMs, 150)));
    this.verifyAttempts = Math.max(1, Math.min(20, Math.floor(finite(options.verifyAttempts, 10))));
    this.enabled = false;
    this.busy = false;
    this.lastAction = null;
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, rawCalls: 0, verificationRetries: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-bank-consolidation', event, severity, reason, data });
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== CONTROLLED_BANK_CONSOLIDATION_ACK) {
      this.enabled = false;
      this._event('CONTROLLED_BANK_CONSOLIDATION_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this._event('CONTROLLED_BANK_CONSOLIDATION_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED', { enabled: this.enabled });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._event('CONTROLLED_BANK_CONSOLIDATION_DISABLED', 'warn', reason);
    return this.status();
  }

  _inCombat() {
    const character = this.root && this.root.character || {};
    if (character.target) return true;
    const entities = this.root && ((this.root.parent && this.root.parent.entities) || this.root.entities) || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _inventoryWorkspace(character) {
    const items = Array.isArray(character.items) ? character.items : [];
    const reported = Number(character.isize);
    const size = Number.isFinite(reported) ? Math.max(0, Math.floor(reported)) : items.length;
    for (let i = 0; i < size; i += 1) if (!items[i]) return i;
    return -1;
  }

  _preflight(plan) {
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_BANK_CONSOLIDATION_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_BANK_CONSOLIDATION_BUSY' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this.root && this.root.character;
    if (!character || String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
    if (!plan || plan.action !== 'CONSOLIDATE_BANK_STACKS' || !plan.pack || !plan.move) return { ok: false, reason: 'CONSOLIDATION_PLAN_REQUIRED' };
    if (typeof this.root.bank_retrieve !== 'function' || typeof this.root.bank_store !== 'function') return { ok: false, reason: 'OFFICIAL_BANK_API_UNAVAILABLE' };
    const pack = character.bank[plan.pack];
    if (!Array.isArray(pack)) return { ok: false, reason: 'BANK_PACK_NOT_UNLOCKED' };
    const fromIndex = Number(plan.move.fromIndex);
    const toIndex = Number(plan.move.toIndex);
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || fromIndex >= pack.length || toIndex >= pack.length) return { ok: false, reason: 'CONSOLIDATION_INDEX_INVALID' };
    const source = snap(pack[fromIndex]);
    const target = snap(pack[toIndex]);
    if (!source || !target || !sameIdentity(source, target)) return { ok: false, reason: 'CONSOLIDATION_IDENTITY_CHANGED' };
    if (source.locked || source.special || target.locked || target.special) return { ok: false, reason: 'CONSOLIDATION_ITEM_PROTECTED' };
    if (source.name !== String(plan.move.name || '') || source.level !== Math.max(0, Math.floor(finite(plan.move.level, 0)))) return { ok: false, reason: 'CONSOLIDATION_PLAN_STALE' };
    const gameData = this.getGameData() || {};
    const meta = gameData.items && gameData.items[source.name];
    const stackMax = Math.max(1, Math.floor(finite(meta && meta.s, 1)));
    if (!meta || stackMax <= 1) return { ok: false, reason: 'CONSOLIDATION_STACK_METADATA_UNAVAILABLE' };
    if (source.q + target.q > stackMax) return { ok: false, reason: 'CONSOLIDATION_STACK_OVERFLOW' };
    const workspace = this._inventoryWorkspace(character);
    if (workspace < 0) return { ok: false, reason: 'NO_INVENTORY_WORKSPACE' };
    const bankPacks = this.root.bank_packs || (this.root.parent && this.root.parent.bank_packs) || {};
    const catalog = bankPacks && bankPacks[plan.pack];
    const owningMap = Array.isArray(catalog) ? catalog[0] : catalog && (catalog.map || catalog.place);
    if (owningMap && String(owningMap) !== String(character.map || '')) return { ok: false, reason: 'WRONG_BANK_FLOOR' };
    return { ok: true, character, pack, fromIndex, toIndex, source, target, workspace, stackMax };
  }

  _timeout(promise, label) {
    let timer;
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    const clearTimer = this.root && this.root.clearTimeout || clearTimeout;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error(`${label}_TIMEOUT`)), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }

  _sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    return new Promise((resolve) => setTimer(resolve, ms));
  }

  async _eventually(check) {
    let result = check();
    for (let attempt = 1; !result.ok && attempt < this.verifyAttempts; attempt += 1) {
      this.stats.verificationRetries += 1;
      await this._sleep(this.verifyDelayMs);
      result = check();
    }
    return result;
  }

  _afterRetrieve(check, beforeTotal) {
    const character = this.root.character;
    const pack = character.bank && character.bank[check.packName];
    const inventoryItem = snap(character.items && character.items[check.workspace]);
    const sourceAfter = Array.isArray(pack) ? snap(pack[check.fromIndex]) : null;
    const bankTotal = Array.isArray(pack) ? identityQuantity(pack, check.name, check.level) : -1;
    const inventoryTotal = identityQuantity(character.items, check.name, check.level);
    return {
      ok: !sourceAfter && inventoryItem && inventoryItem.name === check.name && inventoryItem.level === check.level && inventoryItem.q === check.sourceQ && bankTotal + inventoryTotal === beforeTotal,
      sourceAfter,
      inventoryItem,
      bankTotal,
      inventoryTotal,
      beforeTotal
    };
  }

  _afterStore(check, beforeTotal) {
    const character = this.root.character;
    const pack = character.bank && character.bank[check.packName];
    const sourceAfter = Array.isArray(pack) ? snap(pack[check.fromIndex]) : null;
    const targetAfter = Array.isArray(pack) ? snap(pack[check.toIndex]) : null;
    const workspaceAfter = snap(character.items && character.items[check.workspace]);
    const bankTotal = Array.isArray(pack) ? identityQuantity(pack, check.name, check.level) : -1;
    const inventoryTotal = identityQuantity(character.items, check.name, check.level);
    return {
      ok: !sourceAfter && targetAfter && targetAfter.name === check.name && targetAfter.level === check.level && targetAfter.q === check.combinedQ && !workspaceAfter && bankTotal + inventoryTotal === beforeTotal,
      sourceAfter,
      targetAfter,
      workspaceAfter,
      bankTotal,
      inventoryTotal,
      beforeTotal
    };
  }

  async execute(plan) {
    const preflight = this._preflight(plan);
    if (!preflight.ok) {
      this.stats.rejected += 1;
      this._event('CONTROLLED_BANK_CONSOLIDATION_REJECTED', 'warn', preflight.reason);
      return { executed: false, committed: false, reason: preflight.reason, rawActions: 0 };
    }
    this.busy = true;
    this.stats.attempts += 1;
    const name = preflight.source.name;
    const level = preflight.source.level;
    const beforeTotal = identityQuantity(preflight.pack, name, level) + identityQuantity(preflight.character.items, name, level);
    const proof = {
      packName: String(plan.pack),
      fromIndex: preflight.fromIndex,
      toIndex: preflight.toIndex,
      workspace: preflight.workspace,
      name,
      level,
      sourceQ: preflight.source.q,
      targetQ: preflight.target.q,
      combinedQ: preflight.source.q + preflight.target.q
    };
    let rawActions = 0;
    try {
      this._event('CONTROLLED_BANK_CONSOLIDATION_STARTED', 'warn', 'CONTROLLED_CANARY', clone(proof));
      const retrieveResponse = await this._timeout(this.root.bank_retrieve(proof.packName, proof.fromIndex, proof.workspace), 'BANK_RETRIEVE');
      rawActions += 1;
      this.stats.rawCalls += 1;
      if (retrieveResponse && retrieveResponse.failed === true) throw new Error(String(retrieveResponse.reason || 'BANK_RETRIEVE_FAILED'));
      const retrieved = await this._eventually(() => this._afterRetrieve(proof, beforeTotal));
      if (!retrieved.ok) {
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason: 'RETRIEVE_STATE_UNCONFIRMED', rawActions, proof: clone(proof), verification: clone(retrieved) };
        this._event('CONTROLLED_BANK_CONSOLIDATION_FAILED_SAFE', 'error', this.lastAction.reason, this.lastAction);
        return { executed: true, committed: false, reason: this.lastAction.reason, rawActions, verification: retrieved };
      }
      const storeResponse = await this._timeout(this.root.bank_store(proof.workspace, proof.packName, proof.toIndex), 'BANK_STORE');
      rawActions += 1;
      this.stats.rawCalls += 1;
      if (storeResponse && storeResponse.failed === true) throw new Error(String(storeResponse.reason || 'BANK_STORE_FAILED'));
      const stored = await this._eventually(() => this._afterStore(proof, beforeTotal));
      if (!stored.ok) {
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason: 'CONSOLIDATION_STATE_UNCONFIRMED', rawActions, proof: clone(proof), verification: clone(stored) };
        this._event('CONTROLLED_BANK_CONSOLIDATION_FAILED_SAFE', 'error', this.lastAction.reason, this.lastAction);
        return { executed: true, committed: false, reason: this.lastAction.reason, rawActions, verification: stored };
      }
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), result: 'COMMITTED', reason: 'VERIFIED_CONSOLIDATION', rawActions, proof: clone(proof), verification: clone(stored) };
      this._event('CONTROLLED_BANK_CONSOLIDATION_COMMITTED', 'info', this.lastAction.reason, this.lastAction);
      return { executed: true, committed: true, reason: this.lastAction.reason, rawActions, verification: stored, proof: clone(proof) };
    } catch (error) {
      this.stats.failedSafe += 1;
      const reason = String(error && error.message || error || 'CONSOLIDATION_FAILED_SAFE');
      this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason, rawActions, proof: clone(proof) };
      this._event('CONTROLLED_BANK_CONSOLIDATION_FAILED_SAFE', 'error', reason, this.lastAction);
      return { executed: rawActions > 0, committed: false, reason, rawActions, proof: clone(proof) };
    } finally {
      this.busy = false;
    }
  }

  status() {
    return {
      mode: CONTROLLED_BANK_CONSOLIDATION_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      explicitAckRequired: CONTROLLED_BANK_CONSOLIDATION_ACK,
      rawActionAttemptLimit: 2,
      strategy: 'bank_retrieve-verify-targeted-bank_store-verify',
      busy: this.busy,
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  ControlledBankConsolidationExecutor,
  CONTROLLED_BANK_CONSOLIDATION_MODE,
  CONTROLLED_BANK_CONSOLIDATION_ACK
};
