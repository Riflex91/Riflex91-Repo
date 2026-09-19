import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { werteFreigabestufenAus } from '../../erzeugt/telemetrie/freigabestufen.js';

const PFAD = 'block8.5-basisbedienung-runtime';
const AENDERUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
const LAUF = 'block8-5-schatten-1789775266269';
const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';

async function ladeJson(name) {
  return JSON.parse(
    await readFile(new URL(`../../dokumentation/${name}`, import.meta.url), 'utf8')
  );
}

test('Block 8.5.9 Soak-Nachweis ist exakt an Candidate und Vorstufen gebunden', async () => {
  const datei = await ladeJson('BLOCK-8-5-SOAK-FREIGABE-NACHWEIS.json');

  assert.equal(datei.schemaVersion, 1);
  assert.equal(datei.laufzeitPfadKennung, PFAD);
  assert.equal(datei.aenderungsKennung, AENDERUNG);
  assert.equal(datei.nachweis.stufe, 'soak');
  assert.equal(datei.nachweis.nachweisKennung, `${LAUF}:soak`);
  assert.equal(datei.nachweis.ergebnis, 'bestanden');
  assert.equal(datei.nachweis.durchgefuehrtAm, 1789802325319);
  assert.equal(datei.nachweis.spielAktionAusgefuehrt, true);
  assert.equal(datei.nachweis.begrenzt, false);
  assert.equal(datei.nachweis.telemetrieNachweis, true);
  assert.equal(datei.nachweis.recoveryNachweis, true);
  assert.equal(datei.nachweis.gesamtauswertungBestanden, true);

  assert.equal(datei.runtimeEvidence.runtimeVersion, '1.1.5');
  assert.equal(datei.runtimeEvidence.runtimeSha256, RUNTIME_SHA256);
  assert.equal(datei.runtimeEvidence.generationPreflight, 0);
  assert.equal(datei.runtimeEvidence.heartbeatVersuchePreflight, 1);
  assert.equal(datei.runtimeEvidence.heartbeatErfolgePreflight, 1);
  assert.equal(datei.runtimeEvidence.heartbeatFehlerPreflight, 0);
  assert.equal(datei.runtimeEvidence.schattenNachweisKennung, `${LAUF}:schatten`);
  assert.equal(datei.runtimeEvidence.liveNachweisKennung, `${LAUF}:kontrolliert_live`);
});

test('Block 8.5.9 Soak-Nachweis bestaetigt volle 10 Minuten und stabile Recovery-Grenzen', async () => {
  const datei = await ladeJson('BLOCK-8-5-SOAK-FREIGABE-NACHWEIS.json');

  assert.deepEqual(datei.soakEvidence, {
    gestartetAm: 1789801725312,
    beendetAm: 1789802325319,
    dauerMillisekunden: 600000,
    sampleMillisekunden: 5000,
    samples: 120,
    erwarteteSamples: 118,
    fehler: [],
    generationVorher: 0,
    generationNachher: 0,
    heartbeatErfolgeVorher: 4,
    heartbeatErfolgeNachher: 304,
    heartbeatFehlerVorher: 0,
    heartbeatFehlerNachher: 0
  });

  assert.equal(datei.soakEvidence.beendetAm - datei.soakEvidence.gestartetAm, 600007);
  assert.ok(datei.soakEvidence.samples >= datei.soakEvidence.erwarteteSamples);
  assert.ok(datei.soakEvidence.heartbeatErfolgeNachher > datei.soakEvidence.heartbeatErfolgeVorher);
  assert.equal(datei.soakEvidence.generationNachher, datei.soakEvidence.generationVorher);
  assert.deepEqual(datei.soakEvidence.fehler, []);
});

test('Block 8.5.9 Soak-Bericht wird ohne erfundenen Rohdatei-Hash dokumentiert', async () => {
  const datei = await ladeJson('BLOCK-8-5-SOAK-FREIGABE-NACHWEIS.json');

  assert.equal(datei.reportEvidence.quelle, 'chat_paste');
  assert.equal(datei.reportEvidence.status, 'PASS');
  assert.equal(datei.reportEvidence.guiVersion, '1.0.0');
  assert.equal(datei.reportEvidence.confirmationInitiallyBlocked, true);
  assert.equal(Object.hasOwn(datei.reportEvidence, 'reportSha256'), false);
  assert.equal(Object.hasOwn(datei.reportEvidence, 'reportBytes'), false);
});

test('Block 8.5.9 alle vier realen Nachweise schliessen das historische Freigabe-Gate', async () => {
  const offline = await ladeJson('BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json');
  const schatten = await ladeJson('BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');
  const live = await ladeJson('BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json');
  const soak = await ladeJson('BLOCK-8-5-SOAK-FREIGABE-NACHWEIS.json');

  const status = werteFreigabestufenAus(Object.freeze({
    schemaVersion: 1,
    laufzeitPfadKennung: PFAD,
    aenderungsKennung: AENDERUNG,
    nachweise: Object.freeze([
      Object.freeze({ ...offline.nachweis }),
      Object.freeze({ ...schatten.nachweis }),
      Object.freeze({ ...live.nachweis }),
      Object.freeze({ ...soak.nachweis })
    ])
  }));

  assert.equal(status.stufen.length, 4);
  for (const eintrag of status.stufen) assert.equal(eintrag.zustand, 'bestanden');
  assert.equal(status.naechsteStufe, null);
  assert.equal(status.freigabeVollstaendig, true);
  assert.equal(status.block9Freigegeben, true);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);

  assert.deepEqual(soak.auswertungErwartet, {
    offline: 'bestanden',
    schatten: 'bestanden',
    kontrolliertLive: 'bestanden',
    soak: 'bestanden',
    naechsteStufe: null,
    freigabeVollstaendig: true,
    block9Freigegeben: true,
    spielAutoritaet: false,
    neustartAutoritaet: false
  });

  assert.equal(soak.roadmap.block85Abgeschlossen, true);
  assert.equal(soak.roadmap.naechsterEntwicklungsblock, '8.6');
  assert.equal(soak.roadmap.block9StartNachRoadmapFreigegeben, false);
});
