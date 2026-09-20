import fs from "node:fs";

const fehler=[];
const lies=pfad=>fs.readFileSync(pfad,"utf8");
const pflicht=[
  "grundlage/quelle/welt/map-graph.ts",
  "grundlage/quelle/welt/spawn-discovery.ts",
  "grundlage/quelle/welt/event-quest-drift.ts",
  "grundlage/quelle/welt/content-quarantaene.ts",
  "grundlage/quelle/welt/server-hop-policy.ts",
  "grundlage/quelle/welt/world-plan-ledger.ts",
  "grundlage/tests/r17-event-quest-drift.test.mjs",
  "grundlage/tests/r17-content-discovery.test.mjs",
  "grundlage/tests/r17-server-hop.test.mjs",
  "dokumentation/P2-WORLD-AUTONOMY.md",
];
for(const p of pflicht) if(!fs.existsSync(p)) fehler.push("PFLICHTARTEFAKT_FEHLT:"+p);

const drift=lies("grundlage/quelle/welt/event-quest-drift.ts");
for(const m of ["REPLAN_ERFORDERLICH","BLOCKIERT_STALE","BLOCKIERT_UNBEKANNT","actionErlaubt:false","pinneWeltPlan","pruefeWeltDrift"]){
  if(!drift.includes(m)) fehler.push("DRIFT_MARKER_FEHLT:"+m);
}

const ledger=lies("grundlage/quelle/welt/world-plan-ledger.ts");
for(const m of ["REVALIDIERUNG_ERFORDERLICH","WELT_PLAN_COMMIT_OHNE_REVALIDIERUNG","actionAuthority:false","importiereNachRestart"]){
  if(!ledger.includes(m)) fehler.push("WORLD_PLAN_MARKER_FEHLT:"+m);
}

const quarantine=lies("grundlage/quelle/welt/content-quarantaene.ts");
for(const m of ["QUARANTAENE","darfAutomatisieren","revalidiere","importiereNachRestart"]){
  if(!quarantine.includes(m)) fehler.push("QUARANTAENE_MARKER_FEHLT:"+m);
}

const hop=lies("grundlage/quelle/welt/server-hop-policy.ts");
for(const m of ["MODUS_UNBEKANNT","MODUS_GESPERRT","FATIGUE","actionAuthority:false","hardcoreErlaubt","pvpErlaubt"]){
  if(!hop.includes(m)) fehler.push("SERVER_HOP_MARKER_FEHLT:"+m);
}

const map=lies("grundlage/quelle/welt/map-graph.ts");
for(const m of ["planningEvidence:true","executionAuthority:false","MAPGRAPH_KANTE_ZIEL_UNBEKANNT"]){
  if(!map.includes(m)) fehler.push("MAPGRAPH_MARKER_FEHLT:"+m);
}

const discovery=lies("grundlage/quelle/welt/spawn-discovery.ts");
for(const m of ["combatAuthority:false","DISCOVERY_DEFINITION_LIVE_DRIFT","DISCOVERY_EVIDENCE_STALE"]){
  if(!discovery.includes(m)) fehler.push("DISCOVERY_MARKER_FEHLT:"+m);
}

const p2=lies("dokumentation/P2-WORLD-AUTONOMY.md");
if(!p2.includes("**Status:** GESCHLOSSEN")) fehler.push("P2_NICHT_GESCHLOSSEN");

const rawMuster=[
  /\bsmart_move\s*\(/,/\bmove\s*\(/,/\bxmove\s*\(/,/\battack\s*\(/,
  /\buse_skill\s*\(/,/\brespawn\s*\(/,/\bjoin\s*\(/,/\bchange_server\s*\(/,
  /\bsend_cm\s*\(/,/\.emit\s*\(/,
];
for(const p of pflicht.filter(x=>x.startsWith("grundlage/quelle/"))){
  const t=lies(p);
  if(rawMuster.some(r=>r.test(t))) fehler.push("R17_CORE_RAW_GAME_WRITE_VERBOTEN:"+p);
}

if(fehler.length){
  console.error("[V5-R17-GUARD] FEHLER\n"+fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R17-GUARD] OK / World Autonomy bleibt no-write und fail-closed");
