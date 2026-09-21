export const BANK_STORE_ERSTER_BETRAG_ITEMS = 1;

export interface BankStoreItemReferenz {
  readonly slot: number;
  readonly itemFingerprint: string | null;
}

export interface BankStoreBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly beobachtetAmMs: number;
  readonly sourceSlot: number;
  readonly targetPack: string;
  readonly targetSlot: number;
  readonly sourceItemFingerprint: string | null;
  readonly targetItemFingerprint: string | null;
  readonly fingerprint: string;
}

export interface BankStoreBereitschaft {
  readonly schemaVersion: 1;
  readonly ctype: string;
  readonly lebt: boolean;
  readonly bankGemountet: boolean;
  readonly alternativeRuntimeAktiv: boolean;
  readonly offeneBankTransaktion: boolean;
  readonly evidenceFrisch: boolean;
  readonly bindung: BankStoreBindung;
}

export interface BankStoreBereitschaftErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly betragItems: 1;
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankStoreSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly betragItems: 1;
  readonly grund: string;
  readonly sourceSlotLeer: boolean;
  readonly targetEntsprichtQuelle: boolean;
  readonly neuerFingerprint: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, maximum: number, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > maximum) throw new Error(fehler);
}

function pruefeSafeInt(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function pruefeOptionalFingerprint(
  wert: string | null,
  fehler: string,
): void {
  if (wert !== null && !/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}

function pruefeBindung(bindung: BankStoreBindung): void {
  if (bindung.schemaVersion !== 1) {
    throw new Error("BANK_STORE_BINDUNG_SCHEMA_UNGUELTIG");
  }
  for (const [wert, max, fehler] of [
    [bindung.characterId, 192, "BANK_STORE_CHARACTER_ID_UNGUELTIG"],
    [bindung.sessionId, 192, "BANK_STORE_SESSION_ID_UNGUELTIG"],
    [bindung.serverRegion, 32, "BANK_STORE_SERVER_REGION_UNGUELTIG"],
    [bindung.serverKennung, 32, "BANK_STORE_SERVER_KENNUNG_UNGUELTIG"],
    [bindung.targetPack, 64, "BANK_STORE_TARGET_PACK_UNGUELTIG"],
  ] as const) {
    pruefeText(wert, max, fehler);
  }
  if (!/^items[0-9]+$/.test(bindung.targetPack)) {
    throw new Error("BANK_STORE_TARGET_PACK_UNGUELTIG");
  }
  pruefeSafeInt(bindung.leaseEpoche, 1, Number.MAX_SAFE_INTEGER, "BANK_STORE_LEASE_EPOCHE_UNGUELTIG");
  pruefeSafeInt(bindung.mountEpoche, 1, Number.MAX_SAFE_INTEGER, "BANK_STORE_MOUNT_EPOCHE_UNGUELTIG");
  pruefeSafeInt(bindung.beobachtetAmMs, 0, Number.MAX_SAFE_INTEGER, "BANK_STORE_ZEIT_UNGUELTIG");
  pruefeSafeInt(bindung.sourceSlot, 0, 41, "BANK_STORE_SOURCE_SLOT_UNGUELTIG");
  pruefeSafeInt(bindung.targetSlot, 0, 41, "BANK_STORE_TARGET_SLOT_UNGUELTIG");
  pruefeOptionalFingerprint(
    bindung.sourceItemFingerprint,
    "BANK_STORE_SOURCE_ITEM_FP_UNGUELTIG",
  );
  pruefeOptionalFingerprint(
    bindung.targetItemFingerprint,
    "BANK_STORE_TARGET_ITEM_FP_UNGUELTIG",
  );
  if (!/^[0-9a-f]{64}$/i.test(bindung.fingerprint)) {
    throw new Error("BANK_STORE_FINGERPRINT_UNGUELTIG");
  }
}

function gleicheIdentitaet(
  vorher: BankStoreBindung,
  nachher: BankStoreBindung,
): boolean {
  return vorher.characterId === nachher.characterId
    && vorher.sessionId === nachher.sessionId
    && vorher.serverRegion === nachher.serverRegion
    && vorher.serverKennung === nachher.serverKennung
    && vorher.leaseEpoche === nachher.leaseEpoche
    && vorher.mountEpoche === nachher.mountEpoche
    && vorher.sourceSlot === nachher.sourceSlot
    && vorher.targetPack === nachher.targetPack
    && vorher.targetSlot === nachher.targetSlot;
}

export function pruefeBankStoreBereitschaft(
  eingabe: BankStoreBereitschaft,
): BankStoreBereitschaftErgebnis {
  if (eingabe.schemaVersion !== 1) {
    throw new Error("BANK_STORE_BEREITSCHAFT_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(eingabe.bindung);

  const gruende: string[] = [];
  const add = (grund: string): void => {
    if (gruende.length >= 16) {
      throw new Error("BANK_STORE_BLOCKER_GRENZE_UEBERSCHRITTEN");
    }
    gruende.push(grund);
  };

  if (eingabe.ctype !== "merchant") add("BANK_STORE_NUR_MERCHANT");
  if (!eingabe.lebt) add("BANK_STORE_CHARACTER_NICHT_BEREIT");
  if (!eingabe.bankGemountet) add("BANK_STORE_BANK_NICHT_GEMOUNTET");
  if (eingabe.alternativeRuntimeAktiv) {
    add("BANK_STORE_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (eingabe.offeneBankTransaktion) add("BANK_STORE_OFFENE_TRANSAKTION");
  if (!eingabe.evidenceFrisch) add("BANK_STORE_EVIDENCE_STALE");
  if (eingabe.bindung.sourceItemFingerprint === null) {
    add("BANK_STORE_SOURCE_ITEM_FEHLT");
  }
  if (eingabe.bindung.targetItemFingerprint !== null) {
    add("BANK_STORE_TARGET_SLOT_NICHT_LEER");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    betragItems: BANK_STORE_ERSTER_BETRAG_ITEMS,
    gruende: Object.freeze([...gruende]),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function pruefeBankStoreSettlement(
  vorher: BankStoreBindung,
  nachher: BankStoreBindung,
): BankStoreSettlementErgebnis {
  pruefeBindung(vorher);
  pruefeBindung(nachher);

  const sourceSlotLeer = nachher.sourceItemFingerprint === null;
  const targetEntsprichtQuelle =
    vorher.sourceItemFingerprint !== null
    && nachher.targetItemFingerprint === vorher.sourceItemFingerprint;
  const neuerFingerprint = nachher.fingerprint !== vorher.fingerprint;

  const result = (
    status: BankStoreSettlementErgebnis["status"],
    grund: string,
  ): BankStoreSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    betragItems: BANK_STORE_ERSTER_BETRAG_ITEMS,
    grund,
    sourceSlotLeer,
    targetEntsprichtQuelle,
    neuerFingerprint,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheIdentitaet(vorher, nachher)) {
    return result("DRIFT", "BANK_STORE_BINDUNG_DRIFT");
  }
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return result("DRIFT", "BANK_STORE_BEOBACHTUNG_NICHT_NEUER");
  }
  if (vorher.sourceItemFingerprint === null) {
    return result("DRIFT", "BANK_STORE_VORHER_SOURCE_ITEM_FEHLT");
  }
  if (vorher.targetItemFingerprint !== null) {
    return result("DRIFT", "BANK_STORE_VORHER_TARGET_NICHT_LEER");
  }
  if (!neuerFingerprint) {
    return result("OFFEN", "BANK_STORE_KEIN_NEUER_FINGERPRINT");
  }
  if (sourceSlotLeer && targetEntsprichtQuelle) {
    return result("BESTAETIGT", "BANK_STORE_EXAKTER_ITEM_TRANSFER");
  }
  if (nachher.sourceItemFingerprint === vorher.sourceItemFingerprint
      && nachher.targetItemFingerprint === null) {
    return result("OFFEN", "BANK_STORE_NOCH_KEIN_ITEM_DELTA");
  }
  return result("DRIFT", "BANK_STORE_ITEM_DELTA_WIDERSPRUCH");
}
