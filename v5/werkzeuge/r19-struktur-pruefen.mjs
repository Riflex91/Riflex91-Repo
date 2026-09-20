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
  "werkzeuge/tests/r19-canary-test-gui.test.mjs",
  "werkzeuge/tests/r19-soak-1h-test-gui.test.mjs",
  "werkzeuge/r19-soak-1h-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-1h-test-paket.js",
  "werkzeuge/r19-soak-1h-test-gui.js",
  "werkzeuge/r19-canary-test-paket-bauen.mjs",
  "werkzeuge/r19-canary-test-paket.js",
  "werkzeuge/r19-canary-test-gui.js",
]){
  if(!fs.existsSync(p)) fehler("R19 Pflichtartefakt fehlt: "+p);
}

const erwartet=new Set(["V5-ANF-OPS-005","V5-ANF-OPS-006","V5-ANF-UI-008"]);
const req=lies("anforderungen/anforderungen.json").anforderungen.filter(x=>x.phase==="R19"&&x.prioritaet==="MUSS");
if(req.length!==3||req.some(x=>!erwartet.has(x.kennung))) fehler("R19 MUSS-Anforderungsmenge ungueltig.");
if(req.some(x=>!["OFFEN","R19_NACHGEWIESEN"].includes(x.status))) fehler("R19 Anforderungsstatus ungueltig.");

const trace=lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x=>x.phase==="R19");
if(trace.length!==3||trace.some(x=>!erwartet.has(x.anforderungKennung))) fehler("R19 Traceability-Menge ungueltig.");

const liveStatusRang=Object.freeze({
  BIS_CONTROLLED_LIVE_BESTANDEN:1,
  BIS_CANARY_BESTANDEN:2,
  BIS_SOAK_1H_BESTANDEN:3,
  BIS_SOAK_24H_BESTANDEN:4,
  BIS_SOAK_72H_BESTANDEN:5,
  BIS_SOAK_7D_BESTANDEN:6,
});
const ops6=req.find(x=>x.kennung==="V5-ANF-OPS-006");
const aktuellerLiveRang=liveStatusRang[ops6?.r19LiveStatus]??0;

if(fs.existsSync("roadmap/r19-canary-evidence.json")){
  const canary=lies("roadmap/r19-canary-evidence.json");
  if(canary.phase!=="R19"
      ||canary.status!=="BESTANDEN"
      ||canary.zertifizierungsStufe!=="CANARY"
      ||canary.gameWrites!==1
      ||canary.unerwarteteGameWrites!==0
      ||canary.sameIntentRetry!==false
      ||canary.manuelleBestaetigung!==true
      ||canary.learningEinfluss?.gameplayAutoritaet!==false
      ||canary.learningEinfluss?.authorityAenderungErlaubt!==false
      ||canary.learningEinfluss?.safetyLockerungErlaubt!==false
      ||canary.learningEinfluss?.maximalerAbsoluterScoreDelta>25
      ||canary.postcondition?.klassifikation!=="BESTAETIGT"
      ||canary.ladder?.naechsteStufe!=="SOAK_1H") {
    fehler("R19 Canary-Evidence ungueltig.");
  }
  if(ops6?.status!=="OFFEN"||aktuellerLiveRang<2) {
    fehler("Canary verlangt OPS-006 weiterhin OFFEN mit mindestens Canary-Teilstatus.");
  }
  if(ready.r19NaechsteStufe!=="SOAK_1H"||ready.r19ManuellerPcTestErforderlich!==true) {
    fehler("Readiness muss nach Canary auf manuellen SOAK_1H zeigen.");
  }
}

if(fs.existsSync("roadmap/r19-controlled-live-evidence.json")){
  const live=lies("roadmap/r19-controlled-live-evidence.json");
  if(live.phase!=="R19"
      ||live.status!=="BESTANDEN"
      ||live.zertifizierungsStufe!=="CONTROLLED_LIVE"
      ||live.gameWrites!==1
      ||live.unerwarteteGameWrites!==0
      ||live.sameIntentRetry!==false
      ||live.manuelleBestaetigung!==true
      ||live.postcondition?.klassifikation!=="BESTAETIGT"
      ||live.ladder?.naechsteStufe!=="CANARY") {
    fehler("R19 Controlled-Live-Evidence ungueltig.");
  }
  if(ops6?.status!=="OFFEN"||aktuellerLiveRang<1) {
    fehler("Controlled Live verlangt OPS-006 weiterhin OFFEN mit mindestens Controlled-Live-Teilstatus.");
  }
  if(!fs.existsSync("roadmap/r19-canary-evidence.json")
      && (ready.r19NaechsteStufe!=="CANARY"||ready.r19ManuellerPcTestErforderlich!==true)) {
    fehler("Readiness muss unmittelbar nach Controlled Live auf manuellen Canary zeigen.");
  }
}

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
  if(ops5?.status!=="R19_NACHGEWIESEN"||ui8?.status!=="R19_NACHGEWIESEN") {
    fehler("Automatik-Evidence verlangt OPS-005 und UI-008 nachgewiesen.");
  }
  if(ops6?.status!=="OFFEN") fehler("OPS-006 muss bis zur kompletten Live-Ladder OFFEN bleiben.");
}

console.log("[V5-R19-STRUKTUR] OK / R19 Ladder IN_PROGRESS / Runtime:",ready.status,"/ naechste Stufe:",ready.r19NaechsteStufe);
