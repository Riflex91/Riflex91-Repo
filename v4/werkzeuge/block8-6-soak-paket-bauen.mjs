import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const zielPfad = path.join(wurzel, 'werkzeuge', 'block8-6-soak-paket.js');
const guiPfad = path.join(wurzel, 'werkzeuge', 'adventure-land-test-gui.js');
const runnerPfad = path.join(wurzel, 'werkzeuge', 'block8-6-freigabestufen-live-test.js');
const schattenPfad = path.join(wurzel, 'dokumentation', 'BLOCK-8-6-9-SCHATTEN-FREIGABE-NACHWEIS.json');
const livePfad = path.join(wurzel, 'dokumentation', 'BLOCK-8-6-9-LIVE-FREIGABE-NACHWEIS.json');

export const BLOCK86_SOAK_RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';
export const BLOCK86_SOAK_CANDIDATE_SHA256 = 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5';
export const BLOCK86_SOAK_CANDIDATE_BYTES = 396471;
export const BLOCK86_SOAK_CANDIDATE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js';
export const BLOCK86_SOAK_LAUF_KENNUNG = 'block8-6-schatten-1789822653521';
export const BLOCK86_SOAK_BESTAETIGUNG = 'BLOCK8-6-SOAK-STARTEN:block8-6-schatten-1789822653521';
export const BLOCK86_SOAK_DAUER_MILLIS = 600000;
export const BLOCK86_SOAK_SAMPLE_MILLIS = 5000;

