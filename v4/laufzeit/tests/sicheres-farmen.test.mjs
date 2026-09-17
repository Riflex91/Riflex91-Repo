import test from 'node:test';
import assert from 'node:assert/strict';
import { erstelleFarmKonfiguration } from '../../erzeugt/spiellogik/grundlegendes-farmen.js';
import { erstelleKampfSicherheitsKonfiguration } from '../../erzeugt/spiellogik/kampfsicherheit.js';
import {
  erstelleSichereFarmKonfiguration,
  erstelleSicherenFarmAblaufZustand,
  planeSicherenFarmSchritt
} from '../../erzeugt/spiellogik/sicheres-farmen.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });

function charakter(aenderungen = {}) {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('Farmer'),
    klasse: bekannt('ranger'),
    stufe: bekannt(10),
    leben: bekannt(900),
    lebenMaximal: bekannt(1000),
    mana: bekannt(800),
    manaMaximal: bekannt(1000),
    erfahrung: bekannt(100),
    erfahrungNaechsteStufe: bekannt(1000),
    gold: bekannt(500),
    reichweite: bekannt(100),
    karte: bekannt('main'),
    x: bekannt(0),
    y: bekannt(0),
    echtX: bekannt(0),
    echtY: bekannt(0),
    tot: bekannt(false),
    ...aenderungen
  };
}

function monster(x, aenderungen = {}) {
  return {
    kennung: bekannt('m1'),
    monsterArt: bekannt('goo'),
    leben: bekannt(100),
    lebenMaximal: bekannt(100),
    karte: bekannt('main'),
    x: bekannt(x),
    y: bekannt(0),
    echtX: bekannt(x),
    echtY: bekannt(0),
    ziel: bekannt(null),
    tot: bekannt(false),
    ...aenderungen
  };
}

function inventar() {
  return [
    { platz: 0, gegenstand: bekannt({ name: bekannt('hpot0') }) },
    { platz: 1, gegenstand: bekannt(null) },
    { platz: 2, gegenstand: bekannt(null) }
  ];
}

function zustand({ zeit = 1000, lebenAnteil = 0.9, manaAnteil = 0.8, monsterWert = monster(50) } = {}) {
  return {
    schemaVersion: 2,
    laufendeNummer: 1,
    aufgenommenAm: zeit,
    ablaufKennung: 'sicher-farm-test',
    beobachtet: {
      charakter: bekannt(charakter()),
      inventar: bekannt(inventar()),
      monster: bekannt([monsterWert])
    },
    abgeleitet: {
      lebensAnteil: bekannt(lebenAnteil),
      manaAnteil: bekannt(manaAnteil)
    },
    gelernt: []
  };
}

function bereitschaft({ zeit = 1000, rest = 0, zustandsArt = rest > 0 ? 'abklingzeit' : 'bereit' } = {}) {
  return {
    schemaVersion: 1,
    aufgenommenAm: zeit,
    aktionsName: 'attack',
    zustand: zustandsArt,
    bereitAb: zustandsArt === 'unbekannt' ? null : zeit + Math.max(0, rest),
    restMillisekunden: zustandsArt === 'unbekannt' ? null : Math.max(0, rest),
    grund: zustandsArt === 'unbekannt' ? 'testweise unbekannt' : 'test'
  };
}

const konfiguration = erstelleSichereFarmKonfiguration(
  erstelleFarmKonfiguration(['goo'], {
    lebenWiederherstellenUnter: 0.1,
    manaWiederherstellenUnter: 0.05,
    reichweitenPuffer: 0,
    stillstandNachMillisekunden: 10_000
  }),
  erstelleKampfSicherheitsKonfiguration(),
  500
);

function plane(spielzustand, angriffsBereitschaft) {
  const ablauf = erstelleSicherenFarmAblaufZustand(spielzustand, spielzustand.aufgenommenAm);
  return planeSicherenFarmSchritt(spielzustand, konfiguration, ablauf, angriffsBereitschaft, spielzustand.aufgenommenAm);
}

test('Kampfsicherheit wird vor dem normalen Farmplan ausgewertet', () => {
  const spielzustand = zustand({
    lebenAnteil: 0.2,
    monsterWert: monster(50, { ziel: bekannt('char-1') })
  });
  const schritt = plane(spielzustand, bereitschaft());

  assert.equal(schritt.art, 'kampfsicherheit');
  assert.equal(schritt.aktionsAnfrage?.aktion, 'KAMPF_RUECKZUG');
  assert.equal(schritt.aktionsAnfrage?.wichtigkeit, 'notfall');
  assert.equal(schritt.farmEntscheidung, null);
});

test('Attack-Cooldown verhindert einen geplanten Angriff ohne den Farmzustand vorzutreiben', () => {
  const spielzustand = zustand();
  const vorher = erstelleSicherenFarmAblaufZustand(spielzustand, spielzustand.aufgenommenAm);
  const schritt = planeSicherenFarmSchritt(spielzustand, konfiguration, vorher, bereitschaft({ rest: 250 }), spielzustand.aufgenommenAm);

  assert.equal(schritt.art, 'abklingzeit');
  assert.equal(schritt.aktionsAnfrage, null);
  assert.equal(schritt.farmEntscheidung?.art, 'angreifen');
  assert.deepEqual(schritt.naechsterAblaufZustand.farmen, vorher.farmen);
});

test('unbekannte Angriffsbereitschaft erzeugt keinen geratenen Angriff', () => {
  const spielzustand = zustand();
  const schritt = plane(spielzustand, bereitschaft({ zustandsArt: 'unbekannt' }));

  assert.equal(schritt.art, 'blockiert');
  assert.equal(schritt.aktionsAnfrage, null);
  assert.equal(schritt.farmEntscheidung?.art, 'angreifen');
});

test('veraltete Angriffsbereitschaft wird blockiert', () => {
  const spielzustand = zustand({ zeit: 1000 });
  const schritt = plane(spielzustand, bereitschaft({ zeit: 0 }));

  assert.equal(schritt.art, 'blockiert');
  assert.match(schritt.grund, /zu alt/);
  assert.equal(schritt.aktionsAnfrage, null);
});

test('frische Bereitschaft gibt den normalen Angriff frei', () => {
  const spielzustand = zustand();
  const schritt = plane(spielzustand, bereitschaft());

  assert.equal(schritt.art, 'farmen');
  assert.equal(schritt.farmEntscheidung?.art, 'angreifen');
  assert.equal(schritt.aktionsAnfrage?.aktion, 'FARM_ANGREIFEN');
});

test('Attack-Cooldown blockiert keine notwendige Bewegung zum Ziel', () => {
  const spielzustand = zustand({ monsterWert: monster(250) });
  const schritt = plane(spielzustand, bereitschaft({ rest: 300 }));

  assert.equal(schritt.art, 'farmen');
  assert.equal(schritt.farmEntscheidung?.art, 'bewegen');
  assert.equal(schritt.aktionsAnfrage?.aktion, 'FARM_BEWEGEN');
});
