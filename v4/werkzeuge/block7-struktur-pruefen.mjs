import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-7-KAMPFSICHERHEIT.md',
  'laufzeit/quelle/vertraege/kampfsicherheit.ts',
  'laufzeit/quelle/spiellogik/kampfsicherheit.ts',
  'laufzeit/quelle/wiederholung/kampfsicherheit-wiederholung.ts',
  'laufzeit/tests/kampfsicherheit.test.mjs',
  'laufzeit/tests/kampfsicherheit-wiederholung.test.mjs'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const logik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/kampfsicherheit.ts'), 'utf8');
for (const pflichtText of [
  'KAMPF_RUECKZUG',
  'KAMPF_ABSTAND_HERSTELLEN',
  "wichtigkeit: notfall ? 'notfall' : 'sicherheit'",
  "benoetigteRessourcen: Object.freeze(['bewegung', 'kampfziel'] as const)",
  'markiereSicherheitsBewegungGestartet',
  'KAMPF_RUECKZUG_BLOCKIERT',
  'pruefeAngriffsReichweite'
]) {
  if (!logik.includes(pflichtText)) throw new Error(`Block-7-Kampfsicherheit ist unvollstaendig: ${pflichtText}`);
}

for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(logik)) {
    throw new Error(`Block-7-Kampfsicherheit darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(logik)) throw new Error('Block-7-Kampfsicherheit muss ohne versteckte Uhrzeit und Zufallsquelle deterministisch bleiben.');
}

const wiederholung = await readFile(path.join(wurzel, 'laufzeit/quelle/wiederholung/kampfsicherheit-wiederholung.ts'), 'utf8');
for (const pflichtText of ['erstelleKampfSicherheitsWiederholungsEntscheider', 'aktionsWichtigkeit']) {
  if (!wiederholung.includes(pflichtText)) throw new Error(`Block-7-Wiederholungsanbindung ist unvollstaendig: ${pflichtText}`);
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/kampfsicherheit.test.mjs'), 'utf8');
for (const pflichtText of [
  'kritische Lebenspunkte unter Beschuss erzeugen Notfall-Rueckzug',
  'niedriges Mana unter Beschuss fuehrt konservativ zum Rueckzug',
  'Reichweitenpruefung unterscheidet erreichbar, zu weit und unbekannt',
  'gestartete Sicherheitsbewegung ohne Positionsfortschritt wird als blockiert erkannt',
  'Notfall-Rueckzug unterbricht eine laufende normale Farmbewegung zentral'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-7-Fehlereinspritztest fehlt: ${pflichtText}`);
}

const replayTests = await readFile(path.join(wurzel, 'laufzeit/tests/kampfsicherheit-wiederholung.test.mjs'), 'utf8');
for (const pflichtText of ['ausgabeFingerabdruck', "['rueckzug', 'rueckzug']"]) {
  if (!replayTests.includes(pflichtText)) throw new Error(`Block-7-Replaytest fehlt: ${pflichtText}`);
}

const dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-7-KAMPFSICHERHEIT.md'), 'utf8');
for (const regel of [
  'Kampfsicherheit Vorrang vor Farmleistung',
  '`wichtigkeit: "notfall"`',
  'keine Bewegungsrichtung erfunden',
  'Eine nur geplante Schattenbewegung gilt nicht automatisch als ausgefuehrte Sicherheitsbewegung.'
]) {
  if (!dokument.includes(regel)) throw new Error(`Pflichtregel fuer Block 7 fehlt: ${regel}`);
}

console.log(`Block 7 Kern geprueft: ${pflichtDateien.length} Pflichtdateien, deterministische Gefahrenbewertung, zentral priorisierter Rueckzug und Replay.`);
