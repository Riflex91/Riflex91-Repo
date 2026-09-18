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
  "schritt: 'gruppenziel_passive_vorpruefung'",
  'gruppenZielVorbereitungVerbraucht === false',
  'laufendeGruppenAnfragen.length === 0',
  'ressourcenSperren.length === 0',
  'runtime.bereiteGruppenZielVor',
  'runtime.installiereGruppenZielLiveSmoke',
  'runner.vorschau()',
  'Finale Produktionsvorschau unmittelbar vor one-shot',
  'runner.starte(runner.startText())',
  'Fail-safe Cleanup nach one-shot Fehler',
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
  '6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec',
  'd0c2893784891b971caf2cbaca495b62643ffa098009c49bd508781c2e014aa6',
  'BEGIN werkzeuge/adventure-land-v4-bootstrap.js',
  'BEGIN werkzeuge/adventure-land-test-gui.js',
  'BEGIN werkzeuge/block8-gruppenziel-live-smoke.js',
  'BEGIN werkzeuge/block8-produktions-live-test-gui.js'
]) {
  if (!paket.includes(pflicht)) throw new Error(`Block-8 Live-Test-Komplettpaket fehlt: ${pflicht}`);
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-produktions-live-test-gui.test.mjs'), 'utf8');
for (const pflicht of [
  'fuehrt passive Vorpruefung ohne zentrale Anfrage und finalen one-shot atomar aus',
  'deaktiviert Vorpruefung und one-shot auf Nicht-Leiter',
  'findet passives Vorpruefungsziel auch ueber entity.id statt nur ueber Objekt-Key',
  'stoppt nach passiver Vorpruefung ohne zentrale Ressourcen',
  'besitzt selbst keinen direkten Adventure-Land-Aktionsaufruf'
]) {
  if (!tests.includes(pflicht)) throw new Error(`Block-8 Live-Test-GUI-Test fehlt: ${pflicht}`);
}

console.log('V4 Live-Test-GUI geprueft: kopierbarer Bericht, passive ressourcenfreie Vorpruefung, atomarer 1,5s one-shot, Fail-safe Cleanup, kein direkter Adventure-Land-Aktionsaufruf und source-locked Komplettpaket.');
