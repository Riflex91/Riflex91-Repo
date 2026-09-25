import type {
  Pr20_9CraftCurrentSnapshot,
  Pr20_9CraftDurableShadowPlan,
  Pr20_9CraftResourceEpochen,
  Pr20_9CraftShadowInputBinding,
} from "./pr20-9-craft-durable-shadow.js";
import type {
  Pr20_9CraftReadOnlyPreflightRequest,
  Pr20_9CraftReadOnlyPreflightResult,
} from "./pr20-9-craft-read-only-preflight.js";
import type {
  ProduktionsMaterialTeamCraftRescanErgebnis,
} from "../koordination/production-material-team-craft-rescan.js";

export interface Pr20_9CraftTeamRescanDurableAdmissionFence {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly resourceEpochen: Pr20_9CraftResourceEpochen;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly offeneCraftAuthority: false;
  readonly offeneCraftTransaktionId: null;
}

export interface Pr20_9CraftTeamRescanDurableAdmissionRequest {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly teamRescan: ProduktionsMaterialTeamCraftRescanErgebnis;
  readonly craftPreflightRequest: Pr20_9CraftReadOnlyPreflightRequest;
  readonly fence: Pr20_9CraftTeamRescanDurableAdmissionFence;
}

export interface Pr20_9CraftTeamRescanDurableAdmissionResult {
  readonly schemaVersion: 1;
  readonly status: "TEAM_RESCAN_DURABLE_SHADOW_PLAN_BEREIT_NO_WRITE";
  readonly objectiveId: string;
  readonly batchId: string;
  readonly transaktionsId: string;
  readonly plan: Pr20_9CraftDurableShadowPlan;
  readonly preflight: Pr20_9CraftReadOnlyPreflightResult;
  readonly snapshot: Pr20_9CraftCurrentSnapshot;
  readonly teamRescanReadyVerified: true;
  readonly preflightBindingVerified: true;
  readonly currentFenceVerified: true;
  readonly finalMerchantInventoryBindingVerified: true;
  readonly durableShadowPersistenceEligible: true;
  readonly durableIntentCreated: false;
  readonly persistenceWrites: 0;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly currentPr20_9RatificationCredit: false;
  readonly foundationCountsAsCraftRatification: false;
  readonly productiveCraftAuthorityOpened: false;
  readonly broadGraphExecutionAuthority: false;
  readonly sameIntentRetry: false;
  readonly craftAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function pruefeId(wert: string, fehler: string): void {
  pruefeText(wert, fehler);
  if (!/^[A-Za-z0-9._:-]+$/.test(wert)) throw new Error(fehler);
}

function pruefeGanzzahl(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function pruefeEpochen(e: Pr20_9CraftResourceEpochen): void {
  for (const wert of [
    e.inventory,
    e.q,
    e.socketBudget,
    e.actionChannel,
  ]) {
    pruefeGanzzahl(
      wert,
      0,
      Number.MAX_SAFE_INTEGER,
      "PR20_9_TEAM_RESCAN_ADMISSION_EPOCHE_UNGUELTIG",
    );
  }
}

function gleicheInputs(
  a: readonly Pr20_9CraftShadowInputBinding[],
  b: readonly {
    name: string;
    level: number;
    inventoryIndex: number;
    verbrauchMenge: number;
    fingerprint: string;
  }[],
): boolean {
  return a.length === b.length
    && a.every((x, index) => {
      const y = b[index];
      return y !== undefined
        && x.name === y.name
        && x.level === y.level
        && x.inventoryIndex === y.inventoryIndex
        && x.verbrauchMenge === y.verbrauchMenge
        && x.fingerprint === y.fingerprint;
    });
}

function preflightRequestPasstResult(
  request: Pr20_9CraftReadOnlyPreflightRequest,
  result: Pr20_9CraftReadOnlyPreflightResult,
): boolean {
  if (request.schemaVersion !== 1
      || request.recipe.schemaVersion !== 1
      || request.reachability.schemaVersion !== 1
      || result.schemaVersion !== 1
      || result.status !== "BEREIT_NO_WRITE"
      || result.blocker.length !== 0
      || result.craftPath !== "NORMAL"
      || result.actionContractId !== "AL-ACTION-CRAFT"
      || result.recoveryContractId !== "AL-RECOVERY-CRAFT"
      || result.verifierId !== "AL-VERIFIER-CRAFT"
      || result.recipeFingerprint !== request.recipe.fingerprint
      || result.workspaceNachweisFingerprint
        !== request.workspaceNachweisFingerprint
      || result.gameplayWrites !== 0
      || result.publicFunctionCalls !== 0
      || result.rawWriteCalls !== 0
      || result.craftAuthority !== false
      || result.gameplayAuthority !== false
      || result.rawWriteAuthority !== false
      || result.sameIntentRetry !== false
      || result.sendBoundaryState !== "NICHT_GESENDET"
      || result.normalRuntimeAllowed !== false) {
    return false;
  }

  return result.selectedInputs.every(input => {
    const inventory = request.inventory.find(item =>
      item.index === input.inventoryIndex
      && item.name === input.name
      && item.level === input.level
      && item.fingerprint === input.fingerprint);
    return inventory !== undefined
      && inventory.menge === input.vorhandeneMenge
      && inventory.menge >= input.verbrauchMenge
      && inventory.locked === false
      && inventory.blocked === false
      && inventory.valueProtected === false;
  });
}

function validiereTeamRescan(
  rescan: ProduktionsMaterialTeamCraftRescanErgebnis,
): void {
  if (rescan.schemaVersion !== 1
      || rescan.status !== "TEAM_CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE"
      || rescan.blocker.length !== 0
      || rescan.allSettledVerified !== true
      || rescan.allTransferIdsSettledInOrder !== true
      || rescan.noActiveTransferVerified !== true
      || rescan.finalMerchantBaselineVerified !== true
      || rescan.postSettlementInventoryVerified !== true
      || rescan.handedMaterialMatchesRecipeInput !== true
      || rescan.candidateObserved !== true
      || rescan.rescanTriggerEligible !== true
      || rescan.currentPr20_9RatificationCredit !== false
      || rescan.foundationCountsAsCraftRatification !== false
      || rescan.productiveCraftAuthorityOpened !== false
      || rescan.broadGraphExecutionAuthority !== false
      || rescan.gameplayWrites !== 0
      || rescan.publicFunctionCalls !== 0
      || rescan.rawWriteCalls !== 0
      || rescan.craftAuthority !== false
      || rescan.gameplayAuthority !== false
      || rescan.rawWriteAuthority !== false
      || rescan.normalRuntimeAllowed !== false) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_RESCAN_NICHT_BEREIT");
  }
  for (const wert of [
    rescan.objectiveId,
    rescan.batchId,
    rescan.finalSettlementFingerprint,
    rescan.merchantInventoryFingerprint,
  ]) {
    pruefeText(
      wert,
      "PR20_9_TEAM_RESCAN_ADMISSION_RESCAN_TEXT_UNGUELTIG",
    );
  }
}

export function bereitePr20_9CraftTeamRescanDurableAdmissionVor(
  anfrage: Pr20_9CraftTeamRescanDurableAdmissionRequest,
  jetztMs: number,
): Pr20_9CraftTeamRescanDurableAdmissionResult {
  if (anfrage.schemaVersion !== 1 || anfrage.fence.schemaVersion !== 1) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_SCHEMA_UNGUELTIG");
  }
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "PR20_9_TEAM_RESCAN_ADMISSION_ZEIT_UNGUELTIG",
  );
  for (const wert of [
    anfrage.auftragId,
    anfrage.ablaufId,
    anfrage.fence.characterId,
    anfrage.fence.sessionId,
    anfrage.fence.serverRegion,
    anfrage.fence.serverIdentifier,
    anfrage.fence.inventoryFingerprint,
    anfrage.fence.qFingerprint,
  ]) {
    pruefeText(wert, "PR20_9_TEAM_RESCAN_ADMISSION_TEXT_UNGUELTIG");
  }
  pruefeId(
    anfrage.transaktionsId,
    "PR20_9_TEAM_RESCAN_ADMISSION_TX_ID_UNGUELTIG",
  );

  validiereTeamRescan(anfrage.teamRescan);
  if (!preflightRequestPasstResult(
    anfrage.craftPreflightRequest,
    anfrage.teamRescan.preflight,
  )) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_PREFLIGHT_BINDUNG_DRIFT");
  }

  const recipe = anfrage.craftPreflightRequest.recipe;
  const fence = anfrage.fence;
  pruefeEpochen(fence.resourceEpochen);
  if (fence.offeneCraftAuthority !== false
      || fence.offeneCraftTransaktionId !== null) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_OFFENE_CRAFT_AUTHORITY");
  }
  if (fence.inventoryFingerprint
      !== anfrage.teamRescan.merchantInventoryFingerprint) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_INVENTORY_BINDUNG_DRIFT");
  }
  if (!Number.isSafeInteger(fence.beobachtetAmMs)
      || !Number.isSafeInteger(fence.gueltigBisMs)
      || fence.beobachtetAmMs < 0
      || fence.gueltigBisMs < fence.beobachtetAmMs
      || jetztMs < fence.beobachtetAmMs
      || jetztMs > fence.gueltigBisMs) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_FENCE_NICHT_FRISCH");
  }

  const observedAtMs = Math.max(
    fence.beobachtetAmMs,
    recipe.beobachtetAmMs,
    anfrage.craftPreflightRequest.reachability.beobachtetAmMs,
  );
  const gueltigBisMs = Math.min(
    fence.gueltigBisMs,
    recipe.gueltigBisMs,
    anfrage.craftPreflightRequest.reachability.gueltigBisMs,
  );
  if (jetztMs < observedAtMs
      || jetztMs > gueltigBisMs
      || gueltigBisMs - observedAtMs > 1_500) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_PLAN_TTL_UNGUELTIG");
  }

  const selectedInputs: readonly Pr20_9CraftShadowInputBinding[] =
    Object.freeze(anfrage.teamRescan.preflight.selectedInputs.map(input =>
      Object.freeze({
        name: input.name,
        level: input.level,
        inventoryIndex: input.inventoryIndex,
        verbrauchMenge: input.verbrauchMenge,
        fingerprint: input.fingerprint,
      })));

  const plan: Pr20_9CraftDurableShadowPlan = Object.freeze({
    schemaVersion: 1,
    transaktionsId: anfrage.transaktionsId,
    auftragId: anfrage.auftragId,
    ablaufId: anfrage.ablaufId,
    characterId: fence.characterId,
    sessionId: fence.sessionId,
    serverRegion: fence.serverRegion,
    serverIdentifier: fence.serverIdentifier,
    recipeKey: recipe.recipeKey,
    outputName: recipe.outputName,
    outputLevel: recipe.outputLevel,
    outputMenge: recipe.outputMenge,
    recipeFingerprint: recipe.fingerprint,
    workspaceNachweisFingerprint:
      anfrage.craftPreflightRequest.workspaceNachweisFingerprint,
    inventoryFingerprint: fence.inventoryFingerprint,
    qFingerprint: fence.qFingerprint,
    selectedInputs,
    resourceEpochen: Object.freeze({ ...fence.resourceEpochen }),
    observedAtMs,
    gueltigBisMs,
  });

  const snapshot: Pr20_9CraftCurrentSnapshot = Object.freeze({
    schemaVersion: 1,
    characterId: fence.characterId,
    sessionId: fence.sessionId,
    serverRegion: fence.serverRegion,
    serverIdentifier: fence.serverIdentifier,
    recipeFingerprint: recipe.fingerprint,
    workspaceNachweisFingerprint:
      anfrage.craftPreflightRequest.workspaceNachweisFingerprint,
    inventoryFingerprint: fence.inventoryFingerprint,
    qFingerprint: fence.qFingerprint,
    selectedInputs,
    resourceEpochen: Object.freeze({ ...fence.resourceEpochen }),
    offeneCraftAuthority: false,
    offeneCraftTransaktionId: null,
  });

  if (!gleicheInputs(plan.selectedInputs, snapshot.selectedInputs)) {
    throw new Error("PR20_9_TEAM_RESCAN_ADMISSION_INPUT_BINDUNG_DRIFT");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "TEAM_RESCAN_DURABLE_SHADOW_PLAN_BEREIT_NO_WRITE",
    objectiveId: anfrage.teamRescan.objectiveId,
    batchId: anfrage.teamRescan.batchId,
    transaktionsId: anfrage.transaktionsId,
    plan,
    preflight: anfrage.teamRescan.preflight,
    snapshot,
    teamRescanReadyVerified: true,
    preflightBindingVerified: true,
    currentFenceVerified: true,
    finalMerchantInventoryBindingVerified: true,
    durableShadowPersistenceEligible: true,
    durableIntentCreated: false,
    persistenceWrites: 0,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    currentPr20_9RatificationCredit: false,
    foundationCountsAsCraftRatification: false,
    productiveCraftAuthorityOpened: false,
    broadGraphExecutionAuthority: false,
    sameIntentRetry: false,
    craftAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
