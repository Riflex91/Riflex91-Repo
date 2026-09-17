'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
function read(rel) { return fs.readFileSync(path.resolve(root, rel), 'utf8'); }

test('production entry installs cloud heartbeat and safe updater services', () => {
  const source = read('src/index-production.js');
  assert.match(source, /require\('\.\/production-live-services'\)/);
  assert.match(source, /installProductionLiveServices\(api, options\)/);
});

test('production live services wire Alpha25 cloud control, Alpha26 updater, and Alpha27\/28 merchant authority', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /installAlpha25ControlCenterBrain/);
  assert.match(source, /installAlpha26CloudUpdateLogisticsUiHotfix/);
  assert.match(source, /installAlpha27CombatMerchantConvergence/);
  assert.match(source, /runtime\.alpha25ControlCenterBrain/);
  assert.match(source, /runtime\.alpha26CloudUpdateLogisticsUiHotfix/);
  assert.match(source, /runtime\.alpha27CombatMerchantConvergence/);
  assert.match(source, /runtime\.alpha28LiveAuthorityLiveness/);
  assert.match(source, /alpha27ConvergenceInstalled/);
  assert.match(source, /alpha28LiveAuthorityInstalled/);
  assert.match(source, /const alpha27 = installAlpha27CombatMerchantConvergence[\s\S]*if \(runtime\.productionLiveServices/);
  assert.match(source, /cloudControlPlaneInstalled/);
  assert.match(source, /safeAutoUpdaterInstalled/);
});

test('Alpha31 liveness stays passive during install and runs only from the runtime tick chain', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /const roleLiveness = installAlpha31PartyRoleLivenessHotfix\(runtime, options\)/);
  assert.match(source, /runtime\.tick = \(\.\.\.args\) => \{[\s\S]*runService\(runtime, runtime\.alpha31PartyRoleLivenessHotfix, 'alpha31-party-role-liveness'\)/);
  assert.doesNotMatch(source, /runService\(runtime, roleLiveness, 'alpha31-party-role-liveness'\)/);
});

test('merchant production and Alpha27 autonomy mutually observe busy ownership', () => {
  const production = read('src/merchant/merchant-production-controller.js');
  const autonomy = read('src/reliability/alpha27-merchant-autonomy.js');
  assert.match(production, /runtime\.alpha27CombatMerchantConvergence/);
  assert.match(production, /atomic\.merchantBusy \|\| atomic\.serviceTravelBusy/);
  assert.match(production, /alpha27Busy\(\)/);
  assert.match(autonomy, /runtime\.merchantProductionStatus/);
  assert.match(autonomy, /productionStatus\.executionPending/);
  assert.match(autonomy, /MERCHANT_PRODUCTION_BUSY/);
});

test('production entry replaces an older in-memory AIO runtime before reinstalling', () => {
  const source = read('src/index-production.js');
  assert.match(source, /existing\.version/);
  assert.match(source, /base\.VERSION/);
  assert.match(source, /existing\.stop/);
  assert.match(source, /delete root\.AIO_V3/);
  assert.match(source, /replaceOlderRuntime\(root\)/);
});

test('live diagnostics expose cloud, updater, convergence, and live-authority state', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /api\.cloud\s*=/);
  assert.match(source, /api\.autoUpdate\s*=/);
  assert.match(source, /api\.liveServices\s*=/);
  assert.match(source, /convergence:/);
  assert.match(source, /liveAuthority:/);
});