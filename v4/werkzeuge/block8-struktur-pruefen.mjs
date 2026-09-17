import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-8-GRUPPENKOORDINATION.md',
  'dokumentation/BLOCK-8-LEBENSNACHWEIS.md',
  'laufzeit/quelle/vertraege/gruppen-koordination.ts',
  'laufzeit/quelle/vertraege/gruppen-lebensnachweis.ts',
  'laufzeit/quelle/spiellogik/gruppen-koordination.ts',
  'laufzeit/quelle/spiellogik/gruppen-lebensnachweis.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-lebensnachweis-austausch.ts',
  'laufzeit/tests/block8-gruppenkoordination.test.mjs',
  'laufzeit/tests/block8-lebensnachweis-austausch.test.mjs',
  'werkzeuge/block8-lebensnachweis-schatten.js'
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

const lebensnachweisLogik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-lebensnachweis.ts'), 'utf8');
for (const pflichtText of [
  'erstelleGruppenTeilnehmerMeldungAusSpielzustand',
  'spielzustand.aufgenommenAm',
  'spielzustand.laufendeNummer',
  'Serverkennung',
  'Lebensnachweis wird nicht geraten'
]) {
  if (!lebensnachweisLogik.includes(pflichtText)) throw new Error(`Block-8-Lebensnachweislogik ist unvollstaendig: ${pflichtText}`);
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(lebensnachweisLogik)) throw new Error('Block-8-Lebensnachweislogik muss ihre Zeit aus dem Spielzustand erhalten.');
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'send_cm', 'command_character']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(lebensnachweisLogik)) {
    throw new Error(`Block-8-Lebensnachweislogik darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}

const austausch = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-lebensnachweis-austausch.ts'), 'utf8');
for (const pflichtText of [
  'AdventureLandGruppenLebensnachweisAustausch',
  'GRUPPEN_LEBENSNACHWEIS_PROTOKOLL',
  'vertrauensNamen',
  'sendeLebensnachweis',
  'installiereEmpfang',
  'findeSendeFunktion',
  "empfangsKontext: 'lokaler_codekontext'",
  'send_cm',
  'on_cm'
]) {
  if (!austausch.includes(pflichtText)) throw new Error(`Block-8-Lebensnachweisaustausch ist unvollstaendig: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(austausch)) {
    throw new Error(`Der Block-8-Lebensnachweisaustausch darf ${unerlaubt} nicht aufrufen.`);
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

const austauschTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-lebensnachweis-austausch.test.mjs'), 'utf8');
for (const pflichtText of [
  'reale Spielzustandsfelder werden ohne versteckte Uhrzeit in eine Teilnehmermeldung ueberfuehrt',
  'fehlende Identitaets- oder Weltfelder blockieren statt Werte zu raten',
  'Senden ist standardmaessig gesperrt',
  'freigegebener Lebensnachweis geht genau an einen vertrauten Namen und nutzt nur send_cm',
  'nicht vertraute Ziele werden vor send_cm blockiert',
  'Empfang akzeptiert nur vertraute, namensgebundene V4-Umschlaege',
  'Parent-send_cm wird genutzt waehrend on_cm im lokalen Codekontext bleibt'
]) {
  if (!austauschTests.includes(pflichtText)) throw new Error(`Block-8-Lebensnachweistest fehlt: ${pflichtText}`);
}

const schattenWerkzeug = await readFile(path.join(wurzel, 'werkzeuge/block8-lebensnachweis-schatten.js'), 'utf8');
for (const pflichtText of [
  'V4Block8Lebensnachweis',
  'v4-gruppen-lebensnachweis-v1',
  'holeEmpfangsFenster',
  'holeSpielFunktion',
  "empfangsKontext: 'lokaler_codekontext'",
  'send_cm',
  'on_cm',
  'vertrauensNamen',
  'echteSpielaktionenAusgefuehrt: false'
]) {
  if (!schattenWerkzeug.includes(pflichtText)) throw new Error(`Block-8-Lebensnachweis-Schattenwerkzeug ist unvollstaendig: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(schattenWerkzeug)) {
    throw new Error(`Das Block-8-Lebensnachweis-Schattenwerkzeug darf ${unerlaubt} nicht aufrufen.`);
  }
}

console.log('Block-8-Strukturpruefung bestanden.');
