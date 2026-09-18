import test from 'node:test';
import assert from 'node:assert/strict';
import { WiederholungsMaschine } from '../../erzeugt/wiederholung/wiederholungs-maschine.js';
import {
  erstelleGruppenKoordinationsKonfiguration,
  koordiniereGruppe
} from '../../erzeugt/spiellogik/gruppen-koordination.js';
import {
  eigeneGruppenPlanSchritte,
  planeGruppenAktionen
} from '../../erzeugt/spiellogik/gruppen-aktionsplanung.js';

const vorfallRegeln = Object.freeze({
  stillstandNachMillisekunden: 30_000,
  schleifenFensterMillisekunden: 60_000,
  schleifenWiederholungen: 3,
  schleifenMusterLaengeMax: 3
});

const koordinationsKonfiguration = erstelleGruppenKoordinationsKonfiguration({
  lebensnachweisMaximalAlterMillisekunden: 5_000
});

function spielzustand(laufendeNummer, aufgenommenAm, charakterKennung) {
  return Object.freeze({
    schemaVersion: 2,
    laufendeNummer,
    aufgenommenAm,
    ablaufKennung: `block8-replay-${charakterKennung}`,
    beobachtet: Object.freeze({}),
    abgeleitet: Object.freeze({}),
    gelernt: Object.freeze([])
  });
}

function meldung(charakterKennung, gesendetAm, laufendeNummer, aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    charakterKennung,
    charakterName: charakterKennung,
    klasse: 'beliebig',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 0.9,
    manaAnteil: 0.8,
    zielKennung: 'goo-1',
    gefahrenStufe: 'sicher',
    faehigkeiten: Object.freeze({
      heilen: charakterKennung === 'My_Ranger2' ? 1 : 0,
      schaden: charakterKennung === 'My_Ranger1' ? 1 : 0.2,
      aggro: 0,
      schutz: charakterKennung === 'My_Ranger2' ? 1 : 0,
      unterstuetzung: charakterKennung === 'My_Ranger2' ? 1 : 0.1
    }),
    gesendetAm,
    laufendeNummer,
    ...aenderungen
  });
}

function snapshotEreignis(laufendeNummer, zeitpunkt, phase, meldungen) {
  return Object.freeze({
    charakterKennung: null,
    ereignis: Object.freeze({
      kennung: `block8-snapshot-${phase}`,
      laufendeNummer,
      zeitpunkt,
      name: 'block8-gruppensnapshot',
      quelle: 'block8-mehrcharakter-wiederholung',
      ablaufKennung: 'block8-gruppe',
      details: Object.freeze({
        phase,
        meldungen: Object.freeze([...meldungen])
      })
    })
  });
}

const aktiveMeldungen = Object.freeze([
  meldung('My_Ranger1', 1_000, 1),
  meldung('My_Ranger2', 1_000, 1)
]);
const staleMeldungen = Object.freeze([
  meldung('My_Ranger1', 7_000, 2),
  meldung('My_Ranger2', 1_000, 1)
]);
const reconnectMeldungen = Object.freeze([
  meldung('My_Ranger1', 8_000, 3),
  meldung('My_Ranger2', 8_000, 2)
]);
const safetyMeldungen = Object.freeze([
  meldung('My_Ranger1', 9_000, 4, {
    lebensAnteil: 0.35,
    gefahrenStufe: 'kritisch'
  }),
  meldung('My_Ranger2', 9_000, 3)
]);

const datensatz = Object.freeze({
  schemaVersion: 1,
  kennung: 'block8-mehrcharakter-aktiv-stale-reconnect-safety',
  erstelltAm: 10_000,
  zustaende: Object.freeze([
    Object.freeze({ charakterKennung: 'My_Ranger1', zustand: spielzustand(1, 1_000, 'My_Ranger1') }),
    Object.freeze({ charakterKennung: 'My_Ranger2', zustand: spielzustand(1, 1_000, 'My_Ranger2') }),
    Object.freeze({ charakterKennung: 'My_Ranger1', zustand: spielzustand(2, 7_000, 'My_Ranger1') }),
    Object.freeze({ charakterKennung: 'My_Ranger2', zustand: spielzustand(2, 7_000, 'My_Ranger2') }),
    Object.freeze({ charakterKennung: 'My_Ranger1', zustand: spielzustand(3, 8_000, 'My_Ranger1') }),
    Object.freeze({ charakterKennung: 'My_Ranger2', zustand: spielzustand(3, 8_000, 'My_Ranger2') }),
    Object.freeze({ charakterKennung: 'My_Ranger1', zustand: spielzustand(4, 9_000, 'My_Ranger1') }),
    Object.freeze({ charakterKennung: 'My_Ranger2', zustand: spielzustand(4, 9_000, 'My_Ranger2') })
  ]),
  ereignisse: Object.freeze([
    snapshotEreignis(1, 1_000, 'aktiv', aktiveMeldungen),
    snapshotEreignis(2, 7_000, 'stale', staleMeldungen),
    snapshotEreignis(3, 8_000, 'reconnect', reconnectMeldungen),
    snapshotEreignis(4, 9_000, 'safety', safetyMeldungen)
  ]),
  ablaufBeobachtungen: Object.freeze([]),
  vorfallRegeln,
  kontingentSchritte: Object.freeze([]),
  telemetrieDauerzustand: null,
  leistungsZeitraeume: Object.freeze([])
});

