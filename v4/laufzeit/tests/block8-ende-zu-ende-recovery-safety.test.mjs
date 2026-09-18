import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { koordiniereGruppe } from '../../erzeugt/spiellogik/gruppen-koordination.js';
import { planeGruppenAktionen } from '../../erzeugt/spiellogik/gruppen-aktionsplanung.js';
import {
  erstelleGruppenAktionsAnfrageKonfiguration,
  uebersetzeEigeneGruppenPlanSchritte
} from '../../erzeugt/spiellogik/gruppen-aktionsanfragen.js';
import {
  erstelleGruppenAktionsSteuerungKonfiguration,
  uebergibGruppenAktionsAnfragenAnSteuerung
} from '../../erzeugt/spiellogik/gruppen-aktionssteuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../../erzeugt/vertraege/gruppen-aktionsanfrage.js';

function meldung(charakterKennung, gesendetAm, laufendeNummer, aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    charakterKennung,
    charakterName: charakterKennung,
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
    faehigkeiten: Object.freeze({
      heilen: 0,
      schaden: charakterKennung === 'My_Ranger1' ? 1 : 0.7,
      aggro: 0,
      schutz: 0,
      unterstuetzung: charakterKennung === 'My_Ranger2' ? 1 : 0
    }),
    gesendetAm,
    laufendeNummer,
    ...aenderungen
  });
}

const anfrageCfg = erstelleGruppenAktionsAnfrageKonfiguration({
  aktiviert: true,
  freigegebeneArten: ['gruppe_unterstuetzen'],
  gueltigkeitMillisekunden: 1_500
});

const steuerungCfg = erstelleGruppenAktionsSteuerungKonfiguration({
  aktiviert: true,
  freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen],
  verarbeiten: true
});

function werteAus(meldungen, jetzt, steuerung) {
  const entscheidung = koordiniereGruppe(meldungen, 'My_Ranger2', jetzt);
  const plan = planeGruppenAktionen(meldungen, entscheidung);
  const uebersetzung = uebersetzeEigeneGruppenPlanSchritte(plan, 'My_Ranger2', anfrageCfg);
  const steuerungsErgebnis = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung,
    steuerung,
    jetzt,
    steuerungCfg
  );
  return { entscheidung, plan, uebersetzung, steuerungsErgebnis };
}

test('Block 8 Ende-zu-Ende: Stale, Reconnect und unbekannte Safety reconciliieren laufende Gruppenarbeit fail-safe', () => {
  let echteSpielaktionen = 0;
  globalThis.attack = () => { echteSpielaktionen += 1; };
  globalThis.move = () => { echteSpielaktionen += 1; };
  globalThis.use_skill = () => { echteSpielaktionen += 1; };

  try {
    const steuerung = new AktionsSteuerung();

    const normal = werteAus([
      meldung('My_Ranger1', 10_000, 1),
      meldung('My_Ranger2', 10_000, 1)
    ], 10_000, steuerung);

    assert.equal(normal.entscheidung.betriebsArt, 'normal');
    assert.equal(normal.entscheidung.aufgaben.unterstuetzung, 'My_Ranger2');
    assert.equal(normal.uebersetzung.status, 'erzeugt');
    assert.equal(normal.steuerungsErgebnis.verarbeitung?.art, 'gestartet');
    const ersteKennung = normal.steuerungsErgebnis.verarbeitung?.gestarteteAnfrage?.kennung;
    assert.ok(ersteKennung);
    assert.equal(steuerung.holeAktionsZustand(ersteKennung)?.phase, 'laeuft');
    assert.equal(
      steuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'gruppe')?.besitzer,
      ersteKennung
    );

    const stale = werteAus([
      meldung('My_Ranger1', 16_001, 2),
      meldung('My_Ranger2', 10_000, 1)
    ], 16_001, steuerung);

    assert.equal(stale.entscheidung.betriebsArt, 'blockiert');
    assert.equal(
      stale.entscheidung.teilnehmerBewertungen.find((wert) => wert.charakterKennung === 'My_Ranger2')?.status,
      'veraltet'
    );
    assert.equal(stale.plan.status, 'blockiert');
    assert.equal(stale.uebersetzung.status, 'blockiert');
    assert.equal(stale.steuerungsErgebnis.status, 'blockiert');
    assert.equal(steuerung.holeAktionsZustand(ersteKennung)?.phase, 'abgebrochen');
    assert.equal(steuerung.listeRessourcenSperren().some((sperre) => sperre.ressource === 'gruppe'), false);
    assert.equal(steuerung.listeSchattenProtokoll()[0]?.phase, 'abgebrochen');

    const reconnect = werteAus([
      meldung('My_Ranger1', 17_000, 3),
      meldung('My_Ranger2', 17_000, 2)
    ], 17_000, steuerung);

    assert.equal(reconnect.entscheidung.betriebsArt, 'normal');
    assert.deepEqual(reconnect.entscheidung.aktiveTeilnehmerKennungen, ['My_Ranger1', 'My_Ranger2']);
    assert.equal(reconnect.entscheidung.aufgaben.unterstuetzung, 'My_Ranger2');
    assert.equal(reconnect.uebersetzung.status, 'erzeugt');
    const zweiteKennung = reconnect.steuerungsErgebnis.verarbeitung?.gestarteteAnfrage?.kennung;
    assert.ok(zweiteKennung);
    assert.notEqual(zweiteKennung, ersteKennung);
    assert.equal(steuerung.holeAktionsZustand(zweiteKennung)?.phase, 'laeuft');
    assert.equal(
      steuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'gruppe')?.besitzer,
      zweiteKennung
    );

    const unbekannteSafety = werteAus([
      meldung('My_Ranger1', 17_100, 4, { gefahrenStufe: 'unbekannt' }),
      meldung('My_Ranger2', 17_100, 3)
    ], 17_100, steuerung);

    assert.equal(unbekannteSafety.entscheidung.betriebsArt, 'blockiert');
    assert.equal(unbekannteSafety.entscheidung.gemeinsameGefahrenStufe, 'unbekannt');
    assert.equal(unbekannteSafety.plan.status, 'blockiert');
    assert.equal(unbekannteSafety.uebersetzung.status, 'blockiert');
    assert.equal(steuerung.holeAktionsZustand(zweiteKennung)?.phase, 'abgebrochen');
    assert.equal(steuerung.listeRessourcenSperren().some((sperre) => sperre.ressource === 'gruppe'), false);
    assert.equal(steuerung.listeSchattenProtokoll()[1]?.phase, 'abgebrochen');
    assert.equal(echteSpielaktionen, 0);
  } finally {
    delete globalThis.attack;
    delete globalThis.move;
    delete globalThis.use_skill;
  }
});
