import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  BANK_STORE_REAL_SHADOW_GAMEPLAY_WRITES,
  erstelleBankStoreShadowReleaseBeobachter,
  warteAufManuellenBankStoreMountReadOnly,
  warteAufStabilenBankStoreStartAusserhalbReadOnly,
} from "./bank-store-produktions-browser.mjs";
import {
  erstelleNodeV5ProduktionsHost,
} from "./v5-produktions-host-komposition.mjs";

export const BANK_STORE_REAL_SHADOW_BESTAETIGUNG =
  "V5 BANK STORE SHADOW OHNE WRITE AUSFUEHREN";
export const BANK_STORE_REAL_SHADOW_EVIDENCE_ART =
  "V5_BANK_STORE_REAL_BROWSER_SHADOW_NO_WRITE";

const V5_WURZEL=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const REPO_WURZEL=path.resolve(V5_WURZEL,"..");

function hash(wert){
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}
function leseArgument(name,fallback=null){
  const i=process.argv.indexOf(name);
  if(i<0) return fallback;
  const wert=process.argv[i+1];
  if(!wert||wert.startsWith("--")) throw new Error("BANK_STORE_SHADOW_ARGUMENT_FEHLT:"+name);
  return wert;
}
function pruefeSha(wert){
  if(typeof wert!=="string"||!/^[a-f0-9]{40}$/i.test(wert)) throw new Error("BANK_STORE_SHADOW_SOURCE_SHA_UNGUELTIG");
  return wert.toLowerCase();
}
function aktuellerGitHead(){
  return pruefeSha(execFileSync("git",["rev-parse","HEAD"],{
    cwd:REPO_WURZEL,encoding:"utf8",stdio:["ignore","pipe","pipe"],windowsHide:true,
  }).trim());
}
function id(prefix){
  return prefix+"-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex");
}
function phase(text){
  process.stdout.write("[V5-BANK-STORE-SHADOW] "+text+"\n");
}
async function schreibeBericht(wurzel,bericht){
  const dir=path.join(wurzel,"runtime","canary","bank-store-real-shadow");
  await fs.mkdir(dir,{recursive:true});
  const ziel=path.join(dir,"latest.json");
  const temp=ziel+".tmp-"+process.pid+"-"+Date.now();
  await fs.writeFile(temp,JSON.stringify(bericht,null,2)+"\n","utf8");
  await fs.rename(temp,ziel);
  return ziel;
}

