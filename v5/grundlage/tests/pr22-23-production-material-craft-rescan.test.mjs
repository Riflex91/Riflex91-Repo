import test from "node:test";
import assert from "node:assert/strict";

import {
  MerchantLogistikLedger,
  bewerteProductionMaterialFortschritt,
  planeProductionMaterialAkquise,
  planeProductionMaterialHandoff,
  planeProduktion,
  pruefeProductionMaterialCraftRescan,
} from "../../erzeugt/index.js";

const merchant = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "merchant",
  sessionId: "merchant-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

const farmer = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "ranger",
  sessionId: "ranger-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

function productionPlan() {
  return planeProduktion({
    schemaVersion: 1,
    planId: "plan-rescan",
    produktionsId: "prod-rescan",
    ablaufId: "workflow-rescan",
    ownerCharacterId: "merchant",
    recipient: merchant,
    outputName: "sword",
    outputLevel: 0,
    outputMenge: 1,
    planFingerprint: "plan-rescan-fp",
    lokalerBestand: [],
    bankSnapshot: null,
    quellen: [{
      schemaVersion: 1,
      sourceId: "farm-iron-bee",
      art: "FARM",
      name: "iron",
      level: 0,
      verfuegbareMenge: 2,
      beobachtetAmMs: 100,
      gueltigBisMs: 2_000,
      fingerprint: "farm-iron-fp",
      gateEvidence: null,
    }],
    transformationen: [{
      schemaVersion: 1,
      transformationId: "craft-sword",
      art: "CRAFT",
      outputName: "sword",
      outputLevel: 0,
      outputMengeProVorgang: 1,
      inputs: [{ name: "iron", level: 0, menge: 2 }],
      workspaceNachweisFingerprint: "workspace-fp",
      beobachtetAmMs: 100,
      gueltigBisMs: 2_000,
      fingerprint: "craft-sword-fp",
    }],
    richtlinie: {
      richtlinienVersion: "rescan-v1",
      quellenPrioritaet: ["FARM", "CRAFT"],
      maximaleTiefe: 8,
      maximaleSchritte: 64,
      maximalesEvidenceAlterMs: 2_000,
    },
  }, 200);
}

function materialZiel() {
  const plan = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: productionPlan(),
    farmQuellen: [{
      schemaVersion: 1,
      sourceId: "farm-iron-bee",
      name: "iron",
      level: 0,
      verfuegbareMenge: 2,
      monsterTyp: "bee",
      mapName: "main",
      spawnFingerprint: "spawn-bee-main-fp",
      beobachtetAmMs: 100,
      gueltigBisMs: 2_000,
    }],
    farmer: [{
      schemaVersion: 1,
      farmer,
      beobachtetAmMs: 100,
      gueltigBisMs: 2_000,
      freshnessFingerprint: "farmer-fp",
      lifecycleAktiv: true,
      safetyBereit: true,
      movementVorbereitet: true,
      combatVorbereitet: true,
      lootVorbereitet: true,
      unterstuetzteSourceIds: ["farm-iron-bee"],
    }],
    maximalesEvidenceAlterMs: 2_000,
  }, 200);
  assert.equal(plan.status, "BEREIT_NO_WRITE");
  return plan.ziele[0];
}

function handoffPlan() {
  const ziel = materialZiel();
  const fortschritt = bewerteProductionMaterialFortschritt(ziel, {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge: 2,
    beobachtetAmMs: 300,
    gueltigBisMs: 2_000,
    inventoryFingerprint: "farmer-inventory-ready-fp",
  }, 300, 2_000);

  return planeProductionMaterialHandoff({
    schemaVersion: 1,
    ziel,
    fortschritt,
    merchant,
    quelleEvidence: {
      schemaVersion: 1,
      quelle: farmer,
      beobachtetAmMs: 300,
      gueltigBisMs: 2_000,
      freshnessFingerprint: "farmer-inventory-fresh-fp",
      inventoryFingerprint: "farmer-inventory-ready-fp",
      posten: [{
        physischeKennung: "slot:7",
        name: "iron",
        level: 0,
        menge: 2,
        itemFingerprint: "iron-slot-7-fp",
      }],
    },
    merchantRendezvousEvidence: {
      schemaVersion: 1,
      characterId: "merchant",
      sessionId: "merchant-session",
      serverRegion: "EU",
      serverIdentifier: "I",
      rosterEpoche: 7,
      beobachtetAmMs: 400,
      distanz: 20,
      freshnessFingerprint: "merchant-rendezvous-fp",
    },
    baselineMerchantInventoryFingerprint: "merchant-before-fp",
    baselineMerchantMenge: 0,
    erstelltAmMs: 400,
    gueltigBisMs: 1_500,
    maximalTransferDistanz: 100,
    maximalesEvidenceAlterMs: 2_000,
  }, 400);
}

function settlementEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: 600,
    inventoryFingerprint: "merchant-after-fp",
    baselineInventoryFingerprint: "merchant-before-fp",
    mengen: [{ name: "iron", level: 0, menge: 2 }],
    settlementFingerprint: "collection-settlement-fp",
    ...overrides,
  };
}

function settledView(handoff, evidence = settlementEvidence()) {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(handoff.logistik.plan);
  ledger.beginneRendezvous(handoff.logistik.plan.logistikId);
  ledger.bestaetigeRendezvous(handoff.logistik.plan.logistikId, {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: 450,
    distanz: 20,
    freshnessFingerprint: "merchant-rendezvous-fp",
  });
  ledger.beginneTransfer(handoff.logistik.plan.logistikId);
  return ledger.verifiziereSettlement(
    handoff.logistik.plan.logistikId,
    evidence,
  );
}

function craftPreflight(overrides = {}) {
  return {
    schemaVersion: 1,
    recipe: {
      schemaVersion: 1,
      craftPath: "NORMAL",
      recipeKey: "craft-sword",
      outputName: "sword",
      outputLevel: 0,
      outputMenge: 1,
      goldKosten: 100,
      inputs: [{ name: "iron", level: 0, menge: 2 }],
      beobachtetAmMs: 650,
      gueltigBisMs: 1_500,
      sourceSnapshotCommit: "0123456789abcdef0123456789abcdef01234567",
      fingerprint: "recipe-sword-fp",
      ...(overrides.recipe ?? {}),
    },
    inventory: [{
      index: 3,
      name: "iron",
      level: 0,
      menge: 2,
      locked: false,
      blocked: false,
      valueProtected: false,
      fingerprint: "merchant-iron-slot-3-fp",
    }],
    gold: 1_000,
    freieSlots: 1,
    workspaceNachweisFingerprint: "workspace-sword-fp",
    reachability: {
      schemaVersion: 1,
      erreichbar: true,
      gateRequired: false,
      gateFresh: true,
      beobachtetAmMs: 650,
      gueltigBisMs: 1_500,
      fingerprint: "craft-service-reachability-fp",
    },
    maximalesEvidenceAlterMs: 2_000,
    ...overrides,
  };
}

function request(overrides = {}) {
  const handoff = overrides.handoff ?? handoffPlan();
  const settlement = overrides.settlementEvidence ?? settlementEvidence();
  const sicht = overrides.settledSicht ?? settledView(handoff, settlement);
  return {
    schemaVersion: 1,
    handoff,
    settledSicht: sicht,
    settlementEvidence: settlement,
    merchantInventoryFingerprint: "merchant-after-fp",
    merchantInventoryBeobachtetAmMs: 650,
    merchantInventoryGueltigBisMs: 1_500,
    craftPreflight: craftPreflight(),
    maximalesEvidenceAlterMs: 2_000,
    ...overrides,
  };
}

