import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  planePr208ExchangeCandidateAcquisition,
} from "../erzeugt/index.js";
import {
  findeAdventureLandKontext,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";
import {
  aktiviereUndVerifiziereBrowserPerformanceTrick,
} from "./r12-live/performance-trick.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..");

const EXPR=[
"(()=>{",
" const roots=[globalThis]; try{if(globalThis.parent&&globalThis.parent!==globalThis)roots.push(globalThis.parent)}catch{};",
" let root=null; for(const r of roots){try{if(r&&r.character&&r.G?.items){root=r;break}}catch{}}",
" if(!root)return {status:'BLOCKIERT',grund:'PR20_8_EXCHANGE_ACQ_SPIELKONTEXT_FEHLT'};",
" const c=root.character; const G=root.G;",
" const regions=[root?.server_region,root?.server?.region]; const ids=[root?.server_identifier,root?.server?.id];",
" try{regions.push(root?.parent?.server_region,root?.parent?.server?.region)}catch{}; try{ids.push(root?.parent?.server_identifier,root?.parent?.server?.id)}catch{};",
" const serverRegion=regions.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
" const serverIdentifier=ids.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
" function def(name){const d=G.items?.[name]||null;return d?{e:d.e??null,g:d.g??null,cash:d.cash===true,event:d.event===true,quest:d.quest===true,exclusive:d.exclusive===true}:null}",
" function row(item){if(!item||typeof item!=='object')return null;const name=String(item.name||'');return {item,definition:def(name)}}",
" const inventory=Array.isArray(c.items)?c.items.slice(0,64).map(row):null;",
" const capRaw=Number(c.isize); const inventoryCapacity=Number.isSafeInteger(capRaw)&&capRaw>=1&&capRaw<=64?capRaw:(Array.isArray(inventory)?inventory.length:0);",
" const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;",
" let catalog={}; try{catalog=(root.bank_packs&&typeof root.bank_packs==='object'?root.bank_packs:(root.parent&&root.parent.bank_packs)||{})}catch{};",
" const bankPacks=[]; if(bank){for(const pack of Object.keys(bank).sort()){if(!/^items[0-9]+$/.test(pack)||!Array.isArray(bank[pack]))continue;const meta=catalog&&catalog[pack];const packMap=Array.isArray(meta)?String(meta[0]||''):(meta&&typeof meta==='object'?String(meta.map||meta.place||''):'');bankPacks.push({pack,packMap,slots:bank[pack].slice(0,42).map(row)})}}",
" return {status:'OK',characterName:String(c.name||''),sessionId:String(c.id||''),ctype:String(c.ctype||c.type||'').toLowerCase(),map:String(c.map||''),serverRegion,serverIdentifier,bankMounted:!!bank,inventoryCapacity,inventory,bankPacks};",
"})()"
].join("\n");

