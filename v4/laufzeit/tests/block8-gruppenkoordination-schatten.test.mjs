import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { koordiniereGruppe, erstelleGruppenKoordinationsKonfiguration } from '../../erzeugt/spiellogik/gruppen-koordination.js';

const jetzt = 20_000;
const konfiguration = erstelleGruppenKoordinationsKonfiguration({ lebensnachweisMaximalAlterMillisekunden: 5_000 });

function meldung(name, aenderungen = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: name,
    charakterName: name,
    klasse: 'ranger',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 1,
    manaAnteil: 1,
    zielKennung: null,
    gefahrenStufe: 'sicher',
    faehigkeiten: { heilen: 0, schaden: 0, aggro: 0, schutz: 0, unterstuetzung: 0 },
    gesendetAm: 19_500,
    laufendeNummer: 1,
    ...aenderungen
  };
}

async function ladeBrowserKern() {
  const quelltext = await readFile(new URL('../../werkzeuge/block8-gruppenkoordination-kern.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  vm.runInContext(quelltext, kontext);
  return kontext.V4Block8GruppenKoordinationKern;
}

function normal(wert) {
  return JSON.parse(JSON.stringify(wert));
}

test('Block 8 Koordinationsschatten: Browserkern bleibt fuer Aktiv, Stale, Reconnect und Safety identisch zur produktiven koordiniereGruppe', async () => {
  const browser = await ladeBrowserKern();
  const ranger1 = meldung('My_Ranger1', { faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 } });
  const basisRanger2 = { faehigkeiten: { heilen: 0, schaden: 0.7, aggro: 0, schutz: 0, unterstuetzung: 1 } };
  const faelle = [
    [ranger1, meldung('My_Ranger2', basisRanger2)],
    [ranger1, meldung('My_Ranger2', { ...basisRanger2, gesendetAm: 13_000 })],
    [ranger1, meldung('My_Ranger2', { ...basisRanger2, gesendetAm: 19_900, laufendeNummer: 2 })],
    [ranger1, meldung('My_Ranger2', { ...basisRanger2, gefahrenStufe: 'gefaehrlich' })],
    [ranger1, meldung('My_Ranger2', { ...basisRanger2, gefahrenStufe: 'unbekannt' })],
    [ranger1, meldung('My_Ranger2', { ...basisRanger2, serverKennung: 'II' })],
    [ranger1, meldung('My_Ranger2', { ...basisRanger2, lebendig: false })]
  ];

  for (const meldungen of faelle) {
    const produktiv = koordiniereGruppe(meldungen, 'My_Ranger1', jetzt, konfiguration);
    const imBrowser = browser.koordiniereGruppe(meldungen, 'My_Ranger1', jetzt, browser.erstelleGruppenKoordinationsKonfiguration({ lebensnachweisMaximalAlterMillisekunden: 5_000 }));
    assert.deepEqual(normal(imBrowser), normal(produktiv));
  }
});

test('Block 8 Koordinationsschatten: veralteter Teilnehmer verliert seine Aufgabe und frischer Reconnect erhaelt sie zurueck', async () => {
  const browser = await ladeBrowserKern();
  const ranger1 = meldung('My_Ranger1', { faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 } });
  const frisch = meldung('My_Ranger2', { faehigkeiten: { heilen: 0, schaden: 0.7, aggro: 0, schutz: 0, unterstuetzung: 1 } });
  const veraltet = { ...frisch, gesendetAm: 13_000 };
  const reconnect = { ...frisch, gesendetAm: 19_950, laufendeNummer: 2 };
  const cfg = browser.erstelleGruppenKoordinationsKonfiguration({ lebensnachweisMaximalAlterMillisekunden: 5_000 });

  const aktiv = browser.koordiniereGruppe([ranger1, frisch], 'My_Ranger1', jetzt, cfg);
  assert.equal(aktiv.aufgaben.unterstuetzung, 'My_Ranger2');
  assert.deepEqual(normal(aktiv.aktiveTeilnehmerKennungen), ['My_Ranger1', 'My_Ranger2']);

  const stale = browser.koordiniereGruppe([ranger1, veraltet], 'My_Ranger1', jetzt, cfg);
  assert.equal(stale.teilnehmerBewertungen.find((x) => x.charakterKennung === 'My_Ranger2')?.status, 'veraltet');
  assert.equal(stale.aufgaben.unterstuetzung, null);
  assert.deepEqual(normal(stale.aktiveTeilnehmerKennungen), ['My_Ranger1']);

  const zurueck = browser.koordiniereGruppe([ranger1, reconnect], 'My_Ranger1', jetzt, cfg);
  assert.equal(zurueck.teilnehmerBewertungen.find((x) => x.charakterKennung === 'My_Ranger2')?.status, 'aktiv');
  assert.equal(zurueck.aufgaben.unterstuetzung, 'My_Ranger2');
});

test('Block 8 Koordinationsschatten: Live-Werkzeug fuehrt nur Lebensnachweis-Kommunikation und die Koordinationsauswertung aus', async () => {
  const kernText = await readFile(new URL('../../werkzeuge/block8-gruppenkoordination-kern.js', import.meta.url), 'utf8');
  const schattenText = await readFile(new URL('../../werkzeuge/block8-gruppenkoordination-schatten.js', import.meta.url), 'utf8');
  let sendeschritte = 0;
  const eigener = meldung('My_Ranger1', { gesendetAm: jetzt, faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 } });
  const remote = meldung('My_Ranger2', { gesendetAm: jetzt - 100, faehigkeiten: { heilen: 0, schaden: 0.7, aggro: 0, schutz: 0, unterstuetzung: 1 } });
  const FakeDate = class extends Date { static now() { return jetzt; } };
  const kontext = vm.createContext({ console, Date: FakeDate });
  kontext.globalThis = kontext;
  kontext.V4Block8Lebensnachweis = {
    status() { return { aktiv: true, version: '1.0.1', gesendet: sendeschritte, empfangen: 3, verworfen: 0, kommunikation: 'send_cm', teilnehmer: [{ meldung: remote }] }; },
    async sendeEinmal() { sendeschritte += 1; return { meldung: eigener }; }
  };
  vm.runInContext(kernText, kontext);
  vm.runInContext(schattenText, kontext);

  const ergebnis = await kontext.V4Block8Gruppenkoordination.pruefe();
  assert.equal(sendeschritte, 1);
  assert.equal(ergebnis.echteSpielaktionenAusgefuehrt, false);
  assert.equal(ergebnis.entscheidung.aufgaben.schaden, 'My_Ranger1');
  assert.equal(ergebnis.entscheidung.aufgaben.unterstuetzung, 'My_Ranger2');
});
