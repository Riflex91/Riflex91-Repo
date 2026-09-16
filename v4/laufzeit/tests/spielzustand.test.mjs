import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandLesezugriff } from '../../erzeugt/adventure-land/adventure-land-lesezugriff.js';
import { beobachteSpielzustand } from '../../erzeugt/kern/spielzustand-erstellung.js';
import {
  erstelleSpielzustandAufzeichnung,
  ladeSpielzustand,
  ladeSpielzustandAufzeichnung,
  serialisiereSpielzustand,
  serialisiereSpielzustandAufzeichnung
} from '../../erzeugt/kern/spielzustand-aufzeichnung.js';

function spielFenster(entityReihenfolge = 'normal') {
  const monsterA = {
    id: 'm-2', name: 'Goo', type: 'monster', mtype: 'goo', level: 1,
    hp: 50, max_hp: 100, mp: 2, max_mp: 2,
    attack: 5, frequency: 0.4, speed: 6, range: 15, armor: 0, resistance: 0,
    map: 'main', in: 'main', x: 10, y: 20, real_x: 10, real_y: 20, moving: true
  };
  const monsterB = {
    id: 'm-1', name: 'Bee', type: 'monster', mtype: 'bee', level: 1,
    hp: 300, max_hp: 300, mp: 6, max_mp: 6,
    attack: 16, frequency: 0.5, speed: 12, range: 20, armor: 0, resistance: 0,
    map: 'main', in: 'main', x: 30, y: 40, real_x: 30, real_y: 40, moving: false, target: null
  };

  const entities = entityReihenfolge === 'normal'
    ? { z: monsterA, a: monsterB, kaputt: 17 }
    : { kaputt: 17, a: monsterB, z: monsterA };

  let aktionsAufrufe = 0;
  return {
    get aktionsAufrufe() { return aktionsAufrufe; },
    attack() { aktionsAufrufe += 1; },
    move() { aktionsAufrufe += 1; },
    character: {
      id: 'Test', name: 'Test', ctype: 'merchant', level: 10,
      hp: 50, max_hp: 100, mp: 30, max_mp: 60,
      xp: 1000, max_xp: 2000, gold: 500,
      attack: 12, frequency: 0.5, speed: 40, range: 90, armor: 20, resistance: 30,
      map: 'main', in: 'main', x: 1, y: 2, real_x: 1, real_y: 2,
      target: null, rip: false, stand: false,
      items: [{ name: 'hpot0', q: 100 }, null, { name: 'staff', level: 1, expires: '2030-01-01' }],
      slots: { mainhand: { name: 'staff', level: 1 }, chest: null, unbekannt: 17 }
    },
    entities,
    party: {
      Test: { name: 'Test', type: 'merchant', level: 10, hp: 50, max_hp: 100, mp: 30, max_mp: 60, map: 'main', in: 'main', x: 1, y: 2 }
    },
    G: {
      maps: {
        main: {
          name: 'Mainland', zone: 'main', safe: true, pvp: false, instance: false, ignore: false,
          monsters: [{ type: 'goo' }], spawns: [[0, 0]], doors: [], npcs: { potion: {} }
        }
      }
    },
    server_region: 'EU',
    server_identifier: 'I'
  };
}

const meta = { laufendeNummer: 7, aufgenommenAm: 123456789, ablaufKennung: 'test-ablauf' };

test('AdventureLandLesezugriff liest nur Daten und ruft keine Spielaktion auf', () => {
  const fenster = spielFenster();
  const quelle = new AdventureLandLesezugriff(fenster);
  const roh = quelle.liesRohdaten();

  assert.equal(roh.charakter.vorhanden, true);
  assert.equal(roh.entities.vorhanden, true);
  assert.equal(fenster.aktionsAufrufe, 0);
});

test('gleiche Eingangsdaten erzeugen unabhaengig von Entity-Einfuegereihenfolge denselben Zustand', () => {
  const links = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster('normal')), meta);
  const rechts = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster('anders')), meta);

  assert.deepEqual(links, rechts);
  assert.equal(serialisiereSpielzustand(links), serialisiereSpielzustand(rechts));
  assert.equal(links.beobachtet.monster.zustand, 'bekannt');
  assert.deepEqual(links.beobachtet.monster.wert.map((monster) => monster.kennung.wert), ['m-1', 'm-2']);
});

