import fs from "node:fs";

const fehler=[];
const lies=pfad=>fs.readFileSync(pfad,"utf8");
const pflicht=[
  "grundlage/quelle/zertifizierung/evidence-kette.ts",
  "grundlage/quelle/zertifizierung/ladder.ts",
  "grundlage/quelle/zertifizierung/shadow-bewertung.ts",
  "grundlage/quelle/zertifizierung/production-certification.ts",
  "grundlage/quelle/runtime/produktions-komposition.ts",
  "grundlage/quelle/merchant/modul-vertrag.ts",
  "grundlage/quelle/merchant/demand.ts",
  "grundlage/tests/r11-produktions-kompositionskatalog.test.mjs",
  "grundlage/tests/r19-evidence-ladder.test.mjs",
  "grundlage/tests/r19-production-certification.test.mjs",
  "grundlage/tests/r19-shadow-certification.test.mjs",
  "werkzeuge/r19-ui-release-gate.mjs",
  "werkzeuge/r19-controlled-live-test-gui.js",
  "werkzeuge/r19-controlled-live-test-paket.js",
  "werkzeuge/r19-test-gui-paket-bauen.mjs",
  "werkzeuge/tests/r19-test-gui.test.mjs",
  "werkzeuge/tests/r19-canary-test-gui.test.mjs",
  "werkzeuge/tests/r19-soak-5m-test-gui.test.mjs",
  "werkzeuge/r19-soak-5m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-5m-test-paket.js",
  "werkzeuge/r19-soak-5m-test-gui.js",
  "werkzeuge/tests/r19-soak-10m-test-gui.test.mjs",
  "werkzeuge/r19-soak-10m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-10m-test-paket.js",
  "werkzeuge/r19-soak-10m-test-gui.js",
  "werkzeuge/tests/r19-soak-15m-test-gui.test.mjs",
  "werkzeuge/r19-soak-15m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-15m-test-paket.js",
  "werkzeuge/r19-soak-15m-test-gui.js",
  "werkzeuge/r19-canary-test-paket-bauen.mjs",
  "werkzeuge/r19-canary-test-paket.js",
  "werkzeuge/r19-canary-test-gui.js",
  "werkzeuge/cap045-production-live-test-gui.js",
  "werkzeuge/cap045-production-live-test-paket-bauen.mjs",
  "werkzeuge/cap045-production-live-test-paket.js",
  "werkzeuge/cap045-production-live-static-guards.mjs",
  "werkzeuge/tests/cap045-production-live-test-gui.test.mjs",
  "werkzeuge/cap045-production-live-evidence-pruefen.mjs",
  "werkzeuge/tests/cap045-production-live-evidence-pruefen.test.mjs",
];
for(const p of pflicht) if(!fs.existsSync(p)) fehler.push("PFLICHTARTEFAKT_FEHLT:"+p);

const produktionsKomposition=lies("grundlage/quelle/runtime/produktions-komposition.ts");
for(const m of [
  "DEFAULT_DENY_OHNE_FAEHIGKEITSBINDUNGEN",
  "merchantCoreABasisModulDefinition",
  "faehigkeitsDefinitionen: Object.freeze([])",
]){
  if(!produktionsKomposition.includes(m)) {
    fehler.push("PRODUKTIONS_KOMPOSITION_DEFAULT_DENY_FEHLT:"+m);
  }
}
const merchantModul=lies("grundlage/quelle/merchant/modul-vertrag.ts");
for(const m of [
  'MERCHANT_CORE_A_MODUL_ID = "merchant-core-a"',
  'MERCHANT_CORE_A_MODUL_VERSION = "1"',
  "standardAktiv: false",
]){
  if(!merchantModul.includes(m)) fehler.push("MERCHANT_MODUL_VERTRAG_FEHLT:"+m);
}
const merchantDemand=lies("grundlage/quelle/merchant/demand.ts");
if(!merchantDemand.includes("eigentuemerModulId: MERCHANT_CORE_A_MODUL_ID")) {
  fehler.push("MERCHANT_WORKFLOW_OWNER_NICHT_KANONISCH");
}
if(merchantDemand.includes('eigentuemerModulId: "merchant-core-a"')) {
  fehler.push("MERCHANT_WORKFLOW_OWNER_HARDCODIERT");
}

