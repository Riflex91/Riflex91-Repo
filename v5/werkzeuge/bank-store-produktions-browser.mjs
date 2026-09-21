import crypto from "node:crypto";

const READ_ONLY_BANK_STORE_EXPR = [
  "(() => {",
  "  const roots=[globalThis];",
  "  try { if(globalThis.parent&&globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root=null;",
  "  for(const kandidat of roots){ try { if(kandidat&&kandidat.character){ root=kandidat; break; } } catch {} }",
  "  if(!root) return {status:'BLOCKIERT',grund:'BANK_STORE_SPIELKONTEXT_FEHLT'};",
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
  "  const canon=(value)=>{",
  "    if(value===null||value===undefined) return value===undefined?'__undefined__':null;",
  "    if(Array.isArray(value)) return value.map(canon);",
  "    if(typeof value==='object'){ const o={}; for(const k of Object.keys(value).sort()) o[k]=canon(value[k]); return o; }",
  "    if(typeof value==='number'||typeof value==='string'||typeof value==='boolean') return value;",
  "    return String(value);",
  "  };",
  "  const itemMaterial=(item)=>item&&typeof item==='object'?JSON.stringify(canon(item)):null;",
  "  const items=Array.isArray(c.items)?c.items.slice(0,42):[];",
  "  const inventoryMaterial=JSON.stringify(items.map(item=>itemMaterial(item)));",
  "  const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;",
  "  const packs={};",
  "  if(bank){",
  "    for(const key of Object.keys(bank).filter(k=>/^items[0-9]+$/.test(k)).sort((a,b)=>Number(a.slice(5))-Number(b.slice(5)))){",
  "      const arr=Array.isArray(bank[key])?bank[key].slice(0,42):[];",
  "      packs[key]=arr.map(item=>itemMaterial(item));",
  "    }",
  "  }",
  "  const bankMaterial=JSON.stringify(packs);",
  "  let sourceSlot=null,sourceItemMaterial=null;",
  "  for(let i=0;i<items.length;i++){",
  "    const item=items[i];",
  "    if(!item||typeof item!=='object') continue;",
  "    if(item.l===true) continue;",
  "    sourceSlot=i; sourceItemMaterial=itemMaterial(item); break;",
  "  }",
  "  let targetPack=null,targetSlot=null;",
  "  for(const key of Object.keys(packs)){",
  "    const arr=packs[key];",
  "    for(let i=0;i<Math.min(42,arr.length||42);i++){",
  "      if((arr[i]??null)===null){ targetPack=key; targetSlot=i; break; }",
  "    }",
  "    if(targetPack!==null) break;",
  "  }",
  "  return {",
  "    status:'OK',",
  "    accountId,",
  "    charakterName:String(c.name||''),",
  "    sessionId:String(c.id||''),",
  "    ctype:String(c.ctype||c.type||'').toLowerCase(),",
  "    map:String(c.map||''),",
  "    serverRegion,serverKennung,",
  "    rip:c.rip===true,",
  "    bewegtSich:c.moving===true,",
  "    queueAktiv:!!(c.q&&typeof c.q==='object'&&Object.keys(c.q).length),",
  "    alternativeRuntimeAktiv,",
  "    bankGemountet:!!bank,",
  "    inventoryMaterial,bankMaterial,",
  "    sourceSlot,sourceItemMaterial,targetPack,targetSlot,",
  "    targetItemMaterial:null",
  "  };",
  "})()",
].join("\n");

function text(wert,max,fehler){
  if(typeof wert!=="string"||wert.trim().length===0||wert.length>max) throw new Error(fehler);
}
function hash(wert){
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}
function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

function validiereBasis(value){
  if(!value||typeof value!=="object"||value.status!=="OK"){
    throw new Error(String(value?.grund||"BANK_STORE_BEOBACHTUNG_UNGUELTIG"));
  }
  text(value.accountId,192,"BANK_STORE_ACCOUNT_BINDUNG_FEHLT");
  text(value.charakterName,192,"BANK_STORE_CHARACTER_BINDUNG_FEHLT");
  text(value.sessionId,192,"BANK_STORE_SESSION_BINDUNG_FEHLT");
  text(value.serverRegion,32,"BANK_STORE_SERVER_REGION_FEHLT");
  text(value.serverKennung,32,"BANK_STORE_SERVER_KENNUNG_FEHLT");
  if(value.ctype!=="merchant") throw new Error("BANK_STORE_MERCHANT_ERFORDERLICH");
  if(value.rip===true) throw new Error("BANK_STORE_CHARACTER_TOT");
  if(value.alternativeRuntimeAktiv===true) throw new Error("BANK_STORE_ALTERNATIVE_RUNTIME_AKTIV");
  if(typeof value.inventoryMaterial!=="string"||value.inventoryMaterial.length>200_000){
    throw new Error("BANK_STORE_INVENTORY_BEOBACHTUNG_UNGUELTIG");
  }
  if(typeof value.bankMaterial!=="string"||value.bankMaterial.length>2_000_000){
    throw new Error("BANK_STORE_BANK_BEOBACHTUNG_UNGUELTIG");
  }
  return Object.freeze({...value});
}

