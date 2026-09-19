'use strict';

const { candidateSlots } = require('../economy/gear-progression');
const {
  bestMaterialFarmSource,
  diagnoseUnavailableMaterialSource
} = require('../party/production-material-acquisition');

const COVERAGE_STATUS = Object.freeze({
  FULLY_RESOLVED: 'FULLY_RESOLVED',
  EVENT_CURRENTLY_INACTIVE: 'EVENT_CURRENTLY_INACTIVE',
  EVENT_SOURCE_UNVERIFIED: 'EVENT_SOURCE_UNVERIFIED',
  QUEST_DESTINATION_UNVERIFIED: 'QUEST_DESTINATION_UNVERIFIED',
  MUTATION_UNSUPPORTED: 'MUTATION_UNSUPPORTED',
  NO_SAFE_SOURCE: 'NO_SAFE_SOURCE',
  CONTENT_DRIFT: 'CONTENT_DRIFT',
  MISSING_GAME_DATA: 'MISSING_GAME_DATA',
  RECIPE_CYCLE: 'RECIPE_CYCLE',
  MAX_DEPTH: 'MAX_DEPTH'
});

const SEVERITY = Object.freeze({
  FULLY_RESOLVED: 0,
  EVENT_CURRENTLY_INACTIVE: 1,
  EVENT_SOURCE_UNVERIFIED: 2,
  QUEST_DESTINATION_UNVERIFIED: 3,
  NO_SAFE_SOURCE: 4,
  MUTATION_UNSUPPORTED: 5,
  RECIPE_CYCLE: 6,
  MAX_DEPTH: 7,
  CONTENT_DRIFT: 8,
  MISSING_GAME_DATA: 9
});

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}
function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function worst(rows) {
  return (rows || []).reduce((acc, row) => {
    if (!row) return acc;
    if (!acc || finite(SEVERITY[row.status], 99) > finite(SEVERITY[acc.status], 99)) return row;
    return acc;
  }, null);
}
function recipeFor(gameData, name) {
  const raw = gameData && gameData.craft && gameData.craft[name];
  if (!raw || !Array.isArray(raw.items) || !raw.items.length) return null;
  return {
    output: String(name),
    outputQuantity: Math.max(1, Math.floor(finite(raw.q, finite(raw.quantity, 1)) || 1)),
    cost: Math.max(0, Math.floor(finite(raw.cost, 0) || 0)),
    items: raw.items.filter((row) => Array.isArray(row) && row[1]).map((row) => ({
      quantity: Math.max(1, Math.floor(finite(row[0], 1) || 1)),
      name: String(row[1]),
      level: Math.max(0, Math.floor(finite(row[2], 0) || 0))
    }))
  };
}
function vendorIndex(gameData) {
  const out = new Map();
  const npcs = gameData && gameData.npcs || {};
  for (const [mapName, map] of Object.entries(gameData && gameData.maps || {})) {
    for (const row of Array.isArray(map && map.npcs) ? map.npcs : []) {
      const id = Array.isArray(row) ? row[0] : row && (row.id || row.name);
      if (!id) continue;
      const def = npcs[id] || {};
      for (const item of [].concat(def.items || def.sells || [])) {
        const name = typeof item === 'string' ? item : Array.isArray(item) ? item[0] : item && item.name;
        if (!name) continue;
        if (!out.has(String(name))) out.set(String(name), []);
        out.get(String(name)).push({ npc: String(id), map: String(mapName) });
      }
    }
  }
  return out;
}
function mapDiagnosis(reason) {
  if (reason === 'EVENT_SOURCE_INACTIVE') return COVERAGE_STATUS.EVENT_CURRENTLY_INACTIVE;
  if (reason === 'EVENT_SOURCE_UNVERIFIED') return COVERAGE_STATUS.EVENT_SOURCE_UNVERIFIED;
  if (reason === 'QUEST_SOURCE_DESTINATION_UNVERIFIED') return COVERAGE_STATUS.QUEST_DESTINATION_UNVERIFIED;
  return COVERAGE_STATUS.NO_SAFE_SOURCE;
}

