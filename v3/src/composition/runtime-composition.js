'use strict';

const { Runtime } = require('../runtime');
const { StabilityRuntime, composeStabilityRuntime } = require('../stability/stability-runtime');
const { Alpha9Runtime, composeAlpha9Runtime } = require('../autonomy/alpha9-runtime');
const { Alpha10Runtime, composeAlpha10Runtime } = require('../autonomy/alpha10-runtime');
const { Alpha11Runtime, composeAlpha11Runtime } = require('../autonomy/alpha11-runtime');
const { Alpha12Runtime: BaseAlpha12Runtime, composeAlpha12Runtime } = require('../autonomy/alpha12-runtime');
const { Alpha12Runtime: HardenedAlpha12Runtime, composeHardenedAlpha12Runtime } = require('../autonomy/alpha12-hardened-runtime');
const { Alpha13Runtime, composeAlpha13Runtime } = require('../autonomy/alpha13-runtime');
const { Alpha14Runtime, composeAlpha14Runtime } = require('../autonomy/alpha14-runtime');
const { Alpha15Runtime, composeAlpha15Runtime } = require('../autonomy/alpha15-runtime');
const { Alpha16Runtime, composeAlpha16Runtime } = require('../autonomy/alpha16-runtime');
const { Alpha17Runtime, composeAlpha17Runtime } = require('../autonomy/alpha17-runtime');
const { Alpha18Runtime, composeAlpha18Runtime } = require('../autonomy/alpha18-runtime');
const { Alpha19Runtime, composeAlpha19Runtime } = require('../autonomy/alpha19-runtime');
const { Alpha20Runtime, composeAlpha20Runtime } = require('../autonomy/alpha20-runtime');
const { Alpha20_5MerchantRuntime, composeAlpha20_5MerchantRuntime } = require('../autonomy/alpha20-5-merchant-runtime');
const {
  Alpha20_5FarmReadinessRuntime,
  prepareAlpha20_5FarmReadinessOptions,
  composeAlpha20_5FarmReadinessRuntime
} = require('../autonomy/alpha20-5-farm-readiness-runtime');
const { assertRuntimeLifecycle } = require('./runtime-lifecycle');

const COMPOSED_RUNTIME = Symbol.for('AIO_V3_RUNTIME_COMPOSED');
const COMPOSITION_MODE = 'runtime-composition-v1';

const METHOD_LAYERS = Object.freeze([
  StabilityRuntime,
  Alpha9Runtime,
  Alpha10Runtime,
  Alpha11Runtime,
  BaseAlpha12Runtime,
  HardenedAlpha12Runtime,
  Alpha13Runtime,
  Alpha14Runtime,
  Alpha15Runtime,
  Alpha16Runtime,
  Alpha17Runtime,
  Alpha18Runtime,
  Alpha19Runtime,
  Alpha20Runtime,
  Alpha20_5MerchantRuntime,
  Alpha20_5FarmReadinessRuntime
]);

const COMPATIBILITY_TYPES = METHOD_LAYERS;

function bindLayerMethods(targetType, layerTypes) {
  for (const LayerType of layerTypes) {
    for (const name of Object.getOwnPropertyNames(LayerType.prototype)) {
      if (name === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(LayerType.prototype, name);
      if (!descriptor || typeof descriptor.value !== 'function') continue;
      Object.defineProperty(targetType.prototype, name, {
        configurable: true,
        writable: true,
        value: function composedLayerMethod(...args) {
          return descriptor.value.apply(this, args);
        }
      });
    }
  }
}

function installCompatibilityHasInstance(Type) {
  if (!Type || Type.__aioComposedHasInstanceInstalled) return;
  const nativeHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Type, Symbol.hasInstance, {
    configurable: true,
    value(instance) {
      return nativeHasInstance.call(this, instance) || !!(instance && instance[COMPOSED_RUNTIME]);
    }
  });
  Object.defineProperty(Type, '__aioComposedHasInstanceInstalled', { value: true });
}

function serviceGroup(runtime, names) {
  const result = {};
  for (const name of names) if (runtime[name] !== undefined) result[name] = runtime[name];
  return Object.freeze(result);
}

