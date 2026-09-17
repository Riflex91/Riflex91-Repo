import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { koordiniereGruppe } from '../../erzeugt/spiellogik/gruppen-koordination.js';
import {
  eigeneGruppenPlanSchritte,
  erstelleGruppenAktionsPlanKonfiguration,
  planeGruppenAktionen
} from '../../erzeugt/spiellogik/gruppen-aktionsplanung.js';

const jetzt = 20_000;

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

function normal(wert) {
  return JSON.parse(JSON.stringify(wert));
}

async function ladePlanungsKern() {
  const quelltext = await readFile(new URL('../../werkzeuge/block8-gruppenaktionsplanung-kern.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  vm.runInContext(quelltext, kontext);
  return kontext.V4Block8GruppenAktionsPlanungKern;
}

async function ladeGesamtenSchatten({ eigeneMeldung, remoteMeldung }) {
  const koordinationsKernText = await readFile(new URL('../../werkzeuge/block8-gruppenkoordination-kern.js', import.meta.url), 'utf8');
  const koordinationsSchattenText = await readFile(new URL('../../werkzeuge/block8-gruppenkoordination-schatten.js', import.meta.url), 'utf8');
  const planungsKernText = await readFile(new URL('../../werkzeuge/block8-gruppenaktionsplanung-kern.js', import.meta.url), 'utf8');
  const planungsSchattenText = await readFile(new URL('../../werkzeuge/block8-gruppenaktionsplanung-schatten.js', import.meta.url), 'utf8');

  let sendeschritte = 0;
  let remote = remoteMeldung;
  const FakeDate = class extends Date { static now() { return jetzt; } };
  const kontext = vm.createContext({ console, Date: FakeDate });
  kontext.globalThis = kontext;
  kontext.V4Block8Lebensnachweis = {
    status() {
      return {
        aktiv: true,
        version: '1.1.0',
        gesendet: sendeschritte,
        empfangen: 3,
        verworfen: 0,
        kommunikation: 'send_cm',
        teilnehmer: [{ meldung: remote }]
      };
    },
    async sendeEinmal() {
      sendeschritte += 1;
      return { meldung: { ...eigeneMeldung, gesendetAm: jetzt, laufendeNummer: sendeschritte } };
    }
  };

  vm.runInContext(koordinationsKernText, kontext);
  vm.runInContext(koordinationsSchattenText, kontext);
  vm.runInContext(planungsKernText, kontext);
  vm.runInContext(planungsSchattenText, kontext);

  return {
    kontext,
    setzeRemote(meldungNeu) { remote = meldungNeu; },
    sendeschritte() { return sendeschritte; }
  };
}

test('Block 8 Gruppenaktionsschatten: Browserkern bleibt fuer Normal, Safety, Blockierung und Stale identisch zur produktiven Planung', async () => {
  const browser = await ladePlanungsKern();
  const produktivKonfiguration = erstelleGruppenAktionsPlanKonfiguration();
  const browserKonfiguration = browser.erstelleGruppenAktionsPlanKonfiguration();

  const basisRanger1 = meldung('My_Ranger1', {
    zielKennung: 'goo-1',
    lebensAnteil: 0.45,
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
  });
  const basisRanger2 = meldung('My_Ranger2', {
    zielKennung: 'goo-1',
    faehigkeiten: { heilen: 1, schaden: 0.7, aggro: 0.8, schutz: 1, unterstuetzung: 1 }
  });
  const faelle = [
    [basisRanger1, basisRanger2],
    [{ ...basisRanger1, gefahrenStufe: 'kritisch' }, basisRanger2],
    [{ ...basisRanger1, gefahrenStufe: 'unbekannt' }, basisRanger2],
    [basisRanger1, { ...basisRanger2, gesendetAm: 13_000 }]
  ];

  for (const meldungen of faelle) {
    const entscheidung = koordiniereGruppe(meldungen, 'My_Ranger1', jetzt);
    const produktiv = planeGruppenAktionen(meldungen, entscheidung, produktivKonfiguration);
    const imBrowser = browser.planeGruppenAktionen(meldungen, entscheidung, browserKonfiguration);
    assert.deepEqual(normal(imBrowser), normal(produktiv));
    assert.deepEqual(
      normal(browser.eigeneGruppenPlanSchritte(imBrowser, 'My_Ranger1')),
      normal(eigeneGruppenPlanSchritte(produktiv, 'My_Ranger1'))
    );
  }
});

test('Block 8 Gruppenaktionsschatten: beide Ranger erhalten aus demselben Snapshot denselben Gruppenplan und nur unterschiedliche eigene Schritte', async () => {
  const browser = await ladePlanungsKern();
  const meldungen = [
    meldung('My_Ranger1', {
      zielKennung: 'goo-1',
      faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
    }),
    meldung('My_Ranger2', {
      lebensAnteil: 0.6,
      zielKennung: 'goo-1',
      faehigkeiten: { heilen: 1, schaden: 0.7, aggro: 0, schutz: 0, unterstuetzung: 1 }
    })
  ];
  const cfg = browser.erstelleGruppenAktionsPlanKonfiguration();
  const entscheidung1 = koordiniereGruppe(meldungen, 'My_Ranger1', jetzt);
  const entscheidung2 = koordiniereGruppe(meldungen, 'My_Ranger2', jetzt);
  const plan1 = browser.planeGruppenAktionen(meldungen, entscheidung1, cfg);
  const plan2 = browser.planeGruppenAktionen(meldungen, entscheidung2, cfg);

  assert.deepEqual(normal(plan1), normal(plan2));
  assert.deepEqual(normal(browser.eigeneGruppenPlanSchritte(plan1, 'My_Ranger1').map((x) => x.art)), ['gemeinsames_ziel_bearbeiten']);
  assert.deepEqual(normal(browser.eigeneGruppenPlanSchritte(plan2, 'My_Ranger2').map((x) => x.art)), ['mitglied_heilen', 'gruppe_unterstuetzen']);
});

test('Block 8 Gruppenaktionsschatten: echte Schattenkette zeigt Aktiv, Stale und Reconnect ohne AktionsAnfrage oder Spielaktion', async () => {
  const eigeneMeldung = meldung('My_Ranger1', {
    zielKennung: 'goo-1',
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
  });
  const remoteFrisch = meldung('My_Ranger2', {
    gesendetAm: jetzt - 100,
    zielKennung: 'goo-1',
    faehigkeiten: { heilen: 0, schaden: 0.7, aggro: 0, schutz: 0, unterstuetzung: 1 }
  });
  const lauf = await ladeGesamtenSchatten({ eigeneMeldung, remoteMeldung: remoteFrisch });

  const aktiv = await lauf.kontext.V4Block8GruppenAktionsplanung.pruefe();
  assert.equal(lauf.sendeschritte(), 1);
  assert.equal(aktiv.aktionsAnfragenErzeugt, false);
  assert.equal(aktiv.echteSpielaktionenAusgefuehrt, false);
  assert.equal(aktiv.entscheidung.aufgaben.unterstuetzung, 'My_Ranger2');
  assert.equal(aktiv.plan.schritte.some((x) => x.art === 'gruppe_unterstuetzen' && x.ausfuehrenderTeilnehmerKennung === 'My_Ranger2'), true);
  assert.equal(aktiv.planSignatur.some((eintrag) => eintrag.startsWith('gruppe_unterstuetzen|My_Ranger2|')), true);
  assert.equal(aktiv.meldungen.length, 2);

  lauf.setzeRemote({ ...remoteFrisch, gesendetAm: jetzt - 6_000 });
  const stale = await lauf.kontext.V4Block8GruppenAktionsplanung.pruefe();
  assert.equal(stale.entscheidung.teilnehmerBewertungen.find((x) => x.charakterKennung === 'My_Ranger2')?.status, 'veraltet');
  assert.equal(stale.plan.schritte.some((x) => x.ausfuehrenderTeilnehmerKennung === 'My_Ranger2'), false);

  lauf.setzeRemote({ ...remoteFrisch, gesendetAm: jetzt - 50, laufendeNummer: 2 });
  const reconnect = await lauf.kontext.V4Block8GruppenAktionsplanung.pruefe();
  assert.equal(reconnect.entscheidung.teilnehmerBewertungen.find((x) => x.charakterKennung === 'My_Ranger2')?.status, 'aktiv');
  assert.equal(reconnect.plan.schritte.some((x) => x.art === 'gruppe_unterstuetzen' && x.ausfuehrenderTeilnehmerKennung === 'My_Ranger2'), true);
  assert.equal(lauf.sendeschritte(), 3);
});

test('Block 8 Gruppenaktionsschatten: Safety unterdrueckt Zielarbeit und laesst nur begruendete Heilung oder Schutz zu', async () => {
  const eigeneMeldung = meldung('My_Ranger1', {
    lebensAnteil: 0.4,
    zielKennung: 'goo-1',
    gefahrenStufe: 'kritisch',
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 1 }
  });
  const remoteMeldung = meldung('My_Ranger2', {
    gesendetAm: jetzt - 100,
    zielKennung: 'goo-1',
    faehigkeiten: { heilen: 1, schaden: 0.7, aggro: 1, schutz: 1, unterstuetzung: 0 }
  });
  const lauf = await ladeGesamtenSchatten({ eigeneMeldung, remoteMeldung });
  const ergebnis = await lauf.kontext.V4Block8GruppenAktionsplanung.pruefe();

  assert.equal(ergebnis.plan.betriebsArt, 'sicherheit');
  assert.equal(ergebnis.plan.gemeinsamesZielKennung, null);
  assert.deepEqual(normal(ergebnis.plan.schritte.map((x) => x.art)), ['mitglied_heilen', 'mitglied_schuetzen']);
  assert.ok(ergebnis.plan.schritte.every((x) => x.wichtigkeit === 'sicherheit'));
  assert.equal(ergebnis.planSignatur.some((eintrag) => eintrag.startsWith('gemeinsames_ziel_bearbeiten|')), false);
  assert.equal(ergebnis.planSignatur.some((eintrag) => eintrag.startsWith('ziel_aggro_binden|')), false);
});
