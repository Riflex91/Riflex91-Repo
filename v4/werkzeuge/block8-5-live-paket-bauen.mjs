import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const zielPfad = path.join(wurzel, 'werkzeuge', 'block8-5-live-paket.js');
const evidenzPfad = path.join(wurzel, 'dokumentation', 'BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json');
const quellen = [
  'werkzeuge/adventure-land-v4-bootstrap.js',
  'werkzeuge/adventure-land-test-gui.js',
  'werkzeuge/block8-5-freigabestufen-live-test.js'
];

const RELEASE_SHA = '88185523c81687dc16f9647ca5e7568c5e2c228c';
const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
const RUNTIME_URL =
  'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/' +
  RELEASE_SHA +
  '/aio-v4-runtime.js';
const LAUF_KENNUNG = 'block8-5-schatten-1789775266269';

function pruefeEvidenz(evidenz) {
  if (
    evidenz?.nachweis?.stufe !== 'schatten' ||
    evidenz?.nachweis?.ergebnis !== 'bestanden' ||
    evidenz?.nachweis?.spielAktionAusgefuehrt !== false ||
    evidenz?.schattenUebergabe?.laufKennung !== LAUF_KENNUNG ||
    evidenz?.schattenUebergabe?.runtimeVersion !== '1.1.5' ||
    evidenz?.schattenUebergabe?.runtimeSha256 !== RUNTIME_SHA256 ||
    evidenz?.schattenUebergabe?.heartbeatVersuche !== 0 ||
    typeof evidenz?.schattenUebergabe?.nachweis !== 'object'
  ) {
    throw new Error('Kanonischer Schattennachweis ist fuer das Live-Paket ungueltig.');
  }
  return evidenz.schattenUebergabe;
}

