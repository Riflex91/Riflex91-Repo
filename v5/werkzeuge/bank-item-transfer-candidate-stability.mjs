import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import { aktiviereUndVerifiziereBrowserPerformanceTrick } from "./r12-live/performance-trick.mjs";
import { beobachteBankItemTransferPreflightReadOnly } from "./bank-item-transfer-produktions-browser.mjs";
import {
  BANK_ITEM_TRANSFER_ABEND_STUFEN,
  schreibeBankItemTransferAbendEvidence,
  verlangeBankItemTransferAbendVorstufe,
} from "./bank-item-transfer-evening-evidence.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function m(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_STABILITAET_MODUS_UNGUELTIG");return x}
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_STABILITAET_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8",windowsHide:true}).trim())}
function arg(n,f){const i=process.argv.indexOf(n);if(i<0)return f;const v=process.argv[i+1];if(!v||v.startsWith("--"))throw new Error("BANK_ITEM_TRANSFER_STABILITAET_ARGUMENT_FEHLT:"+n);return v}
function cand(o,mode){return mode==="RETRIEVE"?o.retrieveKandidat:o.storeKandidat}
function same(a,b,mode){const x=cand(a,mode),y=cand(b,mode);return a.fingerprint===b.fingerprint&&x&&y&&x.pack===y.pack&&x.bankSlot===y.bankSlot&&x.inventorySlot===y.inventorySlot&&x.item.fingerprint===y.item.fingerprint}
export async function fuehreBankItemTransferKandidatenStabilitaet({modus,cdpText,sourceSha,dateisystemOptionen={}}={}){
 const mode=m(modus),s=sha(sourceSha),h=head();if(s!==h)throw new Error("BANK_ITEM_TRANSFER_STABILITAET_SOURCE_SHA_DRIFT:"+s+":"+h);
 const ds=new NodeProduktionsDateisystem(dateisystemOptionen);
 const vor=await verlangeBankItemTransferAbendVorstufe(ds,mode,BANK_ITEM_TRANSFER_ABEND_STUFEN.PREFLIGHT,s);
 const live=await findeAdventureLandKontext(validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/"),{requiredGlobalFunction:"call_code_function_f"});
 try{
  const performanceTrick=await aktiviereUndVerifiziereBrowserPerformanceTrick(live.session,live.contextId);
  const a=await beobachteBankItemTransferPreflightReadOnly(live.session,live.contextId);await sleep(750);const b=await beobachteBankItemTransferPreflightReadOnly(live.session,live.contextId);
  if(!same(a,b,mode))throw new Error("BANK_"+mode+"_KANDIDAT_NICHT_STABIL");
  const x=cand(a,mode),v=vor.candidate;
  if(!v||v.pack!==x.pack||v.bankSlot!==x.bankSlot||v.inventorySlot!==x.inventorySlot||v.item.fingerprint!==x.item.fingerprint)throw new Error("BANK_"+mode+"_KANDIDAT_DRIFT_SEIT_PREFLIGHT");
  const bericht=Object.freeze({schemaVersion:1,modus:mode,stufe:BANK_ITEM_TRANSFER_ABEND_STUFEN.STABILITAET,evidenceArt:"V5_BANK_"+mode+"_CANDIDATE_STABILITY_READ_ONLY",
   status:"BESTANDEN",sourceSha:s,actualHeadSha:h,performanceTrick,candidate:x,firstFingerprint:a.fingerprint,secondFingerprint:b.fingerprint,observations:2,intervalMs:750,sameIntentRetry:false,
   safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,publicFunctionAufrufe:0,mutatingPublicFunctionCalls:0,rawSocketEmit:false})});
  await schreibeBankItemTransferAbendEvidence(ds,mode,BANK_ITEM_TRANSFER_ABEND_STUFEN.STABILITAET,bericht);return bericht;
 }finally{live.session.close()}
}
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)fuehreBankItemTransferKandidatenStabilitaet({modus:arg("--mode"),cdpText:arg("--cdp","http://127.0.0.1:9222/"),sourceSha:arg("--source-sha")})
.then(r=>process.stdout.write(JSON.stringify(r,null,2)+"\n"))
.catch(e=>{process.stderr.write(JSON.stringify({schemaVersion:1,status:"BLOCKIERT",fehler:String(e?.message||e),gameplayWrites:0,publicFunctionAufrufe:0,sameIntentRetry:false},null,2)+"\n");process.exitCode=2});
