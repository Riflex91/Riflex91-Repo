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
  'laufzeit/quelle/vertraege/charakter-faehigkeiten.ts',
  'laufzeit/quelle/adventure-land/adventure-land-skill-technik.ts',
  'laufzeit/quelle/spiellogik/charakter-faehigkeiten.ts',
  'laufzeit/tests/adventure-land-skill-technik.test.mjs',
  'laufzeit/tests/charakter-faehigkeiten.test.mjs',
  'laufzeit/quelle/vertraege/capability-sync.ts',
  'laufzeit/quelle/spiellogik/capability-sync.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-capability-sync-austausch.ts',
  'laufzeit/tests/capability-sync.test.mjs',
  'laufzeit/tests/capability-sync-austausch.test.mjs',
  'laufzeit/quelle/vertraege/capability-gruppenwahl.ts',
  'laufzeit/quelle/spiellogik/capability-gruppenwahl.ts',
  'laufzeit/tests/capability-gruppenwahl.test.mjs',
  'laufzeit/quelle/vertraege/capability-status.ts',
  'laufzeit/quelle/telemetrie/capability-status.ts',
  'laufzeit/tests/capability-status.test.mjs',
  'laufzeit/tests/capability-hud.test.mjs',
  'werkzeuge/block8-6-capability-hud.js',
  'laufzeit/quelle/vertraege/capability-wiederholung.ts',
  'laufzeit/quelle/wiederholung/capability-wiederholung.ts',
  'laufzeit/tests/capability-wiederholung.test.mjs',
  'laufzeit/quelle/vertraege/capability-freigabe.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-akzeptierter-lebensnachweis-beobachter.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-capability-freigabe.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-block8-6-candidate-einstieg.ts',
  'laufzeit/tests/capability-freigabe.test.mjs',
  'laufzeit/tests/block8-6-freigabestufen-live-test.test.mjs',
  'werkzeuge/block8-6-freigabestufen-live-test.js',
  'werkzeuge/block8-6-candidate-bauen.mjs',
  'werkzeuge/block8-6-release-bindung-pruefen.mjs',
  'werkzeuge/block8-6-schatten-paket-bauen.mjs',
  'werkzeuge/block8-6-schatten-paket.js',
  'laufzeit/tests/block8-6-schatten-paket.test.mjs',
  'dokumentation/BLOCK-8-6-9-SCHATTEN-PAKET.md',
  'werkzeuge/block8-6-live-paket-bauen.mjs',
  'werkzeuge/block8-6-live-paket.js',
  'laufzeit/tests/block8-6-live-paket.test.mjs',
  'dokumentation/BLOCK-8-6-9-LIVE-PAKET.md',
  'dokumentation/BLOCK-8-6-9-RELEASE-CANDIDATE.json',
  'dokumentation/BLOCK-8-6-9-RELEASE-CANDIDATE.md',
  'dokumentation/BLOCK-8-6-9-CANDIDATE-DEPLOYMENT-NACHWEIS.md',
  'dokumentation/BLOCK-8-6-9-SCHATTEN-FREIGABE-NACHWEIS.json',
  'dokumentation/BLOCK-8-6-1-SKILL-KATALOG.md',
  'dokumentation/BLOCK-8-6-9-FREIGABE-VORBEREITUNG.md',
  'dokumentation/BLOCK-8-6-8-REPLAY-REGRESSION.md',
  'dokumentation/BLOCK-8-6-7-STATUS-HUD-DIAGNOSE.md',
  'dokumentation/BLOCK-8-6-6-CAPABILITY-GRUPPENWAHL.md',
  'dokumentation/BLOCK-8-6-5-CAPABILITY-SYNC.md',
  'dokumentation/BLOCK-8-6-4-CHARAKTER-FAEHIGKEITEN.md',
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
  "export * from './spiellogik/skill-policy.js';",
  "export * from './vertraege/charakter-faehigkeiten.js';",
  "export * from './adventure-land/adventure-land-skill-technik.js';",
  "export * from './spiellogik/charakter-faehigkeiten.js';",
  "export * from './vertraege/capability-sync.js';",
  "export * from './spiellogik/capability-sync.js';",
  "export * from './ausfuehrung/adventure-land-capability-sync-austausch.js';",
  "export * from './vertraege/capability-gruppenwahl.js';",
  "export * from './spiellogik/capability-gruppenwahl.js';",
  "export * from './vertraege/capability-status.js';",
  "export * from './telemetrie/capability-status.js';",
  "export * from './vertraege/capability-wiederholung.js';",
  "export * from './wiederholung/capability-wiederholung.js';",
  "export * from './vertraege/capability-freigabe.js';",
  "export * from './ausfuehrung/adventure-land-akzeptierter-lebensnachweis-beobachter.js';",
  "export * from './ausfuehrung/adventure-land-capability-freigabe.js';",
  "export * from './ausfuehrung/adventure-land-block8-6-candidate-einstieg.js';"
]) {
  if (!index.includes(pflicht)) throw new Error('V4-Index exportiert Block 8.6.3 bis 8.6.9-Vorbereitung nicht: ' + pflicht);
}


const faehigkeitenVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/charakter-faehigkeiten.ts'), 'utf8');
for (const pflicht of [
  'CHARAKTER_FAEHIGKEITEN_SCHEMA_VERSION = 1',
  "'abklingzeit'",
  "'blockiert'",
  "'unbekannt'",
  'strukturellVorhanden',
  'technischBereit',
  'vomNutzerFreigegeben',
  'automatisierungKonfiguriert',
  'aktuellAutomatisierbar',
  'maximaleZielKapazitaetAktuell',
  'gruppenFaehigkeiten',
  'aktionsAutoritaet: false'
]) {
  if (!faehigkeitenVertrag.includes(pflicht)) throw new Error('Block-8.6.4-CharakterFaehigkeiten-Vertrag fehlt: ' + pflicht);
}

const technikQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/adventure-land/adventure-land-skill-technik.ts'), 'utf8');
for (const pflicht of [
  'AdventureLandSkillTechnikLesezugriff',
  'AdventureLandKampfBereitschaftLesezugriff',
  'liesAktionsBereitschaft',
  'waffenTypen',
  'nebenhandTyp',
  'skill.materialien.verbrauch',
  'character.items',
  'character.mp',
  'aktionsFreigabe: false as const'
]) {
  if (!technikQuelle.includes(pflicht)) throw new Error('Block-8.6.4-Technikleser fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /from ['"]\.\.\/ausfuehrung\//
]) {
  if (verboten.test(technikQuelle)) throw new Error('Block 8.6.4-Technikleser darf keine Adventure-Land-Aktionsautoritaet einfuehren: ' + verboten);
}

const faehigkeitenQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/charakter-faehigkeiten.ts'), 'utf8');
for (const pflicht of [
  'CharakterFaehigkeitenResolver',
  'GRUPPEN_CAPABILITY_TAGS',
  "katalog.zustand === 'bereit'",
  'policy.bewerteAutomatikFreigabe',
  'this.technik.lies',
  'strukturellVorhanden',
  'technischBereit',
  'vomNutzerFreigegeben',
  'automatisierungKonfiguriert',
  'aktuellAutomatisierbar',
  'berechneSha256(kanonisiereJson(fingerprintBasis))',
  'gruppenFaehigkeiten',
  'aktionsAutoritaet: false as const'
]) {
  if (!faehigkeitenQuelle.includes(pflicht)) throw new Error('Block-8.6.4-CharakterFaehigkeiten-Ableitung fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /from ['"]\.\.\/ausfuehrung\//
]) {
  if (verboten.test(faehigkeitenQuelle)) throw new Error('Block 8.6.4-CharakterFaehigkeiten darf keine Adventure-Land-Aktionsautoritaet einfuehren: ' + verboten);
}

const technikTests = await readFile(path.join(wurzel, 'laufzeit/tests/adventure-land-skill-technik.test.mjs'), 'utf8');
for (const pflicht of [
  'technische Skill-Readiness bestaetigt Equipment Mana und bestehende can_use-Pruefung read-only',
  'Equipmentverlust blockiert trotz fehlendem Cooldown fail-closed',
  'fehlendes Skill-Material und zu wenig Mana blockieren getrennt sichtbar',
  'generische unbekannte requirements werden nicht geraten',
  'can_use false bleibt technisch unbekannt wenn die Cooldown-Schnittstelle fehlt',
  'aktiver geteilter Cooldown wird ueber den bestehenden Kampfbereitschaftsleser wiederverwendet',
  'assert.equal(ergebnis.aktionsFreigabe, false)'
]) {
  if (!technikTests.includes(pflicht)) throw new Error('Block-8.6.4-Techniktest fehlt: ' + pflicht);
}

const faehigkeitenTests = await readFile(path.join(wurzel, 'laufzeit/tests/charakter-faehigkeiten.test.mjs'), 'utf8');
for (const pflicht of [
  'vier Capability-Dimensionen bleiben getrennt und SkillPolicy AUS ist harte Sperre',
  'freigegebene technisch bereite Ranger-Multishots erzeugen explizite Target-Capacity',
  'Equipmentverlust entzieht technische Readiness ohne Nutzerfreigabe zu vergessen',
  'Cooldown aendert Capability-Generation nur beim Zustandswechsel',
  'Level-Up schaltet bekannten Skill strukturell frei',
  'unbekannter neuer Skill bleibt strukturell sichtbar aber niemals automatisch nutzbar',
  'staler Katalog entzieht aktuelle Automatisierbarkeit ohne historische Nutzerfreigabe zu loeschen',
  'grobe Gruppenfaehigkeiten werden aus konkreten aktuell automationsfaehigen Skills gezaehlt statt aus Klasse geraten',
  'assert.equal(snapshot.aktionsAutoritaet, false)'
]) {
  if (!faehigkeitenTests.includes(pflicht)) throw new Error('Block-8.6.4-CharakterFaehigkeiten-Test fehlt: ' + pflicht);
}

const faehigkeitenDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-4-CHARAKTER-FAEHIGKEITEN.md'), 'utf8');
for (const pflicht of [
  '**strukturellVorhanden**',
  '**technischBereit**',
  '**vomNutzerFreigegeben**',
  '**automatisierungKonfiguriert**',
  'aktuellAutomatisierbar',
  'keine statische Klassenprioritaet',
  'Reine Zeitstempel und herunterzaehlende Cooldown-Restmillisekunden',
  'aktionsAutoritaet=false',
  '**8.6.5 – Cross-Client Capability Sync.**'
]) {
  if (!faehigkeitenDokument.includes(pflicht)) throw new Error('Block-8.6.4-Dokumentation fehlt: ' + pflicht);
}


const capabilitySyncVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/capability-sync.ts'), 'utf8');
for (const pflicht of [
  "CAPABILITY_SYNC_PROTOKOLL = 'v4-capability-sync-v1'",
  'CAPABILITY_SYNC_MAX_SKILLS = 64',
  'CAPABILITY_SYNC_MAX_TAGS_PRO_SKILL = 16',
  'CAPABILITY_SYNC_MAX_PARAMETER_PRO_SKILL = 8',
  'lebensnachweisGesendetAm',
  'lebensnachweisLaufendeNummer',
  'configuredReady',
  'aktuellAutomatisierbar',
  'aktionsAutoritaet: false'
]) {
  if (!capabilitySyncVertrag.includes(pflicht)) throw new Error('Block-8.6.5-CapabilitySync-Vertrag fehlt: ' + pflicht);
}

const capabilitySyncQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/capability-sync.ts'), 'utf8');
for (const pflicht of [
  'erstelleCapabilitySyncSnapshot',
  'pruefeRemoteCapabilityVertrauen',
  'liesCapabilitySyncSnapshot',
  "lebensnachweisBewertung.status !== 'aktiv'",
  'snapshot.katalogFingerprint !== lokalerKatalog.fingerprint',
  'meldung.gesendetAm !== snapshot.lebensnachweisGesendetAm',
  'meldung.laufendeNummer !== snapshot.lebensnachweisLaufendeNummer',
  'skill.automationValidated',
  'skill.strukturellVorhanden',
  'aktionsAutoritaet: false as const'
]) {
  if (!capabilitySyncQuelle.includes(pflicht)) throw new Error('Block-8.6.5-CapabilitySync-Logik fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/
]) {
  if (verboten.test(capabilitySyncQuelle)) throw new Error('Block 8.6.5-CapabilitySync-Logik darf keine Spielaktionsautoritaet einfuehren: ' + verboten);
}

const capabilityTransport = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-capability-sync-austausch.ts'), 'utf8');
for (const pflicht of [
  'AdventureLandCapabilitySyncAustausch',
  'CAPABILITY_SYNC_PROTOKOLL',
  'vertrauensNamen',
  'send_cm',
  'on_cm',
  'eigenerLivenessTimer: false',
  "freshnessQuelle: 'block8-gruppen-lebensnachweis'",
  'aktionsAutoritaet: false'
]) {
  if (!capabilityTransport.includes(pflicht)) throw new Error('Block-8.6.5-CapabilitySync-Transport fehlt: ' + pflicht);
}
for (const verboten of [
  /setInterval\s*\(/,
  /setTimeout\s*\(/,
  /lebensnachweisMaximalAlterMillisekunden/,
  /STANDARD_LEBENSNACHWEIS_ALTER/
]) {
  if (verboten.test(capabilityTransport)) throw new Error('Block 8.6.5 darf kein zweites Liveness-/Freshness-Protokoll einfuehren: ' + verboten);
}

const capabilitySyncTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-sync.test.mjs'), 'utf8');
for (const pflicht of [
  'Snapshot ist bounded, an genau einen Lebensnachweis gebunden und enthaelt nur validierte strukturelle Skills',
  'Remote-Capability wird nur mit aktivem exakt gebundenem Block-8-Lebensnachweis vertraut',
  'staler Lebensnachweis blockiert Remote-Capability ohne eigenen Capability-TTL',
  'neuer Lebensnachweis kann keinen alten Capability-Snapshot versehentlich frisch machen',
  'Catalog-Fingerprint-Mismatch',
  'Sender-Spoof',
  'zwei Ranger derselben Klasse bleiben durch Charakterkennung und Heartbeat-Bindung getrennt',
  'unbounded Parameter fail-closed'
]) {
  if (!capabilitySyncTests.includes(pflicht)) throw new Error('Block-8.6.5-CapabilitySync-Test fehlt: ' + pflicht);
}

const capabilityTransportTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-sync-austausch.test.mjs'), 'utf8');
for (const pflicht of [
  'Capability-Transport besitzt keinen eigenen Liveness-Timer',
  'nur an ausdruecklich vertrauten bestaetigten Empfaenger gesendet',
  'Empfang akzeptiert nur vertrauensgebundenen Sender',
  'fremde CM-Protokolle werden an vorhandenen on_cm Handler weitergereicht',
  'ohne Zerstoerung des vorherigen CM-Handlers entfernt'
]) {
  if (!capabilityTransportTests.includes(pflicht)) throw new Error('Block-8.6.5-CapabilitySync-Transporttest fehlt: ' + pflicht);
}

const capabilitySyncDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-5-CAPABILITY-SYNC.md'), 'utf8');
for (const pflicht of [
  'kein zweites Liveness-Protokoll',
  'keinen eigenen Freshness-TTL',
  'lebensnachweisGesendetAm',
  'lebensnachweisLaufendeNummer',
  'Missing, stale oder mismatch -> fail-closed',
  'zwei Ranger',
  'aktionsAutoritaet=false',
  '**8.6.6 – Capability-basierte Leader- und Aufgabenwahl.**'
]) {
  if (!capabilitySyncDokument.includes(pflicht)) throw new Error('Block-8.6.5-Dokumentation fehlt: ' + pflicht);
}


const capabilityGruppenwahlVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/capability-gruppenwahl.ts'), 'utf8');
for (const pflicht of [
  'CAPABILITY_GRUPPENWAHL_SCHEMA_VERSION = 1',
  'gruppenKoordinationErlaubt',
  'leaderKennung',
  'leaderKandidaten',
  'aufgabenZuordnung',
  'ausgeschlosseneTeilnehmer',
  'aktionsAutoritaet: false'
]) {
  if (!capabilityGruppenwahlVertrag.includes(pflicht)) throw new Error('Block-8.6.6-CapabilityGruppenwahl-Vertrag fehlt: ' + pflicht);
}

const capabilityGruppenwahlQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/capability-gruppenwahl.ts'), 'utf8');
for (const pflicht of [
  'waehleCapabilityBasierteGruppenrollen',
  'GRUPPEN_CAPABILITY_TAGS',
  "basis.betriebsArt !== 'normal'",
  'gruppenKoordinationErlaubt',
  "pruefung.status === 'vertraut'",
  'snapshot.lebensnachweisGesendetAm !== lebensnachweis.gesendetAm',
  'snapshot.lebensnachweisLaufendeNummer !== lebensnachweis.laufendeNummer',
  'skill.aktuellAutomatisierbar',
  'skill.enabled',
  'skill.configuredReady',
  'vergleicheSafety',
  'vergleicheFreshnessUndIdentitaet',
  'aktionsAutoritaet: false as const'
]) {
  if (!capabilityGruppenwahlQuelle.includes(pflicht)) throw new Error('Block-8.6.6-CapabilityGruppenwahl-Logik fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /\bwarrior\b/i,
  /\bpaladin\b/i,
  /\branger\b/i,
  /\bpriest\b/i,
  /\bmage\b/i,
  /\brogue\b/i,
  /\bmerchant\b/i
]) {
  if (verboten.test(capabilityGruppenwahlQuelle)) throw new Error('Block 8.6.6 darf keine Spielaktion oder statische Klassenprioritaet einfuehren: ' + verboten);
}

const capabilityGruppenwahlTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-gruppenwahl.test.mjs'), 'utf8');
for (const pflicht of [
  'keine statische Klassenprioritaet: Ranger gewinnt gegen Warrior durch mehr reale Damage-Capabilities',
  'Aufgaben werden aus konkreten Capability-Tags statt grober Klassenannahmen verteilt',
  'aktuelle Safety hat Vorrang vor groesserer Capability-Breite',
  'bei gleicher Safety entscheidet Capability vor Freshness und Identitaet',
  'bei gleicher Safety und Capability entscheidet Freshness vor Kennung',
  'Charakterkennung ist nur letzter deterministischer Tie-Breaker',
  'fehlende explizite Koordinationsautoritaet sperrt Kandidat trotz besserer Capability',
  'fehlende oder blockierte Remote-Capability wird nicht durch alte grobe Lebensnachweiswerte ersetzt',
  'Safety- oder Blockierbetrieb vergibt weder normalen Leader noch Aufgaben',
  'alter lokaler Snapshot wird trotz aktiver neuer Liveness fail-closed ausgeschlossen',
  'zwei Ranger derselben Klasse bleiben capability-seitig getrennte Kandidaten',
  'assert.equal(result.aktionsAutoritaet, false)'
]) {
  if (!capabilityGruppenwahlTests.includes(pflicht)) throw new Error('Block-8.6.6-CapabilityGruppenwahl-Test fehlt: ' + pflicht);
}

const capabilityGruppenwahlDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-6-CAPABILITY-GRUPPENWAHL.md'), 'utf8');
for (const pflicht of [
  'Keine statische Klassenprioritaet',
  'gruppenKoordinationErlaubt=true',
  'nur finale Tie-Breaker',
  'Fehlende Capability-Daten werden nicht durch Klasse',
  'kein einzelner versteckter Gesamtscore',
  'aktionsAutoritaet=false',
  '**8.6.7 – Status, HUD und Diagnose.**'
]) {
  if (!capabilityGruppenwahlDokument.includes(pflicht)) throw new Error('Block-8.6.6-Dokumentation fehlt: ' + pflicht);
}

const alterGruppenKoordinationsPfad = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-koordination.ts'), 'utf8');
if (alterGruppenKoordinationsPfad.includes('CapabilityGruppenwahl') || alterGruppenKoordinationsPfad.includes('capability-gruppenwahl')) {
  throw new Error('Block 8.6.6 darf die bereits freigegebene Block-8-Gruppenkoordination nicht rueckwirkend verdrahten.');
}


const capabilityStatusVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/capability-status.ts'), 'utf8');
for (const pflicht of [
  'CAPABILITY_STATUS_SCHEMA_VERSION = 1',
  "['stimmt', 'abweichend', 'unbekannt']",
  "['info', 'warnung', 'blockiert']",
  'letzteExpliziteValidierungAm',
  'CapabilityStatusSliderSicht',
  'CapabilityStatusRemoteSicht',
  'CapabilityDiagnoseEintrag',
  'nurLesen: true',
  'spielAutoritaet: false',
  'bedienAutoritaet: false',
  'neustartAutoritaet: false'
]) {
  if (!capabilityStatusVertrag.includes(pflicht)) throw new Error('Block-8.6.7-CapabilityStatus-Vertrag fehlt: ' + pflicht);
}

const capabilityStatusQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/telemetrie/capability-status.ts'), 'utf8');
for (const pflicht of [
  'erstelleCapabilityStatusSicht',
  'letzterErfolgreicherAuditAm',
  'revalidierungsProfil?.bestaetigtAm',
  'skill.vomNutzerFreigegeben',
  'skill.aktuellAutomatisierbar',
  'catalogAgreement',
  'lebensnachweisAlterMillisekunden',
  'REMOTE_KATALOG_MISMATCH',
  'REMOTE_CAPABILITY_NICHT_VERTRAUT',
  'GRUPPENWAHL_TEILNEHMER_AUSGESCHLOSSEN',
  'CAPABILITY_STATUS_OK',
  'nurLesen: true as const',
  'spielAutoritaet: false as const',
  'bedienAutoritaet: false as const',
  'neustartAutoritaet: false as const'
]) {
  if (!capabilityStatusQuelle.includes(pflicht)) throw new Error('Block-8.6.7-CapabilityStatus-Projektion fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /setItem\s*\(/,
  /update_ref/i,
  /merge_pull_request/i
]) {
  if (verboten.test(capabilityStatusQuelle)) throw new Error('Block 8.6.7 Statusprojektion darf keine Aktions-/Schreibautoritaet enthalten: ' + verboten);
}

const capabilityHudQuelle = await readFile(path.join(wurzel, 'werkzeuge/block8-6-capability-hud.js'), 'utf8');
for (const pflicht of [
  "const API_NAME = 'V4CapabilityHud'",
  'pruefeStatusSicht',
  'erstelleAnzeigeModell',
  'erstelleHud',
  'Skill-Katalog',
  'Skills & Policy',
  'Lokale Capabilities',
  'Remote-Capabilities',
  'Capability-Gruppenwahl',
  'Diagnose',
  'spielAutoritaet !== false',
  'bedienAutoritaet !== false',
  'neustartAutoritaet !== false'
]) {
  if (!capabilityHudQuelle.includes(pflicht)) throw new Error('Block-8.6.7-Capability-HUD fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /localStorage/,
  /SkillPolicySpeicher/,
  /waehleCapabilityBasierteGruppenrollen/,
  /pruefeRemoteCapabilityVertrauen/,
  /CharakterFaehigkeitenResolver/,
  /location\.reload/,
  /window\.close\s*\(/
]) {
  if (verboten.test(capabilityHudQuelle)) throw new Error('Block 8.6.7 HUD darf keine Fachlogik, Kommunikation oder Neustartaktion enthalten: ' + verboten);
}

const capabilityStatusTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-status.test.mjs'), 'utf8');
for (const pflicht of [
  'CapabilityStatus zeigt Katalog Validierung Skillzahlen Slider lokale Capabilities und Gruppenwahl read-only',
  'Remote-Freshness und Catalog-Agreement bleiben getrennt sichtbar',
  'blockierter Remote-Snapshot zeigt Fingerprint-Mismatch aus Empfangsevidenz trotz fail-closed Trust',
  'Diagnose nennt Drift unbekannten Skill aktive technische Sperre und Gruppen-Ausschluss explizit',
  'neuester Remote-Empfang wird nur fuer exakt passende Kennung plus Name verwendet',
  'Statusprojektion sortiert deterministisch ohne Eingaben umzuschreiben',
  'Audit und lokale Capability muessen dieselbe Charakterkennung beschreiben',
  'CAPABILITY_STATUS_OK'
]) {
  if (!capabilityStatusTests.includes(pflicht)) throw new Error('Block-8.6.7-CapabilityStatus-Test fehlt: ' + pflicht);
}

const capabilityHudTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-hud.test.mjs'), 'utf8');
for (const pflicht of [
  'Capability-HUD API bietet nur read-only Anzeige-Helfer',
  'HUD akzeptiert nur read-only CapabilityStatus ohne Autoritaet',
  'AnzeigeModell zeigt Katalog Skills Slider Capabilities Remote Gruppenwahl und Diagnose',
  'Remote- und Gruppen-Leerzustand werden nur dargestellt und nicht ersetzt',
  'AnzeigeModell veraendert die gelieferte CapabilityStatusSicht nicht',
  'unvollstaendige Pflichtbereiche werden fail-safe abgewiesen',
  'ohne Dokument bleibt AnzeigeModell nutzbar'
]) {
  if (!capabilityHudTests.includes(pflicht)) throw new Error('Block-8.6.7-Capability-HUD-Test fehlt: ' + pflicht);
}

const capabilityStatusDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-7-STATUS-HUD-DIAGNOSE.md'), 'utf8');
for (const pflicht of [
  'Keine Aenderung der Block-8.5-Statusschnittstelle',
  'nurLesen=true',
  'Remote-Capability-Freshness',
  'Catalog-Agreement',
  'Charakterkennung plus Charaktername',
  'Das HUD fuehrt selbst keine Leader- oder Aufgabenwahl aus.',
  'keine neue Fachlogik',
  '**8.6.8 – Replay und Regression.**'
]) {
  if (!capabilityStatusDokument.includes(pflicht)) throw new Error('Block-8.6.7-Dokumentation fehlt: ' + pflicht);
}

const alteStatusSchnittstelle = await readFile(path.join(wurzel, 'laufzeit/quelle/telemetrie/status-schnittstelle.ts'), 'utf8');
const altesHud = await readFile(path.join(wurzel, 'werkzeuge/block8-5-ingame-hud.js'), 'utf8');
for (const [name, quelle] of [
  ['Block-8.5-Statusschnittstelle', alteStatusSchnittstelle],
  ['Block-8.5-HUD', altesHud]
]) {
  if (quelle.includes('CapabilityStatus') || quelle.includes('capability-status')) {
    throw new Error(name + ' darf fuer Block 8.6.7 nicht rueckwirkend veraendert/verdrahtet werden.');
  }
}


const capabilityReplayVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/capability-wiederholung.ts'), 'utf8');
for (const pflicht of [
  'CAPABILITY_WIEDERHOLUNG_SCHEMA_VERSION = 1',
  'CAPABILITY_WIEDERHOLUNG_MAX_SCHRITTE = 256',
  'CAPABILITY_WIEDERHOLUNG_MAX_CHARAKTERE = 16',
  "['aktuell', 'vorheriger', 'fehlend']",
  'eingabeFingerabdruck',
  'ausgabeFingerabdruck',
  'schrittFingerabdruck',
  'aktionsAutoritaet: false'
]) {
  if (!capabilityReplayVertrag.includes(pflicht)) throw new Error('Block-8.6.8-CapabilityReplay-Vertrag fehlt: ' + pflicht);
}

const capabilityReplayQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/wiederholung/capability-wiederholung.ts'), 'utf8');
for (const pflicht of [
  'CapabilityWiederholungsMaschine',
  'AdventureLandSkillKatalogAuditSteuerung',
  'SkillPolicySpeicher',
  'CharakterFaehigkeitenResolver',
  'erstelleCapabilitySyncSnapshot',
  'pruefeRemoteCapabilityVertrauen',
  'koordiniereGruppe',
  'waehleCapabilityBasierteGruppenrollen',
  'erstelleCapabilityStatusSicht',
  'kanonisiereJson',
  'berechneSha256',
  "remoteSnapshotQuelle === 'aktuell'",
  "remoteSnapshotQuelle === 'vorheriger'",
  'aktionsAutoritaet: false as const'
]) {
  if (!capabilityReplayQuelle.includes(pflicht)) throw new Error('Block-8.6.8-CapabilityReplay-Logik fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bsend_cm\s*\(/,
  /Date\.now\s*\(/,
  /Math\.random\s*\(/
]) {
  if (verboten.test(capabilityReplayQuelle)) throw new Error('Block 8.6.8 Replay darf keine Live-Aktion, Echtzeituhr oder Zufallsquelle einfuehren: ' + verboten);
}

const capabilityReplayTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-wiederholung.test.mjs'), 'utf8');
for (const pflicht of [
  'gleiche Inputs erzeugen identische Capability-, Leader- und Ausgabe-Fingerprints',
  'zwei Ranger behalten getrennte 3shot/5shot-Policies und reale Leaderwahl',
  'Level-Up schaltet bekannten 5shot strukturell frei, Skill AUS bleibt trotz technischer Readiness harte Sperre',
  'Equipmentverlust entzieht Readiness und kann Leader deterministisch wechseln',
  'unbekannter neuer Skill bleibt nach expliziter Katalog-Revalidierung sichtbar aber nicht automatisierbar',
  'alter Remote-Snapshot bleibt trotz neuem aktivem Lebensnachweis stale und fail-closed',
  'Katalog-Fingerprint-Mismatch blockiert Remote-Capability und verhindert Klassenfallback',
  'Connection-Gap und Recovery bleiben bis expliziter Revalidierung fail-closed',
  'Replay-Ausgabe bleibt read-only ohne Spielaktionsautoritaet auf allen Ebenen',
  'unbounded oder zeitlich nicht monotone Datensaetze werden abgewiesen'
]) {
  if (!capabilityReplayTests.includes(pflicht)) throw new Error('Block-8.6.8-CapabilityReplay-Test fehlt: ' + pflicht);
}

const capabilityReplayDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-8-REPLAY-REGRESSION.md'), 'utf8');
for (const pflicht of [
  'Goldener Pflichtlauf',
  'zwei Ranger',
  'SkillPolicy AUS',
  'Equipmentverlust',
  'unbekannter neuer Skill',
  'stale Remote-Capability',
  'Catalog-Fingerprint-Mismatch',
  'Connection-Gap',
  'Recovery ohne Revalidierung',
  'gleiche Inputs -> gleicher Capability-/Leader-/Ausgabe-Fingerprint',
  '**8.6.9 – Freigabe: Offline → Schatten → kontrolliert live → Soak.**'
]) {
  if (!capabilityReplayDokument.includes(pflicht)) throw new Error('Block-8.6.8-Dokumentation fehlt: ' + pflicht);
}

const bestehendeWiederholungsMaschine = await readFile(path.join(wurzel, 'laufzeit/quelle/wiederholung/wiederholungs-maschine.ts'), 'utf8');
if (bestehendeWiederholungsMaschine.includes('CapabilityWiederholungsMaschine') || bestehendeWiederholungsMaschine.includes('capability-wiederholung')) {
  throw new Error('Block 8.6.8 darf die bestehende generische Block-5-Wiederholungsmaschine nicht rueckwirkend verdrahten.');
}


const capabilityFreigabeVertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/capability-freigabe.ts'), 'utf8');
for (const pflicht of [
  "CAPABILITY_FREIGABE_VERSION = '1.0.0'",
  'CapabilityFreigabePolicyVorgabe',
  'CapabilityFreigabeStatus',
  'remoteBeobachtungInstalliert',
  'capabilityEmpfangInstalliert',
  'sendeCapabilityEinmal',
  'spielAutoritaet: false',
  'neustartAutoritaet: false'
]) {
  if (!capabilityFreigabeVertrag.includes(pflicht)) throw new Error('Block-8.6.9-CapabilityFreigabe-Vertrag fehlt: ' + pflicht);
}

const livenessBeobachter = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-akzeptierter-lebensnachweis-beobachter.ts'), 'utf8');
for (const pflicht of [
  'AdventureLandAkzeptierterLebensnachweisBeobachter',
  'Reflect.apply(vorher',
  'angenommen === true',
  'GRUPPEN_LEBENSNACHWEIS_PROTOKOLL',
  'sendetLebensnachweise: false',
  'eigenerLivenessTimer: false',
  "livenessAutoritaet: 'bestehender-block8-cm-handler'",
  'aktionsAutoritaet: false'
]) {
  if (!livenessBeobachter.includes(pflicht)) throw new Error('Block-8.6.9-Liveness-Beobachter fehlt: ' + pflicht);
}
for (const verboten of [
  /\bsend_cm\s*\(/,
  /setInterval\s*\(/,
  /setTimeout\s*\(/
]) {
  if (verboten.test(livenessBeobachter)) throw new Error('Block 8.6.9 darf im passiven Liveness-Beobachter kein zweites Sende-/Timerprotokoll einfuehren: ' + verboten);
}

const capabilityFreigabeQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-capability-freigabe.ts'), 'utf8');
for (const pflicht of [
  'AdventureLandCapabilityFreigabe',
  'AdventureLandSkillKatalogAuditSteuerung',
  'SkillPolicySpeicher(new Arbeitsspeicher())',
  'CharakterFaehigkeitenResolver',
  'AdventureLandCapabilitySyncAustausch',
  'AdventureLandAkzeptierterLebensnachweisBeobachter',
  'pruefeRemoteCapabilityVertrauen',
  'waehleCapabilityBasierteGruppenrollen',
  'erstelleCapabilityStatusSicht',
  'Schattenmodus gesperrt',
  'BLOCK8-6-CAPABILITY-SENDEN:',
  'lebensnachweisSendeErfolge < 1',
  'spielAutoritaet: false as const',
  'neustartAutoritaet: false as const'
]) {
  if (!capabilityFreigabeQuelle.includes(pflicht)) throw new Error('Block-8.6.9-CapabilityFreigabe-Logik fehlt: ' + pflicht);
}
for (const verboten of [
  /\buse_skill\s*\(/,
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\bloot\s*\(/,
  /localStorage/,
  /location\.reload\s*\(/,
  /window\.close\s*\(/
]) {
  if (verboten.test(capabilityFreigabeQuelle)) throw new Error('Block 8.6.9 CapabilityFreigabe darf keine direkte Spiel-/Browserautoritaet einfuehren: ' + verboten);
}

const candidateEinstieg = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-block8-6-candidate-einstieg.ts'), 'utf8');
for (const pflicht of [
  "BLOCK86_RUNTIME_CANDIDATE_VERSION = '1.0.0'",
  "BLOCK86_RUNTIME_CANDIDATE_GLOBALER_NAME = 'V4Block86Candidate'",
  'installiereAdventureLandProduktionsLaufzeit',
  'installiereAdventureLandCapabilityFreigabe',
  'spielAutoritaet: false as const',
  'neustartAutoritaet: false as const'
]) {
  if (!candidateEinstieg.includes(pflicht)) throw new Error('Block-8.6.9-Candidate-Entry fehlt: ' + pflicht);
}
for (const verboten of [
  /\.starte\s*\(/,
  /\.sendeCapabilityEinmal\s*\(/,
  /\bsend_cm\s*\(/
]) {
  if (verboten.test(candidateEinstieg)) throw new Error('Block-8.6-Candidate darf beim Installieren keine aktive Aktion starten: ' + verboten);
}

const candidateBuilder = await readFile(path.join(wurzel, 'werkzeuge/block8-6-candidate-bauen.mjs'), 'utf8');
for (const pflicht of [
  'baueBlock86Candidate',
  "entryId = 'ausfuehrung/adventure-land-block8-6-candidate-einstieg.js'",
  '31',
  '228607',
  '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',
  'Immutable Runtime 1.1.5 wurde durch Block 8.6 veraendert',
  'aio-v4-block8-6-candidate.js',
  'aio-v4-block8-6-candidate.sha256',
  'AIO_V4_CAPABILITY_CONFIG'
]) {
  if (!candidateBuilder.includes(pflicht)) throw new Error('Block-8.6.9-Candidate-Builder fehlt: ' + pflicht);
}

const capabilityFreigabeTests = await readFile(path.join(wurzel, 'laufzeit/tests/capability-freigabe.test.mjs'), 'utf8');
for (const pflicht of [
  'Schatten aktualisiert Live-Katalog und lokale Capabilities bei exakt 0 CM-Sendungen',
  'Schattenmodus kann Remote-Beobachtung und Capability-Senden nicht aktivieren',
  'Live-Beobachtung nutzt akzeptierten bestehenden Block-8-Heartbeat und laesst alten Handler intakt',
  'kontrolliertes Capability-Senden ist explizit bestaetigter One-Shot und zaehlt Erfolg',
  'Live-Beobachtung verlangt bereits aktive bestehende Block-8-Liveness',
  'stoppe entfernt nur Capability-Wrapper und stoppt die Produktionsruntime nicht'
]) {
  if (!capabilityFreigabeTests.includes(pflicht)) throw new Error('Block-8.6.9-CapabilityFreigabe-Test fehlt: ' + pflicht);
}

const freigabeRunner = await readFile(path.join(wurzel, 'werkzeuge/block8-6-freigabestufen-live-test.js'), 'utf8');
for (const pflicht of [
  "const API_NAME = 'V4Block86FreigabeLiveTest'",
  "const VERSION = '1.0.0'",
  "const PFAD = 'block8.6-capability-runtime'",
  '600000',
  '5000',
  'BLOCK8-6-KONTROLLIERT-LIVE:',
  'BLOCK8-6-SOAK-STARTEN:',
  'recoveryReplayVerified',
  'capability.sendeCapabilityEinmal',
  'capability.aktualisiere()',
  'telemetrieNachweis: bestanden',
  'recoveryNachweis: bestanden && cfg.recoveryReplayVerified'
]) {
  if (!freigabeRunner.includes(pflicht)) throw new Error('Block-8.6.9-Freigaberunner fehlt: ' + pflicht);
}
for (const verboten of [
  /\battack\s*\(/,
  /\bmove\s*\(/,
  /\bsmart_move\s*\(/,
  /\buse_skill\s*\(/,
  /\bloot\s*\(/,
  /\bsend_cm\s*\(/,
  /runtime\.starte\s*\(/,
  /runtime\.stoppe\s*\(/,
  /pausiereLebensnachweisAutomatik\s*\(/,
  /setzeLebensnachweisAutomatikFort\s*\(/
]) {
  if (verboten.test(freigabeRunner)) throw new Error('Block 8.6.9 Freigaberunner darf keine direkte Spiel-/Runtime-Steuerung enthalten: ' + verboten);
}

const freigabeRunnerTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-6-freigabestufen-live-test.test.mjs'), 'utf8');
for (const pflicht of [
  'Schattenrunner erzeugt Nachweis bei 0 Heartbeat- und Capability-Sendungen',
  'kontrolliert live sendet genau an anderen vertrauten Charakter und bleibt begrenzt',
  'kontrolliert live verlangt exakten bestaetigten Lauftext',
  'Soak verlangt Recovery-Replay-Bindung und erzeugt 10-Minuten-Telemetrienachweis',
  'Runner besitzt keine direkte Adventure-Land-Spielaktionsfunktion',
  'Runner startet oder stoppt die Produktionsruntime nicht selbst'
]) {
  if (!freigabeRunnerTests.includes(pflicht)) throw new Error('Block-8.6.9-Freigaberunner-Test fehlt: ' + pflicht);
}

const freigabeDokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-9-FREIGABE-VORBEREITUNG.md'), 'utf8');
for (const pflicht of [
  'operative Freigabestufen Offline → Schatten → kontrolliert live → Soak sind noch nicht vollstaendig nachgewiesen',
  'Historische Runtime 1.1.5 bleibt immutable',
  '31 Module',
  '228607 Bytes',
  'isolierten In-Memory-Speicher',
  'kein zweites Heartbeat-Protokoll',
  'genau einen',
  '600000 ms = 10 Minuten',
  'recoveryNachweis=true',
  'block9Freigegeben=false',
  'finalen Candidate-SHA festhalten'
]) {
  if (!freigabeDokument.includes(pflicht)) throw new Error('Block-8.6.9-Freigabe-Dokumentation fehlt: ' + pflicht);
}

const plan = await readFile(path.join(wurzel, 'dokumentation/BLOCK-8-6-PLAN.md'), 'utf8');
for (const pflicht of [
  '8.6.1 – Skill-Katalog-Vertrag und Live-Lesequelle — **IMPLEMENTIERT**',
  '8.6.2 – Audit, Drift und Recovery-Revalidierung — **IMPLEMENTIERT**',
  '8.6.3 – Per-Character SkillPolicy und Slider — **IMPLEMENTIERT**',
  '8.6.4 – CharakterFaehigkeiten — **IMPLEMENTIERT**',
  '8.6.5 – Cross-Client Capability Sync — **IMPLEMENTIERT**',
  '8.6.6 – Capability-basierte Leader- und Aufgabenwahl — **IMPLEMENTIERT**',
  '8.6.7 – Status, HUD und Diagnose — **IMPLEMENTIERT**',
  '8.6.8 – Replay und Regression — **IMPLEMENTIERT**',
  '8.6.9 – Freigabe — **RELEASE-CANDIDATE DEPLOYED/HTTPS + SCHATTEN VERIFIZIERT; LIVE/SOAK OFFEN**',
  'Naechster operativer Schritt: **8.6.9 – kontrollierten Live-Lauf mit der bestandenen Schattenuebergabe ausfuehren; danach Soak**'
]) {
  if (!plan.includes(pflicht)) throw new Error(`Block-8.6-Plan ist nicht auf aktuellem 8.6.9-Vorbereitungsstand: ${pflicht}`);
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
  '`aktionsAutoritaet: false`',
  '## CharakterFaehigkeiten',
  '`strukturellVorhanden`',
  '`aktuellAutomatisierbar=true`',
  '## CapabilitySync',
  'keinen eigenen Liveness-Timer',
  '`aktionsAutoritaet: false`',
  '## CapabilityGruppenwahl',
  '`gruppenKoordinationErlaubt=true`',
  'nur als finale Tie-Breaker',
  '## CapabilityStatus',
  '`nurLesen: true`',
  '`bedienAutoritaet: false`',
  '`neustartAutoritaet: false`',
  '## CapabilityWiederholung',
  '`eingabeFingerabdruck`',
  '`schrittFingerabdruck`',
  '`ausgabeFingerabdruck`',
  '## CapabilityFreigabe',
  '`spielAutoritaet: false`',
  '`neustartAutoritaet: false`',
  'keinen eigenen Liveness-Timer'
]) {
  if (!vertraege.includes(pflicht)) throw new Error(`V4-Vertragsdokumentation fehlt fuer Block 8.6.1 bis 8.6.9-Vorbereitung: ${pflicht}`);
}

const packageJson = JSON.parse(await readFile(path.join(wurzel, 'package.json'), 'utf8'));
if (packageJson.scripts?.['block8-6-struktur:pruefen'] !== 'node werkzeuge/block8-6-struktur-pruefen.mjs && npm run block8-6-candidate:pruefen && npm run block8-6-release-bindung:pruefen && npm run block8-6-schatten-paket:pruefen && npm run block8-6-live-paket:pruefen') {
  throw new Error('package.json muss den Block-8.6-Strukturguard inklusive Candidate-, Release-Bindungs-, Schatten- und Livepaketpruefung anbieten.');
}
if (packageJson.scripts?.['block8-6-release-bindung:pruefen'] !== 'node werkzeuge/block8-6-release-bindung-pruefen.mjs') {
  throw new Error('package.json muss die Block-8.6-Release-Bindungspruefung anbieten.');
}
if (packageJson.scripts?.['block8-6-schatten-paket:bauen'] !== 'node werkzeuge/block8-6-schatten-paket-bauen.mjs') {
  throw new Error('package.json muss den Block-8.6-Schattenpaket-Build anbieten.');
}
if (packageJson.scripts?.['block8-6-schatten-paket:pruefen'] !== 'node werkzeuge/block8-6-schatten-paket-bauen.mjs --pruefen && node --check werkzeuge/block8-6-schatten-paket.js') {
  throw new Error('package.json muss die source-locked Block-8.6-Schattenpaket-Pruefung anbieten.');
}
if (packageJson.scripts?.['block8-6-live-paket:bauen'] !== 'node werkzeuge/block8-6-live-paket-bauen.mjs') {
  throw new Error('package.json muss den Block-8.6-Livepaket-Build anbieten.');
}
if (packageJson.scripts?.['block8-6-live-paket:pruefen'] !== 'node werkzeuge/block8-6-live-paket-bauen.mjs --pruefen && node --check werkzeuge/block8-6-live-paket.js') {
  throw new Error('package.json muss die source-locked Block-8.6-Livepaket-Pruefung anbieten.');
}

const livePaket = await readFile(path.join(wurzel, 'werkzeuge/block8-6-live-paket.js'), 'utf8');
for (const pflicht of [
  'ca0dfee7685563c8b6003469300c8fd08777b053',
  'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5',
  'block8-6-schatten-1789822653521',
  'BLOCK8-6-KONTROLLIERT-LIVE:block8-6-schatten-1789822653521',
  "vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2'])",
  "modus: 'live'",
  'runtime.starte()',
  'warteAufProduktionsheartbeat(runtime)',
  "titel: '2 · Kontrolliert live'",
  'nachCap.senden.versuche === 1',
  'nachCap.senden.erfolge === 1',
  'nachCap.senden.fehler === 0'
]) {
  if (!livePaket.includes(pflicht)) throw new Error('Block-8.6-Livepaket fehlt: ' + pflicht);
}


const schattenPaket = await readFile(path.join(wurzel, 'werkzeuge/block8-6-schatten-paket.js'), 'utf8');
for (const pflicht of [
  'ca0dfee7685563c8b6003469300c8fd08777b053',
  'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5',
  'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js',
  'CANDIDATE_BYTES = 396471',
  "modus: 'schatten'",
  'V4Block86SchattenLauncher',
  'Strikter Block-8.6-Schatten-Preflight bestanden',
  "titel: '1 · Schattennachweis'",
  'runnerBericht: bericht'
]) {
  if (!schattenPaket.includes(pflicht)) throw new Error('Block-8.6-Schattenpaket fehlt: ' + pflicht);
}

if (packageJson.scripts?.['block8-6-candidate:pruefen'] !== 'node werkzeuge/block8-6-candidate-bauen.mjs --pruefen && node --check werkzeuge/block8-6-freigabestufen-live-test.js') {
  throw new Error('package.json muss die reproduzierbare Block-8.6-Candidate-Pruefung anbieten.');
}
if (!String(packageJson.scripts?.pruefen ?? '').includes('npm run block8-6-struktur:pruefen')) {
  throw new Error('npm run pruefen muss den Block-8.6-Strukturguard ausfuehren.');
}

console.log('Block 8.6.1 bis 8.6.9 geprueft: Capability Truth bis Replay, exakt gebundener/deployed Candidate, real bestandener Schatten und source-locked Livepaket; real kontrolliert live/Soak bleiben offen.');
