import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import test from 'node:test';
import vm from 'node:vm';

const datei = new URL('../../werkzeuge/adventure-land-v4-bootstrap.js', import.meta.url);

function sha256(wert) {
  return createHash('sha256').update(wert, 'utf8').digest('hex');
}

async function ladeKontext({
  runtimeUrl = null,
  runtimeCode = null,
  runtimeSha256 = runtimeCode === null ? null : sha256(runtimeCode)
} = {}) {
  const code = await readFile(datei, 'utf8');
  const fetchAufrufe = [];
  const config = {};
  if (runtimeUrl !== null) config.runtimeUrl = runtimeUrl;
  if (runtimeSha256 !== null) config.runtimeSha256 = runtimeSha256;
  const kontext = vm.createContext({
    console,
    globalThis: null,
    AIO_V4_BOOTSTRAP_CONFIG: config,
    crypto: webcrypto,
    TextEncoder,
    Uint8Array,
    fetch: async (url, optionen) => {
      fetchAufrufe.push({ url, optionen });
      return {
        ok: true,
        status: 200,
        async text() {
          return runtimeCode ?? '';
        }
      };
    }
  });
  kontext.globalThis = kontext;
  vm.runInContext(code, kontext, { filename: 'adventure-land-v4-bootstrap.js' });
  return { code, kontext, fetchAufrufe };
}

function gueltigeRuntime() {
  const kern = `/* Adventure Land AiO Bot V4 | generated | production runtime */\n(function(root){root.V4ProduktionsLaufzeit=Object.freeze({status:function(){return {aktivFreigegeben:false};},stoppe:function(){return true;}});})(globalThis);\n`;
  return kern + '/*' + 'x'.repeat(10_100) + '*/';
}

test('V4 Adventure-Land-Bootstrap bleibt ohne explizite Runtime-URL blockiert', async () => {
  const u = await ladeKontext();
  assert.equal(u.kontext.V4Bootstrap.status().runtimeUrlKonfiguriert, false);
  assert.equal(u.kontext.V4Bootstrap.status().runtimeSha256Konfiguriert, false);
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /runtimeUrl fehlt/);
  assert.equal(u.fetchAufrufe.length, 0);
});

test('V4 Adventure-Land-Bootstrap laedt genau einmal eine markierte Produktionsruntime', async () => {
  const u = await ladeKontext({
    runtimeUrl: 'https://example.invalid/v4/aio-v4-runtime.js',
    runtimeCode: gueltigeRuntime()
  });
  const status = await u.kontext.V4Bootstrap.lade();
  assert.equal(status.bereit, true);
  assert.equal(status.geladenVon, 'https://example.invalid/v4/aio-v4-runtime.js');
  assert.equal(status.geladenerSha256, sha256(gueltigeRuntime()));
  assert.equal(status.runtimeSha256Konfiguriert, true);
  assert.equal(u.fetchAufrufe.length, 1);
  assert.equal(u.fetchAufrufe[0].optionen.cache, 'no-store');
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /bereits verbraucht/);
});

test('V4 Adventure-Land-Bootstrap blockiert ohne expliziten Runtime-SHA-256 vor dem Download', async () => {
  const runtimeCode = gueltigeRuntime();
  const u = await ladeKontext({
    runtimeUrl: 'https://example.invalid/v4/aio-v4-runtime.js',
    runtimeCode,
    runtimeSha256: null
  });
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /runtimeSha256 fehlt/);
  assert.equal(u.fetchAufrufe.length, 0);
});

test('V4 Adventure-Land-Bootstrap blockiert Nicht-HTTPS vor dem Download', async () => {
  const runtimeCode = gueltigeRuntime();
  const u = await ladeKontext({
    runtimeUrl: 'http://example.invalid/v4/aio-v4-runtime.js',
    runtimeCode
  });
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /HTTPS-URL/);
  assert.equal(u.fetchAufrufe.length, 0);
});

test('V4 Adventure-Land-Bootstrap lehnt Runtime mit falschem SHA-256 vor eval ab', async () => {
  const runtimeCode = gueltigeRuntime();
  const u = await ladeKontext({
    runtimeUrl: 'https://example.invalid/v4/aio-v4-runtime.js',
    runtimeCode,
    runtimeSha256: '0'.repeat(64)
  });
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /SHA-256 .* stimmt nicht/);
  assert.equal(u.kontext.V4Bootstrap.status().bereit, false);
  assert.equal(u.kontext.V4Bootstrap.status().geladenerSha256, null);
  assert.equal(u.fetchAufrufe.length, 1);
});

test('V4 Adventure-Land-Bootstrap lehnt unmarkierte Runtime ab', async () => {
  const u = await ladeKontext({
    runtimeUrl: 'https://example.invalid/falsch.js',
    runtimeCode: 'x'.repeat(10_100)
  });
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /Produktionsruntime-Marker/);
  assert.equal(u.kontext.V4Bootstrap.status().bereit, false);
});

test('V4 Adventure-Land-Bootstrap ueberschreibt keine bestehende Produktionsruntime', async () => {
  const u = await ladeKontext({
    runtimeUrl: 'https://example.invalid/v4/aio-v4-runtime.js',
    runtimeCode: gueltigeRuntime()
  });
  u.kontext.V4ProduktionsLaufzeit = Object.freeze({ status() { return {}; } });
  await assert.rejects(() => u.kontext.V4Bootstrap.lade(), /bereits vorhanden/);
  assert.equal(u.fetchAufrufe.length, 0);
});

test('V4 Adventure-Land-Bootstrap besitzt keinen Adventure-Land-Spielaufruf', async () => {
  const u = await ladeKontext();
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
    assert.doesNotMatch(u.code, new RegExp(`\\b${name}\\s*\\(`));
  }
});
