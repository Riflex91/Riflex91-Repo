export interface MarketSellBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly map: string;
  readonly beobachtetAmMs: number;
  readonly inventarIndex: number;
  readonly itemName: string;
  readonly itemLevel: number;
  readonly slotMenge: number;
  readonly itemGesamtmenge: number;
  readonly erwarteterGoldZuwachs: number;
  readonly characterGold: number;
  readonly itemFingerprint: string;
  readonly inventoryRestFingerprint: string;
  readonly merchantFingerprint: string;
}

export interface MarketSellSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly grund: string;
  readonly goldDelta: number;
  readonly itemMengenDelta: number;
  readonly restInventoryUnveraendert: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function text(value: string, fehler: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(fehler);
}

function safeInt(value: number, min: number, fehler: string): void {
  if (!Number.isSafeInteger(value) || value < min) throw new Error(fehler);
}

function fp(value: string, fehler: string): void {
  if (!/^[0-9a-f]{16,64}$/i.test(value)) throw new Error(fehler);
}

function validiere(b: MarketSellBindung): void {
  if (!b || b.schemaVersion !== 1) throw new Error("MARKET_SELL_BINDUNG_SCHEMA_UNGUELTIG");
  for (const [value, fehler] of [
    [b.characterId, "MARKET_SELL_CHARACTER_UNGUELTIG"],
    [b.sessionId, "MARKET_SELL_SESSION_UNGUELTIG"],
    [b.serverRegion, "MARKET_SELL_REGION_UNGUELTIG"],
    [b.serverKennung, "MARKET_SELL_SERVER_UNGUELTIG"],
    [b.map, "MARKET_SELL_MAP_UNGUELTIG"],
    [b.itemName, "MARKET_SELL_ITEM_UNGUELTIG"],
  ] as const) text(value, fehler);
  safeInt(b.beobachtetAmMs, 0, "MARKET_SELL_ZEIT_UNGUELTIG");
  safeInt(b.inventarIndex, 0, "MARKET_SELL_INDEX_UNGUELTIG");
  safeInt(b.itemLevel, 0, "MARKET_SELL_LEVEL_UNGUELTIG");
  safeInt(b.slotMenge, 1, "MARKET_SELL_SLOT_MENGE_UNGUELTIG");
  safeInt(b.itemGesamtmenge, 1, "MARKET_SELL_GESAMTMENGE_UNGUELTIG");
  safeInt(b.erwarteterGoldZuwachs, 1, "MARKET_SELL_WERT_UNGUELTIG");
  safeInt(b.characterGold, 0, "MARKET_SELL_GOLD_UNGUELTIG");
  fp(b.itemFingerprint, "MARKET_SELL_ITEM_FP_UNGUELTIG");
  fp(b.inventoryRestFingerprint, "MARKET_SELL_REST_FP_UNGUELTIG");
  fp(b.merchantFingerprint, "MARKET_SELL_MERCHANT_FP_UNGUELTIG");
}

function gleicheBindung(a: MarketSellBindung, b: MarketSellBindung): boolean {
  return a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverKennung === b.serverKennung
    && a.map === b.map
    && a.inventarIndex === b.inventarIndex
    && a.itemName === b.itemName
    && a.itemLevel === b.itemLevel
    && a.erwarteterGoldZuwachs === b.erwarteterGoldZuwachs
    && a.merchantFingerprint === b.merchantFingerprint;
}

export function pruefeMarketSellSettlement(
  vorher: MarketSellBindung,
  nachher: MarketSellBindung,
): MarketSellSettlementErgebnis {
  validiere(vorher);
  validiere(nachher);

  const goldDelta = nachher.characterGold - vorher.characterGold;
  const itemMengenDelta = nachher.itemGesamtmenge - vorher.itemGesamtmenge;
  const restInventoryUnveraendert =
    nachher.inventoryRestFingerprint === vorher.inventoryRestFingerprint;

  const out = (
    status: MarketSellSettlementErgebnis["status"],
    grund: string,
  ): MarketSellSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    grund,
    goldDelta,
    itemMengenDelta,
    restInventoryUnveraendert,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheBindung(vorher, nachher)) {
    return out("DRIFT", "MARKET_SELL_BINDUNG_DRIFT");
  }
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return out("DRIFT", "MARKET_SELL_BEOBACHTUNG_NICHT_NEUER");
  }
  if (goldDelta === vorher.erwarteterGoldZuwachs
      && itemMengenDelta === -1
      && restInventoryUnveraendert) {
    return out("BESTAETIGT", "MARKET_SELL_EXAKTES_ITEM_GOLD_DELTA");
  }
  if (goldDelta === 0
      && itemMengenDelta === 0
      && restInventoryUnveraendert
      && nachher.itemFingerprint === vorher.itemFingerprint) {
    return out("OFFEN", "MARKET_SELL_NOCH_KEINE_SICHTBARE_WIRKUNG");
  }
  return out("DRIFT", "MARKET_SELL_DELTA_WIDERSPRUCH");
}
