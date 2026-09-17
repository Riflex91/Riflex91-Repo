import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-6-FARMEN.md',
  'dokumentation/BLOCK-6-AKTIVTEST.md',
  'dokumentation/BLOCK-6-SCHATTENQUALITAET.md',
  'laufzeit/quelle/vertraege/farmen.ts',
  'laufzeit/quelle/spiellogik/grundlegendes-farmen.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-farm-ausfuehrung.ts',
  'laufzeit/quelle/telemetrie/farm-leistungs-erfassung.ts',
  'laufzeit/tests/grundlegendes-farmen.test.mjs',
  'laufzeit/tests/farm-ausfuehrung.test.mjs',
  'laufzeit/tests/farm-leistung.test.mjs',
  'laufzeit/tests/block6-schattenlauf-ranger.test.mjs',
  'laufzeit/tests/block6-schattenlauf-qualitaet.test.mjs',
  'laufzeit/tests/block6-aktivtest-ranger.test.mjs',
  'werkzeuge/block6-live-test.js',
  'werkzeuge/block6-schattenlauf-ranger.js',
  'werkzeuge/block6-schattenlauf-qualitaet.js',
  'werkzeuge/block6-kompaktbericht.js',
  'werkzeuge/block6-aktivtest-ranger.js'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const fachlogikPfad = path.join(wurzel, 'laufzeit/quelle/spiellogik/grundlegendes-farmen.ts');
