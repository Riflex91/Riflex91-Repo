export type BankOpenPackWaehrung = "gold" | "shells";
export type BankOpenPackTransportStatus =
  | "NONE"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILED";

export interface BankOpenPackBindung {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly leaseEpoche: number;
  readonly mountEpoche: number;
  readonly beobachtetAmMs: number;
  readonly map: string;
  readonly bankPack: string;
  readonly waehrung: BankOpenPackWaehrung;
  readonly goldKosten: number;
  readonly shellKosten: number;
  readonly characterGold: number;
  readonly characterShells: number;
  readonly packFreigeschaltet: boolean;
  readonly bankRestFingerprint: string;
  readonly fingerprint: string;
  readonly transportStatus: BankOpenPackTransportStatus;
  readonly requestId: string | null;
}

export interface BankOpenPackBereitschaft {
  readonly schemaVersion: 1;
  readonly ctype: string;
  readonly lebt: boolean;
  readonly idle: boolean;
  readonly bankGemountet: boolean;
  readonly alternativeRuntimeAktiv: boolean;
  readonly offeneBankTransaktion: boolean;
  readonly evidenceFrisch: boolean;
  readonly bindung: BankOpenPackBindung;
}

export interface BankOpenPackBereitschaftErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly gruende: readonly string[];
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankOpenPackSettlementErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BESTAETIGT" | "OFFEN" | "AUSSTEHEND" | "DRIFT";
  readonly grund: string;
  readonly goldDelta: number;
  readonly shellDelta: number;
  readonly packJetztFreigeschaltet: boolean;
  readonly neuerFingerprint: boolean;
  readonly sameIntentErneutSenden: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankOpenPackKatalogEintrag {
  readonly pack: string;
  readonly map: string;
  readonly goldKosten: number;
  readonly shellKosten: number;
  readonly freigeschaltet: boolean;
}

export interface BankOpenPackErsterKandidat {
  readonly schemaVersion: 1;
  readonly pack: string;
  readonly map: string;
  readonly goldKosten: number;
  readonly shellKosten: number;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function safeInt(wert: number, minimum: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < minimum) throw new Error(fehler);
}

function fp(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}

function validiereBindung(b: BankOpenPackBindung): void {
  if (!b || b.schemaVersion !== 1) throw new Error("BANK_OPEN_PACK_BINDUNG_SCHEMA_UNGUELTIG");
  for (const [wert, fehler] of [
    [b.characterId, "BANK_OPEN_PACK_CHARACTER_ID_UNGUELTIG"],
    [b.sessionId, "BANK_OPEN_PACK_SESSION_ID_UNGUELTIG"],
    [b.serverRegion, "BANK_OPEN_PACK_SERVER_REGION_UNGUELTIG"],
    [b.serverKennung, "BANK_OPEN_PACK_SERVER_KENNUNG_UNGUELTIG"],
    [b.map, "BANK_OPEN_PACK_MAP_UNGUELTIG"],
  ] as const) text(wert, fehler);
  if (!/^items[0-9]+$/.test(b.bankPack)) throw new Error("BANK_OPEN_PACK_PACK_UNGUELTIG");
  if (b.waehrung !== "gold" && b.waehrung !== "shells") {
    throw new Error("BANK_OPEN_PACK_WAEHRUNG_UNGUELTIG");
  }
  if (!["NONE", "IN_PROGRESS", "SUCCESS", "FAILED"].includes(b.transportStatus)) {
    throw new Error("BANK_OPEN_PACK_TRANSPORT_STATUS_UNGUELTIG");
  }
  safeInt(b.leaseEpoche, 1, "BANK_OPEN_PACK_LEASE_UNGUELTIG");
  safeInt(b.mountEpoche, 1, "BANK_OPEN_PACK_MOUNT_UNGUELTIG");
  safeInt(b.beobachtetAmMs, 0, "BANK_OPEN_PACK_ZEIT_UNGUELTIG");
  safeInt(b.goldKosten, 0, "BANK_OPEN_PACK_GOLD_KOSTEN_UNGUELTIG");
  safeInt(b.shellKosten, 0, "BANK_OPEN_PACK_SHELL_KOSTEN_UNGUELTIG");
  safeInt(b.characterGold, 0, "BANK_OPEN_PACK_CHARACTER_GOLD_UNGUELTIG");
  safeInt(b.characterShells, 0, "BANK_OPEN_PACK_CHARACTER_SHELLS_UNGUELTIG");
  fp(b.bankRestFingerprint, "BANK_OPEN_PACK_BANK_REST_FP_UNGUELTIG");
  fp(b.fingerprint, "BANK_OPEN_PACK_FP_UNGUELTIG");
  if (b.requestId !== null) text(b.requestId, "BANK_OPEN_PACK_REQUEST_ID_UNGUELTIG");
  if (b.waehrung === "gold" && b.requestId !== null) {
    throw new Error("BANK_OPEN_PACK_GOLD_REQUEST_ID_VERBOTEN");
  }
  if (b.waehrung === "shells"
      && b.transportStatus === "IN_PROGRESS"
      && b.requestId === null) {
    throw new Error("BANK_OPEN_PACK_SHELL_IN_PROGRESS_REQUEST_ID_FEHLT");
  }
}

