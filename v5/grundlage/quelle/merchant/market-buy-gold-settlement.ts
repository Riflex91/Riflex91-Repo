export const MARKET_BUY_GOLD_ERSTE_MENGE = 1;

export interface MarketBuyGoldBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly beobachtetAmMs: number;
  readonly vendorId: string;
  readonly itemName: string;
  readonly menge: 1;
  readonly einzelpreisGold: number;
  readonly erwarteteKostenGold: number;
  readonly characterGold: number;
  readonly itemGesamtmenge: number;
  readonly inventoryFingerprint: string;
  readonly itemDefinitionFingerprint: string;
  readonly vendorFingerprint: string;
}

export interface MarketBuyGoldBereitschaft {
  readonly schemaVersion: 1;
  readonly ctype: string;
  readonly lebt: boolean;
  readonly idle: boolean;
  readonly warteschlangeLeer: boolean;
  readonly alternativeRuntimeAktiv: boolean;
  readonly offeneKaufTransaktion: boolean;
  readonly evidenceFrisch: boolean;
  readonly vendorErreichbar: boolean;
  readonly inventoryCapacityOk: boolean;
  readonly goldBudgetFreigegeben: boolean;
  readonly itemDefinitionGoldKaufbar: boolean;
  readonly bindung: MarketBuyGoldBindung;
}

export interface MarketBuyGoldBereitschaftErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly menge: 1;
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface MarketBuyGoldSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly grund: string;
  readonly goldDelta: number;
  readonly itemMengenDelta: number;
  readonly neuerInventoryFingerprint: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function safeInt(wert: number, min: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < min) throw new Error(fehler);
}

function fp(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}

function validiereBindung(b: MarketBuyGoldBindung): void {
  if (!b || b.schemaVersion !== 1) {
    throw new Error("MARKET_BUY_GOLD_BINDUNG_SCHEMA_UNGUELTIG");
  }
  for (const [v, e] of [
    [b.characterId, "MARKET_BUY_GOLD_CHARACTER_ID_UNGUELTIG"],
    [b.sessionId, "MARKET_BUY_GOLD_SESSION_ID_UNGUELTIG"],
    [b.serverRegion, "MARKET_BUY_GOLD_SERVER_REGION_UNGUELTIG"],
    [b.serverKennung, "MARKET_BUY_GOLD_SERVER_KENNUNG_UNGUELTIG"],
    [b.vendorId, "MARKET_BUY_GOLD_VENDOR_ID_UNGUELTIG"],
    [b.itemName, "MARKET_BUY_GOLD_ITEM_NAME_UNGUELTIG"],
  ] as const) text(v, e);
  if (b.menge !== MARKET_BUY_GOLD_ERSTE_MENGE) {
    throw new Error("MARKET_BUY_GOLD_MENGE_UNGUELTIG");
  }
  safeInt(b.beobachtetAmMs, 0, "MARKET_BUY_GOLD_ZEIT_UNGUELTIG");
  safeInt(b.einzelpreisGold, 1, "MARKET_BUY_GOLD_PREIS_UNGUELTIG");
  safeInt(b.erwarteteKostenGold, 1, "MARKET_BUY_GOLD_KOSTEN_UNGUELTIG");
  safeInt(b.characterGold, 0, "MARKET_BUY_GOLD_GOLD_UNGUELTIG");
  safeInt(b.itemGesamtmenge, 0, "MARKET_BUY_GOLD_ITEM_MENGE_UNGUELTIG");
  if (b.erwarteteKostenGold !== b.einzelpreisGold * b.menge) {
    throw new Error("MARKET_BUY_GOLD_KOSTEN_WIDERSPRUCH");
  }
  fp(b.inventoryFingerprint, "MARKET_BUY_GOLD_INVENTORY_FP_UNGUELTIG");
  fp(b.itemDefinitionFingerprint, "MARKET_BUY_GOLD_ITEM_DEF_FP_UNGUELTIG");
  fp(b.vendorFingerprint, "MARKET_BUY_GOLD_VENDOR_FP_UNGUELTIG");
}

function gleicheBindung(a: MarketBuyGoldBindung, b: MarketBuyGoldBindung): boolean {
  return a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverKennung === b.serverKennung
    && a.vendorId === b.vendorId
    && a.itemName === b.itemName
    && a.menge === b.menge
    && a.einzelpreisGold === b.einzelpreisGold
    && a.erwarteteKostenGold === b.erwarteteKostenGold
    && a.itemDefinitionFingerprint === b.itemDefinitionFingerprint
    && a.vendorFingerprint === b.vendorFingerprint;
}

