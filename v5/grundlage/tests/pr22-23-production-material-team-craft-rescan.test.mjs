import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MerchantLogistikLedger,
  PersistenterProduktionsMaterialTeamBatchController,
  planeProductionMaterialTeam,
  planeProductionMaterialTeamHandoff,
  pruefeProductionMaterialTeamCraftRescan,
} from "../../erzeugt/index.js";

class MemorySpeicher {
  constructor() {
    this.map = new Map();
  }
  async schreibe(anfrage) {
    this.map.set(anfrage.relativerPfad, anfrage.inhalt);
  }
  async lies(pfad) {
    return this.map.get(pfad);
  }
}

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

const ranger = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "ranger",
  sessionId: "ranger-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

const mage = Object.freeze({
  ...ranger,
  characterId: "mage",
  sessionId: "mage-session",
});

function worker(farmer) {
  return {
    schemaVersion: 1,
    farmer,
    beobachtetAmMs: 100,
    gueltigBisMs: 2_000,
    freshnessFingerprint: "fresh-" + farmer.characterId,
    lifecycleAktiv: true,
    safetyBereit: true,
    movementVorbereitet: true,
    combatVorbereitet: true,
    lootVorbereitet: true,
    unterstuetzteSourceIds: ["farm-iron-bee"],
  };
}

function inventoryEvidence(farmer, menge) {
  return {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge,
    beobachtetAmMs: 100,
    gueltigBisMs: 2_000,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
  };
}

function source(farmer, menge, beobachtetAmMs) {
  return {
    schemaVersion: 1,
    quelle: farmer,
    beobachtetAmMs,
    gueltigBisMs: 2_000,
    freshnessFingerprint: "source-fresh-" + farmer.characterId,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
    posten: [{
      physischeKennung: "slot:7",
      name: "iron",
      level: 0,
      menge,
      itemFingerprint: "item-" + farmer.characterId + "-slot-7",
    }],
  };
}

function rendezvous(beobachtetAmMs, fingerprint) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs,
    distanz: 20,
    freshnessFingerprint: fingerprint,
  };
}

function handoff() {
  const team = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: {
      schemaVersion: 1,
      objectiveId: "prod-1:material:farm:1",
      produktionsId: "prod-1",
      ablaufId: "workflow-1",
      farmNodeId: "farm:1",
      farmer: ranger,
      sourceId: "farm-iron-bee",
      monsterTyp: "bee",
      mapName: "main",
      spawnFingerprint: "spawn-bee-main-fp",
      name: "iron",
      level: 0,
      menge: 10,
      gueltigBisMs: 2_000,
      farmStopBeiMaterialBereit: true,
      handoffNachMaterialBereit: true,
      pr22KoordinationErforderlich: true,
      pr23FarmerAktionenErforderlich: true,
      pr20_9CraftRatificationCredit: false,
      planningOnly: true,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    },
    farmer: [worker(ranger), worker(mage)],
    inventar: [inventoryEvidence(ranger, 4), inventoryEvidence(mage, 6)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(team.status, "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE");

  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team,
    merchant,
    quellen: [source(ranger, 4, 210), source(mage, 6, 210)],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);
  assert.equal(result.status, "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE");
  return result;
}

function settleTransfer(planung, beforeFp, beforeMenge, afterMenge, afterFp, observed) {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(planung.logistik.plan);
  ledger.beginneRendezvous(planung.logistik.plan.logistikId);
  ledger.bestaetigeRendezvous(
    planung.logistik.plan.logistikId,
    rendezvous(
      planung.logistik.plan.erstelltAmMs,
      planung.logistik.plan.zielFreshnessFingerprint,
    ),
  );
  ledger.beginneTransfer(planung.logistik.plan.logistikId);
  const evidence = {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: observed,
    inventoryFingerprint: afterFp,
    baselineInventoryFingerprint: beforeFp,
    mengen: [{ name: "iron", level: 0, menge: afterMenge }],
    settlementFingerprint: "settlement-" + afterFp,
  };
  const sicht = ledger.verifiziereSettlement(
    planung.logistik.plan.logistikId,
    evidence,
  );
  assert.equal(afterMenge - beforeMenge, planung.transfer.gesamtMenge);
  return { sicht, evidence };
}

