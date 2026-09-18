'use strict';

const LIVE_FARMER_MERCHANT_RECOVERY_MODE = 'live-farmer-merchant-recovery-v1';
const FARMER_POTION_TARGET = 4500;
const FARMER_POTION_REQUEST_BELOW = 200;
const FARMER_POTION_LOW_WATERMARK = FARMER_POTION_REQUEST_BELOW - 1;

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function rawFunction(root, name) {
  if (root && typeof root[name] === 'function') return { fn: root[name], owner: root };
  const parent = root && root.parent;
  if (parent && typeof parent[name] === 'function') return { fn: parent[name], owner: parent };
  return null;
}

function characterOf(runtime) {
  const root = runtime && runtime.root;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function inventoryOf(runtime) {
  const c = characterOf(runtime);
  return c && Array.isArray(c.items) ? c.items : [];
}

function itemTotal(runtime, itemName) {
  return inventoryOf(runtime).reduce((sum, item) => {
    if (!item || String(item.name || '') !== String(itemName || '')) return sum;
    return sum + Math.max(1, Math.floor(finite(item.q, 1)));
  }, 0);
}

function transportOf(runtime) {
  const candidates = [
    runtime && runtime.partyAccountCommunication && runtime.partyAccountCommunication.transport,
    runtime && runtime.partyBootstrap && runtime.partyBootstrap.transport,
    runtime && runtime.controlledPartyLogistics && runtime.controlledPartyLogistics.transport
  ];
  return candidates.find((row) => row && typeof row.send === 'function') || null;
}

function alpha27MerchantOf(runtime) {
  const convergence = runtime && runtime.alpha27CombatMerchantConvergence;
  return convergence && convergence.merchant || null;
}

function event(runtime, eventName, severity = 'info', reason = null, data = {}) {
  try {
    if (runtime && runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({ component: 'live-farmer-merchant-recovery', event: eventName, severity, reason, data });
    }
  } catch (_) {}
}

function installAddressedCmRouterRecovery(runtime, state) {
  const transport = transportOf(runtime);
  if (!transport || typeof transport._installCmRouter !== 'function') return false;

  if (!transport.__liveFarmerMerchantCmRecoveryInstalled) {
    const baseInstall = transport._installCmRouter.bind(transport);
    transport._installCmRouter = function installSelfHealingNamedReceiverRouter() {
      const displaced = this._cmRouterInstalled === true && this.root && this._cmRouter && this.root.on_cm !== this._cmRouter;
      if (displaced) {
        this._cmRouterInstalled = false;
        this._cmRouter = null;
        this._cmRouterPrevious = null;
        state.stats.cmRouterRepairs += 1;
        event(runtime, 'LIVE_CM_ROUTER_REPAIRED', 'warn', 'ON_CM_HANDLER_DISPLACED', {
          localName: typeof this.localName === 'function' ? this.localName() : null,
          directReceiverCount: this._directReceiverNames && this._directReceiverNames.size || 0
        });
      }
      return baseInstall();
    };

    const baseSend = transport.send.bind(transport);
    transport.send = function sendWithReceiveRouterHealthCheck() {
      if (this._directReceiverNames && this._directReceiverNames.size > 0) {
        try { this._installCmRouter(); } catch (_) {}
      }
      return baseSend(...arguments);
    };
    transport.__liveFarmerMerchantCmRecoveryInstalled = true;
  }

  try {
    if (transport._directReceiverNames && transport._directReceiverNames.size > 0) transport._installCmRouter();
  } catch (_) {}

  const crossMap = runtime && runtime.alpha28LiveAuthorityLiveness && runtime.alpha28LiveAuthorityLiveness.crossMap;
  if (crossMap && typeof crossMap._ensureReceiver === 'function' && !crossMap.__liveFarmerMerchantReceiverRecoveryInstalled) {
    const baseEnsureReceiver = crossMap._ensureReceiver.bind(crossMap);
    crossMap._ensureReceiver = () => {
      let activeTransport = null;
      try { activeTransport = typeof crossMap._transport === 'function' ? crossMap._transport() : transport; } catch (_) { activeTransport = transport; }
      if (activeTransport && typeof activeTransport._installCmRouter === 'function' && activeTransport._directReceiverNames && activeTransport._directReceiverNames.size > 0) {
        try { activeTransport._installCmRouter(); } catch (_) {}
      }
      return baseEnsureReceiver();
    };
    crossMap.__liveFarmerMerchantReceiverRecoveryInstalled = true;
  }

  return true;
}

function vendorTravelSucceeded(result) {
  return result === true || !!(result && result.ok === true);
}

function installPotionVendorContinuation(runtime, state) {
  const merchant = alpha27MerchantOf(runtime);
  if (!merchant || typeof merchant.restockPartyPotions !== 'function') return false;
  if (merchant.__liveFarmerMerchantPotionContinuationInstalled) return true;

  const baseRestock = merchant.restockPartyPotions.bind(merchant);
  merchant.restockPartyPotions = async () => {
    const plan = runtime.lastMerchantServicePlan;
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : [];
    const isAdaptive4500 = !!(plan && plan.kind === 'RESTOCK_REQUIRED' && plan.metadata && plan.metadata.p0PotionPolicy4500 && deliveries.length);
    if (!isAdaptive4500) return baseRestock();

    if (!await merchant.ensureStandClosed('PARTY_SUPPLY_ADAPTIVE_RESTOCK')) return true;
    const needed = deliveries.find((row) => ['hpot0', 'mpot0'].includes(String(row && row.itemName || '')) && itemTotal(runtime, row.itemName) < Math.max(0, Math.floor(finite(row.quantity, 0))));
    if (!needed) return false;

    const itemName = String(needed.itemName);
    const requiredStock = Math.max(0, Math.floor(finite(needed.quantity, 0)));
    let before = itemTotal(runtime, itemName);
    let vendorTravelAttested = false;
    const canBuy = rawFunction(merchant.root, 'can_buy');
    let buyProbe = false;
    if (canBuy) {
      try { buyProbe = canBuy.fn.call(canBuy.owner, itemName) === true; } catch (_) { buyProbe = false; }
    }

    if (!buyProbe) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'SERVICE_TRAVEL', reason: 'PARTY_SUPPLY_ADAPTIVE_VENDOR_REQUIRED', destination: itemName };
      const travelled = await merchant.atomic.namedServiceTravel(itemName);
      if (!vendorTravelSucceeded(travelled)) {
        state.stats.vendorTravelFailures += 1;
        merchant.lastMerchantAction = {
          at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'FAILED_SAFE',
          reason: travelled && travelled.reason || 'PARTY_SUPPLY_VENDOR_TRAVEL_FAILED', itemName
        };
        return true;
      }
      vendorTravelAttested = true;
      state.stats.vendorTravelContinuations += 1;
      before = itemTotal(runtime, itemName);
      event(runtime, 'LIVE_POTION_VENDOR_ARRIVAL_ATTESTED', 'info', 'VERIFIED_SERVICE_TRAVEL_CONTINUES_TO_BUY', {
        itemName,
        requiredStock,
        before,
        canBuyProbeBeforeTravel: buyProbe
      });
    }

    const buy = rawFunction(merchant.root, 'buy');
    if (!buy) {
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'FAILED_SAFE', reason: 'BUY_API_UNAVAILABLE', itemName };
      state.stats.purchaseFailures += 1;
      return true;
    }

    const deficit = Math.max(0, requiredStock - before);
    if (deficit <= 0) return false;
    const c = characterOf(runtime);
    const gameData = runtime.adapter && typeof runtime.adapter.getGameData === 'function' ? runtime.adapter.getGameData() || {} : {};
    const meta = gameData.items && gameData.items[itemName];
    const price = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    const goldReserve = Math.max(0, finite(merchant.options && merchant.options.goldReserve, 0));
    const affordable = price > 0 ? Math.max(0, Math.floor((finite(c && c.gold, 0) - goldReserve) / price)) : deficit;
    const maxBuy = Math.max(1, Math.floor(finite(merchant.options && merchant.options.merchantMaxPotionBuy, FARMER_POTION_TARGET)));
    const quantity = Math.max(0, Math.min(deficit, affordable, maxBuy));
    if (quantity <= 0) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'HOLD', reason: 'PARTY_SUPPLY_GOLD_RESERVE_PROTECTED', itemName, have: before, requiredStock };
      return true;
    }

    try {
      const response = await merchant.atomic._timeout(buy.fn.call(buy.owner, itemName, quantity), 'BUY_PARTY_SUPPLY_ADAPTIVE', 15000);
      if (response && response.failed === true) throw response;
      const verified = await merchant.atomic.verifyEventually(() => itemTotal(runtime, itemName) >= before + quantity);
      if (!verified) throw new Error('PARTY_SUPPLY_ADAPTIVE_PURCHASE_DELTA_NOT_OBSERVED');
      merchant.stats.potionRestocks = (merchant.stats.potionRestocks || 0) + 1;
      state.stats.potionRestocksCommitted += 1;
      merchant.lastMerchantAction = {
        at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'COMMITTED', itemName,
        quantity, requiredStock, merchantReserve: 0, vendorTravelAttested
      };
      event(runtime, 'LIVE_POTION_RESTOCK_COMMITTED', 'info', 'CURRENT_DELIVERY_DEFICIT_PURCHASED', clone(merchant.lastMerchantAction));
      return true;
    } catch (error) {
      merchant.stats.failedSafe = (merchant.stats.failedSafe || 0) + 1;
      state.stats.purchaseFailures += 1;
      merchant.lastMerchantAction = {
        at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'FAILED_SAFE',
        reason: String(error && error.message || error || 'BUY_PARTY_SUPPLY_ADAPTIVE_FAILED').slice(0, 220),
        itemName, quantity, requiredStock, vendorTravelAttested
      };
      event(runtime, 'LIVE_POTION_RESTOCK_FAILED_SAFE', 'error', merchant.lastMerchantAction.reason, clone(merchant.lastMerchantAction));
      return true;
    }
  };
  merchant.__liveFarmerMerchantPotionContinuationInstalled = true;
  return true;
}

