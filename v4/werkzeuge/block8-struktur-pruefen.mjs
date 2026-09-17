import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-8-GRUPPENKOORDINATION.md',
  'dokumentation/BLOCK-8-LEBENSNACHWEIS.md',
  'dokumentation/BLOCK-8-KOORDINATIONSSCHATTEN.md',
  'dokumentation/BLOCK-8-KAMPFSICHERHEITS-KOPPLUNG.md',
  'laufzeit/quelle/vertraege/gruppen-koordination.ts',
  'laufzeit/quelle/vertraege/gruppen-lebensnachweis.ts',
  'laufzeit/quelle/spiellogik/gruppen-koordination.ts',
  'laufzeit/quelle/spiellogik/gruppen-lebensnachweis.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-lebensnachweis-austausch.ts',
  'laufzeit/tests/block8-gruppenkoordination.test.mjs',
  'laufzeit/tests/block8-lebensnachweis-austausch.test.mjs',
  'laufzeit/tests/block8-kampfsicherheits-kopplung.test.mjs',
  'laufzeit/tests/block8-live-kampfsicherheit.test.mjs',
  'laufzeit/tests/block8-gruppenkoordination-schatten.test.mjs',
  'werkzeuge/block7-kampfsicherheits-quelle.js',
  'werkzeuge/block8-lebensnachweis-schatten.js',
  'werkzeuge/block8-gruppenkoordination-kern.js',
  'werkzeuge/block8-gruppenkoordination-schatten.js'
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

const lebensnachweisVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/gruppen-lebensnachweis.ts'), 'utf8');
for (const pflichtText of ['GruppenTeilnehmerMeldungsSicherheitsEingabe', 'KampfSicherheitsEntscheidung', 'sicherheitsEntscheidung']) {
  if (!lebensnachweisVertrag.includes(pflichtText)) throw new Error(`Block-8-Lebensnachweisvertrag hat keine feste Block-7-Kopplung: ${pflichtText}`);
}

const logikPfad = path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-koordination.ts');
const logik = await readFile(logikPfad, 'utf8');
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
  'erstelleGruppenTeilnehmerMeldungAusKampfsicherheit',
  'sicherheitsEntscheidung',
  'gefahrenBewertung',
  'selben Spielzustandszeitpunkt',
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

const kopplungsTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-kampfsicherheits-kopplung.test.mjs'), 'utf8');
for (const pflichtText of [
  'sichere Block-7-Bewertung wird unveraendert in den Lebensnachweis uebernommen',
  'kritische Block-7-Bewertung kann von Block 8 nicht abgeschwaecht werden',
  'unbekannte Block-7-Sicherheitslage bleibt unbekannt und damit gruppenweit fail-safe',
  'Sicherheitsentscheidung eines anderen Spielzustandszeitpunkts wird blockiert'
]) {
  if (!kopplungsTests.includes(pflichtText)) throw new Error(`Block-8-Kampfsicherheits-Kopplungstest fehlt: ${pflichtText}`);
}

const liveSicherheitsTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-live-kampfsicherheit.test.mjs'), 'utf8');
for (const pflichtText of [
  'Browserquelle bleibt fuer',
  'kritische Block-7-Bewertung wird automatisch in den gesendeten Lebensnachweis uebernommen',
  'manuelle gefahrenStufe ist im Live-Lebensnachweis verboten',
  'fehlende Block-7-Quelle blockiert vor send_cm',
  'stale Block-7-Bewertung blockiert vor send_cm'
]) {
  if (!liveSicherheitsTests.includes(pflichtText)) throw new Error(`Block-8-Live-Kampfsicherheitstest fehlt: ${pflichtText}`);
}

const schattenTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenkoordination-schatten.test.mjs'), 'utf8');
for (const pflichtText of [
  'Browserkern bleibt fuer Aktiv, Stale, Reconnect und Safety identisch zur produktiven koordiniereGruppe',
  'veralteter Teilnehmer verliert seine Aufgabe und frischer Reconnect erhaelt sie zurueck',
  'Live-Werkzeug fuehrt nur Lebensnachweis-Kommunikation und die Koordinationsauswertung aus'
]) {
  if (!schattenTests.includes(pflichtText)) throw new Error(`Block-8-Koordinationsschattentest fehlt: ${pflichtText}`);
}