async function allSettled() {
  const b = handoff();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(
    new MemorySpeicher(),
  );
  await controller.beginne(b, "merchant-before", 0, 220);

  const first = await controller.planeNaechstenTransfer(
    b,
    source(ranger, 4, 225),
    rendezvous(225, "merchant-rv-1"),
    230,
    1_000,
    100,
  );
  const firstSettlement = settleTransfer(
    first,
    "merchant-before",
    0,
    4,
    "merchant-after-ranger",
    250,
  );
  await controller.bestaetigeSettlement(
    b,
    firstSettlement.sicht,
    firstSettlement.evidence,
    250,
  );

  const second = await controller.planeNaechstenTransfer(
    b,
    source(mage, 6, 255),
    rendezvous(255, "merchant-rv-2"),
    260,
    1_000,
    100,
  );
  const secondSettlement = settleTransfer(
    second,
    "merchant-after-ranger",
    4,
    10,
    "merchant-after-all",
    280,
  );
  const done = await controller.bestaetigeSettlement(
    b,
    secondSettlement.sicht,
    secondSettlement.evidence,
    280,
  );
  assert.equal(done.zustand, "ALLE_SETTLED");
  return { handoff: b, batch: done };
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
      inputs: [{ name: "iron", level: 0, menge: 10 }],
      beobachtetAmMs: 300,
      gueltigBisMs: 1_500,
      sourceSnapshotCommit: "0123456789abcdef0123456789abcdef01234567",
      fingerprint: "recipe-sword-fp",
      ...(overrides.recipe ?? {}),
    },
    inventory: [{
      index: 3,
      name: "iron",
      level: 0,
      menge: 10,
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
      beobachtetAmMs: 300,
      gueltigBisMs: 1_500,
      fingerprint: "craft-service-fp",
    },
    maximalesEvidenceAlterMs: 1_000,
    ...overrides,
  };
}