function buildServiceGroups(runtime) {
  return Object.freeze({
    gameStability: serviceGroup(runtime, [
      'adapter', 'scheduler', 'world', 'persistence', 'knowledgeAging',
      'stability', 'globalSupervisor', 'contentDrift', 'skillCatalog', 'skillPolicy'
    ]),
    merchantEconomyTravel: serviceGroup(runtime, [
      'inventoryLedger', 'gearProgression', 'transactionEngine', 'controlledMerchant',
      'safeTravel', 'controlledTravel', 'bankCapacity', 'bankExpansionTransactions',
      'controlledBankExpansion', 'merchantSpaceRecoveryJournal',
      'controlledBankConsolidation', 'controlledMerchantSpaceRecovery',
      'merchantServicePlanner', 'merchantRouteEstimator', 'controlledMerchantService',
      'merchantMluck'
    ]),
    farmerPartyReliability: serviceGroup(runtime, [
      'farmer', 'localFarmPlanner', 'localFarming', 'brain', 'characterRegistry',
      'characterCombatProfiles', 'characterCapabilityResolver', 'partyCapabilityResolver',
      'partyPerformance', 'partyOrchestrator', 'auraPolicy', 'partyTelemetry',
      'partyTransitions', 'partyControlLease', 'partyLifecycle',
      'controlledPartyLifecycle', 'controlledPaladinAura', 'controlledFarmerLoot',
      'controlledAutoRespawn', 'preFarmingReliability', 'liveNavigationHotfix',
      'farmerLocalPlanPriority', 'farmerTargetEfficiencyHotfix',
      'farmerTravelSafetyHotfix', 'farmerTerrainNavigationHotfix',
      'farmerResourceTopoffHotfix', 'partyFocusFireHotfix',
      'teamCombatCohesionHotfix', 'teamCohesionDeadlockHotfix',
      'controlledPartyLogistics', 'farmAreaPressureHotfix',
      'partyPersistenceQuotaHotfix', 'dangerousContentHotfix',
      'contentDriftStorageHotfix', 'contentDriftSemanticRecovery',
      'partyAccountCommunication', 'partyBootstrap',
      'partyBootstrapMerchantDiscoveryHotfix', 'partyBootstrapFarmerGate'
    ])
  });
}

class RuntimeComposition extends Runtime {
  constructor(options = {}) {
    const preparedOptions = prepareAlpha20_5FarmReadinessOptions(options);
    super(preparedOptions);

    composeStabilityRuntime.call(this, preparedOptions);
    composeAlpha9Runtime.call(this, preparedOptions);
    composeAlpha10Runtime.call(this, preparedOptions);
    composeAlpha11Runtime.call(this, preparedOptions);
    composeAlpha12Runtime.call(this, preparedOptions);
    composeHardenedAlpha12Runtime.call(this, preparedOptions);
    composeAlpha13Runtime.call(this, preparedOptions);
    composeAlpha14Runtime.call(this, preparedOptions);
    composeAlpha15Runtime.call(this, preparedOptions);
    composeAlpha16Runtime.call(this, preparedOptions);
    composeAlpha17Runtime.call(this, preparedOptions);
    composeAlpha18Runtime.call(this, preparedOptions);
    composeAlpha19Runtime.call(this, preparedOptions);
    composeAlpha20Runtime.call(this, preparedOptions);
    composeAlpha20_5MerchantRuntime.call(this, preparedOptions);
    composeAlpha20_5FarmReadinessRuntime.call(this, options);

    Object.defineProperty(this, COMPOSED_RUNTIME, { value: true });
    this.runtimeCompositionServices = buildServiceGroups(this);
    assertRuntimeLifecycle(this);
  }

  compositionStatus() {
    return {
      schemaVersion: 1,
      mode: COMPOSITION_MODE,
      productionConstruction: 'composition-root',
      inheritedAlphaRuntime: false,
      compatibilityFacadePreserved: true,
      serviceGroups: {
        gameStability: Object.keys(this.runtimeCompositionServices.gameStability),
        merchantEconomyTravel: Object.keys(this.runtimeCompositionServices.merchantEconomyTravel),
        farmerPartyReliability: Object.keys(this.runtimeCompositionServices.farmerPartyReliability)
      }
    };
  }
}

bindLayerMethods(RuntimeComposition, METHOD_LAYERS);
for (const Type of COMPATIBILITY_TYPES) installCompatibilityHasInstance(Type);

function createRuntimeComposition(options = {}) {
  return new RuntimeComposition(options);
}

module.exports = {
  COMPOSED_RUNTIME,
  COMPOSITION_MODE,
  RuntimeComposition,
  createRuntimeComposition
};
