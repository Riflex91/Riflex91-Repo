import test from 'node:test';
import assert from 'node:assert/strict';
import { werteFreigabestufenAus } from '../../erzeugt/telemetrie/freigabestufen.js';

const PFAD = 'block8.5-basisbedienung-runtime';
const AENDERUNG = 'git:b513ca77fb17027475ce3213e446f4091df52eb7';

function nachweis(stufe, aenderungen = {}) {
  const basis = {
    schemaVersion: 1,
    laufzeitPfadKennung: PFAD,
    aenderungsKennung: AENDERUNG,
    stufe,
    nachweisKennung: `nachweis-${stufe}`,
    ergebnis: 'bestanden',
    durchgefuehrtAm: 10_000,
    deterministisch: false,
    spielAktionAusgefuehrt: false,
    begrenzt: false,
    telemetrieNachweis: false,
    recoveryNachweis: false,
    gesamtauswertungBestanden: false
  };

  if (stufe === 'offline') {
    basis.deterministisch = true;
    basis.durchgefuehrtAm = 10_000;
  } else if (stufe === 'schatten') {
    basis.durchgefuehrtAm = 20_000;
  } else if (stufe === 'kontrolliert_live') {
    basis.durchgefuehrtAm = 30_000;
    basis.begrenzt = true;
  } else if (stufe === 'soak') {
    basis.durchgefuehrtAm = 40_000;
    basis.telemetrieNachweis = true;
    basis.recoveryNachweis = true;
    basis.gesamtauswertungBestanden = true;
  }

  return Object.freeze({ ...basis, ...aenderungen });
}

function auswertung(nachweise) {
  return werteFreigabestufenAus(Object.freeze({
    schemaVersion: 1,
    laufzeitPfadKennung: PFAD,
    aenderungsKennung: AENDERUNG,
    nachweise: Object.freeze(nachweise)
  }));
}

test('Block 8.5.9: alle vier sequenziellen Nachweise geben Block 9 fuer exakt denselben Aenderungsstand frei', () => {
  const status = auswertung([
    nachweis('offline'),
    nachweis('schatten'),
    nachweis('kontrolliert_live'),
    nachweis('soak')
  ]);

  assert.equal(status.freigabeVollstaendig, true);
  assert.equal(status.block9Freigegeben, true);
  assert.equal(status.naechsteStufe, null);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);
  assert.deepEqual(
    status.stufen.map((eintrag) => eintrag.zustand),
    ['bestanden', 'bestanden', 'bestanden', 'bestanden']
  );
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.stufen), true);
});

test('Block 8.5.9: bestandener Offline-Test allein laesst Block 9 gesperrt und fordert Schattenbetrieb', () => {
  const status = auswertung([nachweis('offline')]);

  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.freigabeVollstaendig, false);
  assert.equal(status.naechsteStufe, 'schatten');
  assert.deepEqual(
    status.stufen.map((eintrag) => eintrag.zustand),
    ['bestanden', 'offen', 'blockiert', 'blockiert']
  );
  assert.match(status.grund, /Block 9 bleibt gesperrt/);
});

test('Block 8.5.9: Nachweis eines anderen Aenderungsstands kann nicht wiederverwendet werden', () => {
  assert.throws(
    () => auswertung([
      nachweis('offline', {
        aenderungsKennung: 'git:alter-block8-stand'
      })
    ]),
    /anderen Aenderungsstand/
  );
});

test('Block 8.5.9: Schattenbetrieb mit echter Spielaktion wird fail-safe nicht anerkannt', () => {
  const status = auswertung([
    nachweis('offline'),
    nachweis('schatten', { spielAktionAusgefuehrt: true }),
    nachweis('kontrolliert_live'),
    nachweis('soak')
  ]);

  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.naechsteStufe, 'schatten');
  assert.equal(status.stufen[1].zustand, 'fehlgeschlagen');
  assert.match(status.stufen[1].grund, /keine echte Spielaktion/);
  assert.equal(status.stufen[2].zustand, 'blockiert');
  assert.equal(status.stufen[3].zustand, 'blockiert');
});