function kopf(schattenUebergabe) {
  return "/* GENERATED: V4 Block 8.5.9 kontrolliertes Live-/Soak-Komplettpaket.\n * Quelle: block8-5-live-paket-bauen.mjs\n * Bindet den real bestandenen Schattennachweis und startet Runtime 1.1.5 bewusst aktiv.\n * Der Launcher ruft keine Adventure-Land-Spielaktionsfunktion direkt auf; die Produktionsruntime sendet Heartbeats per send_cm.\n */\n(() => {\n  'use strict';\n\n  const belegteNamen = [\n    'AIO_V4_RUNTIME_CONFIG',\n    'AIO_V4_BOOTSTRAP_CONFIG',\n    'AIO_V4_BLOCK85_FREIGABE_CONFIG',\n    'V4ProduktionsLaufzeit',\n    'V4Bootstrap',\n    'V4TestGui',\n    'V4Block85FreigabeLiveTest',\n    'V4Block85LiveLauncher'\n  ].filter((name) => globalThis[name] !== undefined);\n  if (belegteNamen.length > 0) {\n    throw new Error(\n      'Block-8.5-Livepaket verlangt einen frischen Codekontext; bereits vorhanden: ' +\n      belegteNamen.join(', ')\n    );\n  }\n\n  function setzeGlobal(name, wert) {\n    Object.defineProperty(globalThis, name, {\n      configurable: true,\n      enumerable: true,\n      writable: false,\n      value: wert\n    });\n  }\n\n  setzeGlobal('AIO_V4_RUNTIME_CONFIG', Object.freeze({\n    aktivFreigegeben: true,\n    ablaufKennung: 'block8-5-kontrolliert-live-1789775266269',\n    vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2']),\n    faehigkeiten: Object.freeze({\n      heilen: 0,\n      schaden: 1,\n      aggro: 0,\n      schutz: 0,\n      unterstuetzung: 0\n    })\n  }));\n  setzeGlobal('AIO_V4_BOOTSTRAP_CONFIG', Object.freeze({\n    runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',\n    runtimeSha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f'\n  }));\n  setzeGlobal('AIO_V4_BLOCK85_FREIGABE_CONFIG', Object.freeze({\n    aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',\n    laufKennung: 'block8-5-schatten-1789775266269',\n    modus: 'live',\n    soakDauerMillisekunden: 600000,\n    schattenUebergabe: Object.freeze({\n        \"schemaVersion\": 1,\n        \"laufzeitPfadKennung\": \"block8.5-basisbedienung-runtime\",\n        \"aenderungsKennung\": \"git:88185523c81687dc16f9647ca5e7568c5e2c228c\",\n        \"laufKennung\": \"block8-5-schatten-1789775266269\",\n        \"runtimeVersion\": \"1.1.5\",\n        \"runtimeSha256\": \"95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f\",\n        \"runtimeUrl\": \"https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js\",\n        \"betriebsart\": \"gesperrt_nicht_gestartet\",\n        \"generation\": 0,\n        \"heartbeatVersuche\": 0,\n        \"heartbeatErfolge\": 0,\n        \"heartbeatFehler\": 0,\n        \"nachweis\": {\n            \"schemaVersion\": 1,\n            \"laufzeitPfadKennung\": \"block8.5-basisbedienung-runtime\",\n            \"aenderungsKennung\": \"git:88185523c81687dc16f9647ca5e7568c5e2c228c\",\n            \"stufe\": \"schatten\",\n            \"nachweisKennung\": \"block8-5-schatten-1789775266269:schatten\",\n            \"ergebnis\": \"bestanden\",\n            \"durchgefuehrtAm\": 1789775267498,\n            \"deterministisch\": false,\n            \"spielAktionAusgefuehrt\": false,\n            \"begrenzt\": false,\n            \"telemetrieNachweis\": false,\n            \"recoveryNachweis\": false,\n            \"gesamtauswertungBestanden\": false\n        }\n    })\n  }));\n})();\n".replace(
    "{\n        \"schemaVersion\": 1,\n        \"laufzeitPfadKennung\": \"block8.5-basisbedienung-runtime\",\n        \"aenderungsKennung\": \"git:88185523c81687dc16f9647ca5e7568c5e2c228c\",\n        \"laufKennung\": \"block8-5-schatten-1789775266269\",\n        \"runtimeVersion\": \"1.1.5\",\n        \"runtimeSha256\": \"95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f\",\n        \"runtimeUrl\": \"https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js\",\n        \"betriebsart\": \"gesperrt_nicht_gestartet\",\n        \"generation\": 0,\n        \"heartbeatVersuche\": 0,\n        \"heartbeatErfolge\": 0,\n        \"heartbeatFehler\": 0,\n        \"nachweis\": {\n            \"schemaVersion\": 1,\n            \"laufzeitPfadKennung\": \"block8.5-basisbedienung-runtime\",\n            \"aenderungsKennung\": \"git:88185523c81687dc16f9647ca5e7568c5e2c228c\",\n            \"stufe\": \"schatten\",\n            \"nachweisKennung\": \"block8-5-schatten-1789775266269:schatten\",\n            \"ergebnis\": \"bestanden\",\n            \"durchgefuehrtAm\": 1789775267498,\n            \"deterministisch\": false,\n            \"spielAktionAusgefuehrt\": false,\n            \"begrenzt\": false,\n            \"telemetrieNachweis\": false,\n            \"recoveryNachweis\": false,\n            \"gesamtauswertungBestanden\": false\n        }\n    }",
    JSON.stringify(schattenUebergabe, null, 4).replace(/^/gm, '    ').trimStart()
  );
}

