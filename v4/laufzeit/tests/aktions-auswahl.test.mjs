import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsAuswahl } from '../../erzeugt/kern/aktions-auswahl.js';

function aktionsAnfrage(aenderungen) {
  return {
    kennung: 'anfrage',
    angefordertVon: 'test',
    aktion: 'TEST_AKTION',
    wichtigkeit: 'normal',
    prioritaet: 0,
    angefordertAm: 1,
    benoetigteRessourcen: [],
    grund: 'Testanfrage',
    details: {},
    ...aenderungen
  };
}

test('Notfallarbeit wird immer vor normaler Arbeit ausgewaehlt', () => {
  const auswahl = new AktionsAuswahl();
  const gewaehlt = auswahl.waehleNaechsteAktion([
    aktionsAnfrage({ kennung: 'farmen', wichtigkeit: 'normal', prioritaet: 999 }),
    aktionsAnfrage({ kennung: 'rueckzug', wichtigkeit: 'notfall', prioritaet: 1 })
  ], 10);
  assert.equal(gewaehlt?.kennung, 'rueckzug');
});

test('Abgelaufene Anfragen werden ignoriert und Gleichstaende bleiben deterministisch', () => {
  const auswahl = new AktionsAuswahl();
  const sortiert = auswahl.sortiereNachWichtigkeit([
    aktionsAnfrage({ kennung: 'abgelaufen', prioritaet: 1000, gueltigBis: 10 }),
    aktionsAnfrage({ kennung: 'b', prioritaet: 10, angefordertAm: 5 }),
    aktionsAnfrage({ kennung: 'a', prioritaet: 10, angefordertAm: 5 })
  ], 10);
  assert.deepEqual(sortiert.map((zeile) => zeile.kennung), ['a', 'b']);
});
