import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-8-GRUPPENKOORDINATION.md',
  'laufzeit/quelle/vertraege/gruppen-koordination.ts',
  'laufzeit/quelle/spiellogik/gruppen-koordination.ts',
  'laufzeit/tests/block8-gruppenkoordination.test.mjs'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const vertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/gruppen-koordination.ts'), 'utf8');
for (const pflichtText of [
  'GRUPPEN_FAEHIGKEITEN',
  "'heilen'",
  "'schaden'",
  "'aggro'",
  "'schutz'",
  "'unterstuetzung'",
  'GruppenTeilnehmerMeldung',
  'GruppenKoordinationsEntscheidung',
  'lebensnachweisMaximalAlterMillisekunden'
]) {
  if (!vertrag.includes(pflichtText)) throw new Error(`Block-8-Gruppenvertrag ist unvollstaendig: ${pflichtText}`);
}

const logik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-koordination.ts'), 'utf8');
for (const pflichtText of [
  'koordiniereGruppe',
  'verdichteNeuesteMeldungen',
  'waehleFaehigkeitsTraeger',
  'gemeinsameGefahrenStufe',
  'gemeinsamesZiel',
  "status = 'veraltet'",
  "status = 'ausgefallen'",
  "status = 'falsche_welt'",
  "status = 'falsche_instanz'"
]) {
  if (!logik.includes(pflichtText)) throw new Error(`Block-8-Gruppenlogik ist unvollstaendig: ${pflichtText}`);
}

for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(logik)) throw new Error('Block-8-Gruppenkoordination muss ohne versteckte Uhrzeit und Zufallsquelle deterministisch bleiben.');
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'send_cm', 'send_party_invite']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(logik)) {
    throw new Error(`Block-8-Gruppenkoordination darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenkoordination.test.mjs'), 'utf8');
for (const pflichtText of [
  'Aufgaben werden aus Faehigkeiten und nicht aus Klassen abgeleitet',
  'veraltete Lebensnachweise werden ausgeschlossen und Aufgaben neu verteilt',
  'ausgefallener Teilnehmer verliert Aufgaben und frischer Lebensnachweis stellt ihn wieder her',
  'anderer Server oder andere Instanz wird nicht mitkoordiniert',
  'gemeinsame Sicherheitslage hat Vorrang vor gemeinsamem Ziel',
  'gleiche Eingaben ergeben unabhaengig von Eingabereihenfolge dieselbe Entscheidung'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-8-Gruppentest fehlt: ${pflichtText}`);
}

console.log('Block-8-Strukturpruefung bestanden.');
