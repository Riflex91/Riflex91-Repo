import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import {
  BANK_ITEM_TRANSFER_REAL_SHADOW_GAMEPLAY_WRITES,
  beobachteBankItemTransferRohReadOnly,
  erstelleBankItemTransferReleaseBeobachter,
  validiereBankItemTransferAusgangsBeobachtung,
  warteAufManuellenBankItemTransferMountReadOnly,
} from "./bank-item-transfer-produktions-browser.mjs";
import { erstelleNodeV5ProduktionsHost } from "./v5-produktions-host-komposition.mjs";
import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  BANK_ITEM_TRANSFER_ABEND_STUFEN,
  schreibeBankItemTransferAbendEvidence,
  verlangeBankItemTransferAbendVorstufe,
} from "./bank-item-transfer-evening-evidence.mjs";

const V5=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),ROOT=path.resolve(V5,"..");
function m(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_SHADOW_MODUS_UNGUELTIG");return x}
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_SHADOW_SHA_UNGUELTIG");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8",windowsHide:true}).trim())}
export function leseBankItemTransferShadowArgument(n,f=null,argv=process.argv){
 const i=argv.indexOf(n);if(i<0)return f;
 const teile=[];for(let j=i+1;j<argv.length&&!String(argv[j]).startsWith("--");j+=1)teile.push(String(argv[j]));
 if(teile.length===0)throw new Error("BANK_ITEM_TRANSFER_SHADOW_ARGUMENT_FEHLT:"+n);
 return teile.join(" ");
}
function id(p){return p+"-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex")}
function hash(v){return crypto.createHash("sha256").update(String(v)).digest("hex")}
function cand(s,mode){return mode==="RETRIEVE"?s.retrieveKandidat:s.storeKandidat}
function confirm(mode){return "V5 BANK "+mode+" SHADOW OHNE WRITE AUSFUEHREN"}
function phase(mode,text){process.stdout.write("[V5-BANK-"+mode+"-SHADOW] "+text+"\n")}
async function report(root,mode,b){const dir=path.join(root,"runtime","canary","bank-"+mode.toLowerCase()+"-real-shadow");await fs.mkdir(dir,{recursive:true});const z=path.join(dir,"latest.json"),t=z+".tmp-"+process.pid+"-"+Date.now();await fs.writeFile(t,JSON.stringify(b,null,2)+"\n","utf8");await fs.rename(t,z);return z}
export async function fuehreBankItemTransferRealBrowserShadow({modus,cdpText,sourceSha,bestaetigungText,mountTimeoutMs=90_000,exitTimeoutMs=90_000,hostOptionen={}}={}){
 const mode=m(modus),s=sha(sourceSha),h=head();if(s!==h)throw new Error("BANK_ITEM_TRANSFER_SHADOW_SOURCE_SHA_DRIFT:"+s+":"+h);if(bestaetigungText!==confirm(mode))throw new Error("BANK_"+mode+"_SHADOW_OPERATOR_BESTAETIGUNG_FEHLT");
 const ds=new NodeProduktionsDateisystem(hostOptionen.dateisystemOptionen??{});const bridge=await verlangeBankItemTransferAbendVorstufe(ds,mode,BANK_ITEM_TRANSFER_ABEND_STUFEN.CODE_BRIDGE,s);
 const live=await findeAdventureLandKontext(validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/"));let host=null;
 try{
  const ausgang=validiereBankItemTransferAusgangsBeobachtung(await beobachteBankItemTransferRohReadOnly(live.session,live.contextId));
  host=await erstelleNodeV5ProduktionsHost(hostOptionen);const startMs=Date.now(),start=await host.starte(startMs);if(start.zustand!=="LAEUFT")throw new Error("BANK_"+mode+"_SHADOW_HOST_BLOCKIERT:"+start.grund);
  const ready=mode==="RETRIEVE"?await host.pruefeBankRetrieveStartBereit():await host.pruefeBankStoreStartBereit();if(!ready.bereit)throw new Error("BANK_"+mode+"_SHADOW_START_EVIDENCE_BLOCKIERT");
  const tx=id("BANK-"+mode+"-SHADOW-TX"),wf=id("BANK-"+mode+"-SHADOW-WF");let mount=null;
  const mountObs=Object.freeze({async warteAufMount(){mount=await warteAufManuellenBankItemTransferMountReadOnly(live.session,live.contextId,ausgang,mode,bridge.candidate,{timeoutMs:mountTimeoutMs,pollMs:500,onPhase:t=>phase(mode,t)});return mount}});
  const release=Object.freeze({async beobachte(token,jetztMs){if(!mount)throw new Error("BANK_"+mode+"_SHADOW_RELEASE_OHNE_MOUNT");return erstelleBankItemTransferReleaseBeobachter(live.session,live.contextId,mount,mode,{timeoutMs:exitTimeoutMs,pollMs:500,onPhase:t=>phase(mode,t)}).beobachte(token,jetztMs)}});
  const method=mode==="RETRIEVE"?"fuehreBankRetrieveRealShadow":"fuehreBankStoreRealShadow";
  if(typeof host[method]!=="function")throw new Error("BANK_"+mode+"_SHADOW_HOST_METHODE_FEHLT");
  const result=await host[method]({aktivierungsId:id("BANK-"+mode+"-SHADOW-AUTH"),transaktionsId:tx,freigabeId:id("BANK-"+mode+"-SHADOW-FREE"),auftragId:id("BANK-"+mode+"-SHADOW-ORDER"),ablaufId:wf,
    shadowBestaetigungText:bestaetigungText,ausgang,mountBeobachter:mountObs,releaseBeobachter:release},startMs);
  const after=mode==="RETRIEVE"?await host.pruefeBankRetrieveStartBereit():await host.pruefeBankStoreStartBereit(),leases=host.bankLeaseStatus(),status=host.status(),k=cand(mount,mode);
  if(!mount||!k||k.pack!==bridge.candidate.pack||k.bankSlot!==bridge.candidate.bankSlot||k.inventorySlot!==bridge.candidate.inventorySlot||k.item.fingerprint!==bridge.candidate.item.fingerprint)throw new Error("BANK_"+mode+"_SHADOW_KANDIDAT_DRIFT");
  const ok=result.status==="ADMISSION_BESTANDEN_KEIN_SEND"&&result.gameplayWrites===0&&result.adapterAufrufe===0&&result.browserGameplayWrites===0&&after.bereit&&leases.every(x=>x.zustand==="RELEASED");
  const b=Object.freeze({schemaVersion:1,modus:mode,stufe:BANK_ITEM_TRANSFER_ABEND_STUFEN.SHADOW,evidenceArt:"V5_BANK_"+mode+"_REAL_BROWSER_SHADOW_NO_WRITE",stand:new Date().toISOString(),status:ok?"BESTANDEN":"NICHT_BESTANDEN",
   sourceSha:s,actualHeadSha:h,transaktionsId:tx,accountBindungSha256:hash(ausgang.accountId),charakterBindungSha256:hash(ausgang.charakterName+":"+ausgang.sessionId),server:Object.freeze({region:ausgang.serverRegion,kennung:ausgang.serverKennung}),
   startAusserhalbBank:true,manualMountTransition:true,manualExitRequired:true,admissionStatus:result.status,journalTerminalArt:result.journalTerminalArt,sendBoundaryState:result.sendBoundaryState,sameIntentRetry:false,
   browserGameplayWrites:BANK_ITEM_TRANSFER_REAL_SHADOW_GAMEPLAY_WRITES,hostGameplayWrites:result.hostGameplayWrites,gameplayWrites:result.gameplayWrites,adapterAufrufe:result.adapterAufrufe,candidate:k,bankStartNachherBereit:after.bereit,
   leaseStatus:leases.map(x=>Object.freeze({epoche:x.epoche,zustand:x.zustand})),hostNachher:Object.freeze({zustand:status.zustand,gameplayAutoritaet:status.gameplayAutoritaet,rawWriteAutoritaet:status.rawWriteAutoritaet,actionAuthority:status.actionAuthority}),
   safety:Object.freeze({gameplayWrites:0,adapterAufrufe:0,publicFunctionAufrufe:0,mutatingPublicFunctionCalls:0,rawSocketEmit:false}),rawWriteBypass:false});
  const reportPfad=await report(host.produktionsWurzel(),mode,b);if(ok)await schreibeBankItemTransferAbendEvidence(ds,mode,BANK_ITEM_TRANSFER_ABEND_STUFEN.SHADOW,b);return Object.freeze({...b,reportPfad});
 }finally{if(host)await host.stoppe("BANK_"+mode+"_REAL_SHADOW_ENDE").catch(()=>{});live.session.close()}
}
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct){const mode=m(leseBankItemTransferShadowArgument("--mode"));fuehreBankItemTransferRealBrowserShadow({modus:mode,cdpText:leseBankItemTransferShadowArgument("--cdp","http://127.0.0.1:9222/"),sourceSha:leseBankItemTransferShadowArgument("--source-sha"),bestaetigungText:leseBankItemTransferShadowArgument("--confirm")})
.then(r=>{process.stdout.write(JSON.stringify(r,null,2)+"\n");if(r.status!=="BESTANDEN")process.exitCode=2})
.catch(e=>{process.stderr.write(JSON.stringify({schemaVersion:1,status:"BLOCKIERT",fehler:String(e?.message||e),gameplayWrites:0,adapterAufrufe:0,publicFunctionAufrufe:0,sameIntentRetry:false,hinweis:"Nicht automatisch erneut ausfuehren; bei offener Lease zuerst Evidence/Reconciliation pruefen."},null,2)+"\n");process.exitCode=1})}
