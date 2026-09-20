import fs from "node:fs";

const fehler=t=>{throw new Error("[V5-R17-STRUKTUR] "+t);};
const lies=p=>JSON.parse(fs.readFileSync(p,"utf8"));

const gates=lies("roadmap/gates.json");
const ready=lies("bereitschaft/laufzeit-bereitschaft.json");
const r16=gates.phases?.find(x=>x.id==="R16");
const r17=gates.phases?.find(x=>x.id==="R17");
if(r16?.status!=="DONE") fehler("R17 verlangt R16 DONE.");
if(!r17||!["IN_PROGRESS","DONE"].includes(r17.status)) fehler("R17 muss IN_PROGRESS oder DONE sein.");
if(r17.status==="IN_PROGRESS"&&gates.currentPhase!=="R17") fehler("R17 IN_PROGRESS verlangt currentPhase=R17.");
if(ready.status==="FREIGEGEBEN") fehler("R17 darf breite Runtime nicht freigeben.");

for(const p of [
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
  "werkzeuge/r17-statische-guards.mjs",
]){
  if(!fs.existsSync(p)) fehler("Pflichtartefakt fehlt: "+p);
}
const p2=fs.readFileSync("dokumentation/P2-WORLD-AUTONOMY.md","utf8");
if(!p2.includes("**Status:** GESCHLOSSEN")) fehler("P2 muss geschlossen sein.");

const req=lies("anforderungen/anforderungen.json").anforderungen.filter(x=>x.phase==="R17"&&x.prioritaet==="MUSS");
if(req.length!==1||req[0]?.kennung!=="V5-ANF-WORLD-004") fehler("R17 MUSS-Anforderungsmenge ungueltig.");
if(!["OFFEN","R17_NACHGEWIESEN"].includes(req[0].status)) fehler("R17 Anforderungsstatus ungueltig.");

const trace=lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x=>x.phase==="R17");
if(trace.length!==1||trace[0]?.anforderungKennung!=="V5-ANF-WORLD-004") fehler("R17 Traceability ungueltig.");

const fitness=lies("fitness/fitness-regeln.json").regeln.filter(x=>x.phase==="R17");
if(fitness.length!==0) fehler("R17 besitzt keine eigenen ratifizierten Fitnessregeln.");

if(r17.status==="DONE"){
  const r18=gates.phases?.find(x=>x.id==="R18");
  if(!(gates.currentPhase==="R18"&&r18?.status==="IN_PROGRESS")
      && !(["R19"].includes(gates.currentPhase)&&r18?.status==="DONE")){
    fehler("R17 DONE verlangt R18 IN_PROGRESS oder spaeteren formal abgeschlossenen Uebergang.");
  }
  const cov=lies("grundlage/vertraege/r17/world-autonomy-abdeckung.json");
  if(cov.phase!=="R17"||cov.status!=="TECHNISCH_BESTANDEN"||cov.runtimeGate!=="GESPERRT"
      ||cov.gameplayAutoritaet!==false||cov.rawWriteAutoritaet!==false
      ||cov.anforderungen?.length!==1||cov.anforderungen[0]?.status!=="ERFUELLT") fehler("R17 Abdeckung ungueltig.");
  const done=lies("roadmap/r17-abschluss.json");
  if(done.phase!=="R17"||done.status!=="DONE"||done.runtimeGate!=="GESPERRT") fehler("R17 Abschlussmanifest ungueltig.");
  if(req[0].status!=="R17_NACHGEWIESEN"||trace[0]?.vollstaendig!==true) fehler("R17 DONE verlangt 1/1 Nachweis und Traceability.");
}
console.log("[V5-R17-STRUKTUR] OK / R17:",r17.status,"/ Runtime-Gate:",ready.status);
