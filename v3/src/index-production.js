'use strict';

const base = require('./index');
const { installMerchantProduction, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('./merchant/merchant-production-controller');
const { MerchantProductionPlanner, MERCHANT_PRODUCTION_PLANNER_MODE, ProductionStepKind } = require('./merchant/merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_MODE } = require('./merchant/controlled-merchant-production-executor');
const { installProductionLiveServices, PRODUCTION_LIVE_SERVICES_MODE } = require('./production-live-services');

function replaceOlderRuntime(root) {
  const existing = root && root.AIO_V3;
  if (!existing || !existing.__runtime) return false;
  if (String(existing.version || '') === String(base.VERSION || '')) return false;
  try { if (typeof existing.stop === 'function') existing.stop(); } catch (_) {}
  try { delete root.AIO_V3; } catch (_) { root.AIO_V3 = null; }
  return true;
}

function install(root = globalThis, options = {}) {
  replaceOlderRuntime(root);
  const api = base.install(root, options);
  const runtime = api && api.__runtime;
  if (!runtime) return api;
  const controller = installMerchantProduction(runtime, options);
  api.merchantProduction = {
    status: () => controller.status(),
    evaluate: () => controller.evaluate(),
    configure: (config = {}) => controller.configure(config),
    disable: (reason) => controller.disable(reason),
    reconcile: () => controller.reconcile(),
    executeNext: () => controller.cycle(),
    ack: CONTROLLED_MERCHANT_PRODUCTION_ACK
  };
  installProductionLiveServices(api, options);
  root.AIO_V3 = api;
  return api;
}

module.exports = {
  ...base,
  install,
  replaceOlderRuntime,
  installProductionLiveServices,
  PRODUCTION_LIVE_SERVICES_MODE,
  installMerchantProduction,
  MerchantProductionPlanner,
  MERCHANT_PRODUCTION_PLANNER_MODE,
  ProductionStepKind,
  ControlledMerchantProductionExecutor,
  CONTROLLED_MERCHANT_PRODUCTION_MODE,
  CONTROLLED_MERCHANT_PRODUCTION_ACK
};
