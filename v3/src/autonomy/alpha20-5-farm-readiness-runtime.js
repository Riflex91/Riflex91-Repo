'use strict';

const { Alpha20_5MerchantRuntime } = require('./alpha20-5-merchant-runtime');
const { ControlledFarmerLoot } = require('../farmer/controlled-farmer-loot');
const { ControlledAutoRespawn } = require('../ops/controlled-auto-respawn');

const ALPHA20_5_FARM_READINESS_MODE = 'alpha20.5-farm-readiness';

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

class Alpha20_5FarmReadinessRuntime extends Alpha20_5MerchantRuntime {
  constructor(options = {}) {
    super(options);
    this.controlledFarmerLoot = options.controlledFarmerLoot || new ControlledFarmerLoot({
      root: this.root,
      now: this.now,
      log: this.log,
      getMode: () => this.adapter.mode,
      enabled: options.farmerLootEnabled !== false,
      intervalMs: options.farmerLootIntervalMs,
      noChestPollMs: options.farmerLootNoChestPollMs,
      fullInventoryIntervalMs: options.farmerLootFullInventoryIntervalMs,
      failureBackoffMs: options.farmerLootFailureBackoffMs,
      verifyDelayMs: options.farmerLootVerifyDelayMs
    });
    this.controlledAutoRespawn = options.controlledAutoRespawn || new ControlledAutoRespawn({
      root: this.root,
      now: this.now,
      log: this.log,
      getMode: () => this.adapter.mode,
      enabled: options.autoRespawnEnabled !== false,
      deathGraceMs: options.autoRespawnDeathGraceMs,
      retryMs: options.autoRespawnRetryMs,
      maxAttempts: options.autoRespawnMaxAttempts
    });
  }

  tick() {
    super.tick();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return;
    this.controlledAutoRespawn.tick(snapshot);
    this.controlledFarmerLoot.tick(snapshot);
  }

  farmReadinessStatus() {
    return {
      schemaVersion: 1,
      mode: ALPHA20_5_FARM_READINESS_MODE,
      farmerLoot: this.controlledFarmerLoot.status(),
      autoRespawn: this.controlledAutoRespawn.status(),
      startupPolicy: {
        recommendedMode: 'active',
        recommendedInitialRuntimeState: 'stopped',
        oneClickStartUsesExistingOperatorRunControl: true,
        startDoesNotGrantMerchantServiceAuthority: true,
        startDoesNotGrantPartyOrEconomyAuthority: true
      }
    };
  }

  status() {
    const base = super.status();
    return {
      ...base,
      farmerLoot: this.controlledFarmerLoot.status(),
      autoRespawn: this.controlledAutoRespawn.status(),
      alpha20_5: {
        ...(base.alpha20_5 || {}),
        farmReadiness: true,
        farmerLootDefaultOn: true,
        autoRespawnDefaultOn: true,
        autoRespawnBounded: true,
        autoRespawnRequiresActiveMode: true,
        lootMerchantExcluded: true
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.farmReadiness = clone(this.farmReadinessStatus());
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha20_5FarmReadinessRuntime, ALPHA20_5_FARM_READINESS_MODE };