class ProductionAcquisitionCoverageAudit {
  constructor(runtime, options = {}) {
    this.runtime = runtime;
    this.maxDepth = Math.max(1, Math.min(24, Math.floor(finite(options.maxDepth, 12) || 12)));
    this.fallbackKillsPerHour = Math.max(1, finite(options.fallbackKillsPerHour, 20) || 20);
    this.lastReport = null;
  }

  _gameData() {
    try {
      return this.runtime && this.runtime.adapter && typeof this.runtime.adapter.getGameData === 'function'
        ? this.runtime.adapter.getGameData() || {}
        : {};
    } catch (_) { return {}; }
  }

  _drifted(name) {
    const drift = this.runtime && this.runtime.contentDrift;
    if (!drift || typeof drift.requiresRevalidation !== 'function') return false;
    try { return drift.requiresRevalidation('item', name) === true; } catch (_) { return false; }
  }

  resolveItem(name, level = 0, quantity = 1, context = {}) {
    const gameData = context.gameData || this._gameData();
    const vendors = context.vendors || vendorIndex(gameData);
    const depth = Math.max(0, finite(context.depth, 0) || 0);
    const path = context.path instanceof Set ? context.path : new Set();
    const itemName = String(name || '');
    const itemLevel = Math.max(0, Math.floor(finite(level, 0) || 0));
    const need = Math.max(1, Math.floor(finite(quantity, 1) || 1));
    const key = `${itemName}|${itemLevel}`;

    if (!itemName || !gameData.items || !gameData.items[itemName]) {
      return { status: COVERAGE_STATUS.MISSING_GAME_DATA, item: itemName || null, level: itemLevel, quantity: need, reason: 'ITEM_METADATA_MISSING' };
    }
    if (this._drifted(itemName)) {
      return { status: COVERAGE_STATUS.CONTENT_DRIFT, item: itemName, level: itemLevel, quantity: need, reason: 'CONTENT_REVALIDATION_REQUIRED' };
    }
    if (depth > this.maxDepth) {
      return { status: COVERAGE_STATUS.MAX_DEPTH, item: itemName, level: itemLevel, quantity: need, reason: 'MAX_ACQUISITION_DEPTH' };
    }
    if (path.has(key)) {
      return { status: COVERAGE_STATUS.RECIPE_CYCLE, item: itemName, level: itemLevel, quantity: need, reason: 'ACQUISITION_CYCLE' };
    }

    const meta = gameData.items[itemName] || {};
    if (itemLevel > 0) {
      const family = meta.compound ? 'COMPOUND' : meta.upgrade ? 'UPGRADE' : null;
      if (!family) {
        return { status: COVERAGE_STATUS.MUTATION_UNSUPPORTED, item: itemName, level: itemLevel, quantity: need, reason: 'LEVELED_MATERIAL_MUTATION_UNSUPPORTED' };
      }
      const multiplier = family === 'COMPOUND' ? 3 : 1;
      const nextPath = new Set(path); nextPath.add(key);
      const input = this.resolveItem(itemName, itemLevel - 1, need * multiplier, { gameData, vendors, depth: depth + 1, path: nextPath });
      return {
        status: input.status,
        item: itemName,
        level: itemLevel,
        quantity: need,
        node: family,
        inputMultiplier: multiplier,
        children: [input]
      };
    }

    if ((vendors.get(itemName) || []).length && finite(meta.g, 0) > 0) {
      return { status: COVERAGE_STATUS.FULLY_RESOLVED, item: itemName, level: 0, quantity: need, node: 'BUY', evidence: clone(vendors.get(itemName)[0]) };
    }

    const recipe = recipeFor(gameData, itemName);
    if (recipe) {
      const operations = Math.max(1, Math.ceil(need / recipe.outputQuantity));
      const nextPath = new Set(path); nextPath.add(key);
      const children = recipe.items.map((row) => this.resolveItem(row.name, row.level, row.quantity * operations, {
        gameData, vendors, depth: depth + 1, path: nextPath
      }));
      const blocker = worst(children);
      return {
        status: blocker ? blocker.status : COVERAGE_STATUS.FULLY_RESOLVED,
        item: itemName,
        level: 0,
        quantity: need,
        node: 'CRAFT',
        operations,
        children
      };
    }

    const source = bestMaterialFarmSource(this.runtime, itemName, need, { fallbackKillsPerHour: this.fallbackKillsPerHour });
    if (source) {
      return {
        status: COVERAGE_STATUS.FULLY_RESOLVED,
        item: itemName,
        level: 0,
        quantity: need,
        node: source.graphNode && source.graphNode.kind || source.kind || 'FARM',
        p50Hours: source.p50Hours,
        p90Hours: source.p90Hours,
        decisionQuantile: source.decisionQuantile || 'P90',
        evidence: clone(source)
      };
    }
    const diagnosis = diagnoseUnavailableMaterialSource(this.runtime, itemName);
    return {
      status: mapDiagnosis(diagnosis && diagnosis.reason),
      item: itemName,
      level: 0,
      quantity: need,
      node: 'UNRESOLVED_SOURCE',
      reason: diagnosis && diagnosis.reason || 'NO_SAFE_SOURCE',
      evidence: clone(diagnosis)
    };
  }

