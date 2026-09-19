import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const runnerCode = await readFile(
  new URL('../../werkzeuge/block8-6-freigabestufen-live-test.js', import.meta.url),
  'utf8'
);

function statusObjekt({ aktiv = false, sendVersuche = 0, sendErfolge = 0, sendFehler = 0 } = {}) {
  return {
    schemaVersion: 1,
    version: '1.0.0',
    aktivFreigegeben: aktiv,
    ablaufKennung: 'test',
    remoteBeobachtungInstalliert: false,
    capabilityEmpfangInstalliert: false,
    beobachteteLebensnachweise: 0,
    empfangeneCapabilitySnapshots: 0,
    senden: {
      versuche: sendVersuche,
      erfolge: sendErfolge,
      fehler: sendFehler,
      letzterFehler: null
    },
    audit: null,
    faehigkeiten: null,
    lokalerSnapshot: null,
    remoteVertrauen: [],
    gruppenwahl: null,
    capabilityStatus: null,
    spielAutoritaet: false,
    neustartAutoritaet: false
  };
}

function schattenKontext() {
  let capStatus = statusObjekt({ aktiv: false });
  const context = {
    console,
    AIO_V4_BLOCK86_FREIGABE_CONFIG: {
      aenderungsKennung: 'git:test',
      laufKennung: 'lauf-shadow',
      modus: 'schatten'
    },
    AIO_V4_CAPABILITY_CONFIG: {
      vertrauensNamen: ['RangerA', 'RangerB']
    },
    V4Block86Candidate: { version: '1.0.0' },
    V4ProduktionsLaufzeit: {
      version: '1.1.5',
      status() {
        return {
          aktivFreigegeben: false,
          empfangInstalliert: false,
          lebensnachweisAutomatikAktiv: false,
          lebensnachweisSendeVersuche: 0,
          lebensnachweisSendeErfolge: 0,
          lebensnachweisSendeFehler: 0
        };
      }
    },
    V4CapabilityLaufzeit: {
      version: '1.0.0',
      status() { return capStatus; },
      aktualisiere() {
        capStatus = {
          ...capStatus,
          audit: {
            produktionsbereit: true,
            katalog: { fingerprint: 'a'.repeat(64) }
          },
          faehigkeiten: { fingerprint: 'b'.repeat(64) },
          lokalerSnapshot: { fingerprint: 'c'.repeat(64) },
          capabilityStatus: {
            charakterName: 'RangerA',
            spielAutoritaet: false
          }
        };
        return { status: capStatus, lokalerSnapshot: capStatus.lokalerSnapshot };
      }
    },
    Date
  };
  context.globalThis = context;
  return context;
}

function liveKontext() {
  let sends = 0;
  let capStatus = {
    ...statusObjekt({ aktiv: true }),
    capabilityStatus: { charakterName: 'RangerA', spielAutoritaet: false }
  };
  const context = {
    console,
    AIO_V4_BLOCK86_FREIGABE_CONFIG: {
      aenderungsKennung: 'git:test',
      laufKennung: 'lauf-live',
      modus: 'live',
      schattenUebergabe: {
        laufKennung: 'lauf-live',
        aenderungsKennung: 'git:test',
        nachweis: { ergebnis: 'bestanden' }
      }
    },
    AIO_V4_CAPABILITY_CONFIG: {
      vertrauensNamen: ['RangerA', 'RangerB']
    },
    V4Block86Candidate: { version: '1.0.0' },
    V4ProduktionsLaufzeit: {
      version: '1.1.5',
      status() {
        return {
          aktivFreigegeben: true,
          empfangInstalliert: true,
          lebensnachweisAutomatikAktiv: true,
          lebensnachweisSendeVersuche: 4,
          lebensnachweisSendeErfolge: 4,
          lebensnachweisSendeFehler: 0
        };
      }
    },
    V4CapabilityLaufzeit: {
      version: '1.0.0',
      status() { return capStatus; },
      installiereRemoteBeobachtung() {
        capStatus = {
          ...capStatus,
          remoteBeobachtungInstalliert: true,
          capabilityEmpfangInstalliert: true
        };
        return capStatus;
      },
      aktualisiere() {
        return {
          status: capStatus,
          lokalerSnapshot: { fingerprint: 'c'.repeat(64) }
        };
      },
      sendeBestaetigungsText(name) {
        return 'BLOCK8-6-CAPABILITY-SENDEN:' + name;
      },
      async sendeCapabilityEinmal(zielName) {
        sends += 1;
        capStatus = {
          ...capStatus,
          senden: {
            versuche: sends,
            erfolge: sends,
            fehler: 0,
            letzterFehler: null
          }
        };
        return {
          ergebnis: {
            schemaVersion: 1,
            zielName,
            gesendet: true,
            grund: 'test'
          },
          status: capStatus
        };
      }
    },
    Date
  };
  context.globalThis = context;
  return context;
}

