import test from 'node:test';
import assert from 'node:assert/strict';
import {
  installiereAdventureLandProduktionsLaufzeit,
  PRODUKTIONS_LAUFZEIT_GLOBALER_NAME
} from '../../erzeugt/ausfuehrung/adventure-land-produktions-einstieg.js';

function spiel() {
  const parent = {
    character: {
      id: 'ranger-1', name: 'My_Ranger1', ctype: 'ranger', level: 80,
      hp: 900, max_hp: 1000, mp: 700, max_mp: 800, xp: 1, max_xp: 2, gold: 100,
      attack: 100, frequency: 1, speed: 40, range: 100, armor: 10, resistance: 10,
      map: 'main', in: 'main', x: 0, y: 0, real_x: 0, real_y: 0, moving: false,
      target: null, rip: false, stand: false, items: [], slots: {}
    },
    entities: {}, party: {}, G: {}, server_region: 'EU', server_identifier: 'I',
    is_on_cooldown: () => false
  };
  const code = { parent, character: parent.character, on_cm: undefined };
  return { code, parent };
}

test('V4 Produktionslaufzeit installiert standardmaessig nur eine gesperrte eingefrorene API', () => {
  const u = spiel();
  const api = installiereAdventureLandProduktionsLaufzeit(u.code);
  assert.equal(u.code[PRODUKTIONS_LAUFZEIT_GLOBALER_NAME], api);
  assert.equal(Object.isFrozen(api), true);
  assert.equal(api.status().aktivFreigegeben, false);
  assert.equal(api.status().empfangInstalliert, false);
  const gestartet = api.starte();
  assert.equal(gestartet.empfangInstalliert, true);
  assert.throws(() => api.bereiteGruppenZielVor(api.gruppenzielFreigabeText()), /standardmaessig gesperrt/);
});

test('V4 Produktionslaufzeit verlangt bei aktiver Freigabe ein explizites Faehigkeitsprofil', () => {
  const u = spiel();
  assert.throws(
    () => installiereAdventureLandProduktionsLaufzeit(u.code, { aktivFreigegeben: true }),
    /explizites Gruppenfaehigkeitsprofil/
  );
});

test('V4 Produktionslaufzeit ueberschreibt keine bestehende globale Laufzeit', () => {
  const u = spiel();
  Object.defineProperty(u.code, PRODUKTIONS_LAUFZEIT_GLOBALER_NAME, {
    configurable: true,
    value: Object.freeze({ fremd: true })
  });
  assert.throws(() => installiereAdventureLandProduktionsLaufzeit(u.code), /bereits vorhanden/);
  assert.deepEqual(u.code[PRODUKTIONS_LAUFZEIT_GLOBALER_NAME], { fremd: true });
});

test('V4 Produktionslaufzeit stoppt den installierten Empfang fail-safe', () => {
  const u = spiel();
  const api = installiereAdventureLandProduktionsLaufzeit(u.code);
  api.starte();
  assert.equal(typeof u.code.on_cm, 'function');
  const status = api.stoppe();
  assert.equal(status.empfangInstalliert, false);
});
