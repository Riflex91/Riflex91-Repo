export const BANK_ITEM_TRANSFER_BANK_SLOT_MIN = 0;
export const BANK_ITEM_TRANSFER_BANK_SLOT_MAX = 41;
export const BANK_ITEM_TRANSFER_INVENTORY_SLOT_MIN = 0;
export const BANK_ITEM_TRANSFER_INVENTORY_SLOT_MAX = 63;

export type BankItemTransferRichtung = "RETRIEVE" | "STORE";

export interface BankItemTransferItem {
  readonly name: string;
  readonly fingerprint: string;
}

export interface BankItemTransferKandidatItem extends BankItemTransferItem {
  readonly placeholder?: boolean;
  readonly blocked?: boolean;
  readonly hasM?: boolean;
  readonly hasV?: boolean;
}

export interface BankItemTransferKandidatPack {
  readonly pack: string;
  readonly slots: readonly (BankItemTransferKandidatItem | null)[];
}

export interface BankItemTransferBindung {
  readonly schemaVersion: 1;
  readonly richtung: BankItemTransferRichtung;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly beobachtetAmMs: number;
  readonly bankPack: string;
  readonly bankSlot: number;
  readonly inventorySlot: number;
  readonly inventoryCapacity: number;
  readonly transferItem: BankItemTransferItem;
  readonly bankSlotItem: BankItemTransferItem | null;
  readonly inventorySlotItem: BankItemTransferItem | null;
  readonly packRestFingerprint: string;
  readonly inventoryRestFingerprint: string;
  readonly characterGold: number;
  readonly bankGold: number;
  readonly fingerprint: string;
}

export interface BankItemTransferSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly grund: string;
  readonly quelleLeer: boolean;
  readonly zielExakt: boolean;
  readonly neuerFingerprint: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankRetrieveErsterKandidat {
  readonly schemaVersion: 1;
  readonly richtung: "RETRIEVE";
  readonly pack: string;
  readonly bankSlot: number;
  readonly inventorySlot: number;
  readonly item: BankItemTransferItem;
  readonly explizitesLeeresInventarZiel: true;
  readonly automatischeZielwahl: false;
}

export interface BankStoreErsterKandidat {
  readonly schemaVersion: 1;
  readonly richtung: "STORE";
  readonly pack: string;
  readonly bankSlot: number;
  readonly inventorySlot: number;
  readonly item: BankItemTransferItem;
  readonly explizitesLeeresBankZiel: true;
  readonly automatischeZielwahl: false;
  readonly metadatenMutationAusgeschlossen: true;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}
