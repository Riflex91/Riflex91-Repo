import test from 'node:test';
import assert from 'node:assert/strict';
import { KontingentWaechter } from '../../erzeugt/kern/kontingent-waechter.js';

function profil(aenderungen = {}) {
  return {
    dienstKennung: 'testdienst',
    anzeigename: 'Testdienst',
    tarifName: 'Testtarif',
    quelle: 'https://example.invalid/limits',
    geprueftAm: 100,
    gueltigBis: 1000,
    grenzen: [
      { kennung: 'anfragen_pro_tag', einheit: 'anfragen', zeitraum: 'tag', anbieterMaximum: 100, sicherheitsPuffer: 10 }
    ],
    ...aenderungen
  };
}

function anfrage(maximalerVerbrauch) {
  return {
    dienstKennung: 'testdienst',
    vorgangKennung: 'vorgang-1',
    angefordertAm: 200,
    reservierungen: [{ grenzeKennung: 'anfragen_pro_tag', maximalerVerbrauch }]
  };
}

test('ohne geprueftes Dienstprofil wird jede externe Anfrage blockiert', () => {
  const waechter = new KontingentWaechter();
  const ergebnis = waechter.pruefeUndReserviere(anfrage(1), { anfragen_pro_tag: '2026-09-16' }, 200);
  assert.equal(ergebnis.erlaubt, false);
  assert.equal(ergebnis.schutzstufe, 'blockiert');
});

test('Sicherheitspuffer darf niemals von normalen Anfragen verbraucht werden', () => {
  const waechter = new KontingentWaechter();
  waechter.setzeDienstProfil(profil());
  assert.equal(waechter.pruefeUndReserviere(anfrage(90), { anfragen_pro_tag: '2026-09-16' }, 200).erlaubt, true);
  assert.equal(waechter.pruefeUndReserviere(anfrage(1), { anfragen_pro_tag: '2026-09-16' }, 200).erlaubt, false);
});

test('Anbieter-Verbrauch wird konservativ gegen lokale Reservierungen gerechnet', () => {
  const waechter = new KontingentWaechter();
  waechter.setzeDienstProfil(profil());
  waechter.aktualisiereVerbrauch('testdienst', 'anfragen_pro_tag', '2026-09-16', 85);
  const ergebnis = waechter.pruefeUndReserviere(anfrage(6), { anfragen_pro_tag: '2026-09-16' }, 200);
  assert.equal(ergebnis.erlaubt, false);
});

test('abgelaufene Dienstprofile werden nicht weiterverwendet', () => {
  const waechter = new KontingentWaechter();
  waechter.setzeDienstProfil(profil());
  const ergebnis = waechter.pruefeUndReserviere(anfrage(1), { anfragen_pro_tag: '2026-09-16' }, 1001);
  assert.equal(ergebnis.erlaubt, false);
  assert.match(ergebnis.grund, /abgelaufen/);
});

test('unbekannter Maximalverbrauch wird statt einer Schaetzung blockiert', () => {
  const waechter = new KontingentWaechter();
  waechter.setzeDienstProfil(profil());
  const ergebnis = waechter.pruefeUndReserviere(anfrage(0), { anfragen_pro_tag: '2026-09-16' }, 200);
  assert.equal(ergebnis.erlaubt, false);
});