function gleicheBindung(a,b){
  return a.accountId===b.accountId
    && a.charakterName===b.charakterName
    && a.sessionId===b.sessionId
    && a.serverRegion===b.serverRegion
    && a.serverKennung===b.serverKennung
    && a.ctype===b.ctype;
}

function shadowBeobachtung(value,beobachtetAmMs){
  const basis=validiereBasis(value);
  if(!Number.isSafeInteger(beobachtetAmMs)||beobachtetAmMs<0){
    throw new Error("BANK_STORE_SHADOW_BEOBACHTUNGSZEIT_UNGUELTIG");
  }
  const inventorySha256=hash(basis.inventoryMaterial);
  const bankSha256=hash(basis.bankMaterial);
  return Object.freeze({
    ...basis,
    beobachtetAmMs,
    inventorySha256,
    bankSha256,
    fingerprint:hash(JSON.stringify({
      accountId:basis.accountId,
      charakterName:basis.charakterName,
      sessionId:basis.sessionId,
      serverRegion:basis.serverRegion,
      serverKennung:basis.serverKennung,
      map:basis.map,
      bankGemountet:basis.bankGemountet,
      inventorySha256,
      bankSha256,
      sourceSlot:basis.sourceSlot,
      targetPack:basis.targetPack,
      targetSlot:basis.targetSlot,
    })),
  });
}

export function validiereBankStoreShadowAusgangsBeobachtung(value){
  const basis=validiereBasis(value);
  if(basis.bewegtSich===true) throw new Error("BANK_STORE_SHADOW_START_CHARACTER_BEWEGT_SICH");
  if(basis.queueAktiv===true) throw new Error("BANK_STORE_SHADOW_START_CHARACTER_QUEUE_AKTIV");
  if(basis.bankGemountet===true) throw new Error("BANK_STORE_SHADOW_START_MUSS_AUSSERHALB_BANK_SEIN");
  return Object.freeze({...basis});
}

export function validiereBankStoreShadowMountBeobachtung(value,ausgang,beobachtetAmMs){
  const basis=shadowBeobachtung(value,beobachtetAmMs);
  if(!gleicheBindung(basis,ausgang)) throw new Error("BANK_STORE_SHADOW_BINDUNG_DRIFT");
  if(basis.bankGemountet!==true) throw new Error("BANK_STORE_SHADOW_BANK_NOCH_NICHT_GEMOUNTET");
  if(basis.bewegtSich===true||basis.queueAktiv===true) throw new Error("BANK_STORE_SHADOW_MOUNT_NOCH_NICHT_STABIL");
  if(!Number.isSafeInteger(basis.sourceSlot)||basis.sourceSlot<0||basis.sourceSlot>41
      ||typeof basis.sourceItemMaterial!=="string"||basis.sourceItemMaterial.length<2){
    throw new Error("BANK_STORE_SOURCE_ITEM_FEHLT");
  }
  if(typeof basis.targetPack!=="string"||!/^items[0-9]+$/.test(basis.targetPack)
      ||!Number.isSafeInteger(basis.targetSlot)||basis.targetSlot<0||basis.targetSlot>41
      ||basis.targetItemMaterial!==null){
    throw new Error("BANK_STORE_LEERER_TARGET_SLOT_FEHLT");
  }
  return Object.freeze({
    ...basis,
    sourceItemFingerprint:hash(basis.sourceItemMaterial),
    targetItemFingerprint:null,
  });
}

export async function beobachteBankStoreRohReadOnly(session,contextId){
  if(!session||typeof session.evaluate!=="function"||!Number.isInteger(contextId)){
    throw new Error("BANK_STORE_CDP_KONTEXT_UNGUELTIG");
  }
  return validiereBasis(await session.evaluate(READ_ONLY_BANK_STORE_EXPR,contextId));
}