const HEAD_TEMPLATE = "/* GENERATED: V4 Block 8.6.9 separates 10-Minuten-Soak-Komplettpaket.\n * Quelle: block8-6-soak-paket-bauen.mjs\n * Bindet realen Schatten und bidirektionales kontrolliert live an exakt denselben immutable Candidate.\n * Beide Ranger sollen dieses Paket parallel ausfuehren; der Launcher verlangt im Soak mindestens einen beobachteten Remote-Heartbeat.\n */\n(() => {\n  'use strict';\n\n  const belegteNamen = [\n    'AIO_V4_RUNTIME_CONFIG',\n    'AIO_V4_CAPABILITY_CONFIG',\n    'AIO_V4_BLOCK86_FREIGABE_CONFIG',\n    'V4ProduktionsLaufzeit',\n    'V4CapabilityLaufzeit',\n    'V4Block86Candidate',\n    'V4Block86FreigabeLiveTest',\n    'V4TestGui',\n    'V4Block86SoakLauncher'\n  ].filter((name) => globalThis[name] !== undefined);\n  if (belegteNamen.length > 0) {\n    throw new Error(\n      'Block-8.6-Soakpaket verlangt einen frischen Codekontext; bereits vorhanden: ' +\n      belegteNamen.join(', ')\n    );\n  }\n\n  const RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';\n  const LAUF_KENNUNG = 'block8-6-schatten-1789822653521';\n  const VERTRAUENS_NAMEN = Object.freeze(['My_Ranger1', 'My_Ranger2']);\n  const SCHATTEN_UEBERGABE = Object.freeze(__SHADOW__);\n  const LIVE_UEBERGABEN = Object.freeze(__LIVE_MAP__);\n  const LIVE_EVIDENZ_HASHES = Object.freeze({\n    My_Ranger1: 'fba08a78942b6d2de9da482bf44df6aac6f8c91349fa13484423554195a886a7',\n    My_Ranger2: 'becc261eef26a674fe460befcd77dbeca8e9d3ed0fe1901ee026b216e979d4e2'\n  });\n\n  const lokalerCharakter = String(globalThis.character?.name ?? '').trim();\n  if (!VERTRAUENS_NAMEN.includes(lokalerCharakter)) {\n    throw new Error(\n      'Block-8.6-Soak muss auf My_Ranger1 oder My_Ranger2 laufen; erkannt: ' +\n      String(lokalerCharakter || 'unbekannt') + '.'\n    );\n  }\n  const liveUebergabe = LIVE_UEBERGABEN[lokalerCharakter];\n  if (!liveUebergabe || liveUebergabe.nachweis?.ergebnis !== 'bestanden') {\n    throw new Error('Passende kanonische Controlled-Live-Uebergabe fehlt fuer ' + lokalerCharakter + '.');\n  }\n\n  function setzeGlobal(name, wert) {\n    Object.defineProperty(globalThis, name, {\n      configurable: true,\n      enumerable: true,\n      writable: false,\n      value: wert\n    });\n  }\n\n  setzeGlobal('AIO_V4_RUNTIME_CONFIG', Object.freeze({\n    aktivFreigegeben: true,\n    ablaufKennung: 'block8-6-soak-' + LAUF_KENNUNG,\n    vertrauensNamen: VERTRAUENS_NAMEN,\n    faehigkeiten: Object.freeze({\n      heilen: 0,\n      schaden: 1,\n      aggro: 0,\n      schutz: 0,\n      unterstuetzung: 0\n    })\n  }));\n  setzeGlobal('AIO_V4_CAPABILITY_CONFIG', Object.freeze({\n    aktivFreigegeben: true,\n    ablaufKennung: 'block8-6-soak-' + LAUF_KENNUNG,\n    vertrauensNamen: VERTRAUENS_NAMEN,\n    koordinationsNamen: VERTRAUENS_NAMEN,\n    policyVorgaben: Object.freeze([])\n  }));\n  setzeGlobal('AIO_V4_BLOCK86_FREIGABE_CONFIG', Object.freeze({\n    aenderungsKennung: 'git:' + RELEASE_SHA,\n    laufKennung: LAUF_KENNUNG,\n    modus: 'soak',\n    soakDauerMillisekunden: 600000,\n    sampleMillisekunden: 5000,\n    recoveryReplayVerified: true,\n    schattenUebergabe: SCHATTEN_UEBERGABE,\n    liveUebergabe\n  }));\n  setzeGlobal('AIO_V4_BLOCK86_SOAK_EVIDENZ', Object.freeze({\n    lokalerCharakter,\n    liveReportSha256: LIVE_EVIDENZ_HASHES[lokalerCharakter]\n  }));\n})();\n";
const LAUNCHER_TEMPLATE = "\n/* ===== BEGIN Block-8.6-Soak-Launcher ===== */\n(() => {\n  'use strict';\n\n  const API_NAME = 'V4Block86SoakLauncher';\n  const VERSION = '1.0.0';\n  const RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';\n  const CANDIDATE_SHA256 = 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5';\n  const CANDIDATE_BYTES = 396471;\n  const CANDIDATE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js';\n  const CANDIDATE_MARKER = 'Adventure Land AiO Bot V4 | generated | Block 8.6 capability release candidate';\n  const LAUF_KENNUNG = 'block8-6-schatten-1789822653521';\n  const BESTAETIGUNG = 'BLOCK8-6-SOAK-STARTEN:block8-6-schatten-1789822653521';\n  const RUNNER_SOURCE = __RUNNER_JSON__;\n\n  const guiApi = globalThis.V4TestGui;\n  if (!guiApi || typeof guiApi.erstelleTest !== 'function') {\n    throw new Error('V4TestGui fehlt im Block-8.6-Soakpaket.');\n  }\n\n  const test = guiApi.erstelleTest({\n    kennung: 'block8-6-soak-' + LAUF_KENNUNG + '-' + String(globalThis.character?.name ?? 'unbekannt'),\n    titel: 'V4 Block 8.6.9 · 10-Minuten-Soak',\n    beschreibung:\n      'Bindet Schatten + kontrolliert live, startet exakt den immutable Candidate und prueft 600000 ms lang Katalog, Heartbeat, Capability-Fehler und Remote-Liveness.'\n  });\n\n  const zustand = {\n    phase: 'laedt',\n    bereit: false,\n    fehler: null,\n    releaseSha: RELEASE_SHA,\n    candidateSha256: CANDIDATE_SHA256,\n    candidateBytes: CANDIDATE_BYTES,\n    candidateUrl: CANDIDATE_URL,\n    laufKennung: LAUF_KENNUNG,\n    lokalerCharakter: String(globalThis.character?.name ?? '').trim(),\n    zielName: null,\n    geladenerSha256: null,\n    heartbeatErfolgeVorFreigabe: 0,\n    beobachteteLebensnachweiseVorher: 0,\n    letzterBericht: null\n  };\n\n  function fehlerText(ursache) {\n    return ursache instanceof Error ? ursache.message : String(ursache);\n  }\n\n  async function berechneSha256(code) {\n    if (!globalThis.crypto?.subtle || typeof globalThis.TextEncoder !== 'function') {\n      throw new Error('Web-Crypto oder TextEncoder ist fuer die Candidate-Hashpruefung nicht verfuegbar.');\n    }\n    const bytes = new globalThis.TextEncoder().encode(code);\n    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);\n    return Array.from(new Uint8Array(digest), (wert) => wert.toString(16).padStart(2, '0')).join('');\n  }\n\n  function schlafe(ms) {\n    return new Promise((resolve) => setTimeout(resolve, ms));\n  }\n\n  async function warteAufProduktionsheartbeat(runtime) {\n    const gestartetAm = Date.now();\n    while (Date.now() - gestartetAm < 10000) {\n      const status = runtime.status();\n      if (status.lebensnachweisSendeFehler > 0) {\n        throw new Error(\n          'Produktionsheartbeat meldet vor Soak einen Sendefehler: ' +\n          String(status.lebensnachweisLetzterFehler ?? 'unbekannt')\n        );\n      }\n      if (\n        status.lebensnachweisSendeVersuche >= 1 &&\n        status.lebensnachweisSendeErfolge >= 1 &&\n        status.lebensnachweisSendeOffen === 0\n      ) {\n        return status;\n      }\n      await schlafe(250);\n    }\n    const status = runtime.status();\n    throw new Error(\n      'Innerhalb von 10 Sekunden wurde kein bestaetigter Produktionsheartbeat erreicht: ' +\n      JSON.stringify({\n        versuche: status.lebensnachweisSendeVersuche,\n        erfolge: status.lebensnachweisSendeErfolge,\n        fehler: status.lebensnachweisSendeFehler,\n        offen: status.lebensnachweisSendeOffen\n      })\n    );\n  }\n\n  function pruefeVorStart() {\n    const runtime = globalThis.V4ProduktionsLaufzeit;\n    const capability = globalThis.V4CapabilityLaufzeit;\n    const candidate = globalThis.V4Block86Candidate;\n    const runner = globalThis.V4Block86FreigabeLiveTest;\n    const cfg = globalThis.AIO_V4_BLOCK86_FREIGABE_CONFIG;\n    const fehler = [];\n\n    if (!candidate || candidate.version !== '1.0.0') fehler.push('V4Block86Candidate 1.0.0');\n    if (candidate?.spielAutoritaet !== false) fehler.push('Candidate spielAutoritaet=false');\n    if (candidate?.neustartAutoritaet !== false) fehler.push('Candidate neustartAutoritaet=false');\n    if (!runtime || runtime.version !== '1.1.5') fehler.push('Runtime 1.1.5');\n    if (!capability || capability.version !== '1.0.0') fehler.push('Capability 1.0.0');\n    if (!runner || runner.version !== '1.0.0') fehler.push('Runner 1.0.0');\n    if (runner?.modus !== 'soak') fehler.push('Runner modus=soak');\n    if (runner?.laufKennung !== LAUF_KENNUNG) fehler.push('Runner Laufbindung');\n    if (runner?.aenderungsKennung !== 'git:ca0dfee7685563c8b6003469300c8fd08777b053') fehler.push('Runner Candidate-Bindung');\n    if (cfg?.soakDauerMillisekunden !== 600000) fehler.push('Soak-Dauer=600000');\n    if (cfg?.sampleMillisekunden !== 5000) fehler.push('Sampling=5000');\n    if (cfg?.recoveryReplayVerified !== true) fehler.push('Recovery-Replay gebunden');\n    if (cfg?.schattenUebergabe?.nachweis?.ergebnis !== 'bestanden') fehler.push('Schatten-Uebergabe');\n    if (cfg?.liveUebergabe?.nachweis?.ergebnis !== 'bestanden') fehler.push('Live-Uebergabe');\n\n    const r = runtime?.status?.();\n    if (r?.aktivFreigegeben !== true) fehler.push('Runtime aktivFreigegeben=true');\n    if (r?.empfangInstalliert !== false) fehler.push('Runtime vor Start empfangInstalliert=false');\n    if (r?.lebensnachweisAutomatikAktiv !== false) fehler.push('Runtime vor Start Heartbeat=false');\n    if (r?.lebensnachweisSendeVersuche !== 0) fehler.push('Runtime vor Start Heartbeat-Versuche=0');\n\n    const c = capability?.status?.();\n    if (c?.aktivFreigegeben !== true) fehler.push('Capability aktivFreigegeben=true');\n    if (c?.remoteBeobachtungInstalliert !== false) fehler.push('Remote-Beobachtung vor Soak=false');\n    if (c?.capabilityEmpfangInstalliert !== false) fehler.push('Capability-Empfang vor Soak=false');\n    if (c?.senden?.versuche !== 0 || c?.senden?.erfolge !== 0 || c?.senden?.fehler !== 0) {\n      fehler.push('Capability vor Soak Sendezaehler=0');\n    }\n\n    if (fehler.length > 0) {\n      throw new Error('Block-8.6-Soak-Preflight vor Runtime-Start fehlgeschlagen: ' + fehler.join(', '));\n    }\n  }\n\n  async function soak() {\n    const runner = globalThis.V4Block86FreigabeLiveTest;\n    const runtime = globalThis.V4ProduktionsLaufzeit;\n    const capability = globalThis.V4CapabilityLaufzeit;\n    const vor = capability.status();\n\n    if (vor.senden.versuche !== 0 || vor.senden.erfolge !== 0 || vor.senden.fehler !== 0) {\n      throw new Error('Soak startet nur mit exakt 0 Capability-Sendezaehlern.');\n    }\n\n    const bericht = await runner.soak(BESTAETIGUNG);\n    const runtimeNachher = runtime.status();\n    const capNachher = capability.status();\n    const remoteLivenessNeu =\n      capNachher.beobachteteLebensnachweise - zustand.beobachteteLebensnachweiseVorher;\n    const pass =\n      bericht?.pass === true &&\n      bericht?.stufe === 'soak' &&\n      bericht?.nachweis?.ergebnis === 'bestanden' &&\n      bericht?.nachweis?.telemetrieNachweis === true &&\n      bericht?.nachweis?.recoveryNachweis === true &&\n      bericht?.nachweis?.gesamtauswertungBestanden === true &&\n      bericht?.dauerMillisekunden === 600000 &&\n      bericht?.sampleMillisekunden === 5000 &&\n      bericht?.samples >= bericht?.erwarteteSamples &&\n      bericht?.recoveryReplayVerified === true &&\n      runtimeNachher.lebensnachweisSendeFehler === 0 &&\n      capNachher.senden.versuche === 0 &&\n      capNachher.senden.erfolge === 0 &&\n      capNachher.senden.fehler === 0 &&\n      capNachher.remoteBeobachtungInstalliert === true &&\n      capNachher.capabilityEmpfangInstalliert === true &&\n      remoteLivenessNeu >= 1;\n\n    const gesamtbericht = Object.freeze({\n      schemaVersion: 1,\n      paketVersion: VERSION,\n      releaseSha: RELEASE_SHA,\n      candidateUrl: CANDIDATE_URL,\n      candidateSha256: CANDIDATE_SHA256,\n      candidateBytes: CANDIDATE_BYTES,\n      geladenerSha256: zustand.geladenerSha256,\n      laufKennung: LAUF_KENNUNG,\n      lokalerCharakter: zustand.lokalerCharakter,\n      zielName: zustand.zielName,\n      liveReportSha256: globalThis.AIO_V4_BLOCK86_SOAK_EVIDENZ?.liveReportSha256 ?? null,\n      pass,\n      remoteLivenessNeu,\n      empfangeneCapabilitySnapshots: capNachher.empfangeneCapabilitySnapshots,\n      runnerBericht: bericht,\n      runtimeStatus: runtimeNachher,\n      capabilityStatus: capNachher\n    });\n    zustand.letzterBericht = gesamtbericht;\n\n    test.setzeErgebnis(\n      gesamtbericht,\n      pass ? 'pass' : 'fail',\n      pass\n        ? 'Block-8.6-Soak bestanden: 10 Minuten stabil, Heartbeats fortgeschritten, 0 Capability-Sendungen und Remote-Liveness beobachtet.'\n        : 'Block-8.6-Soak fehlgeschlagen. Beide Ranger-Berichte kopieren und Block 8.6 nicht abschliessen.'\n    );\n    test.protokolliere('Soak-Abschluss', gesamtbericht);\n    if (!pass) throw new Error('Block-8.6-Soakbericht erfuellt die strikten PASS-Bedingungen nicht.');\n    return gesamtbericht;\n  }\n\n  test.registriereAktion({\n    kennung: 'soak',\n    titel: '3 · Soak starten',\n    art: 'gefahr',\n    aktiviert: false,\n    einmalig: true,\n    bestaetigungsText: BESTAETIGUNG,\n    ausfuehren: soak\n  });\n\n  Object.defineProperty(globalThis, API_NAME, {\n    configurable: true,\n    enumerable: true,\n    writable: false,\n    value: Object.freeze({\n      version: VERSION,\n      releaseSha: RELEASE_SHA,\n      candidateUrl: CANDIDATE_URL,\n      candidateSha256: CANDIDATE_SHA256,\n      candidateBytes: CANDIDATE_BYTES,\n      laufKennung: LAUF_KENNUNG,\n      bestaetigungsText: BESTAETIGUNG,\n      status() {\n        return Object.freeze({ ...zustand });\n      },\n      kopiereBericht: () => test.kopiereBericht()\n    })\n  });\n\n  test.setzeStatus(\n    'laeuft',\n    'Immutable Block-8.6-Candidate wird geladen. Soak bleibt bis zum bestaetigten Produktionsheartbeat gesperrt.'\n  );\n\n  void (async () => {\n    try {\n      if (typeof globalThis.fetch !== 'function') {\n        throw new Error('fetch ist im Adventure-Land-Codekontext nicht verfuegbar.');\n      }\n      const response = await globalThis.fetch(CANDIDATE_URL, { cache: 'no-store' });\n      if (!response || response.ok !== true) {\n        throw new Error('Candidate-Download fehlgeschlagen: HTTP ' + String(response?.status ?? 'unbekannt') + '.');\n      }\n      const candidateCode = String(await response.text());\n      const bytes = new globalThis.TextEncoder().encode(candidateCode).byteLength;\n      if (bytes !== CANDIDATE_BYTES) {\n        throw new Error('Candidate-Bytegroesse stimmt nicht: ' + String(bytes) + '.');\n      }\n      if (!candidateCode.includes(CANDIDATE_MARKER)) {\n        throw new Error('Geladene Datei besitzt nicht den erwarteten Block-8.6-Candidate-Marker.');\n      }\n      const hash = await berechneSha256(candidateCode);\n      if (hash !== CANDIDATE_SHA256) {\n        throw new Error('Candidate-SHA-256 stimmt nicht: ' + hash + '.');\n      }\n      zustand.geladenerSha256 = hash;\n\n      (0, eval)(candidateCode);\n      (0, eval)(RUNNER_SOURCE);\n      pruefeVorStart();\n\n      const runtime = globalThis.V4ProduktionsLaufzeit;\n      runtime.starte();\n      const heartbeatStatus = await warteAufProduktionsheartbeat(runtime);\n\n      const capability = globalThis.V4CapabilityLaufzeit;\n      const update = capability.aktualisiere();\n      const capStatus = update.status;\n      const localName = capStatus.capabilityStatus?.charakterName;\n      if (localName !== zustand.lokalerCharakter) {\n        throw new Error('Capability-Charakter stimmt nicht mit lokalem Soak-Charakter ueberein.');\n      }\n      const ziel = ['My_Ranger1', 'My_Ranger2'].filter((name) => name !== localName);\n      if (ziel.length !== 1) throw new Error('Soak konnte nicht exakt einen anderen Ranger bestimmen.');\n      if (!capStatus.audit?.produktionsbereit || update.lokalerSnapshot === null) {\n        throw new Error('Capability-Audit oder lokaler Snapshot ist vor Soak nicht produktionsbereit.');\n      }\n      if (\n        capStatus.remoteBeobachtungInstalliert !== false ||\n        capStatus.capabilityEmpfangInstalliert !== false ||\n        capStatus.senden.versuche !== 0 ||\n        capStatus.senden.erfolge !== 0 ||\n        capStatus.senden.fehler !== 0\n      ) {\n        throw new Error('Capability-Laufzeit muss vor dem Soak komplett sendefrei und ohne Remote-Wrapper sein.');\n      }\n\n      zustand.zielName = ziel[0];\n      zustand.heartbeatErfolgeVorFreigabe = heartbeatStatus.lebensnachweisSendeErfolge;\n      zustand.beobachteteLebensnachweiseVorher = capStatus.beobachteteLebensnachweise;\n      zustand.phase = 'bereit';\n      zustand.bereit = true;\n\n      test.protokolliere('Block-8.6-Soak-Launcher bereit', Object.freeze({\n        releaseSha: RELEASE_SHA,\n        candidateSha256: hash,\n        candidateBytes: bytes,\n        laufKennung: LAUF_KENNUNG,\n        lokalerCharakter: localName,\n        zielName: ziel[0],\n        heartbeatErfolge: heartbeatStatus.lebensnachweisSendeErfolge,\n        heartbeatFehler: heartbeatStatus.lebensnachweisSendeFehler,\n        capabilitySendeVersuche: capStatus.senden.versuche,\n        beobachteteLebensnachweiseVorher: capStatus.beobachteteLebensnachweise,\n        liveReportSha256: globalThis.AIO_V4_BLOCK86_SOAK_EVIDENZ?.liveReportSha256 ?? null\n      }));\n      test.setzeStatus(\n        'bereit',\n        'Soak-Preflight bestanden. Auf BEIDEN Rangern jetzt „3 · Soak starten“ mit dem angezeigten Bestaetigungstext ausfuehren und 10 Minuten ungestoert laufen lassen.'\n      );\n      test.setzeAktionAktiv('soak', true);\n    } catch (ursache) {\n      const meldung = fehlerText(ursache);\n      zustand.phase = 'fehlgeschlagen';\n      zustand.bereit = false;\n      zustand.fehler = meldung;\n      test.setzeAktionAktiv('soak', false);\n      test.setzeErgebnis(\n        Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }),\n        'fail',\n        meldung\n      );\n      test.protokolliere('Block-8.6-Soak-Launcher FEHLER', meldung);\n    }\n  })();\n})();\n/* ===== END Block-8.6-Soak-Launcher ===== */\n";

