export type ControlledLiveHealthStatus =
  | "GESUND"
  | "DEGRADIERT"
  | "KRITISCH"
  | "UNBEKANNT";

export interface ControlledLiveAnfrage {
  readonly roadmapPhase: string;
  readonly gesamtRuntimeStatus: "GESPERRT" | "FREIGEGEBEN";
  readonly actionContractId: string;
  readonly publicFunction: string;
  readonly shadowVollstaendig: boolean;
  readonly shadowUnerwarteteWrites: number;
  readonly operatorFreigabe: boolean;
  readonly maximaleAktionen: number;
  readonly healthStatus: ControlledLiveHealthStatus;
  readonly persistenzGesund: boolean;
  readonly reconciliationClean: boolean;
  readonly alternativeRuntimeAktiv: boolean;
}

export interface ControlledLiveEntscheidung {
  readonly erlaubt: boolean;
  readonly gruende: readonly string[];
  readonly actionContractId: string;
  readonly maximaleAktionen: number;
  readonly breiteRuntimeFreigabe: false;
}

export const R12_CONTROLLED_LIVE_ACTION_CONTRACT = "AL-ACTION-EQUIP";
export const R12_CONTROLLED_LIVE_PUBLIC_FUNCTION = "equip";

const VERBOTENE_FUNKTIONEN: readonly string[] = Object.freeze([
  "bank_store",
  "bank_retrieve",
  "trade_buy",
  "trade_sell",
  "send_item",
  "send_gold",
  "upgrade",
  "compound",
  "exchange",
  "craft",
]);

export function bewerteControlledLive(
  anfrage: ControlledLiveAnfrage,
): ControlledLiveEntscheidung {
  let gruende: readonly string[] = Object.freeze([]);

  if (anfrage.roadmapPhase !== "R12") {
    gruende = Object.freeze([...gruende, "CONTROLLED_LIVE_NUR_R12"]);
  }
  if (anfrage.actionContractId !== R12_CONTROLLED_LIVE_ACTION_CONTRACT
      || anfrage.publicFunction !== R12_CONTROLLED_LIVE_PUBLIC_FUNCTION) {
    gruende = Object.freeze([...gruende, "ACTION_NICHT_LOW_RISK_SLICE"]);
  }
  if (VERBOTENE_FUNKTIONEN.includes(anfrage.publicFunction)) {
    gruende = Object.freeze([...gruende, "RISIKO_ACTION_VERBOTEN"]);
  }
  if (!anfrage.shadowVollstaendig || anfrage.shadowUnerwarteteWrites !== 0) {
    gruende = Object.freeze([...gruende, "SHADOW_NACHWEIS_FEHLT"]);
  }
  if (!anfrage.operatorFreigabe) {
    gruende = Object.freeze([...gruende, "OPERATOR_FREIGABE_FEHLT"]);
  }
  if (!Number.isInteger(anfrage.maximaleAktionen) || anfrage.maximaleAktionen !== 1) {
    gruende = Object.freeze([...gruende, "CONTROLLED_LIVE_NUR_EINE_ACTION"]);
  }
  if (anfrage.healthStatus !== "GESUND") {
    gruende = Object.freeze([...gruende, "HEALTH_NICHT_GESUND"]);
  }
  if (!anfrage.persistenzGesund) {
    gruende = Object.freeze([...gruende, "PERSISTENZ_NICHT_GESUND"]);
  }
  if (!anfrage.reconciliationClean) {
    gruende = Object.freeze([...gruende, "RECONCILIATION_NICHT_CLEAN"]);
  }
  if (anfrage.alternativeRuntimeAktiv) {
    gruende = Object.freeze([...gruende, "ALTERNATIVE_RUNTIME_AKTIV"]);
  }

  return Object.freeze({
    erlaubt: gruende.length === 0,
    gruende,
    actionContractId: anfrage.actionContractId,
    maximaleAktionen: anfrage.maximaleAktionen,
    breiteRuntimeFreigabe: false,
  });
}
