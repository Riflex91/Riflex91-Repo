import crypto from "node:crypto";
import {
  waehleBankRetrieveErstenKandidaten,
  waehleBankStoreErstenKandidaten,
} from "../erzeugt/index.js";

const EXPR=[
"(()=>{",
" const roots=[globalThis]; try{if(globalThis.parent&&globalThis.parent!==globalThis)roots.push(globalThis.parent)}catch{}",
" let root=null; for(const r of roots){try{if(r&&r.character&&r.G){root=r;break}}catch{}}",
" if(!root)return {status:'BLOCKIERT',grund:'BANK_ITEM_TRANSFER_SPIELKONTEXT_FEHLT'};",
" const c=root.character; let accountId=''; for(const r of roots){try{accountId=String(r?.user_id||r?.character?.owner||'');if(accountId)break}catch{}}",
" const regions=[root?.server_region,root?.server?.region]; const ids=[root?.server_identifier,root?.server?.id];",
" try{regions.push(root?.parent?.server_region,root?.parent?.server?.region)}catch{}; try{ids.push(root?.parent?.server_identifier,root?.parent?.server?.id)}catch{};",
" const serverRegion=regions.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||''; const serverKennung=ids.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
" let alternativeRuntimeAktiv=false; try{const v3=root.AIO_V3&&root.AIO_V3.__runtime;const s3=v3&&typeof v3.status==='function'?v3.status():null;alternativeRuntimeAktiv=!!(v3&&(v3.timer||(s3&&s3.running===true)))}catch{alternativeRuntimeAktiv=true}",
" try{const v4=root.AIO_V4||root.V4Runtime;const s4=v4&&typeof v4.status==='function'?v4.status():null;if(s4&&(s4.running===true||s4.aktivFreigegeben===true))alternativeRuntimeAktiv=true}catch{alternativeRuntimeAktiv=true}",
" const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null; let catalog={}; try{catalog=(root.bank_packs&&typeof root.bank_packs==='object'?root.bank_packs:(root.parent&&root.parent.bank_packs)||{})}catch{}",
" const packs=[]; if(bank){for(const pack of Object.keys(bank).sort()){if(!/^items[0-9]+$/.test(pack)||!Array.isArray(bank[pack]))continue;const meta=catalog&&catalog[pack];const packMap=Array.isArray(meta)?String(meta[0]||''):(meta&&typeof meta==='object'?String(meta.map||meta.place||''):'');packs.push({pack,packMap,slots:bank[pack].slice(0,42)})}}",
" const inventory=Array.isArray(c.items)?c.items.slice(0,64):null; const capRaw=Number(c.isize); const inventoryCapacity=Number.isSafeInteger(capRaw)&&capRaw>=1&&capRaw<=64?capRaw:(Array.isArray(inventory)?inventory.length:0);",
" const cg=Number(c.gold),bg=bank?Number(bank.gold):NaN; let bridge=false,codeActive=false; try{bridge=typeof root.call_code_function_f==='function'}catch{};try{codeActive=root.code_active===true}catch{}",
" return {status:'OK',accountId,charakterName:String(c.name||''),sessionId:String(c.id||''),ctype:String(c.ctype||c.type||'').toLowerCase(),map:String(c.map||''),serverRegion,serverKennung,",
" rip:c.rip===true,bewegtSich:c.moving===true,queueAktiv:!!(c.q&&typeof c.q==='object'&&Object.keys(c.q).length),alternativeRuntimeAktiv,bankGemountet:!!bank,bridgeFunctionAvailable:bridge,codeActive,",
" characterGold:Number.isSafeInteger(cg)&&cg>=0?cg:null,bankGold:Number.isSafeInteger(bg)&&bg>=0?bg:null,inventory,inventoryCapacity,packs};",
"})()"
].join("\n");

