import {
  pruefeMarketBuyGoldSettlement,
  type MarketBuyGoldBindung,
} from "../merchant/market-buy-gold-settlement.js";

export const PR20_7_ACQUISITION_PURCHASE_ACTION_CONTRACT_ID =
  "AL-ACTION-BUY-WITH-GOLD";
export const PR20_7_ACQUISITION_PURCHASE_RECOVERY_CONTRACT_ID =
  "AL-RECOVERY-BUY-WITH-GOLD";
export const PR20_7_ACQUISITION_PURCHASE_VERIFIER_ID =
  "AL-VERIFIER-BUY-WITH-GOLD";
export const PR20_7_ACQUISITION_PURCHASE_POLICY_ID =
  "PR20-7-WSHIELD-PURCHASE-PREPARATION-ONE-SHOT-V1";
export const PR20_7_ACQUISITION_PURCHASE_ITEM = "wshield";
export const PR20_7_ACQUISITION_PURCHASE_SLOT = "offhand";
export const PR20_7_ACQUISITION_PURCHASE_QUANTITY = 1;
export const PR20_7_ACQUISITION_PURCHASE_EXACT_COST = 4_800;
export const PR20_7_ACQUISITION_PURCHASE_MIN_GOLD_RESERVE = 1_000;
export const PR20_7_ACQUISITION_PURCHASE_SOCKET_BUDGET = 100;
export const PR20_7_ACQUISITION_PURCHASE_MAX_TTL_MS = 1_500;

export interface Pr207AcquisitionPurchaseObservation {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly characterId: "My_Merchant";
  readonly sessionId: "My_Merchant";
  readonly serverRegion: "EU";
  readonly serverIdentifier: "I";
  readonly ctype: "merchant";
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly shadowEvidenceRatified: boolean;
  readonly itemName: "wshield";
  readonly targetSlot: "offhand";
  readonly quantity: 1;
  readonly unitPrice: 4800;
  readonly observedGold: number;
  readonly freeInventorySlots: number;
  readonly existingQuantity: number;
  readonly currentOffhandEmpty: boolean;
  readonly currentMainhandDoublehand: boolean;
  readonly classCompatible: boolean;
  readonly buyWithGoldAvailable: boolean;
  readonly vendorReachable: boolean;
  readonly nearestVendorDistance: number;
  readonly sellDistance: 400;
  readonly inventoryFingerprint: string;
  readonly goldFingerprint: string;
  readonly itemDefinitionFingerprint: string;
  readonly vendorFingerprint: string;
  readonly prestateFingerprint: string;
}

