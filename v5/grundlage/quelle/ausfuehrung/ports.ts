import type { FencingToken } from "../scheduler/ressourcen-verwalter.js";
import type {
  MutationsKanalFreigabe,
  SocketBudgetReservierung,
} from "../scheduler/socket-budget.js";

export interface FaehigkeitsAutoritaetsNachweis {
  readonly erlaubt: boolean;
  readonly mutierend: boolean;
  readonly generation: number;
}

export interface FaehigkeitsAutoritaetsPort {
  pruefe(
    faehigkeitId: string,
    eigentuemerModulId: string,
  ): FaehigkeitsAutoritaetsNachweis;
}

export interface OperatorNachweis {
  readonly erlaubt: boolean;
  readonly generation: number;
}

export interface OperatorRichtlinienPort {
  pruefe(faehigkeitId: string): OperatorNachweis;
}

export interface LaufzeitGateNachweis {
  readonly freigegeben: boolean;
  readonly generation: number;
  readonly nachweisId: string;
}

export interface LaufzeitGatePort {
  pruefe(): LaufzeitGateNachweis;
}

export interface AktionsVertragsNachweis {
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
  readonly produktivErlaubt: boolean;
  readonly invariantenKennungen: readonly string[];
}

export interface AktionsVertragsPort {
  pruefe(
    actionContractId: string,
    recoveryContractId: string,
    verifierId: string,
  ): AktionsVertragsNachweis;
}

export interface LiveVoraussetzungsNachweis {
  readonly voraussetzungId: string;
  readonly fingerprint: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
}

export interface LiveVoraussetzungsPrueferPort {
  pruefe(
    voraussetzungsIds: readonly string[],
    jetztMs: number,
  ): Promise<readonly LiveVoraussetzungsNachweis[]>;
}

export interface AdmissionRessourcen {
  readonly fencingTokens: readonly FencingToken[];
  readonly mutationsKanal: MutationsKanalFreigabe;
  readonly budgetReservierung: SocketBudgetReservierung;
}

export type AusfuehrungsTransportErgebnis<T> =
  | {
      readonly art: "SERVER_ERGEBNIS";
      readonly korrelationId: string | null;
      readonly ergebnis: T;
    }
  | {
      readonly art: "UNBEKANNT";
      readonly grund:
        | "TIMEOUT_NACH_MOEGLICHEM_SEND"
        | "DISCONNECT_NACH_MOEGLICHEM_SEND"
        | "TRANSPORT_UNKLAR";
      readonly korrelationId: string | null;
    }
  | {
      readonly art: "NICHT_GESENDET";
      readonly grund: string;
    };

export interface AusfuehrungsAdapter<Anfrage, Ergebnis, Freigabe> {
  readonly adapterId: string;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
  sende(
    freigabe: Freigabe,
    anfrage: Anfrage,
  ): Promise<AusfuehrungsTransportErgebnis<Ergebnis>>;
}
