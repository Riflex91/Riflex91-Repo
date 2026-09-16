import test from 'node:test';
import assert from 'node:assert/strict';
import { RessourcenVergabe } from '../../erzeugt/kern/ressourcen-vergabe.js';

test('Mehrere Ressourcen werden gemeinsam oder gar nicht gesperrt', () => {
  const vergabe = new RessourcenVergabe();
  vergabe.versucheRessourcenZuSperren({ besitzer: 'bank', ressourcen: ['inventar'], prioritaet: 50, darfUnterbrochenWerden: false, angefordertAm: 1 });

  const ergebnis = vergabe.versucheRessourcenZuSperren({ besitzer: 'merchant-service', ressourcen: ['bewegung', 'inventar'], prioritaet: 100, darfUnterbrochenWerden: false, angefordertAm: 2 });

  assert.equal(ergebnis.gesperrt, false);
  assert.equal(vergabe.holeRessourcenSperre('bewegung'), null);
  assert.equal(vergabe.holeRessourcenSperre('inventar')?.besitzer, 'bank');
});

test('Hoeher priorisierte Arbeit darf einen unterbrechbaren Besitzer vollstaendig abloesen', () => {
  const vergabe = new RessourcenVergabe();
  vergabe.versucheRessourcenZuSperren({ besitzer: 'erkundung', ressourcen: ['bewegung', 'ausruestung'], prioritaet: 10, darfUnterbrochenWerden: true, angefordertAm: 1 });

  const ergebnis = vergabe.versucheRessourcenZuSperren({ besitzer: 'rueckzug', ressourcen: ['bewegung'], prioritaet: 1000, darfUnterbrochenWerden: false, angefordertAm: 2 });

  assert.equal(ergebnis.gesperrt, true);
  assert.deepEqual(ergebnis.unterbrocheneBesitzer, ['erkundung']);
  assert.equal(vergabe.holeRessourcenSperre('bewegung')?.besitzer, 'rueckzug');
  assert.equal(vergabe.holeRessourcenSperre('ausruestung'), null);
});
