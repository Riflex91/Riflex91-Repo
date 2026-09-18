import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  erstelleGruppenKoordinationsKonfiguration,
  koordiniereGruppe
} from '../../erzeugt/spiellogik/gruppen-koordination.js';
import {
  planeGruppenAktionen
} from '../../erzeugt/spiellogik/gruppen-aktionsplanung.js';
import {
  erstelleGruppenAktionsAnfrageKonfiguration,
  uebersetzeEigeneGruppenPlanSchritte
} from '../../erzeugt/spiellogik/gruppen-aktionsanfragen.js';
import {
  erstelleGruppenAktionsSteuerungKonfiguration,
  uebergibGruppenAktionsAnfragenAnSteuerung
} from '../../erzeugt/spiellogik/gruppen-aktionssteuerung.js';
import {
  erstelleGruppenEntscheidungsDatensatz
} from '../../erzeugt/telemetrie/gruppen-entscheidungs-datensatz.js';
import {
  verknuepfeGruppenEntscheidungMitAktionsAnfragen,
  werteGruppenEntscheidungMitAktionsErgebnissenAus,
  werteGruppenEntscheidungMitAktionsZustaendenAus
} from '../../erzeugt/telemetrie/entscheidungs-aktions-korrelation.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../../erzeugt/vertraege/gruppen-aktionsanfrage.js';

function meldung(kennung, aenderungen = {}) {
  return Object.freeze({
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
    faehigkeiten: Object.freeze({
      heilen: 0,
      schaden: 1,
      aggro: 0,
      schutz: 0,
      unterstuetzung: kennung === 'b' ? 1 : 0.5
    }),
    gesendetAm: 10_000,
    laufendeNummer: 1,
    ...aenderungen
  });
}

function pipeline() {
  const meldungen = Object.freeze([meldung('a'), meldung('b')]);
  const entscheidung = koordiniereGruppe(
    meldungen,
    'a',
    10_100,
    erstelleGruppenKoordinationsKonfiguration({
      lebensnachweisMaximalAlterMillisekunden: 5_000
    })
  );
  const datensatz = erstelleGruppenEntscheidungsDatensatz('ablauf-1', meldungen, entscheidung);
  const plan = planeGruppenAktionen(meldungen, entscheidung);
  const uebersetzung = uebersetzeEigeneGruppenPlanSchritte(
    plan,
    'a',
    erstelleGruppenAktionsAnfrageKonfiguration({
      aktiviert: true,
      freigegebeneArten: ['gemeinsames_ziel_bearbeiten'],
      gueltigkeitMillisekunden: 1_500
    })
  );
  return { meldungen, entscheidung, datensatz, plan, uebersetzung };
}

test('Block 8.5.2: EntscheidungsDatensatz wird read-only mit echter Gruppen-AktionsAnfrage verknuepft', () => {
  const { datensatz, uebersetzung } = pipeline();
  assert.equal(uebersetzung.aktionsAnfragen.length, 1);

  const verknuepft = verknuepfeGruppenEntscheidungMitAktionsAnfragen(
    datensatz,
    uebersetzung.aktionsAnfragen
  );

  assert.deepEqual(
    verknuepft.aktionsAnfrageKennungen,
    [uebersetzung.aktionsAnfragen[0].kennung]
  );
  assert.equal(verknuepft.tatsaechlichesErgebnis, null);
  assert.equal(verknuepft.eingabeFingerabdruck, datensatz.eingabeFingerabdruck);
  assert.equal(verknuepft.fachlicherFingerabdruck, datensatz.fachlicherFingerabdruck);
  assert.deepEqual(datensatz.aktionsAnfrageKennungen, []);
});

test('Block 8.5.2: Korrelation startet oder reicht selbst keine Aktion ein', () => {
  const { datensatz, uebersetzung } = pipeline();
  const steuerung = new AktionsSteuerung();

  const verknuepft = verknuepfeGruppenEntscheidungMitAktionsAnfragen(
    datensatz,
    uebersetzung.aktionsAnfragen
  );

  assert.equal(steuerung.listeAktionsZustaende().length, 0);
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
  assert.equal(verknuepft.aktionsAnfrageKennungen.length, 1);
});

