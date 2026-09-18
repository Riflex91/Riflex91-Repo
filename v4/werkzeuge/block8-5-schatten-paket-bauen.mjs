import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const zielPfad = path.join(wurzel, 'werkzeuge', 'block8-5-schatten-paket.js');
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

function kopf() {
  return "/* GENERATED: V4 Block 8.5.9 striktes Schatten-Komplettpaket.\n * Quelle: block8-5-schatten-paket-bauen.mjs\n * Runtime wird immutable per HTTPS+SHA geladen, aber NICHT gestartet.\n * Keine Adventure-Land-Spielaktionsfunktion wird vom Paket direkt aufgerufen.\n */\n(() => {\n  'use strict';\n\n  const belegteNamen = [\n    'AIO_V4_RUNTIME_CONFIG',\n    'AIO_V4_BOOTSTRAP_CONFIG',\n    'AIO_V4_BLOCK85_FREIGABE_CONFIG',\n    'V4ProduktionsLaufzeit',\n    'V4Bootstrap',\n    'V4TestGui',\n    'V4Block85FreigabeLiveTest',\n    'V4Block85SchattenLauncher'\n  ].filter((name) => globalThis[name] !== undefined);\n  if (belegteNamen.length > 0) {\n    throw new Error(\n      'Block-8.5-Schattenpaket verlangt einen frischen Codekontext; bereits vorhanden: ' +\n      belegteNamen.join(', ')\n    );\n  }\n\n  const laufKennung = 'block8-5-schatten-' + String(Date.now());\n  function setzeGlobal(name, wert) {\n    Object.defineProperty(globalThis, name, {\n      configurable: true,\n      enumerable: true,\n      writable: false,\n      value: wert\n    });\n  }\n\n  setzeGlobal('AIO_V4_RUNTIME_CONFIG', Object.freeze({\n    aktivFreigegeben: false,\n    ablaufKennung: laufKennung\n  }));\n  setzeGlobal('AIO_V4_BOOTSTRAP_CONFIG', Object.freeze({\n    runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',\n    runtimeSha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f'\n  }));\n  setzeGlobal('AIO_V4_BLOCK85_FREIGABE_CONFIG', Object.freeze({\n    aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',\n    laufKennung,\n    modus: 'schatten',\n    soakDauerMillisekunden: 600000\n  }));\n})();\n";
}

