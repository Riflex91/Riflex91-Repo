import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const dateien = [
  'laufzeit/quelle/vertraege/skill-katalog.ts',
  'laufzeit/quelle/adventure-land/adventure-land-skill-katalog.ts',
  'laufzeit/tests/skill-katalog.test.mjs',
  'laufzeit/quelle/vertraege/skill-katalog-audit.ts',
  'laufzeit/quelle/adventure-land/adventure-land-skill-katalog-audit.ts',
  'laufzeit/tests/skill-katalog-audit.test.mjs',
  'dokumentation/BLOCK-8-6-1-SKILL-KATALOG.md',
  'dokumentation/BLOCK-8-6-2-AUDIT-REVALIDIERUNG.md',
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

const dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-1-SKILL-KATALOG.md'), 'utf8');
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

const auditVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/skill-katalog-audit.ts'), 'utf8');
for (const pflicht of [
  'SKILL_KATALOG_AUDIT_SCHEMA_VERSION = 1',
  "'runtime_start'",
  "'periodisch'",
  "'connection_gap'",
  "'recovery'",
  "'serverwechsel'",
  "'charakterwechsel'",
  "'levelaenderung'",
  "'skill_drift'",
  "'revalidierung'",
  'SkillKatalogRevalidierungsProfil',
  'produktionsbereit',
  'aktionsAutoritaet: false',
  'automatischerNeustart: false'
]) {
  if (!auditVertrag.includes(pflicht)) throw new Error(`Block-8.6.2-Auditvertrag fehlt: ${pflicht}`);
}

const auditQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/adventure-land/adventure-land-skill-katalog-audit.ts'), 'utf8');
for (const pflicht of [
  'AdventureLandSkillKatalogAuditSteuerung',
  'liesKatalogAusRohdaten',
  'markiereVeraltet',
  'markiereDrift',
  'bestaetigeAktuellenKatalog',
  "'runtime_start'",
  "'periodisch'",
  "'connection_gap'",
  "'recovery'",
  "'serverwechsel'",
  "'charakterwechsel'",
  "'levelaenderung'",
  "'skill_drift'",
  'aktionsAutoritaet: false as const',
  'automatischerNeustart: false as const'
]) {
  if (!auditQuelle.includes(pflicht)) throw new Error(`Block-8.6.2-Auditsteuerung fehlt: ${pflicht}`);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /from ['"]\.\.\/ausfuehrung\//
]) {
  if (verboten.test(auditQuelle)) throw new Error(`Block 8.6.2 darf keine Adventure-Land-Aktionsautoritaet einfuehren: ${verboten}`);
}

const auditTests = await readFile(path.join(wurzel, 'laufzeit/tests/skill-katalog-audit.test.mjs'), 'utf8');
for (const pflicht of [
  'Runtime-Start installiert periodische read-only Audits ohne neue Autoritaet',
  'Connection-Gap -> Recovery bleibt veraltet bis exakte Revalidierung',
  'Charakter- und Serverwechsel erzwingen Revalidierung',
  'Level-Aenderung loest Audit aus',
  'echte Skill-Drift bleibt beim identischen zweiten Audit gesperrt',
  'widerspruechliche Folge-Drift erhoeht Generation',
  'Neustart mit altem persistentem Revalidierungsprofil und neuem Katalog fail-closed auf Drift',
  'assert.equal(status.aktionsAutoritaet, false)',
  'assert.equal(status.automatischerNeustart, false)'
]) {
  if (!auditTests.includes(pflicht)) throw new Error(`Block-8.6.2-Testabdeckung fehlt: ${pflicht}`);
}

const auditDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-2-AUDIT-REVALIDIERUNG.md'), 'utf8');
for (const pflicht of [
  'Connection-Gap -> Recovery -> explizite Revalidierung',
  'Runtime-Start und periodischer Audit',
  'Server- und Charakterwechsel',
  'Neustart mit altem Revalidierungsprofil und neuem Katalog',
  'keine Aktions- oder automatische Restart-Autoritaet',
  '**8.6.3 – Per-Character SkillPolicy und Slider.**'
]) {
  if (!auditDokument.includes(pflicht)) throw new Error(`Block-8.6.2-Dokumentation fehlt: ${pflicht}`);
}

const plan = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-PLAN.md'), 'utf8');
for (const pflicht of [
  '8.6.1 – Skill-Katalog-Vertrag und Live-Lesequelle — **IMPLEMENTIERT**',
  '8.6.2 – Audit, Drift und Recovery-Revalidierung — **IMPLEMENTIERT**',
  'Naechster Implementierungsschritt: **8.6.3 – Per-Character SkillPolicy und Slider**'
]) {
  if (!plan.includes(pflicht)) throw new Error(`Block-8.6-Plan ist nicht auf aktuellem 8.6.2-Stand: ${pflicht}`);
}

const vertraege = await readFile(path.join(wurzel, 'dokumentation/VERTRAEGE.md'), 'utf8');
for (const pflicht of [
  '## SkillKatalog',
  '`automationValidated`',
  '`technischeReadiness`',
  '`spielAutoritaet: false`',
  '## SkillKatalogAudit',
  '`aktionsAutoritaet: false`',
  '`automatischerNeustart: false`'
]) {
  if (!vertraege.includes(pflicht)) throw new Error(`V4-Vertragsdokumentation fehlt fuer Block 8.6.1/8.6.2: ${pflicht}`);
}

const packageJson = JSON.parse(await readFile(path.join(wurzel, 'package.json'), 'utf8'));
if (packageJson.scripts?.['block8-6-struktur:pruefen'] !== 'node werkzeuge/block8-6-struktur-pruefen.mjs') {
  throw new Error('package.json muss den Block-8.6-Strukturguard anbieten.');
}
if (!String(packageJson.scripts?.pruefen ?? '').includes('npm run block8-6-struktur:pruefen')) {
  throw new Error('npm run pruefen muss den Block-8.6-Strukturguard ausfuehren.');
}

console.log('Block 8.6.1/8.6.2 geprueft: Live-Skill-Katalog, Audit/Drift/Recovery-Revalidierung und keine neue Spielaktionsautoritaet.');
