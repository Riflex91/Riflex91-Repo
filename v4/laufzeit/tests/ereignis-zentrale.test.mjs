import test from 'node:test';
import assert from 'node:assert/strict';
import { EreignisZentrale } from '../../erzeugt/kern/ereignis-zentrale.js';

function ereignis(laufendeNummer, name = 'TEST') {
  return { kennung: `e-${laufendeNummer}`, laufendeNummer, zeitpunkt: laufendeNummer, name, quelle: 'test', ablaufKennung: 'ablauf-1', details: {} };
}

test('Ereignisse werden in Anmeldereihenfolge zugestellt und ein defekter Empfaenger blockiert die anderen nicht', () => {
  const zentrale = new EreignisZentrale();
  const gesehen = [];
  zentrale.fuegeEmpfaengerHinzu('TEST', () => { gesehen.push('erster'); throw new Error('absichtlicher Testfehler'); });
  zentrale.fuegeEmpfaengerHinzu('TEST', () => gesehen.push('zweiter'));
  zentrale.fuegeEmpfaengerHinzu('*', () => gesehen.push('alle'));

  const bericht = zentrale.sendeEreignis(ereignis(1));
  assert.deepEqual(gesehen, ['erster', 'zweiter', 'alle']);
  assert.equal(bericht.zugestelltAn, 3);
  assert.equal(bericht.fehler.length, 1);
});

test('Doppelte oder aeltere Ereignisnummern werden abgelehnt', () => {
  const zentrale = new EreignisZentrale();
  zentrale.sendeEreignis(ereignis(2));
  assert.throws(() => zentrale.sendeEreignis(ereignis(2)), /muss steigen/);
  assert.throws(() => zentrale.sendeEreignis(ereignis(1)), /muss steigen/);
});
