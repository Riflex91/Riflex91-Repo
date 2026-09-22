export const BANK_SWAP_SCHEMA_VERSION = 1 as const;

export interface BankSwapBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly beobachtetAmMs: number;
  readonly pack: string;
  readonly slotA: number;
  readonly slotB: number;
  readonly slotABelegt: boolean;
  readonly slotBBelegt: boolean;
  readonly slotAFingerprint: string | null;
  readonly slotBFingerprint: string | null;
  readonly inventoryFingerprint: string;
  readonly packFingerprint: string;
}

export interface BankSwapBereitschaft {
  readonly schemaVersion: 1;
  readonly ctype: string;
  readonly lebt: boolean;
  readonly bankGemountet: boolean;
  readonly alternativeRuntimeAktiv: boolean;
  readonly offeneBankTransaktion: boolean;
  readonly evidenceFrisch: boolean;
  readonly bindung: BankSwapBindung;
}

export interface BankSwapBereitschaftErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankSwapSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly grund: string;
  readonly gleicherItemFingerprint: boolean;
  readonly inventoryUnveraendert: boolean;
  readonly packGeaendert: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function text(
  wert: string,
  max: number,
  fehler: string,
): void {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > max) {
    throw new Error(fehler);
  }
}

function ganzzahl(
  wert: number,
  min: number,
  max: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < min || wert > max) {
    throw new Error(fehler);
  }
}

function pruefeBindung(bindung: BankSwapBindung): void {
  if (bindung.schemaVersion !== BANK_SWAP_SCHEMA_VERSION) {
    throw new Error("BANK_SWAP_BINDUNG_SCHEMA_UNGUELTIG");
  }
  text(bindung.characterId, 192, "BANK_SWAP_CHARACTER_UNGUELTIG");
  text(bindung.sessionId, 192, "BANK_SWAP_SESSION_UNGUELTIG");
  text(bindung.serverRegion, 32, "BANK_SWAP_REGION_UNGUELTIG");
  text(bindung.serverKennung, 32, "BANK_SWAP_SERVER_UNGUELTIG");
  text(bindung.pack, 32, "BANK_SWAP_PACK_UNGUELTIG");
  text(
    bindung.inventoryFingerprint,
    128,
    "BANK_SWAP_INVENTORY_FINGERPRINT_UNGUELTIG",
  );
  text(
    bindung.packFingerprint,
    128,
    "BANK_SWAP_PACK_FINGERPRINT_UNGUELTIG",
  );
  ganzzahl(bindung.leaseEpoche, 1, Number.MAX_SAFE_INTEGER, "BANK_SWAP_LEASE_UNGUELTIG");
  ganzzahl(bindung.mountEpoche, 1, Number.MAX_SAFE_INTEGER, "BANK_SWAP_MOUNT_UNGUELTIG");
  ganzzahl(bindung.beobachtetAmMs, 0, Number.MAX_SAFE_INTEGER, "BANK_SWAP_ZEIT_UNGUELTIG");
  ganzzahl(bindung.slotA, 0, 41, "BANK_SWAP_SLOT_A_UNGUELTIG");
  ganzzahl(bindung.slotB, 0, 41, "BANK_SWAP_SLOT_B_UNGUELTIG");
  if (bindung.slotA === bindung.slotB) {
    throw new Error("BANK_SWAP_SLOTS_MUESSEN_VERSCHIEDEN_SEIN");
  }
  if (bindung.slotAFingerprint !== null) {
    text(
      bindung.slotAFingerprint,
      128,
      "BANK_SWAP_SLOT_A_FINGERPRINT_UNGUELTIG",
    );
  }
  if (bindung.slotBFingerprint !== null) {
    text(
      bindung.slotBFingerprint,
      128,
      "BANK_SWAP_SLOT_B_FINGERPRINT_UNGUELTIG",
    );
  }
}

function gleicheIdentitaet(
  vorher: BankSwapBindung,
  nachher: BankSwapBindung,
): boolean {
  return vorher.characterId === nachher.characterId
    && vorher.sessionId === nachher.sessionId
    && vorher.serverRegion === nachher.serverRegion
    && vorher.serverKennung === nachher.serverKennung
    && vorher.leaseEpoche === nachher.leaseEpoche
    && vorher.mountEpoche === nachher.mountEpoche
    && vorher.pack === nachher.pack
    && vorher.slotA === nachher.slotA
    && vorher.slotB === nachher.slotB;
}

