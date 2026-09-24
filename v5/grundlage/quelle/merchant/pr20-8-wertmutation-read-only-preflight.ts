import {
  planeItemMutation,
  type ItemMutationsKandidat,
  type ItemMutationsPlan,
  type ItemMutationsPlanerAbhaengigkeiten,
  type ItemMutationsRichtlinie,
} from "./item-mutations-planer.js";
import {
  planeExchangeProduktion,
  type ExchangeProduktionsKandidat,
  type ExchangeProduktionsPlan,
  type ExchangeProduktionsPlanerAbhaengigkeiten,
  type ExchangeProduktionsRichtlinie,
} from "./exchange-produktions-planer.js";

export interface Pr208ReadOnlySessionBinding {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly characterClass: "merchant";
  readonly expectedCharacterId: string;
  readonly expectedSessionId: string;
  readonly expectedServerRegion: string;
  readonly expectedServerIdentifier: string;
}

export interface Pr208ReadOnlyPreflightErgebnis {
  readonly schemaVersion: 1;
  readonly family: "UPGRADE" | "COMPOUND" | "EXCHANGE";
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly grund: string;
  readonly sessionBound: boolean;
  readonly plannerStatus: "GEPLANT" | "GESPERRT" | null;
  readonly actionContractId:
    | "AL-ACTION-UPGRADE"
    | "AL-ACTION-COMPOUND"
    | "AL-ACTION-EXCHANGE";
  readonly recoveryContractId:
    | "AL-RECOVERY-UPGRADE"
    | "AL-RECOVERY-COMPOUND"
    | "AL-RECOVERY-EXCHANGE";
  readonly verifierId:
    | "AL-VERIFIER-UPGRADE"
    | "AL-VERIFIER-COMPOUND"
    | "AL-VERIFIER-EXCHANGE";
  readonly publicFunction: "upgrade" | "compound" | "exchange";
  readonly plannerPlan: ItemMutationsPlan | ExchangeProduktionsPlan | null;
  readonly authorityIssued: false;
  readonly durableIntentWritten: false;
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly sameIntentRetry: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly liveAdapterPresent: false;
  readonly liveRunnerPresent: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function validiereSession(
  binding: Pr208ReadOnlySessionBinding,
): string | null {
  if (!binding || binding.schemaVersion !== 1) {
    return "PR20_8_READ_ONLY_SESSION_SCHEMA_UNGUELTIG";
  }
  for (const x of [
    binding.characterId,
    binding.sessionId,
    binding.serverRegion,
    binding.serverIdentifier,
    binding.expectedCharacterId,
    binding.expectedSessionId,
    binding.expectedServerRegion,
    binding.expectedServerIdentifier,
  ]) {
    try {
      text(x, "PR20_8_READ_ONLY_SESSION_TEXT_UNGUELTIG");
    } catch {
      return "PR20_8_READ_ONLY_SESSION_TEXT_UNGUELTIG";
    }
  }
  if (binding.characterClass !== "merchant") {
    return "PR20_8_READ_ONLY_CHARACTER_CLASS_DRIFT";
  }
  if (binding.characterId !== binding.expectedCharacterId) {
    return "PR20_8_READ_ONLY_CHARACTER_DRIFT";
  }
  if (binding.sessionId !== binding.expectedSessionId) {
    return "PR20_8_READ_ONLY_SESSION_DRIFT";
  }
  if (binding.serverRegion !== binding.expectedServerRegion
      || binding.serverIdentifier !== binding.expectedServerIdentifier) {
    return "PR20_8_READ_ONLY_SERVER_DRIFT";
  }
  return null;
}

function blockiert(
  family: Pr208ReadOnlyPreflightErgebnis["family"],
  grund: string,
  contracts: {
    actionContractId: Pr208ReadOnlyPreflightErgebnis["actionContractId"];
    recoveryContractId: Pr208ReadOnlyPreflightErgebnis["recoveryContractId"];
    verifierId: Pr208ReadOnlyPreflightErgebnis["verifierId"];
    publicFunction: Pr208ReadOnlyPreflightErgebnis["publicFunction"];
  },
  plannerPlan: ItemMutationsPlan | ExchangeProduktionsPlan | null = null,
): Pr208ReadOnlyPreflightErgebnis {
  return Object.freeze({
    schemaVersion: 1,
    family,
    status: "BLOCKIERT",
    grund,
    sessionBound: false,
    plannerStatus: plannerPlan?.art ?? null,
    ...contracts,
    plannerPlan,
    authorityIssued: false,
    durableIntentWritten: false,
    sendBoundaryState: "NICHT_GESENDET",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    liveAdapterPresent: false,
    liveRunnerPresent: false,
    normalRuntimeAllowed: false,
  });
}

function bereit(
  family: Pr208ReadOnlyPreflightErgebnis["family"],
  contracts: {
    actionContractId: Pr208ReadOnlyPreflightErgebnis["actionContractId"];
    recoveryContractId: Pr208ReadOnlyPreflightErgebnis["recoveryContractId"];
    verifierId: Pr208ReadOnlyPreflightErgebnis["verifierId"];
    publicFunction: Pr208ReadOnlyPreflightErgebnis["publicFunction"];
  },
  plannerPlan: ItemMutationsPlan | ExchangeProduktionsPlan,
): Pr208ReadOnlyPreflightErgebnis {
  return Object.freeze({
    schemaVersion: 1,
    family,
    status: "BEREIT_NO_WRITE",
    grund: "PR20_8_" + family + "_READ_ONLY_PREFLIGHT_BEREIT",
    sessionBound: true,
    plannerStatus: plannerPlan.art,
    ...contracts,
    plannerPlan,
    authorityIssued: false,
    durableIntentWritten: false,
    sendBoundaryState: "NICHT_GESENDET",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    liveAdapterPresent: false,
    liveRunnerPresent: false,
    normalRuntimeAllowed: false,
  });
}

const UPGRADE = Object.freeze({
  actionContractId: "AL-ACTION-UPGRADE" as const,
  recoveryContractId: "AL-RECOVERY-UPGRADE" as const,
  verifierId: "AL-VERIFIER-UPGRADE" as const,
  publicFunction: "upgrade" as const,
});
const COMPOUND = Object.freeze({
  actionContractId: "AL-ACTION-COMPOUND" as const,
  recoveryContractId: "AL-RECOVERY-COMPOUND" as const,
  verifierId: "AL-VERIFIER-COMPOUND" as const,
  publicFunction: "compound" as const,
});
const EXCHANGE = Object.freeze({
  actionContractId: "AL-ACTION-EXCHANGE" as const,
  recoveryContractId: "AL-RECOVERY-EXCHANGE" as const,
  verifierId: "AL-VERIFIER-EXCHANGE" as const,
  publicFunction: "exchange" as const,
});

export function pruefePr208UpgradeReadOnlyPreflight(
  binding: Pr208ReadOnlySessionBinding,
  kandidat: ItemMutationsKandidat,
  richtlinie: ItemMutationsRichtlinie,
  abhaengigkeiten: ItemMutationsPlanerAbhaengigkeiten,
  jetztMs: number,
): Pr208ReadOnlyPreflightErgebnis {
  const sessionGrund = validiereSession(binding);
  if (sessionGrund !== null) return blockiert("UPGRADE", sessionGrund, UPGRADE);
  if (kandidat.characterId !== binding.characterId || kandidat.art !== "UPGRADE") {
    return blockiert("UPGRADE", "PR20_8_UPGRADE_KANDIDAT_BINDING_DRIFT", UPGRADE);
  }
  const plan = planeItemMutation(kandidat, richtlinie, abhaengigkeiten, jetztMs);
  if (plan.art !== "GEPLANT") {
    return blockiert("UPGRADE", plan.grund, UPGRADE, plan);
  }
  if (plan.actionContractId !== UPGRADE.actionContractId
      || plan.recoveryContractId !== UPGRADE.recoveryContractId
      || plan.verifierId !== UPGRADE.verifierId) {
    return blockiert("UPGRADE", "PR20_8_UPGRADE_PLANNER_CONTRACT_DRIFT", UPGRADE, plan);
  }
  return bereit("UPGRADE", UPGRADE, plan);
}

export function pruefePr208CompoundReadOnlyPreflight(
  binding: Pr208ReadOnlySessionBinding,
  kandidat: ItemMutationsKandidat,
  richtlinie: ItemMutationsRichtlinie,
  abhaengigkeiten: ItemMutationsPlanerAbhaengigkeiten,
  jetztMs: number,
): Pr208ReadOnlyPreflightErgebnis {
  const sessionGrund = validiereSession(binding);
  if (sessionGrund !== null) return blockiert("COMPOUND", sessionGrund, COMPOUND);
  if (kandidat.characterId !== binding.characterId || kandidat.art !== "COMPOUND") {
    return blockiert("COMPOUND", "PR20_8_COMPOUND_KANDIDAT_BINDING_DRIFT", COMPOUND);
  }
  const plan = planeItemMutation(kandidat, richtlinie, abhaengigkeiten, jetztMs);
  if (plan.art !== "GEPLANT") {
    return blockiert("COMPOUND", plan.grund, COMPOUND, plan);
  }
  if (plan.actionContractId !== COMPOUND.actionContractId
      || plan.recoveryContractId !== COMPOUND.recoveryContractId
      || plan.verifierId !== COMPOUND.verifierId) {
    return blockiert("COMPOUND", "PR20_8_COMPOUND_PLANNER_CONTRACT_DRIFT", COMPOUND, plan);
  }
  return bereit("COMPOUND", COMPOUND, plan);
}

export function pruefePr208ExchangeReadOnlyPreflight(
  binding: Pr208ReadOnlySessionBinding,
  kandidat: ExchangeProduktionsKandidat,
  richtlinie: ExchangeProduktionsRichtlinie,
  abhaengigkeiten: ExchangeProduktionsPlanerAbhaengigkeiten,
  jetztMs: number,
): Pr208ReadOnlyPreflightErgebnis {
  const sessionGrund = validiereSession(binding);
  if (sessionGrund !== null) return blockiert("EXCHANGE", sessionGrund, EXCHANGE);
  if (kandidat.characterId !== binding.characterId) {
    return blockiert("EXCHANGE", "PR20_8_EXCHANGE_KANDIDAT_BINDING_DRIFT", EXCHANGE);
  }
  const plan = planeExchangeProduktion(kandidat, richtlinie, abhaengigkeiten, jetztMs);
  if (plan.art !== "GEPLANT") {
    return blockiert("EXCHANGE", plan.grund, EXCHANGE, plan);
  }
  if (plan.actionContractId !== EXCHANGE.actionContractId
      || plan.recoveryContractId !== EXCHANGE.recoveryContractId
      || plan.verifierId !== EXCHANGE.verifierId
      || plan.publicFunction !== EXCHANGE.publicFunction) {
    return blockiert("EXCHANGE", "PR20_8_EXCHANGE_PLANNER_CONTRACT_DRIFT", EXCHANGE, plan);
  }
  return bereit("EXCHANGE", EXCHANGE, plan);
}
