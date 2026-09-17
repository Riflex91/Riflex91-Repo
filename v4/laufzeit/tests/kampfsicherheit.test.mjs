import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  erstelleKampfSicherheitsAblaufZustand,
  erstelleKampfSicherheitsKonfiguration,
  markiereSicherheitsBewegungGestartet,
  planeKampfSicherheitsSchritt,
  pruefeAngriffsReichweite
} from '../../erzeugt/spiellogik/kampfsicherheit.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });
const unbekannt = (grund = 'test') => ({ zustand: 'unbekannt', quelle: 'beobachtet', grund });

function charakter(aenderungen = {}) {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('Ranger'),
    klasse: bekannt('ranger'),
    leben: bekannt(900),
    lebenMaximal: bekannt(1000),
    mana: bekannt(800),
    manaMaximal: bekannt(1000),
    reichweite: bekannt(100),
    karte: bekannt('main'),
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

function zustand({
  nummer = 1,
  zeit = 1000,
  charakterWert = charakter(),
  monsterListe = [],
  lebenAnteil = 0.9,
  manaAnteil = 0.8
} = {}) {
  return {
    schemaVersion: 2,
    laufendeNummer: nummer,
    aufgenommenAm: zeit,
    ablaufKennung: 'kampfsicherheit-test',
    beobachtet: {
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

const konfiguration = erstelleKampfSicherheitsKonfiguration({
  rueckzugUnterLebensAnteil: 0.45,
  kritischUnterLebensAnteil: 0.25,
  mindestensManaAnteilImKampf: 0.12,
  maximalAngreifer: 2,
  mindestAbstandFaktor: 0.55,
  rueckzugDistanz: 160,
  bewegungsStillstandNachMillisekunden: 3000
});

function plane(spielzustand, vorher = erstelleKampfSicherheitsAblaufZustand(spielzustand)) {
  return planeKampfSicherheitsSchritt(spielzustand, konfiguration, vorher, spielzustand.aufgenommenAm);
}

test('ohne aktive Gefahr werden normale Aktionen freigegeben', () => {
  const spielzustand = zustand();
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'keine');
  assert.equal(ergebnis.normalAktionenErlaubt, true);
  assert.equal(ergebnis.gefahrenBewertung.stufe, 'sicher');
  assert.equal(ergebnis.aktionsAnfrage, null);
});

test('kritische Lebenspunkte unter Beschuss erzeugen Notfall-Rueckzug', () => {
  const spielzustand = zustand({ lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'rueckzug');
  assert.equal(ergebnis.normalAktionenErlaubt, false);
  assert.equal(ergebnis.gefahrenBewertung.stufe, 'kritisch');
  assert.equal(ergebnis.aktionsAnfrage?.wichtigkeit, 'notfall');
  assert.equal(ergebnis.aktionsAnfrage?.aktion, 'KAMPF_RUECKZUG');
  assert.deepEqual(ergebnis.aktionsAnfrage?.benoetigteRessourcen, ['bewegung', 'kampfziel']);
  assert.ok(ergebnis.aktionsAnfrage.details.x < 0);
  assert.equal(ergebnis.meldung?.meldungsCode, 'KAMPF_RUECKZUG');
});

test('zu geringer Abstand erzeugt Sicherheitsbewegung statt Notfall', () => {
  const spielzustand = zustand({ monsterListe: [monster('m1', 20, 0)] });
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'abstand_herstellen');
  assert.equal(ergebnis.gefahrenBewertung.stufe, 'angespannt');
  assert.equal(ergebnis.aktionsAnfrage?.wichtigkeit, 'sicherheit');
  assert.equal(ergebnis.aktionsAnfrage?.aktion, 'KAMPF_ABSTAND_HERSTELLEN');
});

test('niedriges Mana unter Beschuss fuehrt konservativ zum Rueckzug', () => {
  const spielzustand = zustand({ manaAnteil: 0.05, monsterListe: [monster('m1', 80, 0)] });
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'rueckzug');
  assert.ok(ergebnis.gefahrenBewertung.gruende.includes('MANA_NIEDRIG_IM_KAMPF'));
});

test('zu viele Angreifer fuehren zum Rueckzug', () => {
  const spielzustand = zustand({
    monsterListe: [monster('m1', 80, 0), monster('m2', 90, 10), monster('m3', 100, -10)]
  });
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'rueckzug');
  assert.ok(ergebnis.gefahrenBewertung.gruende.includes('ZU_VIELE_ANGREIFER'));
});

test('fehlende Pflichtdaten werden nicht durch Annahmen ersetzt', () => {
  const spielzustand = zustand({ manaAnteil: unbekannt('Mana nicht lesbar') });
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'blockiert');
  assert.equal(ergebnis.normalAktionenErlaubt, false);
  assert.equal(ergebnis.aktionsAnfrage, null);
  assert.equal(ergebnis.meldung?.meldungsCode, 'KAMPF_SICHERHEIT_DATEN_FEHLEN');
});

