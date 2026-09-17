import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandKampfBereitschaftLesezugriff } from '../../erzeugt/adventure-land/adventure-land-kampf-bereitschaft.js';

test('Adventure-Land-Bereitschaft liest Attack-Cooldown ohne Spielaktion', () => {
  const aufrufe = [];
  const spielFenster = {
    ms_to_next_skill(name) {
      aufrufe.push(name);
      return 275;
    },
    attack() {
      throw new Error('attack darf beim Lesen der Bereitschaft nicht aufgerufen werden');
    },
    move() {
      throw new Error('move darf beim Lesen der Bereitschaft nicht aufgerufen werden');
    }
  };

  const leser = new AdventureLandKampfBereitschaftLesezugriff(spielFenster);
  const ergebnis = leser.liesNormalenAngriff(1000);

  assert.deepEqual(aufrufe, ['attack']);
  assert.equal(ergebnis.zustand, 'abklingzeit');
  assert.equal(ergebnis.restMillisekunden, 275);
  assert.equal(ergebnis.bereitAb, 1275);
});

test('abgelaufener Cooldown wird als bereit beobachtet', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({ ms_to_next_skill: () => -25 });
  const ergebnis = leser.liesNormalenAngriff(2000);
  assert.equal(ergebnis.zustand, 'bereit');
  assert.equal(ergebnis.restMillisekunden, 0);
  assert.equal(ergebnis.bereitAb, 2000);
});

test('fehlende Cooldown-Schnittstelle wird nicht durch eine Annahme ersetzt', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({});
  const ergebnis = leser.liesNormalenAngriff(3000);
  assert.equal(ergebnis.zustand, 'unbekannt');
  assert.equal(ergebnis.bereitAb, null);
  assert.equal(ergebnis.restMillisekunden, null);
});

test('Fehler beim Lesen des Cooldowns bleiben als unbekannte Bereitschaft sichtbar', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({
    ms_to_next_skill() {
      throw new Error('testfehler');
    }
  });
  const ergebnis = leser.liesNormalenAngriff(4000);
  assert.equal(ergebnis.zustand, 'unbekannt');
  assert.match(ergebnis.grund, /testfehler/);
});
