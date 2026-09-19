import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R6-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r6 = gates.phases?.find(x => x.id === "R6");

if (!r6 || !["IN_PROGRESS", "DONE"].includes(r6.status)) fehler("R6 muss IN_PROGRESS oder DONE sein.");
if (r6.status === "IN_PROGRESS" && gates.currentPhase !== "R6") fehler("R6 IN_PROGRESS verlangt currentPhase=R6.");
if (bereitschaft.status === "FREIGEGEBEN") fehler("R6 darf Gameplay-Runtime nicht freigeben.");

for (const pfad of [
  "grundlage/quelle/wissen/typen.ts",
  "grundlage/quelle/wissen/snapshot.ts",
  "grundlage/quelle/wissen/wissens-zugriff-port.ts",
  "grundlage/quelle/wissen/verifier.ts",
  "grundlage/quelle/wissen/abgleich.ts",
  "grundlage/quelle/wissen/drift-quarantaene.ts",
  "grundlage/tests/r6-wissen.test.mjs",
  "architektur/adr/ADR-005-R6-EVIDENCE-WORKING-SETS.md",
  "architektur/adr/ADR-006-R6-DEUTSCHER-ANZEIGEKATALOG.md",
  "architektur/adr/ADR-007-R6-VERIFIER-PUBLIKATION.md",
  "grundlage/tests/r6-publikation.test.mjs",
  "grundlage/quelle/wissen/beobachtungs-evidence-ablage.ts",
  "grundlage/quelle/wissen/live-wissens-publizierer.ts",
  "grundlage/tests/r6-evidence.test.mjs",
  "grundlage/quelle/wissen/wissens-promotion.ts",
  "grundlage/quelle/wissen/learning-evidence.ts",
  "grundlage/quelle/wissen/ram-arbeitsmenge.ts",
  "grundlage/quelle/wissen/beobachtungs-evidence.ts",
  "architektur/adr/ADR-004-R6-WISSEN-WELTWAHRHEIT.md",
  "anzeigetexte/katalog.schema.json",
  "werkzeuge/r6-anzeigekatalog-abdeckung.mjs",
  "anzeigetexte/katalog.json",
  "grundlage/tests/r6-anzeigekatalog.test.mjs",
  "grundlage/quelle/anzeige/anzeigekatalog.ts",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R6" && x.prioritaet === "MUSS");
if (anforderungen.length !== 13) fehler("R6 muss exakt 13 ratifizierte MUSS-Anforderungen besitzen.");

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R6");
if (fitness.length !== 7) fehler("R6 muss exakt 7 ratifizierte Fitnessregeln besitzen.");

const uiKennungen = new Set(["V5-ANF-UI-002","V5-ANF-UI-003","V5-ANF-UI-005","V5-ANF-UI-009"]);
const nichtUi = anforderungen.filter(x => !uiKennungen.has(x.kennung));
const ui = anforderungen.filter(x => uiKennungen.has(x.kennung));
if (nichtUi.length !== 9 || nichtUi.some(x => x.status !== "R6_NACHGEWIESEN")) {
  fehler("R6 Zwischenstand 9/13: alle neun Nicht-UI-MUSS-Anforderungen muessen nachgewiesen sein.");
}
if (ui.length !== 4
    || ui.some(x => !["OFFEN","R6_NACHGEWIESEN"].includes(x.status))
    || ui.some(x => x.status === "OFFEN"
      && x.r6TeilnachweisStatus !== "MECHANISMUS_BEREIT_INHALTSABDECKUNG_OFFEN")) {
  fehler("R6 UI-Anforderungen muessen nachgewiesen oder mit explizitem Abdeckungsblocker offen sein.");
}
const fitnessOhneMonster = fitness.filter(x => x.kennung !== "V5-FIT-015");
if (fitnessOhneMonster.length !== 6
    || fitnessOhneMonster.some(x => x.r6NachweisStatus !== "ERFUELLT")) {
  fehler("R6: sechs Nicht-Monster-Fitnessregeln muessen erfuellt sein.");
}
const monsterFitness = fitness.find(x => x.kennung === "V5-FIT-015");
if (!monsterFitness || !["TEILWEISE","ERFUELLT"].includes(monsterFitness.r6NachweisStatus)) {
  fehler("R6 Monster-Anzeigekatalog-Fitnessstatus fehlt.");
}

const abdeckung = lies("r6-anzeigekatalog-abdeckung.json");
if (abdeckung.phase !== "R6" || !["OFFEN","BEREIT"].includes(abdeckung.status)) {
  fehler("R6 Anzeigekatalog-Abdeckungsbericht fehlt oder ist ungueltig.");
}
if (abdeckung.kategorien?.KLASSE?.erwartet !== 7
    || abdeckung.kategorien?.KLASSE?.abgedeckt !== 7) {
  fehler("Aktuelle sieben Klassen muessen 7/7 im produktiven Anzeigekatalog abgedeckt sein.");
}
for (const [kategorie, erwartet] of [["EREIGNIS", 11], ["AKTION", 60], ["STATUS", 102]]) {
  const wert = abdeckung.kategorien?.[kategorie];
  if (!wert || wert.erwartet !== erwartet || wert.abgedeckt !== erwartet || wert.fehlendAnzahl !== 0) {
    fehler("Aktuelle Events Aktionen und Status muessen vollstaendig abgedeckt sein: " + kategorie);
  }
}

const typen = fs.readFileSync("grundlage/quelle/wissen/typen.ts", "utf8");
for (const name of ["DefinitionsWissen","SpielBeobachtung","LiveVerifizierterFakt","AbgeglicheneWeltWahrheit"]) {
  if (!typen.includes("interface " + name)) fehler("Getrennter R6-Typ fehlt: " + name);
}
if (!typen.includes("ausfuehrungsAutoritaet: false") || !typen.includes("mutationAutorisiert: false")) {
  fehler("R6-Wissen darf keine ExecutionAuthority tragen.");
}

const zugriff = fs.readFileSync("grundlage/quelle/wissen/wissens-zugriff-port.ts", "utf8");
if (!zugriff.includes("interface WissensZugriffPort")
    || !zugriff.includes("gibGepinntenSnapshot")
    || !zugriff.includes("liesKanonischeDatei")) {
  fehler("Read-only WissensZugriffPort unvollstaendig.");
}
if (/\b(?:schreibe|loesche|aktualisiere|ersetze)\w*\s*\(/.test(zugriff)) {
  fehler("WissensZugriffPort enthaelt mutierende API.");
}

const snapshot = fs.readFileSync("grundlage/quelle/wissen/snapshot.ts", "utf8");
if (!snapshot.includes("HashPrueferPort") || !snapshot.includes("pinneWissensSnapshot")
    || !snapshot.includes("WISSEN_SNAPSHOT_HASH_FALSCH")
    || !snapshot.includes("WISSEN_SNAPSHOT_ZU_VIELE_DATEIEN")) {
  fehler("Snapshot-Pinning/Hash/Bounds unvollstaendig.");
}

const verifier = fs.readFileSync("grundlage/quelle/wissen/verifier.ts", "utf8");
if (!verifier.includes("FachlicherLiveVerifier")
    || !verifier.includes('"LIVE_SPIEL"')
    || !verifier.includes('"LIVE_VERIFIZIERT"')) {
  fehler("LIVE_VERIFIZIERT-Verifiervertrag unvollstaendig.");
}

const abgleich = fs.readFileSync("grundlage/quelle/wissen/abgleich.ts", "utf8");
if (!abgleich.includes('"VERALTET"') || !abgleich.includes('"WIDERSPRUCH"')
    || !abgleich.includes("mutationAutorisiert: false")) {
  fehler("World-Truth-Frische/Widerspruch fail-closed unvollstaendig.");
}

const drift = fs.readFileSync("grundlage/quelle/wissen/drift-quarantaene.ts", "utf8");
if (!drift.includes('"QUARANTAENE"') || !drift.includes("automatischeFreigabe: false")
    || !drift.includes("mutationAutorisiert: false")) {
  fehler("Drift-Quarantaenevertrag unvollstaendig.");
}

const evidence = fs.readFileSync("grundlage/quelle/wissen/beobachtungs-evidence.ts", "utf8");
if (!evidence.includes("BegrenzteBeobachtungsHistorie")
    || !evidence.includes('"WARM_SSD"')
    || !evidence.includes("maximaleGesamtZeichen")
    || !evidence.includes("verworfenWegenGrenze")) {
  fehler("Bounded Observation-Evidence unvollstaendig.");
}

const arbeitsmenge = fs.readFileSync("grundlage/quelle/wissen/ram-arbeitsmenge.ts", "utf8");
if (!arbeitsmenge.includes("verdichteZuRamArbeitsmenge")
    || !arbeitsmenge.includes('"HOT_RAM"')
    || !arbeitsmenge.includes("verworfeneKennungenWegenGrenze")
    || !arbeitsmenge.includes("ausfuehrungsAutoritaet: false")) {
  fehler("Kompakte RAM-Working-Set-Aggregation unvollstaendig.");
}

const learning = fs.readFileSync("grundlage/quelle/wissen/learning-evidence.ts", "utf8");
if (!learning.includes("learningEvidenceVersion: 1")
    || !learning.includes("gameplayAutoritaet: false")
    || !learning.includes("automatischePromotion: false")
    || !learning.includes("mutationAutorisiert: false")) {
  fehler("Learning-Evidence-Versionierung/Authority-Trennung unvollstaendig.");
}

const promotion = fs.readFileSync("grundlage/quelle/wissen/wissens-promotion.ts", "utf8");
if (!promotion.includes("EINZELNER_LIVE_FAKT_DARF_NICHT_GENERALISIERT_WERDEN")
    || !promotion.includes("automatischePromotion: false")) {
  fehler("Wissens-Promotion-Guard unvollstaendig.");
}

if (!snapshot.includes("GITHUB_LIVE_SPIEGEL_NUR_VERIFIZIERTE_LIVE_FAKTEN")
    || !snapshot.includes("GITHUB_LIVE_SPIEGEL_ARTEFAKT_NICHT_ERLAUBT")) {
  fehler("GitHub-Live-Snapshot blockiert Rohtelemetrie/unerlaubte Artefakte nicht.");
}

const anzeige = fs.readFileSync("grundlage/quelle/anzeige/anzeigekatalog.ts", "utf8");
for (const marker of [
  "VersionierterAnzeigekatalog",
  "DEUTSCH_GEPRUEFT",
  "DEUTSCH_OFFIZIELL",
  "ORIGINALNAME_ERLAUBT",
  "Unbekannte Fähigkeit",
  "Unbekannter Gegenstand",
  "MONSTER_EIGENE_UEBERSETZUNG_NICHT_ERLAUBT",
]) {
  if (!anzeige.includes(marker)) fehler("Anzeigekatalog-Regel fehlt: " + marker);
}
if (!anzeige.includes('kategorie === "FAEHIGKEIT"') || !anzeige.includes("SKILL_BESCHREIBUNG_FEHLT")) {
  fehler("Skill-Anzeigekatalog erzwingt Name/Beschreibung nicht.");
}

const publizierer = fs.readFileSync("grundlage/quelle/wissen/live-wissens-publizierer.ts", "utf8");
if (!publizierer.includes("LiveWissensPublizierer")
    || !publizierer.includes("LIVE_WISSEN_NUR_VERIFIZIERTE_FAKTEN")
    || !publizierer.includes('"LIVE_VERIFIZIERT"')
    || !publizierer.includes('"LIVE_SPIEL"')) {
  fehler("Fachlich verifizierte Live-Wissenspublikation unvollstaendig.");
}

const evidenceAblage = fs.readFileSync("grundlage/quelle/wissen/beobachtungs-evidence-ablage.ts", "utf8");
if (!evidenceAblage.includes("BeobachtungsEvidenceAblage")
    || !evidenceAblage.includes("BEOBACHTUNGS_EVIDENCE")
    || !evidenceAblage.includes("PersistenzPort")) {
  fehler("Typisierter Observation-Evidence-Persistenzpfad unvollstaendig.");
}

const index = fs.readFileSync("grundlage/quelle/index.ts", "utf8");
for (const exportPfad of [
  "./wissen/typen.js","./wissen/snapshot.js","./wissen/wissens-zugriff-port.js",
  "./wissen/verifier.js","./wissen/abgleich.js","./wissen/drift-quarantaene.js",
  "./wissen/beobachtungs-evidence.js","./wissen/ram-arbeitsmenge.js",
  "./wissen/learning-evidence.js","./wissen/wissens-promotion.js",
  "./anzeige/anzeigekatalog.js",
  "./wissen/live-wissens-publizierer.js","./wissen/beobachtungs-evidence-ablage.js",
]) {
  if (!index.includes(exportPfad)) fehler("Index-Export fehlt: " + exportPfad);
}
console.log("[V5-R6-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
