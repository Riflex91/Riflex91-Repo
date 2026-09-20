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
  "SOAK_1H",
  "SOAK_24H",
  "SOAK_72H",
  "SOAK_7D",
  "ZERT_LADDER_STUFE_UEBERSPRUNGEN",
  "ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH",
  "breiteRuntimeFreigegeben: false",
]){
  if(!ladder.includes(m)) fehler.push("LADDER_MARKER_FEHLT:"+m);
}

const shadow=lies("grundlage/quelle/zertifizierung/shadow-bewertung.ts");
for(const m of [
  "unexpectedGameWrites: 0",
  "shadowHatGameplayAutoritaet: false",
  "shadowHatRawWriteAutoritaet: false",
]){
  if(!shadow.includes(m)) fehler.push("SHADOW_MARKER_FEHLT:"+m);
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
