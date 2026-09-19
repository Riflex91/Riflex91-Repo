import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const dateien = [
  'laufzeit/quelle/vertraege/skill-katalog.ts',
  'laufzeit/quelle/adventure-land/adventure-land-skill-katalog.ts',
  'laufzeit/tests/skill-katalog.test.mjs',
  'dokumentation/BLOCK-8-6-1-SKILL-KATALOG.md',
  'dokumentation/BLOCK-8-6-PLAN.md',
  'dokumentation/VERTRAEGE.md'
];
for (const relativ of dateien) await access(path.join(wurzel, relativ));

const vertrag = await readFile(path.join(wurzel, dateien[0]), 'utf8');
for (const pflicht of [
  "SKILL_KATALOG_SCHEMA_VERSION = 1",
  "['bereit', 'veraltet', 'drift', 'blockiert']",
  'SkillKatalogEintrag',
  'fachlicherFingerprint',
  'automationValidated',
  'technischeReadiness',
  'aktionsFreigabe: false',
  'spielAutoritaet: false'
]) {
  if (!vertrag.includes(pflicht)) throw new Error(`Block-8.6.1-Skill-Katalog-Vertrag fehlt: ${pflicht}`);
}

const quelle = await readFile(path.join(wurzel, dateien[1]), 'utf8');
for (const pflicht of [
  'AdventureLandSkillKatalogLesequelle',
  'SKILL_KATALOG_QUELLE',
  "'3shot'",
  "'5shot'",
  'max_targets',
  'wtype',
  'offhand_type',
  'consume',
  'requirements',
  'unbekannteRohFelder',
  'automationValidated',
  'bestaetigeAktuellenFingerprint',
  "this.zustand = 'drift'",
  "this.zustand = 'veraltet'",
  "this.zustand = 'blockiert'",
  "import { berechneSha256 } from '../telemetrie/sha256.js';",
  "import { kanonisiereJson } from '../wiederholung/kanonisches-json.js';",
  'berechneSha256(kanonisiereJson(wert))',
  'spielAutoritaet: false as const'
]) {
  if (!quelle.includes(pflicht)) throw new Error(`Block-8.6.1-Live-Lesequelle fehlt: ${pflicht}`);
}

if (/fnv1a64|0xcbf29ce484222325n|0x100000001b3n/i.test(quelle)) {
  throw new Error('Block 8.6.1 darf keine zweite Fingerprint-/Hash-Implementierung neben dem kanonischen V4-Pfad fuehren.');
}

for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /from ['"]\.\.\/ausfuehrung\//
]) {
  if (verboten.test(quelle)) throw new Error(`Block 8.6.1 darf keine Adventure-Land-Aktionsautoritaet einfuehren: ${verboten}`);
}

const tests = await readFile(path.join(wurzel, dateien[2]), 'utf8');
for (const pflicht of [
  'gleiche fachliche Live-Daten behalten Fingerprint und Generation',
  'unbekannter neuer Skill bleibt sichtbar und analysierbar, aber fail-closed',
  'neues unbekanntes Rohfeld an explizit validiertem Skill entzieht automationValidated',
  'fachliche Drift wird nicht durch einen zweiten identischen Snapshot automatisch produktionsbereit',
  'Connection-/Leseausfall blockiert fail-closed',
  "assert.equal(katalog.spielAutoritaet, false)",
  "assert.equal(three.zielKapazitaet, 3)",
  "assert.equal(five.zielKapazitaet, 5)",
  'Katalog-Fingerprint muss den zentralen SHA-256-Pfad verwenden',
  'Skill-Fingerprint muss SHA-256 sein'
]) {
  if (!tests.includes(pflicht)) throw new Error(`Block-8.6.1-Testabdeckung fehlt: ${pflicht}`);
}

const dokument = await readFile(path.join(wurzel, dateien[3]), 'utf8');
for (const pflicht of [
  'Adventure Lands live beobachtetes `G.skills` ist die technische Source of Truth.',
  '`automationValidated=false`',
  '`bereit`',
  '`veraltet`',
  '`drift`',
  '`blockiert`',
  'zweiter identischer Snapshot',
  'keine neue Spielaktionsautoritaet',
  '8.6.4',
  'ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4'
]) {
  if (!dokument.includes(pflicht)) throw new Error(`Block-8.6.1-Dokumentation fehlt: ${pflicht}`);
}

const plan = await readFile(path.join(wurzel, dateien[4]), 'utf8');
for (const pflicht of [
  '8.6.1 – Skill-Katalog-Vertrag und Live-Lesequelle — **IMPLEMENTIERT**',
  'Naechster Implementierungsschritt: **8.6.2 – Audit, Drift und Recovery-Revalidierung**'
]) {
  if (!plan.includes(pflicht)) throw new Error(`Block-8.6-Plan ist nicht auf 8.6.1-Stand: ${pflicht}`);
}

const vertraege = await readFile(path.join(wurzel, dateien[5]), 'utf8');
for (const pflicht of [
  '## SkillKatalog',
  '`automationValidated`',
  '`technischeReadiness`',
  '`spielAutoritaet: false`'
]) {
  if (!vertraege.includes(pflicht)) throw new Error(`V4-Vertragsdokumentation fehlt fuer Block 8.6.1: ${pflicht}`);
}

const packageJson = JSON.parse(await readFile(path.join(wurzel, 'package.json'), 'utf8'));
if (packageJson.scripts?.['block8-6-struktur:pruefen'] !== 'node werkzeuge/block8-6-struktur-pruefen.mjs') {
  throw new Error('package.json muss den Block-8.6-Strukturguard anbieten.');
}
if (!String(packageJson.scripts?.pruefen ?? '').includes('npm run block8-6-struktur:pruefen')) {
  throw new Error('npm run pruefen muss den Block-8.6-Strukturguard ausfuehren.');
}

console.log('Block 8.6.1 geprueft: versionierter Live-Skill-Katalog, fail-closed Validierung, stabile Fingerprints/Generationen und keine neue Spielaktionsautoritaet.');
