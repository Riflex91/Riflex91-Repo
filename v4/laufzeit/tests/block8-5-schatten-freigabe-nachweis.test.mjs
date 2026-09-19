import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { werteFreigabestufenAus } from '../../erzeugt/telemetrie/freigabestufen.js';

const PFAD = 'block8.5-basisbedienung-runtime';
const AENDERUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
const REPORT_SHA256 = '78af6a837af689e786c5166d49624f194ad72d888f76f7712012073c1675d8c1';

async function ladeJson(name) {
  return JSON.parse(
    await readFile(new URL(`../../dokumentation/${name}`, import.meta.url), 'utf8')
  );
}

test('Block 8.5.9 Schattennachweis ist an den realen Adventure-Land-Bericht und exakten Candidate gebunden', async () => {
  const datei = await ladeJson('BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');

  assert.equal(datei.schemaVersion, 1);
  assert.equal(datei.laufzeitPfadKennung, PFAD);
  assert.equal(datei.aenderungsKennung, AENDERUNG);
  assert.equal(datei.nachweis.stufe, 'schatten');
  assert.equal(datei.nachweis.ergebnis, 'bestanden');
  assert.equal(datei.nachweis.durchgefuehrtAm, 1789775267498);
  assert.equal(datei.nachweis.spielAktionAusgefuehrt, false);

  assert.equal(datei.reportEvidence.bytes, 10123);
  assert.equal(datei.reportEvidence.sha256, REPORT_SHA256);
  assert.equal(datei.reportEvidence.status, 'PASS');
  assert.equal(datei.reportEvidence.laufKennung, 'block8-5-schatten-1789775266269');

  assert.equal(datei.runtimeEvidence.runtimeVersion, '1.1.5');
  assert.equal(datei.runtimeEvidence.runtimeSha256, RUNTIME_SHA256);
  assert.equal(datei.runtimeEvidence.betriebsart, 'gesperrt_nicht_gestartet');
  assert.equal(datei.runtimeEvidence.aktivFreigegebenVorher, false);
  assert.equal(datei.runtimeEvidence.aktivFreigegebenNachher, false);
  assert.equal(datei.runtimeEvidence.empfangInstalliertVorher, false);
  assert.equal(datei.runtimeEvidence.empfangInstalliertNachher, false);
  assert.equal(datei.runtimeEvidence.generationVorher, 0);
  assert.equal(datei.runtimeEvidence.generationNachher, 0);
  assert.equal(datei.runtimeEvidence.heartbeatVersucheVorher, 0);
  assert.equal(datei.runtimeEvidence.heartbeatVersucheNachher, 0);
  assert.equal(datei.runtimeEvidence.heartbeatErfolgeVorher, 0);
  assert.equal(datei.runtimeEvidence.heartbeatErfolgeNachher, 0);
  assert.equal(datei.runtimeEvidence.heartbeatFehlerVorher, 0);
  assert.equal(datei.runtimeEvidence.heartbeatFehlerNachher, 0);
  assert.equal(datei.runtimeEvidence.performanceTrickAufgerufenVorher, false);
  assert.equal(datei.runtimeEvidence.performanceTrickAufgerufenNachher, false);
});

test('Block 8.5.9 kanonische Schattenuebergabe besitzt wieder den vollstaendigen Nachweis statt Zirkular-Text', async () => {
  const datei = await ladeJson('BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');
  const uebergabe = datei.schattenUebergabe;

  assert.equal(uebergabe.laufKennung, datei.reportEvidence.laufKennung);
  assert.equal(uebergabe.runtimeVersion, '1.1.5');
  assert.equal(uebergabe.runtimeSha256, RUNTIME_SHA256);
  assert.equal(uebergabe.betriebsart, 'gesperrt_nicht_gestartet');
  assert.equal(uebergabe.generation, 0);
  assert.equal(uebergabe.heartbeatVersuche, 0);
  assert.equal(uebergabe.heartbeatErfolge, 0);
  assert.equal(uebergabe.heartbeatFehler, 0);
  assert.equal(typeof uebergabe.nachweis, 'object');
  assert.deepEqual(uebergabe.nachweis, datei.nachweis);
});

test('Block 8.5.9 Offline plus realer Schattennachweis geben als naechstes kontrolliert live frei', async () => {
  const offline = await ladeJson('BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json');
  const schatten = await ladeJson('BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');

  const status = werteFreigabestufenAus(Object.freeze({
    schemaVersion: 1,
    laufzeitPfadKennung: PFAD,
    aenderungsKennung: AENDERUNG,
    nachweise: Object.freeze([
      Object.freeze({ ...offline.nachweis }),
      Object.freeze({ ...schatten.nachweis })
    ])
  }));

  assert.equal(status.stufen[0].zustand, 'bestanden');
  assert.equal(status.stufen[1].zustand, 'bestanden');
  assert.equal(status.stufen[2].stufe, 'kontrolliert_live');
  assert.equal(status.stufen[2].zustand, 'offen');
  assert.equal(status.stufen[3].zustand, 'blockiert');
  assert.equal(status.naechsteStufe, 'kontrolliert_live');
  assert.equal(status.freigabeVollstaendig, false);
  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);

  assert.deepEqual(schatten.auswertungErwartet, {
    offline: 'bestanden',
    schatten: 'bestanden',
    naechsteStufe: 'kontrolliert_live',
    freigabeVollstaendig: false,
    block9Freigegeben: false
  });
});

test('Block 8.5.9 Schattennachweis behauptet keine Live- oder Soak-Freigabe', async () => {
  const datei = await ladeJson('BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');

  assert.equal(datei.nachweis.begrenzt, false);
  assert.equal(datei.nachweis.telemetrieNachweis, false);
  assert.equal(datei.nachweis.recoveryNachweis, false);
  assert.equal(datei.nachweis.gesamtauswertungBestanden, false);
  assert.equal(datei.auswertungErwartet.block9Freigegeben, false);
});
