import fs from "node:fs";

const fehler=[];
const lies=pfad=>fs.readFileSync(pfad,"utf8");
const pflicht=[
  "grundlage/quelle/zertifizierung/evidence-kette.ts",
  "grundlage/quelle/zertifizierung/ladder.ts",
  "grundlage/quelle/zertifizierung/shadow-bewertung.ts",
  "grundlage/tests/r19-evidence-ladder.test.mjs",
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
  "werkzeuge/r19-canary-test-paket-bauen.mjs",
  "werkzeuge/r19-canary-test-paket.js",
  "werkzeuge/r19-canary-test-gui.js",
];
for(const p of pflicht) if(!fs.existsSync(p)) fehler.push("PFLICHTARTEFAKT_FEHLT:"+p);

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
  "SOAK_30M",
  "SOAK_60M",
  "ZERT_LADDER_STUFE_UEBERSPRUNGEN",
  "ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH",
  "breiteRuntimeFreigegeben: false",
]){
  if(!ladder.includes(m)) fehler.push("LADDER_MARKER_FEHLT:"+m);
}

for(const alt of ["SOAK_1H","SOAK_24H","SOAK_72H","SOAK_7D","SOAK_30D"]){
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

const liveGui=lies("werkzeuge/r19-controlled-live-test-gui.js");
for(const m of [
  "R19-CONTROLLED-LIVE-EQUIP-ONCE",
  "zertifizierungsStufe: 'CONTROLLED_LIVE'",
  "manuelleBestaetigung: true",
  "sameIntentRetry: false",
  "breiteRuntimeFreigabe: false",
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
]){
  if(!canaryGui.includes(m)) fehler.push("R19_CANARY_GUI_MARKER_FEHLT:"+m);
}
const canaryEquipAufrufe=canaryGui.match(/\.equip\s*\(/g)??[];
if(canaryEquipAufrufe.length!==1) fehler.push("R19_CANARY_GUI_EQUIP_ANZAHL:"+canaryEquipAufrufe.length);

const soakGui=lies("werkzeuge/r19-soak-5m-test-gui.js");
for(const m of [
  "R19-SOAK-1H-START",
  "const DAUER_MS = 5 * 60 * 1000",
  "const INTERVALL_MS = 15 * 1000",
  "const MAX_SAMPLE_GAP_MS = 45 * 1000",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "HEAP_METRIK_FEHLT",
  "STORAGE_ESTIMATE_FEHLT",
]){
  if(!soakGui.includes(m)) fehler.push("R19_SOAK_5M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soakGui)) fehler.push("R19_SOAK_5M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
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
