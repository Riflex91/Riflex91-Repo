'use strict';

const { scoreItem, scoreImprovement, candidateSlots } = require('../economy/gear-progression');

const MERCHANT_PRODUCTION_PLANNER_MODE = 'deterministic-merchant-production-planner';

const ProductionStepKind = Object.freeze({
  BANK_RETRIEVE: 'BANK_RETRIEVE',
  BANK_STORE: 'BANK_STORE',
  BUY: 'BUY',
  CRAFT: 'CRAFT',
  EXCHANGE: 'EXCHANGE',
  FARM_REQUIRED: 'FARM_REQUIRED'
});

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function levelOf(item) {
  return Math.max(0, Math.floor(finite(item && item.level, 0)));
}

function itemKey(name, level = 0) {
  return `${String(name || '')}|${Math.max(0, Math.floor(finite(level, 0)))}`;
}

function itemQuantity(items, name, level = 0) {
  const wanted = itemKey(name, level);
  let total = 0;
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || itemKey(item.name, item.level) !== wanted) continue;
    total += Math.max(1, Math.floor(finite(item.q, 1)));
  }
  return total;
}

function recipeFor(gameData, name) {
  const raw = gameData && gameData.craft && gameData.craft[name];
  if (!raw || !Array.isArray(raw.items) || !raw.items.length) return null;
  const items = [];
  for (const row of raw.items) {
    if (!Array.isArray(row) || !row[1]) return null;
    items.push({
      quantity: Math.max(1, Math.floor(finite(row[0], 1))),
      name: String(row[1]),
      level: Math.max(0, Math.floor(finite(row[2], 0)))
    });
  }
  return {
    output: String(name),
    outputQuantity: Math.max(1, Math.floor(finite(raw.q, finite(raw.quantity, 1)))),
    cost: Math.max(0, Math.floor(finite(raw.cost, 0))),
    items
  };
}

function compatible(meta, character) {
  if (!meta || !character) return false;
  const classes = Array.isArray(meta.class) ? meta.class : meta.class ? [meta.class] : [];
  if (classes.length && !classes.map((x) => String(x).toLowerCase()).includes(String(character.ctype || '').toLowerCase())) return false;
  const required = Math.max(0, finite(meta.level, 0));
  return required <= Math.max(0, finite(character.level, 0));
}

function currentItem(character, slot, gameData) {
  const equipped = character && character.gear && character.gear[slot];
  if (!equipped || !equipped.name) return { name: null, level: 0, score: { total: 0, survival: 0 } };
  const meta = gameData && gameData.items && gameData.items[equipped.name];
  return {
    name: String(equipped.name),
    level: levelOf(equipped),
    score: scoreItem(meta, levelOf(equipped), character.ctype)
  };
}

function registryCharacters(registry) {
  const status = registry && typeof registry.status === 'function' ? registry.status() : registry;
  return Array.isArray(status && status.characters) ? status.characters.filter((row) => row && row.name && row.ctype) : [];
}

function bankRows(bank) {
  const rows = [];
  if (!bank || typeof bank !== 'object') return rows;
  for (const [pack, items] of Object.entries(bank)) {
    if (!/^items\d+$/.test(String(pack)) || !Array.isArray(items)) continue;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item || !item.name) continue;
      rows.push({
        pack: String(pack),
        index,
        name: String(item.name),
        level: levelOf(item),
        quantity: Math.max(1, Math.floor(finite(item.q, 1)))
      });
    }
  }
  return rows;
}

function vendorItemName(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] == null ? null : String(value[0]);
  if (value && typeof value === 'object') return value.name == null ? null : String(value.name);
  return null;
}

