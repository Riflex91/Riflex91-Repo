import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-8-GRUPPENAKTIONSSCHATTEN.md',
  'laufzeit/tests/block8-gruppenaktionsplanung-schatten.test.mjs',
  'werkzeuge/block8-gruppenaktionsplanung-kern.js',
  'werkzeuge/block8-gruppenaktionsplanung-schatten.js'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const produktivPfad = path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-aktionsplanung.ts');
const produktivBlobSha = execFileSync('git', ['hash-object', produktivPfad], { encoding: 'utf8' }).trim();
const browserKern = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenaktionsplanung-kern.js'), 'utf8');
if (!browserKern.includes(`QUELL_BLOB_SHA = '${produktivBlobSha}'`)) {
  throw new Error(`Block-8-Gruppenaktionsplanungs-Browserkern ist nicht an den Produktionskern gebunden: erwartet ${produktivBlobSha}.`);
}
for (const pflichtText of [
  'V4Block8GruppenAktionsPlanungKern',
  'planeGruppenAktionen',
  'eigeneGruppenPlanSchritte',
  'erstelleGruppenAktionsPlanKonfiguration',
  "quellDatei: 'v4/laufzeit/quelle/spiellogik/gruppen-aktionsplanung.ts'"
]) {
  if (!browserKern.includes(pflichtText)) throw new Error(`Block-8-Gruppenaktionsplanungs-Browserkern ist unvollstaendig: ${pflichtText}`);
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(browserKern)) throw new Error('Der Gruppenaktionsplanungs-Browserkern muss deterministisch ohne versteckte Uhrzeit oder Zufall bleiben.');
}

const koordinationsSchatten = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenkoordination-schatten.js'), 'utf8');
for (const pflichtText of [
  "const VERSION = '1.1.0'",
  'meldungen = Object.freeze',
  'meldungen,',
  'meldungsAnzahl: ergebnis.meldungen.length'
]) {
  if (!koordinationsSchatten.includes(pflichtText)) {
    throw new Error(`Koordinationsschatten stellt den geprueften Meldungssnapshot nicht stabil bereit: ${pflichtText}`);
  }
}

const schatten = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenaktionsplanung-schatten.js'), 'utf8');
for (const pflichtText of [
  'V4Block8Gruppenaktionsplanung',
  'V4Block8Gruppenkoordination',
  'V4Block8GruppenAktionsPlanungKern',
  'planSignatur',
  'eigeneSchritte',
  'aktionsAnfragenErzeugt: false',
  'echteSpielaktionenAusgefuehrt: false'
]) {
  if (!schatten.includes(pflichtText)) throw new Error(`Block-8-Gruppenaktionsschatten ist unvollstaendig: ${pflichtText}`);
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(schatten)) throw new Error('Der Gruppenaktionsschatten muss den Koordinationszeitpunkt verwenden und darf keine eigene versteckte Uhrzeit oder Zufallsquelle einfuehren.');
}
for (const text of [browserKern, schatten]) {
  for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
    if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(text)) {
      throw new Error(`Der Gruppenaktionsschatten darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
    }
  }
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenaktionsplanung-schatten.test.mjs'), 'utf8');
for (const pflichtText of [
  'Browserkern bleibt fuer Normal, Safety, Blockierung und Stale identisch zur produktiven Planung',
  'beide Ranger erhalten aus demselben Snapshot denselben Gruppenplan und nur unterschiedliche eigene Schritte',
  'echte Schattenkette zeigt Aktiv, Stale und Reconnect ohne AktionsAnfrage oder Spielaktion',
  'Safety unterdrueckt Zielarbeit und laesst nur begruendete Heilung oder Schutz zu'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-8-Gruppenaktionsschattentest fehlt: ${pflichtText}`);
}

console.log('Block 8 Gruppenaktionsschatten geprueft: source-locked, zwei-Ranger-faehig, Stale/Reconnect/Safety und ohne Spielaktion.');
