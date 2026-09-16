import test from 'node:test';
import assert from 'node:assert/strict';
import { AuftragsPruefung } from '../erzeugt/kern/auftrags-pruefung.js';

const bekannteGegenstaende = new Set(['bee_wing', 'test_rezept']);

function beispiel(overrides = {}) {
  return {
    auftragKennung: 'auftrag-1',
    erstelltAm: 1,
    art: 'sammeln',
    gegenstandKennung: 'bee_wing',
    gegenstandName: 'Bienenfluegel',
    zielMenge: 200,
    mengenZielArt: 'zusaetzlich',
    zustand: 'entwurf',
    urspruenglicheEingabe: 'Sammle 200 Bienenfluegel',
    ...overrides
  };
}

test('gueltiger Sammelauftrag wird angenommen', () => {
  const ergebnis = new AuftragsPruefung().pruefe(beispiel(), bekannteGegenstaende);
  assert.equal(ergebnis.gueltig, true);
  assert.deepEqual(ergebnis.fehler, []);
});

test('unbekannter Gegenstand wird blockiert', () => {
  const ergebnis = new AuftragsPruefung().pruefe(beispiel({ gegenstandKennung: 'unbekannt' }), bekannteGegenstaende);
  assert.equal(ergebnis.gueltig, false);
  assert.ok(ergebnis.fehler.some((text) => text.includes('nicht eindeutig bekannt')));
});

test('ungueltige Zielmenge wird blockiert', () => {
  const ergebnis = new AuftragsPruefung().pruefe(beispiel({ zielMenge: 0 }), bekannteGegenstaende);
  assert.equal(ergebnis.gueltig, false);
  assert.ok(ergebnis.fehler.some((text) => text.includes('positive ganze Zahl')));
});

test('Freitext ist keine Voraussetzung fuer die Ausfuehrung', () => {
  const ergebnis = new AuftragsPruefung().pruefe(beispiel({ urspruenglicheEingabe: '   ' }), bekannteGegenstaende);
  assert.equal(ergebnis.gueltig, true);
  assert.equal(ergebnis.warnungen.length, 1);
});
