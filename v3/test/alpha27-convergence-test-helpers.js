'use strict';

const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');


function makeEngine(now = () => 1000) {
  let seq = 0;
  const engine = {
    now,
    capacity: 128,
    leaseMs: 30000,
    transactions: new Map(),
    reservations: new Map(),
    stats: { planned: 0, rejected: 0, reconciled: 0, committed: 0, failedSafe: 0 },
    breaker() { return { open: false }; },
    _reject(reason, data = {}) { this.stats.rejected += 1; return { accepted: false, reason, data }; },
    _evictIfNeeded() {},
    _id(type) { seq += 1; return `tx-${type.toLowerCase()}-${seq}`; },
    _event() {},
    save() { return true; },
    _release(row) { if (row && row.reservationKey && this.reservations.get(row.reservationKey) === row.id) this.reservations.delete(row.reservationKey); },
    plan(request = {}, context = {}) {
      const entry = context.ledger && context.ledger.get(request.character, request.index);
      if (!entry) return this._reject('LEDGER_ITEM_NOT_FOUND');
      const id = this._id(request.type);
      const row = { id, type: request.type, state: 'RESERVED', character: request.character, index: request.index, quantity: request.quantity || 1, reservationKey: entry.key, item: entry.name, level: entry.level || 0, disposition: entry.disposition, leaseExpiresAt: now() + 30000 };
      this.transactions.set(id, row); this.reservations.set(entry.key, id); return { accepted: true, transaction: { ...row } };
    },
    get(id) { const row = this.transactions.get(String(id)); return row ? JSON.parse(JSON.stringify(row)) : null; },
    list() { return [...this.transactions.values()].map((x) => JSON.parse(JSON.stringify(x))); },
    transition(id, state, reason) { const row = this.transactions.get(String(id)); if (!row) return false; row.state = state; row.reason = reason; return true; },
    markCommitted(id, evidence) { const row = this.transactions.get(String(id)); if (!row) return false; row.state = 'COMMITTED'; row.evidence = evidence; this._release(row); this.stats.committed += 1; return true; },
    markFailedSafe(id, reason) { const row = this.transactions.get(String(id)); if (!row) return false; row.state = 'FAILED_SAFE'; row.reason = reason; this._release(row); this.stats.failedSafe += 1; return true; },
    status() { return { circuits: { SELL: { open: false }, BANK: { open: false }, UPGRADE: { open: false }, COMPOUND: { open: false } }, liveExecutionEnabled: false, liveFamilies: [] }; }
  };
  return engine;
}

function makeControlledMerchant() {
  return {
    enabled: false, sellEnabled: false, bankEnabled: false, busy: false,
    stats: { attempts: 0, committed: 0, rejected: 0, failedSafe: 0 },
    lastAction: null,
    configure(config = {}) { this.enabled = config.enabled === true && config.ack === 'CONTROLLED_CANARY'; this.sellEnabled = this.enabled && config.sell === true; this.bankEnabled = this.enabled && config.bank === true; return this.status(); },
    disable() { this.enabled = false; this.sellEnabled = false; this.bankEnabled = false; return this.status(); },
    async execute() { return { executed: false, committed: false, reason: 'BASE_EXECUTOR' }; },
    status() { return { enabled: this.enabled, sellEnabled: this.sellEnabled, bankEnabled: this.bankEnabled, actionAuthority: this.enabled, boundedActionFamilies: ['SELL', 'BANK'], lastAction: this.lastAction }; }
  };
}

function makeLedger(entries, extra = {}) {
  const map = new Map(entries.map((e) => [`${e.character}:${e.index}`, { key: `${e.character}:${e.index}`, q: 1, level: 0, actionAuthority: false, ...e }]));
  return {
    entries: map,
    status() { return { stale: false, policy: {} }; },
    get(character, index) { return map.get(`${character}:${index}`) || null; },
    list() { return [...map.values()].map((x) => ({ ...x })); },
    _baseDisposition(row) { return { disposition: 'UNDECIDED', reasons: ['NO_POLICY_MATCH'] }; },
    _resolveSellBlockers() { return []; },
    ...extra
  };
}

