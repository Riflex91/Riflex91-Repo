export type Cap022FoundationId =
  | "MATERIAL_ACQUISITION"
  | "MATERIAL_HANDOFF"
  | "POST_SETTLEMENT_CRAFT_RESCAN"
  | "PERSISTENT_LIFECYCLE"
  | "TEAM_MATERIAL_OBJECTIVE"
  | "TEAM_COLLECTION_HANDOFF"
  | "TEAM_BATCH_SETTLEMENT_RECOVERY"
  | "TEAM_ALL_SETTLED_CRAFT_RESCAN"
  | "TEAM_RESCAN_DURABLE_ADMISSION";

export interface Cap022FoundationSignal {
  readonly schemaVersion: 1;
  readonly id: Cap022FoundationId;
  readonly status: "PREPARED_NO_WRITE" | "BLOCKIERT";
  readonly productiveExecutionAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Cap022FoundationChainRequest {
  readonly schemaVersion: 1;
  readonly foundations: readonly Cap022FoundationSignal[];
  readonly currentPr20_9RatificationCredit: false;
  readonly candidateAcquisitionOrMutationAllowedNow: false;
  readonly durableIntentCreated: false;
  readonly productiveCraftAuthorityOpened: false;
}

export interface Cap022FoundationChainReadiness {
  readonly schemaVersion: 1;
  readonly status: "CAP022_FULL_CHAIN_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly requiredFoundationIds: readonly Cap022FoundationId[];
  readonly readyFoundationIds: readonly Cap022FoundationId[];
  readonly allRequiredFoundationsPresent: boolean;
  readonly allRequiredFoundationsReady: boolean;
  readonly currentPr20_9RatificationCredit: false;
  readonly candidateAcquisitionOrMutationAllowedNow: false;
  readonly durableIntentCreated: false;
  readonly productiveCraftAuthorityOpened: false;
  readonly productiveExecutionAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const REQUIRED_FOUNDATIONS: readonly Cap022FoundationId[] = Object.freeze([
  "MATERIAL_ACQUISITION",
  "MATERIAL_HANDOFF",
  "POST_SETTLEMENT_CRAFT_RESCAN",
  "PERSISTENT_LIFECYCLE",
  "TEAM_MATERIAL_OBJECTIVE",
  "TEAM_COLLECTION_HANDOFF",
  "TEAM_BATCH_SETTLEMENT_RECOVERY",
  "TEAM_ALL_SETTLED_CRAFT_RESCAN",
  "TEAM_RESCAN_DURABLE_ADMISSION",
]);

export function bewerteCap022FoundationChain(
  anfrage: Cap022FoundationChainRequest,
): Cap022FoundationChainReadiness {
  if (anfrage.schemaVersion !== 1) {
    throw new Error("CAP022_CHAIN_SCHEMA_UNGUELTIG");
  }
  if (anfrage.foundations.length > 32) {
    throw new Error("CAP022_CHAIN_FOUNDATION_LISTE_ZU_GROSS");
  }
  if (anfrage.currentPr20_9RatificationCredit !== false
      || anfrage.candidateAcquisitionOrMutationAllowedNow !== false
      || anfrage.durableIntentCreated !== false
      || anfrage.productiveCraftAuthorityOpened !== false) {
    throw new Error("CAP022_CHAIN_AUTHORITY_ODER_RATIFICATION_DRIFT");
  }

  const seen = new Set<Cap022FoundationId>();
  const blocker: string[] = [];
  const ready: Cap022FoundationId[] = [];

  for (const foundation of anfrage.foundations) {
    if (foundation.schemaVersion !== 1
        || !REQUIRED_FOUNDATIONS.includes(foundation.id)) {
      throw new Error("CAP022_CHAIN_FOUNDATION_UNBEKANNT");
    }
    if (seen.has(foundation.id)) {
      throw new Error("CAP022_CHAIN_FOUNDATION_DOPPELT:" + foundation.id);
    }
    seen.add(foundation.id);

    if (foundation.productiveExecutionAllowed !== false
        || foundation.gameplayAuthority !== false
        || foundation.rawWriteAuthority !== false
        || foundation.normalRuntimeAllowed !== false) {
      blocker.push("CAP022_CHAIN_AUTHORITY_DRIFT:" + foundation.id);
      continue;
    }
    if (foundation.status !== "PREPARED_NO_WRITE") {
      blocker.push("CAP022_CHAIN_FOUNDATION_BLOCKIERT:" + foundation.id);
      continue;
    }
    ready.push(foundation.id);
  }

  for (const id of REQUIRED_FOUNDATIONS) {
    if (!seen.has(id)) blocker.push("CAP022_CHAIN_FOUNDATION_FEHLT:" + id);
  }

  const allRequiredFoundationsPresent =
    REQUIRED_FOUNDATIONS.every(id => seen.has(id));
  const allRequiredFoundationsReady =
    REQUIRED_FOUNDATIONS.every(id => ready.includes(id));

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      && allRequiredFoundationsPresent
      && allRequiredFoundationsReady
      ? "CAP022_FULL_CHAIN_BEREIT_NO_WRITE"
      : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    requiredFoundationIds: REQUIRED_FOUNDATIONS,
    readyFoundationIds: Object.freeze(ready),
    allRequiredFoundationsPresent,
    allRequiredFoundationsReady,
    currentPr20_9RatificationCredit: false,
    candidateAcquisitionOrMutationAllowedNow: false,
    durableIntentCreated: false,
    productiveCraftAuthorityOpened: false,
    productiveExecutionAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