export async function warteAufStabilenBankStoreStartAusserhalbReadOnly(
  session,contextId,{timeoutMs=90_000,pollMs=500,onPhase=()=>{}}={}
){
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>300_000) throw new Error("BANK_STORE_START_TIMEOUT_UNGUELTIG");
  if(!Number.isSafeInteger(pollMs)||pollMs<100||pollMs>5_000) throw new Error("BANK_STORE_START_POLL_UNGUELTIG");
  const start=Date.now();
  let bindung=null,kandidat=null,hinweis=false;
  while(Date.now()-start<=timeoutMs){
    const roh=await beobachteBankStoreRohReadOnly(session,contextId);
    if(bindung!==null&&!gleicheBindung(roh,bindung)) throw new Error("BANK_STORE_START_BINDUNG_DRIFT");
    if(bindung===null) bindung=roh;
    if(roh.bankGemountet===true){
      kandidat=null;
      if(!hinweis){ onPhase("START_BANK_AKTIV_BANK_MANUELL_VERLASSEN"); hinweis=true; }
    }else if(roh.bewegtSich!==true&&roh.queueAktiv!==true){
      const next=validiereBankStoreShadowAusgangsBeobachtung(roh);
      if(kandidat!==null){
        onPhase("START_AUSSERHALB_BANK_STABIL_BEOBACHTET");
        return next;
      }
      kandidat=next;
    }else kandidat=null;
    await sleep(pollMs);
  }
  throw new Error("BANK_STORE_START_AUSSERHALB_TIMEOUT");
}

export async function warteAufManuellenBankStoreMountReadOnly(
  session,contextId,ausgang,{timeoutMs=90_000,pollMs=500,onPhase=()=>{}}={}
){
  const start=Date.now();
  onPhase("LEASE_ERWORBEN_BANK_MANUELL_BETRETEN");
  let kandidat=null;
  while(Date.now()-start<=timeoutMs){
    const roh=await beobachteBankStoreRohReadOnly(session,contextId);
    if(!gleicheBindung(roh,ausgang)) throw new Error("BANK_STORE_SHADOW_BINDUNG_DRIFT");
    if(roh.bankGemountet===true){
      const next=validiereBankStoreShadowMountBeobachtung(roh,ausgang,Date.now());
      if(kandidat!==null&&kandidat.fingerprint===next.fingerprint
          &&kandidat.sourceItemFingerprint===next.sourceItemFingerprint
          &&kandidat.targetPack===next.targetPack
          &&kandidat.targetSlot===next.targetSlot){
        onPhase("BANK_STORE_KANDIDAT_STABIL_BEOBACHTET");
        return next;
      }
      kandidat=next;
    }else kandidat=null;
    await sleep(pollMs);
  }
  throw new Error("BANK_STORE_SHADOW_MANUELLER_MOUNT_TIMEOUT");
}

export function erstelleBankStoreShadowReleaseBeobachter(
  session,contextId,mountBeobachtung,{timeoutMs=90_000,pollMs=500,onPhase=()=>{}}={}
){
  return Object.freeze({
    async beobachte(){
      const start=Date.now();
      onPhase("ADMISSION_BESTANDEN_BANK_MANUELL_VERLASSEN");
      while(Date.now()-start<=timeoutMs){
        const roh=await beobachteBankStoreRohReadOnly(session,contextId);
        if(!gleicheBindung(roh,mountBeobachtung)) throw new Error("BANK_STORE_SHADOW_EXIT_BINDUNG_DRIFT");
        if(roh.bankGemountet!==true&&roh.bewegtSich!==true&&roh.queueAktiv!==true){
          onPhase("BANK_EXIT_STABIL_BEOBACHTET");
          return Object.freeze({
            offeneTransaktionen:0,
            backendInProgress:false,
            bankActionInFlight:false,
            characterBankAktiv:false,
            erwarteterExitBeobachtet:true,
          });
        }
        await sleep(pollMs);
      }
      throw new Error("BANK_STORE_SHADOW_MANUELLER_EXIT_TIMEOUT");
    },
  });
}

export const BANK_STORE_REAL_SHADOW_BROWSER_READ_ONLY=true;
export const BANK_STORE_REAL_SHADOW_GAMEPLAY_WRITES=0;