function makeRuntime({ root, ledger, engine, controlledMerchant, gameData, gearGoals = [], performance = null, world = null, team = null, focus = null, cohesion = null, service = null } = {}) {
  const runtime = {
    root: root || { character: { name: 'Merchant', ctype: 'merchant', items: [], gold: 2000000 }, parent: { entities: {} } },
    now: () => 1000,
    log: { emit() {} },
    tick() {},
    adapter: { mode: 'active', getGameData: () => gameData || { items: {}, monsters: {}, maps: {} } },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    inventoryLedger: ledger || null,
    transactionEngine: engine || null,
    controlledMerchant: controlledMerchant || null,
    controlledMerchantService: service || null,
    gearProgression: { list: () => gearGoals.map((x) => ({ ...x })) },
    contentDrift: { requiresRevalidation: () => false },
    performance,
    world,
    teamCombatCohesionHotfix: team,
    partyFocusFireHotfix: focus,
    teamCohesionDeadlockHotfix: cohesion
  };
  runtime.planEconomyTransaction = (request) => runtime.transactionEngine.plan(request, { ledger: runtime.inventoryLedger });
  runtime.reconcileEconomyTransaction = () => ({ reconciled: false });
  return runtime;
}


function mutationFixture(type, { missingScroll = false, failedRoll = false } = {}) {
  const engine = makeEngine();
  const controlledMerchant = makeControlledMerchant();
  const root = { character: { name: 'Merchant', ctype: 'merchant', gold: 2000000, target: null, items: [], isize: 42, map: 'main', x: 0, y: 0 }, parent: { entities: {} } };
  root.__serviceTravel = [];
  root.smart_move = async (destination) => { root.__serviceTravel.push(String(destination)); return { success: true }; };
  root.stop = async () => ({ success: true });
  let entries;
  let gameData;
  let gearGoals = [];
  if (type === 'UPGRADE') {
    root.character.items[0] = { name: 'sword', level: 0 };
    if (!missingScroll) root.character.items[1] = { name: 'scroll0', level: 0, q: 1 };
    entries = [{ character: 'Merchant', index: 0, name: 'sword', level: 0, disposition: 'RESERVE_UPGRADE' }];
    gameData = { items: { sword: { upgrade: true, g: 1000, grades: [] }, scroll0: { g: 100 } }, monsters: {}, maps: {} };
    gearGoals = [{ id: 'goal-1', sourceCharacter: 'Merchant', character: 'Farmer', item: 'sword', observedLevel: 0, targetLevel: 1, projectedUpgradeRequired: true }];
    root.upgrade = async (_item, _scroll, _offering, onlyCalculate) => {
      if (onlyCalculate === true) return { success: true, chance: 0.99 };
      root.character.items[1] = null;
      if (!failedRoll) root.character.items[0] = { name: 'sword', level: 1 };
      return { success: true };
    };
    root.can_buy = () => true;
    root.buy = async (name, q) => { root.character.gold -= 100 * q; root.character.items[1] = { name, level: 0, q }; return { success: true }; };
  } else {
    for (let i = 0; i < 3; i += 1) root.character.items[i] = { name: 'ring', level: 0 };
    root.character.items[3] = { name: 'cscroll0', level: 0, q: 1 };
    entries = [0, 1, 2].map((index) => ({ character: 'Merchant', index, name: 'ring', level: 0, disposition: 'RESERVE_COMPOUND' }));
    gameData = { items: { ring: { compound: true, g: 1000, grades: [] }, cscroll0: { g: 100 } }, monsters: {}, maps: {} };
    root.compound = async (_a, _b, _c, _scroll, _offering, onlyCalculate) => {
      if (onlyCalculate === true) return { success: true, chance: 0.99 };
      root.character.items[0] = failedRoll ? null : { name: 'ring', level: 1 };
      root.character.items[1] = null; root.character.items[2] = null; root.character.items[3] = null;
      return { success: true };
    };
  }
  const ledger = makeLedger(entries);
  const runtime = makeRuntime({ root, ledger, engine, controlledMerchant, gameData, gearGoals });
  const convergence = new Alpha27CombatMerchantConvergence(runtime, { verifyAttempts: 1, verifyDelayMs: 25, goldReserve: 1000000 });
  controlledMerchant.configure({ enabled: true, ack: 'CONTROLLED_CANARY', sell: true, bank: true, upgrade: true, compound: true });
  return { runtime, convergence, engine, ledger, root };
}

module.exports = { makeEngine, makeControlledMerchant, makeLedger, makeRuntime, mutationFixture };
