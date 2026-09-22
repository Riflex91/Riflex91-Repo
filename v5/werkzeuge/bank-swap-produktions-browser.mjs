import crypto from "node:crypto";

import {
  waehleBankSwapErstenKandidaten,
} from "../erzeugt/index.js";

const READ_ONLY_BANK_SWAP_EXPR = [
  "(() => {",
  "  const roots=[globalThis];",
  "  try { if(globalThis.parent&&globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root=null;",
  "  for(const kandidat of roots){ try { if(kandidat&&kandidat.character&&kandidat.G){ root=kandidat; break; } } catch {} }",
  "  if(!root) return {status:'BLOCKIERT',grund:'BANK_SWAP_SPIELKONTEXT_FEHLT'};",
  "  const c=root.character;",
  "  let accountId='';",
  "  for(const kandidat of roots){ try { accountId=String(kandidat?.user_id||kandidat?.character?.owner||''); if(accountId) break; } catch {} }",
  "  const regionKandidaten=[root?.server_region,root?.server?.region];",
  "  const idKandidaten=[root?.server_identifier,root?.server?.id];",
  "  try { regionKandidaten.push(root?.parent?.server_region,root?.parent?.server?.region); } catch {}",
  "  try { idKandidaten.push(root?.parent?.server_identifier,root?.parent?.server?.id); } catch {}",
  "  const serverRegion=regionKandidaten.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
  "  const serverKennung=idKandidaten.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
  "  let alternativeRuntimeAktiv=false;",
  "  try { const v3=root.AIO_V3&&root.AIO_V3.__runtime; const s3=v3&&typeof v3.status==='function'?v3.status():null; alternativeRuntimeAktiv=!!(v3&&(v3.timer||(s3&&s3.running===true))); } catch { alternativeRuntimeAktiv=true; }",
  "  try { const v4=root.AIO_V4||root.V4Runtime; const s4=v4&&typeof v4.status==='function'?v4.status():null; if(s4&&(s4.running===true||s4.aktivFreigegeben===true)) alternativeRuntimeAktiv=true; } catch { alternativeRuntimeAktiv=true; }",
  "  const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;",
  "  let catalog={};",
  "  try { catalog=(root.bank_packs&&typeof root.bank_packs==='object'?root.bank_packs:(root.parent&&root.parent.bank_packs)||{}); } catch { catalog={}; }",
  "  const packs=[];",
  "  if(bank){",
  "    for(const pack of Object.keys(bank).sort()){",
  "      if(!/^items[0-9]+$/.test(pack)||!Array.isArray(bank[pack])) continue;",
  "      const meta=catalog&&catalog[pack];",
  "      const packMap=Array.isArray(meta)?String(meta[0]||''):(meta&&typeof meta==='object'?String(meta.map||meta.place||''):'');",
  "      packs.push({pack,packMap,slots:bank[pack].slice(0,42)});",
  "    }",
  "  }",
  "  const characterGold=Number(c.gold);",
  "  const bankGold=bank?Number(bank.gold):NaN;",
  "  let bridgeFunctionAvailable=false;",
  "  try { bridgeFunctionAvailable=typeof root.call_code_function_f==='function'; } catch {}",
  "  let codeActive=false;",
  "  try { codeActive=root.code_active===true; } catch {}",
  "  return {status:'OK',accountId,charakterName:String(c.name||''),sessionId:String(c.id||''),",
  "    ctype:String(c.ctype||c.type||'').toLowerCase(),map:String(c.map||''),serverRegion,serverKennung,",
  "    rip:c.rip===true,bewegtSich:c.moving===true,queueAktiv:!!(c.q&&typeof c.q==='object'&&Object.keys(c.q).length),",
  "    alternativeRuntimeAktiv,bankGemountet:!!bank,bridgeFunctionAvailable,codeActive,",
  "    characterGold:Number.isSafeInteger(characterGold)&&characterGold>=0?characterGold:null,",
  "    bankGold:Number.isSafeInteger(bankGold)&&bankGold>=0?bankGold:null,",
  "    inventory:Array.isArray(c.items)?c.items.slice(0,64):null,packs};",
  "})()",
].join("\n");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}
function text(wert, max, fehler) {
  if (typeof wert !== "string" || wert.trim().length === 0 || wert.length > max) throw new Error(fehler);
}
function stable(wert, tiefe = 0) {
  if (tiefe > 12) throw new Error("BANK_SWAP_BEOBACHTUNG_ZU_TIEF");
  if (wert === null || typeof wert === "string" || typeof wert === "boolean") return JSON.stringify(wert);
  if (typeof wert === "number") {
    if (!Number.isFinite(wert)) throw new Error("BANK_SWAP_BEOBACHTUNG_ZAHL_UNGUELTIG");
    return JSON.stringify(wert);
  }
  if (Array.isArray(wert)) return "[" + wert.map(x => stable(x, tiefe + 1)).join(",") + "]";
  if (typeof wert === "object") {
    const keys=Object.keys(wert).sort();
    return "{" + keys.map(k => JSON.stringify(k)+":"+stable(wert[k],tiefe+1)).join(",") + "}";
  }
  throw new Error("BANK_SWAP_BEOBACHTUNG_TYP_UNGUELTIG");
}
function itemInfo(item) {
  if (item === null || item === undefined) return null;
  if (typeof item !== "object" || Array.isArray(item)) throw new Error("BANK_SWAP_BANK_ITEM_UNGUELTIG");
  const name=String(item.name||"");
  text(name,192,"BANK_SWAP_BANK_ITEM_NAME_FEHLT");
  const material=stable(item);
  if (material.length>20_000) throw new Error("BANK_SWAP_BANK_ITEM_ZU_GROSS");
  return Object.freeze({name,fingerprint:hash(material),placeholder:name==="placeholder"});
}
function validiereBasis(value) {
  if (!value || typeof value !== "object" || value.status !== "OK") {
    throw new Error(String(value?.grund || "BANK_SWAP_BEOBACHTUNG_UNGUELTIG"));
  }
  text(value.accountId,192,"BANK_SWAP_ACCOUNT_BINDUNG_FEHLT");
  text(value.charakterName,192,"BANK_SWAP_CHARACTER_BINDUNG_FEHLT");
  text(value.sessionId,192,"BANK_SWAP_SESSION_BINDUNG_FEHLT");
  text(value.serverRegion,32,"BANK_SWAP_SERVER_REGION_FEHLT");
  text(value.serverKennung,32,"BANK_SWAP_SERVER_KENNUNG_FEHLT");
  text(value.map,96,"BANK_SWAP_MAP_FEHLT");
  if (value.ctype!=="merchant") throw new Error("BANK_SWAP_MERCHANT_ERFORDERLICH");
  if (value.rip===true) throw new Error("BANK_SWAP_CHARACTER_TOT");
  if (value.alternativeRuntimeAktiv===true) throw new Error("BANK_SWAP_ALTERNATIVE_RUNTIME_AKTIV");
  if (value.bridgeFunctionAvailable!==true) throw new Error("BANK_SWAP_CODE_BRIDGE_FEHLT");
  if (!Number.isSafeInteger(value.characterGold)||value.characterGold<0) throw new Error("BANK_SWAP_CHARACTER_GOLD_NICHT_LESBAR");
  if (!Array.isArray(value.inventory)||value.inventory.length>64) throw new Error("BANK_SWAP_INVENTORY_UNGUELTIG");
  if (!Array.isArray(value.packs)||value.packs.length>64) throw new Error("BANK_SWAP_PACK_LISTE_UNGUELTIG");
  return value;
}
function gleicheIdentitaet(a,b){
  return a.accountId===b.accountId&&a.charakterName===b.charakterName&&a.sessionId===b.sessionId
    &&a.serverRegion===b.serverRegion&&a.serverKennung===b.serverKennung&&a.ctype===b.ctype;
}
function mounted(value,beobachtetAmMs,erwarteterKandidat=null) {
  const basis=validiereBasis(value);
  if (basis.bewegtSich===true||basis.queueAktiv===true) throw new Error("BANK_SWAP_MOUNT_NICHT_IDLE");
  if (basis.bankGemountet!==true) throw new Error("BANK_SWAP_BANK_NICHT_GEMOUNTET");
  if (!Number.isSafeInteger(basis.bankGold)||basis.bankGold<0) throw new Error("BANK_SWAP_BANK_GOLD_NICHT_LESBAR");
  if (!Number.isSafeInteger(beobachtetAmMs)||beobachtetAmMs<0) throw new Error("BANK_SWAP_BEOBACHTUNGSZEIT_UNGUELTIG");

  const packs=[];
  for(const row of basis.packs){
    if(!row||typeof row!=="object"||!/^items[0-9]+$/.test(String(row.pack||""))
      ||!Array.isArray(row.slots)||row.slots.length>42) throw new Error("BANK_SWAP_BANK_PACK_UNGUELTIG");
    if(String(row.packMap||"")!==basis.map) continue;
    packs.push(Object.freeze({pack:String(row.pack),slots:Object.freeze(row.slots.map(itemInfo))}));
  }
  if(packs.length<1) throw new Error("BANK_SWAP_KEIN_PACK_AM_AKTUELLEN_BANK_MOUNT");

  let kandidat;
  if(erwarteterKandidat===null){
    kandidat=waehleBankSwapErstenKandidaten(packs);
    if(kandidat===null) throw new Error("BANK_SWAP_KEIN_SICHERER_ZWEI_SLOT_KANDIDAT");
  } else {
    if(!/^items[0-9]+$/.test(String(erwarteterKandidat.pack||""))
      ||!Number.isInteger(erwarteterKandidat.a)||erwarteterKandidat.a<0||erwarteterKandidat.a>41
      ||!Number.isInteger(erwarteterKandidat.b)||erwarteterKandidat.b<0||erwarteterKandidat.b>41
      ||erwarteterKandidat.a===erwarteterKandidat.b) throw new Error("BANK_SWAP_ERWARTETER_KANDIDAT_UNGUELTIG");
    const p=packs.find(x=>x.pack===erwarteterKandidat.pack);
    const a=p?.slots?.[erwarteterKandidat.a]??null;
    const b=p?.slots?.[erwarteterKandidat.b]??null;
    if(!p||!a||!b||a.placeholder||b.placeholder) throw new Error("BANK_SWAP_ERWARTETE_SLOTS_NICHT_BELEGT");
    kandidat=Object.freeze({
      schemaVersion:1,pack:p.pack,a:erwarteterKandidat.a,b:erwarteterKandidat.b,
      itemA:Object.freeze({name:a.name,fingerprint:a.fingerprint}),
      itemB:Object.freeze({name:b.name,fingerprint:b.fingerprint}),
      stackMergeDurchNamensgleichheitAusgeschlossen:a.name!==b.name,
    });
    if(a.name===b.name) throw new Error("BANK_SWAP_POSTSTATE_STACK_RISIKO_ODER_DRIFT");
  }
  const ziel=packs.find(x=>x.pack===kandidat.pack);
  const rest=ziel.slots.map((x,index)=>index===kandidat.a||index===kandidat.b?index+":<swap>":index+":"+(x?.fingerprint||"_")).join("|");
  const inventoryMaterial=stable(basis.inventory);
  if(inventoryMaterial.length>200_000) throw new Error("BANK_SWAP_INVENTORY_ZU_GROSS");
  const inventoryFingerprint=hash(inventoryMaterial);
  const fingerprint=hash(stable({
    accountId:basis.accountId,charakterName:basis.charakterName,sessionId:basis.sessionId,
    serverRegion:basis.serverRegion,serverKennung:basis.serverKennung,map:basis.map,
    characterGold:basis.characterGold,bankGold:basis.bankGold,inventoryFingerprint,
    packs:packs.map(p=>({pack:p.pack,slots:p.slots.map(x=>x?.fingerprint||null)})),
  }));
  return Object.freeze({
    schemaVersion:1,accountId:basis.accountId,charakterName:basis.charakterName,sessionId:basis.sessionId,
    ctype:basis.ctype,map:basis.map,serverRegion:basis.serverRegion,serverKennung:basis.serverKennung,
    bankGemountet:true,bridgeFunctionAvailable:true,codeActive:basis.codeActive===true,
    characterGold:basis.characterGold,bankGold:basis.bankGold,inventoryFingerprint,
    beobachtetAmMs,fingerprint,beobachtetePacks:Object.freeze(packs.map(x=>x.pack)),
    kandidat:Object.freeze({...kandidat,packRestFingerprint:hash(rest)}),
  });
}

