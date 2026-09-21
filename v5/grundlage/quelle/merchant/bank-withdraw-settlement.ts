export const BANK_WITHDRAW_ERSTER_BETRAG = 1;

export interface BankWithdrawBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly beobachtetAmMs: number;
  readonly characterGold: number;
  readonly bankGold: number;
  readonly fingerprint: string;
}

export interface BankWithdrawEinGoldBereitschaft {
  readonly schemaVersion: 1;
  readonly ctype: string;
  readonly lebt: boolean;
  readonly bankGemountet: boolean;
  readonly alternativeRuntimeAktiv: boolean;
  readonly offeneBankTransaktion: boolean;
  readonly evidenceFrisch: boolean;
  readonly bindung: BankWithdrawBindung;
}

export interface BankWithdrawBereitschaftErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly betrag: 1;
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankWithdrawSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "DRIFT";
  readonly betrag: 1;
  readonly grund: string;
  readonly characterGoldDelta: number;
  readonly bankGoldDelta: number;
  readonly neuerFingerprint: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) {
    throw new Error(fehler);
  }
}

function pruefeGanzzahl(
  wert: number,
  minimum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum) {
    throw new Error(fehler);
  }
}

function pruefeBindung(bindung: BankWithdrawBindung): void {
  if (bindung.schemaVersion !== 1) {
    throw new Error("BANK_WITHDRAW_BINDUNG_SCHEMA_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [bindung.characterId, "BANK_WITHDRAW_CHARACTER_ID_UNGUELTIG"],
    [bindung.sessionId, "BANK_WITHDRAW_SESSION_ID_UNGUELTIG"],
    [bindung.serverRegion, "BANK_WITHDRAW_SERVER_REGION_UNGUELTIG"],
    [bindung.serverKennung, "BANK_WITHDRAW_SERVER_KENNUNG_UNGUELTIG"],
  ] as const) {
    pruefeText(wert, fehler);
  }
  if (!/^[0-9a-f]{64}$/i.test(bindung.fingerprint)) {
    throw new Error("BANK_WITHDRAW_FINGERPRINT_UNGUELTIG");
  }
  pruefeGanzzahl(
    bindung.leaseEpoche,
    1,
    "BANK_WITHDRAW_LEASE_EPOCHE_UNGUELTIG",
  );
  pruefeGanzzahl(
    bindung.mountEpoche,
    1,
    "BANK_WITHDRAW_MOUNT_EPOCHE_UNGUELTIG",
  );
  pruefeGanzzahl(
    bindung.beobachtetAmMs,
    0,
    "BANK_WITHDRAW_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    bindung.characterGold,
    0,
    "BANK_WITHDRAW_CHARACTER_GOLD_UNGUELTIG",
  );
  pruefeGanzzahl(
    bindung.bankGold,
    0,
    "BANK_WITHDRAW_BANK_GOLD_UNGUELTIG",
  );
}

function gleicheIdentitaet(
  vorher: BankWithdrawBindung,
  nachher: BankWithdrawBindung,
): boolean {
  return vorher.characterId === nachher.characterId
    && vorher.sessionId === nachher.sessionId
    && vorher.serverRegion === nachher.serverRegion
    && vorher.serverKennung === nachher.serverKennung
    && vorher.leaseEpoche === nachher.leaseEpoche
    && vorher.mountEpoche === nachher.mountEpoche;
}

export function pruefeBankWithdrawEinGoldBereitschaft(
  eingabe: BankWithdrawEinGoldBereitschaft,
): BankWithdrawBereitschaftErgebnis {
  if (eingabe.schemaVersion !== 1) {
    throw new Error("BANK_WITHDRAW_BEREITSCHAFT_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(eingabe.bindung);

  let gruende: readonly string[] = Object.freeze([]);
  const fuegeGrundHinzu = (grund: string): void => {
    if (gruende.length >= 16) {
      throw new Error("BANK_WITHDRAW_BLOCKER_GRENZE_UEBERSCHRITTEN");
    }
    gruende = Object.freeze([...gruende, grund]);
  };

  if (eingabe.ctype !== "merchant") {
    fuegeGrundHinzu("BANK_WITHDRAW_NUR_MERCHANT");
  }
  if (!eingabe.lebt) {
    fuegeGrundHinzu("BANK_WITHDRAW_CHARACTER_NICHT_BEREIT");
  }
  if (!eingabe.bankGemountet) {
    fuegeGrundHinzu("BANK_WITHDRAW_BANK_NICHT_GEMOUNTET");
  }
  if (eingabe.alternativeRuntimeAktiv) {
    fuegeGrundHinzu("BANK_WITHDRAW_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (eingabe.offeneBankTransaktion) {
    fuegeGrundHinzu("BANK_WITHDRAW_OFFENE_TRANSAKTION");
  }
  if (!eingabe.evidenceFrisch) {
    fuegeGrundHinzu("BANK_WITHDRAW_EVIDENCE_STALE");
  }
  if (eingabe.bindung.bankGold < BANK_WITHDRAW_ERSTER_BETRAG) {
    fuegeGrundHinzu("BANK_WITHDRAW_BANK_GOLD_ZU_NIEDRIG");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    betrag: BANK_WITHDRAW_ERSTER_BETRAG,
    gruende: Object.freeze([...gruende]),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function pruefeBankWithdrawEinGoldSettlement(
  vorher: BankWithdrawBindung,
  nachher: BankWithdrawBindung,
): BankWithdrawSettlementErgebnis {
  pruefeBindung(vorher);
  pruefeBindung(nachher);

  const characterGoldDelta = nachher.characterGold - vorher.characterGold;
  const bankGoldDelta = nachher.bankGold - vorher.bankGold;
  const neuerFingerprint = nachher.fingerprint !== vorher.fingerprint;

  const ergebnis = (
    status: BankWithdrawSettlementErgebnis["status"],
    grund: string,
  ): BankWithdrawSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    betrag: BANK_WITHDRAW_ERSTER_BETRAG,
    grund,
    characterGoldDelta,
    bankGoldDelta,
    neuerFingerprint,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheIdentitaet(vorher, nachher)) {
    return ergebnis("DRIFT", "BANK_WITHDRAW_BINDUNG_DRIFT");
  }
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return ergebnis("DRIFT", "BANK_WITHDRAW_BEOBACHTUNG_NICHT_NEUER");
  }
  if (!neuerFingerprint) {
    return ergebnis("OFFEN", "BANK_WITHDRAW_KEIN_NEUER_FINGERPRINT");
  }
  if (characterGoldDelta === BANK_WITHDRAW_ERSTER_BETRAG
      && bankGoldDelta === -BANK_WITHDRAW_ERSTER_BETRAG) {
    return ergebnis("BESTAETIGT", "BANK_WITHDRAW_EXAKTES_GOLD_DELTA");
  }
  if (characterGoldDelta === 0 && bankGoldDelta === 0) {
    return ergebnis("OFFEN", "BANK_WITHDRAW_NOCH_KEIN_GOLD_DELTA");
  }
  return ergebnis("DRIFT", "BANK_WITHDRAW_GOLD_DELTA_WIDERSPRUCH");
}
