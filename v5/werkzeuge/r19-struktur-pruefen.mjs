import fs from "node:fs";

const fehler=t=>{throw new Error("[V5-R19-STRUKTUR] "+t);};
const lies=p=>JSON.parse(fs.readFileSync(p,"utf8"));

const gates=lies("roadmap/gates.json");
const ready=lies("bereitschaft/laufzeit-bereitschaft.json");
const r18=gates.phases?.find(x=>x.id==="R18");
const r19=gates.phases?.find(x=>x.id==="R19");

if(r18?.status!=="DONE") fehler("R19 verlangt R18 DONE.");
if(!r19||!["IN_PROGRESS","DONE"].includes(r19.status)) fehler("R19 muss IN_PROGRESS oder terminal DONE sein.");
if(gates.currentPhase!=="R19") fehler("R19 verlangt currentPhase=R19.");
if(ready.status==="FREIGEGEBEN"&&r19.status!=="DONE") fehler("Breite Runtime darf nicht vor R19 DONE freigegeben sein.");

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
  "werkzeuge/tests/r19-soak-5m-test-gui.test.mjs",
  "werkzeuge/r19-soak-5m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-5m-test-paket.js",
  "werkzeuge/r19-soak-5m-test-gui.js",
  "roadmap/r19-soak-5m-evidence.json",
  "werkzeuge/tests/r19-soak-10m-test-gui.test.mjs",
  "werkzeuge/r19-soak-10m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-10m-test-paket.js",
  "werkzeuge/r19-soak-10m-test-gui.js",
  "roadmap/r19-soak-10m-evidence.json",
  "werkzeuge/tests/r19-soak-15m-test-gui.test.mjs",
  "werkzeuge/r19-soak-15m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-15m-test-paket.js",
  "werkzeuge/r19-soak-15m-test-gui.js",
  "werkzeuge/r19-canary-test-paket-bauen.mjs",
  "werkzeuge/r19-canary-test-paket.js",
  "werkzeuge/r19-canary-test-gui.js",
  "roadmap/r19-soak-zeitprofil.json",
  "roadmap/testzeit-standard.json",
]){
  if(!fs.existsSync(p)) fehler("R19 Pflichtartefakt fehlt: "+p);
}

const finalExistiert=fs.existsSync("roadmap/r19-soak-15m-evidence.json");
if(finalExistiert!==fs.existsSync("roadmap/r19-abschluss.json")) {
  fehler("Finale SOAK_15M Evidence und R19 Abschlussmanifest muessen gemeinsam vorliegen.");
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
  BIS_SOAK_5M_BESTANDEN:3,
  BIS_SOAK_10M_BESTANDEN:4,
  BIS_SOAK_15M_BESTANDEN:5,
});
const ops6=req.find(x=>x.kennung==="V5-ANF-OPS-006");
const zeitprofil=lies("roadmap/r19-soak-zeitprofil.json");
const testzeit=lies("roadmap/testzeit-standard.json");
const erwarteteSoaks=[
  ["SOAK_5M",300000,20],
  ["SOAK_10M",600000,20],
  ["SOAK_15M",900000,30],
];
if(zeitprofil.profilKennung!=="R19_ACCELERATED_SOAK_V2"
    ||zeitprofil.finaleStufe!=="SOAK_15M"
    ||zeitprofil.stufen?.length!==3
    ||erwarteteSoaks.some(([stufe,dauer,min],i)=>
      zeitprofil.stufen[i]?.stufe!==stufe
      ||zeitprofil.stufen[i]?.dauerMs!==dauer
      ||zeitprofil.stufen[i]?.minimaleSamples!==min)
    ||ops6?.r19Zeitprofil!=="R19_ACCELERATED_SOAK_V2") {
  fehler("R19 beschleunigtes Soak-Zeitprofil ungueltig.");
}
if(testzeit.kennung!=="V5_TESTZEIT_STANDARD_V1"
    ||testzeit.status!=="RATIFIZIERT"
    ||testzeit.funktion?.testdauerMs!==300000
    ||testzeit.integrationRelease?.testdauerMs!==900000
    ||testzeit.breiteRuntimeFreigabe!==false) {
  fehler("V5 Testzeitstandard 5m Funktion / 15m Integration-Release ungueltig.");
}

const erwarteterOps6Status=finalExistiert?"R19_NACHGEWIESEN":"OFFEN";
if(ops6?.status!==erwarteterOps6Status) fehler("OPS-006 Status passt nicht zum Ladderstand.");
const aktuellerLiveRang=liveStatusRang[ops6?.r19LiveStatus]??0;