const kampfLogikPfad = path.join(wurzel, 'laufzeit/quelle/spiellogik/kampfsicherheit.ts');
const kampfProduktivBlobSha = execFileSync('git', ['hash-object', kampfLogikPfad], { encoding: 'utf8' }).trim();
const sicherheitsQuelle = await readFile(path.join(wurzel, 'werkzeuge/block7-kampfsicherheits-quelle.js'), 'utf8');
if (!sicherheitsQuelle.includes(`QUELL_BLOB_SHA = '${kampfProduktivBlobSha}'`)) {
  throw new Error(`Block-7-Live-Sicherheitsquelle ist nicht an den aktuellen Produktionskern gebunden: erwartet ${kampfProduktivBlobSha}.`);
}
for (const pflichtText of ['V4Block7KampfsicherheitsQuelle', 'bewerteGefahr', 'gefahrenBewertung', 'echteSpielaktionenAusgefuehrt: false']) {
  if (!sicherheitsQuelle.includes(pflichtText)) throw new Error(`Block-7-Live-Sicherheitsquelle ist unvollstaendig: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(sicherheitsQuelle)) {
    throw new Error(`Die Block-7-Live-Sicherheitsquelle darf ${unerlaubt} nicht aufrufen.`);
  }
}

const schattenWerkzeug = await readFile(path.join(wurzel, 'werkzeuge/block8-lebensnachweis-schatten.js'), 'utf8');
for (const pflichtText of [
  'V4Block8Lebensnachweis',
  'v4-gruppen-lebensnachweis-v1',
  'V4Block7KampfsicherheitsQuelle',
  'leseSicherheitsBewertung',
  'sicherheitsMaximalAlterMillisekunden',
  'gefahrenStufe darf nicht mehr manuell konfiguriert werden',
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
if (schattenWerkzeug.includes('gefahrenStufe: konfiguration.gefahrenStufe')) {
  throw new Error('Block-8-Live-Lebensnachweis darf keine statisch konfigurierte Gefahrenstufe mehr senden.');
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(schattenWerkzeug)) {
    throw new Error(`Das Block-8-Lebensnachweis-Schattenwerkzeug darf ${unerlaubt} nicht aufrufen.`);
  }
}

const browserKern = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenkoordination-kern.js'), 'utf8');
const produktivBlobSha = execFileSync('git', ['hash-object', logikPfad], { encoding: 'utf8' }).trim();
if (!browserKern.includes(`QUELL_BLOB_SHA = '${produktivBlobSha}'`)) {
  throw new Error(`Block-8-Browserkern ist nicht an den aktuellen Produktionskern gebunden: erwartet ${produktivBlobSha}.`);
}
for (const pflichtText of ['V4Block8GruppenKoordinationKern', 'koordiniereGruppe', 'erstelleGruppenKoordinationsKonfiguration', 'quellBlobSha']) {
  if (!browserKern.includes(pflichtText)) throw new Error(`Block-8-Browserkern ist unvollstaendig: ${pflichtText}`);
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(browserKern)) throw new Error('Block-8-Browserkern muss wie der Produktionskern deterministisch bleiben.');
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(browserKern)) throw new Error(`Block-8-Browserkern darf ${unerlaubt} nicht aufrufen.`);
}

const koordinationsSchatten = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenkoordination-schatten.js'), 'utf8');
for (const pflichtText of ['V4Block8Gruppenkoordination', 'V4Block8Lebensnachweis', 'V4Block8GruppenKoordinationKern', 'sendeEinmal', 'koordiniereGruppe', 'echteSpielaktionenAusgefuehrt: false']) {
  if (!koordinationsSchatten.includes(pflichtText)) throw new Error(`Block-8-Koordinationsschatten ist unvollstaendig: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(koordinationsSchatten)) throw new Error(`Block-8-Koordinationsschatten darf ${unerlaubt} nicht aufrufen.`);
}

console.log('Block-8-Strukturpruefung bestanden.');