function hash(v){return crypto.createHash("sha256").update(String(v)).digest("hex")}
function stable(v,d=0){if(d>12)throw new Error("BANK_ITEM_TRANSFER_BEOBACHTUNG_ZU_TIEF");if(v===null||typeof v==="string"||typeof v==="boolean")return JSON.stringify(v);if(typeof v==="number"){if(!Number.isFinite(v))throw new Error("BANK_ITEM_TRANSFER_ZAHL_UNGUELTIG");return JSON.stringify(v)}if(Array.isArray(v))return "["+v.map(x=>stable(x,d+1)).join(",")+"]";if(typeof v==="object"){const k=Object.keys(v).sort();return "{"+k.map(x=>JSON.stringify(x)+":"+stable(v[x],d+1)).join(",")+"}"}throw new Error("BANK_ITEM_TRANSFER_TYP_UNGUELTIG")}
function txt(v,max,e){if(typeof v!=="string"||v.trim().length===0||v.length>max)throw new Error(e)}
function itemInfo(x){
 if(x==null)return null;if(typeof x!=="object"||Array.isArray(x))throw new Error("BANK_ITEM_TRANSFER_ITEM_UNGUELTIG");
 const name=String(x.name||"");txt(name,192,"BANK_ITEM_TRANSFER_ITEM_NAME_FEHLT");const m=stable(x);if(m.length>20000)throw new Error("BANK_ITEM_TRANSFER_ITEM_ZU_GROSS");
 return Object.freeze({name,fingerprint:hash(m),placeholder:name==="placeholder",blocked:x.b===true,hasM:Object.prototype.hasOwnProperty.call(x,"m"),hasV:Object.prototype.hasOwnProperty.call(x,"v")});
}
function basis(v){
 if(!v||typeof v!=="object"||v.status!=="OK")throw new Error(String(v?.grund||"BANK_ITEM_TRANSFER_BEOBACHTUNG_UNGUELTIG"));
 txt(v.accountId,192,"BANK_ITEM_TRANSFER_ACCOUNT_FEHLT");txt(v.charakterName,192,"BANK_ITEM_TRANSFER_CHARACTER_FEHLT");txt(v.sessionId,192,"BANK_ITEM_TRANSFER_SESSION_FEHLT");
 txt(v.serverRegion,32,"BANK_ITEM_TRANSFER_REGION_FEHLT");txt(v.serverKennung,32,"BANK_ITEM_TRANSFER_SERVER_FEHLT");txt(v.map,96,"BANK_ITEM_TRANSFER_MAP_FEHLT");
 if(v.ctype!=="merchant")throw new Error("BANK_ITEM_TRANSFER_MERCHANT_ERFORDERLICH");if(v.rip)throw new Error("BANK_ITEM_TRANSFER_CHARACTER_TOT");
 if(v.alternativeRuntimeAktiv)throw new Error("BANK_ITEM_TRANSFER_ALTERNATIVE_RUNTIME_AKTIV");if(!v.bridgeFunctionAvailable)throw new Error("BANK_ITEM_TRANSFER_CODE_BRIDGE_FEHLT");
 if(!Array.isArray(v.inventory)||!Number.isSafeInteger(v.inventoryCapacity)||v.inventoryCapacity<1||v.inventoryCapacity>64||v.inventory.length>v.inventoryCapacity)throw new Error("BANK_ITEM_TRANSFER_INVENTORY_UNGUELTIG");
 if(!Array.isArray(v.packs)||v.packs.length>64)throw new Error("BANK_ITEM_TRANSFER_PACKS_UNGUELTIG");
 if(!Number.isSafeInteger(v.characterGold)||v.characterGold<0)throw new Error("BANK_ITEM_TRANSFER_CHARACTER_GOLD_UNGUELTIG");
 return v;
}
function mounted(v,zeit){
 const b=basis(v);if(b.bewegtSich||b.queueAktiv)throw new Error("BANK_ITEM_TRANSFER_NICHT_IDLE");if(!b.bankGemountet)throw new Error("BANK_ITEM_TRANSFER_BANK_NICHT_GEMOUNTET");
 if(!Number.isSafeInteger(b.bankGold)||b.bankGold<0)throw new Error("BANK_ITEM_TRANSFER_BANK_GOLD_UNGUELTIG");
 const packs=[];for(const row of b.packs){if(!row||typeof row!=="object"||!/^items[0-9]+$/.test(String(row.pack||""))||!Array.isArray(row.slots)||row.slots.length>42)throw new Error("BANK_ITEM_TRANSFER_PACK_UNGUELTIG");if(String(row.packMap||"")!==b.map)continue;packs.push(Object.freeze({pack:String(row.pack),slots:Object.freeze(row.slots.map(itemInfo))}))}
 if(!packs.length)throw new Error("BANK_ITEM_TRANSFER_KEIN_PACK_AM_MOUNT");
 const inventory=Object.freeze(Array.from({length:b.inventoryCapacity},(_,i)=>itemInfo(b.inventory[i]??null)));
 const retrieve=waehleBankRetrieveErstenKandidaten(packs,inventory,b.inventoryCapacity);
 const store=waehleBankStoreErstenKandidaten(packs,inventory,b.inventoryCapacity);
 const allPack=hash(stable(packs.map(p=>({pack:p.pack,slots:p.slots.map(x=>x?.fingerprint||null)}))));
 const allInv=hash(stable(inventory.map(x=>x?.fingerprint||null)));
 const fingerprint=hash(stable({accountId:b.accountId,charakterName:b.charakterName,sessionId:b.sessionId,serverRegion:b.serverRegion,serverKennung:b.serverKennung,map:b.map,characterGold:b.characterGold,bankGold:b.bankGold,allPack,allInv}));
 function enrich(k){
  if(!k)return null;const pack=packs.find(x=>x.pack===k.pack);
  const packRest=hash(pack.slots.map((x,i)=>i===k.bankSlot?i+":<transfer>":i+":"+(x?.fingerprint||"_")).join("|"));
  const invRest=hash(inventory.map((x,i)=>i===k.inventorySlot?i+":<transfer>":i+":"+(x?.fingerprint||"_")).join("|"));
  return Object.freeze({...k,packRestFingerprint:packRest,inventoryRestFingerprint:invRest});
 }
 return Object.freeze({schemaVersion:1,accountId:b.accountId,charakterName:b.charakterName,sessionId:b.sessionId,ctype:b.ctype,map:b.map,serverRegion:b.serverRegion,serverKennung:b.serverKennung,
  bankGemountet:true,bridgeFunctionAvailable:true,codeActive:b.codeActive===true,characterGold:b.characterGold,bankGold:b.bankGold,inventoryCapacity:b.inventoryCapacity,beobachtetAmMs:zeit,
  fingerprint,beobachtetePacks:Object.freeze(packs.map(x=>x.pack)),retrieveKandidat:enrich(retrieve),storeKandidat:enrich(store)});
}
function gleicheIdentitaet(a,b){return a.accountId===b.accountId&&a.charakterName===b.charakterName&&a.sessionId===b.sessionId&&a.serverRegion===b.serverRegion&&a.serverKennung===b.serverKennung}
function mode(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_MODUS_UNGUELTIG");return x}
function kandidat(s,m){return m==="RETRIEVE"?s.retrieveKandidat:s.storeKandidat}
function kandidatGleich(a,b){return !!a&&!!b&&a.pack===b.pack&&a.bankSlot===b.bankSlot&&a.inventorySlot===b.inventorySlot&&a.item?.fingerprint===b.item?.fingerprint}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function beobachteBankItemTransferRohReadOnly(session,contextId){if(!session||typeof session.evaluate!=="function"||!Number.isInteger(contextId))throw new Error("BANK_ITEM_TRANSFER_CDP_KONTEXT_UNGUELTIG");return basis(await session.evaluate(EXPR,contextId))}
export function validiereBankItemTransferAusgangsBeobachtung(v){
 const b=basis(v);if(b.bewegtSich)throw new Error("BANK_ITEM_TRANSFER_START_CHARACTER_BEWEGT_SICH");if(b.queueAktiv)throw new Error("BANK_ITEM_TRANSFER_START_CHARACTER_QUEUE_AKTIV");if(b.bankGemountet)throw new Error("BANK_ITEM_TRANSFER_START_MUSS_AUSSERHALB_BANK_SEIN");return Object.freeze({...b});
}
export function validiereBankItemTransferMountBeobachtung(v,ausgang,zeit,modus,erwarteterKandidat=null){
 const m=mode(modus),snap=mounted(v,zeit);if(!gleicheIdentitaet(snap,ausgang))throw new Error("BANK_"+m+"_BINDUNG_DRIFT");const k=kandidat(snap,m);if(!k)throw new Error("BANK_"+m+"_KEIN_SICHERER_KANDIDAT");if(erwarteterKandidat&&!kandidatGleich(k,erwarteterKandidat))throw new Error("BANK_"+m+"_KANDIDAT_DRIFT");return snap;
}
export function validiereBankItemTransferExplizitenKandidaten(v,ausgang,zeit,modus,erwartet){
 const m=mode(modus),b=basis(v),snap=mounted(v,zeit);if(!gleicheIdentitaet(snap,ausgang))throw new Error("BANK_"+m+"_EXPLIZIT_BINDUNG_DRIFT");
 if(!erwartet||typeof erwartet!=="object"||!/^items[0-9]+$/.test(String(erwartet.pack||""))
   ||!Number.isInteger(erwartet.bankSlot)||erwartet.bankSlot<0||erwartet.bankSlot>41
   ||!Number.isInteger(erwartet.inventorySlot)||erwartet.inventorySlot<0||erwartet.inventorySlot>=b.inventoryCapacity
   ||!erwartet.item||typeof erwartet.item!=="object"||typeof erwartet.item.name!=="string"
   ||!/^[a-f0-9]{64}$/i.test(String(erwartet.item.fingerprint||"")))throw new Error("BANK_"+m+"_EXPLIZIT_KANDIDAT_UNGUELTIG");
 const row=b.packs.find(x=>String(x?.pack||"")===erwartet.pack&&String(x?.packMap||"")===b.map);if(!row)throw new Error("BANK_"+m+"_EXPLIZIT_PACK_MOUNT_DRIFT");
 const bankRaw=row.slots[erwartet.bankSlot]??null,invRaw=b.inventory[erwartet.inventorySlot]??null,bankItem=itemInfo(bankRaw),invItem=itemInfo(invRaw);
 const transfer=m==="RETRIEVE"?bankItem:invItem,leer=m==="RETRIEVE"?invItem:bankItem;
 if(!transfer||leer!==null||transfer.name!==erwartet.item.name||transfer.fingerprint!==erwartet.item.fingerprint)throw new Error("BANK_"+m+"_EXPLIZIT_SLOT_PRESTATE_DRIFT");
 if(transfer.placeholder===true||transfer.name==="placeholder")throw new Error("BANK_"+m+"_EXPLIZIT_PLACEHOLDER_BLOCKIERT");
 if(m==="STORE"&&(transfer.blocked===true||transfer.hasM===true||transfer.hasV===true))throw new Error("BANK_STORE_EXPLIZIT_METADATEN_BLOCKIERT");
 const packInfos=row.slots.slice(0,42).map(itemInfo),invInfos=Array.from({length:b.inventoryCapacity},(_,i)=>itemInfo(b.inventory[i]??null));
 const packRestFingerprint=hash(packInfos.map((x,i)=>i===erwartet.bankSlot?i+":<transfer>":i+":"+(x?.fingerprint||"_")).join("|"));
 const inventoryRestFingerprint=hash(invInfos.map((x,i)=>i===erwartet.inventorySlot?i+":<transfer>":i+":"+(x?.fingerprint||"_")).join("|"));
 return Object.freeze({...snap,expliziterKandidat:Object.freeze({schemaVersion:1,richtung:m,pack:erwartet.pack,bankSlot:erwartet.bankSlot,inventorySlot:erwartet.inventorySlot,
  item:Object.freeze({name:transfer.name,fingerprint:transfer.fingerprint}),packRestFingerprint,inventoryRestFingerprint,characterGold:snap.characterGold,bankGold:snap.bankGold})});
}
export async function warteAufManuellenBankItemTransferMountReadOnly(session,contextId,ausgang,modus,erwarteterKandidat,{timeoutMs=90_000,pollMs=500,onPhase=()=>{}}={}){
 const m=mode(modus),start=Date.now();let letzter=null;onPhase("LEASE_ERWORBEN_BANK_MANUELL_BETRETEN");
 while(Date.now()-start<=timeoutMs){const roh=await beobachteBankItemTransferRohReadOnly(session,contextId);if(!gleicheIdentitaet(roh,ausgang))throw new Error("BANK_"+m+"_MOUNT_BINDUNG_DRIFT");
  if(roh.bankGemountet){
   const snap=erwarteterKandidat
    ?validiereBankItemTransferExplizitenKandidaten(roh,ausgang,Date.now(),m,erwarteterKandidat)
    :validiereBankItemTransferMountBeobachtung(roh,ausgang,Date.now(),m,null);
   const k=snap.expliziterKandidat??kandidat(snap,m);const key=snap.fingerprint+":"+k.pack+":"+k.bankSlot+":"+k.inventorySlot+":"+k.item.fingerprint;
   if(letzter===key){onPhase("BANK_"+m+"_MOUNT_STABIL_BEOBACHTET");return snap}letzter=key;
  }else letzter=null;await sleep(pollMs)}
 throw new Error("BANK_"+m+"_MANUELLER_MOUNT_TIMEOUT");
}
export async function warteAufStabilenBankItemTransferStartAusserhalbBankReadOnly(session,contextId,{timeoutMs=90_000,pollMs=500,onPhase=()=>{}}={}){
 const start=Date.now();let key=null;onPhase("BANK_AUSSERHALB_ERFORDERLICH");
 while(Date.now()-start<=timeoutMs){
  const raw=validiereBankItemTransferAusgangsBeobachtung(await beobachteBankItemTransferRohReadOnly(session,contextId));
  const current=hash(stable({accountId:raw.accountId,charakterName:raw.charakterName,sessionId:raw.sessionId,serverRegion:raw.serverRegion,serverKennung:raw.serverKennung,map:raw.map,inventory:raw.inventory,inventoryCapacity:raw.inventoryCapacity,characterGold:raw.characterGold}));
  if(key===current){onPhase("BANK_AUSSERHALB_STABIL");return raw}key=current;await sleep(pollMs);
 }
 throw new Error("BANK_ITEM_TRANSFER_AUSSERHALB_BANK_TIMEOUT");
}
export function erstelleBankItemTransferReleaseBeobachter(session,contextId,mountBeobachtung,modus,{timeoutMs=90_000,pollMs=500,onPhase=()=>{}}={}){
 const m=mode(modus);return Object.freeze({async beobachte(){const start=Date.now();onPhase("BANK_"+m+"_BANK_MANUELL_VERLASSEN");
  while(Date.now()-start<=timeoutMs){const roh=await beobachteBankItemTransferRohReadOnly(session,contextId);if(!gleicheIdentitaet(roh,mountBeobachtung))throw new Error("BANK_"+m+"_EXIT_BINDUNG_DRIFT");
   if(!roh.bankGemountet&&!roh.bewegtSich&&!roh.queueAktiv){onPhase("BANK_"+m+"_EXIT_STABIL_BEOBACHTET");return Object.freeze({offeneTransaktionen:0,backendInProgress:false,bankActionInFlight:false,characterBankAktiv:false,erwarteterExitBeobachtet:true})}
   await sleep(pollMs)}throw new Error("BANK_"+m+"_MANUELLER_EXIT_TIMEOUT")}})
}
export function validiereBankItemTransferPreflightBeobachtung(v,zeit=Date.now()){return mounted(v,zeit)}
export async function beobachteBankItemTransferPreflightReadOnly(session,contextId){return mounted(await session.evaluate(EXPR,contextId),Date.now())}

export function erstelleBankItemTransferBindungExplizit(v,ausgang,zeit,modusWert,erwartet,leaseEpoche,mountEpoche){
 const m=mode(modusWert),b=basis(v);
 if(b.bewegtSich||b.queueAktiv)throw new Error("BANK_"+m+"_BEOBACHTER_NICHT_IDLE");
 if(!b.bankGemountet||!Number.isSafeInteger(b.bankGold)||b.bankGold<0)throw new Error("BANK_"+m+"_BEOBACHTER_BANK_NICHT_BEREIT");
 if(!gleicheIdentitaet(b,ausgang))throw new Error("BANK_"+m+"_BEOBACHTER_BINDUNG_DRIFT");
 if(!Number.isSafeInteger(leaseEpoche)||leaseEpoche<1||!Number.isSafeInteger(mountEpoche)||mountEpoche<0)throw new Error("BANK_"+m+"_BEOBACHTER_EPOCHE_UNGUELTIG");
 if(!erwartet||typeof erwartet!=="object"||!/^items[0-9]+$/.test(String(erwartet.pack||""))
   ||!Number.isInteger(erwartet.bankSlot)||erwartet.bankSlot<0||erwartet.bankSlot>41
   ||!Number.isInteger(erwartet.inventorySlot)||erwartet.inventorySlot<0||erwartet.inventorySlot>=b.inventoryCapacity
   ||!erwartet.item||typeof erwartet.item.name!=="string"||!/^[a-f0-9]{64}$/i.test(String(erwartet.item.fingerprint||"")))
   throw new Error("BANK_"+m+"_BEOBACHTER_KANDIDAT_UNGUELTIG");
 const rawPack=b.packs.find(x=>String(x?.pack||"")===erwartet.pack&&String(x?.packMap||"")===b.map);
 if(!rawPack)throw new Error("BANK_"+m+"_BEOBACHTER_PACK_DRIFT");
 const packs=[];
 for(const row of b.packs){
  if(!row||typeof row!=="object"||!/^items[0-9]+$/.test(String(row.pack||""))||!Array.isArray(row.slots)||row.slots.length>42)throw new Error("BANK_"+m+"_BEOBACHTER_PACK_UNGUELTIG");
  if(String(row.packMap||"")!==b.map)continue;
  packs.push(Object.freeze({pack:String(row.pack),slots:Object.freeze(row.slots.map(itemInfo))}));
 }
 const pack=packs.find(x=>x.pack===erwartet.pack);if(!pack)throw new Error("BANK_"+m+"_BEOBACHTER_PACK_NICHT_GEMOUNTET");
 const inv=Object.freeze(Array.from({length:b.inventoryCapacity},(_,i)=>itemInfo(b.inventory[i]??null)));
 const bankItem=pack.slots[erwartet.bankSlot]??null,invItem=inv[erwartet.inventorySlot]??null;
 const eq=x=>x!==null&&x.name===erwartet.item.name&&x.fingerprint===erwartet.item.fingerprint;
 const pre=m==="RETRIEVE"?(eq(bankItem)&&invItem===null):(bankItem===null&&eq(invItem));
 const post=m==="RETRIEVE"?(bankItem===null&&eq(invItem)):(eq(bankItem)&&invItem===null);
 if(!pre&&!post)throw new Error("BANK_"+m+"_BEOBACHTER_SLOT_DRIFT");
 const packRestFingerprint=hash(pack.slots.map((x,i)=>i===erwartet.bankSlot?i+":<transfer>":i+":"+(x?.fingerprint||"_")).join("|"));
 const inventoryRestFingerprint=hash(inv.map((x,i)=>i===erwartet.inventorySlot?i+":<transfer>":i+":"+(x?.fingerprint||"_")).join("|"));
 const allPack=hash(stable(packs.map(p=>({pack:p.pack,slots:p.slots.map(x=>x?.fingerprint||null)}))));
 const allInv=hash(stable(inv.map(x=>x?.fingerprint||null)));
 const fingerprint=hash(stable({accountId:b.accountId,charakterName:b.charakterName,sessionId:b.sessionId,serverRegion:b.serverRegion,serverKennung:b.serverKennung,map:b.map,characterGold:b.characterGold,bankGold:b.bankGold,allPack,allInv}));
 return Object.freeze({schemaVersion:1,richtung:m,characterId:b.charakterName,sessionId:b.sessionId,serverRegion:b.serverRegion,serverKennung:b.serverKennung,
  leaseEpoche,mountEpoche,beobachtetAmMs:zeit,bankPack:erwartet.pack,bankSlot:erwartet.bankSlot,inventorySlot:erwartet.inventorySlot,inventoryCapacity:b.inventoryCapacity,
  transferItem:Object.freeze({name:erwartet.item.name,fingerprint:erwartet.item.fingerprint}),bankSlotItem:bankItem===null?null:Object.freeze({name:bankItem.name,fingerprint:bankItem.fingerprint}),
  inventorySlotItem:invItem===null?null:Object.freeze({name:invItem.name,fingerprint:invItem.fingerprint}),packRestFingerprint,inventoryRestFingerprint,
  characterGold:b.characterGold,bankGold:b.bankGold,fingerprint,beobachtungsPhase:pre?"PRESTATE":"POSTSTATE"});
}
export function erstelleProduktivenBankItemTransferBeobachter(session,contextId,ausgang,modusWert,erwartet){
 const m=mode(modusWert);return Object.freeze({async beobachte(leaseEpoche,mountEpoche){
  const roh=await beobachteBankItemTransferRohReadOnly(session,contextId);
  return erstelleBankItemTransferBindungExplizit(roh,ausgang,Date.now(),m,erwartet,leaseEpoche,mountEpoche);
 }});
}

export const BANK_ITEM_TRANSFER_PREFLIGHT_BROWSER_READ_ONLY=true;
export const BANK_ITEM_TRANSFER_PREFLIGHT_GAMEPLAY_WRITES=0;
export const BANK_ITEM_TRANSFER_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS=0;
export const BANK_ITEM_TRANSFER_REAL_SHADOW_GAMEPLAY_WRITES=0;
