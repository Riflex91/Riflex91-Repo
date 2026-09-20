import fs from "node:fs";

const fehler=[];
const lies=p=>fs.readFileSync(p,"utf8");
const pflicht=[
  "grundlage/quelle/lernen/deterministischer-fallback.ts",
  "grundlage/quelle/lernen/lern-admission.ts",
  "grundlage/quelle/lernen/datenbasis-pin.ts",
  "grundlage/quelle/lernen/modell-liga.ts",
  "grundlage/tests/r18-fallback-ranking.test.mjs",
  "grundlage/tests/r18-admission-evidence.test.mjs",
  "grundlage/tests/r18-modell-liga.test.mjs",
];
for(const p of pflicht) if(!fs.existsSync(p)) fehler.push("PFLICHTARTEFAKT_FEHLT:"+p);

const fallback=lies("grundlage/quelle/lernen/deterministischer-fallback.ts");
for(const m of ["waehleDeterministisch","fallbackImmerVerfuegbar:true","hardErlaubt","maximalerAbsoluterScoreDelta","gameplayAutoritaet: false","authorityAenderungErlaubt: false"]){
  if(!fallback.includes(m)) fehler.push("FALLBACK_MARKER_FEHLT:"+m);
}

const admission=lies("grundlage/quelle/lernen/lern-admission.ts");
for(const m of ["SAFETY_DENY","AUTHORITY_DENY","OPERATOR_DENY","QUARANTAENE","BUDGET_DENY","RETRY_GRENZE_DRIFT","learningKannDenyNichtUeberstimmen:true"]){
  if(!admission.includes(m)) fehler.push("ADMISSION_MARKER_FEHLT:"+m);
}

const daten=lies("grundlage/quelle/lernen/datenbasis-pin.ts");
for(const m of ["LearningEvidence","featureSchemaVersion","datenFingerprint","gameplayAutoritaet:false","mutationAutorisiert:false"]){
  if(!daten.includes(m)) fehler.push("DATEN_MARKER_FEHLT:"+m);
}

const liga=lies("grundlage/quelle/lernen/modell-liga.ts");
for(const m of ["CHAMPION","CHALLENGER","SHADOW","PROMOTION_BEREIT","QUARANTAENE","gameplayTrafficErlaubt:false","gameplayAutoritaet:false","safetyVerletzungen","sampleGaps"]){
  if(!liga.includes(m)) fehler.push("MODELL_LIGA_MARKER_FEHLT:"+m);
}

const rawMuster=[
  /\battack\s*\(/,/\bsmart_move\s*\(/,/\bmove\s*\(/,/\buse_skill\s*\(/,
  /\brespawn\s*\(/,/\bchange_server\s*\(/,/\bsend_cm\s*\(/,
  /\bsend_gold\s*\(/,/\bsend_item\s*\(/,/\.emit\s*\(/,
];
for(const p of pflicht.filter(x=>x.startsWith("grundlage/quelle/"))){
  const t=lies(p);
  if(rawMuster.some(r=>r.test(t))) fehler.push("R18_CORE_RAW_GAME_WRITE_VERBOTEN:"+p);
}

if(fehler.length){
  console.error("[V5-R18-GUARD] FEHLER\n"+fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R18-GUARD] OK / Learning bleibt bounded, authority-frei und fallback-faehig");
