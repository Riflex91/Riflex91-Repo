import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../../erzeugt/vertraege/gruppen-aktionsanfrage.js';
import {
  erstelleGruppenAktionsSteuerungKonfiguration,
  uebergibGruppenAktionsAnfragenAnSteuerung
} from '../../erzeugt/spiellogik/gruppen-aktionssteuerung.js';

function anfrage(aenderungen = {}) {
  return Object.freeze({
    kennung: 'gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe:aktionsanfrage',
    angefordertVon: 'gruppen-aktionsplanung',
    aktion: GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen,
    wichtigkeit: 'normal',
    prioritaet: 500,
    angefordertAm: 10_000,
    gueltigBis: 11_500,
    benoetigteRessourcen: Object.freeze(['gruppe']),
    grund: 'Unterstuetzungsaufgabe ist fuer den normalen Gruppenbetrieb zugeordnet.',
    details: Object.freeze({ ausfuehrenderTeilnehmerKennung: 'My_Ranger2' }),
    ...aenderungen
  });
}

function uebersetzung(anfragen = [anfrage()], aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: 10_000,
    status: 'erzeugt',
    grund: 'Testuebersetzung.',
    eigenerTeilnehmerKennung: 'My_Ranger2',
    planStatus: 'geplant',
    eigeneSchrittKennungen: Object.freeze(['gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe']),
    nichtFreigegebeneSchrittKennungen: Object.freeze([]),
    aktionsAnfragen: Object.freeze([...anfragen]),
    ...aenderungen
  });
}

test('Block 8 Gruppen-AktionsSteuerung: Uebergabe ist standardmaessig gesperrt', () => {
  const steuerung = new AktionsSteuerung();
  const ergebnis = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), steuerung, 10_000);
  assert.equal(ergebnis.status, 'gesperrt');
  assert.equal(ergebnis.eingereichteAnfrageKennungen.length, 0);
  assert.deepEqual(ergebnis.nichtFreigegebeneAnfrageKennungen, [anfrage().kennung]);
  assert.equal(steuerung.listeAktionsZustaende().length, 0);
  assert.equal(steuerung.listeSchattenProtokoll().length, 0);
});

test('Block 8 Gruppen-AktionsSteuerung: zweite Aktionsnamen-Whitelist ist erforderlich', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = erstelleGruppenAktionsSteuerungKonfiguration({ aktiviert: true, freigegebeneAktionen: [] });
  const ergebnis = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), steuerung, 10_000, cfg);
  assert.equal(ergebnis.status, 'leer');
  assert.equal(ergebnis.eingereichteAnfrageKennungen.length, 0);
  assert.equal(steuerung.listeAktionsZustaende().length, 0);
});

test('Block 8 Gruppen-AktionsSteuerung: freigegebene Anfrage kann nur eingereiht werden', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
    verarbeiten: false
  });
  const ergebnis = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), steuerung, 10_000, cfg);
  assert.equal(ergebnis.status, 'eingereiht');
  assert.deepEqual(ergebnis.eingereichteAnfrageKennungen, [anfrage().kennung]);
  assert.equal(ergebnis.verarbeitung, null);
  assert.equal(ergebnis.laufZustaende[0]?.phase, 'wartend');
  assert.equal(ergebnis.schattenEintraege.length, 0);
});

test('Block 8 Gruppen-AktionsSteuerung: explizite Verarbeitung startet ausschliesslich SchattenAusfuehrung', () => {
  let echteAufrufe = 0;
  globalThis.attack = () => { echteAufrufe += 1; };
  globalThis.move = () => { echteAufrufe += 1; };
  globalThis.use_skill = () => { echteAufrufe += 1; };
  try {
    const steuerung = new AktionsSteuerung();
    const cfg = erstelleGruppenAktionsSteuerungKonfiguration({
      aktiviert: true,
      freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
      verarbeiten: true
    });
    const ergebnis = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), steuerung, 10_000, cfg);
    assert.equal(ergebnis.status, 'verarbeitet');
    assert.equal(ergebnis.verarbeitung?.art, 'gestartet');
    assert.equal(ergebnis.verarbeitung?.gestarteteAnfrage?.aktion, GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen);
    assert.equal(ergebnis.laufZustaende[0]?.phase, 'laeuft');
    assert.equal(ergebnis.schattenEintraege.length, 1);
    assert.equal(ergebnis.schattenEintraege[0]?.aktion, GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen);
    assert.equal(ergebnis.schattenEintraege[0]?.phase, 'laeuft');
    assert.equal(echteAufrufe, 0);
  } finally {
    delete globalThis.attack;
    delete globalThis.move;
    delete globalThis.use_skill;
  }
});

