'use strict';

const { Alpha13Runtime } = require('./alpha13-runtime');
const { InventoryLedger } = require('../economy/inventory-ledger');
const { GearProgressionEvaluator } = require('../economy/gear-progression');

const ALPHA14_VERSION = '3.0.0-alpha.14.0';

function composeAlpha14Runtime(options = {}) {
this.log.version = ALPHA14_VERSION;
    this.inventoryPlanningIntervalMs = Math.max(1000, Math.min(60000, Number(options.inventoryPlanningIntervalMs) || 3000));
    this.lastInventoryPlanningAt = -Infinity;
    this.lastInventoryPlanningResult = null;

    this.gearProgression = options.gearProgression || new GearProgressionEvaluator({
      root: this.root,
      storage: options.gearProgressionStorage || options.storage,
      now: this.now,
      log: this.log,
      capacity: options.gearGoalCapacity,
      maxProbeLevel: options.gearMaxProbeLevel,
      minImprovementRatio: options.gearMinImprovementRatio
    });
    this.gearProgression.load();

    this.inventoryLedger = options.inventoryLedger || new InventoryLedger({
      now: this.now,
      log: this.log,
      capacity: options.inventoryLedgerCapacity,
      staleAfterMs: options.inventoryLedgerStaleAfterMs,
      workspaceSlots: options.inventoryWorkspaceSlots,
      groupHpPotionReserve: options.groupHpPotionReserve,
      groupMpPotionReserve: options.groupMpPotionReserve,
      sellAllowlist: options.inventorySellAllowlist,
      bankAllowlist: options.inventoryBankAllowlist,
      exchangeAllowlist: options.inventoryExchangeAllowlist
    });
}

class Alpha14Runtime extends Alpha13Runtime {
  constructor(options = {}) {
    super(options);
    composeAlpha14Runtime.call(this, options);
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA14_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _planInventoryAndGear() {
    const registry = this.characterRegistry.status();
    const gameData = this.adapter.getGameData() || {};
    const gear = this.gearProgression.evaluate({
      registry,
      gameData,
      contentDrift: this.contentDrift
    });
    this.inventoryLedger.setProgressionReservations(gear.reservations);
    const ledger = this.inventoryLedger.observe({
      registry,
      gameData,
      contentDrift: this.contentDrift,
      liveCharacter: this.root && this.root.character,
      observedAt: this.lastSnapshot && this.lastSnapshot.observedAt
    });
    this.lastInventoryPlanningResult = {
      at: this.now(),
      ledger: ledger.summary,
      gear: gear.status.lastEvaluation
    };
    return this.lastInventoryPlanningResult;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastInventoryPlanningAt >= this.inventoryPlanningIntervalMs) {
      this.lastInventoryPlanningAt = now;
      this._planInventoryAndGear();
    }
  }

  stop() {
    if (this.gearProgression) this.gearProgression.save({ force: true });
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: ALPHA14_VERSION,
      inventory: this.inventoryLedger.status(),
      gearProgression: this.gearProgression.status()
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.inventory = {
      status: this.inventoryLedger.status(),
      entries: this.inventoryLedger.list(300)
    };
    base.context.gearProgression = {
      status: this.gearProgression.status(),
      goals: this.gearProgression.list(200)
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha14Runtime, ALPHA14_VERSION, composeAlpha14Runtime };