function fuss() {
  return "\n/* ===== BEGIN Schatten-Launcher ===== */\n(() => {\n  'use strict';\n\n  const API_NAME = 'V4Block85SchattenLauncher';\n  const VERSION = '1.0.0';\n  const testApi = globalThis.V4Block85FreigabeLiveTest;\n  const bootstrap = globalThis.V4Bootstrap;\n  if (!testApi?.test || typeof bootstrap?.lade !== 'function') {\n    throw new Error('Schattenpaket konnte Bootstrap/Test-Runner nicht initialisieren.');\n  }\n\n  const zustand = {\n    phase: 'laedt',\n    bereit: false,\n    fehler: null,\n    laufKennung: globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG.laufKennung\n  };\n\n  Object.defineProperty(globalThis, API_NAME, {\n    configurable: true,\n    enumerable: true,\n    writable: false,\n    value: Object.freeze({\n      version: VERSION,\n      laufKennung: zustand.laufKennung,\n      runtimeSha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',\n      runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',\n      status() {\n        return Object.freeze({ ...zustand });\n      }\n    })\n  });\n\n  testApi.test.setzeAktionAktiv('schatten', false);\n  testApi.test.setzeStatus(\n    'laeuft',\n    'Immutable Runtime 1.1.5 wird geladen. Sie wird NICHT gestartet; Schatten bleibt bis zum strikten Preflight gesperrt.'\n  );\n\n  void Promise.resolve(bootstrap.lade()).then((bootstrapStatus) => {\n    const runtime = globalThis.V4ProduktionsLaufzeit;\n    if (!runtime || runtime.version !== '1.1.5') {\n      throw new Error('Geladene Runtime ist nicht Version 1.1.5.');\n    }\n\n    const status = runtime.status();\n    const basis = runtime.basisBedienStatus();\n    const fehler = [];\n    if (bootstrapStatus.geladenVon !== 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js') fehler.push('immutable Runtime-URL');\n    if (bootstrapStatus.geladenerSha256 !== '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f') fehler.push('Runtime-SHA-256');\n    if (status.aktivFreigegeben !== false) fehler.push('aktivFreigegeben=false');\n    if (status.gestoppt !== false) fehler.push('gestoppt=false');\n    if (status.empfangInstalliert !== false) fehler.push('empfangInstalliert=false');\n    if (status.lebensnachweisAutomatikAktiv !== false) fehler.push('Heartbeat inaktiv');\n    if (status.lebensnachweisAutomatikPausiert !== false) fehler.push('Heartbeat nie pausiert');\n    if (status.lebensnachweisSendeVersuche !== 0) fehler.push('Heartbeat-Versuche=0');\n    if (status.lebensnachweisSendeErfolge !== 0) fehler.push('Heartbeat-Erfolge=0');\n    if (status.lebensnachweisSendeFehler !== 0) fehler.push('Heartbeat-Fehler=0');\n    if (status.lebensnachweisSendeOffen !== 0) fehler.push('Heartbeat-Offen=0');\n    if (status.lebensnachweisSendeMaxOffen !== 0) fehler.push('Heartbeat-MaxOffen=0');\n    if (status.performanceTrickAufgerufen !== false) fehler.push('performance_trick nicht aufgerufen');\n    if (status.performanceTrickAufrufe !== 0) fehler.push('performance_trick Aufrufe=0');\n    if (status.liveSmokeInstalliert === true) fehler.push('kein Live-Smoke');\n    if (status.gruppenZielVorbereitungVerbraucht === true) fehler.push('keine Gruppenziel-Vorbereitung');\n    if (basis?.laufzeit?.zustand !== 'laeuft') fehler.push('LaufzeitSteuerung=laeuft');\n    if (basis?.laufzeit?.generation !== 0) fehler.push('Generation=0');\n    if (basis?.laufzeit?.automatischeFortsetzung !== false) fehler.push('automatischeFortsetzung=false');\n\n    if (fehler.length > 0) {\n      throw new Error('Strikter Schatten-Preflight fehlgeschlagen: ' + fehler.join(', '));\n    }\n\n    zustand.phase = 'bereit';\n    zustand.bereit = true;\n    testApi.test.protokolliere('Schatten-Launcher bereit', Object.freeze({\n      laufKennung: zustand.laufKennung,\n      runtimeVersion: runtime.version,\n      runtimeUrl: bootstrapStatus.geladenVon,\n      runtimeSha256: bootstrapStatus.geladenerSha256,\n      aktivFreigegeben: status.aktivFreigegeben,\n      empfangInstalliert: status.empfangInstalliert,\n      heartbeatAktiv: status.lebensnachweisAutomatikAktiv,\n      heartbeatVersuche: status.lebensnachweisSendeVersuche,\n      generation: basis.laufzeit.generation\n    }));\n    testApi.test.setzeStatus(\n      'bereit',\n      'Strikter Schatten-Preflight bestanden: Runtime gesperrt, nicht gestartet, 0 Heartbeat-/CM-Versuche. Jetzt nur „1 · Schattennachweis“ ausfuehren.'\n    );\n    testApi.test.setzeAktionAktiv('schatten', true);\n  }, (ursache) => {\n    const meldung = ursache instanceof Error ? ursache.message : String(ursache);\n    zustand.phase = 'fehlgeschlagen';\n    zustand.bereit = false;\n    zustand.fehler = meldung;\n    testApi.test.setzeAktionAktiv('schatten', false);\n    testApi.test.setzeErgebnis(\n      Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }),\n      'fail',\n      meldung\n    );\n    testApi.test.protokolliere('Schatten-Launcher FEHLER', meldung);\n  });\n})();\n/* ===== END Schatten-Launcher ===== */\n";
}

export async function baueBlock85SchattenPaket() {
  const teile = [kopf()];
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
const paket = await baueBlock85SchattenPaket();

if (pruefen) {
  const vorhanden = await readFile(zielPfad, 'utf8');
  if (vorhanden !== paket) {
    throw new Error(
      'block8-5-schatten-paket.js ist nicht source-locked. Mit npm run block8-5-schatten-paket:bauen neu erzeugen.'
    );
  }
  console.log(
    'Block-8.5 Schattenpaket source-locked: ' +
    Buffer.byteLength(paket, 'utf8') +
    ' Bytes.'
  );
} else {
  await writeFile(zielPfad, paket, 'utf8');
  console.log(
    'Block-8.5 Schattenpaket gebaut: ' +
    path.relative(wurzel, zielPfad) +
    ' (' +
    Buffer.byteLength(paket, 'utf8') +
    ' Bytes).'
  );
}