function fp(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}
function safeInt(wert: number, min: number, max: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < min || wert > max) throw new Error(fehler);
}
function item(wert: BankItemTransferItem, fehler: string): void {
  if (!wert || typeof wert !== "object") throw new Error(fehler);
  text(wert.name, fehler + "_NAME");
  fp(wert.fingerprint, fehler + "_FP");
}
function gleicheItem(a: BankItemTransferItem | null, b: BankItemTransferItem | null): boolean {
  return a === null
    ? b === null
    : b !== null && a.name === b.name && a.fingerprint === b.fingerprint;
}
function validiereBindung(b: BankItemTransferBindung): void {
  if (!b || b.schemaVersion !== 1 || !["RETRIEVE", "STORE"].includes(b.richtung)) {
    throw new Error("BANK_ITEM_TRANSFER_BINDUNG_SCHEMA_UNGUELTIG");
  }
  for (const [v, e] of [
    [b.characterId, "BANK_ITEM_TRANSFER_CHARACTER_ID_UNGUELTIG"],
    [b.sessionId, "BANK_ITEM_TRANSFER_SESSION_ID_UNGUELTIG"],
    [b.serverRegion, "BANK_ITEM_TRANSFER_SERVER_REGION_UNGUELTIG"],
    [b.serverKennung, "BANK_ITEM_TRANSFER_SERVER_ID_UNGUELTIG"],
  ] as const) text(v, e);
  if (!/^items[0-9]+$/.test(b.bankPack)) throw new Error("BANK_ITEM_TRANSFER_PACK_UNGUELTIG");
  safeInt(b.bankSlot, 0, 41, "BANK_ITEM_TRANSFER_BANK_SLOT_UNGUELTIG");
  safeInt(b.inventoryCapacity, 1, 64, "BANK_ITEM_TRANSFER_INVENTORY_CAPACITY_UNGUELTIG");
  safeInt(
    b.inventorySlot,
    0,
    b.inventoryCapacity - 1,
    "BANK_ITEM_TRANSFER_INVENTORY_SLOT_UNGUELTIG",
  );
  safeInt(b.leaseEpoche, 1, Number.MAX_SAFE_INTEGER, "BANK_ITEM_TRANSFER_LEASE_UNGUELTIG");
  safeInt(b.mountEpoche, 1, Number.MAX_SAFE_INTEGER, "BANK_ITEM_TRANSFER_MOUNT_UNGUELTIG");
  safeInt(b.beobachtetAmMs, 0, Number.MAX_SAFE_INTEGER, "BANK_ITEM_TRANSFER_ZEIT_UNGUELTIG");
  safeInt(b.characterGold, 0, Number.MAX_SAFE_INTEGER, "BANK_ITEM_TRANSFER_CHARACTER_GOLD_UNGUELTIG");
  safeInt(b.bankGold, 0, Number.MAX_SAFE_INTEGER, "BANK_ITEM_TRANSFER_BANK_GOLD_UNGUELTIG");
  item(b.transferItem, "BANK_ITEM_TRANSFER_ITEM_UNGUELTIG");
  if (b.bankSlotItem !== null) item(b.bankSlotItem, "BANK_ITEM_TRANSFER_BANK_ITEM_UNGUELTIG");
  if (b.inventorySlotItem !== null) item(b.inventorySlotItem, "BANK_ITEM_TRANSFER_INV_ITEM_UNGUELTIG");
  fp(b.packRestFingerprint, "BANK_ITEM_TRANSFER_PACK_REST_FP_UNGUELTIG");
  fp(b.inventoryRestFingerprint, "BANK_ITEM_TRANSFER_INV_REST_FP_UNGUELTIG");
  fp(b.fingerprint, "BANK_ITEM_TRANSFER_FP_UNGUELTIG");
}
function gleicheBindung(a: BankItemTransferBindung, b: BankItemTransferBindung): boolean {
  return a.richtung === b.richtung
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverKennung === b.serverKennung
    && a.leaseEpoche === b.leaseEpoche
    && a.mountEpoche === b.mountEpoche
    && a.bankPack === b.bankPack
    && a.bankSlot === b.bankSlot
    && a.inventorySlot === b.inventorySlot
    && a.inventoryCapacity === b.inventoryCapacity
    && gleicheItem(a.transferItem, b.transferItem);
}

export function pruefeBankItemTransferSettlement(
  vorher: BankItemTransferBindung,
  nachher: BankItemTransferBindung,
): BankItemTransferSettlementErgebnis {
  validiereBindung(vorher);
  validiereBindung(nachher);
  const neuerFingerprint = vorher.fingerprint !== nachher.fingerprint;
  const quelleLeer = vorher.richtung === "RETRIEVE"
    ? nachher.bankSlotItem === null
    : nachher.inventorySlotItem === null;
  const zielExakt = vorher.richtung === "RETRIEVE"
    ? gleicheItem(nachher.inventorySlotItem, vorher.transferItem)
    : gleicheItem(nachher.bankSlotItem, vorher.transferItem);
  const out = (
    status: BankItemTransferSettlementErgebnis["status"],
    grund: string,
  ): BankItemTransferSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    grund,
    quelleLeer,
    zielExakt,
    neuerFingerprint,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
  if (!gleicheBindung(vorher, nachher)) return out("DRIFT", "BANK_ITEM_TRANSFER_BINDUNG_DRIFT");
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return out("DRIFT", "BANK_ITEM_TRANSFER_BEOBACHTUNG_NICHT_NEUER");
  }
  if (nachher.characterGold !== vorher.characterGold
      || nachher.bankGold !== vorher.bankGold) {
    return out("DRIFT", "BANK_ITEM_TRANSFER_GOLD_DRIFT");
  }
  if (nachher.packRestFingerprint !== vorher.packRestFingerprint
      || nachher.inventoryRestFingerprint !== vorher.inventoryRestFingerprint) {
    return out("DRIFT", "BANK_ITEM_TRANSFER_REST_DRIFT");
  }
  const prestatePasst = vorher.richtung === "RETRIEVE"
    ? gleicheItem(vorher.bankSlotItem, vorher.transferItem)
      && vorher.inventorySlotItem === null
    : vorher.bankSlotItem === null
      && gleicheItem(vorher.inventorySlotItem, vorher.transferItem);
  if (!prestatePasst) return out("DRIFT", "BANK_ITEM_TRANSFER_PRESTATE_WIDERSPRUCH");
  if (quelleLeer && zielExakt && neuerFingerprint) {
    return out(
      "BESTAETIGT",
      vorher.richtung === "RETRIEVE"
        ? "BANK_RETRIEVE_EXAKTER_BANK_ZU_INVENTAR_TRANSFER"
        : "BANK_STORE_EXAKTER_INVENTAR_ZU_BANK_TRANSFER",
    );
  }
  const unveraendert = !neuerFingerprint
    && gleicheItem(vorher.bankSlotItem, nachher.bankSlotItem)
    && gleicheItem(vorher.inventorySlotItem, nachher.inventorySlotItem);
  if (unveraendert) return out("OFFEN", "BANK_ITEM_TRANSFER_NOCH_KEINE_SICHTBARE_WIRKUNG");
  return out("DRIFT", "BANK_ITEM_TRANSFER_SLOT_WIRKUNG_WIDERSPRUCH");
}

