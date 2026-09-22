export const BANK_SWAP_MIN_SLOT = 0;
export const BANK_SWAP_MAX_SLOT = 41;

export interface BankSwapItemBindung {
  readonly name: string;
  readonly fingerprint: string;
}

export interface BankSwapBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly beobachtetAmMs: number;
  readonly bankPack: string;
  readonly slotA: number;
  readonly slotB: number;
  readonly slotAItem: BankSwapItemBindung;
  readonly slotBItem: BankSwapItemBindung;
  readonly packRestFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly characterGold: number;
  readonly bankGold: number;
  readonly fingerprint: string;
}

export interface BankSwapBereitschaft {
  readonly schemaVersion: 1;
  readonly ctype: string;
  readonly lebt: boolean;
  readonly idle: boolean;
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
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankSwapSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly grund: string;
  readonly neuerFingerprint: boolean;
  readonly slotAGetauscht: boolean;
  readonly slotBGetauscht: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankSwapKandidatItem {
  readonly name: string;
  readonly fingerprint: string;
  readonly placeholder?: boolean;
}

export interface BankSwapKandidatPack {
  readonly pack: string;
  readonly slots: readonly (BankSwapKandidatItem | null)[];
}

export interface BankSwapErsterKandidat {
  readonly schemaVersion: 1;
  readonly pack: string;
  readonly a: number;
  readonly b: number;
  readonly itemA: BankSwapItemBindung;
  readonly itemB: BankSwapItemBindung;
  readonly stackMergeDurchNamensgleichheitAusgeschlossen: true;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeFingerprint(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}

function pruefeSafeInt(wert: number, minimum: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < minimum) throw new Error(fehler);
}

function pruefeSlot(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert)
      || wert < BANK_SWAP_MIN_SLOT
      || wert > BANK_SWAP_MAX_SLOT) {
    throw new Error(fehler);
  }
}

function pruefeItem(item: BankSwapItemBindung, prefix: string): void {
  pruefeText(item.name, prefix + "_NAME_UNGUELTIG");
  pruefeFingerprint(item.fingerprint, prefix + "_FINGERPRINT_UNGUELTIG");
}

function pruefeBindung(bindung: BankSwapBindung): void {
  if (bindung.schemaVersion !== 1) throw new Error("BANK_SWAP_BINDUNG_SCHEMA_UNGUELTIG");
  for (const [wert, fehler] of [
    [bindung.characterId, "BANK_SWAP_CHARACTER_ID_UNGUELTIG"],
    [bindung.sessionId, "BANK_SWAP_SESSION_ID_UNGUELTIG"],
    [bindung.serverRegion, "BANK_SWAP_SERVER_REGION_UNGUELTIG"],
    [bindung.serverKennung, "BANK_SWAP_SERVER_KENNUNG_UNGUELTIG"],
  ] as const) pruefeText(wert, fehler);
  if (!/^items[0-9]+$/.test(bindung.bankPack)) {
    throw new Error("BANK_SWAP_PACK_UNGUELTIG");
  }
  pruefeSafeInt(bindung.leaseEpoche, 1, "BANK_SWAP_LEASE_EPOCHE_UNGUELTIG");
  pruefeSafeInt(bindung.mountEpoche, 1, "BANK_SWAP_MOUNT_EPOCHE_UNGUELTIG");
  pruefeSafeInt(bindung.beobachtetAmMs, 0, "BANK_SWAP_ZEIT_UNGUELTIG");
  pruefeSafeInt(bindung.characterGold, 0, "BANK_SWAP_CHARACTER_GOLD_UNGUELTIG");
  pruefeSafeInt(bindung.bankGold, 0, "BANK_SWAP_BANK_GOLD_UNGUELTIG");
  pruefeSlot(bindung.slotA, "BANK_SWAP_SLOT_A_UNGUELTIG");
  pruefeSlot(bindung.slotB, "BANK_SWAP_SLOT_B_UNGUELTIG");
  if (bindung.slotA === bindung.slotB) throw new Error("BANK_SWAP_SLOTS_IDENTISCH");
  pruefeItem(bindung.slotAItem, "BANK_SWAP_SLOT_A_ITEM");
  pruefeItem(bindung.slotBItem, "BANK_SWAP_SLOT_B_ITEM");
  pruefeFingerprint(bindung.packRestFingerprint, "BANK_SWAP_PACK_REST_FP_UNGUELTIG");
  pruefeFingerprint(bindung.inventoryFingerprint, "BANK_SWAP_INVENTORY_FP_UNGUELTIG");
  pruefeFingerprint(bindung.fingerprint, "BANK_SWAP_FINGERPRINT_UNGUELTIG");
}

function gleicheIdentitaet(vorher: BankSwapBindung, nachher: BankSwapBindung): boolean {
  return vorher.characterId === nachher.characterId
    && vorher.sessionId === nachher.sessionId
    && vorher.serverRegion === nachher.serverRegion
    && vorher.serverKennung === nachher.serverKennung
    && vorher.leaseEpoche === nachher.leaseEpoche
    && vorher.mountEpoche === nachher.mountEpoche
    && vorher.bankPack === nachher.bankPack
    && vorher.slotA === nachher.slotA
    && vorher.slotB === nachher.slotB;
}

