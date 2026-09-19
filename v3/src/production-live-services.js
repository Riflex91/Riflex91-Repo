'use strict';

const { installAlpha25ControlCenterBrain, itemSpriteCatalog, equipmentShadeCatalog, itemAutomationCatalog } = require('./reliability/alpha25-control-center-brain');
const { installAlpha26CloudUpdateLogisticsUiHotfix } = require('./reliability/alpha26-cloud-update-logistics-ui-hotfix');
const { installAlpha27CombatMerchantConvergence } = require('./reliability/alpha27-combat-merchant-convergence');
const { installAlpha27MerchantLegacyOwnershipGuard } = require('./reliability/alpha27-merchant-legacy-ownership-guard');
const { installAlpha27MerchantTravelIntelligence } = require('./reliability/alpha27-merchant-travel-intelligence');
const { installP0RegroupSupplyRecovery, P0_REGROUP_SUPPLY_RECOVERY_MODE } = require('./reliability/p0-regroup-supply-recovery');
const { installP0PotionBundleDeltaFix, P0_POTION_BUNDLE_DELTA_FIX_MODE } = require('./reliability/p0-potion-bundle-delta-fix');
const { installP0PotionPolicy4500, P0_POTION_POLICY_4500_MODE } = require('./reliability/p0-potion-policy-4500');
const { installP0PotionHardCap4500, P0_POTION_HARDCAP_4500_MODE } = require('./reliability/p0-potion-hardcap-4500');
const { installAlpha31PartyRoleLivenessHotfix, ALPHA31_PARTY_ROLE_LIVENESS_MODE } = require('./reliability/alpha31-party-role-liveness-hotfix');
const { installAlpha32NavigationMerchantRecovery, ALPHA32_NAVIGATION_MERCHANT_RECOVERY_MODE } = require('./reliability/alpha32-navigation-merchant-recovery');
const { installAlpha33MarkOrbitMerchantDelivery, ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE } = require('./reliability/alpha33-mark-orbit-merchant-delivery');

const PRODUCTION_LIVE_SERVICES_MODE = 'production-live-services-v1';
const SPRITE_HOT_RELOAD_HOOK_VERSION = 2;

function emitFailure(runtime, service, error) {
  try {
    if (runtime && runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({
        component: 'production-live-services',
        event: 'LIVE_SERVICE_CYCLE_FAILED',
        severity: 'warn',
        reason: String(error && error.message || error).slice(0, 240),
        data: { service, localSafetyUnaffected: true }
      });
    }
  } catch (_) {}
}

function runService(runtime, service, name) {
  if (!service || typeof service.beforeTick !== 'function') return false;
  try {
    service.beforeTick();
    return true;
  } catch (error) {
    emitFailure(runtime, name, error);
    return false;
  }
}

function refreshAdventureLandSpriteHook(runtime, alpha25 = null) {
  const cloud = runtime && (runtime.cloudControlPlane || alpha25 && alpha25.cloud);
  if (!cloud || typeof cloud._runtimeSnapshot !== 'function') return false;
  if (cloud.__adventureLandSpriteHotReloadHookVersion === SPRITE_HOT_RELOAD_HOOK_VERSION) return false;

  const previousRuntimeSnapshot = cloud._runtimeSnapshot.bind(cloud);
  cloud._runtimeSnapshot = () => {
    const snapshot = previousRuntimeSnapshot();
    if (snapshot && typeof snapshot === 'object') {
      snapshot.itemSprites = itemSpriteCatalog(runtime);
      snapshot.equipmentShades = equipmentShadeCatalog(runtime);
      const liveCharacter = runtime && runtime.lastSnapshot && runtime.lastSnapshot.character;
      if (liveCharacter && String(liveCharacter.ctype || '').toLowerCase() === 'merchant') {
        snapshot.automationCatalog = itemAutomationCatalog(runtime);
        snapshot.automationCatalogVersion = 3;
        snapshot.automationCatalogCount = snapshot.automationCatalog.length;
      }
      if (snapshot.character && Number.isFinite(Number(liveCharacter && liveCharacter.isize))) {
        snapshot.character.isize = Math.max(0, Math.floor(Number(liveCharacter.isize)));
      }
    }
    return snapshot;
  };
  cloud.__adventureLandSpriteHotReloadHookVersion = SPRITE_HOT_RELOAD_HOOK_VERSION;
  return true;
}

