import test from 'node:test';
import assert from 'node:assert/strict';
import { AuftragsVorschlaege } from '../erzeugt/kern/auftrags-vorschlaege.js';

const vorschlaege = [
  {
    vorschlagKennung: 'sammeln',
    anzeigeText: 'Sammeln',
    einfuegeText: 'Sammle ',
    erklaerung: 'Sammelt eine festgelegte Menge eines bekannten Gegenstands.',
    schluesselWoerter: ['sammeln', 'sammle'],
    art: 'sammeln'
  },
  {
    vorschlagKennung: 'herstellen',
    anzeigeText: 'Herstellen',
    einfuegeText: 'Stelle ',
    erklaerung: 'Stellt einen bekannten Gegenstand nach geprueftem Plan her.',
    schluesselWoerter: ['herstellen', 'stelle'],
    art: 'herstellen'
  },
  {
    vorschlagKennung: 'bee-wing',
    anzeigeText: 'Bienenfluegel',
    einfuegeText: 'Bienenfluegel',
    erklaerung: 'Bekannter sammelbarer Gegenstand.',
    schluesselWoerter: ['bienenfluegel', 'bee', 'wing'],
    gegenstandKennung: 'bee_wing'
  }
];

test('leere Eingabe zeigt verfuegbare Vorschlaege', () => {
  const ergebnis = new AuftragsVorschlaege().suche('', vorschlaege, 2);
  assert.equal(ergebnis.length, 2);
});

test('sam findet den Sammelauftrag zuerst', () => {
  const ergebnis = new AuftragsVorschlaege().suche('sam', vorschlaege);
  assert.equal(ergebnis[0].vorschlagKennung, 'sammeln');
});

test('bee findet den passenden bekannten Gegenstand', () => {
  const ergebnis = new AuftragsVorschlaege().suche('bee', vorschlaege);
  assert.equal(ergebnis[0].vorschlagKennung, 'bee-wing');
});

test('unbekannte Eingabe erzeugt keinen scheinbar gueltigen Vorschlag', () => {
  const ergebnis = new AuftragsVorschlaege().suche('teleportiere alles', vorschlaege);
  assert.deepEqual(ergebnis, []);
});
