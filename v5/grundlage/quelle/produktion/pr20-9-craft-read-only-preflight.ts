export interface Pr20_9CraftInputRequirement {
  readonly name: string;
  readonly level: number;
  readonly menge: number;
}

export interface Pr20_9CraftRecipeEvidence {
  readonly schemaVersion: 1;
  readonly craftPath: "NORMAL";
  readonly recipeKey: string;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMenge: number;
  readonly goldKosten: number;
  readonly inputs: readonly Pr20_9CraftInputRequirement[];
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly sourceSnapshotCommit: string;
  readonly fingerprint: string;
}

export interface Pr20_9CraftInventoryItem {
  readonly index: number;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly locked: boolean;
  readonly blocked: boolean;
  readonly valueProtected: boolean;
  readonly fingerprint: string;
}

export interface Pr20_9CraftReachabilityEvidence {
  readonly schemaVersion: 1;
  readonly erreichbar: boolean;
  readonly gateRequired: boolean;
  readonly gateFresh: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface Pr20_9CraftReadOnlyPreflightRequest {
  readonly schemaVersion: 1;
  readonly recipe: Pr20_9CraftRecipeEvidence;
  readonly inventory: readonly Pr20_9CraftInventoryItem[];
  readonly gold: number;
  readonly freieSlots: number;
  readonly workspaceNachweisFingerprint: string;
  readonly reachability: Pr20_9CraftReachabilityEvidence;
  readonly maximalesEvidenceAlterMs: number;
}

export interface Pr20_9CraftSelectedInput {
  readonly name: string;
  readonly level: number;
  readonly inventoryIndex: number;
  readonly vorhandeneMenge: number;
  readonly verbrauchMenge: number;
  readonly vollstaendigVerbraucht: boolean;
  readonly fingerprint: string;
}

export interface Pr20_9CraftReadOnlyPreflightResult {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly craftPath: "NORMAL";
  readonly actionContractId: "AL-ACTION-CRAFT";
  readonly recoveryContractId: "AL-RECOVERY-CRAFT";
  readonly verifierId: "AL-VERIFIER-CRAFT";
  readonly selectedInputs: readonly Pr20_9CraftSelectedInput[];
  readonly serverEquivalentOutputspaceSatisfied: boolean;
  readonly recipeFingerprint: string;
  readonly workspaceNachweisFingerprint: string;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly craftAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly sameIntentRetry: false;
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly normalRuntimeAllowed: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
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

function istFrisch(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  maximalesAlterMs: number,
): boolean {
  return Number.isSafeInteger(beobachtetAmMs)
    && Number.isSafeInteger(gueltigBisMs)
    && beobachtetAmMs >= 0
    && gueltigBisMs >= beobachtetAmMs
    && jetztMs >= beobachtetAmMs
    && jetztMs <= gueltigBisMs
    && jetztMs - beobachtetAmMs <= maximalesAlterMs;
}

function basisResult(
  anfrage: Pr20_9CraftReadOnlyPreflightRequest,
  blocker: readonly string[],
  selectedInputs: readonly Pr20_9CraftSelectedInput[],
  serverEquivalentOutputspaceSatisfied: boolean,
): Pr20_9CraftReadOnlyPreflightResult {
  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "BEREIT_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze([...blocker]),
    craftPath: "NORMAL",
    actionContractId: "AL-ACTION-CRAFT",
    recoveryContractId: "AL-RECOVERY-CRAFT",
    verifierId: "AL-VERIFIER-CRAFT",
    selectedInputs: Object.freeze([...selectedInputs]),
    serverEquivalentOutputspaceSatisfied,
    recipeFingerprint: anfrage.recipe.fingerprint,
    workspaceNachweisFingerprint: anfrage.workspaceNachweisFingerprint,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    craftAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    sameIntentRetry: false,
    sendBoundaryState: "NICHT_GESENDET",
    normalRuntimeAllowed: false,
  });
}

