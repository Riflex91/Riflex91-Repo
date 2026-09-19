import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BLOCK86_SOAK_BESTAETIGUNG,
  BLOCK86_SOAK_CANDIDATE_BYTES,
  BLOCK86_SOAK_CANDIDATE_SHA256,
  BLOCK86_SOAK_CANDIDATE_URL,
  BLOCK86_SOAK_DAUER_MILLIS,
  BLOCK86_SOAK_LAUF_KENNUNG,
  BLOCK86_SOAK_RELEASE_SHA,
  BLOCK86_SOAK_SAMPLE_MILLIS,
  baueBlock86SoakPaket
} from '../../werkzeuge/block8-6-soak-paket-bauen.mjs';

async function paket() {
  return readFile(new URL('../../werkzeuge/block8-6-soak-paket.js', import.meta.url), 'utf8');
}

test('Block 8.6.9 Soak-Paket ist source-locked zu Builder und beiden realen Vorstufen', async () => {
  assert.equal(await paket(), await baueBlock86SoakPaket());
});

test('Block 8.6.9 Soak-Paket bindet Candidate, Schatten und beide Live-Richtungen exakt', async () => {
  const source = await paket();
  assert.equal(BLOCK86_SOAK_RELEASE_SHA, 'ca0dfee7685563c8b6003469300c8fd08777b053');
  assert.equal(BLOCK86_SOAK_CANDIDATE_SHA256, 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5');
  assert.equal(BLOCK86_SOAK_CANDIDATE_BYTES, 396471);
  assert.equal(BLOCK86_SOAK_CANDIDATE_URL, 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js');
  assert.equal(BLOCK86_SOAK_LAUF_KENNUNG, 'block8-6-schatten-1789822653521');
  assert.ok(source.includes('fba08a78942b6d2de9da482bf44df6aac6f8c91349fa13484423554195a886a7'));
  assert.ok(source.includes('becc261eef26a674fe460befcd77dbeca8e9d3ed0fe1901ee026b216e979d4e2'));
  assert.ok(source.includes('"My_Ranger1"'));
  assert.ok(source.includes('"My_Ranger2"'));
  assert.ok(source.includes('"ziele": [\n      "My_Ranger2"'));
  assert.ok(source.includes('"ziele": [\n      "My_Ranger1"'));
});

test('Block 8.6.9 Soak-Paket ist fest auf 10 Minuten und 5 Sekunden Sampling gebunden', async () => {
  const source = await paket();
  assert.equal(BLOCK86_SOAK_DAUER_MILLIS, 600000);
  assert.equal(BLOCK86_SOAK_SAMPLE_MILLIS, 5000);
  assert.ok(source.includes('soakDauerMillisekunden: 600000'));
  assert.ok(source.includes('sampleMillisekunden: 5000'));
  assert.ok(source.includes("modus: 'soak'"));
  assert.ok(source.includes("titel: '3 · Soak starten'"));
  assert.equal(BLOCK86_SOAK_BESTAETIGUNG, 'BLOCK8-6-SOAK-STARTEN:block8-6-schatten-1789822653521');
});

test('Block 8.6.9 Soak-Paket startet Runtime genau einmal und entsperrt erst nach echtem Heartbeat', async () => {
  const source = await paket();
  assert.equal((source.match(/runtime\.starte\(\)/g) ?? []).length, 1);
  const start = source.indexOf('runtime.starte()');
  const heartbeat = source.indexOf('await warteAufProduktionsheartbeat(runtime)', start);
  const freigabe = source.indexOf("test.setzeAktionAktiv('soak', true)", heartbeat);
  assert.ok(start >= 0);
  assert.ok(heartbeat > start);
  assert.ok(freigabe > heartbeat);
  assert.ok(source.includes('status.lebensnachweisSendeErfolge >= 1'));
  assert.ok(source.includes('status.lebensnachweisSendeFehler > 0'));
});

test('Block 8.6.9 Soak-Paket verlangt langfristig beobachtete Remote-Liveness', async () => {
  const source = await paket();
  assert.ok(source.includes('remoteLivenessNeu >= 1'));
  assert.ok(source.includes('beobachteteLebensnachweiseVorher'));
  assert.ok(source.includes('capNachher.beobachteteLebensnachweise'));
  assert.ok(source.includes('Remote-Liveness beobachtet'));
  assert.ok(source.includes('BEIDEN Rangern'));
});

test('Block 8.6.9 Soak-Launcher sendet selbst keine Capability und verlangt weiterhin 0 Sendungen', async () => {
  const source = await paket();
  const start = source.lastIndexOf('async function soak() {');
  const ende = source.indexOf("test.registriereAktion({", start);
  assert.ok(start >= 0);
  assert.ok(ende > start);
  const soakLauncher = source.slice(start, ende);
  assert.ok(soakLauncher.includes('runner.soak(BESTAETIGUNG)'));
  assert.ok(soakLauncher.includes('capNachher.senden.versuche === 0'));
  assert.ok(soakLauncher.includes('capNachher.senden.erfolge === 0'));
  assert.ok(soakLauncher.includes('capNachher.senden.fehler === 0'));
  assert.equal(soakLauncher.includes('sendeCapabilityEinmal('), false);
});

test('Block 8.6.9 Soak-Paket besitzt keine Basisbedienung, keinen Stop und keine direkte Spielaktion', async () => {
  const source = await paket();
  for (const verboten of [
    '.pausiereLebensnachweisAutomatik(',
    '.setzeLebensnachweisAutomatikFort(',
    '.bereiteGruppenZielVor(',
    '.installiereGruppenZielLiveSmoke(',
    '.stoppe(',
    'location.reload(',
    'window.close('
  ]) {
    assert.equal(source.includes(verboten), false, verboten);
  }
  for (const name of [
    'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
    'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
    'buy', 'sell', 'send_item', 'upgrade', 'compound'
  ]) {
    assert.equal(new RegExp('\\b' + name + '\\s*\\(').test(source), false, name);
  }
});
