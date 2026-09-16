import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erstelleFarmAblaufZustand,
  erstelleFarmKonfiguration,
  erstelleFarmWiederholungsEntscheider,
  planeGrundlegendenFarmSchritt
} from '../../erzeugt/spiellogik/grundlegendes-farmen.js';
import { WiederholungsMaschine } from '../../erzeugt/wiederholung/wiederholungs-maschine.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });
const unbekannt = (grund = 'test') => ({ zustand: 'unbekannt', quelle: 'beobachtet', grund });

function charakter(aenderungen = {}) {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('Farmer'),
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

function monster(id, x, y, aenderungen = {}) {
  return {
    kennung: bekannt(id),
    monsterArt: bekannt('goo'),
    leben: bekannt(100),
    karte: bekannt('main'),
    x: bekannt(x),
    y: bekannt(y),
    echtX: bekannt(x),
    echtY: bekannt(y),
    tot: bekannt(false),
    ...aenderungen
  };
}

function inventar(freie = 3, belegt = 1) {
  return Array.from({ length: freie + belegt }, (_, index) => ({
    platz: index,
    gegenstand: bekannt(index < belegt ? { name: bekannt('hpot0') } : null)
  }));
}

function zustand({
  nummer = 1,
  zeit = 1000,
  charakterWert = charakter(),
  monsterListe = [monster('m1', 50, 0)],
  inventarWert = inventar(),
  lebenAnteil = 0.9,
  manaAnteil = 0.8
} = {}) {
  return {
    schemaVersion: 2,
    laufendeNummer: nummer,
    aufgenommenAm: zeit,
    ablaufKennung: 'farm-test',
    beobachtet: {
      charakter: bekannt(charakterWert),
      inventar: bekannt(inventarWert),
      monster: bekannt(monsterListe)
    },
    abgeleitet: {
      lebensAnteil: bekannt(lebenAnteil),
      manaAnteil: bekannt(manaAnteil)
    },
    gelernt: []
  };
}

const konfiguration = erstelleFarmKonfiguration(['goo'], {
  reichweitenPuffer: 0,
  stillstandNachMillisekunden: 1000
});

function plane(spielzustand, vorher = erstelleFarmAblaufZustand(spielzustand)) {
  return planeGrundlegendenFarmSchritt(spielzustand, konfiguration, vorher, spielzustand.aufgenommenAm);
}

test('Zielwahl ist deterministisch und waehlt bei gleicher Entfernung die kleinere Kennung', () => {
  const spielzustand = zustand({
    monsterListe: [monster('z', 200, 0), monster('b', 50, 0), monster('a', -50, 0)]
  });
  const entscheidung = plane(spielzustand);
  assert.equal(entscheidung.art, 'angreifen');
  assert.equal(entscheidung.zielKennung, 'a');
  assert.equal(entscheidung.aktionsAnfrage?.aktion, 'FARM_ANGREIFEN');
  assert.deepEqual(entscheidung.aktionsAnfrage?.benoetigteRessourcen, ['kampfziel']);
});

test('Ausserhalb der Reichweite wird Bewegung ueber Bewegung und Kampfziel angefordert', () => {
  const spielzustand = zustand({ monsterListe: [monster('m1', 250, 20)] });
  const entscheidung = plane(spielzustand);
  assert.equal(entscheidung.art, 'bewegen');
  assert.deepEqual(entscheidung.aktionsAnfrage?.benoetigteRessourcen, ['bewegung', 'kampfziel']);
  assert.deepEqual(entscheidung.aktionsAnfrage?.details, { zielKennung: 'm1', x: 250, y: 20 });
});

test('Lebenswiederherstellung hat vor Mana und Kampf Vorrang', () => {
  const spielzustand = zustand({ lebenAnteil: 0.2, manaAnteil: 0.1 });
  const entscheidung = plane(spielzustand);
  assert.equal(entscheidung.art, 'leben_wiederherstellen');
  assert.equal(entscheidung.aktionsAnfrage?.aktion, 'FARM_LEBEN_WIEDERHERSTELLEN');
  assert.deepEqual(entscheidung.aktionsAnfrage?.benoetigteRessourcen, ['inventar']);
});

test('Mana wird unterhalb seiner Schwelle wiederhergestellt', () => {
  const spielzustand = zustand({ lebenAnteil: 0.9, manaAnteil: 0.1 });
  const entscheidung = plane(spielzustand);
  assert.equal(entscheidung.art, 'mana_wiederherstellen');
  assert.equal(entscheidung.aktionsAnfrage?.aktion, 'FARM_MANA_WIEDERHERSTELLEN');
});

test('Volles Inventar stoppt konservativ statt Gegenstaende zu veraendern', () => {
  const spielzustand = zustand({ inventarWert: inventar(0, 4) });
  const entscheidung = plane(spielzustand);
  assert.equal(entscheidung.art, 'blockiert');
  assert.equal(entscheidung.aktionsAnfrage, null);
  assert.equal(entscheidung.meldung?.meldungsCode, 'FARM_INVENTAR_VOLL');
  assert.equal(entscheidung.meldung?.mussNutzerHandeln, true);
});

test('Nach Verschwinden des vorherigen Ziels wird zuerst Beute aufgenommen', () => {
  const erster = zustand({ nummer: 1, zeit: 1000, monsterListe: [monster('m1', 50, 0)] });
  const ersteEntscheidung = plane(erster);
  const zweiter = zustand({ nummer: 2, zeit: 1100, monsterListe: [monster('m2', 40, 0)] });
  const zweiteEntscheidung = planeGrundlegendenFarmSchritt(
    zweiter,
    konfiguration,
    ersteEntscheidung.naechsterAblaufZustand,
    zweiter.aufgenommenAm
  );
  assert.equal(zweiteEntscheidung.art, 'beute_aufnehmen');
  assert.equal(zweiteEntscheidung.aktionsAnfrage?.aktion, 'FARM_BEUTE_AUFNEHMEN');
  assert.deepEqual(zweiteEntscheidung.aktionsAnfrage?.details, { vorherigeZielKennung: 'm1' });
});

test('Unbekannte Pflichtdaten erzeugen keine erfundene Ersatzaktion', () => {
  const spielzustand = zustand();
  spielzustand.beobachtet.charakter = unbekannt('Charakter nicht lesbar');
  const vorher = erstelleFarmAblaufZustand(spielzustand);
  const entscheidung = planeGrundlegendenFarmSchritt(spielzustand, konfiguration, vorher, spielzustand.aufgenommenAm);
  assert.equal(entscheidung.art, 'blockiert');
  assert.equal(entscheidung.aktionsAnfrage, null);
  assert.equal(entscheidung.meldung?.meldungsCode, 'FARM_VORAUSSETZUNG_FEHLT');
});

test('Unveraenderter Zustand wird nach der Grenze als Stillstand erklaert', () => {
  const erster = zustand({ nummer: 1, zeit: 1000, monsterListe: [] });
  const vorher = erstelleFarmAblaufZustand(erster);
  const zweiter = zustand({ nummer: 2, zeit: 2500, monsterListe: [] });
  const entscheidung = planeGrundlegendenFarmSchritt(zweiter, konfiguration, vorher, zweiter.aufgenommenAm);
  assert.equal(entscheidung.art, 'warten');
  assert.equal(entscheidung.meldung?.meldungsCode, 'FARM_STILLSTAND');
  assert.equal(entscheidung.meldung?.mussNutzerHandeln, true);
});

test('Farm-Entscheidungen sind ueber die Wiederholungsmaschine reproduzierbar', () => {
  const datensatz = {
    schemaVersion: 1,
    kennung: 'farm-replay',
    erstelltAm: 3000,
    zustaende: [
      { charakterKennung: 'char-1', zustand: zustand({ nummer: 1, zeit: 1000, monsterListe: [monster('m1', 250, 0)] }) },
      { charakterKennung: 'char-1', zustand: zustand({ nummer: 2, zeit: 2000, monsterListe: [monster('m1', 50, 0)] }) }
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
  const maschine = new WiederholungsMaschine();
  const a = maschine.fuehreAus(datensatz, 'block6-a', erstelleFarmWiederholungsEntscheider(konfiguration));
  const b = maschine.fuehreAus(datensatz, 'block6-b', erstelleFarmWiederholungsEntscheider(konfiguration));
  assert.equal(a.ausgabeFingerabdruck, b.ausgabeFingerabdruck);
  assert.deepEqual(a.entscheidungen.map((e) => e.entscheidung), ['bewegen', 'angreifen']);
});
