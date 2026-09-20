export type ZertifizierungsStufe =
  | "SIMULATOR_REPLAY"
  | "FAULT_SUITE"
  | "SHADOW"
  | "CONTROLLED_LIVE"
  | "CANARY"
  | "SOAK_1H"
  | "SOAK_24H"
  | "SOAK_72H"
  | "SOAK_7D"
  | "SOAK_30D";

export interface ZertifizierungsStufenNachweis {
  readonly stufe: ZertifizierungsStufe;
  readonly evidenceId: string;
  readonly bestanden: true;
  readonly manuellBestaetigt: boolean;
}

export interface ZertifizierungsLadderSicht {
  readonly abgeschlossen: readonly ZertifizierungsStufenNachweis[];
  readonly naechsteStufe: ZertifizierungsStufe | null;
  readonly controlledLiveManuellErforderlich: true;
  readonly breiteRuntimeFreigegeben: false;
}

const REIHENFOLGE: readonly ZertifizierungsStufe[] = Object.freeze([
  "SIMULATOR_REPLAY",
  "FAULT_SUITE",
  "SHADOW",
  "CONTROLLED_LIVE",
  "CANARY",
  "SOAK_1H",
  "SOAK_24H",
  "SOAK_72H",
  "SOAK_7D",
  "SOAK_30D",
]);

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export class ZertifizierungsLadder {
  #abgeschlossen: readonly ZertifizierungsStufenNachweis[] = Object.freeze([]);

  public markiereBestanden(
    stufe: ZertifizierungsStufe,
    evidenceId: string,
    manuellBestaetigt: boolean,
  ): ZertifizierungsLadderSicht {
    text(evidenceId, "ZERT_LADDER_EVIDENCE_ID_UNGUELTIG");
    const erwartet = REIHENFOLGE[this.#abgeschlossen.length];
    if (erwartet === undefined) throw new Error("ZERT_LADDER_BEREITS_VOLLSTAENDIG");
    if (stufe !== erwartet) throw new Error("ZERT_LADDER_STUFE_UEBERSPRUNGEN:" + erwartet);
    if ((stufe === "CONTROLLED_LIVE" || stufe === "CANARY") && !manuellBestaetigt) {
      throw new Error("ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH:" + stufe);
    }
    if (this.#abgeschlossen.some(x => x.evidenceId === evidenceId)) {
      throw new Error("ZERT_LADDER_EVIDENCE_ID_DOPPELT");
    }
    const nachweis = Object.freeze({
      stufe,
      evidenceId,
      bestanden: true as const,
      manuellBestaetigt,
    });
    this.#abgeschlossen = Object.freeze([...this.#abgeschlossen, nachweis]);
    return this.sicht();
  }

  public sicht(): ZertifizierungsLadderSicht {
    return Object.freeze({
      abgeschlossen: Object.freeze(this.#abgeschlossen.map(x => Object.freeze({ ...x }))),
      naechsteStufe: REIHENFOLGE[this.#abgeschlossen.length] ?? null,
      controlledLiveManuellErforderlich: true,
      breiteRuntimeFreigegeben: false,
    });
  }
}
