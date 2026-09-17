import test from 'node:test';
import assert from 'node:assert/strict';
import { erstelleGruppenTeilnehmerMeldungAusSpielzustand } from '../../erzeugt/spiellogik/gruppen-lebensnachweis.js';
import { AdventureLandGruppenLebensnachweisAustausch } from '../../erzeugt/ausfuehrung/adventure-land-gruppen-lebensnachweis-austausch.js';
import { GRUPPEN_LEBENSNACHWEIS_PROTOKOLL } from '../../erzeugt/vertraege/gruppen-lebensnachweis.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 10_000, wert });
const fehlend = (grund = 'fehlt') => ({ zustand: 'fehlend', quelle: 'beobachtet', grund });
const unbekannt = (grund = 'unbekannt') => ({ zustand: 'unbekannt', quelle: 'beobachtet', grund });

function charakter(aenderungen = {}) {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('My_Ranger1'),
    klasse: bekannt('ranger'),
    leben: bekannt(750),
    lebenMaximal: bekannt(1000),
    mana: bekannt(400),
    manaMaximal: bekannt(800),
    karte: bekannt('main'),
    instanz: bekannt('main'),
    ziel: bekannt('m1'),
    tot: bekannt(false),
    ...aenderungen
  };
}

function spielzustand(aenderungen = {}) {
  return {
    schemaVersion: 2,
    laufendeNummer: 17,
    aufgenommenAm: 10_000,
    ablaufKennung: 'block8-live',
    beobachtet: {
      server: { region: bekannt('EU'), kennung: bekannt('I') },
      charakter: bekannt(charakter()),
      ...aenderungen.beobachtet
    },
    abgeleitet: {},
    gelernt: [],
    ...Object.fromEntries(Object.entries(aenderungen).filter(([schluessel]) => schluessel !== 'beobachtet'))
  };
}

const faehigkeiten = Object.freeze({ heilen: 0.1, schaden: 0.9, aggro: 0.2, schutz: 0.3, unterstuetzung: 0.4 });

function erstelleMeldung(zustand = spielzustand()) {
  const ergebnis = erstelleGruppenTeilnehmerMeldungAusSpielzustand(zustand, { gefahrenStufe: 'sicher', faehigkeiten });
  assert.equal(ergebnis.status, 'bereit');
  assert.ok(ergebnis.meldung);
  return ergebnis.meldung;
}

test('Block 8 Lebensnachweis: reale Spielzustandsfelder werden ohne versteckte Uhrzeit in eine Teilnehmermeldung ueberfuehrt', () => {
  const ergebnis = erstelleGruppenTeilnehmerMeldungAusSpielzustand(spielzustand(), { gefahrenStufe: 'angespannt', faehigkeiten });
  assert.equal(ergebnis.status, 'bereit');
  assert.deepEqual(ergebnis.gruende, []);
  assert.equal(ergebnis.meldung.charakterKennung, 'char-1');
  assert.equal(ergebnis.meldung.charakterName, 'My_Ranger1');
  assert.equal(ergebnis.meldung.serverRegion, 'EU');
  assert.equal(ergebnis.meldung.serverKennung, 'I');
  assert.equal(ergebnis.meldung.karte, 'main');
  assert.equal(ergebnis.meldung.instanz, 'main');
  assert.equal(ergebnis.meldung.lebendig, true);
  assert.equal(ergebnis.meldung.lebensAnteil, 0.75);
  assert.equal(ergebnis.meldung.manaAnteil, 0.5);
  assert.equal(ergebnis.meldung.zielKennung, 'm1');
  assert.equal(ergebnis.meldung.gefahrenStufe, 'angespannt');
  assert.equal(ergebnis.meldung.gesendetAm, 10_000);
  assert.equal(ergebnis.meldung.laufendeNummer, 17);
});

test('Block 8 Lebensnachweis: fehlende Identitaets- oder Weltfelder blockieren statt Werte zu raten', () => {
  const zustand = spielzustand({ beobachtet: { server: { region: bekannt('EU'), kennung: fehlend('server fehlt') }, charakter: bekannt(charakter()) } });
  const ergebnis = erstelleGruppenTeilnehmerMeldungAusSpielzustand(zustand, { gefahrenStufe: 'sicher', faehigkeiten });
  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(ergebnis.meldung, null);
  assert.ok(ergebnis.gruende.some((grund) => grund.includes('Serverkennung')));
});

test('Block 8 Lebensnachweis: unbekannte HP und MP bleiben explizit null und blockieren Identitaet nicht', () => {
  const zustand = spielzustand({ beobachtet: { server: { region: bekannt('EU'), kennung: bekannt('I') }, charakter: bekannt(charakter({ leben: unbekannt(), mana: fehlend() })) } });
  const ergebnis = erstelleGruppenTeilnehmerMeldungAusSpielzustand(zustand, { gefahrenStufe: 'sicher', faehigkeiten });
  assert.equal(ergebnis.status, 'bereit');
  assert.equal(ergebnis.meldung.lebensAnteil, null);
  assert.equal(ergebnis.meldung.manaAnteil, null);
});

test('Block 8 Lebensnachweis: unplausible Faehigkeitswerte werden nicht ausgesendet', () => {
  const ergebnis = erstelleGruppenTeilnehmerMeldungAusSpielzustand(spielzustand(), {
    gefahrenStufe: 'sicher',
    faehigkeiten: { ...faehigkeiten, schaden: 1.5 }
  });
  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(ergebnis.meldung, null);
});

