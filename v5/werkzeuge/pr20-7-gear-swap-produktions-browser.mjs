import crypto from "node:crypto";

import {
  CdpSession,
  validiereLoopbackCdp,
} from "./r12-live/cdp.mjs";

const ADVENTURE_LAND_ORIGIN = "https://adventure.land";

export const PR20_7_GEAR_SAFE_OCCUPIED_SLOTS = Object.freeze([
  "cape",
  "belt",
  "amulet",
  "orb",
  "helmet",
  "gloves",
  "shoes",
  "pants",
  "chest",
]);

const SLOT_FOR_TYPE = Object.freeze(Object.fromEntries(
  PR20_7_GEAR_SAFE_OCCUPIED_SLOTS.map(slot => [slot, slot]),
));

const READ_ONLY_OBSERVATION = [
  "(() => {",
  "  const roots=[globalThis];",
  "  try { if(globalThis.parent&&globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root=null;",
  "  for(const r of roots){ try { if(r&&r.character&&r.G&&r.G.items){ root=r; break; } } catch {} }",
  "  if(!root) return {status:'BLOCKIERT',grund:'PR20_7_GEAR_SPIELKONTEXT_FEHLT'};",
  "  const c=root.character;",
  "  const stableItem=(item)=>{",
  "    if(!item||typeof item!=='object') return null;",
  "    const out={};",
  "    for(const key of Object.keys(item).sort().slice(0,64)){",
  "      const value=item[key];",
  "      if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean') out[key]=value;",
  "    }",
  "    return JSON.stringify(out);",
  "  };",
  "  let accountId='';",
  "  for(const r of roots){ try { accountId=String(r?.user_id||r?.character?.owner||''); if(accountId) break; } catch {} }",
  "  const regions=[root?.server_region,root?.server?.region];",
  "  const ids=[root?.server_identifier,root?.server?.id];",
  "  try { regions.push(root?.parent?.server_region,root?.parent?.server?.region); } catch {}",
  "  try { ids.push(root?.parent?.server_identifier,root?.parent?.server?.id); } catch {}",
  "  const serverRegion=regions.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
  "  const serverIdentifier=ids.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
  "  let alternativeRuntimeAktiv=false;",
  "  for(const r of roots){",
  "    try { const v3=r?.AIO_V3?.__runtime; const s=v3&&typeof v3.status==='function'?v3.status():null; if(v3&&(v3.timer||(s&&s.running===true))) alternativeRuntimeAktiv=true; } catch { alternativeRuntimeAktiv=true; }",
  "    try { const v4=r&&(r.AIO_V4||r.V4Runtime); const s=v4&&typeof v4.status==='function'?v4.status():null; if(s&&(s.running===true||s.aktivFreigegeben===true)) alternativeRuntimeAktiv=true; } catch { alternativeRuntimeAktiv=true; }",
  "  }",
  "  const hostile=Object.values(root.entities||{}).filter(e=>e&&e.type==='monster'&&!e.dead&&e.target===c.name).length;",
  "  const inventar=Array.isArray(c.items)?c.items.map((item,index)=>{",
  "    if(!item||!item.name) return null;",
  "    const def=root.G.items[item.name]||{};",
  "    return {index,itemMaterial:stableItem(item),name:String(item.name),level:Number(item.level||0),",
  "      typ:String(def.type||''),gesperrt:item.l===true||item.locked===true||item.lock===true,virtuellB:item.b===true};",
  "  }).filter(Boolean):[];",
  "  const slots={};",
  "  for(const slot of ['cape','belt','amulet','orb','helmet','gloves','shoes','pants','chest']){",
  "    const item=c.slots&&c.slots[slot]||null;",
  "    const def=item&&item.name?root.G.items[item.name]||{}:{};",
  "    slots[slot]=item?{slot,itemMaterial:stableItem(item),name:String(item.name),level:Number(item.level||0),",
  "      typ:String(def.type||''),gesperrt:item.l===true||item.locked===true||item.lock===true,virtuellB:item.b===true}:null;",
  "  }",
  "  return {status:'OK',accountId,charakterName:String(c.name||''),sessionId:String(c.id||''),",
  "    ctype:String(c.ctype||c.type||'').toLowerCase(),characterLevel:Number(c.level||0),map:String(c.map||''),",
  "    serverRegion,serverIdentifier,rip:c.rip===true,bewegtSich:c.moving===true,zielName:c.target==null?null:String(c.target),",
  "    feindeAufCharakter:hostile,queueAktiv:!!(c.q&&typeof c.q==='object'&&Object.keys(c.q).length),",
  "    alternativeRuntimeAktiv,inventar,slots};",
  "})()",
].join("\n");

