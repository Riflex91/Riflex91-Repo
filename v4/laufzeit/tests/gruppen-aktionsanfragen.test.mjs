import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../../erzeugt/vertraege/gruppen-aktionsanfrage.js';
import {
  erstelleGruppenAktionsAnfrageKonfiguration,
  uebersetzeEigeneGruppenPlanSchritte
} from '../../erzeugt/spiellogik/gruppen-aktionsanfragen.js';

function schritt(aenderungen = {}) {
  return Object.freeze({
    kennung: 'gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe',
    art: 'gruppe_unterstuetzen',
    faehigkeit: 'unterstuetzung',
    ausfuehrenderTeilnehmerKennung: 'My_Ranger2',
    zielArt: 'gruppe',
    zielKennung: null,
    wichtigkeit: 'normal',
    prioritaet: 500,
    benoetigteRessourcen: Object.freeze(['gruppe']),
    grund: 'Unterstuetzungsaufgabe ist fuer den normalen Gruppenbetrieb zugeordnet.',
    ...aenderungen
  });
}

function plan(schritte, aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: 10_000,
    status: 'geplant',
    grund: 'Deterministischer Testplan.',
    betriebsArt: 'normal',
    gemeinsameGefahrenStufe: 'sicher',
    gemeinsamesZielKennung: null,
    schritte: Object.freeze([...schritte]),
    ...aenderungen
  });
}

test('Block 8 Gruppenaktionsanfragen: Uebersetzung ist standardmaessig gesperrt', () => {
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan([schritt()]), 'My_Ranger2');
  assert.equal(ergebnis.status, 'gesperrt');
  assert.equal(ergebnis.aktionsAnfragen.length, 0);
  assert.deepEqual(ergebnis.eigeneSchrittKennungen, ['gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe']);
});

test('Block 8 Gruppenaktionsanfragen: explizit freigegebener eigener Schritt wird verlustarm uebersetzt', () => {
  const konfiguration = erstelleGruppenAktionsAnfrageKonfiguration({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen'],
    gueltigkeitMillisekunden: 1_500
  });
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan([schritt()]), 'My_Ranger2', konfiguration);
  assert.equal(ergebnis.status, 'erzeugt');
  assert.equal(ergebnis.aktionsAnfragen.length, 1);

  const anfrage = ergebnis.aktionsAnfragen[0];
  assert.equal(anfrage.kennung, 'gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe:aktionsanfrage');
  assert.equal(anfrage.angefordertVon, 'gruppen-aktionsplanung');
  assert.equal(anfrage.aktion, GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen);
  assert.equal(anfrage.wichtigkeit, 'normal');
  assert.equal(anfrage.prioritaet, 500);
  assert.equal(anfrage.angefordertAm, 10_000);
  assert.equal(anfrage.gueltigBis, 11_500);
  assert.deepEqual(anfrage.benoetigteRessourcen, ['gruppe']);
  assert.equal(anfrage.details.planSchrittKennung, schritt().kennung);
  assert.equal(anfrage.details.art, 'gruppe_unterstuetzen');
  assert.equal(anfrage.details.ausfuehrenderTeilnehmerKennung, 'My_Ranger2');
});

test('Block 8 Gruppenaktionsanfragen: fremde Teilnehmer-Schritte werden nie lokal uebersetzt', () => {
  const remote = schritt({
    kennung: 'gruppenplan:10000:gemeinsames_ziel_bearbeiten:My_Ranger1:goo-1',
    art: 'gemeinsames_ziel_bearbeiten',
    faehigkeit: 'schaden',
    ausfuehrenderTeilnehmerKennung: 'My_Ranger1',
    zielArt: 'gegner',
    zielKennung: 'goo-1',
    benoetigteRessourcen: Object.freeze(['gruppe', 'kampfziel'])
  });
  const konfiguration = erstelleGruppenAktionsAnfrageKonfiguration({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen', 'gemeinsames_ziel_bearbeiten']
  });
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan([remote, schritt()]), 'My_Ranger2', konfiguration);
  assert.equal(ergebnis.aktionsAnfragen.length, 1);
  assert.equal(ergebnis.aktionsAnfragen[0].aktion, GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen);
  assert.ok(ergebnis.aktionsAnfragen.every((anfrage) => anfrage.details.ausfuehrenderTeilnehmerKennung === 'My_Ranger2'));
});

