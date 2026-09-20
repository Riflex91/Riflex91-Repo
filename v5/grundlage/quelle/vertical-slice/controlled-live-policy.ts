export interface ControlledLiveAnfrage {
  readonly readinessStatus: "GESPERRT" | "FREIGEGEBEN";
  readonly actionContractId: string;
  readonly publicFunction: string;
  readonly shadowVollstaendig: boolean;
  readonly shadowUnerwarteteWrites: number;
  readonly operatorFreigabe: boolean;
  readonly maximaleAktionen: number;
}

export interface ControlledLiveEntscheidung {
  readonly erlaubt: boolean;
  readonly gruende: readonly string[];
  readonly actionContractId: string;
  readonly maximaleAktionen: number;
}

const ERLAUBTER_ERSTER_CONTRACT = "AL-ACTION-EQUIP";
const ERLAUBTE_ERSTE_FUNKTION = "equip";
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

  if (anfrage.readinessStatus !== "FREIGEGEBEN") {
    gruende = Object.freeze([...gruende, "RUNTIME_GATE_GESPERRT"]);
  }
  if (anfrage.actionContractId !== ERLAUBTER_ERSTER_CONTRACT
      || anfrage.publicFunction !== ERLAUBTE_ERSTE_FUNKTION) {
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

  return Object.freeze({
    erlaubt: gruende.length === 0,
    gruende,
    actionContractId: anfrage.actionContractId,
    maximaleAktionen: anfrage.maximaleAktionen,
  });
}
