'use strict';

const { installAlpha25ControlCenterBrain } = require('./reliability/alpha25-control-center-brain');
const { installAlpha26CloudUpdateLogisticsUiHotfix } = require('./reliability/alpha26-cloud-update-logistics-ui-hotfix');
const { installAlpha27CombatMerchantConvergence } = require('./reliability/alpha27-combat-merchant-convergence');
const { installFullTestAuthorityHotfix } = require('./reliability/alpha20-42-full-test-authority-hotfix');

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

function exposeDiagnostics(api, alpha25, alpha26, alpha27, fullTest) {
  if (!api || typeof api !== 'object') return false;
  api.liveServices = {
    status: () => ({
      mode: PRODUCTION_LIVE_SERVICES_MODE,
      cloud: alpha25 && alpha25.cloud && alpha25.cloud.status ? alpha25.cloud.status() : null,
      autoUpdater: alpha26 && alpha26.updater && alpha26.updater.status ? alpha26.updater.status() : null,
      alpha27: alpha27 && alpha27.status ? alpha27.status() : null,
      fullTestAuthority: fullTest && fullTest.status ? fullTest.status() : null
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
  api.merchantFullTest = {
    status: () => fullTest && fullTest.status ? fullTest.status() : null,
    refreshAuthority: () => fullTest && fullTest.ensureAuthorities ? fullTest.ensureAuthorities(true) : false,
    buy: (itemName, quantity = 1) => fullTest && fullTest.buy ? fullTest.buy(itemName, quantity) : Promise.resolve({ executed: false, committed: false, reason: 'FULL_TEST_AUTHORITY_UNAVAILABLE' }),
    town: () => fullTest && fullTest.town ? fullTest.town() : { executed: false, reason: 'FULL_TEST_AUTHORITY_UNAVAILABLE' }
  };
  return true;
}

function installProductionLiveServices(api, options = {}) {
  const runtime = api && api.__runtime;
  if (!runtime) return null;
  if (runtime.productionLiveServices && runtime.productionLiveServices.mode === PRODUCTION_LIVE_SERVICES_MODE) {
    exposeDiagnostics(api, runtime.alpha25ControlCenterBrain, runtime.alpha26CloudUpdateLogisticsUiHotfix, runtime.alpha27CombatMerchantConvergence, runtime.fullTestAuthorityHotfix);
    return runtime.productionLiveServices;
  }

  const alpha25 = installAlpha25ControlCenterBrain(runtime, options);
  const alpha26 = installAlpha26CloudUpdateLogisticsUiHotfix(runtime, options);
  const alpha27 = installAlpha27CombatMerchantConvergence(runtime, options);
  const fullTest = installFullTestAuthorityHotfix(runtime, options);

  if (!runtime.__productionLiveServicesTickPatched) {
    const baseTick = runtime.tick.bind(runtime);
    runtime.tick = (...args) => {
      const result = baseTick(...args);
      runService(runtime, runtime.fullTestAuthorityHotfix, 'alpha20.42-full-test-authority');
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
    alpha27CombatMerchantConvergenceInstalled: !!runtime.alpha27CombatMerchantConvergence,
    fullMerchantTestAuthorityInstalled: !!runtime.fullTestAuthorityHotfix,
    tickPatched: runtime.__productionLiveServicesTickPatched === true
  };
  runtime.productionLiveServices = state;
  exposeDiagnostics(api, alpha25, alpha26, alpha27, fullTest);

  runService(runtime, fullTest, 'alpha20.42-full-test-authority');
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