function exposeDiagnostics(api, alpha25, alpha26, alpha27, ownershipGuard, travelIntelligence, p0Recovery, potionPolicy4500, potionHardCap4500, roleLiveness, liveRecovery, liveCorrections) {
  if (!api || typeof api !== 'object') return false;
  api.liveServices = {
    status: () => ({
      mode: PRODUCTION_LIVE_SERVICES_MODE,
      cloud: alpha25 && alpha25.cloud && alpha25.cloud.status ? alpha25.cloud.status() : null,
      autoUpdater: alpha26 && alpha26.updater && alpha26.updater.status ? alpha26.updater.status() : null,
      convergence: alpha27 && typeof alpha27.status === 'function' ? alpha27.status() : null,
      liveAuthority: alpha27 && alpha27.alpha28 && typeof alpha27.alpha28.status === 'function' ? alpha27.alpha28.status() : null,
      merchantOwnership: ownershipGuard && typeof ownershipGuard.status === 'function' ? ownershipGuard.status() : null,
      merchantTravelIntelligence: travelIntelligence && typeof travelIntelligence.status === 'function' ? travelIntelligence.status() : null,
      p0RegroupSupplyRecovery: p0Recovery && typeof p0Recovery.status === 'function' ? p0Recovery.status() : null,
      p0PotionBundleDeltaFixInstalled: !!(api.__runtime && api.__runtime.controlledMerchantService && api.__runtime.controlledMerchantService.__p0PotionBundleDeltaFixInstalled),
      p0PotionPolicy4500: potionPolicy4500 || null,
      p0PotionHardCap4500: potionHardCap4500 || null,
      partyRoleLiveness: roleLiveness && typeof roleLiveness.status === 'function' ? roleLiveness.status() : null,
      navigationMerchantRecovery: liveRecovery && typeof liveRecovery.status === 'function' ? liveRecovery.status() : null,
      markOrbitMerchantDelivery: liveCorrections && typeof liveCorrections.status === 'function' ? liveCorrections.status() : null
    })
  };
  api.cloud = {
    status: () => alpha25 && alpha25.cloud && alpha25.cloud.status ? alpha25.cloud.status() : null,
    configure: (config = {}) => alpha25 && typeof alpha25.configureCloud === 'function' ? alpha25.configureCloud(config) : null
  };
  api.autoUpdate = {
    status: () => alpha26 && alpha26.updater && alpha26.updater.status ? alpha26.updater.status() : null,
    check: () => alpha26 && alpha26.updater && alpha26.updater.check ? alpha26.updater.check() : Promise.resolve(false),
    applyPending: () => alpha26 && alpha26.updater && alpha26.updater.applyPending ? alpha26.updater.applyPending() : Promise.resolve(false)
  };
  return true;
}