test('Block 8 Gruppenaktionsanfragen: Arten-Whitelist blockiert nicht freigegebene eigene Schritte', () => {
  const zielSchritt = schritt({
    kennung: 'gruppenplan:10000:gemeinsames_ziel_bearbeiten:My_Ranger2:goo-1',
    art: 'gemeinsames_ziel_bearbeiten',
    faehigkeit: 'schaden',
    zielArt: 'gegner',
    zielKennung: 'goo-1',
    prioritaet: 400,
    benoetigteRessourcen: Object.freeze(['gruppe', 'kampfziel'])
  });
  const konfiguration = erstelleGruppenAktionsAnfrageKonfiguration({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen']
  });
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan([schritt(), zielSchritt]), 'My_Ranger2', konfiguration);
  assert.equal(ergebnis.status, 'erzeugt');
  assert.equal(ergebnis.aktionsAnfragen.length, 1);
  assert.deepEqual(ergebnis.nichtFreigegebeneSchrittKennungen, [zielSchritt.kennung]);
});

test('Block 8 Gruppenaktionsanfragen: blockierter oder leerer Plan erzeugt keine Anfrage', () => {
  const konfiguration = erstelleGruppenAktionsAnfrageKonfiguration({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen']
  });
  const blockiert = uebersetzeEigeneGruppenPlanSchritte(
    plan([], { status: 'blockiert', grund: 'Koordination fail-safe blockiert.' }),
    'My_Ranger2',
    konfiguration
  );
  const leer = uebersetzeEigeneGruppenPlanSchritte(
    plan([], { status: 'leer', grund: 'Keine Aktion.' }),
    'My_Ranger2',
    konfiguration
  );
  assert.equal(blockiert.status, 'blockiert');
  assert.equal(blockiert.aktionsAnfragen.length, 0);
  assert.equal(leer.status, 'leer');
  assert.equal(leer.aktionsAnfragen.length, 0);
});

test('Block 8 Gruppenaktionsanfragen: echte AktionsSteuerung akzeptiert Anfrage nur im Schattenbetrieb', () => {
  const konfiguration = erstelleGruppenAktionsAnfrageKonfiguration({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen']
  });
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan([schritt()]), 'My_Ranger2', konfiguration);
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(ergebnis.aktionsAnfragen[0]);
  const verarbeitung = steuerung.verarbeiteNaechsteAktion(10_000);

  assert.equal(verarbeitung.art, 'gestartet');
  assert.equal(verarbeitung.gestarteteAnfrage?.aktion, GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen);
  assert.equal(steuerung.holeAktionsZustand(ergebnis.aktionsAnfragen[0].kennung)?.phase, 'laeuft');
  assert.equal(steuerung.listeSchattenProtokoll().length, 1);
});

test('Block 8 Gruppenaktionsanfragen: kurze Gueltigkeit verhindert spaete Schattenausfuehrung', () => {
  const konfiguration = erstelleGruppenAktionsAnfrageKonfiguration({
    aktiviert: true,
    freigegebeneArten: ['gruppe_unterstuetzen'],
    gueltigkeitMillisekunden: 100
  });
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan([schritt()]), 'My_Ranger2', konfiguration);
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(ergebnis.aktionsAnfragen[0]);
  const verarbeitung = steuerung.verarbeiteNaechsteAktion(10_101);

  assert.equal(verarbeitung.art, 'keine-ausfuehrbare-aktion');
  assert.equal(steuerung.holeAktionsZustand(ergebnis.aktionsAnfragen[0].kennung)?.phase, 'abgelaufen');
  assert.equal(steuerung.listeSchattenProtokoll().length, 0);
});
