export type EncounterStatus = "AKTIV" | "ABGESCHLOSSEN" | "RECOVERY_PENDING";

export interface EncounterStart {
  readonly schemaVersion: 1;
  readonly encounterId: string;
  readonly ownerAblaufId: string;
  readonly characterId: string;
  readonly targetEntityId: string;
  readonly targetFingerprint: string;
  readonly gestartetAmMs: number;
}

export interface EncounterSicht extends EncounterStart {
  readonly status: EncounterStatus;
  readonly outcomeFingerprint: string | null;
  readonly outcomeGenauEinmal: true;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friere(x: EncounterSicht): EncounterSicht {
  return Object.freeze({ ...x });
}

export class EncounterLedger {
  readonly #maximal: number;
  #eintraege: readonly EncounterSicht[] = Object.freeze([]);

  public constructor(maximal = 512) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 4096) {
      throw new Error("ENCOUNTER_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public starte(start: EncounterStart): EncounterSicht {
    if (start.schemaVersion !== 1) throw new Error("ENCOUNTER_SCHEMA_UNGUELTIG");
    for (const text of [
      start.encounterId,
      start.ownerAblaufId,
      start.characterId,
      start.targetEntityId,
      start.targetFingerprint,
    ]) pruefeText(text, "ENCOUNTER_TEXT_UNGUELTIG");
    if (!Number.isSafeInteger(start.gestartetAmMs) || start.gestartetAmMs < 0) {
      throw new Error("ENCOUNTER_ZEIT_UNGUELTIG");
    }
    if (this.#eintraege.some(x => x.encounterId === start.encounterId)) {
      throw new Error("ENCOUNTER_ID_DOPPELT");
    }
    if (this.#eintraege.length >= this.#maximal) throw new Error("ENCOUNTER_LEDGER_VOLL");
    const sicht = friere({
      ...start,
      status: "AKTIV",
      outcomeFingerprint: null,
      outcomeGenauEinmal: true,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public beende(encounterId: string, outcomeFingerprint: string): EncounterSicht {
    pruefeText(outcomeFingerprint, "ENCOUNTER_OUTCOME_UNGUELTIG");
    const alt = this.#finde(encounterId);
    if (alt.status === "ABGESCHLOSSEN") {
      if (alt.outcomeFingerprint !== outcomeFingerprint) {
        throw new Error("ENCOUNTER_OUTCOME_WIDERSPRUCH");
      }
      return friere(alt);
    }
    if (alt.status === "RECOVERY_PENDING") {
      throw new Error("ENCOUNTER_RESTART_ABGLEICH_ERFORDERLICH");
    }
    const neu = friere({ ...alt, status: "ABGESCHLOSSEN", outcomeFingerprint });
    this.#eintraege = Object.freeze(this.#eintraege.map(x => x.encounterId === encounterId ? neu : x));
    return neu;
  }

  public importiereNachRestart(snapshot: readonly EncounterSicht[]): void {
    if (snapshot.length > this.#maximal) throw new Error("ENCOUNTER_RESTART_ZU_GROSS");
    this.#eintraege = Object.freeze(snapshot.map((x, index) => {
      if (snapshot.slice(0, index).some(y => y.encounterId === x.encounterId)) {
        throw new Error("ENCOUNTER_RESTART_SNAPSHOT_UNGUELTIG");
      }
      return friere({
        ...x,
        status: x.status === "ABGESCHLOSSEN" ? "ABGESCHLOSSEN" : "RECOVERY_PENDING",
        outcomeGenauEinmal: true,
      });
    }));
  }

  public snapshot(): readonly EncounterSicht[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  #finde(encounterId: string): EncounterSicht {
    pruefeText(encounterId, "ENCOUNTER_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.encounterId === encounterId);
    if (sicht === undefined) throw new Error("ENCOUNTER_UNBEKANNT");
    return sicht;
  }
}
