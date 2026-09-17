import test from 'node:test';
import assert from 'node:assert/strict';
import { WiederholungsMaschine } from '../../erzeugt/wiederholung/wiederholungs-maschine.js';
import { erstelleKampfSicherheitsKonfiguration } from '../../erzeugt/spiellogik/kampfsicherheit.js';
import { erstelleKampfSicherheitsWiederholungsEntscheider } from '../../erzeugt/wiederholung/kampfsicherheit-wiederholung.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });

function charakter() {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('Ranger'),
    klasse: bekannt('ranger'),
    leben: bekannt(200),
    lebenMaximal: bekannt(1000),
    mana: bekannt(800),
    manaMaximal: bekannt(1000),
    reichweite: bekannt(100),
    karte: bekannt('main'),
    x: bekannt(0),
    y: bekannt(0),
    echtX: bekannt(0),
    echtY: bekannt(0),
    tot: bekannt(false)
  };
}

function monster() {
  return {
    kennung: bekannt('m1'),
    monsterArt: bekannt('goo'),
    leben: bekannt(100),
    lebenMaximal: bekannt(100),
    karte: bekannt('main'),
    x: bekannt(20),
    y: bekannt(0),
    echtX: bekannt(20),
    echtY: bekannt(0),
    ziel: bekannt('char-1'),
    tot: bekannt(false)
  };
}

function spielzustand(nummer, zeit) {
  return {
    schemaVersion: 2,
    laufendeNummer: nummer,
    aufgenommenAm: zeit,
    ablaufKennung: 'block7-replay',
    beobachtet: {
      charakter: bekannt(charakter()),
      monster: bekannt([monster()])
    },
    abgeleitet: {
      lebensAnteil: bekannt(0.2),
      manaAnteil: bekannt(0.8)
    },
    gelernt: []
  };
}

const datensatz = {
  schemaVersion: 1,
  kennung: 'block7-kampfsicherheit-replay',
  erstelltAm: 3000,
  zustaende: [
    { charakterKennung: 'char-1', zustand: spielzustand(1, 1000) },
    { charakterKennung: 'char-1', zustand: spielzustand(2, 2000) }
  ],
  ereignisse: [],
  ablaufBeobachtungen: [],
  vorfallRegeln: {
    stillstandNachMillisekunden: 10000,
    schleifenFensterMillisekunden: 10000,
    schleifenWiederholungen: 3,
    schleifenMusterLaengeMax: 4
  },
  kontingentSchritte: [],
  telemetrieDauerzustand: null,
  leistungsZeitraeume: []
};

test('Kampfsicherheits-Replay ist deterministisch und reproduziert Rueckzug', () => {
  const konfiguration = erstelleKampfSicherheitsKonfiguration();
  const maschine = new WiederholungsMaschine();
  const a = maschine.fuehreAus(datensatz, 'block7-a', erstelleKampfSicherheitsWiederholungsEntscheider(konfiguration));
  const b = maschine.fuehreAus(datensatz, 'block7-b', erstelleKampfSicherheitsWiederholungsEntscheider(konfiguration));

  assert.equal(a.ausgabeFingerabdruck, b.ausgabeFingerabdruck);
  assert.deepEqual(a.entscheidungen.map((eintrag) => eintrag.entscheidung), ['rueckzug', 'rueckzug']);
  assert.deepEqual(a.entscheidungen.map((eintrag) => eintrag.sicherheitszustand), ['warnung', 'warnung']);
  assert.equal(a.entscheidungen[0].details.aktionsWichtigkeit, 'notfall');
});
