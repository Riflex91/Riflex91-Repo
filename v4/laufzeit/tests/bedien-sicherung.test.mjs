import test from 'node:test';
import assert from 'node:assert/strict';
import { BedienSicherung } from '../../erzeugt/kern/bedien-sicherung.js';

function anfrage(aenderungen = {}) {
  return {
    kennung: 'bedienung-1',
    aktion: 'TEST_AKTION',
    titel: 'Testaktion',
    erklaerung: 'Diese Aktion dient nur dem Test.',
    auswirkung: 'Es werden keine echten Daten veraendert.',
    risiko: 'unkritisch',
    angefordertAm: 1,
    voraussetzungen: [],
    ...aenderungen
  };
}

test('unkritische Aktion mit erfuellten Voraussetzungen wird erlaubt', () => {
  const sicherung = new BedienSicherung();
  assert.equal(sicherung.pruefe(anfrage()).erlaubt, true);
});

test('fehlende Voraussetzung blockiert die Aktion und liefert Hilfe', () => {
  const sicherung = new BedienSicherung();
  const ergebnis = sicherung.pruefe(anfrage({
    voraussetzungen: [{ kennung: 'server', beschreibung: 'Server erreichbar', erfuellt: false, hilfeWennNichtErfuellt: 'Serververbindung pruefen.' }]
  }));
  assert.equal(ergebnis.erlaubt, false);
  assert.equal(ergebnis.fehlendeVoraussetzungen.length, 1);
  assert.equal(ergebnis.fehlendeVoraussetzungen[0].hilfeWennNichtErfuellt, 'Serververbindung pruefen.');
});

test('vorsichtige Aktion braucht bewusste Bestaetigung', () => {
  const sicherung = new BedienSicherung();
  assert.equal(sicherung.pruefe(anfrage({ risiko: 'vorsicht' })).erlaubt, false);
  assert.equal(sicherung.pruefe(anfrage({ risiko: 'vorsicht', ausdruecklichBestaetigt: true })).erlaubt, true);
});

test('kritische Aktion wird ohne exakten Bestaetigungstext blockiert', () => {
  const sicherung = new BedienSicherung();
  const basis = {
    risiko: 'kritisch',
    erforderlicherBestaetigungsText: 'DATEN ENDGUELTIG LOESCHEN'
  };
  assert.equal(sicherung.pruefe(anfrage(basis)).erlaubt, false);
  assert.equal(sicherung.pruefe(anfrage({ ...basis, eingegebenerBestaetigungsText: 'loeschen' })).erlaubt, false);
  assert.equal(sicherung.pruefe(anfrage({ ...basis, eingegebenerBestaetigungsText: 'DATEN ENDGUELTIG LOESCHEN' })).erlaubt, true);
});

test('nicht ausreichend erklaerte Aktionen werden blockiert', () => {
  const sicherung = new BedienSicherung();
  const ergebnis = sicherung.pruefe(anfrage({ erklaerung: '' }));
  assert.equal(ergebnis.erlaubt, false);
  assert.match(ergebnis.grund, /nicht ausreichend erklaert/);
});