function sha(value){
  if(typeof value!=="string"||!/^[0-9a-f]{40}$/i.test(value)){
    throw new Error("PR20_8_EXCHANGE_ACQ_SOURCE_SHA_UNGUELTIG");
  }
  return value.toLowerCase();
}
function head(){
  return sha(execFileSync("git",["rev-parse","HEAD"],{
    cwd:ROOT,encoding:"utf8",windowsHide:true,
  }).trim());
}
function arg(name,fallback=null){
  const index=process.argv.indexOf(name);
  if(index<0)return fallback;
  const value=process.argv[index+1];
  if(!value||value.startsWith("--")){
    throw new Error("PR20_8_EXCHANGE_ACQ_ARGUMENT_FEHLT:"+name);
  }
  return value;
}
function hash(value){
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}
function stable(value,depth=0){
  if(depth>12)throw new Error("PR20_8_EXCHANGE_ACQ_ITEM_ZU_TIEF");
  if(value===null||typeof value==="string"||typeof value==="boolean"){
    return JSON.stringify(value);
  }
  if(typeof value==="number"){
    if(!Number.isFinite(value))throw new Error("PR20_8_EXCHANGE_ACQ_ZAHL_UNGUELTIG");
    return JSON.stringify(value);
  }
  if(Array.isArray(value)){
    return "["+value.map(x=>stable(x,depth+1)).join(",")+"]";
  }
  if(typeof value==="object"){
    const keys=Object.keys(value).sort();
    return "{"+keys.map(k=>JSON.stringify(k)+":"+stable(value[k],depth+1)).join(",")+"}";
  }
  throw new Error("PR20_8_EXCHANGE_ACQ_TYP_UNGUELTIG");
}
function text(value,max,error){
  if(typeof value!=="string"||value.trim().length===0||value.length>max){
    throw new Error(error);
  }
}
function observed(row){
  if(row===null)return null;
  if(!row||typeof row!=="object"||!row.item||typeof row.item!=="object"){
    throw new Error("PR20_8_EXCHANGE_ACQ_ITEM_UNGUELTIG");
  }
  const item=row.item;
  const definition=row.definition&&typeof row.definition==="object"?row.definition:null;
  const name=String(item.name||"");
  text(name,192,"PR20_8_EXCHANGE_ACQ_ITEM_NAME_FEHLT");
  const quantity=Number(item.q==null?1:item.q);
  const exchangeRaw=Number(definition?.e);
  const goldRaw=Number(definition?.g);
  return Object.freeze({
    name,
    fingerprint:hash(stable(item)),
    quantity:Number.isSafeInteger(quantity)&&quantity>=1?quantity:0,
    locked:item.l===true||item.locked===true||item.lock===true,
    blocked:item.b===true||item.blocked===true,
    giveaway:item.giveaway===true,
    listed:item.list===true,
    hasExpires:item.expires!=null,
    hasAcl:item.acl!=null,
    hasRid:item.rid!=null,
    hasSpecialProperty:item.p!=null,
    gift:item.gift!=null,
    exchangeQuantity:Number.isSafeInteger(exchangeRaw)&&exchangeRaw>=1?exchangeRaw:null,
    baseGold:Number.isFinite(goldRaw)&&goldRaw>=0?goldRaw:null,
    definitionCash:definition?.cash===true,
    definitionEvent:definition?.event===true,
    definitionQuest:definition?.quest===true,
    definitionExclusive:definition?.exclusive===true,
  });
}
function normalize(raw){
  if(!raw||typeof raw!=="object"||raw.status!=="OK"){
    throw new Error(String(raw?.grund||"PR20_8_EXCHANGE_ACQ_BEOBACHTUNG_UNGUELTIG"));
  }
  text(raw.characterName,192,"PR20_8_EXCHANGE_ACQ_CHARACTER_FEHLT");
  text(raw.sessionId,192,"PR20_8_EXCHANGE_ACQ_SESSION_FEHLT");
  text(raw.map,96,"PR20_8_EXCHANGE_ACQ_MAP_FEHLT");
  text(raw.serverRegion,32,"PR20_8_EXCHANGE_ACQ_REGION_FEHLT");
  text(raw.serverIdentifier,32,"PR20_8_EXCHANGE_ACQ_SERVER_FEHLT");
  if(raw.ctype!=="merchant")throw new Error("PR20_8_EXCHANGE_ACQ_MERCHANT_ERFORDERLICH");
  if(!Array.isArray(raw.inventory)
      || !Number.isSafeInteger(raw.inventoryCapacity)
      || raw.inventoryCapacity<1
      || raw.inventoryCapacity>64){
    throw new Error("PR20_8_EXCHANGE_ACQ_INVENTORY_UNGUELTIG");
  }
  const inventory=Object.freeze(
    Array.from({length:raw.inventoryCapacity},(_,i)=>observed(raw.inventory[i]??null)),
  );
  if(!Array.isArray(raw.bankPacks)||raw.bankPacks.length>64){
    throw new Error("PR20_8_EXCHANGE_ACQ_BANK_PACKS_UNGUELTIG");
  }
  const bankPacks=Object.freeze(raw.bankPacks.map(pack=>{
    if(!pack||typeof pack!=="object"
        || !/^items[0-9]+$/.test(String(pack.pack||""))
        || typeof pack.packMap!=="string"
        || pack.packMap.trim().length===0
        || !Array.isArray(pack.slots)
        || pack.slots.length>42){
      throw new Error("PR20_8_EXCHANGE_ACQ_BANK_PACK_UNGUELTIG");
    }
    return Object.freeze({
      pack:String(pack.pack),
      packMap:String(pack.packMap),
      slots:Object.freeze(pack.slots.map(observed)),
    });
  }));
  return Object.freeze({
    context:Object.freeze({
      characterName:raw.characterName,
      sessionId:raw.sessionId,
      ctype:raw.ctype,
      map:raw.map,
      serverRegion:raw.serverRegion,
      serverIdentifier:raw.serverIdentifier,
    }),
    snapshot:Object.freeze({
      schemaVersion:1,
      currentMap:raw.map,
      bankMounted:raw.bankMounted===true,
      inventoryCapacity:raw.inventoryCapacity,
      inventory,
      bankPacks,
    }),
  });
}
function nextAction(plan){
  if(plan.status==="INVENTORY_CANDIDATE_READY")return "RUN_EXISTING_V1_0_6_SCANNER";
  if(plan.status==="BANK_RETRIEVE_CANDIDATE_READY")return "PREPARE_BOUND_BANK_RETRIEVE_SHADOW";
  if(plan.status==="BANK_DISCOVERY_REQUIRED")return "MOUNT_BANK_READ_ONLY_AND_RESCAN";
  if(plan.status==="BANK_CANDIDATE_BLOCKED_NO_FREE_INVENTORY_SLOT")return "STOP_NO_FREE_SLOT_NO_MUTATION";
  return "NO_BANK_OR_INVENTORY_CANDIDATE_CONSIDER_PURCHASE_FARM_STAGE_SEPARATELY";
}

