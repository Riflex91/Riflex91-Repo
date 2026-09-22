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
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_SWAP_BRIDGE_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8",windowsHide:true}).trim())}
function arg(n,f){const i=process.argv.indexOf(n);if(i<0)return f;const v=process.argv[i+1];if(!v||v.startsWith("--"))throw new Error("BANK_SWAP_BRIDGE_ARGUMENT_FEHLT:"+n);return v}
const EXPR=[
"(()=>new Promise((resolve,reject)=>{",
" const r=globalThis; let before=false; try{
  const performanceTrick=await aktiviereUndVerifiziereBrowserPerformanceTrick(live.session,live.contextId);before=r.code_active===true}catch{};",
" if(typeof r.call_code_function_f!=='function')return reject(new Error('BANK_SWAP_BRIDGE_FUNCTION_FEHLT'));",
" let bootstrap=false; if(!before){bootstrap=true; try{r.call_code_function_f('eval','void 0')}catch(e){return reject(e)}}",
" const start=Date.now(); const tick=()=>{try{const frame=r.maincode;const fn=frame&&frame.contentWindow&&frame.contentWindow.bank_swap;",
"   if(typeof fn==='function')return resolve({beforeCodeActive:before,afterCodeActive:r.code_active===true,bootstrapAusgeloest:bootstrap,maincodePresent:!!frame,bankSwapType:typeof fn});",
" }catch{} if(Date.now()-start>5000)return reject(new Error('BANK_SWAP_BRIDGE_BOOTSTRAP_TIMEOUT')); setTimeout(tick,100)}; tick();",
"}))()"
].join("\n");

export async function fuehreBankSwapCodeBridgeProbe({cdpText,sourceSha,dateisystemOptionen={}}={}){
 const s=sha(sourceSha),h=head();if(s!==h)throw new Error("BANK_SWAP_BRIDGE_SOURCE_SHA_DRIFT:"+s+":"+h);
 const ds=new NodeProduktionsDateisystem(dateisystemOptionen);
 const vor=await verlangeBankSwapAbendVorstufe(ds,BANK_SWAP_ABEND_STUFEN.STABILITAET,s);
 const cdp=validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/");
 const live=await findeAdventureLandKontext(cdp,{requiredGlobalFunction:"call_code_function_f"});
 try{
   const pre=await beobachteBankSwapPreflightReadOnly(live.session,live.contextId);
   if(pre.fingerprint!==vor.secondFingerprint)throw new Error("BANK_SWAP_BRIDGE_PRESTATE_DRIFT");
   const probe=await live.session.evaluate(EXPR,live.contextId);
   if(!probe||probe.bankSwapType!=="function"||probe.maincodePresent!==true)throw new Error("BANK_SWAP_BRIDGE_NICHT_BEREIT");
   const post=await beobachteBankSwapPreflightReadOnly(live.session,live.contextId);
   if(post.fingerprint!==pre.fingerprint||post.kandidat.pack!==pre.kandidat.pack||post.kandidat.a!==pre.kandidat.a||post.kandidat.b!==pre.kandidat.b)
     throw new Error("BANK_SWAP_BRIDGE_BOOTSTRAP_GAMESTATE_DRIFT");
   const bericht=Object.freeze({schemaVersion:1,stufe:BANK_SWAP_ABEND_STUFEN.CODE_BRIDGE,evidenceArt:"V5_BANK_SWAP_CODE_BRIDGE_BOOTSTRAP_NO_GAMEPLAY_WRITE",
     status:"BESTANDEN",sourceSha:s,actualHeadSha:h,performanceTrick,probe,candidate:post.kandidat,preFingerprint:pre.fingerprint,postFingerprint:post.fingerprint,
     sameIntentRetry:false,safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,bankSwapAufrufe:0,mutatingPublicFunctionCalls:0,rawSocketEmit:false})});
   await schreibeBankSwapAbendEvidence(ds,BANK_SWAP_ABEND_STUFEN.CODE_BRIDGE,bericht);return bericht;
 }finally{live.session.close()}
}
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)fuehreBankSwapCodeBridgeProbe({cdpText:arg("--cdp","http://127.0.0.1:9222/"),sourceSha:arg("--source-sha")})
.then(r=>process.stdout.write(JSON.stringify(r,null,2)+"\n"))
.catch(e=>{process.stderr.write(JSON.stringify({status:"BLOCKIERT",fehler:String(e?.message||e),gameplayWrites:0,bankSwapAufrufe:0,sameIntentRetry:false},null,2)+"\n");process.exitCode=2});