function vendorIndex(gameData) {
  const out = new Map();
  const npcDefs = gameData && gameData.npcs || {};
  const maps = gameData && gameData.maps || {};
  for (const [mapName, map] of Object.entries(maps)) {
    for (const row of Array.isArray(map && map.npcs) ? map.npcs : []) {
      const npcId = Array.isArray(row) ? row[0] : row && (row.id || row.name);
      if (!npcId) continue;
      const def = npcDefs[npcId] || {};
      const stock = [].concat(def.items || def.sells || []);
      let x = null; let y = null;
      if (Array.isArray(row)) {
        x = finite(row[1]); y = finite(row[2]);
      } else if (row && typeof row === 'object') {
        const pos = Array.isArray(row.position) ? row.position : null;
        x = finite(row.x, pos ? finite(pos[0]) : null);
        y = finite(row.y, pos ? finite(pos[1]) : null);
      }
      for (const value of stock) {
        const name = vendorItemName(value);
        if (!name) continue;
        if (!out.has(name)) out.set(name, []);
        out.get(name).push({ npc: String(npcId), map: String(mapName), x, y });
      }
    }
  }
  return out;
}

class MerchantProductionPlanner {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.maxDepth = Math.max(1, Math.min(12, Math.floor(finite(options.maxDepth, 7))));
    this.minImprovementRatio = Math.max(0, Math.min(1, finite(options.minImprovementRatio, 0.04)));
    this.goldReserve = Math.max(0, Math.floor(finite(options.goldReserve, 1000000)));
    this.maxBuyQuantity = Math.max(1, Math.min(10000, Math.floor(finite(options.maxBuyQuantity, 1000))));
    this.explicitTargets = Array.isArray(options.targets) ? options.targets.filter(Boolean).map(String) : [];
    this.sequence = 0;
    this.lastPlan = null;
    this.stats = { plans: 0, ready: 0, blocked: 0, holds: 0, candidates: 0, cyclesRejected: 0, depthRejected: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'merchant-production-planner', event, severity, reason, data });
  }

  _id() {
    this.sequence += 1;
    return `production-${this.now().toString(36)}-${this.sequence.toString(36)}`;
  }

  _hold(reason, data = {}) {
    const plan = { schemaVersion: 1, id: this._id(), at: this.now(), state: 'HOLD', reason, actionAuthority: false, liveExecutionAllowed: false, steps: [], reservations: {}, ...clone(data) };
    this.lastPlan = plan;
    this.stats.plans += 1;
    this.stats.holds += 1;
    return clone(plan);
  }

  _candidateOutputs(gameData, registry) {
    const characters = registryCharacters(registry);
    const craft = gameData && gameData.craft || {};
    const candidates = [];
    const targetRank = new Map(this.explicitTargets.map((name, index) => [name, index]));
    for (const output of Object.keys(craft)) {
      if (this.explicitTargets.length && !targetRank.has(output)) continue;
      const recipe = recipeFor(gameData, output);
      const meta = gameData && gameData.items && gameData.items[output];
      if (!recipe || !meta) continue;
      const slots = candidateSlots(meta);
      if (!slots.length) continue;
      for (const character of characters) {
        if (!compatible(meta, character)) continue;
        const target = scoreItem(meta, 0, character.ctype);
        let best = null;
        for (const slot of slots) {
          const current = currentItem(character, slot, gameData);
          const delta = scoreImprovement(current.score, target, character.ctype, this.minImprovementRatio);
          if (!delta.meaningful) continue;
          const row = {
            slot,
            current,
            improvement: delta.improvement,
            survivalImprovement: delta.survivalImprovement,
            speedImprovement: delta.speedImprovement,
            improvementReason: delta.reason
          };
          const merchantTarget = String(character.ctype || '').toLowerCase() === 'merchant';
          const better = !best
            || (merchantTarget
              ? (row.speedImprovement > best.speedImprovement
                || (row.speedImprovement === best.speedImprovement && row.improvement > best.improvement)
                || (row.speedImprovement === best.speedImprovement && row.improvement === best.improvement && row.survivalImprovement > best.survivalImprovement))
              : (row.improvement > best.improvement
                || (row.improvement === best.improvement && row.survivalImprovement > best.survivalImprovement)));
          if (better) best = row;
        }
        if (!best) continue;
        candidates.push({
          output,
          recipe,
          recipient: String(character.name),
          ctype: String(character.ctype),
          slot: best.slot,
          currentItem: best.current.name,
          currentLevel: best.current.level,
          improvement: best.improvement,
          survivalImprovement: best.survivalImprovement,
          speedImprovement: best.speedImprovement,
          improvementReason: best.improvementReason,
          targetRank: targetRank.has(output) ? targetRank.get(output) : Infinity
        });
      }
    }
    candidates.sort((a, b) => {
      if (a.targetRank !== b.targetRank) return a.targetRank - b.targetRank;
      const aMerchant = String(a.ctype || '').toLowerCase() === 'merchant';
      const bMerchant = String(b.ctype || '').toLowerCase() === 'merchant';
      if (aMerchant && bMerchant && finite(a.speedImprovement, 0) !== finite(b.speedImprovement, 0)) {
        return finite(b.speedImprovement, 0) - finite(a.speedImprovement, 0);
      }
      if ((a.survivalImprovement > 0) !== (b.survivalImprovement > 0)) return a.survivalImprovement > 0 ? -1 : 1;
      return b.improvement - a.improvement || b.survivalImprovement - a.survivalImprovement || a.output.localeCompare(b.output) || a.recipient.localeCompare(b.recipient);
    });
    this.stats.candidates += candidates.length;
    return candidates;
  }

  _buildCandidate(candidate, input) {
    const character = input.character || {};
    const gameData = input.gameData || {};
    const inventory = Array.isArray(character.items) ? character.items : [];
    const bank = bankRows(character.bank);
    const vendors = vendorIndex(gameData);
    const localPool = new Map();
    const reservations = {};
    const steps = [];
    const blockers = [];
    let totalGold = 0;
    const catalogRows = !character.bank && input.bankCatalog && input.bankCatalog.usable === true && input.bankCatalog.snapshot && Array.isArray(input.bankCatalog.snapshot.rows)
      ? input.bankCatalog.snapshot.rows
      : [];
    if (!bank.length && catalogRows.length) {
      for (const row of catalogRows) bank.push({ ...clone(row) });
    }
    const bankPool = bank.map((row) => ({ ...row, remaining: row.quantity }));

    const estimateSource = (name, level, quantity, depth = 0, path = new Set()) => {
      const need = Math.max(1, Math.floor(finite(quantity, 1)));
      const key = itemKey(name, level);
      if (depth > this.maxDepth || path.has(key) || level !== 0) return { cost: Infinity, strategy: 'UNAVAILABLE' };
      const itemMeta = gameData.items && gameData.items[name] || {};
      const unitCost = Math.max(0, Math.floor(finite(itemMeta.g, 0)));
      const vendor = (vendors.get(name) || [])[0] || null;
      const vendorCost = vendor && unitCost > 0 && need <= this.maxBuyQuantity ? unitCost * need : Infinity;
      const recipe = recipeFor(gameData, name);
      let craftCost = Infinity;
      if (recipe) {
        const nextPath = new Set(path); nextPath.add(key);
        const operations = Math.max(1, Math.ceil(need / recipe.outputQuantity));
        let materialsCost = 0;
        let possible = true;
        for (const req of recipe.items) {
          const quote = estimateSource(req.name, req.level, req.quantity * operations, depth + 1, nextPath);
          if (!Number.isFinite(quote.cost)) { possible = false; break; }
          materialsCost += quote.cost;
        }
        if (possible) craftCost = materialsCost + recipe.cost * operations;
      }
      if (craftCost < vendorCost) return { cost: craftCost, strategy: 'CRAFT', recipe };
      if (Number.isFinite(vendorCost)) return { cost: vendorCost, strategy: 'BUY', vendor, unitCost };
      if (Number.isFinite(craftCost)) return { cost: craftCost, strategy: 'CRAFT', recipe };
      return { cost: Infinity, strategy: 'UNAVAILABLE' };
    };

    for (const item of inventory) {
      if (!item || !item.name) continue;
      const key = itemKey(item.name, item.level);
      localPool.set(key, (localPool.get(key) || 0) + Math.max(1, Math.floor(finite(item.q, 1))));
    }

    const reserveLocal = (name, level, quantity) => {
      const key = itemKey(name, level);
      const have = Math.max(0, localPool.get(key) || 0);
      const take = Math.min(have, Math.max(0, quantity));
      if (take > 0) {
        localPool.set(key, have - take);
        reservations[key] = (reservations[key] || 0) + take;
      }
      return take;
    };

    const takeBank = (name, level, quantity) => {
      let need = Math.max(0, quantity);
      let supplied = 0;
      for (const row of bankPool) {
        if (need <= 0) break;
        if (row.name !== name || row.level !== level || row.remaining <= 0) continue;
        const stackQuantity = row.remaining;
        row.remaining = 0;
        supplied += stackQuantity;
        need = Math.max(0, need - stackQuantity);
        steps.push({ kind: ProductionStepKind.BANK_RETRIEVE, name, level, quantity: stackQuantity, pack: row.pack, bankIndex: row.index, reason: 'MATERIAL_IN_BANK' });
      }
      return supplied;
    };

    const acquire = (name, level, quantity, depth, path) => {
      let need = Math.max(0, Math.floor(finite(quantity, 0)));
      if (!need) return true;
      const key = itemKey(name, level);
      if (depth > this.maxDepth) {
        this.stats.depthRejected += 1;
        blockers.push({ reason: 'MAX_RECIPE_DEPTH', name, level, quantity: need, depth });
        return false;
      }
      if (path.has(key)) {
        this.stats.cyclesRejected += 1;
        blockers.push({ reason: 'RECIPE_CYCLE', name, level, quantity: need });
        return false;
      }

      need -= reserveLocal(name, level, need);
      if (need <= 0) return true;

      const bankSupplied = takeBank(name, level, need);
      if (bankSupplied > 0) {
        reservations[key] = (reservations[key] || 0) + Math.min(need, bankSupplied);
        need = Math.max(0, need - bankSupplied);
      }
      if (need <= 0) return true;

      if (level === 0) {
        const quote = estimateSource(name, level, need, depth, path);
        if (quote.strategy === 'BUY') {
          steps.push({ kind: ProductionStepKind.BUY, name, level: 0, quantity: need, unitCost: quote.unitCost, vendor: quote.vendor, estimatedPathCost: quote.cost, reason: 'LEAST_GOLD_VENDOR_SOURCE' });
          totalGold += quote.unitCost * need;
          reservations[key] = (reservations[key] || 0) + need;
          return true;
        }

        if (quote.strategy === 'CRAFT' && quote.recipe) {
          const recipe = quote.recipe;
          const nextPath = new Set(path); nextPath.add(key);
          const operations = Math.max(1, Math.ceil(need / recipe.outputQuantity));
          for (const req of recipe.items) {
            if (!acquire(req.name, req.level, req.quantity * operations, depth + 1, nextPath)) return false;
          }
          for (let i = 0; i < operations; i += 1) {
            steps.push({ kind: ProductionStepKind.CRAFT, name, level: 0, quantity: recipe.outputQuantity, cost: recipe.cost, recipe: clone(recipe), estimatedPathCost: quote.cost, reason: 'LEAST_GOLD_RECIPE_SOURCE' });
            totalGold += recipe.cost;
          }
          reservations[key] = (reservations[key] || 0) + need;
          return true;
        }
      }

      steps.push({ kind: ProductionStepKind.FARM_REQUIRED, name, level, quantity: need, reason: level > 0 ? 'LEVELED_MATERIAL_UNAVAILABLE' : 'NO_BANK_VENDOR_OR_RECIPE_SOURCE' });
      blockers.push({ reason: 'MATERIAL_FARM_REQUIRED', name, level, quantity: need });
      return false;
    };

    const rootPath = new Set([itemKey(candidate.output, 0)]);
    for (const req of candidate.recipe.items) acquire(req.name, req.level, req.quantity, 1, rootPath);
    steps.push({ kind: ProductionStepKind.CRAFT, name: candidate.output, level: 0, quantity: candidate.recipe.outputQuantity, cost: candidate.recipe.cost, recipe: clone(candidate.recipe), root: true, recipient: candidate.recipient, slot: candidate.slot, reason: 'ROOT_PRODUCTION_TARGET' });
    totalGold += candidate.recipe.cost;

    const availableGold = Math.max(0, Math.floor(finite(character.gold, 0)));
    if (availableGold - totalGold < this.goldReserve) blockers.push({ reason: 'GOLD_RESERVE_WOULD_BE_BREACHED', availableGold, totalGold, goldReserve: this.goldReserve });
    const executableSteps = steps.filter((step) => step.kind !== ProductionStepKind.FARM_REQUIRED);
    const ready = blockers.length === 0;
    return {
      ready,
      candidate: clone(candidate),
      steps,
      executableSteps,
      reservations,
      blockers,
      totalGold,
      availableGold,
      goldReserve: this.goldReserve,
      bankSource: character.bank ? 'LIVE_BANK' : catalogRows.length ? 'PERSISTED_BANK_CATALOG' : 'UNAVAILABLE',
      costStrategy: 'LEAST_GOLD_SOURCE_GRAPH_V1'
    };
  }

  planExchange(input = {}, protectedReservations = {}) {
    const character = input.character || {};
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return null;
    const gameData = input.gameData || {};
    const inventory = Array.isArray(character.items) ? character.items : [];
    const bank = bankRows(character.bank);
    const catalogRows = !character.bank && input.bankCatalog && input.bankCatalog.usable === true && input.bankCatalog.snapshot && Array.isArray(input.bankCatalog.snapshot.rows)
      ? input.bankCatalog.snapshot.rows
      : [];
    const bankPool = bank.length ? bank : catalogRows;
    const lockedExchangeItem = input.productionTaskTarget && input.productionTaskTarget.exchangeItem ? String(input.productionTaskTarget.exchangeItem) : null;
    const demands = (Array.isArray(input.exchangeDemands) ? input.exchangeDemands : [])
      .filter((row) => row && row.item && (!row.expiresAt || row.expiresAt > this.now()))
      .filter((row) => !lockedExchangeItem || String(row.item) === lockedExchangeItem);
    if (!demands.length) return null;
    const demandByItem = new Map(demands.map((row) => [String(row.item), row]));
    const candidates = [];

    for (let index = 0; index < inventory.length; index += 1) {
      const item = inventory[index];
      if (!item || !item.name || item.locked || item.l || item.special || item.p || levelOf(item) !== 0) continue;
      const meta = gameData.items && gameData.items[item.name];
      const demand = demandByItem.get(String(item.name));
      const required = Math.max(0, Math.floor(finite(meta && meta.e, 0)));
      if (!demand || !meta || required <= 0) continue;
      if (input.contentDrift && typeof input.contentDrift.requiresRevalidation === 'function') {
        try { if (input.contentDrift.requiresRevalidation('items', item.name)) continue; } catch (_) { continue; }
      }
      const reserved = Math.max(0, Math.floor(finite(protectedReservations[itemKey(item.name, 0)], 0)));
      const local = Math.max(1, Math.floor(finite(item.q, 1)));
      const usable = Math.max(0, local - reserved);
      const destination = meta.quest ? String(meta.quest) : 'exchange';
      if (usable >= required) {
        candidates.push({
          name: String(item.name), index, required, available: usable,
          operations: Math.floor(usable / required), destination,
          step: { kind: ProductionStepKind.EXCHANGE, name: String(item.name), level: 0, inventoryIndex: index, quantity: required, destination, reason: 'EXCHANGE_REQUIREMENT_SATISFIED' }
        });
        continue;
      }
      const bankRow = bankPool.find((row) => row && row.name === item.name && row.level === 0 && Number(row.quantity) + usable >= required);
      if (bankRow) {
        candidates.push({
          name: String(item.name), index, required, available: usable, operations: 1, destination,
          step: { kind: ProductionStepKind.BANK_RETRIEVE, name: String(item.name), level: 0, quantity: bankRow.quantity, pack: bankRow.pack, bankIndex: bankRow.index, reason: 'EXCHANGE_MATERIAL_IN_BANK' }
        });
      }
    }

    // Also recover an exchange stack that exists only in the bank.
    for (const row of bankPool) {
      if (!row || row.level !== 0) continue;
      const meta = gameData.items && gameData.items[row.name];
      const demand = demandByItem.get(String(row.name));
      const required = Math.max(0, Math.floor(finite(meta && meta.e, 0)));
      if (!demand || !meta || required <= 0 || row.quantity < required) continue;
      const local = itemQuantity(inventory, row.name, 0);
      const reserved = Math.max(0, Math.floor(finite(protectedReservations[itemKey(row.name, 0)], 0)));
      if (Math.max(0, local - reserved) >= required) continue;
      const destination = meta.quest ? String(meta.quest) : 'exchange';
      candidates.push({
        name: row.name, required, available: Math.max(0, local - reserved), operations: Math.floor(row.quantity / required), destination,
        step: { kind: ProductionStepKind.BANK_RETRIEVE, name: row.name, level: 0, quantity: row.quantity, pack: row.pack, bankIndex: row.index, reason: 'EXCHANGE_MATERIAL_IN_BANK' }
      });
    }

    candidates.sort((a, b) => b.operations - a.operations || a.required - b.required || a.name.localeCompare(b.name));
    const chosen = candidates[0];
    if (!chosen) return null;
    const plan = {
      schemaVersion: 1,
      id: this._id(),
      at: this.now(),
      state: 'READY',
      reason: 'NPC_EXCHANGE_READY',
      actionAuthority: false,
      liveExecutionAllowed: false,
      target: { item: chosen.name, operations: chosen.operations, required: chosen.required, destination: chosen.destination },
      steps: [chosen.step],
      nextStep: chosen.step,
      reservations: {},
      blockers: [],
      totalGold: 0,
      goldReserve: this.goldReserve,
      costStrategy: 'EXCHANGE_EXACT_REQUIREMENT_V2_DEMAND_DRIVEN',
      exchangeDemand: clone(demandByItem.get(chosen.name) || null)
    };
    return clone(plan);
  }

  plan(input = {}) {
    const character = input.character || {};
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return this._hold('MERCHANT_REQUIRED');
    if (character.rip === true || character.dead === true) return this._hold('MERCHANT_DEAD');
    if (input.inCombat === true) return this._hold('MERCHANT_IN_COMBAT');
    if (input.economyEmergency === true) return this._hold('ECONOMY_EMERGENCY');
    if (input.controlledBusy === true) return this._hold('CONTROLLED_SUBSYSTEM_BUSY');
    const gameData = input.gameData || {};
    if (!gameData.craft || !gameData.items) return this._hold('CRAFT_DATA_UNAVAILABLE');

    let candidates = this._candidateOutputs(gameData, input.registry);
    const lockedOutput = input.productionTaskTarget && input.productionTaskTarget.output ? String(input.productionTaskTarget.output) : null;
    const lockedRecipient = input.productionTaskTarget && input.productionTaskTarget.recipient ? String(input.productionTaskTarget.recipient) : null;
    if (lockedOutput) {
      candidates = candidates.filter((row) => String(row.output || '') === lockedOutput && (!lockedRecipient || String(row.recipient || '') === lockedRecipient));
    }
    if (!candidates.length) return this._hold(lockedOutput ? 'LOCKED_PRODUCTION_TARGET_COMPLETE_OR_UNAVAILABLE' : 'NO_CRAFTED_GEAR_IMPROVEMENT');

    let bestBlocked = null;
    for (const candidate of candidates.slice(0, 32)) {
      if (input.contentDrift && typeof input.contentDrift.requiresRevalidation === 'function') {
        try { if (input.contentDrift.requiresRevalidation('items', candidate.output)) continue; } catch (_) { continue; }
      }
      const built = this._buildCandidate(candidate, input);
      if (!bestBlocked) bestBlocked = built;
      if (!built.ready) continue;
      const plan = {
        schemaVersion: 1,
        id: this._id(),
        at: this.now(),
        state: 'READY',
        reason: 'PRODUCTION_CHAIN_READY',
        actionAuthority: false,
        liveExecutionAllowed: false,
        target: built.candidate,
        steps: built.steps,
        nextStep: built.executableSteps[0] || null,
        reservations: built.reservations,
        blockers: [],
        totalGold: built.totalGold,
        goldReserve: built.goldReserve,
        bankSource: built.bankSource,
        costStrategy: built.costStrategy
      };
      this.lastPlan = plan;
      this.stats.plans += 1;
      this.stats.ready += 1;
      this._event('PRODUCTION_PLAN_READY', 'info', plan.reason, { planId: plan.id, output: plan.target.output, recipient: plan.target.recipient, steps: plan.steps.length, totalGold: plan.totalGold });
      return clone(plan);
    }

    const plan = {
      schemaVersion: 1,
      id: this._id(),
      at: this.now(),
      state: 'BLOCKED',
      reason: 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN',
      actionAuthority: false,
      liveExecutionAllowed: false,
      target: bestBlocked ? bestBlocked.candidate : null,
      steps: bestBlocked ? bestBlocked.steps : [],
      nextStep: null,
      reservations: bestBlocked ? bestBlocked.reservations : {},
      blockers: bestBlocked ? bestBlocked.blockers : [{ reason: 'NO_CANDIDATE' }],
      totalGold: bestBlocked ? bestBlocked.totalGold : 0,
      goldReserve: this.goldReserve
    };
    this.lastPlan = plan;
    this.stats.plans += 1;
    this.stats.blocked += 1;
    this._event('PRODUCTION_PLAN_BLOCKED', 'warn', plan.reason, { output: plan.target && plan.target.output || null, blockers: plan.blockers.slice(0, 8) });
    return clone(plan);
  }

  status() {
    return {
      schemaVersion: 1,
      mode: MERCHANT_PRODUCTION_PLANNER_MODE,
      actionAuthority: false,
      liveExecutionAllowed: false,
      maxDepth: this.maxDepth,
      minImprovementRatio: this.minImprovementRatio,
      goldReserve: this.goldReserve,
      maxBuyQuantity: this.maxBuyQuantity,
      explicitTargets: this.explicitTargets.slice(),
      costStrategy: 'LEAST_GOLD_SOURCE_GRAPH_V1',
      sourcePriority: ['LOCAL_ZERO_COST', 'BANK_ZERO_GOLD_COST', 'MIN(VENDOR_GOLD,CULLED_RECIPE_GRAPH)', 'FARM_REQUIRED'],
      lastPlan: clone(this.lastPlan),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  MerchantProductionPlanner,
  MERCHANT_PRODUCTION_PLANNER_MODE,
  ProductionStepKind,
  recipeFor,
  itemKey,
  itemQuantity,
  bankRows,
  vendorIndex
};
