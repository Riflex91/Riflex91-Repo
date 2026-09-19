import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const zielPfad = path.join(wurzel, 'werkzeuge', 'block8-6-schatten-paket.js');
const guiPfad = path.join(wurzel, 'werkzeuge', 'adventure-land-test-gui.js');
const runnerPfad = path.join(wurzel, 'werkzeuge', 'block8-6-freigabestufen-live-test.js');

export const BLOCK86_SCHATTEN_RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';
export const BLOCK86_SCHATTEN_CANDIDATE_SHA256 = 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5';
export const BLOCK86_SCHATTEN_CANDIDATE_BYTES = 396471;
export const BLOCK86_SCHATTEN_CANDIDATE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js';

function kopf() {
  return `/* GENERATED: V4 Block 8.6.9 striktes Schatten-Komplettpaket.
 * Quelle: block8-6-schatten-paket-bauen.mjs
 * Candidate wird immutable per HTTPS+SHA geladen, aber die Produktionsruntime wird NICHT gestartet.
 * Capability-Remote-Beobachtung und Capability-Senden bleiben im Schatten gesperrt.
 */
(() => {
  'use strict';

  const belegteNamen = [
    'AIO_V4_RUNTIME_CONFIG',
    'AIO_V4_CAPABILITY_CONFIG',
    'AIO_V4_BLOCK86_FREIGABE_CONFIG',
    'V4ProduktionsLaufzeit',
    'V4CapabilityLaufzeit',
    'V4Block86Candidate',
    'V4Block86FreigabeLiveTest',
    'V4TestGui',
    'V4Block86SchattenLauncher'
  ].filter((name) => globalThis[name] !== undefined);
  if (belegteNamen.length > 0) {
    throw new Error(
      'Block-8.6-Schattenpaket verlangt einen frischen Codekontext; bereits vorhanden: ' +
      belegteNamen.join(', ')
    );
  }

  const laufKennung = 'block8-6-schatten-' + String(Date.now());
  function setzeGlobal(name, wert) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: wert
    });
  }

  setzeGlobal('AIO_V4_RUNTIME_CONFIG', Object.freeze({
    aktivFreigegeben: false,
    ablaufKennung: laufKennung
  }));
  setzeGlobal('AIO_V4_CAPABILITY_CONFIG', Object.freeze({
    aktivFreigegeben: false,
    ablaufKennung: laufKennung,
    vertrauensNamen: Object.freeze([]),
    koordinationsNamen: Object.freeze([]),
    policyVorgaben: Object.freeze([])
  }));
  setzeGlobal('AIO_V4_BLOCK86_FREIGABE_CONFIG', Object.freeze({
    aenderungsKennung: 'git:ca0dfee7685563c8b6003469300c8fd08777b053',
    laufKennung,
    modus: 'schatten',
    soakDauerMillisekunden: 600000,
    sampleMillisekunden: 5000,
    recoveryReplayVerified: true
  }));
})();
`;
}

