'use strict';

const { Alpha13Runtime } = require('./alpha13-runtime');
const { InventoryLedger } = require('../economy/inventory-ledger');
const { GearProgressionEvaluator } = require('../economy/gear-progression');
const { MerchantPartyHistory } = require('../party/merchant-party-history');

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

    this.merchantPartyHistory = options.merchantPartyHistory || new MerchantPartyHistory({
      root: this.root,
      storage: options.merchantPartyHistoryStorage || options.storage,
      now: this.now,
      log: this.log,
      capacity: options.merchantPartyHistoryCapacity,
      saveIntervalMs: options.merchantPartyHistorySaveIntervalMs
    });

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
    const liveRegistry = this.characterRegistry.status();
    const liveCharacter = this.root && this.root.character;
    const merchantActive = liveCharacter && String(liveCharacter.ctype || liveCharacter.type || '').toLowerCase() === 'merchant';
    let registry = liveRegistry;

    if (merchantActive && this.merchantPartyHistory) {
      const partyNames = [
        liveCharacter && liveCharacter.name,
        ...(Array.isArray(this.lastSnapshot && this.lastSnapshot.party)
          ? this.lastSnapshot.party.map((row) => typeof row === 'string' ? row : row && row.name)
          : [])
      ].filter(Boolean);
      let trustedNames = [];
      try {
        trustedNames = this.partyBootstrap && typeof this.partyBootstrap.trustedRosterNames === 'function'
          ? this.partyBootstrap.trustedRosterNames() || []
          : [];
      } catch (_) {
        trustedNames = [];
      }
      this.merchantPartyHistory.observe({
        merchantName: liveCharacter.name,
        partyNames,
        trustedNames,
        registry: liveRegistry
      });
      const remembered = this.merchantPartyHistory.planningRows({
        currentPartyNames: partyNames,
        registry: liveRegistry
      });
      if (remembered.length) {
        const planningByName = new Map(
          (liveRegistry.characters || [])
            .filter((row) => row && row.name)
            .map((row) => [String(row.name), row])
        );
        // Replace stale/non-party observations only in the planning view. The
        // authoritative live CharacterRegistry remains untouched.
        for (const row of remembered) planningByName.set(String(row.name), row);
        registry = {
          ...liveRegistry,
          characters: [...planningByName.values()]
        };
      }
    }

    const gameData = this.adapter.getGameData() || {};
    const gear = this.gearProgression.evaluate({
      registry,
      gameData,
      contentDrift: this.contentDrift
    });
    this.inventoryLedger.setProgressionReservations(gear.reservations);
    const ledger = this.inventoryLedger.observe({
      registry: liveRegistry,
      gameData,
      contentDrift: this.contentDrift,
      liveCharacter,
      observedAt: this.lastSnapshot && this.lastSnapshot.observedAt
    });
    this.lastInventoryPlanningResult = {
      at: this.now(),
      ledger: ledger.summary,
      gear: gear.status.lastEvaluation,
      rememberedPartyMembers: this.merchantPartyHistory ? this.merchantPartyHistory.status().rememberedMembers : 0
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
    if (this.merchantPartyHistory) this.merchantPartyHistory.save({ force: true });
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: ALPHA14_VERSION,
      inventory: this.inventoryLedger.status(),
      gearProgression: this.gearProgression.status(),
      merchantPartyHistory: this.merchantPartyHistory ? this.merchantPartyHistory.status() : null
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
    base.context.merchantPartyHistory = this.merchantPartyHistory ? this.merchantPartyHistory.status() : null;
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha14Runtime, ALPHA14_VERSION, composeAlpha14Runtime };