const CHARACTER_PROBE = [
  "(() => {",
  "  const roots=[globalThis];",
  "  try { if(globalThis.parent&&globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
  "  for(const r of roots){ try { if(r&&r.character&&r.G&&r.G.items&&Array.isArray(r.character.items)&&r.character.slots) return String(r.character.name||''); } catch {} }",
  "  return '';",
  "})()",
].join("\n");

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function text(value, max, error) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    throw new Error(error);
  }
}

function materialFingerprint(material) {
  text(material, 20_000, "PR20_7_GEAR_ITEM_MATERIAL_UNGUELTIG");
  return hash(material);
}

function normalisiereItem(row, ort) {
  if (!row || typeof row !== "object") return null;
  text(row.name, 128, "PR20_7_GEAR_ITEM_NAME_UNGUELTIG");
  text(row.typ, 64, "PR20_7_GEAR_ITEM_TYP_UNGUELTIG");
  if (!Number.isSafeInteger(row.level) || row.level < 0 || row.level > 1_000) {
    throw new Error("PR20_7_GEAR_ITEM_LEVEL_UNGUELTIG");
  }
  const beobachtungsFingerprint = materialFingerprint(row.itemMaterial);
  return Object.freeze({
    ort,
    name: row.name,
    level: row.level,
    typ: row.typ,
    gesperrt: row.gesperrt === true,
    virtuellB: row.virtuellB === true,
    beobachtungsFingerprint,
  });
}

function bindingFingerprint(b) {
  return hash(JSON.stringify({
    accountId: b.accountId,
    charakterName: b.charakterName,
    sessionId: b.sessionId,
    serverRegion: b.serverRegion,
    serverIdentifier: b.serverIdentifier,
  }));
}

