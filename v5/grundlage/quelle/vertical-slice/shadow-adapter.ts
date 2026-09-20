import type { ErteilteAusfuehrungsFreigabe } from "../ausfuehrung/admission.js";
import type {
  AusfuehrungsAdapter,
  AusfuehrungsTransportErgebnis,
} from "../ausfuehrung/ports.js";

export type ShadowSimulation<Anfrage, Ergebnis> = (
  anfrage: Anfrage,
) => Promise<Ergebnis>;

export class ShadowAusfuehrungsAdapter<Anfrage, Ergebnis>
implements AusfuehrungsAdapter<Anfrage, Ergebnis, ErteilteAusfuehrungsFreigabe> {
  public readonly adapterId: string;
  public readonly actionContractId: string;
  public readonly recoveryContractId: string;
  public readonly verifierId: string;
  readonly #simulation: ShadowSimulation<Anfrage, Ergebnis>;
  #simulationsAufrufe = 0;

  public constructor(
    adapterId: string,
    actionContractId: string,
    recoveryContractId: string,
    verifierId: string,
    simulation: ShadowSimulation<Anfrage, Ergebnis>,
  ) {
    this.adapterId = adapterId;
    this.actionContractId = actionContractId;
    this.recoveryContractId = recoveryContractId;
    this.verifierId = verifierId;
    this.#simulation = simulation;
  }

  public async sende(
    _freigabe: ErteilteAusfuehrungsFreigabe,
    anfrage: Anfrage,
  ): Promise<AusfuehrungsTransportErgebnis<Ergebnis>> {
    this.#simulationsAufrufe += 1;
    const ergebnis = await this.#simulation(anfrage);
    return Object.freeze({
      art: "SERVER_ERGEBNIS",
      korrelationId: "SHADOW",
      ergebnis,
    });
  }

  public rohSchreibAufrufe(): number {
    return 0;
  }

  public simulationsAufrufe(): number {
    return this.#simulationsAufrufe;
  }
}
