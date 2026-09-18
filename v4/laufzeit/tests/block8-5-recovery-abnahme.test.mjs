import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  bewerteRuntimeGesundheit,
  erstelleRuntimeGesundheitsKonfiguration
} from '../../erzeugt/telemetrie/runtime-gesundheit.js';
import { RecoveryCheckpointSpeicher } from '../../erzeugt/telemetrie/recovery-checkpoint.js';
import { LaufzeitSteuerung } from '../../erzeugt/kern/laufzeit-steuerung.js';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { SichereBasisBedienung } from '../../erzeugt/kern/sichere-basis-bedienung.js';

class Speicher {
  constructor() {
    this.map = new Map();
    this.fehlerSchluessel = new Set();
  }

  getItem(schluessel) {
    return this.map.get(schluessel) ?? null;
  }

  setItem(schluessel, wert) {
    if (this.fehlerSchluessel.has(schluessel)) {
      throw new Error(`Speicherfehler fuer ${schluessel}`);
    }
    this.map.set(schluessel, wert);
  }
}

function checkpointInhalt(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    charakterKennung: 'My_Ranger1',
    ablaufKennung: 'ablauf-vor-neustart',
    entscheidungKennung: 'entscheidung-vor-neustart',
    fachlicherFingerabdruck: 'a'.repeat(64),
    recoveryStufe: 'sicher_pausiert',
    offeneAktionsAnfrageKennungen: Object.freeze(['aktion-alt']),
    letzteEreignisNummer: 42,
    ...aenderungen
  });
}

function gesundheitsBeobachtung(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: 100_000,
    laufzeitGestartetAm: 10_000,
    snapshotErwartet: true,
    letzterSnapshotAm: 99_000,
    heartbeatErwartet: true,
    letzterHeartbeatAm: 99_000,
    fachlicherFortschrittErwartet: true,
    letzterFachlicherFortschrittAm: 99_000,
    gruppenLiveness: 'gesund',
    sicherheitsStufe: 'sicher',
    offeneAktionsAnfragen: 0,
    abgebrocheneAktionsAnfragen: 0,
    kritischerLaufzeitFehler: false,
    ...aenderungen
  });
}

function aktionsAnfrage(kennung) {
  return Object.freeze({
    kennung,
    angefordertVon: 'recovery-abnahme',
    aktion: 'TEST_AKTION',
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: 10_000,
    gueltigBis: 20_000,
    benoetigteRessourcen: Object.freeze(['inventar']),
    grund: 'Recovery-Abnahme.',
    details: Object.freeze({})
  });
}

function bedienSetup() {
  const laufzeitSteuerung = new LaufzeitSteuerung();
  const aktionsSteuerung = new AktionsSteuerung({ laufzeitSteuerung });
  const bedienung = new SichereBasisBedienung({
    laufzeitSteuerung,
    aktionsSteuerung,
    diagnoseLieferant: () => Object.freeze({ ok: true })
  });
  return { laufzeitSteuerung, aktionsSteuerung, bedienung };
}

const gesundheitCfg = erstelleRuntimeGesundheitsKonfiguration({
  beobachtenNachMillisekunden: 5_000,
  sicherPausierenNachMillisekunden: 15_000,
  neustartEmpfehlenNachMillisekunden: 60_000
});

test('Block 8.5.8 Recovery-Abnahme: Reconnect bleibt durch reale Stale-Recovery-Regressionen ohne neue Spielaktion abgesichert', async () => {
  const quelle = await readFile(
    new URL('./block8-10-minuten-gruppentest-gui.test.mjs', import.meta.url),
    'utf8'
  );

  for (const pflicht of [
    'besteht als Leiter mit aktiv stale Aufgabenwechsel reconnect und 0 zentralen Aktionen',
    'toleriert transienten ungeplanten Stale nur mit sicherer Neuverteilung und Auto-Recovery',
    'bricht bei ungeplantem Stale ohne Auto-Recovery nach 30 Sekunden fail-safe ab'
  ]) {
    assert.equal(quelle.includes(pflicht), true, pflicht);
  }
});