test('Rueckzug ohne bekannte Angreiferposition erfindet keine Bewegungsrichtung', () => {
  const angreifer = monster('m1', 20, 0, { echtX: unbekannt(), echtY: unbekannt(), x: unbekannt(), y: unbekannt() });
  const spielzustand = zustand({ lebenAnteil: 0.2, monsterListe: [angreifer] });
  const ergebnis = plane(spielzustand);
  assert.equal(ergebnis.art, 'blockiert');
  assert.equal(ergebnis.aktionsAnfrage, null);
  assert.equal(ergebnis.meldung?.meldungsCode, 'KAMPF_RUECKZUG_ZIEL_UNBEKANNT');
});

test('gestartete Sicherheitsbewegung ohne Positionsfortschritt wird als blockiert erkannt', () => {
  const erster = zustand({ zeit: 1000, lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const basis = erstelleKampfSicherheitsAblaufZustand(erster);
  const laufend = markiereSicherheitsBewegungGestartet(erster, basis, 1000);
  const spaeter = zustand({ nummer: 2, zeit: 4500, lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const ergebnis = planeKampfSicherheitsSchritt(spaeter, konfiguration, laufend, 4500);
  assert.equal(ergebnis.art, 'blockiert');
  assert.equal(ergebnis.normalAktionenErlaubt, false);
  assert.equal(ergebnis.meldung?.meldungsCode, 'KAMPF_RUECKZUG_BLOCKIERT');
});

test('Reichweitenpruefung unterscheidet erreichbar, zu weit und unbekannt', () => {
  const c = charakter();
  assert.equal(pruefeAngriffsReichweite(c, monster('nah', 90, 0, { ziel: bekannt(null) })), 'in_reichweite');
  assert.equal(pruefeAngriffsReichweite(c, monster('fern', 110, 0, { ziel: bekannt(null) })), 'zu_weit');
  assert.equal(pruefeAngriffsReichweite(c, monster('unklar', 50, 0, { echtX: unbekannt(), x: unbekannt(), ziel: bekannt(null) })), 'unbekannt');
});

test('Notfall-Rueckzug unterbricht eine laufende normale Farmbewegung zentral', () => {
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin({
    kennung: 'farm-normal',
    angefordertVon: 'grundlegendes-farmen',
    aktion: 'FARM_BEWEGEN',
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: 900,
    gueltigBis: 5000,
    benoetigteRessourcen: ['bewegung', 'kampfziel'],
    grund: 'Test-Farmbewegung',
    details: {}
  });
  const ersterSchritt = steuerung.verarbeiteNaechsteAktion(1000);
  assert.equal(ersterSchritt.art, 'gestartet');
  assert.equal(ersterSchritt.gestarteteAnfrage?.kennung, 'farm-normal');

  const spielzustand = zustand({ nummer: 2, zeit: 1100, lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const sicherheit = plane(spielzustand);
  steuerung.reicheAnfrageEin(sicherheit.aktionsAnfrage);
  const zweiterSchritt = steuerung.verarbeiteNaechsteAktion(1100);

  assert.equal(zweiterSchritt.art, 'gestartet');
  assert.equal(zweiterSchritt.gestarteteAnfrage?.aktion, 'KAMPF_RUECKZUG');
  assert.deepEqual(zweiterSchritt.unterbrocheneAnfragen, ['farm-normal']);
  assert.equal(steuerung.holeAktionsZustand('farm-normal')?.phase, 'abgebrochen');
});

test('gleicher Zustand erzeugt dieselbe Sicherheitsentscheidung', () => {
  const spielzustand = zustand({ lebenAnteil: 0.2, monsterListe: [monster('m2', 30, 10), monster('m1', 20, 0)] });
  const vorher = erstelleKampfSicherheitsAblaufZustand(spielzustand);
  const a = planeKampfSicherheitsSchritt(spielzustand, konfiguration, vorher, 1000);
  const b = planeKampfSicherheitsSchritt(spielzustand, konfiguration, vorher, 1000);
  assert.deepEqual(a, b);
});
