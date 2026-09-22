import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import { NodeBankSwapLiveTestLimit } from "../grundlage/adapter/persistenz/node-bank-swap-live-test-limit.mjs";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import {
  erstelleBankSwapReleaseBeobachter,
  erstelleProduktivenBankSwapBeobachter,
  warteAufManuellenBankSwapMountReadOnly,
  warteAufStabilenBankSwapStartAusserhalbBankReadOnly,
} from "./bank-swap-produktions-browser.mjs";
import { ProduktionsCdpBankSwapAdapter } from "./bank-swap-produktions-write-browser.mjs";
import { erstelleNodeV5ProduktionsHost } from "./v5-produktions-host-komposition.mjs";
import {
  BANK_SWAP_ABEND_STUFEN,
  schreibeBankSwapAbendEvidence,
  verlangeBankSwapAbendVorstufe,
} from "./bank-swap-evening-evidence.mjs";

export const BANK_SWAP_LIVE_TEST_1_BESTAETIGUNG =
  "V5 BANK SWAP LIVE TEST 1 EINMAL AUSFUEHREN";
export const BANK_SWAP_LIVE_TEST_2_BESTAETIGUNG =
  "V5 BANK SWAP LIVE TEST 2 EINMAL AUSFUEHREN";
export const BANK_SWAP_PRODUCTION_EVIDENCE_ART =
  "V5_PRODUCTION_BANK_SWAP_TWO_SLOT_ONE_SHOT_LIVE";

