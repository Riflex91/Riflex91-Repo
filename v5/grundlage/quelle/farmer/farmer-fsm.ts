export type FarmerZustand =
  | "IDLE"
  | "ZIEL_SUCHE"
  | "REISE"
  | "KAMPF"
  | "LOOT"
  | "RECOVERY"
  | "TOT"
  | "BLOCKED"
  | "FAILED_SAFE";

export interface FarmerSicht {
  readonly schemaVersion: 1;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly zustand: FarmerZustand;
  readonly transitionen: number;
  readonly consecutiveBlocked: number;
  readonly maxTransitionen: number;
  readonly maxConsecutiveBlocked: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export class FarmerFsm {
  #sicht: FarmerSicht;

  public constructor(
    ablaufId: string,
    characterId: string,
    maxTransitionen = 1000,
    maxConsecutiveBlocked = 5,
  ) {
    pruefeText(ablaufId, "FARMER_ABLAUF_UNGUELTIG");
    pruefeText(characterId, "FARMER_CHARACTER_UNGUELTIG");
    if (!Number.isInteger(maxTransitionen) || maxTransitionen < 1 || maxTransitionen > 100_000
        || !Number.isInteger(maxConsecutiveBlocked)
        || maxConsecutiveBlocked < 1
        || maxConsecutiveBlocked > 100) {
      throw new Error("FARMER_FSM_POLICY_UNGUELTIG");
    }
    this.#sicht = Object.freeze({
      schemaVersion: 1,
      ablaufId,
      characterId,
      zustand: "IDLE",
      transitionen: 0,
      consecutiveBlocked: 0,
      maxTransitionen,
      maxConsecutiveBlocked,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public transition(naechster: FarmerZustand): FarmerSicht {
    const alt = this.#sicht;
    if (alt.zustand === "FAILED_SAFE") throw new Error("FARMER_FSM_TERMINAL");
    const erlaubt: Readonly<Record<FarmerZustand, readonly FarmerZustand[]>> = Object.freeze({
      IDLE: Object.freeze(["ZIEL_SUCHE", "RECOVERY", "TOT"]),
      ZIEL_SUCHE: Object.freeze(["REISE", "KAMPF", "BLOCKED", "RECOVERY", "TOT"]),
      REISE: Object.freeze(["ZIEL_SUCHE", "KAMPF", "BLOCKED", "RECOVERY", "TOT"]),
      KAMPF: Object.freeze(["LOOT", "REISE", "BLOCKED", "RECOVERY", "TOT"]),
      LOOT: Object.freeze(["ZIEL_SUCHE", "RECOVERY", "BLOCKED", "TOT"]),
      RECOVERY: Object.freeze(["ZIEL_SUCHE", "IDLE", "BLOCKED", "TOT"]),
      TOT: Object.freeze(["RECOVERY"]),
      BLOCKED: Object.freeze(["ZIEL_SUCHE", "RECOVERY", "BLOCKED", "TOT"]),
      FAILED_SAFE: Object.freeze([]),
    });
    if (!erlaubt[alt.zustand].includes(naechster)) {
      throw new Error("FARMER_FSM_TRANSITION_UNGUELTIG:" + alt.zustand + ":" + naechster);
    }
    const transitionen = alt.transitionen + 1;
    const consecutiveBlocked = naechster === "BLOCKED" ? alt.consecutiveBlocked + 1 : 0;
    const failed = transitionen > alt.maxTransitionen
      || consecutiveBlocked > alt.maxConsecutiveBlocked;
    this.#sicht = Object.freeze({
      ...alt,
      zustand: failed ? "FAILED_SAFE" : naechster,
      transitionen,
      consecutiveBlocked,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
    return this.sicht();
  }

  public sicht(): FarmerSicht {
    return Object.freeze({ ...this.#sicht });
  }
}
