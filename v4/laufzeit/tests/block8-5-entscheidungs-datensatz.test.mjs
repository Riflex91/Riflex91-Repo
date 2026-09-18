import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erstelleGruppenKoordinationsKonfiguration,
  koordiniereGruppe
} from '../../erzeugt/spiellogik/gruppen-koordination.js';
import {
  erstelleGruppenEntscheidungsDatensatz
} from '../../erzeugt/telemetrie/gruppen-entscheidungs-datensatz.js';

function meldung(kennung, aenderungen = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: kennung,
    charakterName: kennung,
    klasse: 'ranger',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 0.9,
    manaAnteil: 0.8,
    zielKennung: 'm1',
    gefahrenStufe: 'sicher',
    faehigkeiten: {
      heilen: 0,
      schaden: 1,
      aggro: 0,
      schutz: 0,
      unterstuetzung: kennung === 'b' ? 1 : 0.5
    },
    gesendetAm: 10_000,
    laufendeNummer: 1,
    ...aenderungen
  };
}

const cfg = erstelleGruppenKoordinationsKonfiguration({
  lebensnachweisMaximalAlterMillisekunden: 5_000
});

function datensatz(meldungen, jetzt = 12_000) {
  const entscheidung = koordiniereGruppe(meldungen, 'a', jetzt, cfg);
  return erstelleGruppenEntscheidungsDatensatz('testlauf', meldungen, entscheidung);
}

test('Block 8.5 EntscheidungsDatensatz: Gruppenentscheidung ist versioniert erklaerbar und zunaechst aktionsfrei', () => {
  const ergebnis = datensatz([meldung('a'), meldung('b')]);

  assert.equal(ergebnis.schemaVersion, 1);
  assert.equal(ergebnis.art, 'gruppenkoordination');
  assert.equal(ergebnis.quelle, 'gruppen-koordination');
  assert.equal(ergebnis.ablaufKennung, 'testlauf');
  assert.match(ergebnis.entscheidungKennung, /^gruppenentscheidung:12000:[a-f0-9]{16}$/);
  assert.match(ergebnis.eingabeFingerabdruck, /^[a-f0-9]{64}$/);
  assert.match(ergebnis.fachlicherFingerabdruck, /^[a-f0-9]{64}$/);
  assert.equal(ergebnis.gewaehlteEntscheidung, 'gruppenbetrieb:normal');
  assert.equal(ergebnis.erwartetesErgebnis.betriebsArt, 'normal');
  assert.deepEqual(ergebnis.erwartetesErgebnis.aktiveTeilnehmerKennungen, ['a', 'b']);
  assert.equal(ergebnis.erwartetesErgebnis.aufgaben.unterstuetzung, 'b');
  assert.deepEqual(ergebnis.aktionsAnfrageKennungen, []);
  assert.equal(ergebnis.tatsaechlichesErgebnis, null);
  assert.equal(Object.isFrozen(ergebnis), true);
  assert.equal(Object.isFrozen(ergebnis.situation), true);
  assert.equal(Object.isFrozen(ergebnis.situation.teilnehmer), true);
  assert.equal(Object.isFrozen(ergebnis.moeglichkeiten), true);
});

test('Block 8.5 EntscheidungsDatensatz: Zeitstempel und laufende Nummer veraendern fachliche Fingerabdruecke nicht', () => {
  const erster = datensatz([
    meldung('a', { gesendetAm: 10_000, laufendeNummer: 1 }),
    meldung('b', { gesendetAm: 10_100, laufendeNummer: 4 })
  ], 12_000);

  const zweiter = datensatz([
    meldung('a', { gesendetAm: 50_000, laufendeNummer: 101 }),
    meldung('b', { gesendetAm: 50_100, laufendeNummer: 404 })
  ], 52_000);

  assert.equal(erster.eingabeFingerabdruck, zweiter.eingabeFingerabdruck);
  assert.equal(erster.fachlicherFingerabdruck, zweiter.fachlicherFingerabdruck);
  assert.notEqual(erster.entscheidungKennung, zweiter.entscheidungKennung);
  assert.equal('gesendetAm' in erster.situation.teilnehmer[0], false);
  assert.equal('laufendeNummer' in erster.situation.teilnehmer[0], false);
});

test('Block 8.5 EntscheidungsDatensatz: Eingabereihenfolge veraendert fachliche Fingerabdruecke nicht', () => {
  const a = meldung('a');
  const b = meldung('b');
  const links = datensatz([a, b]);
  const rechts = datensatz([b, a]);

  assert.equal(links.eingabeFingerabdruck, rechts.eingabeFingerabdruck);
  assert.equal(links.fachlicherFingerabdruck, rechts.fachlicherFingerabdruck);
  assert.deepEqual(
    links.situation.teilnehmer.map((x) => x.charakterKennung),
    ['a', 'b']
  );
});

test('Block 8.5 EntscheidungsDatensatz: fachliche Aenderung veraendert den Fingerabdruck', () => {
  const normal = datensatz([meldung('a'), meldung('b')]);
  const kritisch = datensatz([
    meldung('a'),
    meldung('b', { gefahrenStufe: 'kritisch' })
  ]);

  assert.notEqual(normal.eingabeFingerabdruck, kritisch.eingabeFingerabdruck);
  assert.notEqual(normal.fachlicherFingerabdruck, kritisch.fachlicherFingerabdruck);
  assert.equal(kritisch.gewaehlteEntscheidung, 'gruppenbetrieb:sicherheit');
  assert.ok(kritisch.erkannteEreignisse.includes('gruppen_sicherheit:kritisch'));
});

test('Block 8.5 EntscheidungsDatensatz: Freshness-Klasse ist fachlich relevant aber exaktes Alter nicht', () => {
  const frisch = datensatz([
    meldung('a'),
    meldung('b', { gesendetAm: 9_000 })
  ], 12_000);
  const stale = datensatz([
    meldung('a'),
    meldung('b', { gesendetAm: 6_000 })
  ], 12_000);

  assert.notEqual(frisch.eingabeFingerabdruck, stale.eingabeFingerabdruck);
  assert.notEqual(frisch.fachlicherFingerabdruck, stale.fachlicherFingerabdruck);
  assert.ok(stale.erkannteEreignisse.includes('teilnehmer:b:veraltet'));
  assert.equal(stale.situation.teilnehmer.find((x) => x.charakterKennung === 'b')?.koordinationsStatus, 'veraltet');
});

test('Block 8.5 EntscheidungsDatensatz: ungueltige Metadaten werden fail-safe abgewiesen', () => {
  const meldungen = [meldung('a'), meldung('b')];
  const entscheidung = koordiniereGruppe(meldungen, 'a', 12_000, cfg);

  assert.throws(
    () => erstelleGruppenEntscheidungsDatensatz('', meldungen, entscheidung),
    /ablaufKennung darf nicht leer sein/
  );
});