test('Block 8 Austausch: Senden ist standardmaessig gesperrt', async () => {
  let gesendet = 0;
  const spiel = { character: { name: 'My_Ranger1' }, send_cm() { gesendet += 1; } };
  const austausch = new AdventureLandGruppenLebensnachweisAustausch(spiel, {
    vertrauensNamen: ['My_Ranger1', 'My_Priest1'],
    jetzt: () => 11_000
  });
  const ergebnis = await austausch.sendeLebensnachweis('My_Priest1', erstelleMeldung());
  assert.equal(ergebnis.gesendet, false);
  assert.equal(gesendet, 0);
});

test('Block 8 Austausch: freigegebener Lebensnachweis geht genau an einen vertrauten Namen und nutzt nur send_cm', async () => {
  const aufrufe = [];
  const spiel = {
    character: { name: 'My_Ranger1' },
    send_cm(name, daten) { aufrufe.push({ name, daten }); return true; }
  };
  const austausch = new AdventureLandGruppenLebensnachweisAustausch(spiel, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Priest1'],
    jetzt: () => 11_000
  });
  const ergebnis = await austausch.sendeLebensnachweis('My_Priest1', erstelleMeldung());
  assert.equal(ergebnis.gesendet, true);
  assert.equal(aufrufe.length, 1);
  assert.equal(aufrufe[0].name, 'My_Priest1');
  assert.equal(aufrufe[0].daten.protokoll, GRUPPEN_LEBENSNACHWEIS_PROTOKOLL);
  assert.equal(aufrufe[0].daten.absenderName, 'My_Ranger1');
});

test('Block 8 Austausch: nicht vertraute Ziele werden vor send_cm blockiert', async () => {
  let gesendet = false;
  const spiel = { character: { name: 'My_Ranger1' }, send_cm() { gesendet = true; } };
  const austausch = new AdventureLandGruppenLebensnachweisAustausch(spiel, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Priest1'],
    jetzt: () => 11_000
  });
  const ergebnis = await austausch.sendeLebensnachweis('FremderSpieler', erstelleMeldung());
  assert.equal(ergebnis.gesendet, false);
  assert.equal(gesendet, false);
});

test('Block 8 Austausch: Empfang akzeptiert nur vertraute, namensgebundene V4-Umschlaege und erhaelt fremde on_cm-Nachrichten', () => {
  const weitergereicht = [];
  const empfangen = [];
  const spiel = {
    character: { name: 'My_Ranger1' },
    on_cm(absender, daten) { weitergereicht.push({ absender, daten }); return 'alt'; }
  };
  const austausch = new AdventureLandGruppenLebensnachweisAustausch(spiel, {
    vertrauensNamen: ['My_Ranger1', 'My_Priest1'],
    jetzt: () => 12_345
  });
  assert.equal(austausch.installiereEmpfang((wert) => empfangen.push(wert)), true);

  assert.equal(spiel.on_cm('Irgendwer', { hallo: true }), 'alt');
  assert.equal(weitergereicht.length, 1);

  const meldung = { ...erstelleMeldung(), charakterKennung: 'priest-1', charakterName: 'My_Priest1' };
  const umschlag = { schemaVersion: 1, protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL, absenderName: 'My_Priest1', meldung };
  assert.equal(spiel.on_cm('My_Priest1', umschlag), true);
  assert.equal(empfangen.length, 1);
  assert.equal(empfangen[0].absenderName, 'My_Priest1');
  assert.equal(empfangen[0].empfangenAm, 12_345);

  const gefaelscht = { ...umschlag, absenderName: 'My_Ranger1' };
  assert.equal(spiel.on_cm('My_Priest1', gefaelscht), false);
  assert.equal(empfangen.length, 1);

  assert.equal(austausch.entferneEmpfang(), true);
  assert.equal(spiel.on_cm('Irgendwer', { danach: true }), 'alt');
});

test('Block 8 Austausch: Parent-send_cm wird genutzt waehrend on_cm im lokalen Codekontext bleibt', async () => {
  const gesendet = [];
  const empfangen = [];
  const parentOnCm = () => 'parent-darf-unveraendert-bleiben';
  const parent = {
    send_cm(name, daten) { gesendet.push({ name, daten, kontext: this }); return true; },
    on_cm: parentOnCm
  };
  const lokal = {
    character: { name: 'My_Ranger1' },
    parent,
    on_cm() { return 'lokal-alt'; }
  };
  const austausch = new AdventureLandGruppenLebensnachweisAustausch(lokal, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    jetzt: () => 20_000
  });

  assert.equal(austausch.installiereEmpfang((wert) => empfangen.push(wert)), true);
  assert.equal(parent.on_cm, parentOnCm);
  assert.notEqual(lokal.on_cm, parentOnCm);

  const sendeErgebnis = await austausch.sendeLebensnachweis('My_Ranger2', erstelleMeldung());
  assert.equal(sendeErgebnis.gesendet, true);
  assert.equal(gesendet.length, 1);
  assert.equal(gesendet[0].name, 'My_Ranger2');
  assert.equal(gesendet[0].kontext, parent);

  const meldung = { ...erstelleMeldung(), charakterKennung: 'ranger-2', charakterName: 'My_Ranger2' };
  const umschlag = { schemaVersion: 1, protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL, absenderName: 'My_Ranger2', meldung };
  assert.equal(lokal.on_cm('My_Ranger2', umschlag), true);
  assert.equal(empfangen.length, 1);
  assert.equal(empfangen[0].absenderName, 'My_Ranger2');
  assert.equal(parent.on_cm, parentOnCm);
});