test('Block 8.5.9: kontrollierter Live-Test muss explizit begrenzt sein', () => {
  const status = auswertung([
    nachweis('offline'),
    nachweis('schatten'),
    nachweis('kontrolliert_live', { begrenzt: false }),
    nachweis('soak')
  ]);

  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.naechsteStufe, 'kontrolliert_live');
  assert.equal(status.stufen[2].zustand, 'fehlgeschlagen');
  assert.match(status.stufen[2].grund, /explizit begrenzt/);
  assert.equal(status.stufen[3].zustand, 'blockiert');
});

test('Block 8.5.9: Soak-Test braucht Telemetrie Recovery-Nachweis und bestandene Gesamtauswertung', () => {
  for (const aenderung of [
    { telemetrieNachweis: false },
    { recoveryNachweis: false },
    { gesamtauswertungBestanden: false }
  ]) {
    const status = auswertung([
      nachweis('offline'),
      nachweis('schatten'),
      nachweis('kontrolliert_live'),
      nachweis('soak', aenderung)
    ]);

    assert.equal(status.block9Freigegeben, false);
    assert.equal(status.naechsteStufe, 'soak');
    assert.equal(status.stufen[3].zustand, 'fehlgeschlagen');
  }
});

test('Block 8.5.9: spaetere Nachweise duerfen eine offene vorherige Stufe nicht ueberspringen', () => {
  const status = auswertung([
    nachweis('offline'),
    nachweis('kontrolliert_live'),
    nachweis('soak')
  ]);

  assert.equal(status.block9Freigegeben, false);
  assert.equal(status.naechsteStufe, 'schatten');
  assert.equal(status.stufen[1].zustand, 'offen');
  assert.equal(status.stufen[2].zustand, 'blockiert');
  assert.equal(status.stufen[2].nachweisKennung, 'nachweis-kontrolliert_live');
  assert.equal(status.stufen[3].zustand, 'blockiert');
});

test('Block 8.5.9: fehlgeschlagene Stufe blockiert alle spaeteren Nachweise', () => {
  const status = auswertung([
    nachweis('offline'),
    nachweis('schatten', { ergebnis: 'fehlgeschlagen' }),
    nachweis('kontrolliert_live'),
    nachweis('soak')
  ]);

  assert.equal(status.naechsteStufe, 'schatten');
  assert.equal(status.stufen[1].zustand, 'fehlgeschlagen');
  assert.equal(status.stufen[2].zustand, 'blockiert');
  assert.equal(status.stufen[3].zustand, 'blockiert');
  assert.equal(status.block9Freigegeben, false);
});

test('Block 8.5.9: zeitlich rueckwaertiger Nachweis kann die Reihenfolge nicht umgehen', () => {
  const status = auswertung([
    nachweis('offline', { durchgefuehrtAm: 20_000 }),
    nachweis('schatten', { durchgefuehrtAm: 19_999 }),
    nachweis('kontrolliert_live'),
    nachweis('soak')
  ]);

  assert.equal(status.naechsteStufe, 'schatten');
  assert.equal(status.stufen[1].zustand, 'fehlgeschlagen');
  assert.match(status.stufen[1].grund, /zeitlich vor/);
  assert.equal(status.block9Freigegeben, false);
});

test('Block 8.5.9: doppelte Nachweise derselben Stufe werden als mehrdeutig abgewiesen', () => {
  assert.throws(
    () => auswertung([
      nachweis('offline'),
      nachweis('offline', { nachweisKennung: 'zweiter-offline-nachweis' })
    ]),
    /mehr als einen Nachweis/
  );
});

test('Block 8.5.9: leere Pfad- oder Aenderungskennung wird fail-safe abgewiesen', () => {
  assert.throws(
    () => werteFreigabestufenAus({
      schemaVersion: 1,
      laufzeitPfadKennung: '',
      aenderungsKennung: AENDERUNG,
      nachweise: []
    }),
    /laufzeitPfadKennung darf nicht leer/
  );

  assert.throws(
    () => werteFreigabestufenAus({
      schemaVersion: 1,
      laufzeitPfadKennung: PFAD,
      aenderungsKennung: '',
      nachweise: []
    }),
    /aenderungsKennung darf nicht leer/
  );
});
