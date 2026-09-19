import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BLOCK86_LIVE_BESTAETIGUNG,
  BLOCK86_LIVE_CANDIDATE_BYTES,
  BLOCK86_LIVE_CANDIDATE_SHA256,
  BLOCK86_LIVE_CANDIDATE_URL,
  BLOCK86_LIVE_LAUF_KENNUNG,
  BLOCK86_LIVE_RELEASE_SHA,
  baueBlock86LivePaket
} from '../../werkzeuge/block8-6-live-paket-bauen.mjs';

async function paket() {
  return readFile(new URL('../../werkzeuge/block8-6-live-paket.js', import.meta.url), 'utf8');
}

test('Block 8.6.9 Livepaket ist source-locked zum Builder und kanonischen Schattennachweis', async () => {
  assert.equal(await paket(), await baueBlock86LivePaket());
});

test('Block 8.6.9 Livepaket bindet Candidate und bestandene Schattenuebergabe exakt', async () => {
  const source = await paket();
  assert.equal(BLOCK86_LIVE_RELEASE_SHA, 'ca0dfee7685563c8b6003469300c8fd08777b053');
  assert.equal(BLOCK86_LIVE_CANDIDATE_SHA256, 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5');
  assert.equal(BLOCK86_LIVE_CANDIDATE_BYTES, 396471);
  assert.equal(BLOCK86_LIVE_CANDIDATE_URL, 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js');
  assert.equal(BLOCK86_LIVE_LAUF_KENNUNG, 'block8-6-schatten-1789822653521');
  assert.equal(BLOCK86_LIVE_BESTAETIGUNG, 'BLOCK8-6-KONTROLLIERT-LIVE:block8-6-schatten-1789822653521');
  assert.ok(source.includes('"nachweisKennung": "block8-6-schatten-1789822653521:schatten"'));
  assert.ok(source.includes('"ergebnis": "bestanden"'));
  assert.ok(source.includes('"spielAktionAusgefuehrt": false'));
  assert.equal(source.includes('[Zirkulaere Referenz]'), false);
});

test('Block 8.6.9 Livepaket begrenzt Vertrauensraum auf die beiden Ranger', async () => {
  const source = await paket();
  assert.ok(source.includes("vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2'])"));
  assert.ok(source.includes("koordinationsNamen: Object.freeze(['My_Ranger1', 'My_Ranger2'])"));
  assert.ok(source.includes("if (!VERTRAUENS_NAMEN.includes(localName))"));
  assert.ok(source.includes("ziel.length !== 1"));
  assert.ok(source.includes("capStatus.senden.versuche !== 0"));
});

test('Block 8.6.9 Livepaket startet Runtime exakt einmal und entsperrt erst nach bestaetigtem Heartbeat', async () => {
  const source = await paket();
  assert.equal((source.match(/runtime\.starte\(\)/g) ?? []).length, 1);
  const start = source.indexOf('runtime.starte()');
  const heartbeat = source.indexOf('await warteAufProduktionsheartbeat(runtime)', start);
  const freigabe = source.indexOf("test.setzeAktionAktiv('kontrolliert-live', true)", heartbeat);
  assert.ok(start >= 0);
  assert.ok(heartbeat > start);
  assert.ok(freigabe > heartbeat);
  assert.ok(source.includes('status.lebensnachweisSendeErfolge >= 1'));
  assert.ok(source.includes('status.lebensnachweisSendeFehler > 0'));
  assert.ok(source.includes('Innerhalb von 10 Sekunden wurde kein bestaetigter Produktionsheartbeat erreicht'));
});

test('Block 8.6.9 Livepaket erfordert explizite Laufbestaetigung und genau einen Capability-One-Shot', async () => {
  const source = await paket();
  assert.ok(source.includes("titel: '2 · Kontrolliert live'"));
  assert.ok(source.includes('bestaetigungsText: BESTAETIGUNG'));
  assert.ok(source.includes('runner.kontrolliertLive(BESTAETIGUNG)'));
  assert.ok(source.includes('nachCap.senden.versuche === 1'));
  assert.ok(source.includes('nachCap.senden.erfolge === 1'));
  assert.ok(source.includes('nachCap.senden.fehler === 0'));
  assert.ok(source.includes('bericht.ziele.length === 1'));
});

test('Block 8.6.9 Livepaket enthaelt keinen Soak-Knopf und keine direkte Spielaktion', async () => {
  const source = await paket();
  assert.equal(source.includes("titel: '3 · Soak"), false);
  assert.equal(source.includes('runner.soak('), false);
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