test('fehlende Felder bleiben fehlend und explizites null bleibt ein bekannter Wert', () => {
  const zustand = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster()), meta);
  assert.equal(zustand.beobachtet.charakter.zustand, 'bekannt');
  const charakter = zustand.beobachtet.charakter.wert;

  assert.equal(charakter.bewegtSich.zustand, 'fehlend');
  assert.equal(charakter.ziel.zustand, 'bekannt');
  assert.equal(charakter.ziel.wert, null);

  assert.equal(zustand.beobachtet.monster.zustand, 'bekannt');
  const [bee, goo] = zustand.beobachtet.monster.wert;
  assert.equal(bee.ziel.zustand, 'bekannt');
  assert.equal(bee.ziel.wert, null);
  assert.equal(goo.ziel.zustand, 'fehlend');
});

test('beobachtetes, abgeleitetes und gelerntes Wissen bleiben getrennt', () => {
  const zustand = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster()), meta);

  assert.equal(zustand.beobachtet.server.region.quelle, 'beobachtet');
  assert.equal(zustand.abgeleitet.lebensAnteil.zustand, 'bekannt');
  assert.equal(zustand.abgeleitet.lebensAnteil.quelle, 'abgeleitet');
  assert.equal(zustand.abgeleitet.lebensAnteil.wert, 0.5);
  assert.equal(zustand.abgeleitet.inventarBelegt.wert, 2);
  assert.equal(zustand.abgeleitet.sichtbareMonster.wert, 2);
  assert.deepEqual(zustand.gelernt, []);
});

test('ungueltige Daten werden nicht als plausible Spielwerte erfunden', () => {
  const fenster = spielFenster();
  fenster.character.hp = 'viel';
  fenster.character.slots.unbekannt = 17;
  const zustand = beobachteSpielzustand(new AdventureLandLesezugriff(fenster), meta);

  assert.equal(zustand.beobachtet.charakter.wert.leben.zustand, 'unbekannt');
  assert.equal(zustand.abgeleitet.lebensAnteil.zustand, 'unbekannt');
  assert.equal(zustand.beobachtet.charakter.wert.ausruestung.zustand, 'bekannt');
  assert.equal(zustand.beobachtet.charakter.wert.ausruestung.wert.unbekannt.zustand, 'unbekannt');
  assert.equal(zustand.beobachtet.sonstigeObjekte.zustand, 'bekannt');
  assert.equal(zustand.beobachtet.sonstigeObjekte.wert[0].kennung.wert, 'kaputt');
  assert.equal(zustand.beobachtet.sonstigeObjekte.wert[0].art.zustand, 'unbekannt');
});

test('Spielzustaende sind tief unveraenderlich', () => {
  const zustand = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster()), meta);
  assert.equal(Object.isFrozen(zustand), true);
  assert.equal(Object.isFrozen(zustand.beobachtet), true);
  assert.equal(Object.isFrozen(zustand.beobachtet.charakter.wert), true);
  assert.equal(Object.isFrozen(zustand.beobachtet.inventar.wert), true);
  assert.throws(() => { zustand.beobachtet.charakter.wert.name = 'veraendert'; }, TypeError);
});

test('einzelne Zustaende und Aufzeichnungen koennen offline verlustfrei geladen werden', () => {
  const erster = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster()), { ...meta, laufendeNummer: 7 });
  const zweiter = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster()), { ...meta, laufendeNummer: 8, aufgenommenAm: meta.aufgenommenAm + 1000 });

  const geladen = ladeSpielzustand(serialisiereSpielzustand(erster));
  assert.deepEqual(geladen, erster);
  assert.equal(Object.isFrozen(geladen.beobachtet), true);

  const aufzeichnung = erstelleSpielzustandAufzeichnung([erster, zweiter], 999);
  const wiederGeladen = ladeSpielzustandAufzeichnung(serialisiereSpielzustandAufzeichnung(aufzeichnung));
  assert.deepEqual(wiederGeladen, aufzeichnung);
  assert.equal(Object.isFrozen(wiederGeladen.zustaende), true);
});

test('Aufzeichnungen lehnen doppelte oder rueckwaerts laufende Zustandsnummern ab', () => {
  const zustand = beobachteSpielzustand(new AdventureLandLesezugriff(spielFenster()), meta);
  assert.throws(() => erstelleSpielzustandAufzeichnung([zustand, zustand], 999), /streng steigende/);
  assert.throws(() => ladeSpielzustand('{"schemaVersion":999}'), /Schemaversion/);
});