export function pruefeMarketBuyGoldBereitschaft(
  eingabe: MarketBuyGoldBereitschaft,
): MarketBuyGoldBereitschaftErgebnis {
  if (!eingabe || eingabe.schemaVersion !== 1) {
    throw new Error("MARKET_BUY_GOLD_BEREITSCHAFT_SCHEMA_UNGUELTIG");
  }
  validiereBindung(eingabe.bindung);
  let gruende: readonly string[] = Object.freeze([]);
  const add = (grund: string): void => {
    if (gruende.length >= 16) throw new Error("MARKET_BUY_GOLD_BLOCKER_GRENZE");
    gruende = Object.freeze([...gruende, grund]);
  };

  if (eingabe.ctype !== "merchant") add("MARKET_BUY_GOLD_NUR_MERCHANT");
  if (!eingabe.lebt) add("MARKET_BUY_GOLD_CHARACTER_NICHT_BEREIT");
  if (!eingabe.idle || !eingabe.warteschlangeLeer) add("MARKET_BUY_GOLD_CHARACTER_BUSY");
  if (eingabe.alternativeRuntimeAktiv) add("MARKET_BUY_GOLD_ALTERNATIVE_RUNTIME_AKTIV");
  if (eingabe.offeneKaufTransaktion) add("MARKET_BUY_GOLD_OFFENE_TRANSAKTION");
  if (!eingabe.evidenceFrisch) add("MARKET_BUY_GOLD_EVIDENCE_STALE");
  if (!eingabe.vendorErreichbar) add("MARKET_BUY_GOLD_VENDOR_NICHT_ERREICHBAR");
  if (!eingabe.inventoryCapacityOk) add("MARKET_BUY_GOLD_INVENTORY_CAPACITY");
  if (!eingabe.goldBudgetFreigegeben) add("MARKET_BUY_GOLD_BUDGET_BLOCKIERT");
  if (!eingabe.itemDefinitionGoldKaufbar) add("MARKET_BUY_GOLD_ITEM_NICHT_GOLD_KAUFBAR");
  if (eingabe.bindung.characterGold < eingabe.bindung.erwarteteKostenGold) {
    add("MARKET_BUY_GOLD_GOLD_ZU_NIEDRIG");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    menge: MARKET_BUY_GOLD_ERSTE_MENGE,
    gruende: Object.freeze([...gruende]),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function pruefeMarketBuyGoldSettlement(
  vorher: MarketBuyGoldBindung,
  nachher: MarketBuyGoldBindung,
): MarketBuyGoldSettlementErgebnis {
  validiereBindung(vorher);
  validiereBindung(nachher);

  const goldDelta = nachher.characterGold - vorher.characterGold;
  const itemMengenDelta = nachher.itemGesamtmenge - vorher.itemGesamtmenge;
  const neuerInventoryFingerprint =
    nachher.inventoryFingerprint !== vorher.inventoryFingerprint;

  const out = (
    status: MarketBuyGoldSettlementErgebnis["status"],
    grund: string,
  ): MarketBuyGoldSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    grund,
    goldDelta,
    itemMengenDelta,
    neuerInventoryFingerprint,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheBindung(vorher, nachher)) {
    return out("DRIFT", "MARKET_BUY_GOLD_BINDUNG_DRIFT");
  }
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return out("DRIFT", "MARKET_BUY_GOLD_BEOBACHTUNG_NICHT_NEUER");
  }

  const exakt = goldDelta === -vorher.erwarteteKostenGold
    && itemMengenDelta === MARKET_BUY_GOLD_ERSTE_MENGE;
  if (exakt && neuerInventoryFingerprint) {
    return out("BESTAETIGT", "MARKET_BUY_GOLD_EXAKTES_GOLD_ITEM_DELTA");
  }
  if (exakt && !neuerInventoryFingerprint) {
    return out("OFFEN", "MARKET_BUY_GOLD_FINGERPRINT_NOCH_NICHT_NEU");
  }

  const unveraendert = goldDelta === 0
    && itemMengenDelta === 0
    && !neuerInventoryFingerprint;
  if (unveraendert) {
    return out("OFFEN", "MARKET_BUY_GOLD_NOCH_KEINE_SICHTBARE_WIRKUNG");
  }

  return out("DRIFT", "MARKET_BUY_GOLD_DELTA_WIDERSPRUCH");
}