test('Block 8.5.8 Recovery-Abnahme: stale Daten eskalieren fail-safe ohne automatische Host-Neustartautoritaet', () => {
  const sicherPausiert = bewerteRuntimeGesundheit(gesundheitsBeobachtung({
    laufzeitGestartetAm: 70_000,
    letzterSnapshotAm: 84_999,
    letzterHeartbeatAm: 99_000,
    letzterFachlicherFortschrittAm: 99_000
  }), gesundheitCfg);

  assert.equal(sicherPausiert.recoveryStufe, 'sicher_pausiert');
  assert.equal(sicherPausiert.automatischerNeustart, false);

  const neustartEmpfohlen = bewerteRuntimeGesundheit(gesundheitsBeobachtung({
    letzterSnapshotAm: 39_999
  }), gesundheitCfg);

  assert.equal(neustartEmpfohlen.recoveryStufe, 'neustart_empfohlen');
  assert.equal(neustartEmpfohlen.hostNeustartEmpfohlen, true);
  assert.equal(neustartEmpfohlen.automatischerNeustart, false);
  assert.equal(neustartEmpfohlen.mussNutzerHandeln, true);
});

test('Block 8.5.8 Recovery-Abnahme: Browser-Hintergrundbetrieb bleibt an performance_trick und Produktionsheartbeat gebunden', async () => {
  const quelle = await readFile(
    new URL('./block8-produktions-einstieg.test.mjs', import.meta.url),
    'utf8'
  );

  for (const pflicht of [
    'besitzt autonomen 2s-Heartbeat mit Pause Fortsetzen und Transportmetriken',
    'blockiert aktive Browserlaufzeit fail-safe ohne performance_trick',
    'Bot-Pause laeuft durch BedienSicherung und laesst Produktionsheartbeat aktiv'
  ]) {
    assert.equal(quelle.includes(pflicht), true, pflicht);
  }
});

test('Block 8.5.8 Recovery-Abnahme: Runtime-Neustart laedt Checkpoint nur zum Abgleich und nie als Fortsetzungsautoritaet', () => {
  const backing = new Speicher();
  const vorNeustart = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'restart' });
  assert.equal(
    vorNeustart.speichere(checkpointInhalt(), 10_000, 'vor-runtime-neustart').status,
    'gespeichert'
  );

  const nachNeustart = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'restart' });
  const geladen = nachNeustart.lade();

  assert.equal(geladen.status, 'geladen');
  assert.equal(geladen.checkpoint.wiederaufnahmeErlaubt, false);
  assert.equal(geladen.checkpoint.abgleichErforderlich, true);
  assert.equal(geladen.checkpoint.aktionsAutoritaet, false);
  assert.deepEqual(geladen.checkpoint.inhalt.offeneAktionsAnfrageKennungen, ['aktion-alt']);
});

test('Block 8.5.8 Recovery-Abnahme: HUD-Schliessen oder HUD-Fehler besitzt keinen Runtime-Aktionspfad', async () => {
  const quelle = await readFile(
    new URL('../../werkzeuge/block8-5-ingame-hud.js', import.meta.url),
    'utf8'
  );

  const start = quelle.indexOf('function hudSchliessen()');
  const ende = quelle.indexOf("minimieren.addEventListener", start);
  assert.notEqual(start, -1);
  assert.notEqual(ende, -1);

  const schliessen = quelle.slice(start, ende);
  assert.match(schliessen, /sichtbar = false/);
  assert.match(schliessen, /wurzel\.style\.display = 'none'/);
  assert.match(schliessen, /stoppeTimer\(\)/);

  for (const verboten of [
    'basisBedien',
    'AktionsSteuerung',
    'LaufzeitSteuerung',
    'pausiereLebensnachweis',
    'setzeLebensnachweis',
    'location.reload',
    'window.close'
  ]) {
    assert.equal(schliessen.includes(verboten), false, verboten);
  }

  assert.equal(quelle.includes('return setzeFehler(fehler);'), true);
});

test('Block 8.5.8 Recovery-Abnahme: unterbrochene normale Aktion wird nach Fortsetzen nicht wiederbelebt', () => {
  const { aktionsSteuerung, bedienung } = bedienSetup();

  aktionsSteuerung.reicheAnfrageEin(aktionsAnfrage('aktion-alt'));
  aktionsSteuerung.verarbeiteNaechsteAktion(10_010);
  assert.equal(aktionsSteuerung.holeAktionsZustand('aktion-alt')?.phase, 'laeuft');

  const pause = bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'abnahme-pause',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  }));
  assert.equal(pause.status, 'ausgefuehrt');
  assert.equal(aktionsSteuerung.holeAktionsZustand('aktion-alt')?.phase, 'abgebrochen');

  const fortsetzen = bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'abnahme-fortsetzen',
    aktion: 'laufzeit_fortsetzen',
    angefordertAm: 10_200,
    ausdruecklichBestaetigt: true
  }));
  assert.equal(fortsetzen.status, 'ausgefuehrt');
  assert.equal(aktionsSteuerung.holeAktionsZustand('aktion-alt')?.phase, 'abgebrochen');
});

