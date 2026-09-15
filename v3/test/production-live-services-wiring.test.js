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

test('production live services wire Alpha25 cloud control and Alpha26 updater into runtime ticks', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /installAlpha25ControlCenterBrain/);
  assert.match(source, /installAlpha26CloudUpdateLogisticsUiHotfix/);
  assert.match(source, /runtime\.alpha25ControlCenterBrain/);
  assert.match(source, /runtime\.alpha26CloudUpdateLogisticsUiHotfix/);
  assert.match(source, /cloudControlPlaneInstalled/);
  assert.match(source, /safeAutoUpdaterInstalled/);
});

test('production entry replaces an older in-memory AIO runtime before reinstalling', () => {
  const source = read('src/index-production.js');
  assert.match(source, /existing\.version/);
  assert.match(source, /base\.VERSION/);
  assert.match(source, /existing\.stop/);
  assert.match(source, /delete root\.AIO_V3/);
  assert.match(source, /replaceOlderRuntime\(root\)/);
});

test('live diagnostics expose cloud and updater state', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /api\.cloud\s*=/);
  assert.match(source, /api\.autoUpdate\s*=/);
  assert.match(source, /api\.liveServices\s*=/);
});
