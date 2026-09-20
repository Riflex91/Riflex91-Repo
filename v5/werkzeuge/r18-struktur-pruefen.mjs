import fs from "node:fs";

const fehler=t=>{throw new Error("[V5-R18-STRUKTUR] "+t);};
const lies=p=>JSON.parse(fs.readFileSync(p,"utf8"));

const gates=lies("roadmap/gates.json");
const ready=lies("bereitschaft/laufzeit-bereitschaft.json");
const r17=gates.phases?.find(x=>x.id==="R17");
const r18=gates.phases?.find(x=>x.id==="R18");
if(r17?.status!=="DONE") fehler("R18 verlangt R17 DONE.");
if(!r18||!["IN_PROGRESS","DONE"].includes(r18.status)) fehler("R18 muss IN_PROGRESS oder DONE sein.");
if(r18.status==="IN_PROGRESS"&&gates.currentPhase!=="R18") fehler("R18 IN_PROGRESS verlangt currentPhase=R18.");
if(ready.status==="FREIGEGEBEN"){
  if(!fs.existsSync("roadmap/gesamtfreigabe.json")) fehler("R18 darf die Runtime nicht selbst freigeben; finale Betreiber-Gesamtfreigabe-Evidence fehlt.");
  const gesamtfreigabe=lies("roadmap/gesamtfreigabe.json");
  if(gesamtfreigabe.kennung!=="V5_GESAMTFREIGABE"
      ||gesamtfreigabe.status!=="ERTEILT"
      ||gesamtfreigabe.bestaetigungQuelle!=="BETREIBER_INTERAKTIV"
      ||gesamtfreigabe.bestaetigungText!=="V5 GESAMTFREIGABE ERTEILEN"
      ||ready.gesamtfreigabe!=="ERTEILT"
      ||ready.breiteRuntimeFreigabe!==true){
    fehler("R18 darf die Runtime nicht selbst freigeben; nur die spaetere explizite Post-R19-Gesamtfreigabe ist zulaessig.");
  }
}

for(const p of [
  "grundlage/quelle/lernen/deterministischer-fallback.ts",
  "grundlage/quelle/lernen/lern-admission.ts",
  "grundlage/quelle/lernen/datenbasis-pin.ts",
  "grundlage/quelle/lernen/modell-liga.ts",
  "grundlage/tests/r18-fallback-ranking.test.mjs",
  "grundlage/tests/r18-admission-evidence.test.mjs",
  "grundlage/tests/r18-modell-liga.test.mjs",
  "werkzeuge/r18-statische-guards.mjs",
]){
  if(!fs.existsSync(p)) fehler("Pflichtartefakt fehlt: "+p);
}

const erwartet=new Set([
  "V5-ANF-SICH-006",
  "V5-ANF-LERN-001",
  "V5-ANF-LERN-002",
  "V5-ANF-LERN-003",
  "V5-ANF-LERN-004",
]);
const req=lies("anforderungen/anforderungen.json").anforderungen.filter(x=>x.phase==="R18"&&x.prioritaet==="MUSS");
if(req.length!==erwartet.size||req.some(x=>!erwartet.has(x.kennung))) fehler("R18 MUSS-Anforderungsmenge ungueltig.");
if(req.some(x=>!["OFFEN","R18_NACHGEWIESEN"].includes(x.status))) fehler("R18 Anforderungsstatus ungueltig.");

const trace=lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x=>x.phase==="R18");
if(trace.length!==erwartet.size||trace.some(x=>!erwartet.has(x.anforderungKennung))) fehler("R18 Traceability ungueltig.");

const fitness=lies("fitness/fitness-regeln.json").regeln.filter(x=>x.phase==="R18");
if(fitness.length!==0) fehler("R18 besitzt keine eigenen ratifizierten Fitnessregeln.");

if(r18.status==="DONE"){
  const r19=gates.phases?.find(x=>x.id==="R19");
  if(!(gates.currentPhase==="R19"&&["IN_PROGRESS","DONE"].includes(r19?.status))) fehler("R18 DONE verlangt R19 IN_PROGRESS oder terminal DONE.");
  const cov=lies("grundlage/vertraege/r18/learning-abdeckung.json");
  if(cov.phase!=="R18"||cov.status!=="TECHNISCH_BESTANDEN"||cov.runtimeGate!=="GESPERRT"
      ||cov.gameplayAutoritaet!==false||cov.rawWriteAutoritaet!==false
      ||cov.anforderungen?.length!==5||cov.anforderungen.some(x=>x.status!=="ERFUELLT")) fehler("R18 Abdeckung ungueltig.");
  const done=lies("roadmap/r18-abschluss.json");
  if(done.phase!=="R18"||done.status!=="DONE"||done.runtimeGate!=="GESPERRT") fehler("R18 Abschlussmanifest ungueltig.");
  if(req.some(x=>x.status!=="R18_NACHGEWIESEN")||trace.some(x=>x.vollstaendig!==true)) fehler("R18 DONE verlangt 5/5 Nachweise und Traceability.");
}
console.log("[V5-R18-STRUKTUR] OK / R18:",r18.status,"/ Runtime-Gate:",ready.status);
