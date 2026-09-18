import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'werkzeuge/adventure-land-test-gui.js',
  'werkzeuge/block8-produktions-live-test-gui.js',
  'werkzeuge/block8-live-test-paket-bauen.mjs',
  'werkzeuge/block8-live-test-paket.js',
  'laufzeit/tests/block8-produktions-live-test-gui.test.mjs',
  'werkzeuge/TEST-GUI.md'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const gui = await readFile(path.join(wurzel, 'werkzeuge/adventure-land-test-gui.js'), 'utf8');
for (const pflicht of [
  'V4TestGui',
  'Ergebnis kopieren',
  'Gesamtbericht kopieren',
  'bestaetigungsText',
  'setzeErgebnis',
  'registriereAktion',
  'kopiereBericht',
  'V4 TESTBERICHT'
]) {
  if (!gui.includes(pflicht)) throw new Error(`V4-Test-GUI fehlt: ${pflicht}`);
}

const controller = await readFile(path.join(wurzel, 'werkzeuge/block8-produktions-live-test-gui.js'), 'utf8');
for (const pflicht of [
  'V4Block8ProduktionsLiveTestGui',
  'AIO_V4_LIVE_TEST_GUI_CONFIG',
  'mindestensZweiTeilnehmer',
  'runtimeApi().sendeLebensnachweis()',
  'runtime.bereiteGruppenZielVor',
  'runtime.installiereGruppenZielLiveSmoke',
  'runner.vorschau()',
  'runner.starte(runner.startText())',
  "titel: '5 · ONE-SHOT AUSFUEHREN'",
  'bestaetigungsText: runnerApi().startText()',
  'echteSpielaktionen?.attack === 1',
  'echteSpielaktionen?.sonstige === 0',
  "zentralePhase === 'abgeschlossen'",
  'verbleibendeRessourcen.length === 0'
]) {
  if (!controller.includes(pflicht)) throw new Error(`Block-8 Live-Test-GUI-Controller fehlt: ${pflicht}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(controller)) {
    throw new Error(`Die Block-8 Live-Test-GUI darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
  }
}

const paket = await readFile(path.join(wurzel, 'werkzeuge/block8-live-test-paket.js'), 'utf8');
for (const pflicht of [
  "vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2'])",
  "leiterName: 'My_Ranger1'",
  '47288ddfdef03ded63142670cdaca5d7ed251a75',
  '8e50143a671a8ce30d14150cb14971c20c89daa5dbb651064dfb1ea4f13cdcfa',
  'BEGIN werkzeuge/adventure-land-v4-bootstrap.js',
  'BEGIN werkzeuge/adventure-land-test-gui.js',
  'BEGIN werkzeuge/block8-gruppenziel-live-smoke.js',
  'BEGIN werkzeuge/block8-produktions-live-test-gui.js'
]) {
  if (!paket.includes(pflicht)) throw new Error(`Block-8 Live-Test-Komplettpaket fehlt: ${pflicht}`);
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-produktions-live-test-gui.test.mjs'), 'utf8');
for (const pflicht of [
  'fuehrt Leiterablauf nur ueber Produktions-APIs bis zum bestandenen one-shot',
  'deaktiviert aktive Ziel-/Smoke-Schritte auf Nicht-Leiter',
  'findet Ziel auch ueber entity.id statt nur ueber Objekt-Key',
  'stoppt zentral und meldet freigegebene Ressourcen',
  'besitzt selbst keinen direkten Adventure-Land-Aktionsaufruf'
]) {
  if (!tests.includes(pflicht)) throw new Error(`Block-8 Live-Test-GUI-Test fehlt: ${pflicht}`);
}

console.log('V4 Live-Test-GUI geprueft: kopierbarer Bericht, Zwei-Teilnehmer-Gate, bestaetigter one-shot, kein direkter Adventure-Land-Aktionsaufruf und source-locked Komplettpaket.');
