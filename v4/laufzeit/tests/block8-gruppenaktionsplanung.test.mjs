import test from 'node:test';
import assert from 'node:assert/strict';
import { koordiniereGruppe } from '../../erzeugt/spiellogik/gruppen-koordination.js';
import {
  eigeneGruppenPlanSchritte,
  erstelleGruppenAktionsPlanKonfiguration,
  planeGruppenAktionen
} from '../../erzeugt/spiellogik/gruppen-aktionsplanung.js';

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
    faehigkeiten: {
      heilen: 0,
      schaden: 0,
      aggro: 0,
      schutz: 0,
      unterstuetzung: 0
    },
    gesendetAm: 10_000,
    laufendeNummer: 1,
    ...aenderungen
  };
}

function plane(meldungen, eigeneKennung = 'A', jetzt = 10_500, konfiguration) {
  const entscheidung = koordiniereGruppe(meldungen, eigeneKennung, jetzt);
  return { entscheidung, plan: planeGruppenAktionen(meldungen, entscheidung, konfiguration) };
}

test('Block 8 Aktionsplanung: Heilen, Aggro, Schutz, Unterstuetzung und gemeinsames Ziel werden konkret geplant', () => {
  const meldungen = [
    meldung('A', {
      zielKennung: 'goo-1',
      lebensAnteil: 0.45,
      faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
    }),
    meldung('B', {
      zielKennung: 'goo-1',
      faehigkeiten: { heilen: 1, schaden: 0, aggro: 0.8, schutz: 0.9, unterstuetzung: 1 }
    })
  ];
  const { plan } = plane(meldungen);

  assert.equal(plan.status, 'geplant');
  assert.equal(plan.betriebsArt, 'normal');
  assert.equal(plan.gemeinsamesZielKennung, 'goo-1');
  assert.deepEqual(plan.schritte.map((schritt) => schritt.art), [
    'mitglied_heilen',
    'mitglied_schuetzen',
    'ziel_aggro_binden',
    'gruppe_unterstuetzen',
    'gemeinsames_ziel_bearbeiten'
  ]);
  assert.deepEqual(plan.schritte.map((schritt) => schritt.ausfuehrenderTeilnehmerKennung), ['B', 'B', 'B', 'B', 'A']);
  assert.equal(plan.schritte[0].zielKennung, 'A');
  assert.equal(plan.schritte[1].zielKennung, 'A');
  assert.equal(plan.schritte[2].zielKennung, 'goo-1');
  assert.equal(plan.schritte[4].zielKennung, 'goo-1');
});

test('Block 8 Aktionsplanung: Klassenname beeinflusst weder Aufgaben noch Aktionsplan', () => {
  const meldungen = [
    meldung('A', {
      klasse: 'priest',
      zielKennung: 'ziel',
      faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
    }),
    meldung('B', {
      klasse: 'warrior',
      lebensAnteil: 0.6,
      zielKennung: 'ziel',
      faehigkeiten: { heilen: 1, schaden: 0, aggro: 0, schutz: 0, unterstuetzung: 0 }
    })
  ];
  const { plan } = plane(meldungen);
  assert.equal(plan.schritte.find((schritt) => schritt.art === 'mitglied_heilen')?.ausfuehrenderTeilnehmerKennung, 'B');
  assert.equal(plan.schritte.find((schritt) => schritt.art === 'gemeinsames_ziel_bearbeiten')?.ausfuehrenderTeilnehmerKennung, 'A');
});

test('Block 8 Aktionsplanung: Sicherheitsbetrieb unterdrueckt Aggro, Unterstuetzung und gemeinsames Ziel', () => {
  const meldungen = [
    meldung('A', {
      gefahrenStufe: 'kritisch',
      lebensAnteil: 0.35,
      zielKennung: 'goo-1',
      faehigkeiten: { heilen: 0, schaden: 1, aggro: 1, schutz: 0, unterstuetzung: 1 }
    }),
    meldung('B', {
      zielKennung: 'goo-1',
      faehigkeiten: { heilen: 1, schaden: 0, aggro: 0, schutz: 1, unterstuetzung: 0 }
    })
  ];
  const { plan } = plane(meldungen);

  assert.equal(plan.betriebsArt, 'sicherheit');
  assert.equal(plan.gemeinsamesZielKennung, null);
  assert.deepEqual(plan.schritte.map((schritt) => schritt.art), ['mitglied_heilen', 'mitglied_schuetzen']);
  assert.ok(plan.schritte.every((schritt) => schritt.wichtigkeit === 'sicherheit'));
});

test('Block 8 Aktionsplanung: unbekannte Gruppensicherheit bleibt ohne Aktionsschritt blockiert', () => {
  const meldungen = [meldung('A', { gefahrenStufe: 'unbekannt', faehigkeiten: { heilen: 1, schaden: 1, aggro: 1, schutz: 1, unterstuetzung: 1 } })];
  const { plan } = plane(meldungen);
  assert.equal(plan.status, 'blockiert');
  assert.deepEqual(plan.schritte, []);
});

