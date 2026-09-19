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
  'laufzeit/quelle/vertraege/skill-policy.ts',
  'laufzeit/quelle/spiellogik/skill-policy-semantik.ts',
  'laufzeit/quelle/spiellogik/skill-policy.ts',
  'laufzeit/tests/skill-policy.test.mjs',
  'dokumentation/BLOCK-8-6-1-SKILL-KATALOG.md',
  'dokumentation/BLOCK-8-6-3-SKILL-POLICY.md',
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

const policyVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/skill-policy.ts'), 'utf8');
for (const pflicht of [
  'SKILL_POLICY_SCHEMA_VERSION = 1',
  "SKILL_POLICY_SPEICHER_SCHLUESSEL = 'aio-v4-skill-policy-v1'",
  "'prozent'",
  "'ganzzahl'",
  "'lebensSchwelleProzent'",
  "'mindestensZiele'",
  "'manaBudgetProzent'",
  'SkillPolicyCharakterProfil',
  'neueSkillsStandardmaessigFreigegeben: false',
  'userDisableIstHarteSperre: true',
  'unbekannteControlsFailClosed: true',
  'aktionsAutoritaet: false'
]) {
  if (!policyVertrag.includes(pflicht)) throw new Error('Block-8.6.3-SkillPolicy-Vertrag fehlt: ' + pflicht);
}

const policySemantik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/skill-policy-semantik.ts'), 'utf8');
for (const pflicht of [
  'heal: Object.freeze',
  'partyheal: Object.freeze',
  "'3shot': Object.freeze",
  "'5shot': Object.freeze",
  'fanofknives: Object.freeze',
  'cburst: Object.freeze',
  'energize: Object.freeze',
  "'zielKapazitaet'",
  "prozent('lebensSchwelleProzent'",
  "prozent('manaBudgetProzent'"
]) {
  if (!policySemantik.includes(pflicht)) throw new Error('Block-8.6.3-SkillPolicy-Semantik fehlt: ' + pflicht);
}

const policyQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/skill-policy.ts'), 'utf8');
for (const pflicht of [
  'SkillPolicySpeicher',
  'listeKonfigurierbareSkills',
  'setzeSkillFreigabe',
  'setzeControlWert',
  'setzeSkillZurueck',
  'bewerteAutomatikFreigabe',
  "katalog.zustand === 'bereit'",
  'eintrag.automationValidated === true',
  'neueSkillsStandardmaessigFreigegeben: false as const',
  'userDisableIstHarteSperre: true as const',
  'unbekannteControlsFailClosed: true as const',
  'aktionsAutoritaet: false as const',
  'kanonisiereJson(dauerzustand)'
]) {
  if (!policyQuelle.includes(pflicht)) throw new Error('Block-8.6.3-SkillPolicy fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /from ['"]\.\.\/ausfuehrung\//
]) {
  if (verboten.test(policyQuelle)) throw new Error('Block 8.6.3 darf keine Adventure-Land-Aktionsautoritaet einfuehren: ' + verboten);
}

const policyTests = await readFile(path.join(wurzel, 'laufzeit/tests/skill-policy.test.mjs'), 'utf8');
for (const pflicht of [
  'nur passende validierte und freigeschaltete Level-Skills sind konfigurierbar und standardmaessig AUS',
  'Per-Character Policy trennt zwei Ranger derselben Klasse strikt',
  'Slider werden streng begrenzt und unbekannte Controls fail-closed blockiert',
  'Checkbox AUS bleibt harte Sperre',
  'Heal und Ressourcen-Skills erhalten nur semantisch passende Prozent-Slider',
  'Katalogdrift sperrt aktuelle Freigabe ohne historische Policy zu loeschen',
  'unbekannte persistierte Controls bleiben historisch erhalten aber sperren Automatik fail-closed',
  'ungueltige Persistenzschema wird fail-closed verworfen',
  'Persistenzfehler aktiviert eine Policy-Aenderung nicht im Speicherzustand',
  'assert.equal(status.aktionsAutoritaet, false)'
]) {
  if (!policyTests.includes(pflicht)) throw new Error('Block-8.6.3-Testabdeckung fehlt: ' + pflicht);
}

const policyDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-3-SKILL-POLICY.md'), 'utf8');
for (const pflicht of [
  'harte Sperre',
  'Neue Skill-Einstellungen starten immer:',
  'freigegeben=false',
  '0–100 %',
  '1–Target-Capacity',
  'Persistenz ist transaktional',
  'aktionsAutoritaet=false',
  '**8.6.4 – CharakterFaehigkeiten.**'
]) {
  if (!policyDokument.includes(pflicht)) throw new Error('Block-8.6.3-Dokumentation fehlt: ' + pflicht);
}

const index = await readFile(path.join(wurzel, 'laufzeit/quelle/index.ts'), 'utf8');
for (const pflicht of [
  "export * from './vertraege/skill-policy.js';",
  "export * from './spiellogik/skill-policy-semantik.js';",
  "export * from './spiellogik/skill-policy.js';"
]) {
  if (!index.includes(pflicht)) throw new Error('V4-Index exportiert Block 8.6.3 nicht: ' + pflicht);
}

const plan = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-PLAN.md'), 'utf8');
for (const pflicht of [
  '8.6.1 – Skill-Katalog-Vertrag und Live-Lesequelle — **IMPLEMENTIERT**',
  '8.6.2 – Audit, Drift und Recovery-Revalidierung — **IMPLEMENTIERT**',
  '8.6.3 – Per-Character SkillPolicy und Slider — **IMPLEMENTIERT**',
  'Naechster Implementierungsschritt: **8.6.4 – CharakterFaehigkeiten**'
]) {
  if (!plan.includes(pflicht)) throw new Error(`Block-8.6-Plan ist nicht auf aktuellem 8.6.3-Stand: ${pflicht}`);
}

const vertraege = await readFile(path.join(wurzel, 'dokumentation/VERTRAEGE.md'), 'utf8');
for (const pflicht of [
  '## SkillKatalog',
  '`automationValidated`',
  '`technischeReadiness`',
  '`spielAutoritaet: false`',
  '## SkillKatalogAudit',
  '`aktionsAutoritaet: false`',
  '`automatischerNeustart: false`',
  '## SkillPolicy',
  '`freigegeben=false`',
  '`aktionsAutoritaet: false`'
]) {
  if (!vertraege.includes(pflicht)) throw new Error(`V4-Vertragsdokumentation fehlt fuer Block 8.6.1 bis 8.6.3: ${pflicht}`);
}

const packageJson = JSON.parse(await readFile(path.join(wurzel, 'package.json'), 'utf8'));
if (packageJson.scripts?.['block8-6-struktur:pruefen'] !== 'node werkzeuge/block8-6-struktur-pruefen.mjs') {
  throw new Error('package.json muss den Block-8.6-Strukturguard anbieten.');
}
if (!String(packageJson.scripts?.pruefen ?? '').includes('npm run block8-6-struktur:pruefen')) {
  throw new Error('npm run pruefen muss den Block-8.6-Strukturguard ausfuehren.');
}

console.log('Block 8.6.1 bis 8.6.3 geprueft: Live-Skill-Katalog, Audit/Recovery und persistente Per-Character SkillPolicy ohne neue Spielaktionsautoritaet.');
