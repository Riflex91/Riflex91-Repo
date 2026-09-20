import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import {
  type EmpfaengerSettlementEvidence,
  type EmpfaengerSettlementNachweis,
  type EmpfaengerSettlementPlan,
  validiereEmpfaengerSettlement,
} from "./recipient-settlement.js";

export type ProduktionsZustand =
  | "GEPLANT"
  | "HERSTELLUNG_IN_FLIGHT"
  | "OUTPUT_BEREIT"
  | "LIEFERUNG_AUSSTEHEND"
  | "RECIPIENT_SETTLED"
  | "COMMITTED"
  | "RECOVERY_PENDING"
  | "FAILED_SAFE";

export interface ProduktionsIntent {
  readonly schemaVersion: 1;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly ownerCharacterId: string;
  readonly recipientCharacterId: string;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMenge: number;
  readonly planFingerprint: string;
}

export interface ProduktionsSicht extends ProduktionsIntent {
  readonly zustand: ProduktionsZustand;
  readonly outputFingerprint: string | null;
  readonly settlementPlan: EmpfaengerSettlementPlan | null;
  readonly settlementNachweis: EmpfaengerSettlementNachweis | null;
  readonly sameIntentErneutSenden: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friere(sicht: ProduktionsSicht): ProduktionsSicht {
  return Object.freeze({
    ...sicht,
    settlementPlan: sicht.settlementPlan === null
      ? null
      : Object.freeze({ ...sicht.settlementPlan, ziel: Object.freeze({ ...sicht.settlementPlan.ziel }) }),
    settlementNachweis: sicht.settlementNachweis === null
      ? null
      : Object.freeze({ ...sicht.settlementNachweis }),
  });
}

export class ProduktionsLedger {
  readonly #maximaleEintraege: number;
  #eintraege: readonly ProduktionsSicht[] = Object.freeze([]);

  public constructor(maximaleEintraege = 128) {
    if (!Number.isInteger(maximaleEintraege) || maximaleEintraege < 1 || maximaleEintraege > 1024) {
      throw new Error("PRODUKTION_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximaleEintraege = maximaleEintraege;
  }

  public plane(intent: ProduktionsIntent): ProduktionsSicht {
    if (intent.schemaVersion !== 1) throw new Error("PRODUKTION_SCHEMA_UNGUELTIG");
    for (const text of [
      intent.produktionsId,
      intent.ablaufId,
      intent.ownerCharacterId,
      intent.recipientCharacterId,
      intent.outputName,
      intent.planFingerprint,
    ]) pruefeText(text, "PRODUKTION_TEXT_UNGUELTIG");
    if (!Number.isInteger(intent.outputLevel) || intent.outputLevel < 0 || intent.outputLevel > 99
        || !Number.isInteger(intent.outputMenge) || intent.outputMenge < 1 || intent.outputMenge > 1_000_000) {
      throw new Error("PRODUKTION_OUTPUT_UNGUELTIG");
    }
    if (this.#eintraege.some(x => x.produktionsId === intent.produktionsId)) {
      throw new Error("PRODUKTION_ID_DOPPELT");
    }
    if (this.#eintraege.length >= this.#maximaleEintraege) throw new Error("PRODUKTION_LEDGER_VOLL");
    const sicht = friere({
      ...intent,
      zustand: "GEPLANT",
      outputFingerprint: null,
      settlementPlan: null,
      settlementNachweis: null,
      sameIntentErneutSenden: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public beginneHerstellung(produktionsId: string): ProduktionsSicht {
    const alt = this.#finde(produktionsId);
    if (alt.zustand !== "GEPLANT") throw new Error("PRODUKTION_HERSTELLUNG_ZUSTAND_UNGUELTIG");
    return this.#ersetze(friere({ ...alt, zustand: "HERSTELLUNG_IN_FLIGHT" }));
  }

  public markiereOutputBereit(produktionsId: string, outputFingerprint: string): ProduktionsSicht {
    pruefeText(outputFingerprint, "PRODUKTION_OUTPUT_FINGERPRINT_UNGUELTIG");
    const alt = this.#finde(produktionsId);
    if (alt.zustand !== "HERSTELLUNG_IN_FLIGHT"
        && alt.zustand !== "RECOVERY_PENDING") {
      throw new Error("PRODUKTION_OUTPUT_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friere({
      ...alt,
      zustand: "OUTPUT_BEREIT",
      outputFingerprint,
    }));
  }

  public beginneLieferung(
    produktionsId: string,
    settlementId: string,
    ziel: CharacterZielBindung,
    baselineMenge: number,
    baselineFingerprint: string,
    deliveryBegonnenAmMs: number,
  ): ProduktionsSicht {
    const alt = this.#finde(produktionsId);
    if (alt.zustand !== "OUTPUT_BEREIT") throw new Error("PRODUKTION_LIEFERUNG_ZUSTAND_UNGUELTIG");
    if (ziel.characterId !== alt.recipientCharacterId) {
      throw new Error("PRODUKTION_RECIPIENT_ZIEL_STIMMT_NICHT");
    }
    pruefeText(settlementId, "PRODUKTION_SETTLEMENT_ID_UNGUELTIG");
    pruefeText(baselineFingerprint, "PRODUKTION_BASELINE_FINGERPRINT_UNGUELTIG");
    if (!Number.isInteger(baselineMenge) || baselineMenge < 0 || baselineMenge > 1_000_000
        || !Number.isSafeInteger(deliveryBegonnenAmMs) || deliveryBegonnenAmMs < 0) {
      throw new Error("PRODUKTION_LIEFERUNG_PARAMETER_UNGUELTIG");
    }
    const settlementPlan: EmpfaengerSettlementPlan = Object.freeze({
      schemaVersion: 1,
      settlementId,
      produktionsId,
      ziel: Object.freeze({ ...ziel }),
      outputName: alt.outputName,
      outputLevel: alt.outputLevel,
      erwarteteMengenZunahme: alt.outputMenge,
      baselineMenge,
      baselineFingerprint,
      deliveryBegonnenAmMs,
    });
    return this.#ersetze(friere({
      ...alt,
      zustand: "LIEFERUNG_AUSSTEHEND",
      settlementPlan,
    }));
  }

  public verifiziereRecipientSettlement(
    produktionsId: string,
    evidence: EmpfaengerSettlementEvidence,
  ): ProduktionsSicht {
    const alt = this.#finde(produktionsId);
    if (alt.zustand !== "LIEFERUNG_AUSSTEHEND"
        && alt.zustand !== "RECOVERY_PENDING"
        || alt.settlementPlan === null) {
      throw new Error("PRODUKTION_SETTLEMENT_ZUSTAND_UNGUELTIG");
    }
    const nachweis = validiereEmpfaengerSettlement(alt.settlementPlan, evidence);
    return this.#ersetze(friere({
      ...alt,
      zustand: "RECIPIENT_SETTLED",
      settlementNachweis: nachweis,
    }));
  }