test('Block 8.5.2: zentrale AktionsSteuerung bleibt Autoritaet und Ergebnis wird danach beobachtet', () => {
  const { datensatz, uebersetzung } = pipeline();
  const verknuepft = verknuepfeGruppenEntscheidungMitAktionsAnfragen(
    datensatz,
    uebersetzung.aktionsAnfragen
  );

  const steuerung = new AktionsSteuerung();
  const steuerungsCfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten],
    verarbeiten: true
  });
  const uebergabe = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung,
    steuerung,
    10_100,
    steuerungsCfg
  );
  assert.equal(uebergabe.status, 'verarbeitet');

  const offen = werteGruppenEntscheidungMitAktionsZustaendenAus(
    verknuepft,
    steuerung.listeAktionsZustaende(),
    10_110
  );
  assert.equal(offen.tatsaechlichesErgebnis.status, 'offen');
  assert.equal(offen.tatsaechlichesErgebnis.rueckmeldungen[0].phase, 'laeuft');
  assert.equal(offen.tatsaechlichesErgebnis.rueckmeldungen[0].erfolgreich, null);

  const kennung = verknuepft.aktionsAnfrageKennungen[0];
  steuerung.schliesseAktionAb(kennung, 10_120, 'Kontrollierter Testabschluss.');

  const abgeschlossen = werteGruppenEntscheidungMitAktionsZustaendenAus(
    verknuepft,
    steuerung.listeAktionsZustaende(),
    10_121
  );
  assert.equal(abgeschlossen.tatsaechlichesErgebnis.status, 'erfolgreich');
  assert.equal(abgeschlossen.tatsaechlichesErgebnis.rueckmeldungen[0].phase, 'abgeschlossen');
  assert.equal(abgeschlossen.tatsaechlichesErgebnis.rueckmeldungen[0].erfolgreich, true);
  assert.equal(abgeschlossen.fachlicherFingerabdruck, verknuepft.fachlicherFingerabdruck);
});

test('Block 8.5.2: AktionsErgebnis desselben Ablaufs kann eindeutig korreliert werden', () => {
  const { datensatz, uebersetzung } = pipeline();
  const verknuepft = verknuepfeGruppenEntscheidungMitAktionsAnfragen(
    datensatz,
    uebersetzung.aktionsAnfragen
  );
  const kennung = verknuepft.aktionsAnfrageKennungen[0];

  const ausgewertet = werteGruppenEntscheidungMitAktionsErgebnissenAus(
    verknuepft,
    [Object.freeze({
      aktionsAnfrageKennung: kennung,
      ablaufKennung: 'ablauf-1',
      erfolgreich: false,
      grund: 'Kontrolliert fehlgeschlagen.',
      gestartetAm: 10_100,
      beendetAm: 10_130
    })],
    10_131
  );

  assert.equal(ausgewertet.tatsaechlichesErgebnis.status, 'fehlgeschlagen');
  assert.equal(ausgewertet.tatsaechlichesErgebnis.rueckmeldungen[0].erfolgreich, false);
  assert.equal(ausgewertet.tatsaechlichesErgebnis.rueckmeldungen[0].grund, 'Kontrolliert fehlgeschlagen.');
});

test('Block 8.5.2: fremdes AktionsErgebnis wird nicht als eigenes Ergebnis erfunden', () => {
  const { datensatz, uebersetzung } = pipeline();
  const verknuepft = verknuepfeGruppenEntscheidungMitAktionsAnfragen(
    datensatz,
    uebersetzung.aktionsAnfragen
  );
  const kennung = verknuepft.aktionsAnfrageKennungen[0];

  const ausgewertet = werteGruppenEntscheidungMitAktionsErgebnissenAus(
    verknuepft,
    [Object.freeze({
      aktionsAnfrageKennung: kennung,
      ablaufKennung: 'anderer-ablauf',
      erfolgreich: true,
      grund: 'Fremdes Ergebnis.',
      gestartetAm: 10_100,
      beendetAm: 10_110
    })],
    10_120
  );

  assert.equal(ausgewertet.tatsaechlichesErgebnis.status, 'offen');
  assert.equal(ausgewertet.tatsaechlichesErgebnis.rueckmeldungen[0].phase, 'ergebnis_fehlt');
  assert.equal(ausgewertet.tatsaechlichesErgebnis.rueckmeldungen[0].erfolgreich, null);
});

test('Block 8.5.2: falscher Planzeitpunkt oder fremde Herkunft wird fail-safe abgewiesen', () => {
  const { datensatz, uebersetzung } = pipeline();
  const basis = uebersetzung.aktionsAnfragen[0];

  assert.throws(
    () => verknuepfeGruppenEntscheidungMitAktionsAnfragen(datensatz, [
      Object.freeze({
        ...basis,
        details: Object.freeze({ ...basis.details, planZeitpunkt: basis.details.planZeitpunkt + 1 })
      })
    ]),
    /gehoert zum Planzeitpunkt/
  );

  assert.throws(
    () => verknuepfeGruppenEntscheidungMitAktionsAnfragen(datensatz, [
      Object.freeze({ ...basis, angefordertVon: 'fremdes-modul' })
    ]),
    /stammt nicht aus der Gruppen-Aktionsplanung/
  );
});

test('Block 8.5.2: Entscheidung ohne AktionsAnfrage wird explizit als keine Aktion ausgewertet', () => {
  const { datensatz } = pipeline();
  const ausgewertet = werteGruppenEntscheidungMitAktionsZustaendenAus(datensatz, [], 10_200);

  assert.equal(ausgewertet.tatsaechlichesErgebnis.status, 'keine_aktion');
  assert.deepEqual(ausgewertet.tatsaechlichesErgebnis.rueckmeldungen, []);
});