test('Block 8 Gruppen-AktionsSteuerung: abgelaufene Anfrage wird vor Einreichung verworfen', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
    verarbeiten: true
  });
  const ergebnis = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung(), steuerung, 11_500, cfg);
  assert.equal(ergebnis.status, 'leer');
  assert.deepEqual(ergebnis.abgelaufeneAnfrageKennungen, [anfrage().kennung]);
  assert.equal(steuerung.listeAktionsZustaende().length, 0);
  assert.equal(steuerung.listeSchattenProtokoll().length, 0);
});

test('Block 8 Gruppen-AktionsSteuerung: blockierte Uebersetzung darf nichts einreichen', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
    verarbeiten: true
  });
  const ergebnis = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([], { status: 'blockiert', grund: 'Fail-safe.' }),
    steuerung,
    10_000,
    cfg
  );
  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(steuerung.listeAktionsZustaende().length, 0);
});


test('Block 8 Gruppen-AktionsSteuerung: blockierte neue Planung bricht bestehende Gruppenarbeit fail-safe ab', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
    verarbeiten: true
  });
  const laufend = anfrage();
  uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung([laufend]), steuerung, 10_000, cfg);
  assert.equal(steuerung.holeAktionsZustand(laufend.kennung)?.phase, 'laeuft');
  assert.equal(steuerung.listeRessourcenSperren().some((sperre) => sperre.ressource === 'gruppe'), true);

  const blockiert = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([], { status: 'blockiert', planStatus: 'blockiert', grund: 'Sicherheitslage unbekannt.' }),
    steuerung,
    10_100,
    cfg
  );

  assert.equal(blockiert.status, 'blockiert');
  assert.equal(steuerung.holeAktionsZustand(laufend.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().some((sperre) => sperre.ressource === 'gruppe'), false);
  assert.equal(steuerung.listeSchattenProtokoll()[0]?.phase, 'abgebrochen');
  assert.match(steuerung.holeAktionsZustand(laufend.kennung)?.zustandsGrund ?? '', /darf nicht fortgesetzt/);
});

test('Block 8 Gruppen-AktionsSteuerung: leerer lokaler Plan entfernt wartende alte Gruppenarbeit ohne fremde Arbeit anzutasten', () => {
  const steuerung = new AktionsSteuerung();
  const cfgWartend = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
    verarbeiten: false
  });
  const alt = anfrage();
  uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung([alt]), steuerung, 10_000, cfgWartend);
  steuerung.reicheAnfrageEin(Object.freeze({
    kennung: 'fremde-arbeit',
    angefordertVon: 'anderes-modul',
    aktion: 'ANDERE_AKTION',
    wichtigkeit: 'normal',
    prioritaet: 1,
    angefordertAm: 10_000,
    gueltigBis: 12_000,
    benoetigteRessourcen: Object.freeze(['inventar']),
    grund: 'Darf durch Gruppen-Reconciliation nicht veraendert werden.',
    details: Object.freeze({})
  }));

  const leer = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([], {
      status: 'leer',
      planStatus: 'leer',
      grund: 'Im aktuellen Gruppenplan existiert kein lokaler Schritt.',
      eigeneSchrittKennungen: Object.freeze([])
    }),
    steuerung,
    10_100,
    cfgWartend
  );

  assert.equal(leer.status, 'leer');
  assert.equal(steuerung.holeAktionsZustand(alt.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.holeAktionsZustand('fremde-arbeit')?.phase, 'wartend');
  assert.equal(steuerung.listeSchattenProtokoll().length, 0);
});

test('Block 8 Gruppen-AktionsSteuerung: reine Freigabesperre ist kein Safety-Signal und bricht laufende Gruppenarbeit nicht ab', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
    verarbeiten: true
  });
  const laufend = anfrage();
  uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung([laufend]), steuerung, 10_000, cfg);

  const gesperrt = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([], { status: 'gesperrt', grund: 'Uebersetzung explizit nicht freigegeben.' }),
    steuerung,
    10_100,
    cfg
  );

  assert.equal(gesperrt.status, 'leer');
  assert.equal(steuerung.holeAktionsZustand(laufend.kennung)?.phase, 'laeuft');
  assert.equal(steuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'gruppe')?.besitzer, laufend.kennung);
});