const evidence=lies("grundlage/quelle/zertifizierung/evidence-kette.ts");
for(const m of [
  "sampleGaps",
  "fingerprintFehler",
  "unveraenderlicheKette: true",
  "unexpectedGameWrites",
  "kritischePersistenzverluste",
  "hotPathNichtkritischeSsdBlockaden",
  "maximaleSsdAktiveBytes",
  "minimaleFreieBytes",
  "maximaleIoQueueTiefe",
]){
  if(!evidence.includes(m)) fehler.push("EVIDENCE_MARKER_FEHLT:"+m);
}

const ladder=lies("grundlage/quelle/zertifizierung/ladder.ts");
for(const m of [
  "SIMULATOR_REPLAY",
  "FAULT_SUITE",
  "SHADOW",
  "CONTROLLED_LIVE",
  "CANARY",
  "SOAK_5M",
  "SOAK_10M",
  "SOAK_15M",
  "ZERT_LADDER_STUFE_UEBERSPRUNGEN",
  "ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH",
  "breiteRuntimeFreigegeben: false",
]){
  if(!ladder.includes(m)) fehler.push("LADDER_MARKER_FEHLT:"+m);
}

for(const alt of ["SOAK_1H","SOAK_24H","SOAK_72H","SOAK_7D","SOAK_30D","SOAK_30M","SOAK_60M"]){
  if(ladder.includes(alt)) fehler.push("SOAK_30D_DARF_NICHT_MEHR_IN_LADDER_SEIN:"+alt);
}

const shadow=lies("grundlage/quelle/zertifizierung/shadow-bewertung.ts");
for(const m of [
  "unexpectedGameWrites: 0",
  "shadowHatGameplayAutoritaet: false",
  "shadowHatRawWriteAutoritaet: false",
]){
  if(!shadow.includes(m)) fehler.push("SHADOW_MARKER_FEHLT:"+m);
}

const productionCert=lies("grundlage/quelle/zertifizierung/production-certification.ts");
for(const m of [
  "auditiereProduktionsCoverage",
  "STRUCTURAL_GAP",
  "DEFERRED_EVENT_INAKTIV",
  "duplicateIrreversibleEffects",
  "recipientSettlementVerifiziert",
  "RECOVERY_PENDING",
  "synthetischeEvidenceZaehltAlsLive: false",
  "liveBeweisBestanden",
  "diagnosticOnly: true",
  "actionAuthority: false",
  "rawWriteAuthority: false",
  "breiteRuntimeFreigabe: false",
]){
  if(!productionCert.includes(m)) fehler.push("PRODUCTION_CERT_MARKER_FEHLT:"+m);
}

const testGui=lies("werkzeuge/v5-adventure-land-test-gui.js");
if(!testGui.includes("aktivierePerformanceTrick")||!testGui.includes("performanceTrickStatus")||!testGui.includes("performance_trick")||!testGui.includes("HOWLER_PLAYING_TRUE")||!testGui.includes("aktiv: verfuegbar && audioGefunden && playing")) fehler.push("R19_PERFORMANCE_TRICK_HELPER_FEHLT");
if(!testGui.includes("setzeRestzeit")||!testGui.includes("v5tg-timer")||!testGui.includes("Verbleibende Testdauer")) fehler.push("R19_TEST_GUI_COUNTDOWN_FEHLT");