test('Block 8 Aktionsplanung: veralteter Teilnehmer erhaelt keine Schritte und Reconnect stellt seine Aufgabe wieder her', () => {
  const a = meldung('A', { zielKennung: 'goo-1', faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 } });
  const bAlt = meldung('B', { gesendetAm: 1_000, zielKennung: 'goo-1', faehigkeiten: { heilen: 0, schaden: 0, aggro: 0, schutz: 0, unterstuetzung: 1 } });
  const alt = plane([a, bAlt]);
  assert.ok(alt.plan.schritte.every((schritt) => schritt.ausfuehrenderTeilnehmerKennung !== 'B'));
  assert.equal(alt.plan.schritte.some((schritt) => schritt.art === 'gruppe_unterstuetzen'), false);

  const bFrisch = { ...bAlt, gesendetAm: 10_400, laufendeNummer: 2 };
  const frisch = plane([a, bAlt, bFrisch]);
  assert.equal(frisch.plan.schritte.find((schritt) => schritt.art === 'gruppe_unterstuetzen')?.ausfuehrenderTeilnehmerKennung, 'B');
});

test('Block 8 Aktionsplanung: niedrigster Lebensanteil und Gleichstand sind deterministisch', () => {
  const meldungen = [
    meldung('C', { lebensAnteil: 0.4 }),
    meldung('B', { lebensAnteil: 0.4, faehigkeiten: { heilen: 1, schaden: 0, aggro: 0, schutz: 0, unterstuetzung: 0 } }),
    meldung('A', { lebensAnteil: 0.9 })
  ];
  const { plan } = plane(meldungen);
  const heilung = plan.schritte.find((schritt) => schritt.art === 'mitglied_heilen');
  assert.equal(heilung?.zielKennung, 'B');
});

test('Block 8 Aktionsplanung: gleiche Eingaben in anderer Reihenfolge erzeugen denselben Plan', () => {
  const a = meldung('A', { zielKennung: 'goo-1', lebensAnteil: 0.6, faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 } });
  const b = meldung('B', { zielKennung: 'goo-1', faehigkeiten: { heilen: 1, schaden: 0, aggro: 1, schutz: 1, unterstuetzung: 1 } });
  assert.deepEqual(plane([a, b]).plan, plane([b, a]).plan);
});

test('Block 8 Aktionsplanung: inkonsistente Aufgabe auf nicht aktiven Teilnehmer blockiert fail-safe', () => {
  const a = meldung('A');
  const entscheidung = koordiniereGruppe([a], 'A', 10_500);
  const manipuliert = {
    ...entscheidung,
    aufgaben: { ...entscheidung.aufgaben, schaden: 'B' }
  };
  const plan = planeGruppenAktionen([a], manipuliert);
  assert.equal(plan.status, 'blockiert');
  assert.deepEqual(plan.schritte, []);
});

test('Block 8 Aktionsplanung: jeder Charakter kann nur seine eigenen Plan-Schritte filtern', () => {
  const meldungen = [
    meldung('A', { zielKennung: 'goo-1', faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 } }),
    meldung('B', { lebensAnteil: 0.6, zielKennung: 'goo-1', faehigkeiten: { heilen: 1, schaden: 0, aggro: 0, schutz: 0, unterstuetzung: 1 } })
  ];
  const { plan } = plane(meldungen);
  const eigeneA = eigeneGruppenPlanSchritte(plan, 'A');
  const eigeneB = eigeneGruppenPlanSchritte(plan, 'B');
  assert.ok(eigeneA.every((schritt) => schritt.ausfuehrenderTeilnehmerKennung === 'A'));
  assert.ok(eigeneB.every((schritt) => schritt.ausfuehrenderTeilnehmerKennung === 'B'));
  assert.equal(eigeneA.some((schritt) => schritt.art === 'gemeinsames_ziel_bearbeiten'), true);
  assert.equal(eigeneB.some((schritt) => schritt.art === 'mitglied_heilen'), true);
});

test('Block 8 Aktionsplanung: Schwellen sind explizit konfigurierbar und werden validiert', () => {
  assert.deepEqual(erstelleGruppenAktionsPlanKonfiguration(), {
    heilenUnterLebensAnteil: 0.7,
    schuetzenUnterLebensAnteil: 0.5
  });
  assert.throws(() => erstelleGruppenAktionsPlanKonfiguration({ heilenUnterLebensAnteil: 0 }));
  assert.throws(() => erstelleGruppenAktionsPlanKonfiguration({ heilenUnterLebensAnteil: 0.4, schuetzenUnterLebensAnteil: 0.5 }));
});
