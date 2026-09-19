'use strict';

const PROBABILISTIC_FARM_TIME_MODEL = 'POISSON_GAMMA_WILSON_HILFERTY_V1';
const Z50 = 0;
const Z90 = 1.2815515655446004;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gammaQuantileUnitRate(shape, z) {
  const k = Math.max(0.001, finite(shape, 0.001));
  // Wilson-Hilferty approximation for a Gamma(k, theta=1) quantile.
  const base = Math.max(0.000001, 1 - (1 / (9 * k)) + (z / (3 * Math.sqrt(k))));
  return k * Math.pow(base, 3);
}

function throughputConfidence({ measured = false, sampleSeconds = 0 } = {}) {
  if (!measured) return 0.25;
  const seconds = Math.max(0, finite(sampleSeconds, 0));
  // One minute is useful but still weak evidence. Around 30 minutes the
  // throughput estimate is intentionally treated as substantially stronger.
  return clamp(0.45 + 0.55 * (1 - Math.exp(-seconds / 1800)), 0.45, 0.99);
}

function uncertaintyMultiplier(confidence, quantile = 'P90') {
  const c = clamp(finite(confidence, 0.25), 0.05, 0.99);
  const uncertainty = 1 - c;
  if (String(quantile).toUpperCase() === 'P50') return 1 + uncertainty * 0.20;
  return 1 + uncertainty * 0.90;
}

function probabilisticFarmTime({
  requiredUnits,
  unitsPerHour,
  measured = false,
  sampleSeconds = 0,
  evidence = null
} = {}) {
  const units = Math.max(0, finite(requiredUnits, 0));
  const rate = Math.max(0, finite(unitsPerHour, 0));
  if (!(units > 0) || !(rate > 0)) {
    return {
      model: PROBABILISTIC_FARM_TIME_MODEL,
      requiredUnits: units,
      unitsPerHour: rate,
      expectedHours: units > 0 ? Infinity : 0,
      p50Hours: units > 0 ? Infinity : 0,
      p90Hours: units > 0 ? Infinity : 0,
      confidence: measured ? throughputConfidence({ measured, sampleSeconds }) : 0,
      evidence: evidence || null,
      measured: measured === true,
      sampleSeconds: Math.max(0, finite(sampleSeconds, 0))
    };
  }

  const confidence = throughputConfidence({ measured, sampleSeconds });
  const expectedHours = units / rate;
  const gammaP50 = gammaQuantileUnitRate(units, Z50) / rate;
  const gammaP90 = gammaQuantileUnitRate(units, Z90) / rate;
  const p50Hours = Math.max(0, gammaP50 * uncertaintyMultiplier(confidence, 'P50'));
  // P90 is deliberately not allowed below the mathematical expectation. This
  // keeps rare/small-count paths conservative for 24/7 scheduling.
  const p90Hours = Math.max(
    expectedHours,
    gammaP90 * uncertaintyMultiplier(confidence, 'P90')
  );

  return {
    model: PROBABILISTIC_FARM_TIME_MODEL,
    requiredUnits: units,
    unitsPerHour: rate,
    expectedHours,
    p50Hours,
    p90Hours,
    confidence,
    evidence: evidence || (measured ? 'MEASURED_THROUGHPUT' : 'CONSERVATIVE_FALLBACK_THROUGHPUT'),
    measured: measured === true,
    sampleSeconds: Math.max(0, finite(sampleSeconds, 0)),
    rareDrop: units <= 3 || rate < 1,
    decisionQuantile: 'P90'
  };
}

function probabilisticOperations({ requiredRewards, rewardUnitsPerOperation } = {}) {
  const rewards = Math.max(0, finite(requiredRewards, 0));
  const yieldPerOperation = Math.max(0, finite(rewardUnitsPerOperation, 0));
  if (!(rewards > 0) || !(yieldPerOperation > 0)) {
    return {
      model: PROBABILISTIC_FARM_TIME_MODEL,
      expectedOperations: rewards > 0 ? Infinity : 0,
      p50Operations: rewards > 0 ? Infinity : 0,
      p90Operations: rewards > 0 ? Infinity : 0
    };
  }
  const expectedOperations = rewards / yieldPerOperation;
  const effectiveShape = Math.max(0.001, expectedOperations);
  const p50Operations = Math.max(1, Math.ceil(gammaQuantileUnitRate(effectiveShape, Z50)));
  const p90Operations = Math.max(
    Math.ceil(expectedOperations),
    Math.ceil(gammaQuantileUnitRate(effectiveShape, Z90))
  );
  return {
    model: PROBABILISTIC_FARM_TIME_MODEL,
    expectedOperations,
    p50Operations,
    p90Operations,
    rewardUnitsPerOperation: yieldPerOperation,
    requiredRewards: rewards,
    decisionQuantile: 'P90'
  };
}

module.exports = {
  PROBABILISTIC_FARM_TIME_MODEL,
  probabilisticFarmTime,
  probabilisticOperations,
  throughputConfidence,
  gammaQuantileUnitRate
};
