import type { SpeicherPort } from "../persistenz/speicher-port.js";
import type { Pr20_9CraftReadOnlyPreflightResult } from "./pr20-9-craft-read-only-preflight.js";

export interface Pr20_9CraftResourceEpochen {
  readonly inventory: number;
  readonly q: number;
  readonly socketBudget: number;
  readonly actionChannel: number;
}

export interface Pr20_9CraftShadowInputBinding {
  readonly name: string;
  readonly level: number;
  readonly inventoryIndex: number;
  readonly verbrauchMenge: number;
  readonly fingerprint: string;
}

export interface Pr20_9CraftDurableShadowPlan {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly recipeKey: string;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMenge: number;
  readonly recipeFingerprint: string;
  readonly workspaceNachweisFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly selectedInputs: readonly Pr20_9CraftShadowInputBinding[];
  readonly resourceEpochen: Pr20_9CraftResourceEpochen;
  readonly observedAtMs: number;
  readonly gueltigBisMs: number;
}

export interface Pr20_9CraftCurrentSnapshot {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly recipeFingerprint: string;
  readonly workspaceNachweisFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly selectedInputs: readonly Pr20_9CraftShadowInputBinding[];
  readonly resourceEpochen: Pr20_9CraftResourceEpochen;
  readonly offeneCraftAuthority: boolean;
  readonly offeneCraftTransaktionId: string | null;
}

