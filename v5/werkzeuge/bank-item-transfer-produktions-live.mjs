import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import { NodeBankItemTransferLiveTestSequence } from "../grundlage/adapter/persistenz/node-bank-item-transfer-live-test-sequence.mjs";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import {
  beobachteBankItemTransferPreflightReadOnly,
  beobachteBankItemTransferRohReadOnly,
  erstelleBankItemTransferReleaseBeobachter,
  erstelleProduktivenBankItemTransferBeobachter,
  validiereBankItemTransferExplizitenKandidaten,
  warteAufManuellenBankItemTransferMountReadOnly,
  warteAufStabilenBankItemTransferStartAusserhalbBankReadOnly,
} from "./bank-item-transfer-produktions-browser.mjs";
import { ProduktionsCdpBankItemTransferAdapter } from "./bank-item-transfer-produktions-write-browser.mjs";
import { erstelleNodeV5ProduktionsHost } from "./v5-produktions-host-komposition.mjs";
import {
  BANK_ITEM_TRANSFER_ABEND_STUFEN,
  schreibeBankItemTransferAbendEvidence,
  verlangeBankItemTransferAbendVorstufe,
} from "./bank-item-transfer-evening-evidence.mjs";

const V5_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const REPO_ROOT=path.resolve(V5_ROOT,"..");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function mode(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_LIVE_MODUS_UNGUELTIG");return x}
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_LIVE_SOURCE_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:REPO_ROOT,encoding:"utf8",windowsHide:true}).trim())}
function hash(v){return crypto.createHash("sha256").update(String(v)).digest("hex")}
function id(p){return p+"-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex")}
function phase(m,s){process.stdout.write("[V5-BANK-"+m+"-LIVE] "+s+"\n")}
function parse(argv){
 const o={mode:null,cdp:"http://127.0.0.1:9222/",sourceSha:null,preflight:false,testNummer:null,confirm:null};
 const flags=new Set(["--mode","--cdp","--source-sha","--preflight","--test-number","--confirm"]);
 for(let i=0;i<argv.length;i++){const a=argv[i];
  if(a==="--preflight")o.preflight=true;else if(a==="--mode")o.mode=argv[++i];else if(a==="--cdp")o.cdp=argv[++i];else if(a==="--source-sha")o.sourceSha=argv[++i];
  else if(a==="--test-number")o.testNummer=Number(argv[++i]);else if(a==="--confirm"){const x=[];while(i+1<argv.length&&!flags.has(argv[i+1]))x.push(argv[++i]);o.confirm=x.join(" ").replace(/^[\"']|[\"']$/g,"").trim()}
  else throw new Error("BANK_ITEM_TRANSFER_LIVE_CLI_ARGUMENT_UNBEKANNT:"+a);
 }return o;
}
function expectedFromState(state,shadow,m,testNummer){
 const n=state.attempts.length;
 const expectedOrder=[["RETRIEVE",1],["STORE",1],["RETRIEVE",2],["STORE",2]][n];
 if(!expectedOrder||expectedOrder[0]!==m||expectedOrder[1]!==testNummer)throw new Error("BANK_ITEM_TRANSFER_LIVE_REIHENFOLGE_BLOCKIERT:"+(expectedOrder?.join(":")??"FERTIG"));
 if(n===0)return shadow.candidate;
 if(n===1)return state.attempts[0].prestate;
 if(n===2)return state.attempts[0].prestate;
 return state.attempts[1].prestate;
}
function desc(snap){
 const k=snap.expliziterKandidat;if(!k)throw new Error("BANK_ITEM_TRANSFER_LIVE_EXPLIZITER_KANDIDAT_FEHLT");
 return Object.freeze({pack:k.pack,bankSlot:k.bankSlot,inventorySlot:k.inventorySlot,item:Object.freeze({...k.item}),
  packRestFingerprint:k.packRestFingerprint,inventoryRestFingerprint:k.inventoryRestFingerprint,characterGold:k.characterGold,bankGold:k.bankGold});
}
function same(a,b){return a&&b&&a.pack===b.pack&&a.bankSlot===b.bankSlot&&a.inventorySlot===b.inventorySlot&&a.item?.fingerprint===b.item?.fingerprint
 &&a.packRestFingerprint===b.packRestFingerprint&&a.inventoryRestFingerprint===b.inventoryRestFingerprint&&a.characterGold===b.characterGold&&a.bankGold===b.bankGold}
async function sourceHashes(m){
 const low=m.toLowerCase(),paths=[
  "grundlage/vertraege/runtime/bank-"+low+"-mutationsfaehigkeit.json","grundlage/vertraege/runtime/bank-"+low+"-one-shot-authority.json",
  "grundlage/quelle/merchant/bank-item-transfer-settlement.ts","grundlage/quelle/merchant/bank-"+low+"-produktions-transaktion.ts",
  "grundlage/quelle/merchant/bank-"+low+"-admission-gate.ts","werkzeuge/bank-item-transfer-produktions-browser.mjs",
  "werkzeuge/bank-item-transfer-produktions-write-browser.mjs","werkzeuge/bank-item-transfer-produktions-live.mjs",
  "grundlage/adapter/persistenz/node-bank-item-transfer-live-test-sequence.mjs",
 ];const out=[];for(const rel of paths)out.push(hash(await fs.readFile(path.join(V5_ROOT,rel),"utf8")));return Object.freeze([...new Set(out)].sort());
}
async function writeLatest(ds,m,report){await ds.schreibeAtomarDurable("runtime/canary/bank-"+m.toLowerCase()+"-production/latest.json",JSON.stringify(report,null,2)+"\n","bank-"+m.toLowerCase()+"-production-report-"+Date.now())}
function confirm(m,n){return "V5 BANK "+m+" LIVE TEST "+n+" EINMAL AUSFUEHREN"}
function oneShotConfirm(m){return "V5 BANK "+m+" EINMAL AUSFUEHREN"}

export async function fuehreBankItemTransferProduktionslauf({modus,cdpText,sourceSha,preflight=false,testNummer=null,bestaetigungText=null,mountTimeoutMs=90_000,exitTimeoutMs=90_000,hostOptionen={}}={}){
 const m=mode(modus),expected=sha(sourceSha),actual=head();if(expected!==actual)throw new Error("BANK_"+m+"_LIVE_SOURCE_SHA_DRIFT:"+expected+":"+actual);
 if(testNummer!==1&&testNummer!==2)throw new Error("BANK_"+m+"_LIVE_TESTNUMMER_ERFORDERLICH");
 const ds=new NodeProduktionsDateisystem(hostOptionen.dateisystemOptionen??{}),sequence=new NodeBankItemTransferLiveTestSequence(ds);
 const shadow=await verlangeBankItemTransferAbendVorstufe(ds,m,BANK_ITEM_TRANSFER_ABEND_STUFEN.SHADOW,expected);
 const state=await sequence.lade(expected),expectedCandidate=expectedFromState(state,shadow,m,testNummer);
 const cdp=validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/");
 const ctx=await findeAdventureLandKontext(cdp,{requiredGlobalFunction:"call_code_function_f"});let host=null;
 try{
  if(preflight){
   const a=await beobachteBankItemTransferPreflightReadOnly(ctx.session,ctx.contextId);
   const raw1=await beobachteBankItemTransferRohReadOnly(ctx.session,ctx.contextId);
   const x1=validiereBankItemTransferExplizitenKandidaten(raw1,a,Date.now(),m,expectedCandidate),p1=desc(x1);
   await sleep(500);
   const raw2=await beobachteBankItemTransferRohReadOnly(ctx.session,ctx.contextId);
   const x2=validiereBankItemTransferExplizitenKandidaten(raw2,a,Date.now(),m,expectedCandidate),p2=desc(x2);
   if(x1.fingerprint!==x2.fingerprint||!same(p1,p2))throw new Error("BANK_"+m+"_WRITE_PREFLIGHT_PRESTATE_NICHT_STABIL");
   await sequence.pruefeVorTest({sourceSha:expected,modus:m,testNummer,prestate:p2});
   const report=Object.freeze({schemaVersion:1,modus:m,stufe:BANK_ITEM_TRANSFER_ABEND_STUFEN.WRITE_PREFLIGHT,evidenceArt:"V5_BANK_"+m+"_WRITE_PREFLIGHT_NO_GAMEPLAY_WRITE",
    status:"BEREIT",sourceSha:expected,actualHeadSha:actual,testNummer,candidate:p2,gameFingerprint:x2.fingerprint,observations:2,sameIntentRetry:false,
    safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,publicFunctionAufrufe:0,mutatingPublicFunctionCalls:0,authorityAusgestellt:false,leaseErworben:false,journalIntentGeschrieben:false,rawSocketEmit:false})});
   await schreibeBankItemTransferAbendEvidence(ds,m,BANK_ITEM_TRANSFER_ABEND_STUFEN.WRITE_PREFLIGHT,report);await writeLatest(ds,m,report);return report;
  }

  if(bestaetigungText!==confirm(m,testNummer))throw new Error("BANK_"+m+"_LIVE_OPERATOR_BESTAETIGUNG_FEHLT:"+confirm(m,testNummer));
  const wp=await verlangeBankItemTransferAbendVorstufe(ds,m,BANK_ITEM_TRANSFER_ABEND_STUFEN.WRITE_PREFLIGHT,expected);
  if(wp.testNummer!==testNummer)throw new Error("BANK_"+m+"_LIVE_WRITE_PREFLIGHT_TESTNUMMER_DRIFT");
  await sequence.pruefeVorTest({sourceSha:expected,modus:m,testNummer,prestate:wp.candidate});

  const ausgang=await warteAufStabilenBankItemTransferStartAusserhalbBankReadOnly(ctx.session,ctx.contextId,{timeoutMs:mountTimeoutMs,pollMs:500,onPhase:s=>phase(m,s)});
  host=await erstelleNodeV5ProduktionsHost(hostOptionen);const startMs=Date.now(),start=await host.starte(startMs);if(start.zustand!=="LAEUFT")throw new Error("BANK_"+m+"_LIVE_HOST_BLOCKIERT:"+start.grund);
  const current=m==="RETRIEVE"?await host.pruefeBankRetrieveStartBereit():await host.pruefeBankStoreStartBereit(),hs=host.status();
  if(!current.bereit||hs.zustand!=="LAEUFT"||hs.aktivePlanenFaehigkeiten.length!==0||hs.equipEinmalAuthorityOffen||hs.bankDepositEinmalAuthorityOffen||hs.bankWithdrawEinmalAuthorityOffen||hs.bankSwapEinmalAuthorityOffen||hs.bankRetrieveEinmalAuthorityOffen||hs.bankStoreEinmalAuthorityOffen||hs.gameplayAutoritaet!==false||hs.rawWriteAutoritaet!==false||hs.actionAuthority!==false)
   throw new Error("BANK_"+m+"_LIVE_CURRENT_ODER_AUTHORITY_BLOCKIERT");

  const ids=Object.freeze({tx:id("BANK-"+m+"-PROD-TX"),auth:id("BANK-"+m+"-PROD-AUTH"),free:id("BANK-"+m+"-PROD-FREE"),order:id("BANK-"+m+"-PROD-ORDER"),flow:id("BANK-"+m+"-PROD-FLOW")});
  const hashes=await sourceHashes(m);let mount=null,started=false,finalized=false;
  const mountObserver=Object.freeze({async warteAufMount(){
   const x=await warteAufManuellenBankItemTransferMountReadOnly(ctx.session,ctx.contextId,ausgang,m,wp.candidate,{timeoutMs:mountTimeoutMs,pollMs:500,onPhase:s=>phase(m,s)});
   const p=desc(x);if(!same(p,wp.candidate))throw new Error("BANK_"+m+"_LIVE_KANDIDAT_DRIFT");
   await sequence.pruefeVorTest({sourceSha:expected,modus:m,testNummer,prestate:p});
   await sequence.beginneTest({sourceSha:expected,modus:m,testNummer,transaktionsId:ids.tx,prestate:p,zeitMs:Date.now()});started=true;mount=x;return x;
  }});
  const releaseObserver=Object.freeze({async beobachte(token,now){if(!mount)throw new Error("BANK_"+m+"_LIVE_RELEASE_OHNE_MOUNT");return erstelleBankItemTransferReleaseBeobachter(ctx.session,ctx.contextId,mount,m,{timeoutMs:exitTimeoutMs,pollMs:500,onPhase:s=>phase(m,s)}).beobachte(token,now)}});
  const bankObserver=Object.freeze({async beobachte(leaseEpoche,mountEpoche){if(!mount)throw new Error("BANK_"+m+"_LIVE_BEOBACHTER_OHNE_MOUNT");return erstelleProduktivenBankItemTransferBeobachter(ctx.session,ctx.contextId,ausgang,m,wp.candidate).beobachte(leaseEpoche,mountEpoche)}});
  const adapter=new ProduktionsCdpBankItemTransferAdapter(m,ctx.session,ctx.contextId,{vorMoeglichemSend:async()=>{if(!started)throw new Error("BANK_"+m+"_LIVE_TESTLIMIT_NICHT_GESTARTET");await sequence.markiereMoeglichenSend({sourceSha:expected,transaktionsId:ids.tx,zeitMs:Date.now()})}});
  const configFingerprint=hash(JSON.stringify({sourceSha:expected,modus:m,testNummer,maxAdapterCalls:1,maxGameplayWrites:1,account:hash(ausgang.accountId),character:hash(ausgang.charakterName+":"+ausgang.sessionId),server:ausgang.serverRegion+":"+ausgang.serverKennung,hashes}));
  const method=m==="RETRIEVE"?"fuehreBankRetrieveExplizitTransaktion":"fuehreBankStoreExplizitTransaktion";
  let result;
  try{
   result=await host[method]({aktivierungsId:ids.auth,transaktionsId:ids.tx,freigabeId:ids.free,auftragId:ids.order,ablaufId:ids.flow,bestaetigungText:oneShotConfirm(m),ausgang,mountBeobachter:mountObserver,
    releaseBeobachter,adapter,bankBeobachter,wissensSnapshot:Object.freeze({gitCommit:expected,quellenSha256:hashes}),configFingerprint},startMs);
  }catch(e){
   if(started&&!finalized){try{await sequence.finalisiere({sourceSha:expected,transaktionsId:ids.tx,sauberCommitted:false,ergebnis:{status:"FEHLER",fehler:String(e?.message||e).slice(0,240),moeglicherSend:adapter.moeglicherSend},zeitMs:Date.now()});finalized=true}catch{}}
   throw e;
  }
  const after=m==="RETRIEVE"?await host.pruefeBankRetrieveStartBereit():await host.pruefeBankStoreStartBereit(),leases=host.bankLeaseStatus(),finalHost=host.status();
  const clean=result.status==="COMMITTED"&&result.transportArt==="SERVER_ERGEBNIS"&&result.recovery?.art==="COMMITTED"&&result.recovery?.klassifikation==="BESTAETIGT"
   &&result.journalTerminalArt==="COMMIT"&&result.sameIntentErneutSenden===false&&adapter.adapterAufrufe===1&&adapter.gameWrites===1&&adapter.moeglicherSend===true&&after.bereit
   &&leases.every(x=>x.zustand==="RELEASED")&&!finalHost.equipEinmalAuthorityOffen&&!finalHost.bankDepositEinmalAuthorityOffen&&!finalHost.bankWithdrawEinmalAuthorityOffen
   &&!finalHost.bankSwapEinmalAuthorityOffen&&!finalHost.bankRetrieveEinmalAuthorityOffen&&!finalHost.bankStoreEinmalAuthorityOffen;
  if(started&&!finalized){await sequence.finalisiere({sourceSha:expected,transaktionsId:ids.tx,sauberCommitted:clean,ergebnis:{status:result.status,transportArt:result.transportArt,recoveryArt:result.recovery?.art,recoveryKlassifikation:result.recovery?.klassifikation,journalTerminalArt:result.journalTerminalArt,adapterAufrufe:adapter.adapterAufrufe,gameWrites:adapter.gameWrites},zeitMs:Date.now()});finalized=true}
  const stage=testNummer===1?BANK_ITEM_TRANSFER_ABEND_STUFEN.LIVE_TEST_1:BANK_ITEM_TRANSFER_ABEND_STUFEN.LIVE_TEST_2;
  const report=Object.freeze({schemaVersion:1,modus:m,stufe:stage,evidenceArt:"V5_PRODUCTION_BANK_"+m+"_EXPLICIT_ONE_SHOT_LIVE",stand:new Date().toISOString(),status:clean?"BESTANDEN":"NICHT_BESTANDEN",
   sourceSha:expected,actualHeadSha:actual,testNummer,transaktionsId:ids.tx,result,prestate:result.prestate??null,candidate:mount?.expliziterKandidat??null,adapterAufrufe:adapter.adapterAufrufe,gameplayWrites:adapter.gameWrites,
   moeglicherSend:adapter.moeglicherSend,sameIntentRetry:false,leaseStatus:leases.map(x=>Object.freeze({epoche:x.epoche,zustand:x.zustand})),bankStartNachherBereit:after.bereit,
   hostNachher:Object.freeze({zustand:finalHost.zustand,bankRetrieveEinmalAuthorityOffen:finalHost.bankRetrieveEinmalAuthorityOffen,bankStoreEinmalAuthorityOffen:finalHost.bankStoreEinmalAuthorityOffen,
    gameplayAutoritaet:finalHost.gameplayAutoritaet,rawWriteAutoritaet:finalHost.rawWriteAutoritaet,actionAuthority:finalHost.actionAuthority}),
   safety:Object.freeze({maxAdapterCalls:1,maxGameplayWrites:1,rawSocketEmit:false,sameIntentRetry:false,productionWideActivation:false}),
   naechsterSchritt:clean?(m==="RETRIEVE"?"STORE_WRITE_PREFLIGHT_RUECKTRANSFER":"NAECHSTE_RETRIEVE_STUFE_ODER_ROUNDTRIP_FERTIG"):"STOP_BLOCKER_LOKALISIEREN_KEIN_RETRY"});
  await writeLatest(ds,m,report);if(clean)await schreibeBankItemTransferAbendEvidence(ds,m,stage,report);return report;
 }finally{if(host)await host.stoppe("BANK_"+m+"_PRODUKTIONSLAUF_ENDE").catch(()=>{});ctx.session.close()}
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct){const a=parse(process.argv.slice(2));fuehreBankItemTransferProduktionslauf({modus:a.mode,cdpText:a.cdp,sourceSha:a.sourceSha,preflight:a.preflight,testNummer:a.testNummer,bestaetigungText:a.confirm})
 .then(r=>{process.stdout.write(JSON.stringify(r,null,2)+"\n");if(r.status!=="BEREIT"&&r.status!=="BESTANDEN")process.exitCode=2})
 .catch(e=>{process.stderr.write(JSON.stringify({schemaVersion:1,status:"BLOCKIERT",fehler:String(e?.message||e),sameIntentRetry:false,hinweis:"Nicht erneut ausfuehren. Evidence/Testsequenz/Lease zuerst analysieren."},null,2)+"\n");process.exitCode=2})}