function gruppenEntscheider(kontext) {
  const snapshots = kontext.ereignisseBisJetzt.filter((ereignis) => ereignis.name === 'block8-gruppensnapshot');
  const snapshot = snapshots[snapshots.length - 1];
  if (!snapshot) throw new Error('Block-8-Replay benoetigt einen Gruppensnapshot.');

  const phase = snapshot.details.phase;
  const meldungen = snapshot.details.meldungen;
  const entscheidung = koordiniereGruppe(
    meldungen,
    kontext.charakterKennung,
    kontext.jetzt,
    koordinationsKonfiguration
  );
  const plan = planeGruppenAktionen(meldungen, entscheidung);
  const eigeneSchritte = eigeneGruppenPlanSchritte(plan, kontext.charakterKennung);

  return Object.freeze({
    kennung: `block8-${phase}`,
    zeitpunkt: kontext.jetzt,
    charakterKennung: kontext.charakterKennung,
    entscheidung: `${entscheidung.betriebsArt}:${plan.status}`,
    grund: entscheidung.grund,
    sicherheitszustand: entscheidung.betriebsArt === 'normal' ? 'sicher' : 'warnung',
    bewertungsWert: entscheidung.aktiveTeilnehmerKennungen.length,
    details: Object.freeze({
      phase,
      betriebsArt: entscheidung.betriebsArt,
      gemeinsameGefahrenStufe: entscheidung.gemeinsameGefahrenStufe,
      aktiveTeilnehmerKennungen: Object.freeze([...entscheidung.aktiveTeilnehmerKennungen]),
      aufgaben: Object.freeze({ ...entscheidung.aufgaben }),
      gemeinsamesZielKennung: entscheidung.gemeinsamesZielKennung,
      planStatus: plan.status,
      planArten: Object.freeze(plan.schritte.map((schritt) => schritt.art)),
      eigenePlanArten: Object.freeze(eigeneSchritte.map((schritt) => schritt.art))
    })
  });
}

function finde(lauf, phase, charakterKennung) {
  return lauf.entscheidungen.find(
    (entscheidung) => entscheidung.details.phase === phase &&
      entscheidung.charakterKennung === charakterKennung
  );
}

test('Block 8 Mehrcharakter-Wiederholung: aktiv, stale, reconnect und safety sind deterministisch reproduzierbar', () => {
  const maschine = new WiederholungsMaschine();
  const ersterLauf = maschine.fuehreAus(datensatz, 'block8-replay-a', gruppenEntscheider);
  const zweiterLauf = maschine.fuehreAus(datensatz, 'block8-replay-b', gruppenEntscheider);

  assert.equal(ersterLauf.eingabeFingerabdruck, zweiterLauf.eingabeFingerabdruck);
  assert.equal(ersterLauf.ausgabeFingerabdruck, zweiterLauf.ausgabeFingerabdruck);
  assert.deepEqual(ersterLauf.entscheidungen, zweiterLauf.entscheidungen);
  assert.equal(ersterLauf.entscheidungen.length, 8);

  const aktivRanger1 = finde(ersterLauf, 'aktiv', 'My_Ranger1');
  const aktivRanger2 = finde(ersterLauf, 'aktiv', 'My_Ranger2');
  assert.deepEqual(aktivRanger1?.details.aktiveTeilnehmerKennungen, ['My_Ranger1', 'My_Ranger2']);
  assert.equal(aktivRanger1?.details.aufgaben.schaden, 'My_Ranger1');
  assert.equal(aktivRanger1?.details.aufgaben.unterstuetzung, 'My_Ranger2');
  assert.ok(aktivRanger1?.details.eigenePlanArten.includes('gemeinsames_ziel_bearbeiten'));
  assert.ok(aktivRanger2?.details.eigenePlanArten.includes('gruppe_unterstuetzen'));

  const staleRanger1 = finde(ersterLauf, 'stale', 'My_Ranger1');
  const staleRanger2 = finde(ersterLauf, 'stale', 'My_Ranger2');
  assert.deepEqual(staleRanger1?.details.aktiveTeilnehmerKennungen, ['My_Ranger1']);
  assert.notEqual(staleRanger1?.details.aufgaben.unterstuetzung, 'My_Ranger2');
  assert.equal(staleRanger2?.details.betriebsArt, 'blockiert');
  assert.deepEqual(staleRanger2?.details.eigenePlanArten, []);

  const reconnectRanger2 = finde(ersterLauf, 'reconnect', 'My_Ranger2');
  assert.deepEqual(reconnectRanger2?.details.aktiveTeilnehmerKennungen, ['My_Ranger1', 'My_Ranger2']);
  assert.equal(reconnectRanger2?.details.aufgaben.unterstuetzung, 'My_Ranger2');
  assert.ok(reconnectRanger2?.details.eigenePlanArten.includes('gruppe_unterstuetzen'));

  const safetyRanger1 = finde(ersterLauf, 'safety', 'My_Ranger1');
  const safetyRanger2 = finde(ersterLauf, 'safety', 'My_Ranger2');
  assert.equal(safetyRanger1?.details.betriebsArt, 'sicherheit');
  assert.equal(safetyRanger1?.details.gemeinsamesZielKennung, null);
  assert.equal(safetyRanger1?.details.planArten.includes('gruppe_unterstuetzen'), false);
  assert.equal(safetyRanger1?.details.planArten.includes('gemeinsames_ziel_bearbeiten'), false);
  assert.ok(safetyRanger2?.details.eigenePlanArten.includes('mitglied_heilen'));
  assert.ok(safetyRanger2?.details.eigenePlanArten.includes('mitglied_schuetzen'));
});
