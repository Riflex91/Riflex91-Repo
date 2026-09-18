import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bewerteRuntimeGesundheit,
  erstelleRuntimeGesundheitsKonfiguration
} from '../../erzeugt/telemetrie/runtime-gesundheit.js';

function beobachtung(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: 100_000,
    laufzeitGestartetAm: 90_000,
    snapshotErwartet: true,
    letzterSnapshotAm: 99_500,
    heartbeatErwartet: true,
    letzterHeartbeatAm: 99_000,
    fachlicherFortschrittErwartet: true,
    letzterFachlicherFortschrittAm: 98_500,
    gruppenLiveness: 'gesund',
    sicherheitsStufe: 'sicher',
    offeneAktionsAnfragen: 0,
    abgebrocheneAktionsAnfragen: 0,
    kritischerLaufzeitFehler: false,
    ...aenderungen
  });
}

const cfg = erstelleRuntimeGesundheitsKonfiguration({
  beobachtenNachMillisekunden: 5_000,
  sicherPausierenNachMillisekunden: 15_000,
  neustartEmpfehlenNachMillisekunden: 60_000
});

test('Block 8.5.3: gesunde Runtime bleibt normal und besitzt keine Neustartautoritaet', () => {
  const status = bewerteRuntimeGesundheit(beobachtung(), cfg);

  assert.equal(status.recoveryStufe, 'normal');
  assert.equal(status.hostNeustartEmpfohlen, false);
  assert.equal(status.automatischerNeustart, false);
  assert.equal(status.mussNutzerHandeln, false);
  assert.equal(status.snapshotAlterMillisekunden, 500);
  assert.equal(status.heartbeatAlterMillisekunden, 1_000);
  assert.equal(status.fachlicherFortschrittAlterMillisekunden, 1_500);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.gruende), true);
});

test('Block 8.5.3: alter fachlicher Fortschritt fuehrt stufenweise zu beobachten und sicherer Pause', () => {
  const beobachten = bewerteRuntimeGesundheit(beobachtung({
    letzterFachlicherFortschrittAm: 95_000
  }), cfg);
  assert.equal(beobachten.recoveryStufe, 'beobachten');

  const pausiert = bewerteRuntimeGesundheit(beobachtung({
    letzterFachlicherFortschrittAm: 85_000,
    laufzeitGestartetAm: 80_000
  }), cfg);
  assert.equal(pausiert.recoveryStufe, 'sicher_pausiert');
  assert.equal(pausiert.hostNeustartEmpfohlen, false);
  assert.equal(pausiert.automatischerNeustart, false);
});

test('Block 8.5.3: lange Freshness-Luecke empfiehlt nur externen Neustart', () => {
  const status = bewerteRuntimeGesundheit(beobachtung({
    laufzeitGestartetAm: 10_000,
    letzterSnapshotAm: 39_999,
    letzterHeartbeatAm: 99_000,
    letzterFachlicherFortschrittAm: 98_000
  }), cfg);

  assert.equal(status.recoveryStufe, 'neustart_empfohlen');
  assert.equal(status.hostNeustartEmpfohlen, true);
  assert.equal(status.automatischerNeustart, false);
  assert.equal(status.mussNutzerHandeln, true);
  assert.equal(status.snapshotAlterMillisekunden, 60_001);
});

test('Block 8.5.3: fehlender erwarteter Heartbeat wird ab Laufzeitstart gealtert', () => {
  const status = bewerteRuntimeGesundheit(beobachtung({
    zeitpunkt: 120_000,
    laufzeitGestartetAm: 100_000,
    letzterSnapshotAm: 119_000,
    letzterHeartbeatAm: null,
    letzterFachlicherFortschrittAm: 119_000
  }), cfg);

  assert.equal(status.heartbeatAlterMillisekunden, 20_000);
  assert.equal(status.recoveryStufe, 'sicher_pausiert');
});

test('Block 8.5.3: nicht erwarteter fachlicher Fortschritt erzeugt keinen falschen Stillstand', () => {
  const status = bewerteRuntimeGesundheit(beobachtung({
    zeitpunkt: 200_000,
    laufzeitGestartetAm: 100_000,
    letzterSnapshotAm: 199_500,
    letzterHeartbeatAm: 199_000,
    fachlicherFortschrittErwartet: false,
    letzterFachlicherFortschrittAm: null
  }), cfg);

  assert.equal(status.fachlicherFortschrittAlterMillisekunden, null);
  assert.equal(status.recoveryStufe, 'normal');
});

test('Block 8.5.3: degradierte oder unbekannte Gruppen-Liveness empfiehlt sichere Pause', () => {
  const degradiert = bewerteRuntimeGesundheit(beobachtung({ gruppenLiveness: 'degradiert' }), cfg);
  assert.equal(degradiert.recoveryStufe, 'sicher_pausiert');
  assert.match(degradiert.grund, /degradiert/);

  const unbekannt = bewerteRuntimeGesundheit(beobachtung({ gruppenLiveness: 'unbekannt' }), cfg);
  assert.equal(unbekannt.recoveryStufe, 'sicher_pausiert');
  assert.match(unbekannt.grund, /unbekannt/);
});

test('Block 8.5.3: unbekannte Safety oder kritischer Laufzeitfehler blockiert fail-safe', () => {
  const safety = bewerteRuntimeGesundheit(beobachtung({ sicherheitsStufe: 'unbekannt' }), cfg);
  assert.equal(safety.recoveryStufe, 'blockiert');
  assert.equal(safety.mussNutzerHandeln, true);
  assert.equal(safety.automatischerNeustart, false);

  const fehler = bewerteRuntimeGesundheit(beobachtung({ kritischerLaufzeitFehler: true }), cfg);
  assert.equal(fehler.recoveryStufe, 'blockiert');
  assert.match(fehler.grund, /kritischer Laufzeitfehler/);
});

test('Block 8.5.3: zeitlich unplausible Freshness blockiert statt Alter zu raten', () => {
  const status = bewerteRuntimeGesundheit(beobachtung({
    letzterHeartbeatAm: 100_001
  }), cfg);

  assert.equal(status.recoveryStufe, 'blockiert');
  assert.match(status.grund, /zeitlich unplausibel/);
  assert.equal(status.heartbeatAlterMillisekunden, null);
});

test('Block 8.5.3: Konfigurationsgrenzen muessen streng aufsteigend sein', () => {
  assert.throws(
    () => erstelleRuntimeGesundheitsKonfiguration({
      beobachtenNachMillisekunden: 5_000,
      sicherPausierenNachMillisekunden: 5_000,
      neustartEmpfehlenNachMillisekunden: 60_000
    }),
    /muss groesser/
  );
  assert.throws(
    () => erstelleRuntimeGesundheitsKonfiguration({
      beobachtenNachMillisekunden: 5_000,
      sicherPausierenNachMillisekunden: 15_000,
      neustartEmpfehlenNachMillisekunden: 15_000
    }),
    /muss groesser/
  );
});
