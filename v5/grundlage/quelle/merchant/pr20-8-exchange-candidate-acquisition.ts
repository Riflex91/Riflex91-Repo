import type { BankRetrieveErsterKandidat } from "./bank-item-transfer-settlement.js";

export const PR20_8_EXCHANGE_ACQUISITION_MAX_BASE_GOLD = 50_000;
export const PR20_8_EXCHANGE_ACQUISITION_SPECIAL_NAMES = Object.freeze([
  "sixcake",
] as const);

export interface Pr208ExchangeObservedItem {
  readonly name: string;
  readonly fingerprint: string;
  readonly quantity: number;
  readonly locked: boolean;
  readonly blocked: boolean;
  readonly giveaway: boolean;
  readonly listed: boolean;
  readonly hasExpires: boolean;
  readonly hasAcl: boolean;
  readonly hasRid: boolean;
  readonly hasSpecialProperty: boolean;
  readonly gift: boolean;
  readonly exchangeQuantity: number | null;
  readonly baseGold: number | null;
  readonly definitionCash: boolean;
  readonly definitionEvent: boolean;
  readonly definitionQuest: boolean;
  readonly definitionExclusive: boolean;
}

export interface Pr208ExchangeBankPack {
  readonly pack: string;
  readonly packMap: string;
  readonly slots: readonly (Pr208ExchangeObservedItem | null)[];
}

export interface Pr208ExchangeAcquisitionSnapshot {
  readonly schemaVersion: 1;
  readonly currentMap: string;
  readonly bankMounted: boolean;
  readonly inventoryCapacity: number;
  readonly inventory: readonly (Pr208ExchangeObservedItem | null)[];
  readonly bankPacks: readonly Pr208ExchangeBankPack[];
}

export interface Pr208ExchangeAcquisitionCandidate {
  readonly source: "INVENTORY" | "BANK";
  readonly name: string;
  readonly fingerprint: string;
  readonly quantity: number;
  readonly exchangeQuantity: number;
  readonly baseGold: number;
  readonly inventorySlot: number | null;
  readonly bankPack: string | null;
  readonly bankSlot: number | null;
  readonly bankMap: string | null;
}

export interface Pr208ExchangeAcquisitionPlan {
  readonly schemaVersion: 1;
  readonly status:
    | "INVENTORY_CANDIDATE_READY"
    | "BANK_RETRIEVE_CANDIDATE_READY"
    | "BANK_DISCOVERY_REQUIRED"
    | "BANK_CANDIDATE_BLOCKED_NO_FREE_INVENTORY_SLOT"
    | "NO_CANDIDATE";
  readonly selected: Pr208ExchangeAcquisitionCandidate | null;
  readonly expectedRetrieveCandidate: BankRetrieveErsterKandidat | null;
  readonly inventoryCandidateCount: number;
  readonly bankCandidateCount: number;
  readonly rejectedCount: number;
  readonly acquisitionMutationRequired: boolean;
  readonly acquisitionKind: "NONE" | "BANK_RETRIEVE";
  readonly scannerMustReverifyAfterAcquisition: true;
  readonly acquisitionCountsAsExchangeEvidence: false;
  readonly buyAllowed: false;
  readonly farmAllowed: false;
  readonly bankRetrieveAuthority: false;
  readonly exchangeAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
}

function safeInt(value: number, min: number, max: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(error);
}

function validateItem(item: Pr208ExchangeObservedItem): void {
  text(item.name, "PR20_8_EXCHANGE_ACQ_ITEM_NAME_UNGUELTIG");
  if (!/^[0-9a-f]{64}$/i.test(item.fingerprint)) {
    throw new Error("PR20_8_EXCHANGE_ACQ_ITEM_FP_UNGUELTIG");
  }
  safeInt(item.quantity, 1, Number.MAX_SAFE_INTEGER, "PR20_8_EXCHANGE_ACQ_ITEM_Q_UNGUELTIG");
  if (item.exchangeQuantity !== null) {
    safeInt(
      item.exchangeQuantity,
      1,
      Number.MAX_SAFE_INTEGER,
      "PR20_8_EXCHANGE_ACQ_ITEM_E_UNGUELTIG",
    );
  }
  if (item.baseGold !== null
      && (!Number.isFinite(item.baseGold) || item.baseGold < 0)) {
    throw new Error("PR20_8_EXCHANGE_ACQ_ITEM_G_UNGUELTIG");
  }
}

