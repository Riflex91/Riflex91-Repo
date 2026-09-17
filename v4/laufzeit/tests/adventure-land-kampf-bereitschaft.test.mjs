import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandKampfBereitschaftLesezugriff } from '../../erzeugt/adventure-land/adventure-land-kampf-bereitschaft.js';

test('Adventure-Land-Bereitschaft liest Attack-Cooldown ohne Spielaktion', () => {
  const aufrufe = [];
  const parent = {
    next_skill: { attack: new Date(1275) }
  };
  const spielFenster = {
    parent,
    G: { skills: { attack: {} } },
    is_on_cooldown(name) {
      aufrufe.push(name);
      return true;
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

test('nicht aktiver Cooldown wird als bereit beobachtet', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({ is_on_cooldown: () => false });
  const ergebnis = leser.liesNormalenAngriff(2000);
  assert.equal(ergebnis.zustand, 'bereit');
  assert.equal(ergebnis.restMillisekunden, 0);
  assert.equal(ergebnis.bereitAb, 2000);
});

test('geteilter Adventure-Land-Cooldown wird ueber G.skills.share aufgeloest', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({
    G: { skills: { attack: { share: 'shared_attack' }, shared_attack: {} } },
    parent: { next_skill: { shared_attack: new Date(2600) } },
    is_on_cooldown: () => true
  });
  const ergebnis = leser.liesNormalenAngriff(2000);
  assert.equal(ergebnis.zustand, 'abklingzeit');
  assert.equal(ergebnis.bereitAb, 2600);
  assert.equal(ergebnis.restMillisekunden, 600);
});

test('bekannter Cooldown bleibt auch ohne beobachtbare Restdauer bekannt', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({ is_on_cooldown: () => true });
  const ergebnis = leser.liesNormalenAngriff(3000);
  assert.equal(ergebnis.zustand, 'abklingzeit');
  assert.equal(ergebnis.bereitAb, null);
  assert.equal(ergebnis.restMillisekunden, null);
  assert.match(ergebnis.grund, /exakte Restzeit ist nicht beobachtbar/);
});

test('can_use ist nur positiver Fallback und erfindet bei false keinen Cooldown', () => {
  const bereit = new AdventureLandKampfBereitschaftLesezugriff({ can_use: () => true }).liesNormalenAngriff(4000);
  assert.equal(bereit.zustand, 'bereit');
  assert.equal(bereit.bereitAb, 4000);

  const unbekannt = new AdventureLandKampfBereitschaftLesezugriff({ can_use: () => false }).liesNormalenAngriff(4000);
  assert.equal(unbekannt.zustand, 'unbekannt');
  assert.match(unbekannt.grund, /Ursache nicht als Cooldown geraten/);
});

test('Cooldown-Funktion darf auch nur im Parent-Kontext liegen', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({
    parent: {
      is_on_cooldown: () => false
    }
  });
  const ergebnis = leser.liesNormalenAngriff(5000);
  assert.equal(ergebnis.zustand, 'bereit');
});

test('fehlende Cooldown-Schnittstelle wird nicht durch eine Annahme ersetzt', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({});
  const ergebnis = leser.liesNormalenAngriff(6000);
  assert.equal(ergebnis.zustand, 'unbekannt');
  assert.equal(ergebnis.bereitAb, null);
  assert.equal(ergebnis.restMillisekunden, null);
});

test('Fehler beim Lesen des Cooldowns bleiben als unbekannte Bereitschaft sichtbar', () => {
  const leser = new AdventureLandKampfBereitschaftLesezugriff({
    is_on_cooldown() {
      throw new Error('testfehler');
    }
  });
  const ergebnis = leser.liesNormalenAngriff(7000);
  assert.equal(ergebnis.zustand, 'unbekannt');
  assert.match(ergebnis.grund, /testfehler/);
});
