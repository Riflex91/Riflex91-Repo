import test from "node:test";
import assert from "node:assert/strict";

import {
  MerchantLogistikLedger,
  bewerteProductionMaterialTeamHandoffRecovery,
  planeNaechstenProductionMaterialTeamTransfer,
  planeProductionMaterialTeam,
  planeProductionMaterialTeamHandoff,
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

function ziel() {
  return {
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
  };
}

function worker(farmer) {
  return {
    schemaVersion: 1,
    farmer,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_500,
    freshnessFingerprint: "fresh-" + farmer.characterId,
    lifecycleAktiv: true,
    safetyBereit: true,
    movementVorbereitet: true,
    combatVorbereitet: true,
    lootVorbereitet: true,
    unterstuetzteSourceIds: ["farm-iron-bee"],
  };
}

function inventory(farmer, menge) {
  return {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_500,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
  };
}

function source(farmer, menge, overrides = {}) {
  return {
    schemaVersion: 1,
    quelle: farmer,
    beobachtetAmMs: 210,
    gueltigBisMs: 1_500,
    freshnessFingerprint: "source-fresh-" + farmer.characterId,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
    posten: [{
      physischeKennung: "slot:7",
      name: "iron",
      level: 0,
      menge,
      itemFingerprint: "item-" + farmer.characterId + "-slot-7",
    }],
    ...overrides,
  };
}

function batch() {
  const team = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(ranger), worker(mage)],
    inventar: [inventory(ranger, 4), inventory(mage, 6)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(team.status, "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE");

  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team,
    merchant,
    quellen: [source(ranger, 4), source(mage, 6)],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);
  assert.equal(result.status, "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE");
  return result;
}

function rendezvous(observedAt = 230) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: observedAt,
    distanz: 20,
    freshnessFingerprint: "merchant-rendezvous-" + observedAt,
  };
}

function materializeRequest(batchPlan, views, quelle, baselineFingerprint, baselineMenge, observedAt) {
  return {
    schemaVersion: 1,
    batch: batchPlan,
    logistikSicht: views,
    quelleEvidence: quelle,
    merchantRendezvousEvidence: rendezvous(observedAt),
    baselineMerchantInventoryFingerprint: baselineFingerprint,
    baselineMerchantMenge: baselineMenge,
    erstelltAmMs: observedAt,
    gueltigBisMs: 1_400,
    maximalTransferDistanz: 100,
    maximalesEvidenceAlterMs: 1_000,
  };
}

function settle(ledger, planung, beforeFingerprint, afterFingerprint, baselineMenge, finalMenge, observedAt) {
  const id = planung.logistik.plan.logistikId;
  ledger.plane(planung.logistik.plan);
  ledger.beginneRendezvous(id);
  ledger.bestaetigeRendezvous(id, {
    ...rendezvous(observedAt - 20),
    freshnessFingerprint: planung.logistik.plan.zielFreshnessFingerprint,
  });
  ledger.beginneTransfer(id);
  return ledger.verifiziereSettlement(id, {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: observedAt,
    inventoryFingerprint: afterFingerprint,
    baselineInventoryFingerprint: beforeFingerprint,
    mengen: [{ name: "iron", level: 0, menge: finalMenge }],
    settlementFingerprint: "settlement-" + id,
  });
}

test("CAP-022 Batch-Recovery gibt initial nur Transfer 1 frei", () => {
  const plan = batch();
  const recovery = bewerteProductionMaterialTeamHandoffRecovery(plan, []);

  assert.equal(recovery.status, "NAECHSTER_TRANSFER_BEREIT_NO_WRITE");
  assert.deepEqual(recovery.settledSequences, []);
  assert.equal(recovery.activeSequence, null);
  assert.equal(recovery.nextSequence, 1);
  assert.equal(recovery.nextTransferId, plan.transfers[0].transferId);
  assert.equal(recovery.allPreviousSettled, true);
  assert.equal(recovery.nextTransferPlanningAllowed, true);
  assert.equal(recovery.finalCraftRescanEligible, false);
  assert.equal(recovery.sameTransferRetryAllowed, false);
  assert.equal(recovery.transferAuthority, false);
  assert.equal(recovery.gameplayAuthority, false);
  assert.equal(recovery.rawWriteAuthority, false);
});