function fuss() {
  return "\n/* ===== BEGIN kontrollierter Live-Launcher ===== */\n(() => {\n  'use strict';\n\n  const API_NAME = 'V4Block85LiveLauncher';\n  const VERSION = '1.0.0';\n  const testApi = globalThis.V4Block85FreigabeLiveTest;\n  const bootstrap = globalThis.V4Bootstrap;\n  if (!testApi?.test || typeof bootstrap?.lade !== 'function') {\n    throw new Error('Livepaket konnte Bootstrap/Test-Runner nicht initialisieren.');\n  }\n\n  const zustand = {\n    phase: 'laedt',\n    bereit: false,\n    fehler: null,\n    heartbeatErfolge: 0,\n    heartbeatVersuche: 0,\n    laufKennung: globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG.laufKennung\n  };\n\n  Object.defineProperty(globalThis, API_NAME, {\n    configurable: true,\n    enumerable: true,\n    writable: false,\n    value: Object.freeze({\n      version: VERSION,\n      laufKennung: zustand.laufKennung,\n      runtimeSha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',\n      runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',\n      status() {\n        return Object.freeze({ ...zustand });\n      }\n    })\n  });\n\n  function schlafe(ms) {\n    return new Promise((resolve) => setTimeout(resolve, ms));\n  }\n\n  async function warteAufBestaetigtenHeartbeat(runtime) {\n    const gestartetAm = Date.now();\n    while (Date.now() - gestartetAm < 10_000) {\n      const status = runtime.status();\n      if (status.lebensnachweisSendeFehler > 0) {\n        throw new Error(\n          'Produktionsheartbeat meldet vor dem kontrollierten Live-Test einen SendeFehler: ' +\n          String(status.lebensnachweisLetzterFehler ?? 'unbekannt')\n        );\n      }\n      if (\n        status.lebensnachweisSendeVersuche >= 1 &&\n        status.lebensnachweisSendeErfolge >= 1 &&\n        status.lebensnachweisSendeOffen === 0\n      ) {\n        return status;\n      }\n      await schlafe(250);\n    }\n    const status = runtime.status();\n    throw new Error(\n      'Innerhalb von 10 Sekunden wurde kein bestaetigter Produktionsheartbeat erreicht: ' +\n      JSON.stringify({\n        versuche: status.lebensnachweisSendeVersuche,\n        erfolge: status.lebensnachweisSendeErfolge,\n        fehler: status.lebensnachweisSendeFehler,\n        offen: status.lebensnachweisSendeOffen,\n        letzterFehler: status.lebensnachweisLetzterFehler\n      })\n    );\n  }\n\n  testApi.test.setzeAktionAktiv('schatten', false);\n  testApi.test.setzeAktionAktiv('kontrolliert-live', false);\n  testApi.test.setzeAktionAktiv('soak', false);\n  testApi.test.setzeStatus(\n    'laeuft',\n    'Immutable Runtime 1.1.5 wird geladen und danach bewusst aktiv gestartet. Kontrolliert live bleibt bis zu einem bestaetigten echten Produktionsheartbeat gesperrt.'\n  );\n\n  void Promise.resolve(bootstrap.lade()).then(async (bootstrapStatus) => {\n    const runtime = globalThis.V4ProduktionsLaufzeit;\n    if (!runtime || runtime.version !== '1.1.5' || typeof runtime.starte !== 'function') {\n      throw new Error('Geladene Runtime ist nicht die erwartete startfaehige Version 1.1.5.');\n    }\n\n    const vorStart = runtime.status();\n    if (\n      vorStart.aktivFreigegeben !== true ||\n      vorStart.empfangInstalliert !== false ||\n      vorStart.lebensnachweisAutomatikAktiv !== false ||\n      vorStart.lebensnachweisSendeVersuche !== 0\n    ) {\n      throw new Error('Livepaket erwartet vor starte() eine aktive, aber noch nicht gestartete Runtime mit 0 Heartbeat-Versuchen.');\n    }\n\n    runtime.starte();\n    const status = await warteAufBestaetigtenHeartbeat(runtime);\n    const basis = runtime.basisBedienStatus();\n\n    const fehler = [];\n    if (bootstrapStatus.geladenVon !== 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js') fehler.push('immutable Runtime-URL');\n    if (bootstrapStatus.geladenerSha256 !== '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f') fehler.push('Runtime-SHA-256');\n    if (status.aktivFreigegeben !== true) fehler.push('aktivFreigegeben=true');\n    if (status.gestoppt !== false) fehler.push('gestoppt=false');\n    if (status.empfangInstalliert !== true) fehler.push('empfangInstalliert=true');\n    if (status.lebensnachweisAutomatikAktiv !== true) fehler.push('Heartbeat aktiv');\n    if (status.lebensnachweisAutomatikPausiert !== false) fehler.push('Heartbeat nicht pausiert');\n    if (status.lebensnachweisSendeVersuche < 1) fehler.push('Heartbeat-Versuche>=1');\n    if (status.lebensnachweisSendeErfolge < 1) fehler.push('Heartbeat-Erfolge>=1');\n    if (status.lebensnachweisSendeFehler !== 0) fehler.push('Heartbeat-Fehler=0');\n    if (status.lebensnachweisSendeOffen !== 0) fehler.push('Heartbeat-Offen=0');\n    if (status.performanceTrickErforderlich === true && status.performanceTrickAufgerufen !== true) {\n      fehler.push('performance_trick bestaetigt');\n    }\n    if (status.liveSmokeInstalliert === true) fehler.push('kein Live-Smoke');\n    if (status.gruppenZielVorbereitungVerbraucht === true) fehler.push('keine Gruppenziel-Vorbereitung');\n    if (basis?.laufzeit?.zustand !== 'laeuft') fehler.push('LaufzeitSteuerung=laeuft');\n    if (basis?.laufzeit?.generation !== 0) fehler.push('Generation=0');\n    if (basis?.laufzeit?.automatischeFortsetzung !== false) fehler.push('automatischeFortsetzung=false');\n\n    if (fehler.length > 0) {\n      throw new Error('Kontrollierter Live-Preflight fehlgeschlagen: ' + fehler.join(', '));\n    }\n\n    zustand.phase = 'bereit';\n    zustand.bereit = true;\n    zustand.heartbeatErfolge = status.lebensnachweisSendeErfolge;\n    zustand.heartbeatVersuche = status.lebensnachweisSendeVersuche;\n    testApi.test.protokolliere('Kontrollierter Live-Launcher bereit', Object.freeze({\n      laufKennung: zustand.laufKennung,\n      runtimeVersion: runtime.version,\n      runtimeUrl: bootstrapStatus.geladenVon,\n      runtimeSha256: bootstrapStatus.geladenerSha256,\n      aktivFreigegeben: status.aktivFreigegeben,\n      empfangInstalliert: status.empfangInstalliert,\n      heartbeatAktiv: status.lebensnachweisAutomatikAktiv,\n      heartbeatVersuche: status.lebensnachweisSendeVersuche,\n      heartbeatErfolge: status.lebensnachweisSendeErfolge,\n      heartbeatFehler: status.lebensnachweisSendeFehler,\n      generation: basis.laufzeit.generation,\n      schattenNachweisKennung:\n        globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG.schattenUebergabe.nachweis.nachweisKennung\n    }));\n    testApi.test.setzeStatus(\n      'bereit',\n      'Live-Preflight bestanden: Runtime aktiv, echter Produktionsheartbeat bestaetigt, Schattennachweis gebunden. Jetzt nur „2 · Kontrolliert live“ mit dem angezeigten Bestaetigungstext ausfuehren.'\n    );\n    testApi.test.setzeAktionAktiv('kontrolliert-live', true);\n  }).catch((ursache) => {\n    const meldung = ursache instanceof Error ? ursache.message : String(ursache);\n    zustand.phase = 'fehlgeschlagen';\n    zustand.bereit = false;\n    zustand.fehler = meldung;\n    testApi.test.setzeAktionAktiv('kontrolliert-live', false);\n    testApi.test.setzeAktionAktiv('soak', false);\n    testApi.test.setzeErgebnis(\n      Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }),\n      'fail',\n      meldung\n    );\n    testApi.test.protokolliere('Kontrollierter Live-Launcher FEHLER', meldung);\n  });\n})();\n/* ===== END kontrollierter Live-Launcher ===== */\n";
}

