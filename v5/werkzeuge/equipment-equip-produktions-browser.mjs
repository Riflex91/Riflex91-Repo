import crypto from "node:crypto";

const ACTION = "AL-ACTION-EQUIP";
const RECOVERY = "AL-RECOVERY-EQUIP";
const VERIFIER = "AL-VERIFIER-EQUIP";
const SAFE_SLOTS = Object.freeze([
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
const SLOT_FOR_TYPE = Object.freeze({
  cape: "cape",
  belt: "belt",
  amulet: "amulet",
  orb: "orb",
  helmet: "helmet",
  gloves: "gloves",
  shoes: "shoes",
  pants: "pants",
  chest: "chest",
});

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

const OBSERVE = [
  "(() => {",
  "  const roots = [globalThis];",
  "  try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root = null;",
  "  for (const r of roots) {",
  "    try { if (r && r.character && r.G && r.G.items) { root = r; break; } } catch {}",
  "  }",
  "  if (!root) throw new Error('EQUIP_PROD_CHARACTER_CONTEXT_FEHLT');",
  "  const c = root.character;",
  "  const entities = root.entities || {};",
  "  const hostile = Object.values(entities).filter(e => e && e.type === 'monster' && !e.dead && e.target === c.name).length;",
  "  let alternative = false;",
  "  for (const r of roots) {",
  "    try {",
  "      const runtime = r && r.AIO_V3 && r.AIO_V3.__runtime;",
  "      const status = runtime && typeof runtime.status === 'function' ? runtime.status() : null;",
  "      if (runtime && (runtime.timer || (status && status.running === true))) alternative = true;",
  "    } catch { alternative = true; }",
  "    try {",
  "      const v4 = r && (r.AIO_V4 || r.V4Runtime);",
  "      const status = v4 && typeof v4.status === 'function' ? v4.status() : null;",
  "      if (status && (status.running === true || status.aktivFreigegeben === true)) alternative = true;",
  "    } catch { alternative = true; }",
  "  }",
  "  const safeSlots = ['cape','belt','amulet','orb','helmet','gloves','shoes','pants','chest'];",
  "  const slots = {};",
  "  for (const slot of safeSlots) {",
  "    const item = c.slots && c.slots[slot] || null;",
  "    slots[slot] = item ? {name:String(item.name||''),level:Number(item.level||0)} : null;",
  "  }",
  "  const inventar = Array.isArray(c.items) ? c.items.map((item,index) => {",
  "    if (!item || !item.name) return null;",
  "    const def = root.G.items[item.name] || {};",
  "    return {index,name:String(item.name),level:Number(item.level||0),",
  "      gesperrt:item.l===true||item.locked===true||item.lock===true,typ:String(def.type||'')};",
  "  }).filter(Boolean) : [];",
  "  return {charakterName:String(c.name||''),ctype:String(c.ctype||c.type||'').toLowerCase(),",
  "    rip:!!c.rip,bewegtSich:!!c.moving,zielName:c.target==null?null:String(c.target),",
  "    feindeAufCharakter:hostile,alternativeRuntimeAktiv:alternative,inventar,slots};",
  "})()",
].join("\n");

export async function beobachteProduktionsEquip(session, contextId) {
  const value = await session.evaluate(OBSERVE, contextId);
  if (!value || typeof value !== "object") {
    throw new Error("EQUIP_PROD_BEOBACHTUNG_UNGUELTIG");
  }
  return value;
}

export function validiereProduktionsEquipRuhezustand(b) {
  const gruende = [];
  if (!b || typeof b !== "object") return ["BEOBACHTUNG_FEHLT"];
  if (String(b.charakterName || "").trim().length === 0) {
    gruende.push("CHARAKTER_FEHLT");
  }
  if (String(b.ctype || "").toLowerCase() !== "merchant") {
    gruende.push("MERCHANT_ERFORDERLICH");
  }
  if (b.rip === true) gruende.push("CHARAKTER_TOT");
  if (b.bewegtSich === true) gruende.push("CHARAKTER_BEWEGT_SICH");
  if (b.zielName !== null) gruende.push("CHARAKTER_HAT_ZIEL");
  if (b.feindeAufCharakter !== 0) gruende.push("CHARAKTER_UNTER_ANGRIFF");
  if (b.alternativeRuntimeAktiv === true) gruende.push("ALTERNATIVE_RUNTIME_AKTIV");
  if (!Array.isArray(b.inventar) || b.inventar.length > 128) {
    gruende.push("INVENTAR_UNGUELTIG");
  }
  if (!b.slots || typeof b.slots !== "object") {
    gruende.push("SLOTS_UNGUELTIG");
  }
  return Object.freeze(gruende);
}

export function waehleProduktionsEquipKandidat(b) {
  if (validiereProduktionsEquipRuhezustand(b).length > 0) return null;
  const candidates = b.inventar
    .filter(item => Number.isInteger(item.index)
      && item.index >= 0
      && item.index < 128
      && String(item.name || "").trim().length > 0
      && item.gesperrt !== true
      && SLOT_FOR_TYPE[item.typ] !== undefined)
    .map(item => ({
      index: item.index,
      itemName: item.name,
      itemLevel: item.level,
      slot: SLOT_FOR_TYPE[item.typ],
      vorherigesSlotItem: b.slots[SLOT_FOR_TYPE[item.typ]] ?? null,
    }))
    .filter(k => k.vorherigesSlotItem === null)
    .sort((a, b2) =>
      SAFE_SLOTS.indexOf(a.slot) - SAFE_SLOTS.indexOf(b2.slot)
      || a.index - b2.index);
  return candidates[0] ?? null;
}

function itemAt(b, index) {
  return b.inventar.find(x => x.index === index) ?? null;
}

export function produktionsEquipFingerprint(b, kandidat) {
  return hash(JSON.stringify({
    charakterName: b.charakterName,
    ctype: b.ctype,
    item: itemAt(b, kandidat.index),
    slot: b.slots[kandidat.slot] ?? null,
    rip: b.rip,
    bewegtSich: b.bewegtSich,
    zielName: b.zielName,
    feindeAufCharakter: b.feindeAufCharakter,
    alternativeRuntimeAktiv: b.alternativeRuntimeAktiv,
  }));
}

export function erstelleProduktiveEquipLiveVoraussetzungen(
  session,
  contextId,
  kandidat,
) {
  return Object.freeze({
    async pruefe(ids, jetztMs) {
      const b = await beobachteProduktionsEquip(session, contextId);
      const gruende = validiereProduktionsEquipRuhezustand(b);
      if (gruende.length > 0) {
        throw new Error("EQUIP_PROD_LIVE_RUHEBEDINGUNG:" + gruende.join(","));
      }
      const item = itemAt(b, kandidat.index);
      if (!item
          || item.name !== kandidat.itemName
          || item.level !== kandidat.itemLevel
          || item.gesperrt === true) {
        throw new Error("EQUIP_PROD_LIVE_ITEM_DRIFT");
      }
      if ((b.slots[kandidat.slot] ?? null) !== null) {
        throw new Error("EQUIP_PROD_LIVE_SLOT_NICHT_MEHR_LEER");
      }
      const allowed = new Set([
        "inventory_item_identity",
        "equipment_slot_empty",
        "character_idle",
        "alternative_runtime_inactive",
      ]);
      if (ids.some(id => !allowed.has(id))) {
        throw new Error("EQUIP_PROD_LIVE_PRECONDITION_ID_UNBEKANNT");
      }
      const fp = produktionsEquipFingerprint(b, kandidat);
      return Object.freeze(ids.map(id => Object.freeze({
        voraussetzungId: id,
        fingerprint: fp + ":" + id,
        beobachtetAmMs: jetztMs,
        gueltigBisMs: jetztMs + 1_500,
      })));
    },
  });
}

export class ProduktionsCdpEquipAdapter {
  constructor(session, contextId, kandidat) {
    this.adapterId = "v5-production-cdp-equip-once";
    this.actionContractId = ACTION;
    this.recoveryContractId = RECOVERY;
    this.verifierId = VERIFIER;
    this.session = session;
    this.contextId = contextId;
    this.kandidat = kandidat;
    this.adapterAufrufe = 0;
    this.gameWrites = 0;
    this.moeglicherSend = false;
  }

  async sende(_freigabe, anfrage) {
    if (this.adapterAufrufe !== 0) {
      throw new Error("EQUIP_PROD_MEHR_ALS_EIN_ADAPTER_AUFRUF");
    }
    this.adapterAufrufe += 1;
    if (anfrage.index !== this.kandidat.index
        || anfrage.slot !== this.kandidat.slot
        || anfrage.itemName !== this.kandidat.itemName
        || anfrage.itemLevel !== this.kandidat.itemLevel) {
      return { art: "NICHT_GESENDET", grund: "ADAPTER_ANFRAGE_BINDUNG_DRIFT" };
    }

    const k = this.kandidat;
    const expr = [
      "(async () => {",
      "  const roots=[globalThis];",
      "  try { if (globalThis.parent && globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
      "  let root=null;",
      "  for (const r of roots) { try { if (r && r.character && typeof r.equip==='function') { root=r; break; } } catch {} }",
      "  if (!root) return {sent:false,reason:'CONTEXT_FEHLT'};",
      "  const c=root.character;",
      "  if (String(c.ctype||c.type||'').toLowerCase()!=='merchant') return {sent:false,reason:'MERCHANT_ERFORDERLICH'};",
      "  if (c.rip || c.moving || c.target != null) return {sent:false,reason:'CHARAKTER_NICHT_IDLE'};",
      "  let alt=false;",
      "  for (const r of roots) {",
      "    try { const x=r&&r.AIO_V3&&r.AIO_V3.__runtime; const s=x&&typeof x.status==='function'?x.status():null; if(x&&(x.timer||(s&&s.running===true))) alt=true; } catch { alt=true; }",
      "    try { const x=r&&(r.AIO_V4||r.V4Runtime); const s=x&&typeof x.status==='function'?x.status():null; if(s&&(s.running===true||s.aktivFreigegeben===true)) alt=true; } catch { alt=true; }",
      "  }",
      "  if (alt) return {sent:false,reason:'ALTERNATIVE_RUNTIME_AKTIV'};",
      "  const item=c.items[" + k.index + "];",
      "  if (!item || String(item.name)!==" + JSON.stringify(k.itemName)
        + " || Number(item.level||0)!==" + k.itemLevel
        + " || item.l===true || item.locked===true || item.lock===true)",
      "    return {sent:false,reason:'INVENTORY_ITEM_DRIFT'};",
      "  const slot=c.slots&&c.slots[" + JSON.stringify(k.slot) + "]||null;",
      "  if (slot!==null) return {sent:false,reason:'EQUIPMENT_SLOT_NICHT_LEER'};",
      "  try {",
      "    const result=await Promise.resolve(root.equip(" + k.index + "," + JSON.stringify(k.slot) + "));",
      "    return {sent:true,result:result==null?null:result};",
      "  } catch(error) {",
      "    return {sent:true,error:String(error&&error.message||error).slice(0,240)};",
      "  }",
      "})()",
    ].join("\n");

    try {
      this.moeglicherSend = true;
      const result = await this.session.evaluate(expr, this.contextId, {
        userGesture: true,
      });
      if (!result?.sent) {
        this.moeglicherSend = false;
        return {
          art: "NICHT_GESENDET",
          grund: String(result?.reason || "PRECONDITION_DRIFT"),
        };
      }
      this.gameWrites = 1;
      return {
        art: "SERVER_ERGEBNIS",
        korrelationId: "V5-EQUIP-ONE-SHOT",
        ergebnis: result,
      };
    } catch {
      return {
        art: "UNBEKANNT",
        grund: "DISCONNECT_NACH_MOEGLICHEM_SEND",
        korrelationId: null,
      };
    }
  }
}

export function erstelleProduktivenEquipRecoveryBeobachter(
  session,
  contextId,
  kandidat,
) {
  return Object.freeze({
    async beobachte(_txId, snapshot, versuch) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const b = await beobachteProduktionsEquip(session, contextId);
      const slot = b.slots[kandidat.slot] ?? null;
      const item = itemAt(b, kandidat.index);
      const slotCommitted = slot?.name === kandidat.itemName
        && slot?.level === kandidat.itemLevel;
      const inventoryCommitted = item === null;
      const prestate = slot === null
        && item?.name === kandidat.itemName
        && item?.level === kandidat.itemLevel;

      let klassifikation;
      if (slotCommitted && inventoryCommitted) {
        klassifikation = "BESTAETIGT";
      } else if (prestate) {
        klassifikation = "NICHT_AUSGEFUEHRT";
      } else if (versuch < 4
          && (slotCommitted || item === null)) {
        klassifikation = "NOCH_AUSSTEHEND";
      } else if (slotCommitted || item === null) {
        klassifikation = "TEILWEISE";
      } else {
        klassifikation = "UNGEKLAERT";
      }

      const applied = [];
      const open = [];
      if (slotCommitted) applied.push("equipment"); else open.push("equipment");
      if (inventoryCommitted) applied.push("inventory"); else open.push("inventory");

      return Object.freeze({
        schemaVersion: 1,
        klassifikation,
        beobachtetAmMs: Date.now(),
        snapshot,
        differenz: Object.freeze({
          schemaVersion: 1,
          erwarteteDomaenen: Object.freeze(["equipment", "inventory"]),
          angewendeteDomaenen: Object.freeze(applied),
          offeneDomaenen: Object.freeze(open),
          widerspruechlicheDomaenen: Object.freeze(
            klassifikation === "UNGEKLAERT"
              ? ["equipment", "inventory"]
              : [],
          ),
        }),
        evidenceFingerprints: Object.freeze([
          hash(JSON.stringify({ slot, item, kandidat, versuch })),
        ]),
      });
    },
  });
}
