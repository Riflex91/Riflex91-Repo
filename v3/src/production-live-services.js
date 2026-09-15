'use strict';

const { installAlpha25ControlCenterBrain } = require('./reliability/alpha25-control-center-brain');
const { installAlpha26CloudUpdateLogisticsUiHotfix } = require('./reliability/alpha26-cloud-update-logistics-ui-hotfix');
const { installAlpha27CombatMerchantConvergence } = require('./reliability/alpha27-combat-merchant-convergence');

const PRODUCTION_LIVE_SERVICES_MODE = 'production-live-services-v1';

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

function exposeDiagnostics(api, alpha25, alpha26, alpha27) {
  if (!api || typeof api !== 'object') return false;
  api.liveServices = {
    status: () => ({
      mode: PRODUCTION_LIVE_SERVICES_MODE,
      cloud: alpha25 && alpha25.cloud && alpha25.cloud.status ? alpha25.cloud.status() : null,
      autoUpdater: alpha26 && alpha26.updater && alpha26.updater.status ? alpha26.updater.status() : null,
      convergence: alpha27 && typeof alpha27.status === 'function' ? alpha27.status() : null,
      liveAuthority: alpha27 && alpha27.alpha28 && typeof alpha27.alpha28.status === 'function' ? alpha27.alpha28.status() : null
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
  const alpha25 = installAlpha25ControlCenterBrain(runtime, options);
  const alpha26 = installAlpha26CloudUpdateLogisticsUiHotfix(runtime, options);
  const alpha27 = installAlpha27CombatMerchantConvergence(runtime, options);

  if (runtime.productionLiveServices && runtime.productionLiveServices.mode === PRODUCTION_LIVE_SERVICES_MODE) {
    Object.assign(runtime.productionLiveServices, {
      cloudControlPlaneInstalled: !!runtime.cloudControlPlane,
      safeAutoUpdaterInstalled: !!runtime.safeAutoUpdater,
      alpha27ConvergenceInstalled: !!runtime.alpha27CombatMerchantConvergence,
      alpha28LiveAuthorityInstalled: !!runtime.alpha28LiveAuthorityLiveness
    });
    exposeDiagnostics(api, alpha25, alpha26, alpha27);
    return runtime.productionLiveServices;
  }

  if (!runtime.__productionLiveServicesTickPatched) {
    const baseTick = runtime.tick.bind(runtime);
    runtime.tick = (...args) => {
      const result = baseTick(...args);
      runService(runtime, runtime.alpha25ControlCenterBrain, 'alpha25-control-center');
      runService(runtime, runtime.alpha26CloudUpdateLogisticsUiHotfix, 'alpha26-release-manager');
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
    tickPatched: runtime.__productionLiveServicesTickPatched === true
  };
  runtime.productionLiveServices = state;
  exposeDiagnostics(api, alpha25, alpha26, alpha27);

  runService(runtime, alpha25, 'alpha25-control-center');
  runService(runtime, alpha26, 'alpha26-release-manager');

  try {
    if (runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({ component: 'production-live-services', event: 'PRODUCTION_LIVE_SERVICES_INSTALLED', data: { ...state } });
    }
  } catch (_) {}
  return state;
}

module.exports = {
  PRODUCTION_LIVE_SERVICES_MODE,
  installProductionLiveServices,
  runService,
  exposeDiagnostics
};
