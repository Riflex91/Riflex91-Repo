'use strict';

const base = require('./index');
const { installMerchantProduction, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('./merchant/merchant-production-controller');
const { MerchantProductionPlanner, MERCHANT_PRODUCTION_PLANNER_MODE, ProductionStepKind } = require('./merchant/merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_MODE } = require('./merchant/controlled-merchant-production-executor');

function install(root = globalThis, options = {}) {
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
  root.AIO_V3 = api;
  return api;
}

module.exports = {
  ...base,
  install,
  installMerchantProduction,
  MerchantProductionPlanner,
  MERCHANT_PRODUCTION_PLANNER_MODE,
  ProductionStepKind,
  ControlledMerchantProductionExecutor,
  CONTROLLED_MERCHANT_PRODUCTION_MODE,
  CONTROLLED_MERCHANT_PRODUCTION_ACK
};
