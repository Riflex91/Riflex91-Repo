import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { werteFreigabestufenAus } from '../../erzeugt/telemetrie/freigabestufen.js';

const PFAD = 'block8.5-basisbedienung-runtime';
const AENDERUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
const CANDIDATE_SHA = '88185523c81687dc16f9647ca5e7568c5e2c228c';

async function ladeNachweis() {
  return JSON.parse(
    await readFile(
      new URL('../../dokumentation/BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json', import.meta.url),
      'utf8'
    )
  );
}

test('Block 8.5.9 Offline-Nachweis ist an exakten Candidate und zwei erfolgreiche Pflicht-CI-Laeufe gebunden', async () => {
  const datei = await ladeNachweis();

  assert.equal(datei.schemaVersion, 1);
  assert.equal(datei.laufzeitPfadKennung, PFAD);
  assert.equal(datei.aenderungsKennung, AENDERUNG);
  assert.equal(datei.nachweis.laufzeitPfadKennung, PFAD);
  assert.equal(datei.nachweis.aenderungsKennung, AENDERUNG);
  assert.equal(datei.nachweis.stufe, 'offline');
  assert.equal(datei.nachweis.ergebnis, 'bestanden');
  assert.equal(datei.nachweis.deterministisch, true);
  assert.equal(datei.nachweis.spielAktionAusgefuehrt, false);
  assert.equal(datei.nachweis.durchgefuehrtAm, 1789771311000);

  assert.deepEqual(
    datei.ciEvidence.map((eintrag) => ({
      workflow: eintrag.workflow,
      runId: eintrag.runId,
      jobId: eintrag.jobId,
      headSha: eintrag.headSha,
      conclusion: eintrag.conclusion,
      requiredStep: eintrag.requiredStep
    })),
    [
      {
        workflow: 'v4-ci',
        runId: 35402650442,
        jobId: 105785689353,
        headSha: CANDIDATE_SHA,
        conclusion: 'success',
        requiredStep: 'Typen, Tests, Namen und Struktur pruefen'
      },
      {
        workflow: 'v4-grundlage-pruefen',
        runId: 35402650416,
        jobId: 105785688933,
        headSha: CANDIDATE_SHA,
        conclusion: 'success',
        requiredStep: 'Typen, Tests, Namen und Struktur pruefen'
      }
    ]
  );
});

test('Block 8.5.9 Offline-Nachweis gibt nur Offline frei und fordert als naechstes Schattenbetrieb', async () => {
  const datei = await ladeNachweis();

  const status = werteFreigabestufenAus(Object.freeze({
    schemaVersion: 1,
    laufzeitPfadKennung: PFAD,
    aenderungsKennung: AENDERUNG,
    nachweise: Object.freeze([Object.freeze({ ...datei.nachweis })])
  }));

  assert.equal(status.stufen[0].stufe, 'offline');
  assert.equal(status.stufen[0].zustand, 'bestanden');
  assert.equal(status.stufen[1].stufe, 'schatten');
  assert.equal(status.stufen[1].zustand, 'offen');
  assert.equal(status.stufen[2].zustand, 'blockiert');
  assert.equal(status.stufen[3].zustand, 'blockiert');
  assert.equal(status.naechsteStufe, 'schatten');
  assert.equal(status.freigabeVollstaendig, false);
  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);

  assert.deepEqual(datei.auswertungErwartet, {
    offline: 'bestanden',
    naechsteStufe: 'schatten',
    freigabeVollstaendig: false,
    block9Freigegeben: false
  });
});

test('Block 8.5.9 Offline-Nachweis enthaelt keine spaetere Freigabebehauptung', async () => {
  const datei = await ladeNachweis();

  assert.equal(datei.nachweis.begrenzt, false);
  assert.equal(datei.nachweis.telemetrieNachweis, false);
  assert.equal(datei.nachweis.recoveryNachweis, false);
  assert.equal(datei.nachweis.gesamtauswertungBestanden, false);
  assert.equal(datei.auswertungErwartet.block9Freigegeben, false);
});