export function validierePr207GearRecipientBeobachtung(value) {
  if (!value || typeof value !== "object" || value.status !== "OK") {
    throw new Error(String(value?.grund || "PR20_7_GEAR_BEOBACHTUNG_UNGUELTIG"));
  }
  text(value.accountId, 192, "PR20_7_GEAR_ACCOUNT_FEHLT");
  text(value.charakterName, 192, "PR20_7_GEAR_CHARACTER_FEHLT");
  text(value.sessionId, 192, "PR20_7_GEAR_SESSION_FEHLT");
  text(value.serverRegion, 32, "PR20_7_GEAR_SERVER_REGION_FEHLT");
  text(value.serverIdentifier, 32, "PR20_7_GEAR_SERVER_IDENTIFIER_FEHLT");
  text(value.ctype, 32, "PR20_7_GEAR_CTYPE_FEHLT");
  if (!Number.isSafeInteger(value.characterLevel) || value.characterLevel < 1) {
    throw new Error("PR20_7_GEAR_CHARACTER_LEVEL_UNGUELTIG");
  }
  if (value.rip === true) throw new Error("PR20_7_GEAR_CHARACTER_TOT");
  if (value.bewegtSich === true) throw new Error("PR20_7_GEAR_CHARACTER_BEWEGT_SICH");
  if (value.zielName !== null) throw new Error("PR20_7_GEAR_CHARACTER_HAT_ZIEL");
  if (value.feindeAufCharakter !== 0) throw new Error("PR20_7_GEAR_CHARACTER_UNTER_ANGRIFF");
  if (value.queueAktiv === true) throw new Error("PR20_7_GEAR_CHARACTER_QUEUE_AKTIV");
  if (value.alternativeRuntimeAktiv === true) {
    throw new Error("PR20_7_GEAR_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (!Array.isArray(value.inventar) || value.inventar.length > 128) {
    throw new Error("PR20_7_GEAR_INVENTAR_UNGUELTIG");
  }
  if (!value.slots || typeof value.slots !== "object") {
    throw new Error("PR20_7_GEAR_SLOTS_UNGUELTIG");
  }
  return Object.freeze({
    ...value,
    bindingFingerprint: bindingFingerprint(value),
  });
}

export function waehlePr207GearOccupiedCandidate(
  observation,
  { inventoryIndex = null, slot = null } = {},
) {
  const b = validierePr207GearRecipientBeobachtung(observation);
  if (inventoryIndex !== null
      && (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= 128)) {
    throw new Error("PR20_7_GEAR_KANDIDAT_INDEX_UNGUELTIG");
  }
  if (slot !== null && !PR20_7_GEAR_SAFE_OCCUPIED_SLOTS.includes(slot)) {
    throw new Error("PR20_7_GEAR_SLOT_FILTER_UNGUELTIG");
  }

  const candidates = [];
  for (const row of b.inventar) {
    if (!Number.isInteger(row.index) || row.index < 0 || row.index >= 128) continue;
    if (inventoryIndex !== null && row.index !== inventoryIndex) continue;
    const targetSlot = SLOT_FOR_TYPE[String(row.typ || "")];
    if (!targetSlot || (slot !== null && targetSlot !== slot)) continue;
    const previousRaw = b.slots[targetSlot] ?? null;
    if (previousRaw === null) continue;

    const kandidat = normalisiereItem(row, "inventory:" + row.index);
    const vorherigesSlotItem = normalisiereItem(previousRaw, "slot:" + targetSlot);
    if (kandidat === null || vorherigesSlotItem === null) continue;
    if (kandidat.gesperrt || kandidat.virtuellB) continue;
    if (vorherigesSlotItem.gesperrt || vorherigesSlotItem.virtuellB) continue;
    if (kandidat.typ !== targetSlot || vorherigesSlotItem.typ !== targetSlot) continue;
    if (kandidat.beobachtungsFingerprint === vorherigesSlotItem.beobachtungsFingerprint) continue;

    const restInventarFingerprint = hash(JSON.stringify(
      b.inventar
        .filter(x => x.index !== row.index)
        .map(x => [x.index, x.itemMaterial]),
    ));
    const restEquipmentFingerprint = hash(JSON.stringify(
      PR20_7_GEAR_SAFE_OCCUPIED_SLOTS
        .filter(x => x !== targetSlot)
        .map(x => [x, b.slots[x]?.itemMaterial ?? null]),
    ));

    candidates.push(Object.freeze({
      schemaVersion: 1,
      recipient: Object.freeze({
        accountId: b.accountId,
        characterId: b.charakterName,
        sessionId: b.sessionId,
        serverRegion: b.serverRegion,
        serverIdentifier: b.serverIdentifier,
      }),
      slot: targetSlot,
      kandidatIndex: row.index,
      kandidat: Object.freeze({
        name: kandidat.name,
        level: kandidat.level,
        physischeKennung: [
          b.charakterName,
          "inventory",
          String(row.index),
          kandidat.beobachtungsFingerprint,
        ].join(":"),
        beobachtungsFingerprint: kandidat.beobachtungsFingerprint,
        physisch: true,
        gesperrt: false,
        virtuellB: false,
      }),
      vorherigesSlotItem: Object.freeze({
        name: vorherigesSlotItem.name,
        level: vorherigesSlotItem.level,
        physischeKennung: [
          b.charakterName,
          "slot",
          targetSlot,
          vorherigesSlotItem.beobachtungsFingerprint,
        ].join(":"),
        beobachtungsFingerprint: vorherigesSlotItem.beobachtungsFingerprint,
        physisch: true,
        gesperrt: false,
        virtuellB: false,
      }),
      restInventarFingerprint,
      restEquipmentFingerprint,
      evidenceFingerprint: hash(JSON.stringify({
        binding: b.bindingFingerprint,
        slot: targetSlot,
        index: row.index,
        candidate: kandidat.beobachtungsFingerprint,
        previous: vorherigesSlotItem.beobachtungsFingerprint,
        restInventarFingerprint,
        restEquipmentFingerprint,
      })),
      mechanischKompatibel: true,
      contentVerifiziert: true,
      progressionsEntscheidung: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    }));
  }

  candidates.sort((a, z) =>
    PR20_7_GEAR_SAFE_OCCUPIED_SLOTS.indexOf(a.slot)
      - PR20_7_GEAR_SAFE_OCCUPIED_SLOTS.indexOf(z.slot)
    || a.kandidatIndex - z.kandidatIndex);
  return candidates[0] ?? null;
}

export async function beobachtePr207GearRecipientReadOnly(session, contextId) {
  if (!session || typeof session.evaluate !== "function" || !Number.isInteger(contextId)) {
    throw new Error("PR20_7_GEAR_CDP_KONTEXT_UNGUELTIG");
  }
  return validierePr207GearRecipientBeobachtung(
    await session.evaluate(READ_ONLY_OBSERVATION, contextId),
  );
}

export async function findePr207GearRecipientKontext(cdpText, characterName) {
  text(characterName, 192, "PR20_7_GEAR_CHARACTER_ARGUMENT_UNGUELTIG");
  const cdpBase = validiereLoopbackCdp(cdpText);
  const response = await fetch(new URL("json/list", cdpBase), {
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error("PR20_7_GEAR_CDP_TARGET_LIST_HTTP_" + response.status);
  }
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length > 64) {
    throw new Error("PR20_7_GEAR_CDP_TARGET_LIST_UNGUELTIG");
  }
  const targets = rows.filter(row => {
    try {
      return row?.type === "page"
        && new URL(row.url).origin === ADVENTURE_LAND_ORIGIN
        && typeof row.webSocketDebuggerUrl === "string";
    } catch {
      return false;
    }
  }).slice(0, 8);

  let match = null;
  for (const target of targets) {
    const session = new CdpSession(target.webSocketDebuggerUrl);
    try {
      await session.open();
      await session.enableRuntime();
      for (const context of [...session.contexts.values()]
        .filter(x => x.origin === ADVENTURE_LAND_ORIGIN)
        .slice(0, 32)) {
        const name = await session.evaluate(CHARACTER_PROBE, context.id)
          .catch(() => "");
        if (name !== characterName) continue;
        if (match !== null) {
          session.close();
          match.session.close();
          throw new Error("PR20_7_GEAR_CHARACTER_KONTEXT_NICHT_EINDEUTIG");
        }
        match = Object.freeze({
          session,
          contextId: context.id,
          targetUrl: target.url,
          contextName: typeof context.name === "string" ? context.name : "",
          frameId: typeof context.auxData?.frameId === "string"
            ? context.auxData.frameId
            : null,
        });
        break;
      }
      if (match === null || match.session !== session) session.close();
    } catch (error) {
      if (match?.session !== session) session.close();
      if (String(error?.message || error)
        .includes("PR20_7_GEAR_CHARACTER_KONTEXT_NICHT_EINDEUTIG")) {
        throw error;
      }
    }
  }
  if (match === null) {
    throw new Error("PR20_7_GEAR_CHARACTER_KONTEXT_FEHLT:" + characterName);
  }
  return match;
}

export function pr207GearPrestateFingerprint(observation, candidate) {
  return hash(JSON.stringify({
    binding: observation.bindingFingerprint,
    slot: candidate.slot,
    kandidatIndex: candidate.kandidatIndex,
    kandidat: candidate.kandidat.beobachtungsFingerprint,
    vorherigesSlotItem: candidate.vorherigesSlotItem.beobachtungsFingerprint,
    restInventarFingerprint: candidate.restInventarFingerprint,
    restEquipmentFingerprint: candidate.restEquipmentFingerprint,
  }));
}

export const PR20_7_GEAR_BROWSER_READ_ONLY = true;
export const PR20_7_GEAR_BROWSER_GAMEPLAY_WRITES = 0;
