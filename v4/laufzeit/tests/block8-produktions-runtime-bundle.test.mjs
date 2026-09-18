import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { baueProduktionsRuntime } from '../../werkzeuge/produktions-runtime-bauen.mjs';

test('V4 Produktionsruntime-Bundle wird reproduzierbar aus dem TypeScript-Einstieg gebaut', async () => {
  const a = await baueProduktionsRuntime({ schreiben: false });
  const b = await baueProduktionsRuntime({ schreiben: false });
  assert.equal(a.bundle, b.bundle);
  assert.equal(a.sha256, b.sha256);
  assert.equal(a.sha256, createHash('sha256').update(a.bundle, 'utf8').digest('hex'));
  assert.match(a.sha256, /^[a-f0-9]{64}$/);
  assert.equal(a.sha256Ausgabe, 'dist/aio-v4-runtime.sha256');
  assert.ok(a.module >= 10);
  assert.ok(a.bytes >= 10_000);
  assert.match(a.bundle, /Adventure Land AiO Bot V4 \| generated \| production runtime/);
  assert.match(a.bundle, /V4ProduktionsLaufzeit/);
});

test('V4 Produktionsruntime-Bundle installiert im Browserkontext nur eine standardmaessig gesperrte Runtime', async () => {
  const ergebnis = await baueProduktionsRuntime({ schreiben: false });
  const charakter = {
    id: 'ranger-1', name: 'My_Ranger1', ctype: 'ranger', level: 80,
    hp: 900, max_hp: 1000, mp: 700, max_mp: 800, xp: 1, max_xp: 2, gold: 100,
    attack: 100, frequency: 1, speed: 40, range: 100, armor: 10, resistance: 10,
    map: 'main', in: 'main', x: 0, y: 0, real_x: 0, real_y: 0, moving: false,
    target: null, rip: false, stand: false, items: [], slots: {}
  };
  const parent = {
    character: charakter, entities: {}, party: {}, G: {}, server_region: 'EU', server_identifier: 'I'
  };
  const kontext = vm.createContext({
    console,
    globalThis: null,
    parent,
    character: charakter,
    Date,
    Object,
    Reflect,
    Set,
    Map,
    Math,
    Number,
    String,
    Error,
    Promise
  });
  kontext.globalThis = kontext;
  vm.runInContext(ergebnis.bundle, kontext, { filename: 'aio-v4-runtime.js' });
  assert.equal(typeof kontext.V4ProduktionsLaufzeit?.status, 'function');
  assert.equal(kontext.V4ProduktionsLaufzeit.status().aktivFreigegeben, false);
  assert.equal(kontext.V4ProduktionsLaufzeit.status().empfangInstalliert, false);
});
