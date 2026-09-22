import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pruefeBankItemTransferVorAuthorityCurrentFence } from "../erzeugt/index.js";
import { findeAdventureLandKontext, validiereLoopbackCdp } from "./r12-live/cdp.mjs";
import {
 BANK_ITEM_TRANSFER_PREFLIGHT_GAMEPLAY_WRITES,
 BANK_ITEM_TRANSFER_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,
 beobachteBankItemTransferPreflightReadOnly,
} from "./bank-item-transfer-produktions-browser.mjs";
import { erstelleNodeV5ProduktionsHost } from "./v5-produktions-host-komposition.mjs";
import { NodeProduktionsDateisystem } from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  BANK_ITEM_TRANSFER_ABEND_STUFEN,
  schreibeBankItemTransferAbendEvidence,
} from "./bank-item-transfer-evening-evidence.mjs";

const V5=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),ROOT=path.resolve(V5,"..");
function h(v){return crypto.createHash("sha256").update(String(v)).digest("hex")}
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_PREFLIGHT_SHA_ERFORDERLICH");return v.toLowerCase()}
function head(){return sha(execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8",windowsHide:true}).trim())}
function arg(n,f){const i=process.argv.indexOf(n);if(i<0)return f;const v=process.argv[i+1];if(!v||v.startsWith("--"))throw new Error("BANK_ITEM_TRANSFER_PREFLIGHT_ARGUMENT_FEHLT:"+n);return v}
function mode(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_PREFLIGHT_MODE_UNGUELTIG");return x}
export async function fuehreBankItemTransferPreflight({modus,cdpText,sourceSha,hostOptionen={}}={}){
 const m=mode(modus),s=sha(sourceSha),actual=head();if(s!==actual)throw new Error("BANK_ITEM_TRANSFER_PREFLIGHT_SOURCE_SHA_DRIFT:"+s+":"+actual);
 const live=await findeAdventureLandKontext(validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/"),{requiredGlobalFunction:"call_code_function_f"});
 let host=null;try{
  const obs=await beobachteBankItemTransferPreflightReadOnly(live.session,live.contextId);const kandidat=m==="RETRIEVE"?obs.retrieveKandidat:obs.storeKandidat;
  if(!kandidat)throw new Error(m==="RETRIEVE"?"BANK_RETRIEVE_KEIN_SICHERER_KANDIDAT":"BANK_STORE_KEIN_SICHERER_KANDIDAT");
  host=await erstelleNodeV5ProduktionsHost(hostOptionen);const start=await host.starte(Date.now());if(start.zustand!=="LAEUFT")throw new Error("BANK_ITEM_TRANSFER_PREFLIGHT_HOST_BLOCKIERT:"+start.grund);
  const current=m==="RETRIEVE"?await host.pruefeBankRetrieveStartBereit():await host.pruefeBankStoreStartBereit();const st=host.status();
  const fence=pruefeBankItemTransferVorAuthorityCurrentFence({schemaVersion:1,equipEinmalAuthorityOffen:st.equipEinmalAuthorityOffen,bankDepositEinmalAuthorityOffen:st.bankDepositEinmalAuthorityOffen,
   bankWithdrawEinmalAuthorityOffen:st.bankWithdrawEinmalAuthorityOffen,bankSwapEinmalAuthorityOffen:st.bankSwapEinmalAuthorityOffen,bankRetrieveEinmalAuthorityOffen:false,bankStoreEinmalAuthorityOffen:false,
   offeneBankDepositTransaktionId:current.offeneBankDepositTransaktionId,offeneBankWithdrawTransaktionId:current.offeneBankWithdrawTransaktionId,offeneBankSwapTransaktionId:current.offeneBankSwapTransaktionId,
   offeneBankRetrieveTransaktionId:current.offeneBankRetrieveTransaktionId,offeneBankStoreTransaktionId:current.offeneBankStoreTransaktionId,aktiveBankLease:current.offeneBankLease!==null});
  const bereit=current.bereit&&fence.status==="BEREIT"&&st.zustand==="LAEUFT"&&st.aktivePlanenFaehigkeiten.length===0&&st.gameplayAutoritaet===false&&st.rawWriteAutoritaet===false&&st.actionAuthority===false;
  const bericht=Object.freeze({schemaVersion:1,stufe:BANK_ITEM_TRANSFER_ABEND_STUFEN.PREFLIGHT,evidenceArt:"V5_BANK_"+m+"_READ_ONLY_PREFLIGHT",status:bereit?"BEREIT":"BLOCKIERT",modus:m,sourceSha:s,actualHeadSha:actual,
   context:Object.freeze({targetUrl:live.targetUrl,contextId:live.contextId,requiredGlobalFunction:"call_code_function_f"}),accountBindungSha256:h(obs.accountId),charakterBindungSha256:h(obs.charakterName+":"+obs.sessionId),
   server:Object.freeze({region:obs.serverRegion,kennung:obs.serverKennung}),mount:Object.freeze({map:obs.map,bankGemountet:true,beobachtetePacks:obs.beobachtetePacks}),candidate:kandidat,
   baseline:Object.freeze({fingerprint:obs.fingerprint,characterGold:obs.characterGold,bankGold:obs.bankGold,inventoryCapacity:obs.inventoryCapacity,beobachtetAmMs:obs.beobachtetAmMs}),
   current,fence,safety:Object.freeze({browserReadOnly:true,gameplayWrites:BANK_ITEM_TRANSFER_PREFLIGHT_GAMEPLAY_WRITES,mutatingPublicFunctionCalls:BANK_ITEM_TRANSFER_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,
    authorityAusgestellt:false,leaseErworben:false,journalIntentGeschrieben:false,adapterAufrufe:0,publicFunctionAufrufe:0,rawSocketEmit:false,sameIntentRetry:false}),
   sameIntentRetry:false,naechsterSchritt:bereit?m+"_KANDIDATEN_STABILITAET":"BLOCKER_LOKALISIEREN_KEIN_RETRY"});
  if( bereit ){
    const ds=new NodeProduktionsDateisystem(hostOptionen.dateisystemOptionen ?? {});
    await schreibeBankItemTransferAbendEvidence(ds,m,BANK_ITEM_TRANSFER_ABEND_STUFEN.PREFLIGHT,bericht);
  }
  return bericht;
 }finally{if(host)await host.stoppe("BANK_ITEM_TRANSFER_PREFLIGHT_ENDE").catch(()=>{});live.session.close()}
}
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)fuehreBankItemTransferPreflight({modus:arg("--mode"),cdpText:arg("--cdp","http://127.0.0.1:9222/"),sourceSha:arg("--source-sha")})
.then(r=>{process.stdout.write(JSON.stringify(r,null,2)+"\n");if(r.status!=="BEREIT")process.exitCode=2})
.catch(e=>{process.stderr.write(JSON.stringify({schemaVersion:1,status:"BLOCKIERT",fehler:String(e?.message||e),gameplayWrites:0,mutatingPublicFunctionCalls:0,adapterAufrufe:0,publicFunctionAufrufe:0,sameIntentRetry:false},null,2)+"\n");process.exitCode=2});
