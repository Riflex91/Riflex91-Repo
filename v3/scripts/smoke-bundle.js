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
  G: { monsters: {}, maps: { main: {} } }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
assert.ok(sandbox.AIO_V3);
assert.equal(sandbox.AIO_V3.version, '3.0.0-alpha.1');
assert.equal(sandbox.AIO_V3.status().mode, 'shadow');
console.log('bundle smoke OK');