function pruefeSoak(datei, stufe, vorherigeStufe, naechsteStufe){
  const e=lies(datei);
  const profil=zeitprofil.stufen?.find(x=>x.stufe===stufe);
  if(e.phase!=="R19"
      ||e.status!=="BESTANDEN"
      ||e.zertifizierungsStufe!==stufe
      ||e.breiteRuntimeFreigabe!==false
      ||e.gameplayWritesDurchHarness!==0
      ||e.unerwarteteGameWritesImHarness!==0
      ||e.evidenceKetteGueltig!==true
      ||e.sampleGaps!==0
      ||e.recorderDrops!==0
      ||e.dauerMs<(profil?.dauerMs??Infinity)
      ||e.sampleAnzahl<(profil?.minimaleSamples??Infinity)
      ||e.runtime?.alternativeRuntimeSamples!==0
      ||e.runtime?.toteSamples!==0
      ||e.runtime?.performanceTrickFehler!==0
      ||e.ressourcen?.heapMetrikUnterstuetzt!==true
      ||e.ressourcen?.storageEstimateUnterstuetzt!==true
      ||e.ressourcen?.browserPersistenzFehler!==0
      ||e.ressourcen?.minFreieBytes<(e.grenzen?.minimaleFreieBytes??Infinity)
      ||e.ressourcen?.maxBrowserPersistenzRoundtripMs>(e.grenzen?.maximalerBrowserPersistenzRoundtripMs??-Infinity)
      ||e.ressourcen?.heapWachstumBytes>(e.grenzen?.maximalesHeapWachstumBytes??-Infinity)
      ||e.blocker?.length!==0
      ||e.ladder?.vorherigeStufe!==vorherigeStufe
      ||e.ladder?.naechsteStufe!==naechsteStufe) {
    fehler("R19 "+stufe+" Evidence ungueltig.");
  }
  return e;
}

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
      ||canary.ladder?.naechsteStufe!=="SOAK_5M") {
    fehler("R19 Canary-Evidence ungueltig.");
  }
  if(aktuellerLiveRang<2) fehler("Canary verlangt mindestens Canary-Livestatus.");
  if(!fs.existsSync("roadmap/r19-soak-5m-evidence.json")
      && (ready.r19NaechsteStufe!=="SOAK_5M"||ready.r19ManuellerPcTestErforderlich!==true)) {
    fehler("Readiness muss unmittelbar nach Canary auf manuellen SOAK_5M zeigen.");
  }
}

pruefeSoak("roadmap/r19-soak-5m-evidence.json","SOAK_5M","CANARY","SOAK_10M");
if(aktuellerLiveRang<3) fehler("SOAK_5M verlangt mindestens SOAK_5M-Livestatus.");
if(!fs.existsSync("roadmap/r19-soak-10m-evidence.json")
    && (ready.r19NaechsteStufe!=="SOAK_10M"||ready.r19ManuellerPcTestErforderlich!==true)) {
  fehler("Readiness muss unmittelbar nach SOAK_5M auf manuellen SOAK_10M zeigen.");
}

pruefeSoak("roadmap/r19-soak-10m-evidence.json","SOAK_10M","SOAK_5M","SOAK_15M");
if(aktuellerLiveRang<4) fehler("SOAK_10M verlangt mindestens SOAK_10M-Livestatus.");
if(!finalExistiert
    && (ready.r19NaechsteStufe!=="SOAK_15M"||ready.r19ManuellerPcTestErforderlich!==true)) {
  fehler("Readiness muss nach SOAK_10M auf manuellen SOAK_15M zeigen.");
}

if(finalExistiert){
  const soak15=pruefeSoak("roadmap/r19-soak-15m-evidence.json","SOAK_15M","SOAK_10M",null);
  if(soak15.ladder?.finaleStufe!==true) fehler("SOAK_15M muss als finale Stufe markiert sein.");
  if(aktuellerLiveRang<5) fehler("SOAK_15M verlangt finalen Livestatus.");
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
  if(aktuellerLiveRang<1) fehler("Controlled Live verlangt mindestens Controlled-Live-Livestatus.");
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
}

if(r19.status==="DONE"){
  if(!finalExistiert) fehler("R19 DONE verlangt finale SOAK_15M Evidence.");
  if(req.some(x=>x.status!=="R19_NACHGEWIESEN")) fehler("R19 DONE verlangt 3/3 nachgewiesene Anforderungen.");
  if(trace.some(x=>x.vollstaendig!==true)) fehler("R19 DONE verlangt 3/3 vollstaendige Traceability.");
  if(ready.r19Status!=="ABGESCHLOSSEN"
      ||ready.r19NaechsteStufe!==null
      ||ready.r19ManuellerPcTestErforderlich!==false
      ||ready.r19AnforderungenNachgewiesen!==3
      ||ready.r19AnforderungenGesamt!==3
      ||ready.r19LiveStatus!=="BIS_SOAK_15M_BESTANDEN"
      ||ready.r19LadderVollstaendig!==true
      ||ready.r19Soak15mEvidence!=="v5/roadmap/r19-soak-15m-evidence.json") {
    fehler("R19 DONE Readiness-Metadaten unvollstaendig.");
  }
  const done=lies("roadmap/r19-abschluss.json");
  if(done.phase!=="R19"
      ||done.status!=="DONE"
      ||done.runtimeGate!=="GESPERRT"
      ||done.breiteRuntimeFreigabe!==false
      ||done.ladder?.status!=="VOLLSTAENDIG_BESTANDEN"
      ||done.ladder?.finaleStufe!=="SOAK_15M"
      ||done.ladder?.naechsteStufe!==null
      ||done.anforderungen?.technischNachgewiesen!==3
      ||done.traceability?.vollstaendig!==3
      ||done.gesamtfreigabe!=="SEPARAT_AUSSTEHEND") {
    fehler("R19 Abschlussmanifest ungueltig.");
  }
  if(ready.status==="FREIGEGEBEN") fehler("R19-Abschluss darf die separate Gesamtfreigabe nicht automatisch setzen.");
} else if(finalExistiert) {
  fehler("Finale SOAK_15M Evidence verlangt terminales R19 DONE.");
}

console.log("[V5-R19-STRUKTUR] OK / R19:",r19.status,"/ Runtime:",ready.status,"/ naechste Stufe:",ready.r19NaechsteStufe);