  public committe(produktionsId: string): ProduktionsSicht {
    const alt = this.#finde(produktionsId);
    if (alt.zustand !== "RECIPIENT_SETTLED" || alt.settlementNachweis === null) {
      throw new Error("PRODUKTION_COMMIT_OHNE_RECIPIENT_SETTLEMENT");
    }
    return this.#ersetze(friere({ ...alt, zustand: "COMMITTED" }));
  }

  public scheitereSicher(produktionsId: string): ProduktionsSicht {
    const alt = this.#finde(produktionsId);
    if (alt.zustand === "COMMITTED") throw new Error("PRODUKTION_COMMITTED_NICHT_RUECKSTUFEN");
    return this.#ersetze(friere({ ...alt, zustand: "FAILED_SAFE" }));
  }

  public importiereNachRestart(snapshot: readonly ProduktionsSicht[]): void {
    if (snapshot.length > this.#maximaleEintraege) throw new Error("PRODUKTION_RESTART_ZU_GROSS");
    const neu = snapshot.map((x, index) => {
      if (x.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.produktionsId === x.produktionsId)) {
        throw new Error("PRODUKTION_RESTART_SNAPSHOT_UNGUELTIG");
      }
      const terminal = x.zustand === "COMMITTED" || x.zustand === "FAILED_SAFE";
      return friere({
        ...x,
        zustand: terminal ? x.zustand : "RECOVERY_PENDING",
        sameIntentErneutSenden: false,
      });
    });
    this.#eintraege = Object.freeze(neu);
  }

  public snapshot(): readonly ProduktionsSicht[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  public finde(produktionsId: string): ProduktionsSicht {
    pruefeText(produktionsId, "PRODUKTION_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.produktionsId === produktionsId);
    if (sicht === undefined) throw new Error("PRODUKTION_UNBEKANNT");
    return friere(sicht);
  }

  #finde(produktionsId: string): ProduktionsSicht {
    return this.finde(produktionsId);
  }

  #ersetze(neu: ProduktionsSicht): ProduktionsSicht {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.produktionsId === neu.produktionsId ? neu : x),
    );
    return friere(neu);
  }
}