export interface Pr207AcquisitionPurchasePlan {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE";
  readonly evidenceId: string;
  readonly characterId: "My_Merchant";
  readonly sessionId: "My_Merchant";
  readonly serverRegion: "EU";
  readonly serverIdentifier: "I";
  readonly itemName: "wshield";
  readonly targetSlot: "offhand";
  readonly quantity: 1;
  readonly exactCost: 4800;
  readonly minimumGoldSafetyReserve: 1000;
  readonly actionContractId: typeof PR20_7_ACQUISITION_PURCHASE_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof PR20_7_ACQUISITION_PURCHASE_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof PR20_7_ACQUISITION_PURCHASE_VERIFIER_ID;
  readonly actionChannel: "buy";
  readonly resourceIds: readonly [
    string,
    string,
    string,
  ];
  readonly socketBudgetResource: string;
  readonly socketPlanBudgetReserved: 100;
  readonly socketServerReserveUntouched: 100;
  readonly prestateFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly goldFingerprint: string;
  readonly itemDefinitionFingerprint: string;
  readonly vendorFingerprint: string;
  readonly observedGold: number;
  readonly freeInventorySlots: number;
  readonly nearestVendorDistance: number;
  readonly sellDistance: 400;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly durableIntentRequired: true;
  readonly durableReadbackRequired: true;
  readonly sendBoundaryInitial: "NICHT_GESENDET";
  readonly sameIntentRetry: false;
  readonly oneShotMaximumUses: 1;
  readonly purchaseAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr207AcquisitionPurchasePreparationResult {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly gruende: readonly string[];
  readonly plan: Pr207AcquisitionPurchasePlan | null;
  readonly purchaseAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

export interface Pr207AcquisitionPurchaseFenceClaim {
  readonly ressourcenId: string;
  readonly epoche: number;
}

export interface Pr207AcquisitionPurchaseOneShotData {
  readonly schemaVersion: 1;
  readonly policyId: typeof PR20_7_ACQUISITION_PURCHASE_POLICY_ID;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly plan: Pr207AcquisitionPurchasePlan;
  readonly resourceClaims: readonly Pr207AcquisitionPurchaseFenceClaim[];
  readonly socketBudgetReservationId: string;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximaleVerwendungen: 1;
  readonly purchaseAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

function text(value: string, fehler: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(fehler);
}

function safeInt(value: number, min: number, fehler: string): void {
  if (!Number.isSafeInteger(value) || value < min) throw new Error(fehler);
}

function hash(value: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error(fehler);
}

export function pruefePr207AcquisitionPurchaseVorbereitung(
  o: Pr207AcquisitionPurchaseObservation,
  jetztMs: number,
): Pr207AcquisitionPurchasePreparationResult {
  if (!o || o.schemaVersion !== 1) {
    throw new Error("PR20_7_ACQUISITION_PURCHASE_SCHEMA_UNGUELTIG");
  }
  safeInt(jetztMs, 0, "PR20_7_ACQUISITION_PURCHASE_ZEIT_UNGUELTIG");
  safeInt(o.beobachtetAmMs, 0, "PR20_7_ACQUISITION_PURCHASE_BEOBACHTUNG_UNGUELTIG");
  safeInt(o.gueltigBisMs, 0, "PR20_7_ACQUISITION_PURCHASE_GUELTIGKEIT_UNGUELTIG");
  text(o.evidenceId, "PR20_7_ACQUISITION_PURCHASE_EVIDENCE_ID_UNGUELTIG");
  for (const [value, fehler] of [
    [o.inventoryFingerprint, "PR20_7_ACQUISITION_PURCHASE_INVENTORY_FP_UNGUELTIG"],
    [o.goldFingerprint, "PR20_7_ACQUISITION_PURCHASE_GOLD_FP_UNGUELTIG"],
    [o.itemDefinitionFingerprint, "PR20_7_ACQUISITION_PURCHASE_ITEM_FP_UNGUELTIG"],
    [o.vendorFingerprint, "PR20_7_ACQUISITION_PURCHASE_VENDOR_FP_UNGUELTIG"],
    [o.prestateFingerprint, "PR20_7_ACQUISITION_PURCHASE_PRESTATE_FP_UNGUELTIG"],
  ] as const) hash(value, fehler);

  const gruende: string[] = [];
  const add = (grund: string): void => { if (!gruende.includes(grund)) gruende.push(grund); };

  if (o.characterId !== "My_Merchant"
      || o.sessionId !== "My_Merchant"
      || o.ctype !== "merchant") add("PR20_7_ACQUISITION_PURCHASE_RECIPIENT_DRIFT");
  if (o.serverRegion !== "EU" || o.serverIdentifier !== "I") {
    add("PR20_7_ACQUISITION_PURCHASE_SERVER_DRIFT");
  }
  if (!o.shadowEvidenceRatified) add("PR20_7_ACQUISITION_PURCHASE_SHADOW_EVIDENCE_FEHLT");
  if (o.itemName !== PR20_7_ACQUISITION_PURCHASE_ITEM
      || o.targetSlot !== PR20_7_ACQUISITION_PURCHASE_SLOT
      || o.quantity !== PR20_7_ACQUISITION_PURCHASE_QUANTITY
      || o.unitPrice !== PR20_7_ACQUISITION_PURCHASE_EXACT_COST) {
    add("PR20_7_ACQUISITION_PURCHASE_KANDIDAT_DRIFT");
  }
  if (!o.currentOffhandEmpty) add("PR20_7_ACQUISITION_PURCHASE_OFFHAND_BELEGT");
  if (o.currentMainhandDoublehand) add("PR20_7_ACQUISITION_PURCHASE_DOUBLEHAND_BLOCK");
  if (!o.classCompatible) add("PR20_7_ACQUISITION_PURCHASE_CLASS_BLOCK");
  if (!o.buyWithGoldAvailable) add("PR20_7_ACQUISITION_PURCHASE_API_FEHLT");
  if (!o.vendorReachable
      || !Number.isFinite(o.nearestVendorDistance)
      || o.nearestVendorDistance < 0
      || o.nearestVendorDistance >= o.sellDistance) {
    add("PR20_7_ACQUISITION_PURCHASE_VENDOR_NICHT_ERREICHBAR");
  }
  if (o.sellDistance !== 400) add("PR20_7_ACQUISITION_PURCHASE_SELL_DISTANCE_DRIFT");
  if (!Number.isSafeInteger(o.freeInventorySlots) || o.freeInventorySlots < 1) {
    add("PR20_7_ACQUISITION_PURCHASE_INVENTAR_VOLL");
  }
  if (o.existingQuantity !== 0) add("PR20_7_ACQUISITION_PURCHASE_WSHIELD_BEREITS_VORHANDEN");
  if (!Number.isSafeInteger(o.observedGold)
      || o.observedGold < PR20_7_ACQUISITION_PURCHASE_EXACT_COST
        + PR20_7_ACQUISITION_PURCHASE_MIN_GOLD_RESERVE) {
    add("PR20_7_ACQUISITION_PURCHASE_GOLD_BUDGET_BLOCK");
  }
  if (o.gueltigBisMs < o.beobachtetAmMs
      || o.gueltigBisMs - o.beobachtetAmMs > PR20_7_ACQUISITION_PURCHASE_MAX_TTL_MS
      || jetztMs < o.beobachtetAmMs
      || jetztMs > o.gueltigBisMs) {
    add("PR20_7_ACQUISITION_PURCHASE_EVIDENCE_STALE");
  }

  if (gruende.length > 0) {
    return Object.freeze({
      schemaVersion: 1,
      status: "BLOCKIERT",
      gruende: Object.freeze([...gruende]),
      plan: null,
      purchaseAuthorityIssued: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
    });
  }

  const resourceIds = Object.freeze([
    "character:My_Merchant:gold",
    "character:My_Merchant:inventory",
    "character:My_Merchant:action_channel:buy",
  ] as const);

  const plan: Pr207AcquisitionPurchasePlan = Object.freeze({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    evidenceId: o.evidenceId,
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    itemName: "wshield",
    targetSlot: "offhand",
    quantity: 1,
    exactCost: 4_800,
    minimumGoldSafetyReserve: 1_000,
    actionContractId: PR20_7_ACQUISITION_PURCHASE_ACTION_CONTRACT_ID,
    recoveryContractId: PR20_7_ACQUISITION_PURCHASE_RECOVERY_CONTRACT_ID,
    verifierId: PR20_7_ACQUISITION_PURCHASE_VERIFIER_ID,
    actionChannel: "buy",
    resourceIds,
    socketBudgetResource: "character:My_Merchant:socket_call_budget",
    socketPlanBudgetReserved: 100,
    socketServerReserveUntouched: 100,
    prestateFingerprint: o.prestateFingerprint,
    inventoryFingerprint: o.inventoryFingerprint,
    goldFingerprint: o.goldFingerprint,
    itemDefinitionFingerprint: o.itemDefinitionFingerprint,
    vendorFingerprint: o.vendorFingerprint,
    observedGold: o.observedGold,
    freeInventorySlots: o.freeInventorySlots,
    nearestVendorDistance: o.nearestVendorDistance,
    sellDistance: 400,
    ausgestelltAmMs: jetztMs,
    gueltigBisMs: o.gueltigBisMs,
    durableIntentRequired: true,
    durableReadbackRequired: true,
    sendBoundaryInitial: "NICHT_GESENDET",
    sameIntentRetry: false,
    oneShotMaximumUses: 1,
    purchaseAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
  return Object.freeze({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    gruende: Object.freeze([]),
    plan,
    purchaseAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
  });
}

export class Pr207AcquisitionPurchaseOneShotPreparation {
  readonly #data: Pr207AcquisitionPurchaseOneShotData;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(data: Pr207AcquisitionPurchaseOneShotData) {
    this.#data = Object.freeze({
      ...data,
      plan: data.plan,
      resourceClaims: Object.freeze(data.resourceClaims.map(x => Object.freeze({ ...x }))),
    });
  }

  public data(): Pr207AcquisitionPurchaseOneShotData {
    return this.#data;
  }

  public gueltigFuer(jetztMs: number): boolean {
    return Number.isSafeInteger(jetztMs)
      && jetztMs >= this.#data.ausgestelltAmMs
      && jetztMs <= this.#data.gueltigBisMs
      && !this.#verbraucht
      && !this.#widerrufen;
  }

  public pruefeExakteBindung(
    plan: Pr207AcquisitionPurchasePlan,
    jetztMs: number,
    goldFenceEpoche: number,
    inventoryFenceEpoche: number,
    buyChannelFenceEpoche: number,
    socketBudgetReservationId: string,
  ): Readonly<{
    schemaVersion: 1;
    bereit: boolean;
    grund: string;
    verbraucht: boolean;
    purchaseAuthorityIssued: false;
    gameplayAuthority: false;
    rawWriteAuthority: false;
  }> {
    if (!this.gueltigFuer(jetztMs)) return this.#blockiert("PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_NICHT_GUELTIG");
    const claims = new Map(this.#data.resourceClaims.map(x => [x.ressourcenId, x.epoche]));
    const passt = plan.evidenceId === this.#data.plan.evidenceId
      && plan.prestateFingerprint === this.#data.plan.prestateFingerprint
      && plan.inventoryFingerprint === this.#data.plan.inventoryFingerprint
      && plan.goldFingerprint === this.#data.plan.goldFingerprint
      && plan.itemDefinitionFingerprint === this.#data.plan.itemDefinitionFingerprint
      && plan.vendorFingerprint === this.#data.plan.vendorFingerprint
      && plan.observedGold === this.#data.plan.observedGold
      && plan.freeInventorySlots === this.#data.plan.freeInventorySlots
      && claims.get("character:My_Merchant:gold") === goldFenceEpoche
      && claims.get("character:My_Merchant:inventory") === inventoryFenceEpoche
      && claims.get("character:My_Merchant:action_channel:buy") === buyChannelFenceEpoche
      && socketBudgetReservationId === this.#data.socketBudgetReservationId;
    if (!passt) {
      this.#widerrufen = true;
      return this.#blockiert("PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_BINDUNG_ODER_FENCE_DRIFT");
    }
    this.#verbraucht = true;
    return Object.freeze({
      schemaVersion: 1,
      bereit: true,
      grund: "PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_EXAKT_GEBUNDEN_NO_WRITE",
      verbraucht: true,
      purchaseAuthorityIssued: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
    });
  }

  public widerrufe(): void { this.#widerrufen = true; }
  public verbraucht(): boolean { return this.#verbraucht; }

  #blockiert(grund: string) {
    return Object.freeze({
      schemaVersion: 1 as const,
      bereit: false,
      grund,
      verbraucht: this.#verbraucht,
      purchaseAuthorityIssued: false as const,
      gameplayAuthority: false as const,
      rawWriteAuthority: false as const,
    });
  }
}

export function erstellePr207AcquisitionPurchaseOneShotPreparation(
  plan: Pr207AcquisitionPurchasePlan,
  aktivierungsId: string,
  transaktionsId: string,
  ausgestelltAmMs: number,
  gueltigBisMs: number,
  goldFenceEpoche: number,
  inventoryFenceEpoche: number,
  buyChannelFenceEpoche: number,
  socketBudgetReservationId: string,
): Pr207AcquisitionPurchaseOneShotPreparation {
  if (plan.status !== "BEREIT_NO_WRITE"
      || plan.purchaseAuthorityIssued !== false
      || plan.gameplayAuthority !== false
      || plan.rawWriteAuthority !== false) {
    throw new Error("PR20_7_ACQUISITION_PURCHASE_PLAN_UNGUELTIG");
  }
  for (const value of [aktivierungsId, transaktionsId, socketBudgetReservationId]) {
    text(value, "PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_ID_UNGUELTIG");
  }
  safeInt(ausgestelltAmMs, 0, "PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_ZEIT_UNGUELTIG");
  safeInt(gueltigBisMs, 0, "PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_TTL_UNGUELTIG");
  if (gueltigBisMs < ausgestelltAmMs
      || gueltigBisMs - ausgestelltAmMs > PR20_7_ACQUISITION_PURCHASE_MAX_TTL_MS) {
    throw new Error("PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_TTL_UNGUELTIG");
  }
  for (const epoche of [goldFenceEpoche, inventoryFenceEpoche, buyChannelFenceEpoche]) {
    if (!Number.isSafeInteger(epoche) || epoche < 1) {
      throw new Error("PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_FENCE_UNGUELTIG");
    }
  }
  return new Pr207AcquisitionPurchaseOneShotPreparation(Object.freeze({
    schemaVersion: 1,
    policyId: PR20_7_ACQUISITION_PURCHASE_POLICY_ID,
    aktivierungsId,
    transaktionsId,
    plan,
    resourceClaims: Object.freeze([
      Object.freeze({ ressourcenId: "character:My_Merchant:gold", epoche: goldFenceEpoche }),
      Object.freeze({ ressourcenId: "character:My_Merchant:inventory", epoche: inventoryFenceEpoche }),
      Object.freeze({ ressourcenId: "character:My_Merchant:action_channel:buy", epoche: buyChannelFenceEpoche }),
    ]),
    socketBudgetReservationId,
    ausgestelltAmMs,
    gueltigBisMs,
    maximaleVerwendungen: 1,
    purchaseAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
  }));
}

export function pruefePr207AcquisitionPurchaseSettlement(
  vorher: MarketBuyGoldBindung,
  nachher: MarketBuyGoldBindung,
): Readonly<{
  schemaVersion: 1;
  status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  grund: string;
  sameIntentRetry: false;
  purchaseAuthorityIssued: false;
}> {
  if (vorher.characterId !== "My_Merchant"
      || vorher.sessionId !== "My_Merchant"
      || vorher.serverRegion !== "EU"
      || vorher.serverKennung !== "I"
      || vorher.vendorId !== "basics"
      || vorher.itemName !== "wshield"
      || vorher.menge !== 1
      || vorher.einzelpreisGold !== 4_800
      || vorher.erwarteteKostenGold !== 4_800) {
    throw new Error("PR20_7_ACQUISITION_PURCHASE_SETTLEMENT_BINDUNG_UNGUELTIG");
  }
  const result = pruefeMarketBuyGoldSettlement(vorher, nachher);
  return Object.freeze({
    schemaVersion: 1,
    status: result.status,
    grund: result.grund,
    sameIntentRetry: false,
    purchaseAuthorityIssued: false,
  });
}
