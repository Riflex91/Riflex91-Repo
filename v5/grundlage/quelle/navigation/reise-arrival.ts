export type ReiseZustand =
  | "GEPLANT"
  | "MOVEMENT_AUSSTEHEND"
  | "ARRIVAL_AUSSTEHEND"
  | "ANGEKOMMEN"
  | "RECOVERY_PENDING"
  | "FAILED_SAFE";

export interface ReisezielPin {
  readonly schemaVersion: 1;
  readonly reiseId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly map: string;
  readonly instanz: string;
  readonly x: number;
  readonly y: number;
  readonly toleranz: number;
  readonly erstelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly zielFingerprint: string;
}

export interface ArrivalEvidence {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly map: string;
  readonly instanz: string;
  readonly x: number;
  readonly y: number;
  readonly moving: boolean;
  readonly rip: boolean;
  readonly beobachtetAmMs: number;
  readonly positionsFingerprint: string;
}

export interface ReiseSicht {
  readonly ziel: ReisezielPin;
  readonly zustand: ReiseZustand;
  readonly movementReturnAmMs: number | null;
  readonly movementReturnFingerprint: string | null;
  readonly arrivalFingerprint: string | null;
  readonly movementReturnIstArrivalBeweis: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeKoordinate(wert: number, fehler: string): void {
  if (!Number.isFinite(wert) || Math.abs(wert) > 1_000_000) throw new Error(fehler);
}

function friere(sicht: ReiseSicht): ReiseSicht {
  return Object.freeze({ ...sicht, ziel: Object.freeze({ ...sicht.ziel }) });
}

export class ReiseLedger {
  readonly #maximal: number;
  #eintraege: readonly ReiseSicht[] = Object.freeze([]);

