import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baueBlock85SoakPaket } from '../../werkzeuge/block8-5-soak-paket-bauen.mjs';

const LAUF = 'block8-5-schatten-1789775266269';
const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';

async function paket() {
  return readFile(
    new URL('../../werkzeuge/block8-5-soak-paket.js', import.meta.url),
    'utf8'
  );
}

test('Block 8.5.9 Soak-Paket ist source-locked zu Builder und beiden realen Vorstufen', async () => {
  assert.equal(await paket(), await baueBlock85SoakPaket());
});

test('Block 8.5.9 Soak-Paket bindet Schatten und kontrolliert live exakt', async () => {
  const source = await paket();

  assert.ok(source.includes(`laufKennung: '${LAUF}'`));
  assert.ok(source.includes(`"nachweisKennung": "${LAUF}:schatten"`));
  assert.ok(source.includes(`"nachweisKennung": "${LAUF}:kontrolliert_live"`));
  assert.ok(source.includes('"generationNachPause": 1'));
  assert.ok(source.includes('"generationNachFortsetzen": 2'));
  assert.ok(source.includes('"pauseStatus": "ausgefuehrt"'));
  assert.ok(source.includes('"fortsetzenStatus": "ausgefuehrt"'));
  assert.ok(source.includes(`"runtimeSha256": "${RUNTIME_SHA256}"`));
});

test('Block 8.5.9 Soak-Paket ist fest auf 10 Minuten und 5 Sekunden Sampling gebunden', async () => {
  const source = await paket();

  assert.ok(source.includes('soakDauerMillisekunden: 600000'));
  assert.ok(source.includes('sampleMillisekunden: 5000'));
  assert.ok(source.includes("stufe: 'soak'"));
  assert.ok(source.includes("nachweisKennung: cfg.laufKennung + ':soak'"));
  assert.ok(source.includes('telemetrieNachweis: pass'));
  assert.ok(source.includes('recoveryNachweis: pass'));
  assert.ok(source.includes('gesamtauswertungBestanden: pass'));
  assert.ok(source.includes('spielAktionAusgefuehrt: true'));
});

test('Block 8.5.9 Soak-Paket startet genau einmal und entsperrt Soak erst nach echtem Heartbeat', async () => {
  const source = await paket();

  assert.equal((source.match(/runtime\.starte\(\)/g) ?? []).length, 1);
  const sperren = source.indexOf("aktiviert: false");
  const laden = source.indexOf('bootstrap.lade()');
  const starten = source.indexOf('runtime.starte()', laden);
  const heartbeat = source.indexOf('await warteAufBestaetigtenHeartbeat(runtime)', starten);
  const freigeben = source.indexOf("test.setzeAktionAktiv('soak', true)", heartbeat);

  assert.ok(sperren >= 0);
  assert.ok(laden > sperren);
  assert.ok(starten > laden);
  assert.ok(heartbeat > starten);
  assert.ok(freigeben > heartbeat);
  assert.ok(source.includes('lebensnachweisSendeErfolge >= 1'));
  assert.ok(source.includes('lebensnachweisSendeFehler > 0'));
  assert.ok(source.includes('Frische Soak-Sitzung verlangt Laufzeit-Generation 0.'));
});

test('Block 8.5.9 Soak-Paket ueberwacht Generation, Heartbeat-Fehler und Sampling fail-safe', async () => {
  const source = await paket();

  assert.ok(source.includes('basis.laufzeit.generation !== generation'));
  assert.ok(source.includes('status.lebensnachweisSendeFehler !== runtimeVorher.lebensnachweisSendeFehler'));
  assert.ok(source.includes('samples < erwarteteSamples'));
  assert.ok(source.includes('lebensnachweisSendeErfolge <= heartbeatErfolgeVorher'));
  assert.ok(source.includes('Soak-Sampling war zu duenn'));
});

test('Block 8.5.9 Soak-Paket besitzt keine Basisbedienung, keinen Stop und keine direkte Spielaktion', async () => {
  const source = await paket();

  for (const verboten of [
    '.erstelleBasisBedienAnfrage(',
    '.fuehreBasisBedienAnfrage(',
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
