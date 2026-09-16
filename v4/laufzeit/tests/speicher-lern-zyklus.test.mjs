import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SpeicherLernZyklus,
  STANDARD_SPEICHER_LERN_SCHWELLEN
} from '../../erzeugt/lernen/speicher-lern-zyklus.js';

const GB = 1_000_000_000;

function eingabe(aenderungen = {}) {
  return {
    belegtBytes: 5 * GB,
    sicherNutzbarBytes: 18 * GB,
    verarbeiteteLoeschbareBytes: 0,
    geschuetzteBytes: 1 * GB,
    nachweis: {
      datensatzErstellt: false,
      lernenErfolgreich: false,
      pruefungBestanden: false,
      wissenDauerhaftGespeichert: false
    },
    ...aenderungen
  };
}

function vollstaendigerNachweis() {
  return {
    datensatzErstellt: true,
    lernenErfolgreich: true,
    pruefungBestanden: true,
    wissenDauerhaftGespeichert: true
  };
}

test('unter 60 Prozent werden nur Erfahrungen gesammelt', () => {
  const zyklus = new SpeicherLernZyklus();
  const ergebnis = zyklus.entscheide(eingabe());
  assert.equal(ergebnis.phase, 'sammeln');
  assert.equal(ergebnis.datensatzErstellen, false);
  assert.equal(ergebnis.bereinigungErlaubt, false);
});

test('ab 60 Prozent wird die Datensatzbildung vorbereitet', () => {
  const zyklus = new SpeicherLernZyklus();
  const ergebnis = zyklus.entscheide(eingabe({ belegtBytes: 11 * GB }));
  assert.equal(ergebnis.phase, 'vorbereiten');
  assert.equal(ergebnis.datensatzErstellen, true);
  assert.equal(ergebnis.lernenStarten, false);
});

test('ab 75 Prozent darf nach fertigem Datensatz ein Lernlauf starten', () => {
  const zyklus = new SpeicherLernZyklus();
  const ergebnis = zyklus.entscheide(eingabe({
    belegtBytes: 14 * GB,
    nachweis: {
      datensatzErstellt: true,
      lernenErfolgreich: false,
      pruefungBestanden: false,
      wissenDauerhaftGespeichert: false
    }
  }));
  assert.equal(ergebnis.phase, 'lernen');
  assert.equal(ergebnis.lernenStarten, true);
});

test('Rohdaten werden ohne vollstaendige Lern- und Sicherungsnachweise niemals freigegeben', () => {
  const zyklus = new SpeicherLernZyklus();
  const ergebnis = zyklus.entscheide(eingabe({
    belegtBytes: 16 * GB,
    verarbeiteteLoeschbareBytes: 7 * GB,
    nachweis: {
      datensatzErstellt: true,
      lernenErfolgreich: true,
      pruefungBestanden: false,
      wissenDauerhaftGespeichert: false
    }
  }));
  assert.equal(ergebnis.bereinigungErlaubt, false);
  assert.equal(ergebnis.loeschbarBisBytes, 0);
  assert.equal(ergebnis.phase, 'pruefen');
});

test('nach erfolgreichem Lernzyklus wird nur bis zum sicheren Zielstand freigegeben', () => {
  const zyklus = new SpeicherLernZyklus();
  const ergebnis = zyklus.entscheide(eingabe({
    belegtBytes: 16 * GB,
    verarbeiteteLoeschbareBytes: 10 * GB,
    geschuetzteBytes: 2 * GB,
    nachweis: vollstaendigerNachweis()
  }));
  assert.equal(ergebnis.phase, 'bereinigen');
  assert.equal(ergebnis.bereinigungErlaubt, true);
  assert.equal(ergebnis.zielBelegtBytes, 9 * GB);
  assert.equal(ergebnis.loeschbarBisBytes, 7 * GB);
});

test('bei 95 Prozent wird ohne Nachweise Logging reduziert statt unverarbeitete Daten zu loeschen', () => {
  const zyklus = new SpeicherLernZyklus();
  const ergebnis = zyklus.entscheide(eingabe({
    belegtBytes: 17.2 * GB,
    verarbeiteteLoeschbareBytes: 0,
    geschuetzteBytes: 2 * GB
  }));
  assert.equal(ergebnis.phase, 'notfall');
  assert.equal(ergebnis.datenerfassungReduzieren, true);
  assert.equal(ergebnis.bereinigungErlaubt, false);
  assert.equal(ergebnis.loeschbarBisBytes, 0);
});

test('Schwellen muessen eine sichere streng aufsteigende Reihenfolge besitzen', () => {
  assert.throws(
    () => new SpeicherLernZyklus({
      ...STANDARD_SPEICHER_LERN_SCHWELLEN,
      lernenAb: 0.55
    }),
    /streng aufsteigend/
  );
});
