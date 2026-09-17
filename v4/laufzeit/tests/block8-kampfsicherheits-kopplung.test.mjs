import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erstelleKampfSicherheitsAblaufZustand,
  erstelleKampfSicherheitsKonfiguration,
  planeKampfSicherheitsSchritt
} from '../../erzeugt/spiellogik/kampfsicherheit.js';
import { erstelleGruppenTeilnehmerMeldungAusKampfsicherheit } from '../../erzeugt/spiellogik/gruppen-lebensnachweis.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });
const unbekannt = (grund = 'unbekannt') => ({ zustand: 'unbekannt', quelle: 'beobachtet', grund });

function charakter(aenderungen = {}) {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('My_Ranger1'),
    klasse: bekannt('ranger'),
    leben: bekannt(900),
    lebenMaximal: bekannt(1000),
    mana: bekannt(800),
    manaMaximal: bekannt(1000),
    reichweite: bekannt(100),
    karte: bekannt('main'),
    instanz: bekannt('main'),
    x: bekannt(0),
    y: bekannt(0),
    echtX: bekannt(0),
    echtY: bekannt(0),
    bewegtSich: bekannt(false),
    ziel: bekannt(null),
    tot: bekannt(false),
    ...aenderungen
  };
}

function monster(id, x, y, aenderungen = {}) {
  return {
    kennung: bekannt(id),
    monsterArt: bekannt('goo'),
    leben: bekannt(100),
    lebenMaximal: bekannt(100),
    karte: bekannt('main'),
    x: bekannt(x),
    y: bekannt(y),
    echtX: bekannt(x),
    echtY: bekannt(y),
    ziel: bekannt('char-1'),
    tot: bekannt(false),
    ...aenderungen
  };
}

function spielzustand({
  nummer = 17,
  zeit = 10_000,
  charakterWert = charakter(),
  monsterListe = [],
  lebenAnteil = 0.9,
  manaAnteil = 0.8
} = {}) {
  return {
    schemaVersion: 2,
    laufendeNummer: nummer,
    aufgenommenAm: zeit,
    ablaufKennung: 'block8-kampfsicherheit-test',
    beobachtet: {
      server: { region: bekannt('EU'), kennung: bekannt('I') },
      charakter: bekannt(charakterWert),
      monster: bekannt(monsterListe)
    },
    abgeleitet: {
      lebensAnteil: typeof lebenAnteil === 'number' ? bekannt(lebenAnteil) : lebenAnteil,
      manaAnteil: typeof manaAnteil === 'number' ? bekannt(manaAnteil) : manaAnteil
    },
    gelernt: []
  };
}

const kampfKonfiguration = erstelleKampfSicherheitsKonfiguration({
  rueckzugUnterLebensAnteil: 0.45,
  kritischUnterLebensAnteil: 0.25,
  mindestensManaAnteilImKampf: 0.12,
  maximalAngreifer: 2,
  mindestAbstandFaktor: 0.55,
  rueckzugDistanz: 160,
  bewegungsStillstandNachMillisekunden: 3000
});

const faehigkeiten = Object.freeze({ heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 });

function sicherheit(zustand) {
  const vorher = erstelleKampfSicherheitsAblaufZustand(zustand, zustand.aufgenommenAm);
  return planeKampfSicherheitsSchritt(zustand, kampfKonfiguration, vorher, zustand.aufgenommenAm);
}

function lebensnachweis(zustand, entscheidung = sicherheit(zustand)) {
  return erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(zustand, {
    sicherheitsEntscheidung: entscheidung,
    faehigkeiten
  });
}

test('Block 8 Kampfsicherheits-Kopplung: sichere Block-7-Bewertung wird unveraendert in den Lebensnachweis uebernommen', () => {
  const zustand = spielzustand();
  const entscheidung = sicherheit(zustand);
  assert.equal(entscheidung.gefahrenBewertung.stufe, 'sicher');

  const ergebnis = lebensnachweis(zustand, entscheidung);
  assert.equal(ergebnis.status, 'bereit');
  assert.equal(ergebnis.meldung?.gefahrenStufe, 'sicher');
  assert.equal(ergebnis.meldung?.gesendetAm, zustand.aufgenommenAm);
});

test('Block 8 Kampfsicherheits-Kopplung: kritische Block-7-Bewertung kann von Block 8 nicht abgeschwaecht werden', () => {
  const zustand = spielzustand({ lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const entscheidung = sicherheit(zustand);
  assert.equal(entscheidung.gefahrenBewertung.stufe, 'kritisch');
  assert.equal(entscheidung.normalAktionenErlaubt, false);

  const ergebnis = lebensnachweis(zustand, entscheidung);
  assert.equal(ergebnis.status, 'bereit');
  assert.equal(ergebnis.meldung?.gefahrenStufe, 'kritisch');
});

test('Block 8 Kampfsicherheits-Kopplung: unbekannte Block-7-Sicherheitslage bleibt unbekannt und damit gruppenweit fail-safe', () => {
  const zustand = spielzustand({ manaAnteil: unbekannt('Mana nicht lesbar') });
  const entscheidung = sicherheit(zustand);
  assert.equal(entscheidung.gefahrenBewertung.stufe, 'unbekannt');
  assert.equal(entscheidung.normalAktionenErlaubt, false);

  const ergebnis = lebensnachweis(zustand, entscheidung);
  assert.equal(ergebnis.status, 'bereit');
  assert.equal(ergebnis.meldung?.gefahrenStufe, 'unbekannt');
});

test('Block 8 Kampfsicherheits-Kopplung: Sicherheitsentscheidung eines anderen Spielzustandszeitpunkts wird blockiert', () => {
  const alt = spielzustand({ zeit: 9_000, nummer: 16 });
  const aktuell = spielzustand({ zeit: 10_000, nummer: 17 });
  const ergebnis = lebensnachweis(aktuell, sicherheit(alt));

  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(ergebnis.meldung, null);
  assert.ok(ergebnis.gruende.some((grund) => grund.includes('selben Spielzustandszeitpunkt')));
});

test('Block 8 Kampfsicherheits-Kopplung: ungueltige Faehigkeiten bleiben auch mit gueltiger Block-7-Entscheidung blockiert', () => {
  const zustand = spielzustand();
  const ergebnis = erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(zustand, {
    sicherheitsEntscheidung: sicherheit(zustand),
    faehigkeiten: { ...faehigkeiten, schaden: 1.2 }
  });

  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(ergebnis.meldung, null);
});
