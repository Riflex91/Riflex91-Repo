import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baueBlock85LivePaket } from '../../werkzeuge/block8-5-live-paket-bauen.mjs';

const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
const LAUF_KENNUNG = 'block8-5-schatten-1789775266269';

async function paket() {
  return readFile(
    new URL('../../werkzeuge/block8-5-live-paket.js', import.meta.url),
    'utf8'
  );
}

test('Block 8.5.9 Live-Paket ist source-locked zum Builder und kanonischen Schattennachweis', async () => {
  assert.equal(await paket(), await baueBlock85LivePaket());
});

test('Block 8.5.9 Live-Paket bindet den bestandenen Schattennachweis vollstaendig', async () => {
  const source = await paket();

  assert.ok(source.includes(`laufKennung: '${LAUF_KENNUNG}'`));
  assert.ok(source.includes(`"nachweisKennung": "${LAUF_KENNUNG}:schatten"`));
  assert.ok(source.includes('"ergebnis": "bestanden"'));
  assert.ok(source.includes('"spielAktionAusgefuehrt": false'));
  assert.ok(source.includes('"betriebsart": "gesperrt_nicht_gestartet"'));
  assert.ok(source.includes('"heartbeatVersuche": 0'));
  assert.ok(source.includes(`"runtimeSha256": "${RUNTIME_SHA256}"`));
  assert.equal(source.includes('"nachweis": "[Zirkulaere Referenz]"'), false);
});

test('Block 8.5.9 Live-Paket nutzt die bewaehrte minimale aktive Produktionskonfiguration', async () => {
  const source = await paket();

  assert.ok(source.includes('aktivFreigegeben: true'));
  assert.ok(source.includes("vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2'])"));
  assert.ok(source.includes('schaden: 1'));
  assert.ok(source.includes("modus: 'live'"));
  assert.ok(source.includes('soakDauerMillisekunden: 600000'));
});

test('Block 8.5.9 Live-Paket startet exakt einmal und entsperrt Live erst nach bestaetigtem Heartbeat', async () => {
  const source = await paket();

  assert.equal((source.match(/runtime\.starte\(\)/g) ?? []).length, 1);

  const sperren = source.indexOf("testApi.test.setzeAktionAktiv('kontrolliert-live', false)");
  const laden = source.indexOf('bootstrap.lade()');
  const starten = source.indexOf('runtime.starte()');
  const warten = source.indexOf('warteAufBestaetigtenHeartbeat(runtime)');
  const erfolg = source.indexOf('status.lebensnachweisSendeErfolge >= 1');
  const keineFehler = source.indexOf('status.lebensnachweisSendeFehler > 0');
  const freigeben = source.indexOf("testApi.test.setzeAktionAktiv('kontrolliert-live', true)");

  assert.ok(sperren >= 0);
  assert.ok(laden > sperren);
  assert.ok(starten > laden);
  assert.ok(warten > laden);
  assert.ok(erfolg > laden);
  assert.ok(keineFehler > laden);
  assert.ok(freigeben > starten);
  assert.ok(freigeben > erfolg);
  assert.ok(source.includes('Innerhalb von 10 Sekunden wurde kein bestaetigter Produktionsheartbeat erreicht'));
  assert.ok(source.includes('heartbeatFehler: status.lebensnachweisSendeFehler'));
  assert.ok(source.includes('generation: basis.laufzeit.generation'));
});

test('Block 8.5.9 Live-Paket besitzt keine versteckte Fortsetzung, keinen Stop und keine direkte Spielaktion', async () => {
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
    assert.equal(new RegExp(`\\b${name}\\s*\\(`).test(source), false, name);
  }
});