  public constructor(maximal = 128) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 1024) {
      throw new Error("REISE_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public plane(ziel: ReisezielPin): ReiseSicht {
    if (ziel.schemaVersion !== 1) throw new Error("REISE_SCHEMA_UNGUELTIG");
    for (const text of [
      ziel.reiseId,
      ziel.ablaufId,
      ziel.characterId,
      ziel.serverRegion,
      ziel.serverIdentifier,
      ziel.map,
      ziel.instanz,
      ziel.zielFingerprint,
    ]) pruefeText(text, "REISE_TEXT_UNGUELTIG");
    pruefeKoordinate(ziel.x, "REISE_X_UNGUELTIG");
    pruefeKoordinate(ziel.y, "REISE_Y_UNGUELTIG");
    if (!Number.isFinite(ziel.toleranz)
        || ziel.toleranz < 0
        || ziel.toleranz > 10_000
        || !Number.isSafeInteger(ziel.erstelltAmMs)
        || !Number.isSafeInteger(ziel.gueltigBisMs)
        || ziel.erstelltAmMs < 0
        || ziel.gueltigBisMs < ziel.erstelltAmMs) {
      throw new Error("REISE_ZIEL_GUELTIGKEIT_UNGUELTIG");
    }
    if (this.#eintraege.some(x => x.ziel.reiseId === ziel.reiseId)) {
      throw new Error("REISE_ID_DOPPELT");
    }
    if (this.#eintraege.length >= this.#maximal) throw new Error("REISE_LEDGER_VOLL");
    const sicht = friere({
      ziel: Object.freeze({ ...ziel }),
      zustand: "GEPLANT",
      movementReturnAmMs: null,
      movementReturnFingerprint: null,
      arrivalFingerprint: null,
      movementReturnIstArrivalBeweis: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public beginneMovement(reiseId: string): ReiseSicht {
    const alt = this.#finde(reiseId);
    if (alt.zustand !== "GEPLANT") {
      throw new Error("REISE_MOVEMENT_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friere({ ...alt, zustand: "MOVEMENT_AUSSTEHEND" }));
  }

  public markiereMovementReturn(
    reiseId: string,
    erfolgreich: boolean,
    jetztMs: number,
    returnFingerprint: string,
  ): ReiseSicht {
    const alt = this.#finde(reiseId);
    if (alt.zustand !== "MOVEMENT_AUSSTEHEND") {
      throw new Error("REISE_MOVEMENT_RETURN_ZUSTAND_UNGUELTIG");
    }
    if (!Number.isSafeInteger(jetztMs)
        || jetztMs < alt.ziel.erstelltAmMs
        || jetztMs > alt.ziel.gueltigBisMs) {
      throw new Error("REISE_MOVEMENT_RETURN_ZEIT_UNGUELTIG");
    }
    pruefeText(returnFingerprint, "REISE_MOVEMENT_RETURN_FINGERPRINT_UNGUELTIG");
    return this.#ersetze(friere({
      ...alt,
      zustand: erfolgreich ? "ARRIVAL_AUSSTEHEND" : "FAILED_SAFE",
      movementReturnAmMs: jetztMs,
      movementReturnFingerprint: returnFingerprint,
      movementReturnIstArrivalBeweis: false,
    }));
  }

  public verifiziereArrival(reiseId: string, evidence: ArrivalEvidence): ReiseSicht {
    const alt = this.#finde(reiseId);
    if (alt.zustand !== "ARRIVAL_AUSSTEHEND" && alt.zustand !== "RECOVERY_PENDING") {
      throw new Error("REISE_ARRIVAL_ZUSTAND_UNGUELTIG");
    }
    if (evidence.schemaVersion !== 1) throw new Error("REISE_ARRIVAL_SCHEMA_UNGUELTIG");
    for (const text of [
      evidence.characterId,
      evidence.serverRegion,
      evidence.serverIdentifier,
      evidence.map,
      evidence.instanz,
      evidence.positionsFingerprint,
    ]) pruefeText(text, "REISE_ARRIVAL_TEXT_UNGUELTIG");
    pruefeKoordinate(evidence.x, "REISE_ARRIVAL_X_UNGUELTIG");
    pruefeKoordinate(evidence.y, "REISE_ARRIVAL_Y_UNGUELTIG");
    if (!Number.isSafeInteger(evidence.beobachtetAmMs)
        || evidence.beobachtetAmMs < (alt.movementReturnAmMs ?? alt.ziel.erstelltAmMs)
        || evidence.beobachtetAmMs > alt.ziel.gueltigBisMs) {
      throw new Error("REISE_ARRIVAL_EVIDENCE_ZU_ALT");
    }
    if (evidence.characterId !== alt.ziel.characterId
        || evidence.serverRegion !== alt.ziel.serverRegion
        || evidence.serverIdentifier !== alt.ziel.serverIdentifier
        || evidence.map !== alt.ziel.map
        || evidence.instanz !== alt.ziel.instanz) {
      throw new Error("REISE_ARRIVAL_ZIEL_DRIFT");
    }
    if (evidence.rip || evidence.moving) throw new Error("REISE_ARRIVAL_NOCH_NICHT_STABIL");
    const distanz = Math.hypot(evidence.x - alt.ziel.x, evidence.y - alt.ziel.y);
    if (distanz > alt.ziel.toleranz) throw new Error("REISE_ARRIVAL_AUSSERHALB_TOLERANZ");
    return this.#ersetze(friere({
      ...alt,
      zustand: "ANGEKOMMEN",
      arrivalFingerprint: evidence.positionsFingerprint,
    }));
  }

  public schliesseRestartAbgleichAlsNeuZuPlanen(
    reiseId: string,
    reconciliationFingerprint: string,
  ): ReiseSicht {
    pruefeText(reconciliationFingerprint, "REISE_RECONCILIATION_FINGERPRINT_UNGUELTIG");
    const alt = this.#finde(reiseId);
    if (alt.zustand !== "RECOVERY_PENDING") {
      throw new Error("REISE_RECONCILIATION_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friere({
      ...alt,
      zustand: "GEPLANT",
      movementReturnAmMs: null,
      movementReturnFingerprint: reconciliationFingerprint,
      arrivalFingerprint: null,
      movementReturnIstArrivalBeweis: false,
    }));
  }

  public importiereNachRestart(snapshot: readonly ReiseSicht[]): void {
    if (snapshot.length > this.#maximal) throw new Error("REISE_RESTART_ZU_GROSS");
    this.#eintraege = Object.freeze(snapshot.map((x, index) => {
      if (x.ziel.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.ziel.reiseId === x.ziel.reiseId)) {
        throw new Error("REISE_RESTART_SNAPSHOT_UNGUELTIG");
      }
      const terminal = x.zustand === "ANGEKOMMEN" || x.zustand === "FAILED_SAFE";
      return friere({
        ...x,
        zustand: terminal ? x.zustand : "RECOVERY_PENDING",
        movementReturnIstArrivalBeweis: false,
      });
    }));
  }

  public finde(reiseId: string): ReiseSicht {
    return friere(this.#finde(reiseId));
  }

  public snapshot(): readonly ReiseSicht[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  #finde(reiseId: string): ReiseSicht {
    pruefeText(reiseId, "REISE_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.ziel.reiseId === reiseId);
    if (sicht === undefined) throw new Error("REISE_UNBEKANNT");
    return sicht;
  }

  #ersetze(neu: ReiseSicht): ReiseSicht {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.ziel.reiseId === neu.ziel.reiseId ? neu : x),
    );
    return friere(neu);
  }
}
