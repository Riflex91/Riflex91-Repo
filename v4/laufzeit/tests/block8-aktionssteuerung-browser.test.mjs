import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { AktionsSteuerung as ProduktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { LaufzeitSteuerung as ProduktionsLaufzeitSteuerung } from '../../erzeugt/kern/laufzeit-steuerung.js';

function normal(wert) { return JSON.parse(JSON.stringify(wert)); }
function anfrage(kennung, aenderungen = {}) {
  return Object.freeze({
    kennung,
    angefordertVon: 'browser-paritaet',
    aktion: 'TEST',
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: 1_000,
    gueltigBis: 2_500,
    benoetigteRessourcen: Object.freeze(['gruppe']),
    grund: 'Paritaetstest.',
    details: Object.freeze({ kennung }),
    ...aenderungen
  });
}
async function browserApi() {
  const text = await readFile(new URL('../../werkzeuge/aktions-steuerung-schatten-kern.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  vm.runInContext(text, kontext);
  return kontext.V4AktionsSteuerungSchattenKern;
}
async function browserKlasse() {
  return (await browserApi()).AktionsSteuerung;
}
function snapshot(steuerung) {
  return normal({
    zustaende: steuerung.listeAktionsZustaende(),
    ressourcen: steuerung.listeRessourcenSperren(),
    schatten: steuerung.listeSchattenProtokoll()
  });
}

test('Block 8 Browser-AktionsSteuerung: Einzelstart bleibt semantisch identisch zur Produktion', async () => {
  const BrowserSteuerung = await browserKlasse();
  const produktiv = new ProduktionsSteuerung();
  const browser = new BrowserSteuerung();
  const a = anfrage('einzel');
  produktiv.reicheAnfrageEin(a); browser.reicheAnfrageEin(a);
  assert.deepEqual(normal(browser.verarbeiteNaechsteAktion(1_000)), normal(produktiv.verarbeiteNaechsteAktion(1_000)));
  assert.deepEqual(snapshot(browser), snapshot(produktiv));
});

test('Block 8 Browser-AktionsSteuerung: Ablauf bleibt semantisch identisch zur Produktion', async () => {
  const BrowserSteuerung = await browserKlasse();
  const produktiv = new ProduktionsSteuerung();
  const browser = new BrowserSteuerung();
  const a = anfrage('ablauf', { gueltigBis: 1_100 });
  produktiv.reicheAnfrageEin(a); browser.reicheAnfrageEin(a);
  assert.deepEqual(normal(browser.verarbeiteNaechsteAktion(1_100)), normal(produktiv.verarbeiteNaechsteAktion(1_100)));
  assert.deepEqual(snapshot(browser), snapshot(produktiv));
});

test('Block 8 Browser-AktionsSteuerung: Ressourcenblockierung bleibt semantisch identisch', async () => {
  const BrowserSteuerung = await browserKlasse();
  const produktiv = new ProduktionsSteuerung();
  const browser = new BrowserSteuerung();
  const a = anfrage('a', { prioritaet: 500 });
  const b = anfrage('b', { prioritaet: 400, angefordertAm: 1_001 });
  for (const s of [produktiv, browser]) { s.reicheAnfrageEin(a); s.reicheAnfrageEin(b); }
  produktiv.verarbeiteNaechsteAktion(1_001); browser.verarbeiteNaechsteAktion(1_001);
  assert.deepEqual(normal(browser.verarbeiteNaechsteAktion(1_002)), normal(produktiv.verarbeiteNaechsteAktion(1_002)));
  assert.deepEqual(snapshot(browser), snapshot(produktiv));
});

test('Block 8 Browser-AktionsSteuerung: wichtigere Anfrage unterbricht identisch', async () => {
  const BrowserSteuerung = await browserKlasse();
  const produktiv = new ProduktionsSteuerung();
  const browser = new BrowserSteuerung();
  const normalAnfrage = anfrage('normal', { prioritaet: 500 });
  const sicherheit = anfrage('sicherheit', { wichtigkeit: 'sicherheit', prioritaet: 100, angefordertAm: 1_010 });
  for (const s of [produktiv, browser]) { s.reicheAnfrageEin(normalAnfrage); s.verarbeiteNaechsteAktion(1_000); s.reicheAnfrageEin(sicherheit); }
  assert.deepEqual(normal(browser.verarbeiteNaechsteAktion(1_010)), normal(produktiv.verarbeiteNaechsteAktion(1_010)));
  assert.deepEqual(snapshot(browser), snapshot(produktiv));
});


test('Block 8 Browser-AktionsSteuerung: Laufzeit-Pause bleibt semantisch identisch zur Produktion', async () => {
  const BrowserApi = await browserApi();
  const produktivLaufzeit = new ProduktionsLaufzeitSteuerung();
  const browserLaufzeit = new BrowserApi.LaufzeitSteuerung();
  const produktiv = new ProduktionsSteuerung({ laufzeitSteuerung: produktivLaufzeit });
  const browser = new BrowserApi.AktionsSteuerung({ laufzeitSteuerung: browserLaufzeit });

  const normalAnfrage = anfrage('pause-normal', { prioritaet: 500 });
  for (const steuerung of [produktiv, browser]) {
    steuerung.reicheAnfrageEin(normalAnfrage);
    steuerung.verarbeiteNaechsteAktion(1_000);
  }

  produktivLaufzeit.pausiere(1_100, 'Paritaets-Pause.');
  browserLaufzeit.pausiere(1_100, 'Paritaets-Pause.');

  assert.deepEqual(
    normal(browser.brecheNormaleArbeitFuerPauseAb(1_100)),
    normal(produktiv.brecheNormaleArbeitFuerPauseAb(1_100))
  );
  assert.deepEqual(normal(browser.laufzeitStatus()), normal(produktiv.laufzeitStatus()));
  assert.deepEqual(snapshot(browser), snapshot(produktiv));

  const waehrendPause = anfrage('pause-neu', {
    angefordertAm: 1_200,
    gueltigBis: 2_700
  });
  assert.deepEqual(
    normal(browser.reicheAnfrageEin(waehrendPause)),
    normal(produktiv.reicheAnfrageEin(waehrendPause))
  );

  const safety = anfrage('pause-safety', {
    wichtigkeit: 'sicherheit',
    prioritaet: 900,
    angefordertAm: 1_210,
    gueltigBis: 2_710,
    benoetigteRessourcen: Object.freeze(['bewegung'])
  });
  assert.deepEqual(
    normal(browser.reicheAnfrageEin(safety)),
    normal(produktiv.reicheAnfrageEin(safety))
  );
  assert.deepEqual(
    normal(browser.verarbeiteNaechsteAktion(1_210)),
    normal(produktiv.verarbeiteNaechsteAktion(1_210))
  );
  assert.deepEqual(snapshot(browser), snapshot(produktiv));

  produktivLaufzeit.setzeFort(1_300, 'Paritaets-Fortsetzung.');
  browserLaufzeit.setzeFort(1_300, 'Paritaets-Fortsetzung.');
  assert.deepEqual(normal(browser.laufzeitStatus()), normal(produktiv.laufzeitStatus()));
  assert.equal(browser.holeAktionsZustand('pause-neu')?.phase, 'abgebrochen');
  assert.equal(produktiv.holeAktionsZustand('pause-neu')?.phase, 'abgebrochen');
});