  auditAllGear() {
    const gameData = this._gameData();
    const rows = [];
    if (!gameData.items || !gameData.craft) {
      this.lastReport = {
        schemaVersion: 1,
        mode: 'production-acquisition-coverage-audit-v1',
        ready: false,
        totals: { gear: 0, fullyResolved: 0, gaps: 1 },
        classifications: { [COVERAGE_STATUS.MISSING_GAME_DATA]: 1 },
        rows: []
      };
      return clone(this.lastReport);
    }
    const vendors = vendorIndex(gameData);
    for (const output of Object.keys(gameData.craft).sort()) {
      const meta = gameData.items[output];
      if (!meta || !candidateSlots(meta).length) continue;
      const recipe = recipeFor(gameData, output);
      if (!recipe) continue;
      const children = recipe.items.map((row) => this.resolveItem(row.name, row.level, row.quantity, {
        gameData, vendors, depth: 1, path: new Set([`${output}|0`])
      }));
      const blocker = worst(children);
      rows.push({
        output,
        slots: candidateSlots(meta),
        status: blocker ? blocker.status : COVERAGE_STATUS.FULLY_RESOLVED,
        children
      });
    }
    const classifications = {};
    for (const row of rows) classifications[row.status] = (classifications[row.status] || 0) + 1;
    const fullyResolved = classifications[COVERAGE_STATUS.FULLY_RESOLVED] || 0;
    const temporary = classifications[COVERAGE_STATUS.EVENT_CURRENTLY_INACTIVE] || 0;
    this.lastReport = {
      schemaVersion: 1,
      mode: 'production-acquisition-coverage-audit-v1',
      actionAuthority: false,
      generatedAt: this.runtime && typeof this.runtime.now === 'function' ? this.runtime.now() : Date.now(),
      decisionQuantile: 'P90',
      ready: rows.length > 0 && fullyResolved + temporary === rows.length,
      totals: { gear: rows.length, fullyResolved, temporarilyDeferred: temporary, gaps: rows.length - fullyResolved - temporary },
      classifications,
      rows
    };
    return clone(this.lastReport);
  }

  status() {
    return clone(this.lastReport || {
      schemaVersion: 1,
      mode: 'production-acquisition-coverage-audit-v1',
      actionAuthority: false,
      ready: false,
      reason: 'AUDIT_NOT_RUN'
    });
  }
}

const IRREVERSIBLE_KINDS = new Set(['BUY', 'CRAFT', 'EXCHANGE', 'UPGRADE', 'COMPOUND', 'TRANSFER']);

class ProductionGraphSoakAuditor {
  constructor(options = {}) {
    this.capacity = Math.max(100, Math.min(10000, Math.floor(finite(options.capacity, 1000) || 1000)));
    this.samples = 0;
    this.violations = [];
    this.seenCommitted = new Set();
    this.activeTargetIdentity = null;
    this.maxTrackedCommitted = 0;
  }

  _violate(code, sample, detail = {}) {
    const row = { seq: this.samples, code, phase: sample && sample.phase || null, ...clone(detail) };
    this.violations.push(row);
    if (this.violations.length > this.capacity) this.violations.splice(0, this.violations.length - this.capacity);
    return row;
  }

