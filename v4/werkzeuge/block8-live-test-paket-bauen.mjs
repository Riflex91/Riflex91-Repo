import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const zielPfad = path.join(wurzel, 'werkzeuge', 'block8-live-test-paket.js');
const quellen = [
  'werkzeuge/adventure-land-v4-bootstrap.js',
  'werkzeuge/adventure-land-test-gui.js',
  'werkzeuge/block8-gruppenziel-live-smoke.js',
  'werkzeuge/block8-produktions-live-test-gui.js'
];

const RELEASE_SHA = '47288ddfdef03ded63142670cdaca5d7ed251a75';
const RUNTIME_SHA256 = '8e50143a671a8ce30d14150cb14971c20c89daa5dbb651064dfb1ea4f13cdcfa';

function kopf() {
  return [
    '/* GENERATED: V4 Block 8 Live-Test-Komplettpaket.',
    ' * Quelle: block8-live-test-paket-bauen.mjs',
    ' * Keine Adventure-Land-Aktionsfunktion wird in der GUI direkt aufgerufen.',
    ' */',
    'globalThis.AIO_V4_RUNTIME_CONFIG = Object.freeze({',
    '  aktivFreigegeben: true,',
    "  ablaufKennung: 'block8-gui-live-test',",
    "  vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2']),",
    '  faehigkeiten: Object.freeze({',
    '    heilen: 0,',
    '    schaden: 1,',
    '    aggro: 0,',
    '    schutz: 0,',
    '    unterstuetzung: 0',
    '  })',
    '});',
    '',
    'globalThis.AIO_V4_BOOTSTRAP_CONFIG = Object.freeze({',
    "  runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/" + RELEASE_SHA + "/aio-v4-runtime.js',",
    "  runtimeSha256: '" + RUNTIME_SHA256 + "'",
    '});',
    '',
    'globalThis.AIO_V4_LIVE_TEST_GUI_CONFIG = Object.freeze({',
    "  leiterName: 'My_Ranger1'",
    '});',
    ''
  ].join('\n');
}

export async function baueBlock8LiveTestPaket() {
  const teile = [kopf()];
  for (const quelle of quellen) {
    const inhalt = await readFile(path.join(wurzel, quelle), 'utf8');
    teile.push(
      '\n/* ===== BEGIN ' + quelle + ' ===== */\n' +
      inhalt.trim() +
      '\n/* ===== END ' + quelle + ' ===== */\n'
    );
  }
  return teile.join('\n').trim() + '\n';
}

const pruefen = process.argv.includes('--pruefen');
const paket = await baueBlock8LiveTestPaket();

if (pruefen) {
  const vorhanden = await readFile(zielPfad, 'utf8');
  if (vorhanden !== paket) {
    throw new Error('block8-live-test-paket.js ist nicht source-locked. Mit npm run block8-live-test-gui:bauen neu erzeugen.');
  }
  console.log('Block-8 Live-Test-GUI-Paket source-locked: ' + Buffer.byteLength(paket, 'utf8') + ' Bytes.');
} else {
  await writeFile(zielPfad, paket, 'utf8');
  console.log('Block-8 Live-Test-GUI-Paket gebaut: ' + path.relative(wurzel, zielPfad) + ' (' + Buffer.byteLength(paket, 'utf8') + ' Bytes).');
}
