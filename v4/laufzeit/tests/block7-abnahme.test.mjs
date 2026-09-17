import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  erstelleKampfSicherheitsAblaufZustand,
  erstelleKampfSicherheitsKonfiguration,
  markiereSicherheitsBewegungGestartet,
  planeKampfSicherheitsSchritt
} from '../../erzeugt/spiellogik/kampfsicherheit.js';
import { AdventureLandKampfSicherheitsAusfuehrung } from '../../erzeugt/ausfuehrung/adventure-land-kampfsicherheits-ausfuehrung.js';
import { AdventureLandFarmAusfuehrung } from '../../erzeugt/ausfuehrung/adventure-land-farm-ausfuehrung.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });
const unbekannt = (grund = 'testweise unbekannt') => ({ zustand: 'unbekannt', quelle: 'beobachtet', grund });

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

function spielzustand({ nummer = 1, zeit = 1000, lebenAnteil = 0.9, manaAnteil = 0.8, monsterListe = [] } = {}) {
  return {
    schemaVersion: 2,
    laufendeNummer: nummer,
    aufgenommenAm: zeit,
    ablaufKennung: 'block7-abnahme',
    beobachtet: { charakter: bekannt(charakter()), monster: bekannt(monsterListe) },
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

function plane(zustand, vorher = erstelleKampfSicherheitsAblaufZustand(zustand)) {
  return planeKampfSicherheitsSchritt(zustand, konfiguration, vorher, zustand.aufgenommenAm);
}

function normaleFarmbewegung() {
  return {
    kennung: 'farm-normal',
    angefordertVon: 'grundlegendes-farmen',
    aktion: 'FARM_BEWEGEN',
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: 900,
    gueltigBis: 5000,
    benoetigteRessourcen: ['bewegung', 'kampfziel'],
    grund: 'Abnahme: laufende normale Farmbewegung',
    details: { x: 10, y: 10 }
  };
}

function farmAngriff() {
  return {
    kennung: 'farm-angriff',
    angefordertVon: 'grundlegendes-farmen',
    aktion: 'FARM_ANGREIFEN',
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: 1,
    gueltigBis: 100,
    benoetigteRessourcen: ['kampfziel'],
    grund: 'Abnahme: Reichweiten-Recheck',
    details: { zielKennung: 'm1' }
  };
}

test('Block-7-Abnahme: kritische HP unter Beschuss verdraengen Farmen und starten genau eine freigegebene Rueckzugsbewegung', async () => {
  const zustand = spielzustand({ lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const sicherheit = plane(zustand);
  assert.equal(sicherheit.aktionsAnfrage?.aktion, 'KAMPF_RUECKZUG');
  assert.equal(sicherheit.aktionsAnfrage?.wichtigkeit, 'notfall');

  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(normaleFarmbewegung());
  assert.equal(steuerung.verarbeiteNaechsteAktion(1000).gestarteteAnfrage?.kennung, 'farm-normal');
  steuerung.reicheAnfrageEin(sicherheit.aktionsAnfrage);
  const notfallSchritt = steuerung.verarbeiteNaechsteAktion(1100);
  assert.equal(notfallSchritt.art, 'gestartet');
  assert.equal(notfallSchritt.gestarteteAnfrage?.aktion, 'KAMPF_RUECKZUG');
  assert.deepEqual(notfallSchritt.unterbrocheneAnfragen, ['farm-normal']);

  const aufrufe = [];
  const executor = new AdventureLandKampfSicherheitsAusfuehrung({ move(x, y) { aufrufe.push([x, y]); } }, { aktivFreigegeben: true });
  await executor.fuehreFreigegebeneSicherheitsAktionAus(notfallSchritt, steuerung, () => 1101);
  assert.equal(aufrufe.length, 1);
  assert.equal(steuerung.holeAktionsZustand('farm-normal')?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Block-7-Abnahme: zu kleiner Abstand erzeugt kontrolliertes Abstandhalten statt normalem Farmen', async () => {
  const zustand = spielzustand({ monsterListe: [monster('m1', 20, 0)] });
  const sicherheit = plane(zustand);
  assert.equal(sicherheit.art, 'abstand_herstellen');
  assert.equal(sicherheit.aktionsAnfrage?.aktion, 'KAMPF_ABSTAND_HERSTELLEN');
  assert.equal(sicherheit.aktionsAnfrage?.wichtigkeit, 'sicherheit');

  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(sicherheit.aktionsAnfrage);
  const schritt = steuerung.verarbeiteNaechsteAktion(1000);
  const aufrufe = [];
  const executor = new AdventureLandKampfSicherheitsAusfuehrung({ move(x, y) { aufrufe.push([x, y]); } }, { aktivFreigegeben: true });
  await executor.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 1001);
  assert.equal(aufrufe.length, 1);
});

test('Block-7-Abnahme: niedriges Mana erzwingt Rueckzug und fehlendes Mana blockiert fail-safe', () => {
  const niedrig = plane(spielzustand({ manaAnteil: 0.05, monsterListe: [monster('m1', 80, 0)] }));
  assert.equal(niedrig.art, 'rueckzug');
  assert.ok(niedrig.gefahrenBewertung.gruende.includes('MANA_NIEDRIG_IM_KAMPF'));

  const fehlt = plane(spielzustand({ manaAnteil: unbekannt('Mana nicht lesbar'), monsterListe: [monster('m1', 80, 0)] }));
  assert.equal(fehlt.art, 'blockiert');
  assert.equal(fehlt.aktionsAnfrage, null);
  assert.equal(fehlt.normalAktionenErlaubt, false);
});

test('Block-7-Abnahme: gestartete Sicherheitsbewegung ohne Fortschritt wird als blockiert erkannt', () => {
  const start = spielzustand({ zeit: 1000, lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const basis = erstelleKampfSicherheitsAblaufZustand(start);
  const laufend = markiereSicherheitsBewegungGestartet(start, basis, 1000);
  const spaeter = spielzustand({ nummer: 2, zeit: 4500, lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const ergebnis = planeKampfSicherheitsSchritt(spaeter, konfiguration, laufend, 4500);
  assert.equal(ergebnis.art, 'blockiert');
  assert.equal(ergebnis.meldung?.meldungsCode, 'KAMPF_RUECKZUG_BLOCKIERT');
});

test('Block-7-Abnahme: Ziel ausserhalb der aktuellen Reichweite erreicht attack nicht', async () => {
  let angriffe = 0;
  const spiel = {
    character: { real_x: 0, real_y: 0, range: 100 },
    entities: { m1: { id: 'm1', real_x: 150, real_y: 0 } },
    attack() { angriffe += 1; }
  };
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(farmAngriff());
  const schritt = steuerung.verarbeiteNaechsteAktion(10);
  const executor = new AdventureLandFarmAusfuehrung(spiel, { aktivFreigegeben: true });
  await assert.rejects(
    () => executor.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 11),
    /ausserhalb der aktuellen Angriffsreichweite/
  );
  assert.equal(angriffe, 0);
  assert.equal(steuerung.holeAktionsZustand('farm-angriff')?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Block-7-Abnahme: aktive Sicherheitsbewegung bleibt ohne explizite Freigabe gesperrt', async () => {
  const zustand = spielzustand({ lebenAnteil: 0.2, monsterListe: [monster('m1', 20, 0)] });
  const sicherheit = plane(zustand);
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(sicherheit.aktionsAnfrage);
  const schritt = steuerung.verarbeiteNaechsteAktion(1000);
  let bewegt = false;
  const executor = new AdventureLandKampfSicherheitsAusfuehrung({ move() { bewegt = true; } });
  await assert.rejects(
    () => executor.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 1001),
    /nicht ausdruecklich freigegeben/
  );
  assert.equal(bewegt, false);
});