function installProductionLiveServices(api, options = {}) {
  const runtime = api && api.__runtime;
  if (!runtime) return null;

  // These installers are idempotent. Run them before the existing-state early
  // return so a same-version hot reload can repair a runtime that was created by
  // an older production bundle where Alpha27/28 were present in source but never
  // actually attached to the live tick chain.
  const preexistingCloud = runtime.cloudControlPlane || runtime.alpha25ControlCenterBrain && runtime.alpha25ControlCenterBrain.cloud;
  const spriteHookAlreadyInstalled = !!(preexistingCloud && preexistingCloud.__adventureLandItemSpritesInstalled);
  const alpha25 = installAlpha25ControlCenterBrain(runtime, options);
  if (spriteHookAlreadyInstalled) refreshAdventureLandSpriteHook(runtime, alpha25);
  const alpha26 = installAlpha26CloudUpdateLogisticsUiHotfix(runtime, options);
  const alpha27 = installAlpha27CombatMerchantConvergence(runtime, options);
  const ownershipGuard = installAlpha27MerchantLegacyOwnershipGuard(runtime);
  const travelIntelligence = installAlpha27MerchantTravelIntelligence(runtime, alpha27);
  const p0Recovery = installP0RegroupSupplyRecovery(runtime);
  installP0PotionBundleDeltaFix(runtime);
  const potionPolicy4500 = installP0PotionPolicy4500(runtime);
  const potionHardCap4500 = installP0PotionHardCap4500(runtime);
  const roleLiveness = installAlpha31PartyRoleLivenessHotfix(runtime, options);
  const liveRecovery = installAlpha32NavigationMerchantRecovery(runtime, options);
  const liveCorrections = installAlpha33MarkOrbitMerchantDelivery(runtime, options);
  // Alpha31/32 beforeTick can wake or pause live merchant authorities. Installation
  // and same-version hot reload must stay passive; the runtime.tick wrapper below
  // is the only production-live-services path that executes these services.

  if (runtime.productionLiveServices && runtime.productionLiveServices.mode === PRODUCTION_LIVE_SERVICES_MODE) {
    Object.assign(runtime.productionLiveServices, {
      cloudControlPlaneInstalled: !!runtime.cloudControlPlane,
      safeAutoUpdaterInstalled: !!runtime.safeAutoUpdater,
      alpha27ConvergenceInstalled: !!runtime.alpha27CombatMerchantConvergence,
      alpha28LiveAuthorityInstalled: !!runtime.alpha28LiveAuthorityLiveness,
      merchantSingleOwnerGuardInstalled: !!runtime.alpha27MerchantLegacyOwnershipGuard,
      merchantTravelIntelligenceInstalled: !!runtime.alpha27MerchantTravelIntelligence,
      p0RegroupSupplyRecoveryInstalled: !!runtime.p0RegroupSupplyRecovery,
      p0PotionBundleDeltaFixInstalled: !!(runtime.controlledMerchantService && runtime.controlledMerchantService.__p0PotionBundleDeltaFixInstalled),
      p0PotionPolicy4500Installed: !!(runtime.p0PotionPolicy4500 && runtime.p0PotionPolicy4500.installed),
      p0PotionHardCap4500Installed: !!(runtime.p0PotionHardCap4500 && runtime.p0PotionHardCap4500.installed),
      alpha31PartyRoleLivenessInstalled: !!runtime.alpha31PartyRoleLivenessHotfix,
      alpha32NavigationMerchantRecoveryInstalled: !!runtime.alpha32NavigationMerchantRecovery,
      alpha33MarkOrbitMerchantDeliveryInstalled: !!runtime.alpha33MarkOrbitMerchantDelivery
    });
    exposeDiagnostics(api, alpha25, alpha26, alpha27, ownershipGuard, travelIntelligence, p0Recovery, potionPolicy4500, potionHardCap4500, roleLiveness, liveRecovery, liveCorrections);
    return runtime.productionLiveServices;
  }

  if (!runtime.__productionLiveServicesTickPatched) {
    const baseTick = runtime.tick.bind(runtime);
    runtime.tick = (...args) => {
      const result = baseTick(...args);
      runService(runtime, runtime.alpha25ControlCenterBrain, 'alpha25-control-center');
      runService(runtime, runtime.alpha26CloudUpdateLogisticsUiHotfix, 'alpha26-release-manager');
      runService(runtime, runtime.p0RegroupSupplyRecovery, 'p0-regroup-supply-recovery');
      // Alpha32 must run before Alpha31 so a low-HP merchant can enter recovery
      // before Alpha31 drives another autonomous merchant turn.
      runService(runtime, runtime.alpha32NavigationMerchantRecovery, 'alpha32-navigation-merchant-recovery');
      runService(runtime, runtime.alpha31PartyRoleLivenessHotfix, 'alpha31-party-role-liveness');
      return result;
    };
    runtime.__productionLiveServicesTickPatched = true;
  }

  const state = {
    mode: PRODUCTION_LIVE_SERVICES_MODE,
    installedAt: typeof runtime.now === 'function' ? runtime.now() : Date.now(),
    cloudControlPlaneInstalled: !!runtime.cloudControlPlane,
    safeAutoUpdaterInstalled: !!runtime.safeAutoUpdater,
    alpha27ConvergenceInstalled: !!runtime.alpha27CombatMerchantConvergence,
    alpha28LiveAuthorityInstalled: !!runtime.alpha28LiveAuthorityLiveness,
    merchantSingleOwnerGuardInstalled: !!runtime.alpha27MerchantLegacyOwnershipGuard,
    merchantTravelIntelligenceInstalled: !!runtime.alpha27MerchantTravelIntelligence,
    p0RegroupSupplyRecoveryInstalled: !!runtime.p0RegroupSupplyRecovery,
    p0PotionBundleDeltaFixInstalled: !!(runtime.controlledMerchantService && runtime.controlledMerchantService.__p0PotionBundleDeltaFixInstalled),
    p0PotionPolicy4500Installed: !!(runtime.p0PotionPolicy4500 && runtime.p0PotionPolicy4500.installed),
    p0PotionHardCap4500Installed: !!(runtime.p0PotionHardCap4500 && runtime.p0PotionHardCap4500.installed),
    alpha31PartyRoleLivenessInstalled: !!runtime.alpha31PartyRoleLivenessHotfix,
    alpha32NavigationMerchantRecoveryInstalled: !!runtime.alpha32NavigationMerchantRecovery,
    alpha33MarkOrbitMerchantDeliveryInstalled: !!runtime.alpha33MarkOrbitMerchantDelivery,
    tickPatched: runtime.__productionLiveServicesTickPatched === true
  };
  runtime.productionLiveServices = state;
  exposeDiagnostics(api, alpha25, alpha26, alpha27, ownershipGuard, travelIntelligence, p0Recovery, potionPolicy4500, potionHardCap4500, roleLiveness, liveRecovery, liveCorrections);

  runService(runtime, alpha25, 'alpha25-control-center');
  runService(runtime, alpha26, 'alpha26-release-manager');
  runService(runtime, p0Recovery, 'p0-regroup-supply-recovery');

  try {
    if (runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({ component: 'production-live-services', event: 'PRODUCTION_LIVE_SERVICES_INSTALLED', data: { ...state } });
    }
  } catch (_) {}
  return state;
}

module.exports = {
  PRODUCTION_LIVE_SERVICES_MODE,
  SPRITE_HOT_RELOAD_HOOK_VERSION,
  installProductionLiveServices,
  refreshAdventureLandSpriteHook,
  runService,
  exposeDiagnostics,
  installP0RegroupSupplyRecovery,
  P0_REGROUP_SUPPLY_RECOVERY_MODE,
  installP0PotionBundleDeltaFix,
  P0_POTION_BUNDLE_DELTA_FIX_MODE,
  installP0PotionPolicy4500,
  P0_POTION_POLICY_4500_MODE,
  installP0PotionHardCap4500,
  P0_POTION_HARDCAP_4500_MODE,
  installAlpha31PartyRoleLivenessHotfix,
  ALPHA31_PARTY_ROLE_LIVENESS_MODE,
  installAlpha32NavigationMerchantRecovery,
  ALPHA32_NAVIGATION_MERCHANT_RECOVERY_MODE,
  installAlpha33MarkOrbitMerchantDelivery,
  ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE
};
