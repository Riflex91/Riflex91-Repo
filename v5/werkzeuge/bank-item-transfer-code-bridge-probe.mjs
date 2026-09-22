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
function m(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_BRIDGE_MODUS_UNGUELTIG");return x}
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_BRIDGE_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8",windowsHide:true}).trim())}
function arg(n,f){const i=process.argv.indexOf(n);if(i<0)return f;const v=process.argv[i+1];if(!v||v.startsWith("--"))throw new Error("BANK_ITEM_TRANSFER_BRIDGE_ARGUMENT_FEHLT:"+n);return v}
function cand(o,mode){return mode==="RETRIEVE"?o.retrieveKandidat:o.storeKandidat}
function expr(mode){const fn=mode==="RETRIEVE"?"bank_retrieve":"bank_store";return [
"(()=>new Promise((resolve,reject)=>{",
" const r=globalThis; let before=false; try{before=r.code_active===true}catch{};",
" if(typeof r.call_code_function_f!=='function')return reject(new Error('BANK_ITEM_TRANSFER_BRIDGE_FUNCTION_FEHLT'));",
" let bootstrap=false; if(!before){bootstrap=true; try{r.call_code_function_f('eval','void 0')}catch(e){return reject(e)}}",
" const start=Date.now(); const tick=()=>{try{const frame=r.maincode;const f=frame&&frame.contentWindow&&frame.contentWindow['"+fn+"'];",
"   if(typeof f==='function')return resolve({beforeCodeActive:before,afterCodeActive:r.code_active===true,bootstrapAusgeloest:bootstrap,maincodePresent:!!frame,publicFunction:'"+fn+"',publicFunctionType:typeof f});",
" }catch{} if(Date.now()-start>5000)return reject(new Error('BANK_ITEM_TRANSFER_BRIDGE_BOOTSTRAP_TIMEOUT')); setTimeout(tick,100)}; tick();",
"}))()"
].join("\n")}
export async function fuehreBankItemTransferCodeBridgeProbe({modus,cdpText,sourceSha,dateisystemOptionen={}}={}){
 const mode=m(modus),s=sha(sourceSha),h=head();if(s!==h)throw new Error("BANK_ITEM_TRANSFER_BRIDGE_SOURCE_SHA_DRIFT:"+s+":"+h);
 const ds=new NodeProduktionsDateisystem(dateisystemOptionen);
 const vor=await verlangeBankItemTransferAbendVorstufe(ds,mode,BANK_ITEM_TRANSFER_ABEND_STUFEN.STABILITAET,s);
 const live=await findeAdventureLandKontext(validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/"),{requiredGlobalFunction:"call_code_function_f"});
 try{
  const performanceTrick=await aktiviereUndVerifiziereBrowserPerformanceTrick(live.session,live.contextId);
  const pre=await beobachteBankItemTransferPreflightReadOnly(live.session,live.contextId);const x=cand(pre,mode);
  if(pre.fingerprint!==vor.secondFingerprint||!x||x.pack!==vor.candidate.pack||x.bankSlot!==vor.candidate.bankSlot||x.inventorySlot!==vor.candidate.inventorySlot||x.item.fingerprint!==vor.candidate.item.fingerprint)throw new Error("BANK_"+mode+"_BRIDGE_PRESTATE_DRIFT");
  const probe=await live.session.evaluate(expr(mode),live.contextId);
  if(!probe||probe.publicFunctionType!=="function"||probe.maincodePresent!==true)throw new Error("BANK_"+mode+"_BRIDGE_NICHT_BEREIT");
  const post=await beobachteBankItemTransferPreflightReadOnly(live.session,live.contextId);const y=cand(post,mode);
  if(post.fingerprint!==pre.fingerprint||!y||y.pack!==x.pack||y.bankSlot!==x.bankSlot||y.inventorySlot!==x.inventorySlot||y.item.fingerprint!==x.item.fingerprint)throw new Error("BANK_"+mode+"_BRIDGE_BOOTSTRAP_GAMESTATE_DRIFT");
  const bericht=Object.freeze({schemaVersion:1,modus:mode,stufe:BANK_ITEM_TRANSFER_ABEND_STUFEN.CODE_BRIDGE,evidenceArt:"V5_BANK_"+mode+"_CODE_BRIDGE_BOOTSTRAP_NO_GAMEPLAY_WRITE",
   status:"BESTANDEN",sourceSha:s,actualHeadSha:h,performanceTrick,probe,candidate:y,preFingerprint:pre.fingerprint,postFingerprint:post.fingerprint,sameIntentRetry:false,
   safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,publicFunctionAufrufe:0,mutatingPublicFunctionCalls:0,rawSocketEmit:false})});
  await schreibeBankItemTransferAbendEvidence(ds,mode,BANK_ITEM_TRANSFER_ABEND_STUFEN.CODE_BRIDGE,bericht);return bericht;
 }finally{live.session.close()}
}
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)fuehreBankItemTransferCodeBridgeProbe({modus:arg("--mode"),cdpText:arg("--cdp","http://127.0.0.1:9222/"),sourceSha:arg("--source-sha")})
.then(r=>process.stdout.write(JSON.stringify(r,null,2)+"\n"))
.catch(e=>{process.stderr.write(JSON.stringify({schemaVersion:1,status:"BLOCKIERT",fehler:String(e?.message||e),gameplayWrites:0,publicFunctionAufrufe:0,sameIntentRetry:false},null,2)+"\n");process.exitCode=2});