function soakKontext() {
  let jetzt = 0;
  let heartbeatErfolge = 5;
  let capStatus = {
    ...statusObjekt({ aktiv: true }),
    remoteBeobachtungInstalliert: true,
    capabilityEmpfangInstalliert: true,
    audit: {
      produktionsbereit: true,
      katalog: { fingerprint: 'a'.repeat(64) }
    },
    lokalerSnapshot: { fingerprint: 'c'.repeat(64) }
  };

  const context = {
    console,
    AIO_V4_BLOCK86_FREIGABE_CONFIG: {
      aenderungsKennung: 'git:test',
      laufKennung: 'lauf-soak',
      modus: 'soak',
      soakDauerMillisekunden: 600000,
      sampleMillisekunden: 5000,
      recoveryReplayVerified: true,
      schattenUebergabe: {
        laufKennung: 'lauf-soak',
        aenderungsKennung: 'git:test',
        nachweis: { ergebnis: 'bestanden' }
      },
      liveUebergabe: {
        laufKennung: 'lauf-soak',
        aenderungsKennung: 'git:test',
        nachweis: { ergebnis: 'bestanden' }
      }
    },
    AIO_V4_CAPABILITY_CONFIG: {
      vertrauensNamen: ['RangerA', 'RangerB']
    },
    V4Block86Candidate: { version: '1.0.0' },
    V4ProduktionsLaufzeit: {
      version: '1.1.5',
      status() {
        return {
          aktivFreigegeben: true,
          empfangInstalliert: true,
          lebensnachweisAutomatikAktiv: true,
          lebensnachweisSendeVersuche: heartbeatErfolge,
          lebensnachweisSendeErfolge: heartbeatErfolge,
          lebensnachweisSendeFehler: 0
        };
      }
    },
    V4CapabilityLaufzeit: {
      version: '1.0.0',
      status() { return capStatus; },
      installiereRemoteBeobachtung() { return capStatus; },
      aktualisiere() {
        return {
          status: capStatus,
          lokalerSnapshot: capStatus.lokalerSnapshot
        };
      }
    },
    Date: class extends Date {
      static now() { return jetzt; }
    },
    setInterval(fn, ms) {
      for (let i = 0; i < 120; i += 1) {
        jetzt += ms;
        heartbeatErfolge += 1;
        fn();
      }
      return 1;
    },
    clearInterval() {}
  };
  context.globalThis = context;
  return context;
}

function lade(context) {
  const vmContext = vm.createContext(context);
  vm.runInContext(runnerCode, vmContext, {
    filename: 'block8-6-freigabestufen-live-test.js'
  });
  return vmContext.V4Block86FreigabeLiveTest;
}

test('8.6.9: Schattenrunner erzeugt Nachweis bei 0 Heartbeat- und Capability-Sendungen', () => {
  const api = lade(schattenKontext());
  const bericht = api.schatten();

  assert.equal(bericht.pass, true);
  assert.equal(bericht.nachweis.stufe, 'schatten');
  assert.equal(bericht.nachweis.spielAktionAusgefuehrt, false);
  assert.equal(bericht.runtimeHeartbeatVersuche, 0);
  assert.equal(bericht.capabilitySendeVersuche, 0);
  assert.ok(bericht.schattenUebergabe);
});

test('8.6.9: kontrolliert live sendet genau an anderen vertrauten Charakter und bleibt begrenzt', async () => {
  const api = lade(liveKontext());
  const bericht = await api.kontrolliertLive('BLOCK8-6-KONTROLLIERT-LIVE:lauf-live');

  assert.equal(bericht.pass, true);
  assert.deepEqual(Array.from(bericht.ziele), ['RangerB']);
  assert.equal(bericht.sendeErgebnisse.length, 1);
  assert.equal(bericht.nachweis.spielAktionAusgefuehrt, true);
  assert.equal(bericht.nachweis.begrenzt, true);
  assert.ok(bericht.liveUebergabe);
});

test('8.6.9: kontrolliert live verlangt exakten bestaetigten Lauftext', async () => {
  const api = lade(liveKontext());
  await assert.rejects(
    () => api.kontrolliertLive('FALSCH'),
    /Falscher Bestaetigungstext/
  );
});

test('8.6.9: Soak verlangt Recovery-Replay-Bindung und erzeugt 10-Minuten-Telemetrienachweis', async () => {
  const api = lade(soakKontext());
  const bericht = await api.soak('BLOCK8-6-SOAK-STARTEN:lauf-soak');

  assert.equal(bericht.pass, true);
  assert.equal(bericht.dauerMillisekunden, 600000);
  assert.equal(bericht.samples, 120);
  assert.equal(bericht.erwarteteSamples, 118);
  assert.ok(bericht.heartbeatErfolgeNachher > bericht.heartbeatErfolgeVorher);
  assert.equal(bericht.nachweis.telemetrieNachweis, true);
  assert.equal(bericht.nachweis.recoveryNachweis, true);
  assert.equal(bericht.nachweis.gesamtauswertungBestanden, true);
});

test('8.6.9: Runner besitzt keine direkte Adventure-Land-Spielaktionsfunktion', () => {
  for (const name of [
    'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
    'use_hp_or_mp', 'loot', 'send_cm', 'command_character',
    'send_party_invite', 'buy', 'sell', 'send_item', 'upgrade', 'compound'
  ]) {
    assert.doesNotMatch(runnerCode, new RegExp('\\b' + name + '\\s*\\('));
  }
});

test('8.6.9: Runner startet oder stoppt die Produktionsruntime nicht selbst', () => {
  assert.doesNotMatch(runnerCode, /runtime\.starte\s*\(/);
  assert.doesNotMatch(runnerCode, /runtime\.stoppe\s*\(/);
  assert.doesNotMatch(runnerCode, /pausiereLebensnachweisAutomatik\s*\(/);
  assert.doesNotMatch(runnerCode, /setzeLebensnachweisAutomatikFort\s*\(/);
});
