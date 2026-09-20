import crypto from "node:crypto";

const ACTION = "AL-ACTION-EQUIP";
const RECOVERY = "AL-RECOVERY-EQUIP";
const VERIFIER = "AL-VERIFIER-EQUIP";

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

const OBSERVE_EXPR = [
  "(() => {",
  "  const root = typeof globalThis.equip === 'function' ? globalThis",
  "    : (globalThis.parent && typeof globalThis.parent.equip === 'function' ? globalThis.parent : null);",
  "  if (!root || !root.character || !root.G || !root.G.items) throw new Error('R12_CHARACTER_CONTEXT_UNAVAILABLE');",
  "  const c = root.character;",
  "  const entities = root.entities || {};",
  "  const hostile = Object.values(entities).filter(e => e && e.type === 'monster' && !e.dead && e.target === c.name).length;",
  "  let v3Running = false;",
  "  try {",
  "    const runtime = globalThis.AIO_V3 && globalThis.AIO_V3.__runtime;",
  "    const status = runtime && typeof runtime.status === 'function' ? runtime.status() : null;",
  "    v3Running = !!(runtime && (runtime.timer || (status && status.running === true)));",
  "  } catch { v3Running = true; }",
  "  let v4Running = false;",
  "  try {",
  "    const v4 = globalThis.AIO_V4 || globalThis.V4Runtime;",
  "    const status = v4 && typeof v4.status === 'function' ? v4.status() : null;",
  "    v4Running = !!(status && (status.running === true || status.aktivFreigegeben === true));",
  "  } catch { v4Running = true; }",
  "  const allowedSlots = ['helmet','chest','pants','shoes','gloves','cape','amulet','belt','orb'];",
  "  const slots = {};",
  "  for (const slot of allowedSlots) {",
  "    const item = c.slots && c.slots[slot] || null;",
  "    slots[slot] = item ? { name:String(item.name || ''), level:Number(item.level || 0) } : null;",
  "  }",
  "  const inventar = c.items.map((item,index) => {",
  "    if (!item || !item.name) return null;",
  "    const def = root.G.items[item.name] || {};",
  "    return { index, name:String(item.name), level:Number(item.level || 0),",
  "      gesperrt:item.l === true || item.locked === true || item.lock === true, typ:String(def.type || '') };",
  "  }).filter(Boolean);",
  "  return { charakterName:String(c.name || ''), rip:!!c.rip, bewegtSich:!!c.moving,",
  "    zielName:c.target == null ? null : String(c.target), feindeAufCharakter:hostile,",
  "    alternativeRuntimeAktiv:v3Running || v4Running, inventar, slots };",
  "})()"
].join("\n");

export async function beobachteControlledLive(session, contextId) {
  const value = await session.evaluate(OBSERVE_EXPR, contextId);
  if (!value || typeof value !== "object") throw new Error("R12_BEOBACHTUNG_UNGUELTIG");
  return value;
}

export function itemAmIndex(beobachtung, index) {
  return beobachtung.inventar.find(item => item.index === index) ?? null;
}

export function slotGleich(a, b) {
  if (a === null || b === null) return a === b;
  return a.name === b.name && a.level === b.level;
}

export function beobachtungsFingerprint(beobachtung, kandidat) {
  return hash(JSON.stringify({
    charakterName: beobachtung.charakterName,
    item: itemAmIndex(beobachtung, kandidat.index),
    slot: beobachtung.slots[kandidat.slot] ?? null,
    rip: beobachtung.rip,
    bewegtSich: beobachtung.bewegtSich,
    zielName: beobachtung.zielName,
    feindeAufCharakter: beobachtung.feindeAufCharakter,
    alternativeRuntimeAktiv: beobachtung.alternativeRuntimeAktiv,
  }));
}

export class CdpEquipAdapter {
  constructor(session, contextId, kandidat) {
    this.adapterId = "r12-controlled-live-cdp-equip";
    this.actionContractId = ACTION;
    this.recoveryContractId = RECOVERY;
    this.verifierId = VERIFIER;
    this.session = session;
    this.contextId = contextId;
    this.kandidat = kandidat;
    this.writeVersuche = 0;
  }

  async sende() {
    if (this.writeVersuche !== 0) throw new Error("R12_MEHR_ALS_EIN_WRITE_VERBOTEN");
    this.writeVersuche += 1;
    const k = this.kandidat;
    const lines = [
      "(async () => {",
      "  const root = typeof globalThis.equip === 'function' ? globalThis",
      "    : (globalThis.parent && typeof globalThis.parent.equip === 'function' ? globalThis.parent : null);",
      "  if (!root || !root.character || typeof root.equip !== 'function') return {sent:false,reason:'CONTEXT_FEHLT'};",
      "  const c = root.character;",
      "  const item = c.items[" + k.index + "];",
      "  if (!item || item.name !== " + JSON.stringify(k.itemName) + " || Number(item.level || 0) !== " + k.itemLevel + ")",
      "    return {sent:false,reason:'INVENTORY_ITEM_DRIFT'};",
      "  const before = c.slots && c.slots[" + JSON.stringify(k.slot) + "] || null;",
      "  const expected = " + JSON.stringify(k.vorherigesSlotItem) + ";",
      "  const clean = before ? {name:String(before.name || ''),level:Number(before.level || 0)} : null;",
      "  if (JSON.stringify(clean) !== JSON.stringify(expected)) return {sent:false,reason:'EQUIPMENT_SLOT_DRIFT'};",
      "  try {",
      "    const ergebnis = await Promise.resolve(root.equip(" + k.index + "," + JSON.stringify(k.slot) + "));",
      "    return {sent:true,ergebnis:ergebnis == null ? null : ergebnis};",
      "  } catch (error) {",
      "    return {sent:true,fehler:String(error && error.message || error).slice(0,240)};",
      "  }",
      "})()"
    ];
    try {
      const result = await this.session.evaluate(lines.join("\n"), this.contextId);
      if (!result?.sent) return { art: "NICHT_GESENDET", grund: result?.reason || "PRECONDITION_DRIFT" };
      return { art: "SERVER_ERGEBNIS", korrelationId: "R12-EQUIP-FIFO", ergebnis: result };
    } catch {
      return { art: "UNBEKANNT", grund: "DISCONNECT_NACH_MOEGLICHEM_SEND", korrelationId: null };
    }
  }
}
