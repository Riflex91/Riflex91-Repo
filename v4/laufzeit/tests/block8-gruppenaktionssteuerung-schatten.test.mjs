import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { AktionsSteuerung as ProduktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  erstelleGruppenAktionsSteuerungKonfiguration,
  uebergibGruppenAktionsAnfragenAnSteuerung
} from '../../erzeugt/spiellogik/gruppen-aktionssteuerung.js';

function normal(wert) { return JSON.parse(JSON.stringify(wert)); }
function supportAnfrage() {
  return Object.freeze({
    kennung: 'gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe:aktionsanfrage',
    angefordertVon: 'gruppen-aktionsplanung',
    aktion: 'GRUPPE_UNTERSTUETZEN',
    wichtigkeit: 'normal',
    prioritaet: 500,
    angefordertAm: 10_000,
    gueltigBis: 11_500,
    benoetigteRessourcen: Object.freeze(['gruppe']),
    grund: 'Unterstuetzungsaufgabe ist fuer den normalen Gruppenbetrieb zugeordnet.',
    details: Object.freeze({ ausfuehrenderTeilnehmerKennung: 'My_Ranger2' })
  });
}
function uebersetzung() {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: 10_000,
    status: 'erzeugt',
    grund: 'Ein Kandidat.',
    eigenerTeilnehmerKennung: 'My_Ranger2',
    planStatus: 'geplant',
    eigeneSchrittKennungen: Object.freeze(['support']),
    nichtFreigegebeneSchrittKennungen: Object.freeze([]),
    aktionsAnfragen: Object.freeze([supportAnfrage()])
  });
}
async function ladeBrowserKerne() {
  const steuerungText = await readFile(new URL('../../werkzeuge/aktions-steuerung-schatten-kern.js', import.meta.url), 'utf8');
  const integrationText = await readFile(new URL('../../werkzeuge/block8-gruppenaktionssteuerung-kern.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  vm.runInContext(steuerungText, kontext);
  vm.runInContext(integrationText, kontext);
  return kontext;
}
async function ladeLiveSchatten() {
  const kontext = await ladeBrowserKerne();
  const schattenText = await readFile(new URL('../../werkzeuge/block8-gruppenaktionssteuerung-schatten.js', import.meta.url), 'utf8');
  kontext.V4Block8GruppenAktionsAnfragen = {
    async pruefe(optionen = {}) {
      return {
        ausgewertetAm: 10_000,
        lokalerCharakter: 'My_Ranger2',
        uebersetzung: optionen.aktiviert
          ? uebersetzung()
          : Object.freeze({ ...uebersetzung(), status: 'gesperrt', aktionsAnfragen: Object.freeze([]) })
      };
    }
  };
  vm.runInContext(schattenText, kontext);
  return kontext;
}

test('Block 8 Gruppen-AktionsSteuerung Browserkern bleibt zur Produktion identisch', async () => {
  const kontext = await ladeBrowserKerne();
  const BrowserSteuerung = kontext.V4AktionsSteuerungSchattenKern.AktionsSteuerung;
  const browserSteuerung = new BrowserSteuerung();
  const produktivSteuerung = new ProduktionsSteuerung();
  const browserCfg = kontext.V4Block8GruppenAktionsSteuerungKern.erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true, freigegebeneAktionen: ['GRUPPE_UNTERSTUETZEN'], verarbeiten: true
  });
  const produktivCfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true, freigegebeneAktionen: ['GRUPPE_UNTERSTUETZEN'], verarbeiten: true
  });
  const browser = kontext.V4Block8GruppenAktionsSteuerungKern.uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), browserSteuerung, 10_000, browserCfg);
  const produktiv = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), produktivSteuerung, 10_000, produktivCfg);
  assert.deepEqual(normal(browser), normal(produktiv));
});

test('Block 8 Gruppen-AktionsSteuerung Live-Schatten ist standardmaessig doppelt gesperrt', async () => {
  const kontext = await ladeLiveSchatten();
  const ergebnis = await kontext.V4Block8GruppenAktionsSteuerung.pruefe();
  assert.equal(ergebnis.anAktionsSteuerungEingereicht, false);
  assert.equal(ergebnis.aktionsSteuerungVerarbeitet, false);
  assert.equal(ergebnis.steuerungsErgebnis.eingereichteAnfrageKennungen.length, 0);
  assert.equal(ergebnis.echteSpielaktionenAusgefuehrt, false);
});

test('Block 8 Gruppen-AktionsSteuerung: Kandidat allein reicht ohne zweite Freigabe nicht ein', async () => {
  const kontext = await ladeLiveSchatten();
  const ergebnis = await kontext.V4Block8GruppenAktionsSteuerung.pruefe({
    uebersetzungAktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen']
  });
  assert.equal(ergebnis.anfragenAuswertung.uebersetzung.status, 'erzeugt');
  assert.equal(ergebnis.steuerungsErgebnis.status, 'gesperrt');
  assert.equal(ergebnis.anAktionsSteuerungEingereicht, false);
});

test('Block 8 Gruppen-AktionsSteuerung: explizite Einreichung ohne Verarbeitung bleibt wartend', async () => {
  const kontext = await ladeLiveSchatten();
  kontext.V4Block8GruppenAktionsSteuerung.setzeSteuerungZurueck();
  const ergebnis = await kontext.V4Block8GruppenAktionsSteuerung.pruefe({
    uebersetzungAktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen'],
    einreichungAktiviert: true,
    freigegebeneAktionen: ['GRUPPE_UNTERSTUETZEN'],
    verarbeiten: false
  });
  assert.equal(ergebnis.steuerungsErgebnis.status, 'eingereiht');
  assert.equal(ergebnis.anAktionsSteuerungEingereicht, true);
  assert.equal(ergebnis.aktionsSteuerungVerarbeitet, false);
  assert.equal(ergebnis.steuerungsErgebnis.laufZustaende[0]?.phase, 'wartend');
  assert.equal(ergebnis.steuerungsErgebnis.schattenEintraege.length, 0);
});

test('Block 8 Gruppen-AktionsSteuerung: explizite Verarbeitung startet nur zentralen Schatten', async () => {
  const kontext = await ladeLiveSchatten();
  kontext.V4Block8GruppenAktionsSteuerung.setzeSteuerungZurueck();
  const ergebnis = await kontext.V4Block8GruppenAktionsSteuerung.pruefe({
    uebersetzungAktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen'],
    einreichungAktiviert: true,
    freigegebeneAktionen: ['GRUPPE_UNTERSTUETZEN'],
    verarbeiten: true
  });
  assert.equal(ergebnis.steuerungsErgebnis.status, 'verarbeitet');
  assert.equal(ergebnis.anAktionsSteuerungEingereicht, true);
  assert.equal(ergebnis.aktionsSteuerungVerarbeitet, true);
  assert.equal(ergebnis.steuerungsErgebnis.verarbeitung?.art, 'gestartet');
  assert.equal(ergebnis.steuerungsErgebnis.schattenEintraege.length, 1);
  assert.equal(ergebnis.steuerungsErgebnis.schattenEintraege[0]?.aktion, 'GRUPPE_UNTERSTUETZEN');
  assert.deepEqual(normal(ergebnis.steuerungsErgebnis.laufZustaende[0]?.anfrage.benoetigteRessourcen), ['gruppe']);
  assert.equal(ergebnis.echteSpielaktionenAusgefuehrt, false);
});