function pruefeEvidenz(schatten, live) {
  if (
    schatten?.releaseSha !== BLOCK86_SOAK_RELEASE_SHA ||
    schatten?.candidateSha256 !== BLOCK86_SOAK_CANDIDATE_SHA256 ||
    schatten?.candidateBytes !== BLOCK86_SOAK_CANDIDATE_BYTES ||
    schatten?.schattenUebergabe?.laufKennung !== BLOCK86_SOAK_LAUF_KENNUNG ||
    schatten?.schattenUebergabe?.aenderungsKennung !== 'git:' + BLOCK86_SOAK_RELEASE_SHA ||
    schatten?.schattenUebergabe?.nachweis?.ergebnis !== 'bestanden'
  ) {
    throw new Error('Kanonischer Block-8.6-Schattennachweis ist fuer das Soak-Paket ungueltig.');
  }
  if (
    live?.releaseSha !== BLOCK86_SOAK_RELEASE_SHA ||
    live?.candidateSha256 !== BLOCK86_SOAK_CANDIDATE_SHA256 ||
    live?.candidateBytes !== BLOCK86_SOAK_CANDIDATE_BYTES ||
    live?.laufKennung !== BLOCK86_SOAK_LAUF_KENNUNG ||
    live?.stufe !== 'kontrolliert_live' ||
    live?.ergebnis !== 'bestanden' ||
    live?.bidirektional?.bestanden !== true ||
    live?.bidirektional?.gesamtCapabilityVersuche !== 2 ||
    live?.bidirektional?.gesamtCapabilityErfolge !== 2 ||
    live?.bidirektional?.gesamtCapabilityFehler !== 0 ||
    live?.reports?.length !== 2
  ) {
    throw new Error('Kanonischer Block-8.6-Controlled-Live-Nachweis ist fuer das Soak-Paket ungueltig.');
  }

  const erwartete = new Map([
    ['My_Ranger1', { ziel: 'My_Ranger2', hash: 'fba08a78942b6d2de9da482bf44df6aac6f8c91349fa13484423554195a886a7' }],
    ['My_Ranger2', { ziel: 'My_Ranger1', hash: 'becc261eef26a674fe460befcd77dbeca8e9d3ed0fe1901ee026b216e979d4e2' }]
  ]);
  const liveUebergaben = {};
  for (const report of live.reports) {
    const soll = erwartete.get(report.lokalerCharakter);
    if (
      !soll ||
      report.zielName !== soll.ziel ||
      report.reportSha256 !== soll.hash ||
      report.pass !== true ||
      report.begrenzt !== true ||
      report.spielAktionAusgefuehrt !== true ||
      report.capabilitySenden?.versuche !== 1 ||
      report.capabilitySenden?.erfolge !== 1 ||
      report.capabilitySenden?.fehler !== 0 ||
      report.runtime?.heartbeatFehler !== 0
    ) {
      throw new Error('Controlled-Live-Report ist fuer den Soak nicht exakt gebunden: ' + String(report?.lokalerCharakter));
    }
    liveUebergaben[report.lokalerCharakter] = {
      schemaVersion: 1,
      laufKennung: BLOCK86_SOAK_LAUF_KENNUNG,
      aenderungsKennung: 'git:' + BLOCK86_SOAK_RELEASE_SHA,
      nachweis: {
        schemaVersion: 1,
        laufzeitPfadKennung: 'block8.6-capability-runtime',
        aenderungsKennung: 'git:' + BLOCK86_SOAK_RELEASE_SHA,
        stufe: 'kontrolliert_live',
        nachweisKennung: report.nachweisKennung,
        ergebnis: 'bestanden',
        durchgefuehrtAm: report.performedAt,
        deterministisch: false,
        spielAktionAusgefuehrt: true,
        begrenzt: true,
        telemetrieNachweis: false,
        recoveryNachweis: false,
        gesamtauswertungBestanden: false
      },
      ziele: [report.zielName]
    };
  }
  if (!liveUebergaben.My_Ranger1 || !liveUebergaben.My_Ranger2) {
    throw new Error('Beide Ranger-Live-Uebergaben muessen fuer den Soak vorhanden sein.');
  }
  return {
    schattenUebergabe: schatten.schattenUebergabe,
    liveUebergaben
  };
}