const fachlogik = await readFile(fachlogikPfad, 'utf8');
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(fachlogik)) {
    throw new Error(`Block-6-Fachlogik darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(fachlogik)) throw new Error('Block-6-Fachlogik muss ohne versteckte Uhrzeit und Zufallsquelle deterministisch bleiben.');
}

const ausfuehrung = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-farm-ausfuehrung.ts'), 'utf8');
for (const pflichtText of [
  'aktivFreigegeben',
  'Nur eine von der zentralen AktionsSteuerung gestartete Anfrage',
  "'attack'",
  "'move'",
  "'loot'",
  "'use_hp'",
  "'use_mp'"
]) {
  if (!ausfuehrung.includes(pflichtText)) throw new Error(`Block-6-Ausfuehrungsgrenze ist unvollstaendig: ${pflichtText}`);
}

const liveTest = await readFile(path.join(wurzel, 'werkzeuge/block6-live-test.js'), 'utf8');
for (const pflichtText of ['Restzeit', 'starteSchatten24h', 'starteAktivBegrenzt', 'Dieser Timer zeigt nur die Testdauer an und steuert keine Farmaktion.']) {
  if (!liveTest.includes(pflichtText)) throw new Error(`Block-6-Live-Test-Regel fehlt: ${pflichtText}`);
}

const schattenRunner = await readFile(path.join(wurzel, 'werkzeuge/block6-schattenlauf-ranger.js'), 'utf8');
for (const pflichtText of [
  "const STANDARD_DAUER = 30 * 60 * 1000",
  'V4Block6SchattenRanger',
  'sichtbareMonsterArten',
  "startSnapshot.charakter.klasse !== 'ranger'",
  'echteSpielaktionenAusgefuehrt: false'
]) {
  if (!schattenRunner.includes(pflichtText)) throw new Error(`Block-6-Ranger-Schattenlauf ist unvollstaendig: ${pflichtText}`);
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(schattenRunner)) {
    throw new Error(`Block-6-Ranger-Schattenlauf muss read-only bleiben; direkter Aufruf gefunden: ${aktionsName}.`);
  }
}

const schattenQualitaet = await readFile(path.join(wurzel, 'werkzeuge/block6-schattenlauf-qualitaet.js'), 'utf8');
for (const pflichtText of [
  'V4Block6SchattenQualitaet',
  'performance_trick',
  'aktivierePerformanceTrick',
  'erwarteteSchritte',
  'verpassteIntervalle',
  'maximaleTickLueckeMillisekunden',
  'browserSamplingAusreichend',
  "status = 'unvollstaendig'",
  'kompaktErgebnis',
  'start30Minuten'
]) {
  if (!schattenQualitaet.includes(pflichtText)) throw new Error(`Block-6-Schattenqualitaet ist unvollstaendig: ${pflichtText}`);
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(schattenQualitaet)) {
    throw new Error(`Block-6-Schattenqualitaet muss read-only bleiben; direkter Aufruf gefunden: ${aktionsName}.`);
  }
}

const kompaktbericht = await readFile(path.join(wurzel, 'werkzeuge/block6-kompaktbericht.js'), 'utf8');
for (const pflichtText of ['kompaktErgebnis', 'V4Block6Kompaktbericht', 'zielZaehler', 'ereignisse']) {
  if (pflichtText === 'zielZaehler' || pflichtText === 'ereignisse') {
    if (new RegExp(`\\b${pflichtText}\\s*:`).test(kompaktbericht)) {
      throw new Error(`Block-6-Kompaktbericht darf das grosse Detailfeld ${pflichtText} nicht in den Kompaktbericht uebernehmen.`);
    }
  } else if (!kompaktbericht.includes(pflichtText)) {
    throw new Error(`Block-6-Kompaktbericht ist unvollstaendig: ${pflichtText}`);
  }
}

const aktivRunner = await readFile(path.join(wurzel, 'werkzeuge/block6-aktivtest-ranger.js'), 'utf8');
for (const pflichtText of [
  'V4Block6AktivRanger',
  'aktivFreigegeben',
  'BrowserAktionsSteuerung',
  'Nur eine von der zentralen Browser-Aktionssteuerung gestartete Anfrage',
  "const MAX_DAUER = 15 * 60 * 1000",
  "const ERLAUBTE_MONSTER_ART = 'goo'",
  'FARM_STILLSTAND',
  'sicherheitsstopp',
  'fuehreFreigegebeneAktionAus'
]) {
  if (!aktivRunner.includes(pflichtText)) throw new Error(`Block-6-Ranger-Aktivtest ist unvollstaendig: ${pflichtText}`);
}
for (const verboteneArt of ['bee', 'crab', 'snake']) {
  if (aktivRunner.includes(`ERLAUBTE_MONSTER_ART = '${verboteneArt}'`)) {
    throw new Error(`Block-6-Ranger-Aktivtest darf fuer den ersten Test nicht ${verboteneArt} freigeben.`);
  }
}

const dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-6-FARMEN.md'), 'utf8');
for (const regel of [
  'Keine Farmentscheidung ruft Adventure Land direkt auf.',
  'Aktive Farmaktionen werden nur nach einer gestarteten Anfrage der zentralen `AktionsSteuerung` ausgefuehrt.',
  'Ein volles Inventar fuehrt in Block 6 niemals zu automatischem Verkauf, Zerstoeren oder Verschieben von Gegenstaenden.',
  'Gleicher Spielzustand plus gleicher expliziter Farmzustand ergibt die gleiche Entscheidung.',
  '30-Minuten-Ranger-Schattenlauf'
]) {
  if (!dokument.includes(regel)) throw new Error(`Pflichtregel fuer Block 6 fehlt: ${regel}`);
}

const aktivDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-6-AKTIVTEST.md'), 'utf8');
for (const regel of ['Ranger', '`goo`', 'aktivFreigegeben: true', 'maximal 15 Minuten', 'Sicherheitsstopp', 'V4Block6AktivRanger.kompaktErgebnis()']) {
  if (!aktivDokument.includes(regel)) throw new Error(`Pflichtregel fuer den Block-6-Aktivtest fehlt: ${regel}`);
}

const qualitaetsDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-6-SCHATTENQUALITAET.md'), 'utf8');
for (const regel of ['Sampling-Qualitaet', 'performance_trick()', '30-Minuten-Ranger-Schattenlauf', '95 %', 'verpassteIntervalle', 'unvollstaendig', 'V4Block6SchattenQualitaet.kompaktErgebnis()']) {
  if (!qualitaetsDokument.includes(regel)) throw new Error(`Pflichtregel fuer Block-6-Schattenqualitaet fehlt: ${regel}`);
}

console.log(`Block 6 geprueft: ${pflichtDateien.length} Pflichtdateien, deterministische Fachlogik, read-only Schattenlauf mit performance_trick() und Sampling-Qualitaet sowie begrenzter Ranger-Aktivtest.`);