export function pruefePr20_9CraftReadOnlyPreflight(
  anfrage: Pr20_9CraftReadOnlyPreflightRequest,
  jetztMs: number,
): Pr20_9CraftReadOnlyPreflightResult {
  if (anfrage.schemaVersion !== 1
      || anfrage.recipe.schemaVersion !== 1
      || anfrage.reachability.schemaVersion !== 1) {
    throw new Error("PR20_9_CRAFT_PREFLIGHT_SCHEMA_UNGUELTIG");
  }
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "PR20_9_CRAFT_PREFLIGHT_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    86_400_000,
    "PR20_9_CRAFT_PREFLIGHT_EVIDENCE_ALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.gold,
    0,
    Number.MAX_SAFE_INTEGER,
    "PR20_9_CRAFT_PREFLIGHT_GOLD_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.freieSlots,
    0,
    256,
    "PR20_9_CRAFT_PREFLIGHT_SLOTS_UNGUELTIG",
  );

  const recipe = anfrage.recipe;
  for (const text of [
    recipe.recipeKey,
    recipe.outputName,
    recipe.sourceSnapshotCommit,
    recipe.fingerprint,
    anfrage.workspaceNachweisFingerprint,
    anfrage.reachability.fingerprint,
  ]) {
    pruefeText(text, "PR20_9_CRAFT_PREFLIGHT_TEXT_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/i.test(recipe.sourceSnapshotCommit)) {
    throw new Error("PR20_9_CRAFT_PREFLIGHT_SOURCE_COMMIT_UNGUELTIG");
  }
  pruefeGanzzahl(
    recipe.outputLevel,
    0,
    99,
    "PR20_9_CRAFT_PREFLIGHT_OUTPUT_LEVEL_UNGUELTIG",
  );
  pruefeGanzzahl(
    recipe.outputMenge,
    1,
    1_000_000,
    "PR20_9_CRAFT_PREFLIGHT_OUTPUT_MENGE_UNGUELTIG",
  );
  pruefeGanzzahl(
    recipe.goldKosten,
    0,
    Number.MAX_SAFE_INTEGER,
    "PR20_9_CRAFT_PREFLIGHT_RECIPE_GOLD_UNGUELTIG",
  );
  if (recipe.inputs.length < 1 || recipe.inputs.length > 32) {
    throw new Error("PR20_9_CRAFT_PREFLIGHT_INPUTS_UNGUELTIG");
  }
  if (anfrage.inventory.length > 256) {
    throw new Error("PR20_9_CRAFT_PREFLIGHT_INVENTAR_ZU_GROSS");
  }

  const blocker: string[] = [];
  if (recipe.craftPath !== "NORMAL") {
    blocker.push("PR20_9_CRAFT_SPECIAL_PATH_NICHT_FREIGEGEBEN");
  }
  if (!istFrisch(
    recipe.beobachtetAmMs,
    recipe.gueltigBisMs,
    jetztMs,
    anfrage.maximalesEvidenceAlterMs,
  )) {
    blocker.push("PR20_9_CRAFT_RECIPE_EVIDENCE_STALE");
  }
  if (!istFrisch(
    anfrage.reachability.beobachtetAmMs,
    anfrage.reachability.gueltigBisMs,
    jetztMs,
    anfrage.maximalesEvidenceAlterMs,
  )) {
    blocker.push("PR20_9_CRAFT_REACHABILITY_EVIDENCE_STALE");
  }
  if (!anfrage.reachability.erreichbar) {
    blocker.push("PR20_9_CRAFT_SERVICE_NICHT_ERREICHBAR");
  }
  if (anfrage.reachability.gateRequired && !anfrage.reachability.gateFresh) {
    blocker.push("PR20_9_CRAFT_GATE_NICHT_FRISCH");
  }
  if (anfrage.gold < recipe.goldKosten) {
    blocker.push("PR20_9_CRAFT_GOLD_UNZUREICHEND");
  }

  const inputNames = new Set<string>();
  for (const input of recipe.inputs) {
    pruefeText(input.name, "PR20_9_CRAFT_PREFLIGHT_INPUT_NAME_UNGUELTIG");
    pruefeGanzzahl(
      input.level,
      0,
      99,
      "PR20_9_CRAFT_PREFLIGHT_INPUT_LEVEL_UNGUELTIG",
    );
    pruefeGanzzahl(
      input.menge,
      1,
      1_000_000,
      "PR20_9_CRAFT_PREFLIGHT_INPUT_MENGE_UNGUELTIG",
    );
    if (inputNames.has(input.name)) {
      blocker.push("PR20_9_CRAFT_DUPLICATE_INGREDIENT_NAME_UNSAFE");
    }
    inputNames.add(input.name);
  }

  const inventoryIndexes = new Set<number>();
  for (const item of anfrage.inventory) {
    pruefeGanzzahl(
      item.index,
      0,
      1024,
      "PR20_9_CRAFT_PREFLIGHT_INDEX_UNGUELTIG",
    );
    pruefeText(item.name, "PR20_9_CRAFT_PREFLIGHT_ITEM_NAME_UNGUELTIG");
    pruefeText(
      item.fingerprint,
      "PR20_9_CRAFT_PREFLIGHT_ITEM_FINGERPRINT_UNGUELTIG",
    );
    pruefeGanzzahl(
      item.level,
      0,
      99,
      "PR20_9_CRAFT_PREFLIGHT_ITEM_LEVEL_UNGUELTIG",
    );
    pruefeGanzzahl(
      item.menge,
      1,
      1_000_000,
      "PR20_9_CRAFT_PREFLIGHT_ITEM_MENGE_UNGUELTIG",
    );
    if (inventoryIndexes.has(item.index)) {
      throw new Error("PR20_9_CRAFT_PREFLIGHT_INDEX_DOPPELT");
    }
    inventoryIndexes.add(item.index);
  }

  const selectedInputs: Pr20_9CraftSelectedInput[] = [];
  const verwendeteIndexes = new Set<number>();
  for (const input of recipe.inputs) {
    const kandidat = [...anfrage.inventory]
      .filter(item => item.name === input.name
        && item.level === input.level
        && item.menge >= input.menge
        && !item.locked
        && !item.blocked
        && !item.valueProtected
        && !verwendeteIndexes.has(item.index))
      .sort((a, b) => a.index - b.index)[0];

    if (kandidat === undefined) {
      blocker.push(
        "PR20_9_CRAFT_INPUT_FEHLT_ODER_SPLIT_STACK_ERFORDERLICH:"
        + input.name
        + "@"
        + String(input.level),
      );
      continue;
    }
    verwendeteIndexes.add(kandidat.index);
    selectedInputs.push(Object.freeze({
      name: kandidat.name,
      level: kandidat.level,
      inventoryIndex: kandidat.index,
      vorhandeneMenge: kandidat.menge,
      verbrauchMenge: input.menge,
      vollstaendigVerbraucht: kandidat.menge === input.menge,
      fingerprint: kandidat.fingerprint,
    }));
  }

  const serverEquivalentOutputspaceSatisfied =
    anfrage.freieSlots > 0
    || selectedInputs.some(input => input.vollstaendigVerbraucht);

  if (!serverEquivalentOutputspaceSatisfied) {
    blocker.push("PR20_9_CRAFT_OUTPUTSPACE_UNZUREICHEND");
  }

  return basisResult(
    anfrage,
    blocker,
    selectedInputs,
    serverEquivalentOutputspaceSatisfied,
  );
}