function fuss(runnerSource) {
  return `
/* ===== BEGIN Block-8.6-Schatten-Launcher ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Block86SchattenLauncher';
  const VERSION = '1.0.0';
  const RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';
  const CANDIDATE_SHA256 = 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5';
  const CANDIDATE_BYTES = 396471;
  const CANDIDATE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js';
  const CANDIDATE_MARKER = 'Adventure Land AiO Bot V4 | generated | Block 8.6 capability release candidate';
  const RUNNER_SOURCE = ${JSON.stringify(runnerSource)};

  const guiApi = globalThis.V4TestGui;
  if (!guiApi || typeof guiApi.erstelleTest !== 'function') {
    throw new Error('V4TestGui fehlt im Block-8.6-Schattenpaket.');
  }

  const test = guiApi.erstelleTest({
    kennung: 'block8-6-schatten-' + globalThis.AIO_V4_BLOCK86_FREIGABE_CONFIG.laufKennung,
    titel: 'V4 Block 8.6.9 · Schattennachweis',
    beschreibung:
      'Laedt exakt den immutable Block-8.6-Candidate. Runtime und Capability-Schicht bleiben deaktiviert; es werden keine Heartbeats oder Capability-Snapshots gesendet.'
  });

  const zustand = {
    phase: 'laedt',
    bereit: false,
    fehler: null,
    laufKennung: globalThis.AIO_V4_BLOCK86_FREIGABE_CONFIG.laufKennung,
    candidateUrl: CANDIDATE_URL,
    candidateSha256: CANDIDATE_SHA256,
    candidateBytes: CANDIDATE_BYTES,
    geladenerSha256: null,
    letzterBericht: null
  };

  function fehlerText(ursache) {
    return ursache instanceof Error ? ursache.message : String(ursache);
  }

  async function berechneSha256(code) {
    if (!globalThis.crypto?.subtle || typeof globalThis.TextEncoder !== 'function') {
      throw new Error('Web-Crypto oder TextEncoder ist fuer die Candidate-Hashpruefung nicht verfuegbar.');
    }
    const bytes = new globalThis.TextEncoder().encode(code);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (wert) => wert.toString(16).padStart(2, '0')).join('');
  }

  function pruefeSchattenPreflight() {
    const candidate = globalThis.V4Block86Candidate;
    const runtime = globalThis.V4ProduktionsLaufzeit;
    const capability = globalThis.V4CapabilityLaufzeit;
    const runner = globalThis.V4Block86FreigabeLiveTest;
    const fehler = [];

    if (!candidate || candidate.version !== '1.0.0') fehler.push('V4Block86Candidate 1.0.0');
    if (candidate?.spielAutoritaet !== false) fehler.push('Candidate spielAutoritaet=false');
    if (candidate?.neustartAutoritaet !== false) fehler.push('Candidate neustartAutoritaet=false');
    if (!runtime || runtime.version !== '1.1.5') fehler.push('V4ProduktionsLaufzeit 1.1.5');
    if (!capability || capability.version !== '1.0.0') fehler.push('V4CapabilityLaufzeit 1.0.0');
    if (!runner || runner.version !== '1.0.0') fehler.push('V4Block86FreigabeLiveTest 1.0.0');
    if (runner?.modus !== 'schatten') fehler.push('Runner modus=schatten');
    if (runner?.aenderungsKennung !== 'git:ca0dfee7685563c8b6003469300c8fd08777b053') fehler.push('Runner Candidate-Bindung');
    if (runner?.laufKennung !== zustand.laufKennung) fehler.push('Runner Laufbindung');

    const runtimeStatus = runtime?.status?.();
    if (runtimeStatus?.aktivFreigegeben !== false) fehler.push('Runtime aktivFreigegeben=false');
    if (runtimeStatus?.empfangInstalliert !== false) fehler.push('Runtime empfangInstalliert=false');
    if (runtimeStatus?.lebensnachweisAutomatikAktiv !== false) fehler.push('Heartbeat inaktiv');
    if (runtimeStatus?.lebensnachweisSendeVersuche !== 0) fehler.push('Heartbeat-Versuche=0');
    if (runtimeStatus?.lebensnachweisSendeErfolge !== 0) fehler.push('Heartbeat-Erfolge=0');
    if (runtimeStatus?.lebensnachweisSendeFehler !== 0) fehler.push('Heartbeat-Fehler=0');

    const capStatus = capability?.status?.();
    if (capStatus?.aktivFreigegeben !== false) fehler.push('Capability aktivFreigegeben=false');
    if (capStatus?.remoteBeobachtungInstalliert !== false) fehler.push('Capability Remote-Beobachtung=false');
    if (capStatus?.capabilityEmpfangInstalliert !== false) fehler.push('Capability Empfang=false');
    if (capStatus?.senden?.versuche !== 0) fehler.push('Capability-Sendeversuche=0');
    if (capStatus?.senden?.erfolge !== 0) fehler.push('Capability-Sendeerfolge=0');
    if (capStatus?.senden?.fehler !== 0) fehler.push('Capability-Sendefehler=0');

    if (fehler.length > 0) {
      throw new Error('Strikter Block-8.6-Schatten-Preflight fehlgeschlagen: ' + fehler.join(', '));
    }
    return Object.freeze({ runtimeStatus, capStatus });
  }

  async function schattenNachweis() {
    const runner = globalThis.V4Block86FreigabeLiveTest;
    if (!runner || typeof runner.schatten !== 'function') {
      throw new Error('Block-8.6-Schattenrunner ist nicht bereit.');
    }
    pruefeSchattenPreflight();
    const bericht = runner.schatten();
    const runtimeStatus = globalThis.V4ProduktionsLaufzeit.status();
    const capStatus = globalThis.V4CapabilityLaufzeit.status();
    const pass =
      bericht?.pass === true &&
      bericht?.stufe === 'schatten' &&
      bericht?.nachweis?.ergebnis === 'bestanden' &&
      bericht?.nachweis?.spielAktionAusgefuehrt === false &&
      bericht?.runtimeHeartbeatVersuche === 0 &&
      bericht?.capabilitySendeVersuche === 0 &&
      bericht?.schattenUebergabe?.aenderungsKennung === 'git:ca0dfee7685563c8b6003469300c8fd08777b053' &&
      runtimeStatus.lebensnachweisSendeVersuche === 0 &&
      capStatus.senden.versuche === 0;

    const gesamtbericht = Object.freeze({
      schemaVersion: 1,
      paketVersion: VERSION,
      releaseSha: RELEASE_SHA,
      candidateUrl: CANDIDATE_URL,
      candidateSha256: CANDIDATE_SHA256,
      candidateBytes: CANDIDATE_BYTES,
      geladenerSha256: zustand.geladenerSha256,
      laufKennung: zustand.laufKennung,
      pass,
      runnerBericht: bericht,
      runtimeStatus,
      capabilityStatus: capStatus
    });
    zustand.letzterBericht = gesamtbericht;
    test.setzeErgebnis(
      gesamtbericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Block-8.6-Schatten bestanden: Live-Daten ausgewertet, 0 Heartbeat- und 0 Capability-Sendeversuche.'
        : 'Block-8.6-Schatten fehlgeschlagen. Gesamtbericht kopieren und nicht mit Live fortfahren.'
    );
    test.protokolliere('Schatten-Abschluss', gesamtbericht);
    if (!pass) throw new Error('Block-8.6-Schattenbericht erfuellt die strikten PASS-Bedingungen nicht.');
    return gesamtbericht;
  }

  test.registriereAktion({
    kennung: 'schatten',
    titel: '1 · Schattennachweis',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    ausfuehren: schattenNachweis
  });

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      releaseSha: RELEASE_SHA,
      candidateUrl: CANDIDATE_URL,
      candidateSha256: CANDIDATE_SHA256,
      candidateBytes: CANDIDATE_BYTES,
      laufKennung: zustand.laufKennung,
      status() {
        return Object.freeze({ ...zustand });
      },
      kopiereBericht: () => test.kopiereBericht()
    })
  });

  test.setzeStatus(
    'laeuft',
    'Immutable Block-8.6-Candidate wird geladen und geprueft. Keine Runtime wird gestartet.'
  );

  void (async () => {
    try {
      if (typeof globalThis.fetch !== 'function') {
        throw new Error('fetch ist im Adventure-Land-Codekontext nicht verfuegbar.');
      }
      const response = await globalThis.fetch(CANDIDATE_URL, { cache: 'no-store' });
      if (!response || response.ok !== true) {
        throw new Error('Candidate-Download fehlgeschlagen: HTTP ' + String(response?.status ?? 'unbekannt') + '.');
      }
      const candidateCode = String(await response.text());
      const candidateBytes = new globalThis.TextEncoder().encode(candidateCode).byteLength;
      if (candidateBytes !== CANDIDATE_BYTES) {
        throw new Error('Candidate-Bytegroesse stimmt nicht: ' + String(candidateBytes) + '.');
      }
      if (!candidateCode.includes(CANDIDATE_MARKER)) {
        throw new Error('Geladene Datei besitzt nicht den erwarteten Block-8.6-Candidate-Marker.');
      }
      const hash = await berechneSha256(candidateCode);
      if (hash !== CANDIDATE_SHA256) {
        throw new Error('Candidate-SHA-256 stimmt nicht: ' + hash + '.');
      }
      zustand.geladenerSha256 = hash;

      (0, eval)(candidateCode);
      (0, eval)(RUNNER_SOURCE);
      const preflight = pruefeSchattenPreflight();

      zustand.phase = 'bereit';
      zustand.bereit = true;
      test.protokolliere('Block-8.6-Schatten-Launcher bereit', Object.freeze({
        releaseSha: RELEASE_SHA,
        candidateUrl: CANDIDATE_URL,
        candidateSha256: hash,
        candidateBytes,
        laufKennung: zustand.laufKennung,
        runtimeVersion: globalThis.V4ProduktionsLaufzeit.version,
        capabilityVersion: globalThis.V4CapabilityLaufzeit.version,
        heartbeatVersuche: preflight.runtimeStatus.lebensnachweisSendeVersuche,
        capabilitySendeVersuche: preflight.capStatus.senden.versuche
      }));
      test.setzeStatus(
        'bereit',
        'Strikter Block-8.6-Schatten-Preflight bestanden. Jetzt nur „1 · Schattennachweis“ ausfuehren.'
      );
      test.setzeAktionAktiv('schatten', true);
    } catch (ursache) {
      const meldung = fehlerText(ursache);
      zustand.phase = 'fehlgeschlagen';
      zustand.bereit = false;
      zustand.fehler = meldung;
      test.setzeAktionAktiv('schatten', false);
      test.setzeErgebnis(
        Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }),
        'fail',
        meldung
      );
      test.protokolliere('Block-8.6-Schatten-Launcher FEHLER', meldung);
    }
  })();
})();
/* ===== END Block-8.6-Schatten-Launcher ===== */
`;
}