test("CAP-022 materialisiert Transfer 2 erst nach Settlement von Transfer 1 mit neuer Baseline", () => {
  const plan = batch();
  const ledger = new MerchantLogistikLedger();

  const first = planeNaechstenProductionMaterialTeamTransfer(
    materializeRequest(
      plan,
      ledger.snapshot(),
      source(ranger, 4),
      "merchant-before-1",
      0,
      240,
    ),
    240,
  );
  assert.equal(first.sequence, 1);
  assert.equal(first.logistik.plan.art, "COLLECTION");
  assert.equal(first.logistik.plan.posten[0].baselineEmpfaengerMenge, 0);
  assert.equal(first.freshMerchantBaselineBound, true);
  assert.equal(first.previousTransfersSettled, true);
  assert.equal(first.transferAuthority, false);

  settle(
    ledger,
    first,
    "merchant-before-1",
    "merchant-after-1",
    0,
    4,
    300,
  );

  const afterFirst = bewerteProductionMaterialTeamHandoffRecovery(
    plan,
    ledger.snapshot(),
  );
  assert.equal(afterFirst.status, "NAECHSTER_TRANSFER_BEREIT_NO_WRITE");
  assert.deepEqual(afterFirst.settledSequences, [1]);
  assert.equal(afterFirst.nextSequence, 2);

  const second = planeNaechstenProductionMaterialTeamTransfer(
    materializeRequest(
      plan,
      ledger.snapshot(),
      source(mage, 6),
      "merchant-after-1",
      4,
      320,
    ),
    320,
  );
  assert.equal(second.sequence, 2);
  assert.equal(second.logistik.plan.posten[0].baselineEmpfaengerMenge, 4);
  assert.equal(
    second.logistik.plan.baselineEmpfaengerInventoryFingerprint,
    "merchant-after-1",
  );

  settle(
    ledger,
    second,
    "merchant-after-1",
    "merchant-after-2",
    4,
    10,
    380,
  );

  const complete = bewerteProductionMaterialTeamHandoffRecovery(
    plan,
    ledger.snapshot(),
  );
  assert.equal(complete.status, "BATCH_SETTLED_NO_WRITE");
  assert.deepEqual(complete.settledSequences, [1, 2]);
  assert.equal(complete.nextSequence, null);
  assert.equal(complete.finalCraftRescanEligible, true);
  assert.equal(complete.nextTransferPlanningAllowed, false);
  assert.equal(complete.transferAuthority, false);
});

test("CAP-022 Batch-Recovery blockiert bei RECOVERY_PENDING und gibt Transfer 2 nicht frei", () => {
  const plan = batch();
  const first = planeNaechstenProductionMaterialTeamTransfer(
    materializeRequest(
      plan,
      [],
      source(ranger, 4),
      "merchant-before-1",
      0,
      240,
    ),
    240,
  );

  const alt = new MerchantLogistikLedger();
  alt.plane(first.logistik.plan);
  alt.beginneRendezvous(first.transferId);

  const neu = new MerchantLogistikLedger();
  neu.importiereNachRestart(alt.snapshot());
  const recovery = bewerteProductionMaterialTeamHandoffRecovery(
    plan,
    neu.snapshot(),
  );

  assert.equal(recovery.status, "TRANSFER_IN_FLIGHT_ODER_RECOVERY_NO_WRITE");
  assert.equal(recovery.activeSequence, 1);
  assert.equal(recovery.activeRecoveryPending, true);
  assert.equal(recovery.nextSequence, null);
  assert.equal(recovery.nextTransferPlanningAllowed, false);
  assert.equal(recovery.finalCraftRescanEligible, false);
  assert.equal(recovery.sameTransferRetryAllowed, false);
});

test("CAP-022 Batch-Recovery erkennt spaeteren Transfer ohne Settlement-Vorgaenger", () => {
  const plan = batch();
  const ledger = new MerchantLogistikLedger();

  const first = planeNaechstenProductionMaterialTeamTransfer(
    materializeRequest(
      plan,
      [],
      source(ranger, 4),
      "merchant-before-1",
      0,
      240,
    ),
    240,
  );
  settle(
    ledger,
    first,
    "merchant-before-1",
    "merchant-after-1",
    0,
    4,
    300,
  );
  const second = planeNaechstenProductionMaterialTeamTransfer(
    materializeRequest(
      plan,
      ledger.snapshot(),
      source(mage, 6),
      "merchant-after-1",
      4,
      320,
    ),
    320,
  );

  const nurZweiter = new MerchantLogistikLedger();
  nurZweiter.plane(second.logistik.plan);
  const recovery = bewerteProductionMaterialTeamHandoffRecovery(
    plan,
    nurZweiter.snapshot(),
  );

  assert.equal(recovery.status, "BLOCKIERT");
  assert.ok(recovery.blocker.some(x =>
    x.startsWith("CAP022_BATCH_RECOVERY_SPAETERER_TRANSFER_VOR_VORHERIGEM:")));
  assert.equal(recovery.nextTransferPlanningAllowed, false);
});

test("CAP-022 materialisiert keinen Transfer bei Source-Pin-Drift", () => {
  const plan = batch();
  assert.throws(
    () => planeNaechstenProductionMaterialTeamTransfer(
      materializeRequest(
        plan,
        [],
        source(ranger, 4, {
          inventoryFingerprint: "drifted-inventory",
        }),
        "merchant-before-1",
        0,
        240,
      ),
      240,
    ),
    /CAP022_BATCH_TRANSFER_QUELLE_DRIFT/,
  );
});