  observe(sample = {}) {
    this.samples += 1;
    const phase = String(sample.phase || '');
    const targetIdentity = sample.targetIdentity || null;
    const terminal = ['COMPLETED', 'ABORTED', 'FAILED_SAFE'].includes(phase);

    if (targetIdentity && this.activeTargetIdentity && targetIdentity !== this.activeTargetIdentity && !sample.targetTransitionAuthorized) {
      this._violate('TARGET_IDENTITY_CHANGED_WITHOUT_TERMINAL_REPLAN', sample, { previous: this.activeTargetIdentity, next: targetIdentity });
    }
    if (targetIdentity && !terminal) this.activeTargetIdentity = targetIdentity;
    if (terminal) this.activeTargetIdentity = null;

    if (sample.recoveryPending === true && sample.gameplayActionExecuted === true) {
      this._violate('GAMEPLAY_ACTION_DURING_RECOVERY_PENDING', sample);
    }

    const action = sample.irreversibleAction || null;
    if (action && action.committed === true && IRREVERSIBLE_KINDS.has(String(action.kind || ''))) {
      const key = String(action.idempotencyKey || action.operationId || '');
      if (!key) this._violate('IRREVERSIBLE_ACTION_WITHOUT_IDEMPOTENCY_KEY', sample, { kind: action.kind });
      else if (this.seenCommitted.has(key)) this._violate('DUPLICATE_IRREVERSIBLE_COMMIT', sample, { key, kind: action.kind });
      else this.seenCommitted.add(key);
    }
    this.maxTrackedCommitted = Math.max(this.maxTrackedCommitted, this.seenCommitted.size);

    if (phase === 'MATERIAL_READY_FOR_HANDOFF') {
      if (sample.farmerCombatActive === true || sample.farmerAttackIssued === true) this._violate('FARMER_COMBAT_DURING_HANDOFF', sample);
      if (finite(sample.remainingToFarm, 0) > 0) this._violate('HANDOFF_WITH_REMAINING_FARM_REQUIREMENT', sample, { remainingToFarm: sample.remainingToFarm });
    }

    const objectives = Array.isArray(sample.farmerProductionObjectives) ? sample.farmerProductionObjectives.filter(Boolean) : [];
    if (new Set(objectives.map(String)).size > 1) this._violate('FARMERS_SPLIT_ACROSS_PRODUCTION_OBJECTIVES', sample, { objectives });

    if (phase.includes('EVENT') && phase.includes('EXECUTING') && sample.eventActive === false) {
      this._violate('INACTIVE_EVENT_EXECUTION', sample, { eventKey: sample.eventKey || null });
    }

    if (sample.farmDecision && sample.farmDecision.decisionQuantile !== 'P90') {
      this._violate('NON_P90_FARM_DECISION', sample, { decisionQuantile: sample.farmDecision.decisionQuantile || null });
    }

    if (sample.protectedTransfer === true && sample.transferAuthorized !== true) {
      this._violate('UNAUTHORIZED_PROTECTED_ITEM_TRANSFER', sample);
    }

    if (phase === 'COMPLETED') {
      if (sample.recipientVerified !== true) this._violate('COMPLETED_WITHOUT_RECIPIENT_VERIFICATION', sample);
      if (sample.productionTaskActive === true) this._violate('ORPHAN_PRODUCTION_TASK_AFTER_COMPLETION', sample);
      if (sample.productionObjectiveActive === true) this._violate('ORPHAN_PRODUCTION_OBJECTIVE_AFTER_COMPLETION', sample);
      if (sample.exchangeDemandActive === true) this._violate('ORPHAN_EXCHANGE_DEMAND_AFTER_COMPLETION', sample);
      if (sample.mutationDemandActive === true) this._violate('ORPHAN_MUTATION_DEMAND_AFTER_COMPLETION', sample);
    }

    return this.status();
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'production-graph-e2e-soak-auditor-v1',
      actionAuthority: false,
      samples: this.samples,
      passed: this.violations.length === 0,
      violationCount: this.violations.length,
      violations: this.violations.slice(-100).map(clone),
      committedKeysTracked: this.seenCommitted.size,
      bounded: this.violations.length <= this.capacity
    };
  }
}

module.exports = {
  COVERAGE_STATUS,
  ProductionAcquisitionCoverageAudit,
  ProductionGraphSoakAuditor,
  recipeFor,
  vendorIndex
};
