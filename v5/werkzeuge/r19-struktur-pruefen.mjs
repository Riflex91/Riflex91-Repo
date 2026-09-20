import fs from "node:fs";

const fehler=t=>{throw new Error("[V5-R19-STRUKTUR] "+t);};
const lies=p=>JSON.parse(fs.readFileSync(p,"utf8"));

const gates=lies("roadmap/gates.json");
const ready=lies("bereitschaft/laufzeit-bereitschaft.json");
const r18=gates.phases?.find(x=>x.id==="R18");
const r19=gates.phases?.find(x=>x.id==="R19");

if(r18?.status!=="DONE") fehler("R19 verlangt R18 DONE.");
if(!r19||r19.status!=="IN_PROGRESS") fehler("Vor manueller Live-Ladder muss R19 IN_PROGRESS bleiben.");
if(gates.currentPhase!=="R19") fehler("R19 IN_PROGRESS verlangt currentPhase=R19.");
if(ready.status==="FREIGEGEBEN") fehler("Vor kompletter R19-Ladder darf breite Runtime nicht freigegeben sein.");

for(const p of [
  "grundlage/quelle/zertifizierung/evidence-kette.ts",
  "grundlage/quelle/zertifizierung/ladder.ts",
  "grundlage/quelle/zertifizierung/shadow-bewertung.ts",
  "grundlage/tests/r19-evidence-ladder.test.mjs",
  "grundlage/tests/r19-shadow-certification.test.mjs",
  "werkzeuge/r19-ui-release-gate.mjs",
  "werkzeuge/r19-statische-guards.mjs",
  "werkzeuge/r19-controlled-live-test-gui.js",
  "werkzeuge/r19-controlled-live-test-paket.js",
  "werkzeuge/r19-test-gui-paket-bauen.mjs",
  "werkzeuge/tests/r19-test-gui.test.mjs",
]){
  if(!fs.existsSync(p)) fehler("R19 Pflichtartefakt fehlt: "+p);
}

const erwartet=new Set(["V5-ANF-OPS-005","V5-ANF-OPS-006","V5-ANF-UI-008"]);
const req=lies("anforderungen/anforderungen.json").anforderungen.filter(x=>x.phase==="R19"&&x.prioritaet==="MUSS");
if(req.length!==3||req.some(x=>!erwartet.has(x.kennung))) fehler("R19 MUSS-Anforderungsmenge ungueltig.");
if(req.some(x=>!["OFFEN","R19_NACHGEWIESEN"].includes(x.status))) fehler("R19 Anforderungsstatus ungueltig.");

const trace=lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x=>x.phase==="R19");
if(trace.length!==3||trace.some(x=>!erwartet.has(x.anforderungKennung))) fehler("R19 Traceability-Menge ungueltig.");

if(fs.existsSync("roadmap/r19-automatik-evidence.json")){
  const auto=lies("roadmap/r19-automatik-evidence.json");
  if(auto.phase!=="R19"
      ||auto.status!=="BIS_SHADOW_BESTANDEN"
      ||auto.runtimeGate!=="GESPERRT"
      ||auto.naechsteStufe!=="CONTROLLED_LIVE"
      ||auto.manuellerPcTestErforderlich!==true
      ||auto.stufen?.SIMULATOR_REPLAY!=="BESTANDEN"
      ||auto.stufen?.FAULT_SUITE!=="BESTANDEN"
      ||auto.stufen?.SHADOW!=="BESTANDEN") {
    fehler("R19 Automatik-Evidence ungueltig.");
  }
  const ops5=req.find(x=>x.kennung==="V5-ANF-OPS-005");
  const ui8=req.find(x=>x.kennung==="V5-ANF-UI-008");
  const ops6=req.find(x=>x.kennung==="V5-ANF-OPS-006");
  if(ops5?.status!=="R19_NACHGEWIESEN"||ui8?.status!=="R19_NACHGEWIESEN") {
    fehler("Automatik-Evidence verlangt OPS-005 und UI-008 nachgewiesen.");
  }
  if(ops6?.status!=="OFFEN") fehler("OPS-006 muss bis zur kompletten Live-Ladder OFFEN bleiben.");
}

console.log("[V5-R19-STRUKTUR] OK / R19 bleibt vor Controlled Live IN_PROGRESS / Runtime:",ready.status);
