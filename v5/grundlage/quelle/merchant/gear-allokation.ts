import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export type GearZielPrioritaet = "FARMER" | "MERCHANT_SELF";
export type GearZielStatus = "OFFEN" | "RESERVIERT" | "SETTLED" | "RECOVERY_PENDING" | "ABGEBROCHEN";

export interface GearKandidat {
  readonly physischeKennung: string;
  readonly name: string;
  readonly level: number;
  readonly score: number;
  readonly beobachtungsFingerprint: string;
}

export interface GearZiel {
  readonly schemaVersion: 1;
  readonly gearZielId: string;
  readonly recipient: CharacterZielBindung;
  readonly slot: string;
  readonly prioritaet: GearZielPrioritaet;
  readonly aktuellerScore: number;
  readonly minimaleVerbesserung: number;
  readonly kandidat: GearKandidat;
  readonly erstelltAmMs: number;
  readonly gueltigBisMs: number;
}

export interface GearZielSicht {
  readonly ziel: GearZiel;
  readonly status: GearZielStatus;
  readonly settlementFingerprint: string | null;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friere(ziel: GearZielSicht): GearZielSicht {
  return Object.freeze({
    ...ziel,
    ziel: Object.freeze({
      ...ziel.ziel,
      recipient: Object.freeze({ ...ziel.ziel.recipient }),
      kandidat: Object.freeze({ ...ziel.ziel.kandidat }),
    }),
  });
}

export class GearAllokationsLedger {
  readonly #maximal: number;
  #eintraege: readonly GearZielSicht[] = Object.freeze([]);

  public constructor(maximal = 256) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 2048) {
      throw new Error("GEAR_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public reserviere(ziel: GearZiel): GearZielSicht {
    if (ziel.schemaVersion !== 1 || ziel.recipient.schemaVersion !== 1) {
      throw new Error("GEAR_SCHEMA_UNGUELTIG");
    }
    for (const text of [
      ziel.gearZielId,
      ziel.slot,
      ziel.recipient.characterId,
      ziel.recipient.sessionId,
      ziel.recipient.serverRegion,
      ziel.recipient.serverIdentifier,
      ziel.kandidat.physischeKennung,
      ziel.kandidat.name,
      ziel.kandidat.beobachtungsFingerprint,
    ]) pruefeText(text, "GEAR_TEXT_UNGUELTIG");
    if (!["FARMER", "MERCHANT_SELF"].includes(ziel.prioritaet)
        || !Number.isFinite(ziel.aktuellerScore)
        || !Number.isFinite(ziel.minimaleVerbesserung)
        || ziel.minimaleVerbesserung <= 0
        || !Number.isFinite(ziel.kandidat.score)
        || ziel.kandidat.score - ziel.aktuellerScore < ziel.minimaleVerbesserung
        || !Number.isInteger(ziel.kandidat.level)
        || ziel.kandidat.level < 0
        || ziel.kandidat.level > 99
        || !Number.isSafeInteger(ziel.erstelltAmMs)
        || !Number.isSafeInteger(ziel.gueltigBisMs)
        || ziel.erstelltAmMs < 0
        || ziel.gueltigBisMs < ziel.erstelltAmMs) {
      throw new Error("GEAR_ZIEL_UNGUELTIG");
    }
    if (this.#eintraege.length >= this.#maximal) throw new Error("GEAR_LEDGER_VOLL");
    if (this.#eintraege.some(x => x.ziel.gearZielId === ziel.gearZielId)) {
      throw new Error("GEAR_ZIEL_ID_DOPPELT");
    }
    if (this.#eintraege.some(x =>
      x.status !== "SETTLED"
      && x.status !== "ABGEBROCHEN"
      && x.ziel.kandidat.physischeKennung === ziel.kandidat.physischeKennung)) {
      throw new Error("GEAR_KANDIDAT_BEREITS_RESERVIERT");
    }
    if (this.#eintraege.some(x =>
      x.status !== "SETTLED"
      && x.status !== "ABGEBROCHEN"
      && x.ziel.recipient.characterId === ziel.recipient.characterId
      && x.ziel.slot === ziel.slot)) {
      throw new Error("GEAR_RECIPIENT_SLOT_BEREITS_BELEGT");
    }
    const sicht = friere({ ziel, status: "RESERVIERT", settlementFingerprint: null });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public priorisierteOffene(jetztMs: number): readonly GearZielSicht[] {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("GEAR_ZEIT_UNGUELTIG");
    return Object.freeze(
      this.#eintraege
        .filter(x => (x.status === "RESERVIERT" || x.status === "RECOVERY_PENDING")
          && jetztMs <= x.ziel.gueltigBisMs)
        .sort((a, b) => {
          const pa = a.ziel.prioritaet === "FARMER" ? 0 : 1;
          const pb = b.ziel.prioritaet === "FARMER" ? 0 : 1;
          return pa - pb
            || (b.ziel.kandidat.score - b.ziel.aktuellerScore)
              - (a.ziel.kandidat.score - a.ziel.aktuellerScore)
            || a.ziel.gearZielId.localeCompare(b.ziel.gearZielId);
        })
        .map(x => friere(x)),
    );
  }

  public markiereSettled(gearZielId: string, settlementFingerprint: string): GearZielSicht {
    pruefeText(settlementFingerprint, "GEAR_SETTLEMENT_FINGERPRINT_UNGUELTIG");
    const alt = this.#finde(gearZielId);
    if (alt.status !== "RESERVIERT" && alt.status !== "RECOVERY_PENDING") {
      throw new Error("GEAR_SETTLEMENT_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friere({
      ...alt,
      status: "SETTLED",
      settlementFingerprint,
    }));
  }

  public importiereNachRestart(snapshot: readonly GearZielSicht[]): void {
    if (snapshot.length > this.#maximal) throw new Error("GEAR_RESTART_ZU_GROSS");
    this.#eintraege = Object.freeze(snapshot.map((x, index) => {
      if (x.ziel.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.ziel.gearZielId === x.ziel.gearZielId)) {
        throw new Error("GEAR_RESTART_SNAPSHOT_UNGUELTIG");
      }
      const terminal = x.status === "SETTLED" || x.status === "ABGEBROCHEN";
      return friere({ ...x, status: terminal ? x.status : "RECOVERY_PENDING" });
    }));
  }

  public snapshot(): readonly GearZielSicht[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  #finde(gearZielId: string): GearZielSicht {
    pruefeText(gearZielId, "GEAR_ZIEL_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.ziel.gearZielId === gearZielId);
    if (sicht === undefined) throw new Error("GEAR_ZIEL_UNBEKANNT");
    return sicht;
  }

  #ersetze(neu: GearZielSicht): GearZielSicht {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.ziel.gearZielId === neu.ziel.gearZielId ? neu : x),
    );
    return friere(neu);
  }
}