test("CAP-022 erlaubt nach verifiziertem COLLECTION-Settlement nur frischen Craft-Rescan NO-WRITE", () => {
  const result = pruefeProductionMaterialCraftRescan(request(), 700);

  assert.equal(result.status, "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE");
  assert.equal(result.settledHandoffVerified, true);
  assert.equal(result.postSettlementInventoryVerified, true);
  assert.equal(result.handedMaterialMatchesRecipeInput, true);
  assert.equal(result.candidateObserved, true);
  assert.equal(result.rescanTriggerEligible, true);
  assert.equal(result.preflight.status, "BEREIT_NO_WRITE");
  assert.equal(result.preflight.selectedInputs.length, 1);
  assert.equal(result.preflight.selectedInputs[0].name, "iron");
  assert.equal(result.preflight.selectedInputs[0].inventoryIndex, 3);

  assert.equal(result.currentPr20_9RatificationCredit, false);
  assert.equal(result.foundationCountsAsCraftRatification, false);
  assert.equal(result.productiveCraftAuthorityOpened, false);
  assert.equal(result.broadGraphExecutionAuthority, false);
  assert.equal(result.gameplayWrites, 0);
  assert.equal(result.publicFunctionCalls, 0);
  assert.equal(result.rawWriteCalls, 0);
  assert.equal(result.craftAuthority, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.rawWriteAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
});

test("CAP-022 Rescan blockiert wenn Handoff noch nicht SETTLED ist", () => {
  const handoff = handoffPlan();
  const ledger = new MerchantLogistikLedger();
  const geplant = ledger.plane(handoff.logistik.plan);

  assert.throws(
    () => pruefeProductionMaterialCraftRescan(
      request({
        handoff,
        settledSicht: geplant,
      }),
      700,
    ),
    /CAP022_CRAFT_RESCAN_HANDOFF_NICHT_SETTLED/,
  );
});

test("CAP-022 Rescan verlangt einen Inventory-Snapshot nach dem Settlement", () => {
  assert.throws(
    () => pruefeProductionMaterialCraftRescan(request({
      merchantInventoryBeobachtetAmMs: 550,
    }), 700),
    /CAP022_CRAFT_RESCAN_POST_SETTLEMENT_INVENTAR_STALE_ODER_DRIFT/,
  );

  assert.throws(
    () => pruefeProductionMaterialCraftRescan(request({
      merchantInventoryFingerprint: "unrelated-inventory-fp",
    }), 700),
    /CAP022_CRAFT_RESCAN_POST_SETTLEMENT_INVENTAR_STALE_ODER_DRIFT/,
  );
});

test("CAP-022 Rescan muss das uebergebene Material als Recipe-Input verwenden", () => {
  const wrongRecipe = craftPreflight({
    recipe: {
      inputs: [{ name: "wood", level: 0, menge: 2 }],
    },
    inventory: [{
      index: 3,
      name: "wood",
      level: 0,
      menge: 2,
      locked: false,
      blocked: false,
      valueProtected: false,
      fingerprint: "merchant-wood-slot-3-fp",
    }],
  });

  assert.throws(
    () => pruefeProductionMaterialCraftRescan(request({
      craftPreflight: wrongRecipe,
    }), 700),
    /CAP022_CRAFT_RESCAN_HANDOFF_MATERIAL_NICHT_RECIPE_INPUT/,
  );
});

test("CAP-022 Rescan kann NO-WRITE blockieren ohne Craft-Authority zu oeffnen", () => {
  const blocked = craftPreflight({
    inventory: [{
      index: 3,
      name: "iron",
      level: 0,
      menge: 1,
      locked: false,
      blocked: false,
      valueProtected: false,
      fingerprint: "merchant-iron-slot-3-fp",
    }],
  });

  const result = pruefeProductionMaterialCraftRescan(request({
    craftPreflight: blocked,
  }), 700);

  assert.equal(result.status, "CRAFT_RESCAN_BLOCKIERT");
  assert.equal(result.candidateObserved, false);
  assert.ok(result.blocker.some(x =>
    x.startsWith("PR20_9_CRAFT_INPUT_FEHLT_ODER_SPLIT_STACK_ERFORDERLICH:")));
  assert.equal(result.currentPr20_9RatificationCredit, false);
  assert.equal(result.craftAuthority, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.rawWriteAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
});

test("CAP-022 Rescan lehnt Settlement-Fingerprint-Drift ab", () => {
  const handoff = handoffPlan();
  const settlement = settlementEvidence();
  const sicht = settledView(handoff, settlement);

  assert.throws(
    () => pruefeProductionMaterialCraftRescan(request({
      handoff,
      settlementEvidence: {
        ...settlement,
        settlementFingerprint: "other-settlement-fp",
      },
      settledSicht: sicht,
    }), 700),
    /CAP022_CRAFT_RESCAN_HANDOFF_NICHT_SETTLED/,
  );
});