const liveGui=lies("werkzeuge/r19-controlled-live-test-gui.js");
for(const m of [
  "R19-CONTROLLED-LIVE-EQUIP-ONCE",
  "zertifizierungsStufe: 'CONTROLLED_LIVE'",
  "manuelleBestaetigung: true",
  "sameIntentRetry: false",
  "breiteRuntimeFreigabe: false",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "await guiApi().aktivierePerformanceTrick()",
]){
  if(!liveGui.includes(m)) fehler.push("CONTROLLED_LIVE_GUI_MARKER_FEHLT:"+m);
}
const equipAufrufe=liveGui.match(/\.equip\s*\(/g)??[];
if(equipAufrufe.length!==1) fehler.push("CONTROLLED_LIVE_GUI_EQUIP_ANZAHL:"+equipAufrufe.length);

const canaryGui=lies("werkzeuge/r19-canary-test-gui.js");
for(const m of [
  "R19-CANARY-EQUIP-ONCE",
  "zertifizierungsStufe: 'CANARY'",
  "r19-canary-bounded-test-ranker",
  "maximalerAbsoluterScoreDelta: MAX_DELTA",
  "gameplayAutoritaet: false",
  "authorityAenderungErlaubt: false",
  "safetyLockerungErlaubt: false",
  "deterministischerFallbackIndex",
  "hardErlaubteKandidaten",
  "sameIntentRetry: false",
  "breiteRuntimeFreigabe: false",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "await guiApi().aktivierePerformanceTrick()",
]){
  if(!canaryGui.includes(m)) fehler.push("R19_CANARY_GUI_MARKER_FEHLT:"+m);
}
const canaryEquipAufrufe=canaryGui.match(/\.equip\s*\(/g)??[];
if(canaryEquipAufrufe.length!==1) fehler.push("R19_CANARY_GUI_EQUIP_ANZAHL:"+canaryEquipAufrufe.length);

const soakGui=lies("werkzeuge/r19-soak-5m-test-gui.js");
for(const m of [
  "R19-SOAK-5M-START",
  "const DAUER_MS = 5 * 60 * 1000",
  "const INTERVALL_MS = 15 * 1000",
  "const MAX_SAMPLE_GAP_MS = 45 * 1000",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "HEAP_METRIK_FEHLT",
  "STORAGE_ESTIMATE_FEHLT",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "PERFORMANCE_TRICK_AUSGEFALLEN",
  "await guiApi().aktivierePerformanceTrick()",
  "guiApi().performanceTrickStatus()",
  "performanceTrickFehler",
  "gui.setzeRestzeit",
  "setInterval(aktualisiereCountdown, 1000)",
  "restzeitMs",
]){
  if(!soakGui.includes(m)) fehler.push("R19_SOAK_5M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soakGui)) fehler.push("R19_SOAK_5M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
}

const soak10Gui=lies("werkzeuge/r19-soak-10m-test-gui.js");
for(const m of [
  "R19-SOAK-10M-START",
  "const DAUER_MS = 10 * 60 * 1000",
  "const INTERVALL_MS = 30 * 1000",
  "const MAX_SAMPLE_GAP_MS = 90 * 1000",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "PERFORMANCE_TRICK_AUSGEFALLEN",
  "gui.setzeRestzeit",
  "setInterval(aktualisiereCountdown, 1000)",
  "restzeitMs",
]){
  if(!soak10Gui.includes(m)) fehler.push("R19_SOAK_10M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soak10Gui)) fehler.push("R19_SOAK_10M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
}

const soak15Gui=lies("werkzeuge/r19-soak-15m-test-gui.js");
for(const m of [
  "R19-SOAK-15M-START",
  "const DAUER_MS = 15 * 60 * 1000",
  "const INTERVALL_MS = 30 * 1000",
  "const MAX_SAMPLE_GAP_MS = 90 * 1000",
  "const MAX_SAMPLES = 40",
  "samples.length >= 30",
  "minimaleSamples: 30",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "PERFORMANCE_TRICK_AUSGEFALLEN",
  "gui.setzeRestzeit",
  "setInterval(aktualisiereCountdown, 1000)",
]){
  if(!soak15Gui.includes(m)) fehler.push("R19_SOAK_15M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soak15Gui)) fehler.push("R19_SOAK_15M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
}

const rawMuster=[
  /\battack\s*\(/,/\bsmart_move\s*\(/,/\bmove\s*\(/,/\bxmove\s*\(/,
  /\buse_skill\s*\(/,/\brespawn\s*\(/,/\bchange_server\s*\(/,
  /\bsend_cm\s*\(/,/\bsend_gold\s*\(/,/\bsend_item\s*\(/,/\.emit\s*\(/,
];
for(const p of pflicht.filter(x=>x.startsWith("grundlage/quelle/"))){
  const t=lies(p);
  if(rawMuster.some(r=>r.test(t))) fehler.push("R19_CORE_RAW_GAME_WRITE_VERBOTEN:"+p);
}

if(fehler.length){
  console.error("[V5-R19-GUARD] FEHLER\n"+fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R19-GUARD] OK / Zertifizierung bis Shadow no-write und manuelles Live-Gate unvermeidbar");