function gleicheBindung(a: BankOpenPackBindung, b: BankOpenPackBindung): boolean {
  return a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverKennung === b.serverKennung
    && a.leaseEpoche === b.leaseEpoche
    && a.mountEpoche === b.mountEpoche
    && a.map === b.map
    && a.bankPack === b.bankPack
    && a.waehrung === b.waehrung
    && a.goldKosten === b.goldKosten
    && a.shellKosten === b.shellKosten;
}

function ausgewaehlteKosten(b: BankOpenPackBindung): number {
  return b.waehrung === "gold" ? b.goldKosten : b.shellKosten;
}

export function pruefeBankOpenPackBereitschaft(
  eingabe: BankOpenPackBereitschaft,
): BankOpenPackBereitschaftErgebnis {
  if (!eingabe || eingabe.schemaVersion !== 1) {
    throw new Error("BANK_OPEN_PACK_BEREITSCHAFT_SCHEMA_UNGUELTIG");
  }
  validiereBindung(eingabe.bindung);
  let gruende: readonly string[] = Object.freeze([]);
  const add = (grund: string): void => {
    if (gruende.length >= 16) throw new Error("BANK_OPEN_PACK_BLOCKER_GRENZE_UEBERSCHRITTEN");
    gruende = Object.freeze([...gruende, grund]);
  };

  if (eingabe.ctype !== "merchant") add("BANK_OPEN_PACK_NUR_MERCHANT");
  if (!eingabe.lebt) add("BANK_OPEN_PACK_CHARACTER_NICHT_BEREIT");
  if (!eingabe.idle) add("BANK_OPEN_PACK_CHARACTER_NICHT_IDLE");
  if (!eingabe.bankGemountet) add("BANK_OPEN_PACK_BANK_NICHT_GEMOUNTET");
  if (eingabe.alternativeRuntimeAktiv) add("BANK_OPEN_PACK_ALTERNATIVE_RUNTIME_AKTIV");
  if (eingabe.offeneBankTransaktion) add("BANK_OPEN_PACK_OFFENE_BANK_TRANSAKTION");
  if (!eingabe.evidenceFrisch) add("BANK_OPEN_PACK_EVIDENCE_STALE");
  if (eingabe.bindung.packFreigeschaltet) add("BANK_OPEN_PACK_BEREITS_FREIGESCHALTET");

  const kosten = ausgewaehlteKosten(eingabe.bindung);
  if (kosten <= 0) add("BANK_OPEN_PACK_KOSTEN_NICHT_POSITIV");
  if (eingabe.bindung.waehrung === "gold"
      && eingabe.bindung.characterGold < eingabe.bindung.goldKosten) {
    add("BANK_OPEN_PACK_GOLD_ZU_NIEDRIG");
  }
  if (eingabe.bindung.waehrung === "shells"
      && eingabe.bindung.characterShells < eingabe.bindung.shellKosten) {
    add("BANK_OPEN_PACK_SHELLS_ZU_NIEDRIG");
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

export function pruefeBankOpenPackSettlement(
  vorher: BankOpenPackBindung,
  nachher: BankOpenPackBindung,
): BankOpenPackSettlementErgebnis {
  validiereBindung(vorher);
  validiereBindung(nachher);

  const goldDelta = nachher.characterGold - vorher.characterGold;
  const shellDelta = nachher.characterShells - vorher.characterShells;
  const neuerFingerprint = nachher.fingerprint !== vorher.fingerprint;
  const out = (
    status: BankOpenPackSettlementErgebnis["status"],
    grund: string,
  ): BankOpenPackSettlementErgebnis => Object.freeze({
    schemaVersion: 1,
    status,
    grund,
    goldDelta,
    shellDelta,
    packJetztFreigeschaltet: nachher.packFreigeschaltet,
    neuerFingerprint,
    sameIntentErneutSenden: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });

  if (!gleicheBindung(vorher, nachher)) return out("DRIFT", "BANK_OPEN_PACK_BINDUNG_DRIFT");
  if (nachher.beobachtetAmMs <= vorher.beobachtetAmMs) {
    return out("DRIFT", "BANK_OPEN_PACK_BEOBACHTUNG_NICHT_NEUER");
  }
  if (nachher.bankRestFingerprint !== vorher.bankRestFingerprint) {
    return out("DRIFT", "BANK_OPEN_PACK_BANK_REST_DRIFT");
  }
  if (vorher.packFreigeschaltet) {
    return out("DRIFT", "BANK_OPEN_PACK_PRESTATE_BEREITS_FREIGESCHALTET");
  }

  const exactGold = vorher.waehrung === "gold"
    && nachher.packFreigeschaltet
    && goldDelta === -vorher.goldKosten
    && shellDelta === 0;
  const exactShells = vorher.waehrung === "shells"
    && nachher.packFreigeschaltet
    && shellDelta === -vorher.shellKosten
    && goldDelta === 0;

  if ((exactGold || exactShells) && neuerFingerprint) {
    return out(
      "BESTAETIGT",
      vorher.waehrung === "gold"
        ? "BANK_OPEN_PACK_GOLD_EXAKT_BESTAETIGT"
        : "BANK_OPEN_PACK_SHELLS_EXAKT_BESTAETIGT",
    );
  }

  const unveraendert = !neuerFingerprint
    && !nachher.packFreigeschaltet
    && goldDelta === 0
    && shellDelta === 0;

  if (vorher.waehrung === "shells"
      && nachher.transportStatus === "IN_PROGRESS"
      && unveraendert) {
    return out("AUSSTEHEND", "BANK_OPEN_PACK_SHELLS_BACKEND_IN_PROGRESS");
  }

  if (unveraendert) {
    return out(
      "OFFEN",
      nachher.transportStatus === "FAILED"
        ? "BANK_OPEN_PACK_SERVER_FEHLER_OHNE_SICHTBARE_WIRKUNG"
        : "BANK_OPEN_PACK_NOCH_KEINE_SICHTBARE_WIRKUNG",
    );
  }

  return out("DRIFT", "BANK_OPEN_PACK_WIRKUNG_WIDERSPRUCH");
}

export function waehleBankOpenPackErstenKandidaten(
  katalog: readonly BankOpenPackKatalogEintrag[],
  aktuelleMap: string,
): BankOpenPackErsterKandidat | null {
  text(aktuelleMap, "BANK_OPEN_PACK_AKTUELLE_MAP_UNGUELTIG");
  if (!Array.isArray(katalog) || katalog.length > 64) {
    throw new Error("BANK_OPEN_PACK_KATALOG_UNGUELTIG");
  }
  const sortiert = [...katalog].sort((a, b) => {
    const na = Number(a.pack.replace(/^items/, ""));
    const nb = Number(b.pack.replace(/^items/, ""));
    return na - nb;
  });
  for (const row of sortiert) {
    if (!/^items[0-9]+$/.test(row.pack)) throw new Error("BANK_OPEN_PACK_KATALOG_PACK_UNGUELTIG");
    text(row.map, "BANK_OPEN_PACK_KATALOG_MAP_UNGUELTIG");
    safeInt(row.goldKosten, 0, "BANK_OPEN_PACK_KATALOG_GOLD_UNGUELTIG");
    safeInt(row.shellKosten, 0, "BANK_OPEN_PACK_KATALOG_SHELLS_UNGUELTIG");
    if (row.map !== aktuelleMap || row.freigeschaltet) continue;
    if (row.goldKosten <= 0 && row.shellKosten <= 0) continue;
    return Object.freeze({
      schemaVersion: 1,
      pack: row.pack,
      map: row.map,
      goldKosten: row.goldKosten,
      shellKosten: row.shellKosten,
    });
  }
  return null;
}