test("CAP-022 Team-Rescan startet erst nach ALLE_SETTLED und bleibt NO-WRITE", async () => {
  const state = await allSettled();
  const result = pruefeProductionMaterialTeamCraftRescan({
    schemaVersion: 1,
    handoff: state.handoff,
    batch: state.batch,
    merchantInventoryFingerprint: "merchant-after-all",
    merchantInventoryBeobachtetAmMs: 300,
    merchantInventoryGueltigBisMs: 1_500,
    craftPreflight: craftPreflight(),
    maximalesEvidenceAlterMs: 1_000,
  }, 320);

  assert.equal(result.status, "TEAM_CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE");
  assert.equal(result.allSettledVerified, true);
  assert.equal(result.allTransferIdsSettledInOrder, true);
  assert.equal(result.noActiveTransferVerified, true);
  assert.equal(result.finalMerchantBaselineVerified, true);
  assert.equal(result.postSettlementInventoryVerified, true);
  assert.equal(result.handedMaterialMatchesRecipeInput, true);
  assert.equal(result.candidateObserved, true);
  assert.equal(result.preflight.status, "BEREIT_NO_WRITE");
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

test("CAP-022 Team-Rescan blockiert vor dem letzten Settlement", async () => {
  const b = handoff();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(
    new MemorySpeicher(),
  );
  const partial = await controller.beginne(b, "merchant-before", 0, 220);

  assert.throws(
    () => pruefeProductionMaterialTeamCraftRescan({
      schemaVersion: 1,
      handoff: b,
      batch: partial,
      merchantInventoryFingerprint: "merchant-before",
      merchantInventoryBeobachtetAmMs: 230,
      merchantInventoryGueltigBisMs: 1_500,
      craftPreflight: craftPreflight(),
      maximalesEvidenceAlterMs: 1_000,
    }, 240),
    /CAP022_TEAM_CRAFT_RESCAN_BATCH_NICHT_ALL_SETTLED/,
  );
});

test("CAP-022 Team-Rescan verlangt finalen frischen Merchant-Fingerprint", async () => {
  const state = await allSettled();
  assert.throws(
    () => pruefeProductionMaterialTeamCraftRescan({
      schemaVersion: 1,
      handoff: state.handoff,
      batch: state.batch,
      merchantInventoryFingerprint: "merchant-other",
      merchantInventoryBeobachtetAmMs: 300,
      merchantInventoryGueltigBisMs: 1_500,
      craftPreflight: craftPreflight(),
      maximalesEvidenceAlterMs: 1_000,
    }, 320),
    /CAP022_TEAM_CRAFT_RESCAN_POST_SETTLEMENT_INVENTAR_STALE_ODER_DRIFT/,
  );
});

test("CAP-022 Team-Rescan verlangt Batchmaterial als NORMAL-Rezeptinput", async () => {
  const state = await allSettled();
  assert.throws(
    () => pruefeProductionMaterialTeamCraftRescan({
      schemaVersion: 1,
      handoff: state.handoff,
      batch: state.batch,
      merchantInventoryFingerprint: "merchant-after-all",
      merchantInventoryBeobachtetAmMs: 300,
      merchantInventoryGueltigBisMs: 1_500,
      craftPreflight: craftPreflight({
        recipe: {
          inputs: [{ name: "wood", level: 0, menge: 10 }],
        },
      }),
      maximalesEvidenceAlterMs: 1_000,
    }, 320),
    /CAP022_TEAM_CRAFT_RESCAN_BATCH_MATERIAL_NICHT_RECIPE_INPUT/,
  );
});

test("CAP-022 Team-Rescan kann read-only blockieren ohne Authority zu oeffnen", async () => {
  const state = await allSettled();
  const result = pruefeProductionMaterialTeamCraftRescan({
    schemaVersion: 1,
    handoff: state.handoff,
    batch: state.batch,
    merchantInventoryFingerprint: "merchant-after-all",
    merchantInventoryBeobachtetAmMs: 300,
    merchantInventoryGueltigBisMs: 1_500,
    craftPreflight: craftPreflight({
      inventory: [{
        index: 3,
        name: "iron",
        level: 0,
        menge: 9,
        locked: false,
        blocked: false,
        valueProtected: false,
        fingerprint: "merchant-iron-slot-3-fp",
      }],
    }),
    maximalesEvidenceAlterMs: 1_000,
  }, 320);

  assert.equal(result.status, "TEAM_CRAFT_RESCAN_BLOCKIERT");
  assert.equal(result.candidateObserved, false);
  assert.ok(result.blocker.some(x =>
    x.startsWith("PR20_9_CRAFT_INPUT_FEHLT_ODER_SPLIT_STACK_ERFORDERLICH:")));
  assert.equal(result.craftAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
});

test("CAP-022 Team-Craft-Rescan besitzt keinen direkten Gameplay-Write-Bypass", () => {
  const sourceText = fs.readFileSync(
    "grundlage/quelle/koordination/production-material-team-craft-rescan.ts",
    "utf8",
  );
  for (const marker of [
    "socket.emit(",
    ".socket.emit(",
    "send_item(",
    "send_cm(",
    "smart_move(",
    "attack(",
    "use_skill(",
    "loot(",
    "craft(",
    "exchange(",
    "upgrade(",
    "compound(",
  ]) {
    assert.equal(sourceText.includes(marker), false, marker);
  }
});


test("CAP-022 Team-Rescan-Vertrag und Roadmap halten PR20.9 fail-closed", () => {
  const contract = JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-23-production-material-team-craft-rescan-foundation.json",
    "utf8",
  ));
  assert.equal(contract.status, "PREPARED_NO_WRITE");
  assert.equal(contract.triggerRequirements.batchState, "ALLE_SETTLED");
  assert.equal(contract.triggerRequirements.allTransferIdsSettledInOrder, true);
  assert.equal(contract.triggerRequirements.activeTransferMustBeNull, true);
  assert.equal(contract.triggerRequirements.freshPostSettlementMerchantInventoryRequired, true);
  assert.equal(contract.triggerRequirements.batchMaterialMustMatchNormalRecipeInput, true);
  assert.equal(contract.safetyBoundary.currentPr20_9RatificationCredit, false);
  assert.equal(contract.safetyBoundary.foundationCountsAsCraftRatification, false);
  assert.equal(contract.safetyBoundary.productiveCraftAuthorityOpened, false);
  assert.equal(contract.safetyBoundary.gameplayWrites, 0);
  assert.equal(contract.safetyBoundary.publicFunctionCalls, 0);
  assert.equal(contract.safetyBoundary.rawWriteCalls, 0);
  assert.equal(contract.safetyBoundary.craftAuthority, false);
  assert.equal(contract.safetyBoundary.normalRuntimeAllowed, false);
  assert.equal(
    contract.currentGateBoundary.syntheticOrPlannedAllSettledMayNotRatifyPr20_9,
    true,
  );

  const roadmap = JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  assert.equal(
    roadmap.pr20_9.status,
    "MANUAL_OVERRIDE_BESTANDEN_FOR_DEVELOPMENT",
  );
  assert.equal(
    roadmap.pr20_9.craftDurableShadowRunner.candidateAcquisitionOrMutationAllowed,
    false,
  );
  const bridge =
    roadmap.pr20_9.deferredAutomaticMaterialRecheck.teamAllSettledCraftRescan;
  assert.equal(bridge.status, "PREPARED_NO_WRITE");
  assert.equal(bridge.allTransferIdsSettledInOrderRequired, true);
  assert.equal(bridge.noActiveTransferRequired, true);
  assert.equal(bridge.currentPr20_9RatificationCredit, false);
  assert.equal(bridge.foundationCountsAsCraftRatification, false);
  assert.equal(bridge.productiveCraftAuthorityOpened, false);
  assert.equal(bridge.craftAuthority, false);
  assert.equal(bridge.normalRuntimeAllowed, false);
});
