'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'src', 'index.js');
const compositionPath = path.join(root, 'src', 'composition', 'runtime-composition.js');

const indexSource = fs.readFileSync(indexPath, 'utf8');
const compositionSource = fs.readFileSync(compositionPath, 'utf8');

const failures = [];
if (!indexSource.includes("createRuntimeComposition({ ...options, root")) {
  failures.push('src/index.js must construct the production runtime through createRuntimeComposition');
}
if (/new\s+Alpha20_5FarmReadinessRuntime\s*\(/.test(indexSource)) {
  failures.push('src/index.js must not construct the inherited Alpha20.5 runtime directly');
}
if (!/class\s+RuntimeComposition\s+extends\s+Runtime\b/.test(compositionSource)) {
  failures.push('RuntimeComposition must inherit only from the stable Runtime base');
}
if (/class\s+RuntimeComposition\s+extends\s+Alpha/.test(compositionSource)) {
  failures.push('RuntimeComposition must not extend an Alpha runtime layer');
}
for (const composer of [
  'composeStabilityRuntime',
  'composeAlpha9Runtime',
  'composeAlpha10Runtime',
  'composeAlpha11Runtime',
  'composeAlpha12Runtime',
  'composeHardenedAlpha12Runtime',
  'composeAlpha13Runtime',
  'composeAlpha14Runtime',
  'composeAlpha15Runtime',
  'composeAlpha16Runtime',
  'composeAlpha17Runtime',
  'composeAlpha18Runtime',
  'composeAlpha19Runtime',
  'composeAlpha20Runtime',
  'composeAlpha20_5MerchantRuntime',
  'composeAlpha20_5FarmReadinessRuntime'
]) {
  if (!compositionSource.includes(`${composer}.call(this`)) failures.push(`missing composer: ${composer}`);
}
if (!compositionSource.includes('gameStability') ||
    !compositionSource.includes('merchantEconomyTravel') ||
    !compositionSource.includes('farmerPartyReliability')) {
  failures.push('composition root must expose all required service groups');
}

if (failures.length) {
  console.error('runtime composition guard: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('runtime composition guard: OK');