export function pruefeBankSwapBereitschaft(
  eingabe: BankSwapBereitschaft,
): BankSwapBereitschaftErgebnis {
  if (eingabe.schemaVersion !== 1) throw new Error("BANK_SWAP_BEREITSCHAFT_SCHEMA_UNGUELTIG");
  pruefeBindung(eingabe.bindung);
  let gruende: readonly string[] = Object.freeze([]);
  const add = (grund: string): void => {
    if (gruende.length >= 16) throw new Error("BANK_SWAP_BLOCKER_GRENZE_UEBERSCHRITTEN");
    gruende = Object.freeze([...gruende, grund]);
  };
  if (eingabe.ctype !== "merchant") add("BANK_SWAP_NUR_MERCHANT");
  if (!eingabe.lebt) add("BANK_SWAP_CHARACTER_NICHT_BEREIT");
  if (!eingabe.idle) add("BANK_SWAP_CHARACTER_NICHT_IDLE");
  if (!eingabe.bankGemountet) add("BANK_SWAP_BANK_NICHT_GEMOUNTET");
  if (eingabe.alternativeRuntimeAktiv) add("BANK_SWAP_ALTERNATIVE_RUNTIME_AKTIV");
  if (eingabe.offeneBankTransaktion) add("BANK_SWAP_OFFENE_BANK_TRANSAKTION");
  if (!eingabe.evidenceFrisch) add("BANK_SWAP_EVIDENCE_STALE");
  if (eingabe.bindung.slotAItem.name === "placeholder"
      || eingabe.bindung.slotBItem.name === "placeholder") {
    add("BANK_SWAP_PLACEHOLDER_VERBOTEN");
  }
  if (eingabe.bindung.slotAItem.name === eingabe.bindung.slotBItem.name) {
    add("BANK_SWAP_ERSTER_KANDIDAT_NAMENSGLEICH_STACK_RISIKO");
  }
  return Object.freeze({
    schemaVersion: 1,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    gruende,
    sameIntentErneutSenden: false,
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
  const neuerFingerprint = vorher.fingerprint !== nachher.fingerprint;
  const slotAGetauscht = nachher.slotAItem.name === vorher.slotBItem.name
    && nachher.slotAItem.fingerprint === vorher.slotBItem.fingerprint;
  const slotBGetauscht = nachher.slotBItem.name === vorher.slotAItem.name
    && nachher.slotBItem.fingerprint === vorher.slotAItem.fingerprint;
  const ergebnis = (
    status: BankSwapSettlementErgebnis["status"],
    grund: string,
  ): BankSwapSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    grund,
    neuerFingerprint,
    slotAGetauscht,
    slotBGetauscht,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheIdentitaet(vorher, nachher)) return ergebnis("DRIFT", "BANK_SWAP_BINDUNG_DRIFT");
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return ergebnis("DRIFT", "BANK_SWAP_BEOBACHTUNG_NICHT_NEUER");
  }
  if (nachher.characterGold !== vorher.characterGold
      || nachher.bankGold !== vorher.bankGold) {
    return ergebnis("DRIFT", "BANK_SWAP_GOLD_DRIFT");
  }
  if (nachher.inventoryFingerprint !== vorher.inventoryFingerprint) {
    return ergebnis("DRIFT", "BANK_SWAP_INVENTORY_DRIFT");
  }
  if (nachher.packRestFingerprint !== vorher.packRestFingerprint) {
    return ergebnis("DRIFT", "BANK_SWAP_PACK_REST_DRIFT");
  }
  if (slotAGetauscht && slotBGetauscht && neuerFingerprint) {
    return ergebnis("BESTAETIGT", "BANK_SWAP_EXAKTER_ZWEI_SLOT_TAUSCH");
  }
  const unveraendert = !neuerFingerprint
    && nachher.slotAItem.fingerprint === vorher.slotAItem.fingerprint
    && nachher.slotBItem.fingerprint === vorher.slotBItem.fingerprint;
  if (unveraendert) return ergebnis("OFFEN", "BANK_SWAP_NOCH_KEINE_SICHTBARE_WIRKUNG");
  return ergebnis("DRIFT", "BANK_SWAP_SLOT_WIRKUNG_WIDERSPRUCH");
}

export function waehleBankSwapErstenKandidaten(
  packs: readonly BankSwapKandidatPack[],
): BankSwapErsterKandidat | null {
  if (!Array.isArray(packs) || packs.length > 64) {
    throw new Error("BANK_SWAP_KANDIDAT_PACKS_UNGUELTIG");
  }
  const sortiert = [...packs].sort((a, b) => a.pack.localeCompare(b.pack));
  for (const pack of sortiert) {
    if (!/^items[0-9]+$/.test(pack.pack)
        || !Array.isArray(pack.slots)
        || pack.slots.length > 42) {
      throw new Error("BANK_SWAP_KANDIDAT_PACK_UNGUELTIG");
    }
    for (let a = 0; a < pack.slots.length; a += 1) {
      const itemA = pack.slots[a];
      if (!itemA || itemA.placeholder === true || itemA.name === "placeholder") continue;
      pruefeText(itemA.name, "BANK_SWAP_KANDIDAT_ITEM_NAME_UNGUELTIG");
      pruefeFingerprint(itemA.fingerprint, "BANK_SWAP_KANDIDAT_ITEM_FP_UNGUELTIG");
      for (let b = a + 1; b < pack.slots.length; b += 1) {
        const itemB = pack.slots[b];
        if (!itemB || itemB.placeholder === true || itemB.name === "placeholder") continue;
        pruefeText(itemB.name, "BANK_SWAP_KANDIDAT_ITEM_NAME_UNGUELTIG");
        pruefeFingerprint(itemB.fingerprint, "BANK_SWAP_KANDIDAT_ITEM_FP_UNGUELTIG");
        if (itemA.name === itemB.name) continue;
        return Object.freeze({
          schemaVersion: 1,
          pack: pack.pack,
          a,
          b,
          itemA: Object.freeze({ name: itemA.name, fingerprint: itemA.fingerprint }),
          itemB: Object.freeze({ name: itemB.name, fingerprint: itemB.fingerprint }),
          stackMergeDurchNamensgleichheitAusgeschlossen: true,
        });
      }
    }
  }
  return null;
}