export interface Pr20_9CraftDurableShadowIntent {
  readonly schemaVersion: 1;
  readonly art: "PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE";
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly actionContractId: "AL-ACTION-CRAFT";
  readonly recoveryContractId: "AL-RECOVERY-CRAFT";
  readonly verifierId: "AL-VERIFIER-CRAFT";
  readonly publicFunction: "craft";
  readonly craftPath: "NORMAL";
  readonly recipeKey: string;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMenge: number;
  readonly recipeFingerprint: string;
  readonly workspaceNachweisFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly selectedInputs: readonly Pr20_9CraftShadowInputBinding[];
  readonly resourceEpochen: Pr20_9CraftResourceEpochen;
  readonly createdAtMs: number;
  readonly journalTerminalArt: "ABBRUCH";
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly reconciliationClassification: "NOT_APPLIED";
  readonly sameIntentRetry: false;
  readonly craftAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadGraphExecutionAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr20_9CraftDurableShadowErgebnis {
  readonly schemaVersion: 1;
  readonly status: "DURABLE_SHADOW_BESTAETIGT_NO_WRITE";
  readonly transaktionsId: string;
  readonly relativerPfad: string;
  readonly durableReadback: true;
  readonly createdThisRun: boolean;
  readonly recoveredExistingTerminal: boolean;
  readonly persistenceWrites: 0 | 1;
  readonly journalTerminalArt: "ABBRUCH";
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly reconciliationClassification: "NOT_APPLIED";
  readonly sameIntentRetry: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly craftAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadGraphExecutionAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function id(wert: string, fehler: string): void {
  text(wert, fehler);
  if (!/^[A-Za-z0-9._:-]+$/.test(wert)) throw new Error(fehler);
}

function ganzzahl(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function epoche(wert: number, fehler: string): void {
  ganzzahl(wert, 0, Number.MAX_SAFE_INTEGER, fehler);
}

function validiereEpochen(e: Pr20_9CraftResourceEpochen): void {
  epoche(e.inventory, "PR20_9_CRAFT_SHADOW_INVENTORY_EPOCHE_UNGUELTIG");
  epoche(e.q, "PR20_9_CRAFT_SHADOW_Q_EPOCHE_UNGUELTIG");
  epoche(e.socketBudget, "PR20_9_CRAFT_SHADOW_SOCKET_EPOCHE_UNGUELTIG");
  epoche(e.actionChannel, "PR20_9_CRAFT_SHADOW_CHANNEL_EPOCHE_UNGUELTIG");
}

function validiereInputs(
  inputs: readonly Pr20_9CraftShadowInputBinding[],
): void {
  if (inputs.length < 1 || inputs.length > 32) {
    throw new Error("PR20_9_CRAFT_SHADOW_INPUT_ANZAHL_UNGUELTIG");
  }
  const indexes = new Set<number>();
  const fingerprints = new Set<string>();
  for (const input of inputs) {
    text(input.name, "PR20_9_CRAFT_SHADOW_INPUT_TEXT_UNGUELTIG");
    text(input.fingerprint, "PR20_9_CRAFT_SHADOW_INPUT_TEXT_UNGUELTIG");
    ganzzahl(
      input.level,
      0,
      99,
      "PR20_9_CRAFT_SHADOW_INPUT_LEVEL_UNGUELTIG",
    );
    ganzzahl(
      input.inventoryIndex,
      0,
      1024,
      "PR20_9_CRAFT_SHADOW_INPUT_INDEX_UNGUELTIG",
    );
    ganzzahl(
      input.verbrauchMenge,
      1,
      1_000_000,
      "PR20_9_CRAFT_SHADOW_INPUT_MENGE_UNGUELTIG",
    );
    if (indexes.has(input.inventoryIndex)) {
      throw new Error("PR20_9_CRAFT_SHADOW_INPUT_INDEX_DOPPELT");
    }
    if (fingerprints.has(input.fingerprint)) {
      throw new Error("PR20_9_CRAFT_SHADOW_INPUT_FINGERPRINT_DOPPELT");
    }
    indexes.add(input.inventoryIndex);
    fingerprints.add(input.fingerprint);
  }
}

function validierePlanGrundlagen(plan: Pr20_9CraftDurableShadowPlan): void {
  if (!plan || plan.schemaVersion !== 1) {
    throw new Error("PR20_9_CRAFT_SHADOW_PLAN_SCHEMA_UNGUELTIG");
  }
  for (const wert of [
    plan.auftragId,
    plan.ablaufId,
    plan.characterId,
    plan.sessionId,
    plan.serverRegion,
    plan.serverIdentifier,
    plan.recipeKey,
    plan.outputName,
    plan.recipeFingerprint,
    plan.workspaceNachweisFingerprint,
    plan.inventoryFingerprint,
    plan.qFingerprint,
  ]) {
    text(wert, "PR20_9_CRAFT_SHADOW_PLAN_TEXT_UNGUELTIG");
  }
  id(plan.transaktionsId, "PR20_9_CRAFT_SHADOW_TX_ID_UNGUELTIG");
  ganzzahl(
    plan.outputLevel,
    0,
    99,
    "PR20_9_CRAFT_SHADOW_OUTPUT_LEVEL_UNGUELTIG",
  );
  ganzzahl(
    plan.outputMenge,
    1,
    1_000_000,
    "PR20_9_CRAFT_SHADOW_OUTPUT_MENGE_UNGUELTIG",
  );
  if (!Number.isSafeInteger(plan.observedAtMs)
      || !Number.isSafeInteger(plan.gueltigBisMs)
      || plan.observedAtMs < 0
      || plan.gueltigBisMs < plan.observedAtMs
      || plan.gueltigBisMs - plan.observedAtMs > 1_500) {
    throw new Error("PR20_9_CRAFT_SHADOW_PLAN_TTL_UNGUELTIG");
  }
  validiereInputs(plan.selectedInputs);
  validiereEpochen(plan.resourceEpochen);
}

function gleichEpochen(
  a: Pr20_9CraftResourceEpochen,
  b: Pr20_9CraftResourceEpochen,
): boolean {
  return a.inventory === b.inventory
    && a.q === b.q
    && a.socketBudget === b.socketBudget
    && a.actionChannel === b.actionChannel;
}

function gleichInputs(
  a: readonly Pr20_9CraftShadowInputBinding[],
  b: readonly Pr20_9CraftShadowInputBinding[],
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

function preflightPasstPlan(
  plan: Pr20_9CraftDurableShadowPlan,
  preflight: Pr20_9CraftReadOnlyPreflightResult,
): boolean {
  return preflight.status === "BEREIT_NO_WRITE"
    && preflight.blocker.length === 0
    && preflight.craftPath === "NORMAL"
    && preflight.actionContractId === "AL-ACTION-CRAFT"
    && preflight.recoveryContractId === "AL-RECOVERY-CRAFT"
    && preflight.verifierId === "AL-VERIFIER-CRAFT"
    && preflight.recipeFingerprint === plan.recipeFingerprint
    && preflight.workspaceNachweisFingerprint
      === plan.workspaceNachweisFingerprint
    && preflight.selectedInputs.length === plan.selectedInputs.length
    && preflight.selectedInputs.every((input, index) => {
      const binding = plan.selectedInputs[index];
      return binding !== undefined
        && input.name === binding.name
        && input.level === binding.level
        && input.inventoryIndex === binding.inventoryIndex
        && input.verbrauchMenge === binding.verbrauchMenge
        && input.fingerprint === binding.fingerprint;
    })
    && preflight.gameplayWrites === 0
    && preflight.publicFunctionCalls === 0
    && preflight.rawWriteCalls === 0
    && preflight.craftAuthority === false
    && preflight.gameplayAuthority === false
    && preflight.rawWriteAuthority === false
    && preflight.sameIntentRetry === false
    && preflight.sendBoundaryState === "NICHT_GESENDET"
    && preflight.normalRuntimeAllowed === false;
}

function snapshotPasstPlan(
  plan: Pr20_9CraftDurableShadowPlan,
  snapshot: Pr20_9CraftCurrentSnapshot,
): boolean {
  return snapshot.schemaVersion === 1
    && snapshot.characterId === plan.characterId
    && snapshot.sessionId === plan.sessionId
    && snapshot.serverRegion === plan.serverRegion
    && snapshot.serverIdentifier === plan.serverIdentifier
    && snapshot.recipeFingerprint === plan.recipeFingerprint
    && snapshot.workspaceNachweisFingerprint
      === plan.workspaceNachweisFingerprint
    && snapshot.inventoryFingerprint === plan.inventoryFingerprint
    && snapshot.qFingerprint === plan.qFingerprint
    && gleichInputs(snapshot.selectedInputs, plan.selectedInputs)
    && gleichEpochen(snapshot.resourceEpochen, plan.resourceEpochen)
    && snapshot.offeneCraftAuthority === false
    && snapshot.offeneCraftTransaktionId === null;
}

function intentAus(
  plan: Pr20_9CraftDurableShadowPlan,
  createdAtMs: number,
): Pr20_9CraftDurableShadowIntent {
  return Object.freeze({
    schemaVersion: 1,
    art: "PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE",
    transaktionsId: plan.transaktionsId,
    auftragId: plan.auftragId,
    ablaufId: plan.ablaufId,
    characterId: plan.characterId,
    sessionId: plan.sessionId,
    serverRegion: plan.serverRegion,
    serverIdentifier: plan.serverIdentifier,
    actionContractId: "AL-ACTION-CRAFT",
    recoveryContractId: "AL-RECOVERY-CRAFT",
    verifierId: "AL-VERIFIER-CRAFT",
    publicFunction: "craft",
    craftPath: "NORMAL",
    recipeKey: plan.recipeKey,
    outputName: plan.outputName,
    outputLevel: plan.outputLevel,
    outputMenge: plan.outputMenge,
    recipeFingerprint: plan.recipeFingerprint,
    workspaceNachweisFingerprint: plan.workspaceNachweisFingerprint,
    inventoryFingerprint: plan.inventoryFingerprint,
    qFingerprint: plan.qFingerprint,
    selectedInputs: Object.freeze(plan.selectedInputs.map(x => Object.freeze({
      ...x,
    }))),
    resourceEpochen: Object.freeze({ ...plan.resourceEpochen }),
    createdAtMs,
    journalTerminalArt: "ABBRUCH",
    sendBoundaryState: "NICHT_GESENDET",
    reconciliationClassification: "NOT_APPLIED",
    sameIntentRetry: false,
    craftAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadGraphExecutionAuthority: false,
    normalRuntimeAllowed: false,
  });
}

function bestehenderIntentPasst(
  plan: Pr20_9CraftDurableShadowPlan,
  roh: unknown,
): roh is Pr20_9CraftDurableShadowIntent {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) return false;
  const x = roh as Partial<Pr20_9CraftDurableShadowIntent>;
  return x.schemaVersion === 1
    && x.art === "PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE"
    && x.transaktionsId === plan.transaktionsId
    && x.auftragId === plan.auftragId
    && x.ablaufId === plan.ablaufId
    && x.characterId === plan.characterId
    && x.sessionId === plan.sessionId
    && x.serverRegion === plan.serverRegion
    && x.serverIdentifier === plan.serverIdentifier
    && x.actionContractId === "AL-ACTION-CRAFT"
    && x.recoveryContractId === "AL-RECOVERY-CRAFT"
    && x.verifierId === "AL-VERIFIER-CRAFT"
    && x.publicFunction === "craft"
    && x.craftPath === "NORMAL"
    && x.recipeKey === plan.recipeKey
    && x.outputName === plan.outputName
    && x.outputLevel === plan.outputLevel
    && x.outputMenge === plan.outputMenge
    && x.recipeFingerprint === plan.recipeFingerprint
    && x.workspaceNachweisFingerprint === plan.workspaceNachweisFingerprint
    && x.inventoryFingerprint === plan.inventoryFingerprint
    && x.qFingerprint === plan.qFingerprint
    && Array.isArray(x.selectedInputs)
    && gleichInputs(
      x.selectedInputs as readonly Pr20_9CraftShadowInputBinding[],
      plan.selectedInputs,
    )
    && x.resourceEpochen !== undefined
    && gleichEpochen(
      x.resourceEpochen as Pr20_9CraftResourceEpochen,
      plan.resourceEpochen,
    )
    && Number.isSafeInteger(x.createdAtMs)
    && (x.createdAtMs as number) >= 0
    && x.journalTerminalArt === "ABBRUCH"
    && x.sendBoundaryState === "NICHT_GESENDET"
    && x.reconciliationClassification === "NOT_APPLIED"
    && x.sameIntentRetry === false
    && x.craftAuthority === false
    && x.gameplayAuthority === false
    && x.rawWriteAuthority === false
    && x.broadGraphExecutionAuthority === false
    && x.normalRuntimeAllowed === false;
}

function ergebnis(
  plan: Pr20_9CraftDurableShadowPlan,
  relativerPfad: string,
  createdThisRun: boolean,
): Pr20_9CraftDurableShadowErgebnis {
  return Object.freeze({
    schemaVersion: 1,
    status: "DURABLE_SHADOW_BESTAETIGT_NO_WRITE",
    transaktionsId: plan.transaktionsId,
    relativerPfad,
    durableReadback: true,
    createdThisRun,
    recoveredExistingTerminal: !createdThisRun,
    persistenceWrites: createdThisRun ? 1 : 0,
    journalTerminalArt: "ABBRUCH",
    sendBoundaryState: "NICHT_GESENDET",
    reconciliationClassification: "NOT_APPLIED",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    craftAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadGraphExecutionAuthority: false,
    normalRuntimeAllowed: false,
  });
}

export async function persistierePr20_9CraftDurableShadow(
  plan: Pr20_9CraftDurableShadowPlan,
  preflight: Pr20_9CraftReadOnlyPreflightResult,
  snapshot: Pr20_9CraftCurrentSnapshot,
  jetztMs: number,
  speicher: SpeicherPort,
): Promise<Pr20_9CraftDurableShadowErgebnis> {
  validierePlanGrundlagen(plan);
  ganzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "PR20_9_CRAFT_SHADOW_ZEIT_UNGUELTIG",
  );

  const relativerPfad =
    "produktion/pr20-9/craft-shadow/" + plan.transaktionsId + ".json";
  const bestehend = await speicher.lies(relativerPfad);
  if (bestehend !== undefined) {
    let roh: unknown;
    try {
      roh = JSON.parse(bestehend);
    } catch {
      throw new Error("PR20_9_CRAFT_SHADOW_EXISTING_INTENT_UNLESBAR");
    }
    if (!bestehenderIntentPasst(plan, roh)) {
      throw new Error("PR20_9_CRAFT_SHADOW_EXISTING_INTENT_DRIFT");
    }
    return ergebnis(plan, relativerPfad, false);
  }

  if (jetztMs < plan.observedAtMs || jetztMs > plan.gueltigBisMs) {
    throw new Error("PR20_9_CRAFT_SHADOW_PLAN_NICHT_FRISCH");
  }
  if (!preflightPasstPlan(plan, preflight)) {
    throw new Error("PR20_9_CRAFT_SHADOW_PREFLIGHT_DRIFT");
  }
  if (!snapshotPasstPlan(plan, snapshot)) {
    throw new Error("PR20_9_CRAFT_SHADOW_CURRENT_FENCE_BLOCKIERT");
  }

  const intent = intentAus(plan, jetztMs);
  const inhalt = JSON.stringify(intent);
  await speicher.schreibe({
    relativerPfad,
    inhalt,
    kritisch: true,
  });

  const readback = await speicher.lies(relativerPfad);
  if (readback === undefined) {
    throw new Error("PR20_9_CRAFT_SHADOW_DURABLE_READBACK_FEHLT");
  }
  let roh: unknown;
  try {
    roh = JSON.parse(readback);
  } catch {
    throw new Error("PR20_9_CRAFT_SHADOW_DURABLE_READBACK_UNLESBAR");
  }
  if (!bestehenderIntentPasst(plan, roh)) {
    throw new Error("PR20_9_CRAFT_SHADOW_DURABLE_READBACK_DRIFT");
  }

  return ergebnis(plan, relativerPfad, true);
}