function eligible(item: Pr208ExchangeObservedItem): boolean {
  if (item.exchangeQuantity === null
      || item.baseGold === null
      || item.quantity < item.exchangeQuantity
      || item.baseGold > PR20_8_EXCHANGE_ACQUISITION_MAX_BASE_GOLD) {
    return false;
  }
  if (PR20_8_EXCHANGE_ACQUISITION_SPECIAL_NAMES.includes(
    item.name as (typeof PR20_8_EXCHANGE_ACQUISITION_SPECIAL_NAMES)[number],
  )) {
    return false;
  }
  return !item.locked
    && !item.blocked
    && !item.giveaway
    && !item.listed
    && !item.hasExpires
    && !item.hasAcl
    && !item.hasRid
    && !item.hasSpecialProperty
    && !item.gift
    && !item.definitionCash
    && !item.definitionEvent
    && !item.definitionQuest
    && !item.definitionExclusive;
}

function compareCandidate(
  a: Pr208ExchangeAcquisitionCandidate,
  b: Pr208ExchangeAcquisitionCandidate,
): number {
  return a.baseGold - b.baseGold
    || a.exchangeQuantity - b.exchangeQuantity
    || a.name.localeCompare(b.name)
    || (a.bankPack ?? "").localeCompare(b.bankPack ?? "")
    || (a.bankSlot ?? a.inventorySlot ?? 0) - (b.bankSlot ?? b.inventorySlot ?? 0);
}

function freeInventorySlot(
  inventory: readonly (Pr208ExchangeObservedItem | null)[],
  capacity: number,
): number {
  for (let index = 0; index < capacity; index += 1) {
    if ((inventory[index] ?? null) === null) return index;
  }
  return -1;
}