const V5_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const REPO_ROOT=path.resolve(V5_ROOT,"..");
function hash(v){return crypto.createHash("sha256").update(String(v)).digest("hex")}
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_SWAP_LIVE_SOURCE_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:REPO_ROOT,encoding:"utf8",windowsHide:true}).trim())}
function id(p){return p+"-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex")}
function phase(s){process.stdout.write("[V5-BANK-SWAP-LIVE] "+s+"\n")}
function parse(argv){
 const o={cdp:"http://127.0.0.1:9222/",sourceSha:null,preflight:false,testNummer:null,confirm:null};
 const flags=new Set(["--cdp","--source-sha","--preflight","--test-number","--confirm"]);
 for(let i=0;i<argv.length;i++){
  const a=argv[i];
  if(a==="--preflight")o.preflight=true;
  else if(a==="--cdp")o.cdp=argv[++i];
  else if(a==="--source-sha")o.sourceSha=argv[++i];
  else if(a==="--test-number")o.testNummer=Number(argv[++i]);
  else if(a==="--confirm"){const x=[];while(i+1<argv.length&&!flags.has(argv[i+1]))x.push(argv[++i]);o.confirm=x.join(" ").replace(/^["']|["']$/g,"").trim()}
  else throw new Error("BANK_SWAP_LIVE_CLI_ARGUMENT_UNBEKANNT:"+a);
 }
 return o;
}
async function sourceHashes(){
 const paths=[
  "grundlage/vertraege/runtime/bank-swap-production-candidate.json",
  "grundlage/vertraege/runtime/bank-swap-one-shot-authority.json",
  "grundlage/quelle/merchant/bank-swap-settlement.ts",
  "grundlage/quelle/merchant/bank-swap-produktions-transaktion.ts",
  "grundlage/quelle/merchant/bank-swap-admission-gate.ts",
  "werkzeuge/bank-swap-produktions-browser.mjs",
  "werkzeuge/bank-swap-produktions-write-browser.mjs",
  "werkzeuge/bank-swap-write-preflight.mjs",
  "grundlage/adapter/persistenz/node-bank-swap-live-test-limit.mjs",
 ];
 const out=[];for(const rel of paths)out.push(hash(await fs.readFile(path.join(V5_ROOT,rel),"utf8")));
 return Object.freeze([...new Set(out)].sort());
}
function prestateAusMount(m){
 return Object.freeze({
  pack:m.kandidat.pack,a:m.kandidat.a,b:m.kandidat.b,
  itemA:Object.freeze({...m.kandidat.itemA}),
  itemB:Object.freeze({...m.kandidat.itemB}),
  packRestFingerprint:m.kandidat.packRestFingerprint,
  inventoryFingerprint:m.inventoryFingerprint,
  characterGold:m.characterGold,bankGold:m.bankGold,
 });
}
function kandidatPasst(a,b){
 return a&&b&&a.pack===b.pack&&a.a===b.a&&a.b===b.b
  &&a.itemA?.fingerprint===b.itemA?.fingerprint
  &&a.itemB?.fingerprint===b.itemB?.fingerprint;
}
async function writeLatest(ds,report){
 await ds.schreibeAtomarDurable(
  "runtime/canary/bank-swap-production/latest.json",
  JSON.stringify(report,null,2)+"\n",
  "bank-swap-production-report-"+Date.now(),
 );
}

export async function fuehreBankSwapProduktionslauf({
 cdpText,sourceSha,preflight=false,testNummer=null,bestaetigungText=null,
 mountTimeoutMs=90_000,exitTimeoutMs=90_000,hostOptionen={},
}={}){
 const expected=sha(sourceSha),actual=head();
 if(expected!==actual)throw new Error("BANK_SWAP_LIVE_SOURCE_SHA_DRIFT:"+expected+":"+actual);
 const ds=new NodeProduktionsDateisystem(hostOptionen.dateisystemOptionen??{});
 const limit=new NodeBankSwapLiveTestLimit(ds);
 const shadow=await verlangeBankSwapAbendVorstufe(ds,BANK_SWAP_ABEND_STUFEN.SHADOW,expected);
 const cdp=validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/");
 const browser=await findeAdventureLandKontext(cdp,{requiredGlobalFunction:"call_code_function_f"});
 let host=null;
 try{
  const ausgang=await warteAufStabilenBankSwapStartAusserhalbBankReadOnly(browser.session,browser.contextId,{
   timeoutMs:mountTimeoutMs,pollMs:500,onPhase:phase,
  });
  host=await erstelleNodeV5ProduktionsHost(hostOptionen);
  const startMs=Date.now();
  const start=await host.starte(startMs);
  if(start.zustand!=="LAEUFT")throw new Error("BANK_SWAP_LIVE_HOST_BLOCKIERT:"+start.grund);
  const current=await host.pruefeBankSwapStartBereit();
  const hs=host.status();
  const commonReady=current.bereit&&hs.zustand==="LAEUFT"&&hs.aktivePlanenFaehigkeiten.length===0
    &&!hs.equipEinmalAuthorityOffen&&!hs.bankDepositEinmalAuthorityOffen
    &&!hs.bankWithdrawEinmalAuthorityOffen&&!hs.bankSwapEinmalAuthorityOffen
    &&hs.gameplayAutoritaet===false&&hs.rawWriteAutoritaet===false&&hs.actionAuthority===false;
  if(!commonReady)throw new Error("BANK_SWAP_LIVE_CURRENT_ODER_AUTHORITY_BLOCKIERT");

  if(preflight){
   const state=await limit.lade(expected);
   if(state.attempts.length!==0)throw new Error("BANK_SWAP_WRITE_PREFLIGHT_TESTBUDGET_BEREITS_BENUTZT");
   const report=Object.freeze({
    schemaVersion:1,stufe:BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT,
    evidenceArt:"V5_BANK_SWAP_WRITE_PREFLIGHT_NO_GAMEPLAY_WRITE",status:"BEREIT",
    sourceSha:expected,actualHeadSha:actual,candidate:shadow.candidate,
    accountBindungSha256:hash(ausgang.accountId),charakterBindungSha256:hash(ausgang.charakterName+":"+ausgang.sessionId),
    server:Object.freeze({region:ausgang.serverRegion,kennung:ausgang.serverKennung}),
    startAusserhalbBank:true,testBudgetVerbraucht:0,sameIntentRetry:false,
    safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,bankSwapAufrufe:0,mutatingPublicFunctionCalls:0,
      authorityAusgestellt:false,leaseErworben:false,journalIntentGeschrieben:false,rawSocketEmit:false}),
   });
   await schreibeBankSwapAbendEvidence(ds,BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT,report);
   await writeLatest(ds,report);return report;
  }

  if(testNummer!==1&&testNummer!==2)throw new Error("BANK_SWAP_LIVE_TESTNUMMER_ERFORDERLICH");
  const confirm=testNummer===1?BANK_SWAP_LIVE_TEST_1_BESTAETIGUNG:BANK_SWAP_LIVE_TEST_2_BESTAETIGUNG;
  if(bestaetigungText!==confirm)throw new Error("BANK_SWAP_LIVE_OPERATOR_BESTAETIGUNG_FEHLT:"+confirm);
  const writePreflight=await verlangeBankSwapAbendVorstufe(
   ds,BANK_SWAP_ABEND_STUFEN.WRITE_PREFLIGHT,expected
  );
  if(testNummer===2){
   await verlangeBankSwapAbendVorstufe(ds,BANK_SWAP_ABEND_STUFEN.LIVE_TEST_1,expected,{noWrite:false});
  }

  const ids=Object.freeze({
   tx:id("BANK-SWAP-PROD-TX"),auth:id("BANK-SWAP-PROD-AUTH"),free:id("BANK-SWAP-PROD-FREE"),
   order:id("BANK-SWAP-PROD-ORDER"),flow:id("BANK-SWAP-PROD-FLOW"),
  });
  const hashes=await sourceHashes();
  let mount=null,limitStarted=false,limitFinal=false;
  const mountObserver=Object.freeze({async warteAufMount(){
   const m=await warteAufManuellenBankSwapMountReadOnly(browser.session,browser.contextId,ausgang,{
    timeoutMs:mountTimeoutMs,pollMs:500,onPhase:phase,
   });
   if(testNummer===1&&!kandidatPasst(m.kandidat,writePreflight.candidate)){
    throw new Error("BANK_SWAP_LIVE_TEST_1_KANDIDAT_DRIFT");
   }
   const ps=prestateAusMount(m);
   await limit.pruefeVorTest({sourceSha:expected,testNummer,prestate:ps});
   await limit.beginneTest({sourceSha:expected,testNummer,transaktionsId:ids.tx,prestate:ps,zeitMs:Date.now()});
   limitStarted=true;mount=m;return m;
  }});
  const releaseObserver=Object.freeze({async beobachte(token,now){
   if(mount===null)throw new Error("BANK_SWAP_LIVE_RELEASE_OHNE_MOUNT");
   return erstelleBankSwapReleaseBeobachter(browser.session,browser.contextId,mount,{
    timeoutMs:exitTimeoutMs,pollMs:500,onPhase:phase,exitPhaseText:"BANK_SWAP_SETTLEMENT_BEOBACHTET_BANK_MANUELL_VERLASSEN",
   }).beobachte(token,now);
  }});
  const bankObserver=Object.freeze({async beobachte(leaseEpoche,mountEpoche){
   if(mount===null)throw new Error("BANK_SWAP_LIVE_BEOBACHTER_OHNE_MOUNT");
   return erstelleProduktivenBankSwapBeobachter(
    browser.session,browser.contextId,ausgang,
    Object.freeze({pack:mount.kandidat.pack,a:mount.kandidat.a,b:mount.kandidat.b}),
   ).beobachte(leaseEpoche,mountEpoche);
  }});
  const adapter=new ProduktionsCdpBankSwapAdapter(browser.session,browser.contextId,{
   vorMoeglichemSend:async()=>{
    if(!limitStarted)throw new Error("BANK_SWAP_LIVE_TESTLIMIT_NICHT_GESTARTET");
    await limit.markiereMoeglichenSend({sourceSha:expected,transaktionsId:ids.tx,zeitMs:Date.now()});
   },
  });
  const configFingerprint=hash(JSON.stringify({
   sourceSha:expected,testNummer,maxAdapterCalls:1,maxGameplayWrites:1,
   action:"AL-ACTION-BANK-SWAP",recovery:"AL-RECOVERY-BANK-SWAP",verifier:"AL-VERIFIER-BANK-SWAP",
   account:hash(ausgang.accountId),character:hash(ausgang.charakterName+":"+ausgang.sessionId),
   server:ausgang.serverRegion+":"+ausgang.serverKennung,hashes,
  }));

  let result;
  try{
   result=await host.fuehreBankSwapZweiSlotTransaktion({
    aktivierungsId:ids.auth,transaktionsId:ids.tx,freigabeId:ids.free,auftragId:ids.order,ablaufId:ids.flow,
    bestaetigungText:"V5 BANK SWAP EINMAL AUSFUEHREN",ausgang,mountBeobachter:mountObserver,
    releaseBeobachter:releaseObserver,adapter,bankBeobachter:bankObserver,
    wissensSnapshot:Object.freeze({gitCommit:expected,quellenSha256:hashes}),configFingerprint,
   },startMs);
  }catch(e){
   if(limitStarted&&!limitFinal){
    try{await limit.finalisiere({sourceSha:expected,transaktionsId:ids.tx,sauberCommitted:false,
     ergebnis:{status:"FEHLER",fehler:String(e?.message||e).slice(0,240),moeglicherSend:adapter.moeglicherSend},zeitMs:Date.now()});limitFinal=true}catch{}
   }
   throw e;
  }

  const after=await host.pruefeBankSwapStartBereit();
  const leases=host.bankLeaseStatus();
  const finalHost=host.status();
  const clean=result.status==="COMMITTED"&&result.transportArt==="SERVER_ERGEBNIS"
   &&result.recovery?.art==="COMMITTED"&&result.recovery?.klassifikation==="BESTAETIGT"
   &&result.journalTerminalArt==="COMMIT"&&result.sameIntentErneutSenden===false
   &&adapter.adapterAufrufe===1&&adapter.gameWrites===1&&adapter.moeglicherSend===true
   &&after.bereit&&leases.every(x=>x.zustand==="RELEASED")
   &&!finalHost.bankSwapEinmalAuthorityOffen&&!finalHost.bankDepositEinmalAuthorityOffen
   &&!finalHost.bankWithdrawEinmalAuthorityOffen&&!finalHost.equipEinmalAuthorityOffen;
  if(limitStarted&&!limitFinal){
   await limit.finalisiere({sourceSha:expected,transaktionsId:ids.tx,sauberCommitted:clean,
    ergebnis:{status:result.status,transportArt:result.transportArt,recoveryArt:result.recovery?.art,
     recoveryKlassifikation:result.recovery?.klassifikation,journalTerminalArt:result.journalTerminalArt,
     adapterAufrufe:adapter.adapterAufrufe,gameWrites:adapter.gameWrites},zeitMs:Date.now()});
   limitFinal=true;
  }
  const stage=testNummer===1?BANK_SWAP_ABEND_STUFEN.LIVE_TEST_1:BANK_SWAP_ABEND_STUFEN.LIVE_TEST_2;
  const report=Object.freeze({
   schemaVersion:1,stufe:stage,evidenceArt:BANK_SWAP_PRODUCTION_EVIDENCE_ART,
   stand:new Date().toISOString(),status:clean?"BESTANDEN":"NICHT_BESTANDEN",
   sourceSha:expected,actualHeadSha:actual,testNummer,transaktionsId:ids.tx,
   result,prestate:result.prestate??null,candidate:mount?.kandidat??null,
   adapterAufrufe:adapter.adapterAufrufe,gameplayWrites:adapter.gameWrites,
   moeglicherSend:adapter.moeglicherSend,sameIntentRetry:false,
   leaseStatus:leases.map(x=>Object.freeze({epoche:x.epoche,zustand:x.zustand})),
   bankStartNachherBereit:after.bereit,
   hostNachher:Object.freeze({zustand:finalHost.zustand,bankSwapEinmalAuthorityOffen:finalHost.bankSwapEinmalAuthorityOffen,
    gameplayAutoritaet:finalHost.gameplayAutoritaet,rawWriteAutoritaet:finalHost.rawWriteAutoritaet,actionAuthority:finalHost.actionAuthority}),
   safety:Object.freeze({maxAdapterCalls:1,maxGameplayWrites:1,rawSocketEmit:false,sameIntentRetry:false,
    productionWideActivation:false}),
   naechsterSchritt:clean
    ?(testNummer===1?"LIVE_TEST_2_DARF_NUR_ALS_NEUER_REVERSE_INTENT_EXPLIZIT_GESTARTET_WERDEN":"ZWEI_TEST_LIMIT_ERREICHT")
    :"STOP_BLOCKER_LOKALISIEREN_KEIN_RETRY",
  });
  await writeLatest(ds,report);
  if(clean)await schreibeBankSwapAbendEvidence(ds,stage,report);
  return report;
 }finally{
  if(host!==null)await host.stoppe("BANK_SWAP_PRODUKTIONSLAUF_ENDE").catch(()=>{});
  browser.session.close();
 }
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct){
 const a=parse(process.argv.slice(2));
 fuehreBankSwapProduktionslauf({cdpText:a.cdp,sourceSha:a.sourceSha,preflight:a.preflight,
  testNummer:a.testNummer,bestaetigungText:a.confirm})
 .then(r=>{process.stdout.write(JSON.stringify(r,null,2)+"\n");if(r.status!=="BEREIT"&&r.status!=="BESTANDEN")process.exitCode=2})
 .catch(e=>{process.stderr.write(JSON.stringify({schemaVersion:1,status:"BLOCKIERT",fehler:String(e?.message||e),
   sameIntentRetry:false,hinweis:"Nicht erneut ausfuehren. Evidence/Testlimit/Lease zuerst analysieren."},null,2)+"\n");process.exitCode=2});
}