function installP0StatusCorrection(runtime) {
  const p0 = runtime && runtime.p0RegroupSupplyRecovery;
  if (!p0 || typeof p0.status !== 'function' || p0.__liveFarmerMerchantStatusCorrected) return !!p0;
  const baseStatus = p0.status.bind(p0);
  p0.status = () => {
    const status = baseStatus();
    return {
      ...status,
      potionPolicy: {
        ...(status.potionPolicy || {}),
        deliveryPerFarmer: { hpot0: FARMER_POTION_TARGET, mpot0: FARMER_POTION_TARGET },
        farmerTarget: FARMER_POTION_TARGET,
        potionRequestBelow: FARMER_POTION_REQUEST_BELOW,
        lowWatermark: FARMER_POTION_LOW_WATERMARK,
        merchantReserve: 0,
        bothFamiliesRequiredBeforeTravel: false,
        exactDelivery: false,
        exactTopUpToTarget: true,
        buyOnlyCurrentDeliveryDeficit: true,
        existingMerchantSurplusMayRemain: true
      }
    };
  };
  p0.__liveFarmerMerchantStatusCorrected = true;
  return true;
}

function installLiveFarmerMerchantRecovery(runtime) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.liveFarmerMerchantRecovery) return runtime.liveFarmerMerchantRecovery;
  const state = {
    schemaVersion: 1,
    mode: LIVE_FARMER_MERCHANT_RECOVERY_MODE,
    installedAt: typeof runtime.now === 'function' ? runtime.now() : Date.now(),
    stats: {
      cmRouterRepairs: 0,
      vendorTravelContinuations: 0,
      vendorTravelFailures: 0,
      potionRestocksCommitted: 0,
      purchaseFailures: 0
    }
  };
  state.addressedCmRouterRecoveryInstalled = installAddressedCmRouterRecovery(runtime, state);
  state.potionVendorContinuationInstalled = installPotionVendorContinuation(runtime, state);
  state.p0StatusCorrectionInstalled = installP0StatusCorrection(runtime);
  state.status = () => ({
    schemaVersion: state.schemaVersion,
    mode: state.mode,
    installedAt: state.installedAt,
    addressedCmRouterRecoveryInstalled: state.addressedCmRouterRecoveryInstalled,
    potionVendorContinuationInstalled: state.potionVendorContinuationInstalled,
    p0StatusCorrectionInstalled: state.p0StatusCorrectionInstalled,
    farmerPotionTarget: FARMER_POTION_TARGET,
    farmerPotionRequestBelow: FARMER_POTION_REQUEST_BELOW,
    stats: { ...state.stats }
  });
  runtime.liveFarmerMerchantRecovery = state;
  event(runtime, 'LIVE_FARMER_MERCHANT_RECOVERY_INSTALLED', 'warn', 'LIVE_LOG_VERIFIED_RECOVERY', state.status());
  return state;
}

module.exports = {
  LIVE_FARMER_MERCHANT_RECOVERY_MODE,
  FARMER_POTION_TARGET,
  FARMER_POTION_REQUEST_BELOW,
  FARMER_POTION_LOW_WATERMARK,
  installLiveFarmerMerchantRecovery,
  installAddressedCmRouterRecovery,
  installPotionVendorContinuation,
  installP0StatusCorrection
};