export async function beobachteBankSwapRohReadOnly(session,contextId){
  if(!session||typeof session.evaluate!=="function"||!Number.isInteger(contextId)) throw new Error("BANK_SWAP_CDP_KONTEXT_UNGUELTIG");
  return validiereBasis(await session.evaluate(READ_ONLY_BANK_SWAP_EXPR,contextId));
}
export function validiereBankSwapAusgangsBeobachtung(value){
  const basis=validiereBasis(value);
  if(basis.bewegtSich===true) throw new Error("BANK_SWAP_START_CHARACTER_BEWEGT_SICH");
  if(basis.queueAktiv===true) throw new Error("BANK_SWAP_START_CHARACTER_QUEUE_AKTIV");
  if(basis.bankGemountet===true) throw new Error("BANK_SWAP_START_MUSS_AUSSERHALB_BANK_SEIN");
  return Object.freeze({...basis});
}
export function validiereBankSwapMountBeobachtung(value,ausgang,beobachtetAmMs,erwarteterKandidat=null){
  const snap=mounted(value,beobachtetAmMs,erwarteterKandidat);
  if(!gleicheIdentitaet(snap,ausgang)) throw new Error("BANK_SWAP_BINDUNG_DRIFT");
  return snap;
}
export function validiereBankSwapPreflightBeobachtung(value,beobachtetAmMs=Date.now()){
  return mounted(value,beobachtetAmMs,null);
}
export async function beobachteBankSwapPreflightReadOnly(session,contextId){
  return validiereBankSwapPreflightBeobachtung(await session.evaluate(READ_ONLY_BANK_SWAP_EXPR,contextId),Date.now());
}
export async function warteAufStabilenBankSwapStartAusserhalbBankReadOnly(session,contextId,{
  timeoutMs=90_000,pollMs=500,onPhase=()=>{},
}={}){
  const start=Date.now(); let bindung=null,kandidat=null,hinweis=false;
  while(Date.now()-start<=timeoutMs){
    const roh=await beobachteBankSwapRohReadOnly(session,contextId);
    if(bindung!==null&&!gleicheIdentitaet(roh,bindung)) throw new Error("BANK_SWAP_START_BINDUNG_DRIFT");
    if(bindung===null) bindung=roh;
    if(roh.bankGemountet){
      kandidat=null;
      if(!hinweis){onPhase("START_BANK_AKTIV_BANK_MANUELL_VERLASSEN");hinweis=true;}
    } else if(!roh.bewegtSich&&!roh.queueAktiv){
      const k=validiereBankSwapAusgangsBeobachtung(roh);
      if(kandidat!==null){onPhase("START_AUSSERHALB_BANK_STABIL_BEOBACHTET");return k;}
      kandidat=k;
    } else kandidat=null;
    await sleep(pollMs);
  }
  throw new Error("BANK_SWAP_START_AUSSERHALB_TIMEOUT");
}
export async function warteAufManuellenBankSwapMountReadOnly(session,contextId,ausgang,{
  timeoutMs=90_000,pollMs=500,onPhase=()=>{},
}={}){
  const start=Date.now(); let kandidat=null;
  onPhase("LEASE_ERWORBEN_BANK_MANUELL_BETRETEN");
  while(Date.now()-start<=timeoutMs){
    const roh=await beobachteBankSwapRohReadOnly(session,contextId);
    if(!gleicheIdentitaet(roh,ausgang)) throw new Error("BANK_SWAP_MOUNT_BINDUNG_DRIFT");
    if(roh.bankGemountet){
      const snap=validiereBankSwapMountBeobachtung(roh,ausgang,Date.now(),null);
      const schluessel=snap.fingerprint+":"+snap.kandidat.pack+":"+snap.kandidat.a+":"+snap.kandidat.b;
      if(kandidat?.schluessel===schluessel){onPhase("BANK_SWAP_MOUNT_STABIL_BEOBACHTET");return snap;}
      kandidat={schluessel,snap};
    } else kandidat=null;
    await sleep(pollMs);
  }
  throw new Error("BANK_SWAP_MANUELLER_MOUNT_TIMEOUT");
}
export function erstelleBankSwapReleaseBeobachter(session,contextId,mountBeobachtung,{
  timeoutMs=90_000,pollMs=500,onPhase=()=>{},exitPhaseText="BANK_SWAP_BANK_MANUELL_VERLASSEN",
}={}){
  return Object.freeze({async beobachte(){
    const start=Date.now(); onPhase(exitPhaseText);
    while(Date.now()-start<=timeoutMs){
      const roh=await beobachteBankSwapRohReadOnly(session,contextId);
      if(!gleicheIdentitaet(roh,mountBeobachtung)) throw new Error("BANK_SWAP_EXIT_BINDUNG_DRIFT");
      if(!roh.bankGemountet&&!roh.bewegtSich&&!roh.queueAktiv){
        onPhase("BANK_SWAP_EXIT_STABIL_BEOBACHTET");
        return Object.freeze({offeneTransaktionen:0,backendInProgress:false,bankActionInFlight:false,characterBankAktiv:false,erwarteterExitBeobachtet:true});
      }
      await sleep(pollMs);
    }
    throw new Error("BANK_SWAP_MANUELLER_EXIT_TIMEOUT");
  }});
}
export function erstelleBankSwapLiveVoraussetzungen(mountBeobachtung,ausgestelltAmMs,gueltigBisMs){
  return Object.freeze({async pruefe(ids,zeitMs){
    if(zeitMs!==ausgestelltAmMs||!Array.isArray(ids)||ids.length<1||ids.length>16) return Object.freeze([]);
    return Object.freeze(ids.map(id=>Object.freeze({
      voraussetzungId:id,fingerprint:hash(id+":"+mountBeobachtung.fingerprint+":"+mountBeobachtung.inventoryFingerprint),
      beobachtetAmMs:mountBeobachtung.beobachtetAmMs,gueltigBisMs,
    })));
  }});
}
export function erstelleBankSwapBindung(mountBeobachtung,leaseEpoche){
  if(!Number.isSafeInteger(leaseEpoche)||leaseEpoche<1) throw new Error("BANK_SWAP_LEASE_EPOCHE_UNGUELTIG");
  const k=mountBeobachtung.kandidat;
  return Object.freeze({
    schemaVersion:1,characterId:mountBeobachtung.charakterName,sessionId:mountBeobachtung.sessionId,
    serverRegion:mountBeobachtung.serverRegion,serverKennung:mountBeobachtung.serverKennung,
    leaseEpoche,mountEpoche:mountBeobachtung.beobachtetAmMs,beobachtetAmMs:mountBeobachtung.beobachtetAmMs,
    bankPack:k.pack,slotA:k.a,slotB:k.b,slotAItem:k.itemA,slotBItem:k.itemB,
    packRestFingerprint:k.packRestFingerprint,inventoryFingerprint:mountBeobachtung.inventoryFingerprint,
    characterGold:mountBeobachtung.characterGold,bankGold:mountBeobachtung.bankGold,fingerprint:mountBeobachtung.fingerprint,
  });
}
export function erstelleProduktivenBankSwapBeobachter(session,contextId,erwarteteIdentitaet,erwarteterKandidat){
  return Object.freeze({async beobachte(leaseEpoche,mountEpoche){
    const roh=await beobachteBankSwapRohReadOnly(session,contextId);
    const snap=validiereBankSwapMountBeobachtung(roh,erwarteteIdentitaet,Date.now(),erwarteterKandidat);
    const b=erstelleBankSwapBindung(snap,leaseEpoche);
    return Object.freeze({...b,mountEpoche});
  }});
}
export const BANK_SWAP_PREFLIGHT_BROWSER_READ_ONLY=true;
export const BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES=0;
export const BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS=0;
export const BANK_SWAP_REAL_SHADOW_GAMEPLAY_WRITES=0;