export function pruefeBankSwapBereitschaft(
  eingabe: BankSwapBereitschaft,
): BankSwapBereitschaftErgebnis {
  if (eingabe.schemaVersion !== BANK_SWAP_SCHEMA_VERSION) {
    throw new Error("BANK_SWAP_BEREITSCHAFT_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(eingabe.bindung);

  const gruende: string[] = [];
  const blockiere = (grund: string): void => {
    if (gruende.length >= 16) {
      throw new Error("BANK_SWAP_BLOCKER_GRENZE_UEBERSCHRITTEN");
    }
    gruende.push(grund);
  };

  if (eingabe.ctype !== "merchant") blockiere("BANK_SWAP_NUR_MERCHANT");
  if (!eingabe.lebt) blockiere("BANK_SWAP_CHARACTER_NICHT_BEREIT");
  if (!eingabe.bankGemountet) blockiere("BANK_SWAP_BANK_NICHT_GEMOUNTET");
  if (eingabe.alternativeRuntimeAktiv) {
    blockiere("BANK_SWAP_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (eingabe.offeneBankTransaktion) {
    blockiere("BANK_SWAP_OFFENE_BANK_TRANSAKTION");
  }
  if (!eingabe.evidenceFrisch) blockiere("BANK_SWAP_EVIDENCE_STALE");
  if (!eingabe.bindung.slotABelegt
      || eingabe.bindung.slotAFingerprint === null) {
    blockiere("BANK_SWAP_QUELLSLOT_MUSS_BELEGT_SEIN");
  }
  if (eingabe.bindung.slotBBelegt
      || eingabe.bindung.slotBFingerprint !== null) {
    blockiere("BANK_SWAP_ZIELSLOT_MUSS_LEER_SEIN");
  }

  return Object.freeze({
    schemaVersion: BANK_SWAP_SCHEMA_VERSION,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    gruende: Object.freeze([...gruende]),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function pruefeBankSwapSettlement(
  vorher: BankSwapBindung,
  nachher: BankSwapBindung,
): BankSwapSettlementErgebnis {
  pruefeBindung(vorher);
  pruefeBindung(nachher);

  const gleicherItemFingerprint =
    vorher.slotAFingerprint !== null
    && vorher.slotAFingerprint === nachher.slotBFingerprint;
  const inventoryUnveraendert =
    vorher.inventoryFingerprint === nachher.inventoryFingerprint;
  const packGeaendert =
    vorher.packFingerprint !== nachher.packFingerprint;

  const ergebnis = (
    status: BankSwapSettlementErgebnis["status"],
    grund: string,
  ): BankSwapSettlementErgebnis => Object.freeze({
    schemaVersion: BANK_SWAP_SCHEMA_VERSION,
    status,
    grund,
    gleicherItemFingerprint,
    inventoryUnveraendert,
    packGeaendert,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheIdentitaet(vorher, nachher)) {
    return ergebnis("DRIFT", "BANK_SWAP_BINDUNG_DRIFT");
  }
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return ergebnis("DRIFT", "BANK_SWAP_BEOBACHTUNG_NICHT_NEUER");
  }
  if (!vorher.slotABelegt
      || vorher.slotAFingerprint === null
      || vorher.slotBBelegt
      || vorher.slotBFingerprint !== null) {
    return ergebnis("DRIFT", "BANK_SWAP_VORBEDINGUNG_WIDERSPRUCH");
  }
  if (nachher.slotABelegt === false
      && nachher.slotAFingerprint === null
      && nachher.slotBBelegt === true
      && gleicherItemFingerprint
      && inventoryUnveraendert
      && packGeaendert) {
    return ergebnis("BESTAETIGT", "BANK_SWAP_EXAKTER_BELEGT_NACH_LEER_TRANSFER");
  }
  if (nachher.slotABelegt === vorher.slotABelegt
      && nachher.slotAFingerprint === vorher.slotAFingerprint
      && nachher.slotBBelegt === vorher.slotBBelegt
      && nachher.slotBFingerprint === vorher.slotBFingerprint
      && inventoryUnveraendert
      && !packGeaendert) {
    return ergebnis("OFFEN", "BANK_SWAP_NOCH_KEINE_WIRKUNG");
  }
  return ergebnis("DRIFT", "BANK_SWAP_POSTCONDITION_WIDERSPRUCH");
}