export async function fuehrePr208ExchangeCandidateAcquisitionDiscovery({
  cdpText,
  sourceSha,
}={}){
  const expected=sha(sourceSha);
  const actual=head();
  if(expected!==actual){
    throw new Error("PR20_8_EXCHANGE_ACQ_SOURCE_SHA_DRIFT:"+expected+":"+actual);
  }
  const live=await findeAdventureLandKontext(
    validiereLoopbackCdp(cdpText||process.env.V5_CDP_URL||"http://127.0.0.1:9222/"),
    {requiredGlobalFunction:"call_code_function_f"},
  );
  try{
    const performanceTrick=await aktiviereUndVerifiziereBrowserPerformanceTrick(
      live.session,
      live.contextId,
    );
    const raw=await live.session.evaluate(EXPR,live.contextId);
    const normalized=normalize(raw);
    const plan=planePr208ExchangeCandidateAcquisition(normalized.snapshot);
    return Object.freeze({
      schemaVersion:1,
      evidenceArt:"V5_PR20_8_EXCHANGE_CANDIDATE_ACQUISITION_DISCOVERY_READ_ONLY",
      status:plan.status,
      sourceSha:expected,
      actualHeadSha:actual,
      context:normalized.context,
      performanceTrick,
      plan,
      nextAction:nextAction(plan),
      safety:Object.freeze({
        browserReadOnly:true,
        gameplayWrites:0,
        mutatingPublicFunctionCalls:0,
        rawWriteCalls:0,
        acquisitionPerformed:false,
        bankRetrieveAuthority:false,
        exchangeAuthority:false,
        buyAllowed:false,
        farmAllowed:false,
        normalRuntimeAllowed:false,
      }),
    });
  }finally{
    live.session.close();
  }
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct){
  fuehrePr208ExchangeCandidateAcquisitionDiscovery({
    cdpText:arg("--cdp","http://127.0.0.1:9222/"),
    sourceSha:arg("--source-sha"),
  }).then(result=>{
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    if(result.status==="NO_CANDIDATE"
        || result.status==="BANK_CANDIDATE_BLOCKED_NO_FREE_INVENTORY_SLOT"){
      process.exitCode=2;
    }
  }).catch(error=>{
    process.stderr.write(JSON.stringify({
      schemaVersion:1,
      status:"BLOCKIERT",
      fehler:String(error?.message||error),
      gameplayWrites:0,
      mutatingPublicFunctionCalls:0,
      rawWriteCalls:0,
      acquisitionPerformed:false,
      bankRetrieveAuthority:false,
      exchangeAuthority:false,
      normalRuntimeAllowed:false,
    },null,2)+"\n");
    process.exitCode=2;
  });
}
