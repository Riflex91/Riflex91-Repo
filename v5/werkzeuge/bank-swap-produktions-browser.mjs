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
  "    bridgeFunctionAvailable,",
  "    codeActive,",
  "    characterGold:Number.isSafeInteger(characterGold)&&characterGold>=0?characterGold:null,",
  "    bankGold:Number.isSafeInteger(bankGold)&&bankGold>=0?bankGold:null,",
  "    inventory:Array.isArray(c.items)?c.items.slice(0,64):null,",
  "    packs",
  "  };",
  "})()",
].join("\n");

function text(wert, max, fehler) {
  if (typeof wert !== "string" || wert.trim().length === 0 || wert.length > max) {
    throw new Error(fehler);
  }
}

function stable(wert, tiefe = 0) {
  if (tiefe > 12) throw new Error("BANK_SWAP_BEOBACHTUNG_ZU_TIEF");
  if (wert === null || typeof wert === "string" || typeof wert === "boolean") {
    return JSON.stringify(wert);
  }
  if (typeof wert === "number") {
    if (!Number.isFinite(wert)) throw new Error("BANK_SWAP_BEOBACHTUNG_ZAHL_UNGUELTIG");
    return JSON.stringify(wert);
  }
  if (Array.isArray(wert)) {
    return "[" + wert.map(x => stable(x, tiefe + 1)).join(",") + "]";
  }
  if (typeof wert === "object") {
    const keys = Object.keys(wert).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + stable(wert[k], tiefe + 1)).join(",") + "}";
  }
  throw new Error("BANK_SWAP_BEOBACHTUNG_TYP_UNGUELTIG");
}

function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}

function item(item) {
  if (item === null) return null;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("BANK_SWAP_BANK_ITEM_UNGUELTIG");
  }
  text(String(item.name || ""), 192, "BANK_SWAP_BANK_ITEM_NAME_FEHLT");
  const material = stable(item);
  if (material.length > 20_000) throw new Error("BANK_SWAP_BANK_ITEM_ZU_GROSS");
  return Object.freeze({
    name: String(item.name),
    fingerprint: hash(material),
    placeholder: String(item.name) === "placeholder",
    material,
  });
}

