import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const zielPfad = path.join(wurzel, 'werkzeuge', 'block8-10-minuten-gruppentest-paket.js');
const quellen = [
  'werkzeuge/adventure-land-v4-bootstrap.js',
  'werkzeuge/adventure-land-test-gui.js',
  'werkzeuge/block8-10-minuten-gruppentest-gui.js'
];

const RELEASE_SHA = '024c121246a3ad1b579e2dc8d32771b284b3f6e1';
const RUNTIME_SHA256 = 'a5d70d798eb66725ceac6b6ffc80fe4e95751ce9b86e547a427183ee8b24a5a6';

function kopf() {
  return [
    '/* GENERATED: V4 Block 8 10-Minuten-Gruppentest-Komplettpaket.',
    ' * Quelle: block8-10-minuten-paket-bauen.mjs',
    ' * Gleiches Paket fuer My_Ranger1 und My_Ranger2.',
    ' */',
    '(() => {',
    "  'use strict';",
    '  let spiel = globalThis;',
    '  try {',
    "    if (typeof parent !== 'undefined' && parent && parent.character) spiel = parent;",
    '  } catch {',
    '    // Lokaler Kontext bleibt Fallback.',
    '  }',
    "  const name = typeof spiel.character?.name === 'string' ? spiel.character.name : '';",
    "  if (name !== 'My_Ranger1' && name !== 'My_Ranger2') {",
    "    throw new Error('Block-8 10-Minuten-Paket ist nur fuer My_Ranger1 und My_Ranger2 freigegeben.');",
    '  }',
    "  const istRanger2 = name === 'My_Ranger2';",
    '  const faehigkeiten = Object.freeze({',
    '    heilen: 0,',
    '    schaden: 1,',
    '    aggro: 0,',
    '    schutz: 0,',
    '    unterstuetzung: istRanger2 ? 1 : 0.5',
    '  });',
    '  globalThis.AIO_V4_RUNTIME_CONFIG = Object.freeze({',
    '    aktivFreigegeben: true,',
    "    ablaufKennung: 'block8-10-minuten-gruppentest',",
    "    vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2']),",
    '    faehigkeiten',
    '  });',
    '  globalThis.AIO_V4_BOOTSTRAP_CONFIG = Object.freeze({',
    "    runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/" + RELEASE_SHA + "/aio-v4-runtime.js',",
    "    runtimeSha256: '" + RUNTIME_SHA256 + "'",
    '  });',
    '  globalThis.AIO_V4_10MIN_TEST_CONFIG = Object.freeze({',
    "    leiterName: 'My_Ranger1',",
    "    stoerTeilnehmerName: 'My_Ranger2'",
    '  });',
    '})();',
    ''
  ].join('\n');
}

export async function baueBlock8ZehnMinutenPaket() {
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
const paket = await baueBlock8ZehnMinutenPaket();

if (pruefen) {
  const vorhanden = await readFile(zielPfad, 'utf8');
  if (vorhanden !== paket) {
    throw new Error('block8-10-minuten-gruppentest-paket.js ist nicht source-locked. Mit npm run block8-10-minuten-gruppentest:bauen neu erzeugen.');
  }
  console.log('Block-8 10-Minuten-Paket source-locked: ' + Buffer.byteLength(paket, 'utf8') + ' Bytes.');
} else {
  await writeFile(zielPfad, paket, 'utf8');
  console.log('Block-8 10-Minuten-Paket gebaut: ' + path.relative(wurzel, zielPfad) + ' (' + Buffer.byteLength(paket, 'utf8') + ' Bytes).');
}