test('Block 8.5.8 Recovery-Abnahme: offener Checkpoint transportiert nur Kennungen und keine Aktionsautoritaet', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'offen' });
  speicher.speichere(checkpointInhalt({
    offeneAktionsAnfrageKennungen: Object.freeze(['aktion-b', 'aktion-a', 'aktion-a'])
  }), 10_000, 'offene-arbeit');

  const geladen = speicher.lade().checkpoint;
  assert.deepEqual(geladen.inhalt.offeneAktionsAnfrageKennungen, ['aktion-a', 'aktion-b']);
  assert.equal(geladen.wiederaufnahmeErlaubt, false);
  assert.equal(geladen.abgleichErforderlich, true);
  assert.equal(geladen.aktionsAutoritaet, false);
});

test('Block 8.5.8 Recovery-Abnahme: doppelte Bedienanfrage wird nicht erneut ausgefuehrt', () => {
  const { laufzeitSteuerung, bedienung } = bedienSetup();
  const anfrage = bedienung.erstelleAnfrage({
    vorgangsKennung: 'abnahme-doppelt',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  });

  const erster = bedienung.fuehreAus(anfrage);
  const generation = laufzeitSteuerung.status().generation;
  const zweiter = bedienung.fuehreAus(anfrage);

  assert.equal(erster.status, 'ausgefuehrt');
  assert.equal(zweiter.status, 'wiederholt');
  assert.equal(laufzeitSteuerung.status().generation, generation);
});

test('Block 8.5.8 Recovery-Abnahme: ungueltiger oder veralteter Status wird fail-safe blockiert', async () => {
  const { laufzeitSteuerung, bedienung } = bedienSetup();
  const stale = bedienung.erstelleAnfrage({
    vorgangsKennung: 'abnahme-stale',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  });

  laufzeitSteuerung.pausiere(10_110, 'Andere sichere Zustandsaenderung.');
  laufzeitSteuerung.setzeFort(10_120, 'Andere bestaetigte Zustandsaenderung.');

  const ergebnis = bedienung.fuehreAus(stale);
  assert.equal(ergebnis.status, 'blockiert');
  assert.ok(
    ergebnis.bedienEntscheidung.fehlendeVoraussetzungen.some(
      (voraussetzung) => voraussetzung.kennung === 'laufzeit-generation-aktuell'
    )
  );

  const statusTests = await readFile(
    new URL('./block8-5-status-schnittstelle.test.mjs', import.meta.url),
    'utf8'
  );
  assert.equal(
    statusTests.includes('ungueltige Status-Metadaten werden fail-safe abgewiesen'),
    true
  );
});

test('Block 8.5.8 Recovery-Abnahme: Telemetrie- oder Speicherfehler behaelt letzten bestaetigten Zustand und blockiert kritisch', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'fehler' });
  const alt = speicher.speichere(checkpointInhalt({
    letzteEreignisNummer: 1
  }), 10_000, 'alt');
  assert.equal(alt.status, 'gespeichert');

  backing.fehlerSchluessel.add('fehler:zeiger');
  const neu = speicher.speichere(checkpointInhalt({
    letzteEreignisNummer: 2
  }), 11_000, 'neu');
  assert.equal(neu.status, 'speicher_fehler');

  const geladen = speicher.lade();
  assert.equal(geladen.status, 'geladen');
  assert.equal(geladen.checkpoint.inhalt.letzteEreignisNummer, 1);
  assert.equal(geladen.checkpoint.wiederaufnahmeErlaubt, false);

  const kritisch = bewerteRuntimeGesundheit(gesundheitsBeobachtung({
    kritischerLaufzeitFehler: true
  }), gesundheitCfg);
  assert.equal(kritisch.recoveryStufe, 'blockiert');
  assert.equal(kritisch.automatischerNeustart, false);
});
