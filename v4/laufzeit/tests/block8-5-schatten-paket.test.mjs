import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baueBlock85SchattenPaket } from '../../werkzeuge/block8-5-schatten-paket-bauen.mjs';

const RELEASE_SHA = '88185523c81687dc16f9647ca5e7568c5e2c228c';
const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
const RUNTIME_URL =
  'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/' +
  RELEASE_SHA +
  '/aio-v4-runtime.js';

async function paket() {
  return readFile(
    new URL('../../werkzeuge/block8-5-schatten-paket.js', import.meta.url),
    'utf8'
  );
}

test('Block 8.5.9 Schattenpaket ist source-locked zum Builder', async () => {
  assert.equal(await paket(), await baueBlock85SchattenPaket());
});

test('Block 8.5.9 Schattenpaket pinnt exakten Candidate und gesperrten Schattenmodus', async () => {
  const source = await paket();

  assert.match(source, new RegExp(RELEASE_SHA));
  assert.match(source, new RegExp(RUNTIME_SHA256));
  assert.ok(source.includes(RUNTIME_URL));
  assert.ok(source.includes('aktivFreigegeben: false'));
  assert.ok(source.includes("modus: 'schatten'"));
  assert.ok(source.includes('soakDauerMillisekunden: 600000'));
  assert.ok(source.includes('Runtime wird immutable per HTTPS+SHA geladen, aber NICHT gestartet'));
});

test('Block 8.5.9 Schattenpaket startet Runtime und Heartbeat nicht', async () => {
  const source = await paket();

  for (const verboten of [
    '.starte(',
    '.sendeLebensnachweis(',
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
    assert.equal(new RegExp(`\\b${name}\\s*\\(`).test(source), false, name);
  }
});

test('Block 8.5.9 Schattenpaket sperrt GUI bis strikter Null-Heartbeat-Preflight bestanden ist', async () => {
  const source = await paket();

  const sperren = source.indexOf("testApi.test.setzeAktionAktiv('schatten', false)");
  const laden = source.indexOf('bootstrap.lade()');
  const nullVersuche = source.indexOf('status.lebensnachweisSendeVersuche !== 0', laden);
  const nichtAktiv = source.indexOf('status.aktivFreigegeben !== false', laden);
  const nichtEmpfang = source.indexOf('status.empfangInstalliert !== false', laden);
  const freigeben = source.indexOf("testApi.test.setzeAktionAktiv('schatten', true)", laden);

  assert.ok(sperren >= 0);
  assert.ok(laden > sperren);
  assert.ok(nullVersuche > laden);
  assert.ok(nichtAktiv > laden);
  assert.ok(nichtEmpfang > laden);
  assert.ok(freigeben > nullVersuche);
  assert.ok(source.includes('Generation=0'));
  assert.ok(source.includes('0 Heartbeat-/CM-Versuche'));
});
