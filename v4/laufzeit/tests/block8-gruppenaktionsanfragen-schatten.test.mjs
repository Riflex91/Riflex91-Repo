import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  erstelleGruppenAktionsAnfrageKonfiguration,
  uebersetzeEigeneGruppenPlanSchritte
} from '../../erzeugt/spiellogik/gruppen-aktionsanfragen.js';

function normal(wert) {
  return JSON.parse(JSON.stringify(wert));
}

function supportSchritt() {
  return Object.freeze({
    kennung: 'gruppenplan:20000:gruppe_unterstuetzen:My_Ranger2:gruppe',
    art: 'gruppe_unterstuetzen',
    faehigkeit: 'unterstuetzung',
    ausfuehrenderTeilnehmerKennung: 'My_Ranger2',
    zielArt: 'gruppe',
    zielKennung: null,
    wichtigkeit: 'normal',
    prioritaet: 500,
    benoetigteRessourcen: Object.freeze(['gruppe']),
    grund: 'Unterstuetzungsaufgabe ist fuer den normalen Gruppenbetrieb zugeordnet.'
  });
}

function plan(schritte = [supportSchritt()], aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: 20_000,
    status: 'geplant',
    grund: 'Deterministischer Gruppenplan.',
    betriebsArt: 'normal',
    gemeinsameGefahrenStufe: 'sicher',
    gemeinsamesZielKennung: null,
    schritte: Object.freeze([...schritte]),
    ...aenderungen
  });
}

async function ladeKern() {
  const quelltext = await readFile(new URL('../../werkzeuge/block8-gruppenaktionsanfragen-kern.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  vm.runInContext(quelltext, kontext);
  return kontext.V4Block8GruppenAktionsAnfragenKern;
}

async function ladeSchatten(gruppenPlan = plan()) {
  const kernText = await readFile(new URL('../../werkzeuge/block8-gruppenaktionsanfragen-kern.js', import.meta.url), 'utf8');
  const schattenText = await readFile(new URL('../../werkzeuge/block8-gruppenaktionsanfragen-schatten.js', import.meta.url), 'utf8');
  let pruefungen = 0;
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  kontext.V4Block8GruppenAktionsplanung = {
    async pruefe() {
      pruefungen += 1;
      return {
        ausgewertetAm: gruppenPlan.zeitpunkt,
        lokalerCharakter: 'My_Ranger2',
        plan: gruppenPlan,
        planSignatur: gruppenPlan.schritte.map((schritt) => `${schritt.art}|${schritt.ausfuehrenderTeilnehmerKennung}`)
      };
    },
    status() { return {}; }
  };
  vm.runInContext(kernText, kontext);
  vm.runInContext(schattenText, kontext);
  return { kontext, pruefungen: () => pruefungen };
}

test('Block 8 Gruppenaktionsanfrage-Schatten: Browserkern bleibt fuer Lock, Freigabe, Whitelist und Blockierung identisch zur Produktion', async () => {
  const browser = await ladeKern();
  const faelle = [
    { plan: plan(), eigener: 'My_Ranger2', cfg: {} },
    { plan: plan(), eigener: 'My_Ranger2', cfg: { aktiviert: true, freigegebeneArten: ['gruppe_unterstuetzen'] } },
    { plan: plan(), eigener: 'My_Ranger2', cfg: { aktiviert: true, freigegebeneArten: ['mitglied_heilen'] } },
    { plan: plan([], { status: 'blockiert', grund: 'Fail-safe.' }), eigener: 'My_Ranger2', cfg: { aktiviert: true, freigegebeneArten: ['gruppe_unterstuetzen'] } },
    { plan: plan(), eigener: 'My_Ranger1', cfg: { aktiviert: true, freigegebeneArten: ['gruppe_unterstuetzen'] } }
  ];

  for (const fall of faelle) {
    const produktivCfg = erstelleGruppenAktionsAnfrageKonfiguration(fall.cfg);
    const browserCfg = browser.erstelleGruppenAktionsAnfrageKonfiguration(fall.cfg);
    const produktiv = uebersetzeEigeneGruppenPlanSchritte(fall.plan, fall.eigener, produktivCfg);
    const imBrowser = browser.uebersetzeEigeneGruppenPlanSchritte(fall.plan, fall.eigener, browserCfg);
    assert.deepEqual(normal(imBrowser), normal(produktiv));
  }
});

test('Block 8 Gruppenaktionsanfrage-Schatten: Standardaufruf bleibt gesperrt und reicht nichts ein', async () => {
  const lauf = await ladeSchatten();
  const ergebnis = await lauf.kontext.V4Block8GruppenAktionsAnfragen.pruefe();
  assert.equal(lauf.pruefungen(), 1);
  assert.equal(ergebnis.uebersetzung.status, 'gesperrt');
  assert.equal(ergebnis.uebersetzung.aktionsAnfragen.length, 0);
  assert.equal(ergebnis.bereitFuerAktionsSteuerung, false);
  assert.equal(ergebnis.anAktionsSteuerungEingereicht, false);
  assert.equal(ergebnis.aktionsSteuerungVerarbeitet, false);
  assert.equal(ergebnis.echteSpielaktionenAusgefuehrt, false);
});

test('Block 8 Gruppenaktionsanfrage-Schatten: explizite Support-Freigabe erzeugt nur Kandidat und reicht ihn nicht ein', async () => {
  const lauf = await ladeSchatten();
  const ergebnis = await lauf.kontext.V4Block8GruppenAktionsAnfragen.pruefe({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen']
  });
  assert.equal(ergebnis.uebersetzung.status, 'erzeugt');
  assert.equal(ergebnis.uebersetzung.aktionsAnfragen.length, 1);
  assert.equal(ergebnis.uebersetzung.aktionsAnfragen[0].aktion, 'GRUPPE_UNTERSTUETZEN');
  assert.equal(ergebnis.bereitFuerAktionsSteuerung, true);
  assert.equal(ergebnis.anAktionsSteuerungEingereicht, false);
  assert.equal(ergebnis.aktionsSteuerungVerarbeitet, false);
  assert.equal(ergebnis.echteSpielaktionenAusgefuehrt, false);
});

test('Block 8 Gruppenaktionsanfrage-Schatten: fremder Schritt bleibt auch bei Freigabe lokal leer', async () => {
  const fremd = supportSchritt();
  const lauf = await ladeSchatten(plan([Object.freeze({ ...fremd, ausfuehrenderTeilnehmerKennung: 'My_Ranger1' })]));
  const ergebnis = await lauf.kontext.V4Block8GruppenAktionsAnfragen.pruefe({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen']
  });
  assert.equal(ergebnis.uebersetzung.status, 'leer');
  assert.equal(ergebnis.uebersetzung.aktionsAnfragen.length, 0);
  assert.equal(ergebnis.bereitFuerAktionsSteuerung, false);
});