export function validiereBankSwapPreflightBeobachtung(
  value,
  beobachtetAmMs = Date.now(),
) {
  if (!value || typeof value !== "object" || value.status !== "OK") {
    throw new Error(String(value?.grund || "BANK_SWAP_BEOBACHTUNG_UNGUELTIG"));
  }
  text(value.accountId, 192, "BANK_SWAP_ACCOUNT_BINDUNG_FEHLT");
  text(value.charakterName, 192, "BANK_SWAP_CHARACTER_BINDUNG_FEHLT");
  text(value.sessionId, 192, "BANK_SWAP_SESSION_BINDUNG_FEHLT");
  text(value.serverRegion, 32, "BANK_SWAP_SERVER_REGION_FEHLT");
  text(value.serverKennung, 32, "BANK_SWAP_SERVER_KENNUNG_FEHLT");
  text(value.map, 96, "BANK_SWAP_MAP_FEHLT");
  if (value.ctype !== "merchant") throw new Error("BANK_SWAP_MERCHANT_ERFORDERLICH");
  if (value.rip === true) throw new Error("BANK_SWAP_CHARACTER_TOT");
  if (value.bewegtSich === true) throw new Error("BANK_SWAP_CHARACTER_BEWEGT_SICH");
  if (value.queueAktiv === true) throw new Error("BANK_SWAP_CHARACTER_QUEUE_AKTIV");
  if (value.alternativeRuntimeAktiv === true) throw new Error("BANK_SWAP_ALTERNATIVE_RUNTIME_AKTIV");
  if (value.bankGemountet !== true) throw new Error("BANK_SWAP_BANK_NICHT_GEMOUNTET");
  if (value.bridgeFunctionAvailable !== true) {
    throw new Error("BANK_SWAP_CODE_BRIDGE_FEHLT");
  }
  if (!Number.isSafeInteger(value.characterGold) || value.characterGold < 0) {
    throw new Error("BANK_SWAP_CHARACTER_GOLD_NICHT_LESBAR");
  }
  if (!Number.isSafeInteger(value.bankGold) || value.bankGold < 0) {
    throw new Error("BANK_SWAP_BANK_GOLD_NICHT_LESBAR");
  }
  if (!Number.isSafeInteger(beobachtetAmMs) || beobachtetAmMs < 0) {
    throw new Error("BANK_SWAP_BEOBACHTUNGSZEIT_UNGUELTIG");
  }
  if (!Array.isArray(value.inventory) || value.inventory.length > 64) {
    throw new Error("BANK_SWAP_INVENTORY_UNGUELTIG");
  }
  if (!Array.isArray(value.packs) || value.packs.length < 1 || value.packs.length > 64) {
    throw new Error("BANK_SWAP_BANK_PACKS_UNGUELTIG");
  }

  const packs = [];
  for (const row of value.packs) {
    if (!row || typeof row !== "object"
        || !/^items[0-9]+$/.test(String(row.pack || ""))
        || !Array.isArray(row.slots)
        || row.slots.length > 42) {
      throw new Error("BANK_SWAP_BANK_PACK_UNGUELTIG");
    }
    if (String(row.packMap || "") !== value.map) continue;
    packs.push(Object.freeze({
      pack: String(row.pack),
      slots: Object.freeze(row.slots.map(item)),
    }));
  }
  if (packs.length < 1) {
    throw new Error("BANK_SWAP_KEIN_PACK_AM_AKTUELLEN_BANK_MOUNT");
  }

  const kandidat = waehleBankSwapErstenKandidaten(packs);
  if (kandidat === null) {
    throw new Error("BANK_SWAP_KEIN_SICHERER_ZWEI_SLOT_KANDIDAT");
  }
  const zielPack = packs.find(x => x.pack === kandidat.pack);
  const restMaterial = zielPack.slots
    .map((x, index) => index === kandidat.a || index === kandidat.b
      ? index + ":<swap>"
      : index + ":" + (x?.fingerprint || "_"))
    .join("|");
  const inventoryMaterial = stable(value.inventory);
  if (inventoryMaterial.length > 200_000) {
    throw new Error("BANK_SWAP_INVENTORY_ZU_GROSS");
  }
  const packFingerprints = packs.map(p => ({
    pack: p.pack,
    slots: p.slots.map(x => x?.fingerprint || null),
  }));
  const fingerprint = hash(stable({
    accountId: value.accountId,
    charakterName: value.charakterName,
    sessionId: value.sessionId,
    serverRegion: value.serverRegion,
    serverKennung: value.serverKennung,
    map: value.map,
    characterGold: value.characterGold,
    bankGold: value.bankGold,
    inventorySha256: hash(inventoryMaterial),
    packs: packFingerprints,
  }));

  return Object.freeze({
    schemaVersion: 1,
    accountId: value.accountId,
    charakterName: value.charakterName,
    sessionId: value.sessionId,
    ctype: value.ctype,
    map: value.map,
    serverRegion: value.serverRegion,
    serverKennung: value.serverKennung,
    bankGemountet: true,
    bridgeFunctionAvailable: true,
    codeActive: value.codeActive === true,
    characterGold: value.characterGold,
    bankGold: value.bankGold,
    inventorySha256: hash(inventoryMaterial),
    beobachtetAmMs,
    fingerprint,
    kandidat: Object.freeze({
      ...kandidat,
      packRestFingerprint: hash(restMaterial),
    }),
    beobachtetePacks: Object.freeze(packs.map(x => x.pack)),
  });
}

export async function beobachteBankSwapPreflightReadOnly(session, contextId) {
  if (!session || typeof session.evaluate !== "function" || !Number.isInteger(contextId)) {
    throw new Error("BANK_SWAP_CDP_KONTEXT_UNGUELTIG");
  }
  return validiereBankSwapPreflightBeobachtung(
    await session.evaluate(READ_ONLY_BANK_SWAP_EXPR, contextId),
    Date.now(),
  );
}

export const BANK_SWAP_PREFLIGHT_BROWSER_READ_ONLY = true;
export const BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES = 0;
export const BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS = 0;