export function planePr208ExchangeCandidateAcquisition(
  snapshot: Pr208ExchangeAcquisitionSnapshot,
): Pr208ExchangeAcquisitionPlan {
  if (snapshot.schemaVersion !== 1) {
    throw new Error("PR20_8_EXCHANGE_ACQ_SCHEMA_UNGUELTIG");
  }
  text(snapshot.currentMap, "PR20_8_EXCHANGE_ACQ_MAP_UNGUELTIG");
  safeInt(
    snapshot.inventoryCapacity,
    1,
    64,
    "PR20_8_EXCHANGE_ACQ_INVENTORY_CAPACITY_UNGUELTIG",
  );
  if (!Array.isArray(snapshot.inventory)
      || snapshot.inventory.length > snapshot.inventoryCapacity
      || !Array.isArray(snapshot.bankPacks)
      || snapshot.bankPacks.length > 64) {
    throw new Error("PR20_8_EXCHANGE_ACQ_SNAPSHOT_UNGUELTIG");
  }

  const inventoryCandidates: Pr208ExchangeAcquisitionCandidate[] = [];
  const bankCandidates: Pr208ExchangeAcquisitionCandidate[] = [];
  let rejectedCount = 0;

  for (let index = 0; index < snapshot.inventoryCapacity; index += 1) {
    const item = snapshot.inventory[index] ?? null;
    if (item === null) continue;
    validateItem(item);
    if (!eligible(item)) {
      rejectedCount += 1;
      continue;
    }
    inventoryCandidates.push(Object.freeze({
      source: "INVENTORY",
      name: item.name,
      fingerprint: item.fingerprint,
      quantity: item.quantity,
      exchangeQuantity: item.exchangeQuantity!,
      baseGold: item.baseGold!,
      inventorySlot: index,
      bankPack: null,
      bankSlot: null,
      bankMap: null,
    }));
  }

  const seenPacks = new Set<string>();
  for (const pack of snapshot.bankPacks) {
    if (!/^items[0-9]+$/.test(pack.pack)
        || seenPacks.has(pack.pack)
        || !Array.isArray(pack.slots)
        || pack.slots.length > 42) {
      throw new Error("PR20_8_EXCHANGE_ACQ_BANK_PACK_UNGUELTIG");
    }
    seenPacks.add(pack.pack);
    text(pack.packMap, "PR20_8_EXCHANGE_ACQ_BANK_MAP_UNGUELTIG");
    for (let bankSlot = 0; bankSlot < pack.slots.length; bankSlot += 1) {
      const item = pack.slots[bankSlot] ?? null;
      if (item === null) continue;
      validateItem(item);
      if (!eligible(item)) {
        rejectedCount += 1;
        continue;
      }
      bankCandidates.push(Object.freeze({
        source: "BANK",
        name: item.name,
        fingerprint: item.fingerprint,
        quantity: item.quantity,
        exchangeQuantity: item.exchangeQuantity!,
        baseGold: item.baseGold!,
        inventorySlot: null,
        bankPack: pack.pack,
        bankSlot,
        bankMap: pack.packMap,
      }));
    }
  }

  inventoryCandidates.sort(compareCandidate);
  bankCandidates.sort(compareCandidate);
  const inventorySelected = inventoryCandidates[0] ?? null;
  const bankSelected = bankCandidates[0] ?? null;

  const common = {
    schemaVersion: 1 as const,
    inventoryCandidateCount: inventoryCandidates.length,
    bankCandidateCount: bankCandidates.length,
    rejectedCount,
    scannerMustReverifyAfterAcquisition: true as const,
    acquisitionCountsAsExchangeEvidence: false as const,
    buyAllowed: false as const,
    farmAllowed: false as const,
    bankRetrieveAuthority: false as const,
    exchangeAuthority: false as const,
    gameplayAuthority: false as const,
    rawWriteAuthority: false as const,
    normalRuntimeAllowed: false as const,
  };

  if (inventorySelected !== null) {
    return Object.freeze({
      ...common,
      status: "INVENTORY_CANDIDATE_READY",
      selected: inventorySelected,
      expectedRetrieveCandidate: null,
      acquisitionMutationRequired: false,
      acquisitionKind: "NONE",
    });
  }

  if (!snapshot.bankMounted) {
    return Object.freeze({
      ...common,
      status: "BANK_DISCOVERY_REQUIRED",
      selected: null,
      expectedRetrieveCandidate: null,
      acquisitionMutationRequired: false,
      acquisitionKind: "NONE",
    });
  }

  if (bankSelected === null) {
    return Object.freeze({
      ...common,
      status: "NO_CANDIDATE",
      selected: null,
      expectedRetrieveCandidate: null,
      acquisitionMutationRequired: false,
      acquisitionKind: "NONE",
    });
  }

  const inventorySlot = freeInventorySlot(
    snapshot.inventory,
    snapshot.inventoryCapacity,
  );
  if (inventorySlot < 0) {
    return Object.freeze({
      ...common,
      status: "BANK_CANDIDATE_BLOCKED_NO_FREE_INVENTORY_SLOT",
      selected: bankSelected,
      expectedRetrieveCandidate: null,
      acquisitionMutationRequired: false,
      acquisitionKind: "NONE",
    });
  }

  const expectedRetrieveCandidate: BankRetrieveErsterKandidat = Object.freeze({
    schemaVersion: 1,
    richtung: "RETRIEVE",
    pack: bankSelected.bankPack!,
    bankSlot: bankSelected.bankSlot!,
    inventorySlot,
    item: Object.freeze({
      name: bankSelected.name,
      fingerprint: bankSelected.fingerprint,
    }),
    explizitesLeeresInventarZiel: true,
    automatischeZielwahl: false,
  });

  return Object.freeze({
    ...common,
    status: "BANK_RETRIEVE_CANDIDATE_READY",
    selected: Object.freeze({
      ...bankSelected,
      inventorySlot,
    }),
    expectedRetrieveCandidate,
    acquisitionMutationRequired: true,
    acquisitionKind: "BANK_RETRIEVE",
  });
}
