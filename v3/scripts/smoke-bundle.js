'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');

const code = fs.readFileSync(require('path').resolve(__dirname, '../dist/aio-v3.js'), 'utf8');
const sandbox = {
  AIO_V3_AUTOSTART: false,
  console,
  setInterval,
  clearInterval,
  Date,
  Math,
  parent: { entities: {}, party: {} },
  character: { name: 'Smoke', ctype: 'ranger', level: 1, map: 'main', real_x: 0, real_y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, xp: 0, gold: 0, items: [], speed: 40 },
  G: { monsters: {}, maps: { main: {} }, skills: {} }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
assert.ok(sandbox.AIO_V3);
assert.equal(sandbox.AIO_V3.version, '3.0.0-alpha.8.4');
assert.equal(sandbox.AIO_V3.status().mode, 'shadow');
assert.ok(sandbox.AIO_V3.status().combatRisk);
assert.equal(typeof sandbox.AIO_V3.status().combatRisk.threshold, 'number');
assert.ok(sandbox.AIO_V3.status().combatEmergency);
assert.equal(typeof sandbox.AIO_V3.status().combatEmergency.criticalHpRatio, 'number');
assert.equal(typeof sandbox.AIO_V3.status().combatEmergency.multiAggroHpRatio, 'number');
assert.ok(sandbox.AIO_V3.performance);
assert.ok(sandbox.AIO_V3.research);
assert.ok(sandbox.AIO_V3.farmer);
assert.equal(typeof sandbox.AIO_V3.farmer.status, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.setTargetPolicy, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.addTargetExclusion, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.removeTargetExclusion, 'function');
assert.ok(sandbox.AIO_V3.farmer.status().targetExclusions.includes('automatron'));
assert.equal(sandbox.AIO_V3.farmer.status().targetPolicy, 'party-only');
assert.ok(sandbox.AIO_V3.farmer.status().kiting);
assert.equal(sandbox.AIO_V3.farmer.status().kiting.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().kiting.minRange, 'number');
assert.ok(sandbox.AIO_V3.farmer.status().skillUsage);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().skillUsage.mpReserveRatio, 'number');
assert.equal(typeof sandbox.AIO_V3.farmer.status().skillUsage.minIntervalMs, 'number');
assert.ok(sandbox.AIO_V3.farmer.status().targetReassessment);
assert.equal(sandbox.AIO_V3.farmer.status().targetReassessment.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().targetReassessment.minIntervalMs, 'number');
assert.equal(typeof sandbox.AIO_V3.farmer.status().targetReassessment.switchCooldownMs, 'number');
assert.equal(sandbox.AIO_V3.farmer.setTargetPolicy('allow'), 'allow');
assert.equal(sandbox.AIO_V3.farmer.status().targetPolicy, 'allow');
assert.equal(typeof sandbox.AIO_V3.saveWorld, 'function');
assert.equal(typeof sandbox.AIO_V3.showStatus, 'function');
console.log('bundle smoke OK');
