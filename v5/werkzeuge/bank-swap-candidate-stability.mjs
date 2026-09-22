import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import { aktiviereUndVerifiziereBrowserPerformanceTrick } from "./r12-live/performance-trick.mjs";
import { beobachteBankSwapPreflightReadOnly } from "./bank-swap-produktions-browser.mjs";
import {
  BANK_SWAP_ABEND_STUFEN,
  schreibeBankSwapAbendEvidence,
  verlangeBankSwapAbendVorstufe,
} from "./bank-swap-evening-evidence.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_SWAP_STABILITAET_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8",windowsHide:true}).trim())}
function arg(n,f){const i=process.argv.indexOf(n);if(i<0)return f;const v=process.argv[i+1];if(!v||v.startsWith("--"))throw new Error("BANK_SWAP_STABILITAET_ARGUMENT_FEHLT:"+n);return v}
function same(a,b){return a.fingerprint===b.fingerprint&&a.kandidat.pack===b.kandidat.pack&&a.kandidat.a===b.kandidat.a&&a.kandidat.b===b.kandidat.b&&a.kandidat.itemA.fingerprint===b.kandidat.itemA.fingerprint&&a.kandidat.itemB.fingerprint===b.kandidat.itemB.fingerprint}

export async function fuehreBankSwapKandidatenStabilitaet({cdpText,sourceSha,dateisystemOptionen={}}={}){
 const s=sha(sourceSha),h=head();if(s!==h)throw new Error("BANK_SWAP_STABILITAET_SOURCE_SHA_DRIFT:"+s+":"+h);
 const ds=new NodeProduktionsDateisystem(dateisystemOptionen);
 const vor=await verlangeBankSwapAbendVorstufe(ds,BANK_SWAP_ABEND_STUFEN.PREFLIGHT,s);
 const cdp=validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/");
 const live=await findeAdventureLandKontext(cdp,{requiredGlobalFunction:"call_code_function_f"});
 try{
  const performanceTrick=await aktiviereUndVerifiziereBrowserPerformanceTrick(live.session,live.contextId);
   const a=await beobachteBankSwapPreflightReadOnly(live.session,live.contextId);
   await sleep(750);
   const b=await beobachteBankSwapPreflightReadOnly(live.session,live.contextId);
   if(!same(a,b))throw new Error("BANK_SWAP_KANDIDAT_NICHT_STABIL");
   if(vor.candidate.pack!==a.kandidat.pack||vor.candidate.a!==a.kandidat.a||vor.candidate.b!==a.kandidat.b
      ||vor.candidate.itemA.fingerprint!==a.kandidat.itemA.fingerprint
      ||vor.candidate.itemB.fingerprint!==a.kandidat.itemB.fingerprint)throw new Error("BANK_SWAP_KANDIDAT_DRIFT_SEIT_PREFLIGHT");
   const bericht=Object.freeze({schemaVersion:1,stufe:BANK_SWAP_ABEND_STUFEN.STABILITAET,evidenceArt:"V5_BANK_SWAP_CANDIDATE_STABILITY_READ_ONLY",
     status:"BESTANDEN",sourceSha:s,actualHeadSha:h,performanceTrick,candidate:a.kandidat,firstFingerprint:a.fingerprint,secondFingerprint:b.fingerprint,
     observations:2,intervalMs:750,sameIntentRetry:false,safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,bankSwapAufrufe:0,mutatingPublicFunctionCalls:0,rawSocketEmit:false})});
   await schreibeBankSwapAbendEvidence(ds,BANK_SWAP_ABEND_STUFEN.STABILITAET,bericht);return bericht;
 }finally{live.session.close()}
}
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)fuehreBankSwapKandidatenStabilitaet({cdpText:arg("--cdp","http://127.0.0.1:9222/"),sourceSha:arg("--source-sha")})
.then(r=>process.stdout.write(JSON.stringify(r,null,2)+"\n"))
.catch(e=>{process.stderr.write(JSON.stringify({status:"BLOCKIERT",fehler:String(e?.message||e),gameplayWrites:0,bankSwapAufrufe:0,sameIntentRetry:false},null,2)+"\n");process.exitCode=2});
