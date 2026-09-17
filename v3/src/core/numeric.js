'use strict';

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max, fallback = min) {
  const number = finite(value, fallback);
  return Math.max(min, Math.min(max, number));
}

function clamp01(value) {
  return clamp(value, 0, 1, 0);
}

function ratio(value, max, fallback = 0) {
  const denominator = finite(max, 0);
  if (denominator <= 0) return clamp01(fallback);
  return clamp01(finite(value, 0) / denominator);
}

module.exports = { finite, clamp, clamp01, ratio };