export async function baueBlock85LivePaket() {
  const evidenz = JSON.parse(await readFile(evidenzPfad, 'utf8'));
  const schattenUebergabe = pruefeEvidenz(evidenz);
  const teile = [kopf(schattenUebergabe)];
  for (const quelle of quellen) {
    const inhalt = await readFile(path.join(wurzel, quelle), 'utf8');
    teile.push(
      '\n/* ===== BEGIN ' + quelle + ' ===== */\n' +
      inhalt.trim() +
      '\n/* ===== END ' + quelle + ' ===== */\n'
    );
  }
  teile.push(fuss());
  const paket = teile.join('');
  return paket.endsWith('\n') ? paket : paket + '\n';
}

const pruefen = process.argv.includes('--pruefen');
const paket = await baueBlock85LivePaket();

if (pruefen) {
  const vorhanden = await readFile(zielPfad, 'utf8');
  if (vorhanden !== paket) {
    throw new Error(
      'block8-5-live-paket.js ist nicht source-locked. Mit npm run block8-5-live-paket:bauen neu erzeugen.'
    );
  }
  console.log(
    'Block-8.5 Live-/Soak-Paket source-locked: ' +
    Buffer.byteLength(paket, 'utf8') +
    ' Bytes.'
  );
} else {
  await writeFile(zielPfad, paket, 'utf8');
  console.log(
    'Block-8.5 Live-/Soak-Paket gebaut: ' +
    path.relative(wurzel, zielPfad) +
    ' (' +
    Buffer.byteLength(paket, 'utf8') +
    ' Bytes).'
  );
}
