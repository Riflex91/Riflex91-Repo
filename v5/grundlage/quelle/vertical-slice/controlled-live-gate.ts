import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import {
  R12_CONTROLLED_LIVE_ACTION_CONTRACT,
  bewerteControlledLive,
  type ControlledLiveAnfrage,
} from "./controlled-live-policy.js";

const ERWARTETE_FAEHIGKEIT = "equipment.equip";
const ERWARTETER_OWNER = "vertical-slice-controlled-live";
const ERWARTETER_RECOVERY = "AL-RECOVERY-EQUIP";
const ERWARTETER_VERIFIER = "AL-VERIFIER-EQUIP";

function textOk(wert: string): boolean {
  return wert.trim().length > 0 && wert.length <= 192;
}

export class EinmaligesR12ControlledLiveGate implements LaufzeitGatePort {
  readonly #entscheidung;
  readonly #generation: number;
  readonly #nachweisId: string;
  #verbraucht = false;

  public constructor(
    anfrage: ControlledLiveAnfrage,
    generation: number,
    nachweisId: string,
  ) {
    if (!Number.isSafeInteger(generation) || generation < 1) {
      throw new Error("CONTROLLED_LIVE_GATE_GENERATION_UNGUELTIG");
    }
    if (!textOk(nachweisId)) {
      throw new Error("CONTROLLED_LIVE_GATE_NACHWEIS_UNGUELTIG");
    }
    this.#entscheidung = bewerteControlledLive(anfrage);
    this.#generation = generation;
    this.#nachweisId = nachweisId;
  }

  public pruefe(kontext?: LaufzeitGateKontext): LaufzeitGateNachweis {
    if (this.#verbraucht) {
      return Object.freeze({
        freigegeben: false,
        generation: this.#generation,
        nachweisId: this.#nachweisId + ":VERBRAUCHT",
      });
    }
    if (!this.#entscheidung.erlaubt || kontext === undefined) {
      return Object.freeze({
        freigegeben: false,
        generation: this.#generation,
        nachweisId: this.#nachweisId + ":BLOCKIERT",
      });
    }

    const passt = kontext.actionContractId === R12_CONTROLLED_LIVE_ACTION_CONTRACT
      && kontext.recoveryContractId === ERWARTETER_RECOVERY
      && kontext.verifierId === ERWARTETER_VERIFIER
      && kontext.faehigkeitId === ERWARTETE_FAEHIGKEIT
      && kontext.eigentuemerModulId === ERWARTETER_OWNER
      && textOk(kontext.transaktionsId);

    if (!passt) {
      return Object.freeze({
        freigegeben: false,
        generation: this.#generation,
        nachweisId: this.#nachweisId + ":KONTEXT_NICHT_PASSEND",
      });
    }

    this.#verbraucht = true;
    return Object.freeze({
      freigegeben: true,
      generation: this.#generation,
      nachweisId: this.#nachweisId,
    });
  }

  public verbraucht(): boolean {
    return this.#verbraucht;
  }
}
