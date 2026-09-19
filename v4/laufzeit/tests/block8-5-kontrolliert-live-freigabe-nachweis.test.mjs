import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { werteFreigabestufenAus } from '../../erzeugt/telemetrie/freigabestufen.js';

const PFAD = 'block8.5-basisbedienung-runtime';
const AENDERUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
const LAUF = 'block8-5-schatten-1789775266269';

async function ladeJson(name) {
  return JSON.parse(
    await readFile(new URL(`../../dokumentation/${name}`, import.meta.url), 'utf8')
  );
}

test('Block 8.5.9 kontrollierter Live-Nachweis ist exakt an Candidate und bestandenen Lauf gebunden', async () => {
  const datei = await ladeJson('BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json');

  assert.equal(datei.schemaVersion, 1);
  assert.equal(datei.laufzeitPfadKennung, PFAD);
  assert.equal(datei.aenderungsKennung, AENDERUNG);
  assert.equal(datei.nachweis.stufe, 'kontrolliert_live');
  assert.equal(datei.nachweis.nachweisKennung, `${LAUF}:kontrolliert_live`);
  assert.equal(datei.nachweis.ergebnis, 'bestanden');
  assert.equal(datei.nachweis.durchgefuehrtAm, 1789776285337);
  assert.equal(datei.nachweis.spielAktionAusgefuehrt, true);
  assert.equal(datei.nachweis.begrenzt, true);
  assert.equal(datei.nachweis.telemetrieNachweis, false);
  assert.equal(datei.nachweis.recoveryNachweis, false);
  assert.equal(datei.nachweis.gesamtauswertungBestanden, false);

  assert.equal(datei.reportEvidence.quelle, 'chat_paste');
  assert.equal(datei.reportEvidence.status, 'PASS');
  assert.equal(datei.reportEvidence.runnerVersion, '1.1.0');
  assert.equal(datei.reportEvidence.confirmationInitiallyBlocked, true);
});

test('Block 8.5.9 Live-Nachweis bestaetigt echten Heartbeat und genau eine sichere Pause/Fortsetzung', async () => {
  const datei = await ladeJson('BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json');

  assert.equal(datei.runtimeEvidence.runtimeVersion, '1.1.5');
  assert.equal(datei.runtimeEvidence.runtimeSha256, RUNTIME_SHA256);
  assert.equal(datei.runtimeEvidence.aktivFreigegeben, true);
  assert.equal(datei.runtimeEvidence.empfangInstalliert, true);
  assert.equal(datei.runtimeEvidence.heartbeatAktiv, true);
  assert.equal(datei.runtimeEvidence.heartbeatVersuchePreflight, 1);
  assert.equal(datei.runtimeEvidence.heartbeatErfolgePreflight, 1);
  assert.equal(datei.runtimeEvidence.heartbeatFehlerPreflight, 0);
  assert.equal(datei.runtimeEvidence.generationPreflight, 0);
  assert.equal(datei.runtimeEvidence.schattenNachweisKennung, `${LAUF}:schatten`);

  assert.deepEqual(datei.bedienEvidence, {
    gestartetAm: 1789776285337,
    generationVorher: 0,
    generationNachPause: 1,
    generationNachFortsetzen: 2,
    pauseStatus: 'ausgefuehrt',
    fortsetzenStatus: 'ausgefuehrt',
    heartbeatErfolgeVorher: 17,
    heartbeatErfolgeNachPause: 17,
    heartbeatErfolgeNachFortsetzen: 17
  });
});

test('Block 8.5.9 kanonische Live-Uebergabe ist vollstaendig und fuer Soak geeignet', async () => {
  const datei = await ladeJson('BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json');
  const uebergabe = datei.liveUebergabe;

  assert.equal(uebergabe.laufKennung, LAUF);
  assert.equal(uebergabe.runtimeVersion, '1.1.5');
  assert.equal(uebergabe.runtimeSha256, RUNTIME_SHA256);
  assert.equal(uebergabe.generationVorher, 0);
  assert.equal(uebergabe.generationNachPause, 1);
  assert.equal(uebergabe.generationNachFortsetzen, 2);
  assert.equal(uebergabe.pauseStatus, 'ausgefuehrt');
  assert.equal(uebergabe.fortsetzenStatus, 'ausgefuehrt');
  assert.equal(typeof uebergabe.nachweis, 'object');
  assert.deepEqual(uebergabe.nachweis, datei.nachweis);
});

test('Block 8.5.9 Offline plus Schatten plus Live geben als naechstes Soak frei', async () => {
  const offline = await ladeJson('BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json');
  const schatten = await ladeJson('BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');
  const live = await ladeJson('BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json');

  const status = werteFreigabestufenAus(Object.freeze({
    schemaVersion: 1,
    laufzeitPfadKennung: PFAD,
    aenderungsKennung: AENDERUNG,
    nachweise: Object.freeze([
      Object.freeze({ ...offline.nachweis }),
      Object.freeze({ ...schatten.nachweis }),
      Object.freeze({ ...live.nachweis })
    ])
  }));

  assert.equal(status.stufen[0].zustand, 'bestanden');
  assert.equal(status.stufen[1].zustand, 'bestanden');
  assert.equal(status.stufen[2].zustand, 'bestanden');
  assert.equal(status.stufen[3].stufe, 'soak');
  assert.equal(status.stufen[3].zustand, 'offen');
  assert.equal(status.naechsteStufe, 'soak');
  assert.equal(status.freigabeVollstaendig, false);
  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);

  assert.deepEqual(live.auswertungErwartet, {
    offline: 'bestanden',
    schatten: 'bestanden',
    kontrolliertLive: 'bestanden',
    naechsteStufe: 'soak',
    freigabeVollstaendig: false,
    block9Freigegeben: false
  });
});