export async function fuehreBankStoreRealBrowserShadow({
  cdpText,
  sourceSha,
  bestaetigungText,
  startTimeoutMs=90_000,
  mountTimeoutMs=90_000,
  exitTimeoutMs=90_000,
  hostOptionen={},
}={}){
  const erwartetSha=pruefeSha(sourceSha);
  const head=aktuellerGitHead();
  if(head!==erwartetSha){
    throw new Error("BANK_STORE_SHADOW_SOURCE_SHA_MISMATCH:HEAD="+head+":ERWARTET="+erwartetSha);
  }
  if(bestaetigungText!==BANK_STORE_REAL_SHADOW_BESTAETIGUNG){
    throw new Error("BANK_STORE_SHADOW_OPERATOR_BESTAETIGUNG_FEHLT");
  }

  const cdp=validiereLoopbackCdp(
    cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/",
  );
  const live=await findeAdventureLandKontext(cdp);
  let host=null;
  try{
    const ausgang=await warteAufStabilenBankStoreStartAusserhalbReadOnly(
      live.session,live.contextId,{
        timeoutMs:startTimeoutMs,pollMs:500,onPhase:phase,
      },
    );

    host=await erstelleNodeV5ProduktionsHost(hostOptionen);
    const startMs=Date.now();
    const start=await host.starte(startMs);
    if(start.zustand!=="LAEUFT") throw new Error("BANK_STORE_SHADOW_HOST_BLOCKIERT:"+start.grund);

    const bereit=await host.pruefeBankStoreStartBereit();
    if(!bereit.bereit) throw new Error("BANK_STORE_SHADOW_START_EVIDENCE_BLOCKIERT");

    const transaktionsId=id("BANK-STORE-SHADOW-TX");
    const ablaufId=id("BANK-STORE-SHADOW-WF");
    let mountBeobachtung=null;

    const mountBeobachter=Object.freeze({
      async warteAufMount(){
        const beobachtung=await warteAufManuellenBankStoreMountReadOnly(
          live.session,live.contextId,ausgang,{
            timeoutMs:mountTimeoutMs,pollMs:500,onPhase:phase,
          },
        );
        mountBeobachtung=beobachtung;
        return beobachtung;
      },
    });
    const releaseBeobachter=Object.freeze({
      async beobachte(token,jetztMs){
        if(mountBeobachtung===null) throw new Error("BANK_STORE_SHADOW_RELEASE_OHNE_MOUNT_EVIDENCE");
        return erstelleBankStoreShadowReleaseBeobachter(
          live.session,live.contextId,mountBeobachtung,{
            timeoutMs:exitTimeoutMs,pollMs:500,onPhase:phase,
          },
        ).beobachte(token,jetztMs);
      },
    });

    const ergebnis=await host.fuehreBankStoreRealShadow({
      aktivierungsId:id("BANK-STORE-SHADOW-AUTH"),
      transaktionsId,
      freigabeId:id("BANK-STORE-SHADOW-FREE"),
      auftragId:id("BANK-STORE-SHADOW-ORDER"),
      ablaufId,
      shadowBestaetigungText:bestaetigungText,
      ausgang,
      mountBeobachter,
      releaseBeobachter,
    },startMs);

    const nachher=await host.pruefeBankStoreStartBereit();
    const leaseStatus=host.bankLeaseStatus();
    const status=host.status();
    const bestanden=ergebnis.status==="ADMISSION_BESTANDEN_KEIN_SEND"
      &&ergebnis.gameplayWrites===0
      &&ergebnis.adapterAufrufe===0
      &&ergebnis.browserGameplayWrites===0
      &&mountBeobachtung!==null
      &&nachher.bereit
      &&leaseStatus.every(x=>x.zustand==="RELEASED")
      &&status.bankStoreEinmalAuthorityOffen===false;

    const bericht=Object.freeze({
      schemaVersion:1,
      evidenceArt:BANK_STORE_REAL_SHADOW_EVIDENCE_ART,
      stand:new Date().toISOString(),
      status:bestanden?"BESTANDEN":"NICHT_BESTANDEN",
      sourceSha:erwartetSha,
      actualHeadSha:head,
      transaktionsId,
      accountBindungSha256:hash(ausgang.accountId),
      charakterBindungSha256:hash(ausgang.charakterName+":"+ausgang.sessionId),
      server:Object.freeze({region:ausgang.serverRegion,kennung:ausgang.serverKennung}),
      candidate:mountBeobachtung===null?null:Object.freeze({
        publicFunction:"bank_store",
        itemCount:1,
        sourceSlot:mountBeobachtung.sourceSlot,
        targetPack:mountBeobachtung.targetPack,
        targetSlot:mountBeobachtung.targetSlot,
        sourceItemFingerprint:mountBeobachtung.sourceItemFingerprint,
        targetItemFingerprint:null,
        autoPlacement:false,
        stackMerge:false,
      }),
      startAusserhalbBank:true,
      manualMountTransition:ergebnis.manualMountTransition===true,
      manualExitRequired:ergebnis.manualExitRequired===true,
      admissionStatus:ergebnis.status,
      journalTerminalArt:ergebnis.journalTerminalArt,
      sendBoundaryState:ergebnis.sendBoundaryState,
      sameIntentRetry:ergebnis.sameIntentErneutSenden,
      browserGameplayWrites:BANK_STORE_REAL_SHADOW_GAMEPLAY_WRITES,
      hostGameplayWrites:ergebnis.hostGameplayWrites,
      gameplayWrites:ergebnis.gameplayWrites,
      adapterAufrufe:ergebnis.adapterAufrufe,
      bankStartNachherBereit:nachher.bereit,
      leaseStatus:leaseStatus.map(x=>Object.freeze({epoche:x.epoche,zustand:x.zustand})),
      hostNachher:Object.freeze({
        zustand:status.zustand,
        bankStoreEinmalAuthorityOffen:status.bankStoreEinmalAuthorityOffen,
        gameplayAutoritaet:status.gameplayAutoritaet,
        rawWriteAutoritaet:status.rawWriteAutoritaet,
        actionAuthority:status.actionAuthority,
      }),
      breiteRuntimeFreigabeDurchDiesenTest:false,
      rawWriteBypass:false,
    });
    const reportPfad=await schreibeBericht(host.produktionsWurzel(),bericht);
    return Object.freeze({...bericht,reportPfad});
  } finally {
    if(host!==null) await host.stoppe("BANK_STORE_REAL_SHADOW_ENDE").catch(()=>{});
    live.session.close();
  }
}

const direkt=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direkt){
  fuehreBankStoreRealBrowserShadow({
    cdpText:leseArgument("--cdp",process.env.V5_CDP_URL||"http://127.0.0.1:9222/"),
    sourceSha:leseArgument("--source-sha"),
    bestaetigungText:leseArgument("--confirm"),
  }).then(bericht=>{
    process.stdout.write(JSON.stringify(bericht,null,2)+"\n");
    if(bericht.status!=="BESTANDEN") process.exitCode=2;
  }).catch(fehler=>{
    process.stderr.write(JSON.stringify({
      status:"BLOCKIERT",
      fehler:String(fehler?.message||fehler),
      sameIntentRetry:false,
      browserGameplayWrites:0,
      gameplayWrites:0,
      adapterAufrufe:0,
      hinweis:"Kein bank_store wurde ausgefuehrt. Bei offener Bank-Lease zuerst Evidence/Reconciliation pruefen.",
    },null,2)+"\n");
    process.exitCode=1;
  });
}