function validierePacks(packs: readonly BankItemTransferKandidatPack[]): readonly BankItemTransferKandidatPack[] {
  if (!Array.isArray(packs) || packs.length < 1 || packs.length > 64) {
    throw new Error("BANK_ITEM_TRANSFER_PACKS_UNGUELTIG");
  }
  const sortiert = [...packs].sort((a, b) => a.pack.localeCompare(b.pack));
  for (const p of sortiert) {
    if (!/^items[0-9]+$/.test(p.pack)
        || !Array.isArray(p.slots)
        || p.slots.length > 42) throw new Error("BANK_ITEM_TRANSFER_PACK_UNGUELTIG");
  }
  return sortiert;
}

export function waehleBankRetrieveErstenKandidaten(
  packs: readonly BankItemTransferKandidatPack[],
  inventory: readonly (BankItemTransferKandidatItem | null)[],
  inventoryCapacity: number,
): BankRetrieveErsterKandidat | null {
  safeInt(inventoryCapacity, 1, 64, "BANK_RETRIEVE_INVENTORY_CAPACITY_UNGUELTIG");
  if (!Array.isArray(inventory) || inventory.length > inventoryCapacity) {
    throw new Error("BANK_RETRIEVE_INVENTORY_UNGUELTIG");
  }
  let inventorySlot = -1;
  for (let i = 0; i < inventoryCapacity; i += 1) {
    if ((inventory[i] ?? null) === null) { inventorySlot = i; break; }
  }
  if (inventorySlot < 0) return null;
  for (const p of validierePacks(packs)) {
    for (let bankSlot = 0; bankSlot < p.slots.length; bankSlot += 1) {
      const x = p.slots[bankSlot];
      if (!x || x.placeholder === true || x.name === "placeholder") continue;
      item(x, "BANK_RETRIEVE_KANDIDAT_ITEM_UNGUELTIG");
      return Object.freeze({
        schemaVersion: 1,
        richtung: "RETRIEVE",
        pack: p.pack,
        bankSlot,
        inventorySlot,
        item: Object.freeze({ name: x.name, fingerprint: x.fingerprint }),
        explizitesLeeresInventarZiel: true,
        automatischeZielwahl: false,
      });
    }
  }
  return null;
}

export function waehleBankStoreErstenKandidaten(
  packs: readonly BankItemTransferKandidatPack[],
  inventory: readonly (BankItemTransferKandidatItem | null)[],
  inventoryCapacity: number,
): BankStoreErsterKandidat | null {
  safeInt(inventoryCapacity, 1, 64, "BANK_STORE_INVENTORY_CAPACITY_UNGUELTIG");
  if (!Array.isArray(inventory) || inventory.length > inventoryCapacity) {
    throw new Error("BANK_STORE_INVENTORY_UNGUELTIG");
  }
  let inventorySlot = -1;
  let transfer: BankItemTransferKandidatItem | null = null;
  for (let i = 0; i < inventoryCapacity; i += 1) {
    const x = inventory[i] ?? null;
    if (!x || x.placeholder === true || x.name === "placeholder"
        || x.blocked === true || x.hasM === true || x.hasV === true) continue;
    item(x, "BANK_STORE_KANDIDAT_ITEM_UNGUELTIG");
    inventorySlot = i;
    transfer = x;
    break;
  }
  if (inventorySlot < 0 || transfer === null) return null;
  for (const p of validierePacks(packs)) {
    for (let bankSlot = 0; bankSlot < 42; bankSlot += 1) {
      if ((p.slots[bankSlot] ?? null) !== null) continue;
      return Object.freeze({
        schemaVersion: 1,
        richtung: "STORE",
        pack: p.pack,
        bankSlot,
        inventorySlot,
        item: Object.freeze({ name: transfer.name, fingerprint: transfer.fingerprint }),
        explizitesLeeresBankZiel: true,
        automatischeZielwahl: false,
        metadatenMutationAusgeschlossen: true,
      });
    }
  }
  return null;
}