export async function baueBlock86SchattenPaket() {
  const [gui, runner] = await Promise.all([
    readFile(guiPfad, 'utf8'),
    readFile(runnerPfad, 'utf8')
  ]);
  const paket = [
    kopf(),
    '\n/* ===== BEGIN werkzeuge/adventure-land-test-gui.js ===== */\n',
    gui.trim(),
    '\n/* ===== END werkzeuge/adventure-land-test-gui.js ===== */\n',
    fuss(runner.trim())
  ].join('');
  return paket.endsWith('\n') ? paket : paket + '\n';
}

const pruefen = process.argv.includes('--pruefen');
const paket = await baueBlock86SchattenPaket();

if (pruefen) {
  const vorhanden = await readFile(zielPfad, 'utf8');
  if (vorhanden !== paket) {
    throw new Error(
      'block8-6-schatten-paket.js ist nicht source-locked. Mit npm run block8-6-schatten-paket:bauen neu erzeugen.'
    );
  }
  console.log('Block-8.6 Schattenpaket source-locked: ' + Buffer.byteLength(paket, 'utf8') + ' Bytes.');
} else {
  await writeFile(zielPfad, paket, 'utf8');
  console.log(
    'Block-8.6 Schattenpaket gebaut: ' +
    path.relative(wurzel, zielPfad) +
    ' (' +
    Buffer.byteLength(paket, 'utf8') +
    ' Bytes).'
  );
}