export async function baueBlock86SoakPaket() {
  const [gui, runner, schattenRoh, liveRoh] = await Promise.all([
    readFile(guiPfad, 'utf8'),
    readFile(runnerPfad, 'utf8'),
    readFile(schattenPfad, 'utf8'),
    readFile(livePfad, 'utf8')
  ]);
  const { schattenUebergabe, liveUebergaben } = pruefeEvidenz(
    JSON.parse(schattenRoh),
    JSON.parse(liveRoh)
  );
  const head = HEAD_TEMPLATE
    .replace('__SHADOW__', JSON.stringify(schattenUebergabe, null, 2))
    .replace('__LIVE_MAP__', JSON.stringify(liveUebergaben, null, 2));
  const launcher = LAUNCHER_TEMPLATE.replace('__RUNNER_JSON__', JSON.stringify(runner.trim()));
  const paket = [
    head,
    '\n/* ===== BEGIN werkzeuge/adventure-land-test-gui.js ===== */\n',
    gui.trim(),
    '\n/* ===== END werkzeuge/adventure-land-test-gui.js ===== */\n',
    launcher
  ].join('');
  return paket.endsWith('\n') ? paket : paket + '\n';
}

const pruefen = process.argv.includes('--pruefen');
const paket = await baueBlock86SoakPaket();

if (pruefen) {
  const vorhanden = await readFile(zielPfad, 'utf8');
  if (vorhanden !== paket) {
    throw new Error(
      'block8-6-soak-paket.js ist nicht source-locked. Mit npm run block8-6-soak-paket:bauen neu erzeugen.'
    );
  }
  console.log('Block-8.6 Soak-Paket source-locked: ' + new TextEncoder().encode(paket).byteLength + ' Bytes.');
} else {
  await writeFile(zielPfad, paket, 'utf8');
  console.log(
    'Block-8.6 Soak-Paket gebaut: ' +
    path.relative(wurzel, zielPfad) +
    ' (' +
    new TextEncoder().encode(paket).byteLength +
    ' Bytes).'
  );
}
