import test from "node:test";
import assert from "node:assert/strict";

import {
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

function readyTeam() {
  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(ranger), worker(mage)],
    inventar: [inventory(ranger, 4), inventory(mage, 6)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(result.status, "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE");
  return result;
}

function quelle(farmer, menge, overrides = {}) {
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

test("CAP-022 plant Aggregate-READY als sequenziellen Multi-Source-COLLECTION-Batch", () => {
  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team: readyTeam(),
    merchant,
    quellen: [
      quelle(ranger, 4),
      quelle(mage, 6),
    ],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);

  assert.equal(result.status, "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE");
  assert.equal(result.requiredQuantity, 10);
  assert.equal(result.pinnedQuantity, 10);
  assert.equal(result.transfers.length, 2);
  assert.deepEqual(
    result.transfers.map(x => x.quelle.characterId),
    ["ranger", "mage"],
  );
  assert.deepEqual(
    result.transfers.map(x => x.gesamtMenge),
    [4, 6],
  );
  assert.deepEqual(
    result.transfers.map(x => x.sequence),
    [1, 2],
  );
  assert.equal(result.transfers[0].previousTransferSettlementRequired, false);
  assert.equal(result.transfers[1].previousTransferSettlementRequired, true);
  assert.equal(
    result.transfers[0].posten[0].physischeKennung,
    "slot:7",
  );
  assert.equal(
    result.transfers[1].posten[0].physischeKennung,
    "slot:7",
  );
  assert.equal(result.transfers[0].sameProductionObjective, true);
  assert.equal(result.transfers[1].sameProductionObjective, true);
  assert.equal(result.allSourcesSameProductionObjective, true);
  assert.equal(result.aggregateReadyVerified, true);
  assert.equal(result.farmStopVerified, true);
  assert.equal(result.transferSequenceFixed, true);
  assert.equal(result.parallelTransferAllowed, false);
  assert.equal(result.eachTransferMustSettleBeforeNext, true);
  assert.equal(result.freshMerchantBaselineBeforeEachTransferRequired, true);
  assert.equal(result.freshMerchantRendezvousBeforeEachTransferRequired, true);
  assert.equal(result.finalCraftRescanOnlyAfterAllSettled, true);
  assert.equal(result.sameTransferRetryAllowed, false);
  assert.equal(result.currentPr20_9RatificationCredit, false);
  assert.equal(result.productiveExecutionAllowed, false);
  assert.equal(result.transferAuthority, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.rawWriteAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
  assert.ok(result.transfers.every(x => x.transferAuthority === false));
  assert.ok(result.transfers.every(x => x.gameplayAuthority === false));
  assert.ok(result.transfers.every(x => x.rawWriteAuthority === false));
});

test("CAP-022 Multi-Source-Handoff blockiert bei physischer Mengen-Drift", () => {
  const driftedMage = quelle(mage, 5, {
    inventoryFingerprint: "inventory-mage-6",
  });
  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team: readyTeam(),
    merchant,
    quellen: [
      quelle(ranger, 4),
      driftedMage,
    ],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);

  assert.equal(result.status, "BLOCKIERT");
  assert.ok(result.blocker.includes(
    "CAP022_TEAM_HANDOFF_MATERIALMENGE_DRIFT:mage",
  ));
  assert.ok(result.blocker.includes(
    "CAP022_TEAM_HANDOFF_AGGREGATE_PHYSISCHE_MENGE_FEHLT",
  ));
  assert.equal(result.productiveExecutionAllowed, false);
});

test("CAP-022 Multi-Source-Handoff blockiert Inventory-Fingerprint-Drift", () => {
  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team: readyTeam(),
    merchant,
    quellen: [
      quelle(ranger, 4, {
        inventoryFingerprint: "different-ranger-inventory-fp",
      }),
      quelle(mage, 6),
    ],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);

  assert.equal(result.status, "BLOCKIERT");
  assert.ok(result.blocker.includes(
    "CAP022_TEAM_HANDOFF_QUELLE_FEHLT_ODER_DRIFT:ranger",
  ));
  assert.equal(result.transferAuthority, false);
});

test("CAP-022 Multi-Source-Handoff akzeptiert nur Aggregate-READY-Team", () => {
  const farming = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(ranger), worker(mage)],
    inventar: [inventory(ranger, 2), inventory(mage, 3)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(farming.status, "TEAM_FARM_REQUIRED_NO_WRITE");

  assert.throws(
    () => planeProductionMaterialTeamHandoff({
      schemaVersion: 1,
      team: farming,
      merchant,
      quellen: [quelle(ranger, 2), quelle(mage, 3)],
      maximalesEvidenceAlterMs: 1_000,
    }, 220),
    /CAP022_TEAM_HANDOFF_TEAM_NICHT_READY_NO_WRITE/,
  );
});

test("CAP-022 Multi-Source-Handoff bindet alle Quellen an Merchant-Account und Server", () => {
  const falscherMerchant = Object.freeze({
    ...merchant,
    accountId: "other-account",
  });
  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team: readyTeam(),
    merchant: falscherMerchant,
    quellen: [quelle(ranger, 4), quelle(mage, 6)],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);

  assert.equal(result.status, "BLOCKIERT");
  assert.ok(result.blocker.some(x =>
    x.startsWith("CAP022_TEAM_HANDOFF_ZUTEILUNG_DRIFT:")));
  assert.equal(result.transfers.length, 0);
  assert.equal(result.transferAuthority, false);
});

test("CAP-022 Multi-Source-Handoff kann mehrere physische Stacks einer Quelle exakt pinnen", () => {
  const team = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(ranger)],
    inventar: [inventory(ranger, 10)],
    maximaleFarmer: 1,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(team.status, "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE");

  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team,
    merchant,
    quellen: [{
      schemaVersion: 1,
      quelle: ranger,
      beobachtetAmMs: 210,
      gueltigBisMs: 1_500,
      freshnessFingerprint: "source-fresh-ranger",
      inventoryFingerprint: "inventory-ranger-10",
      posten: [
        {
          physischeKennung: "slot:9",
          name: "iron",
          level: 0,
          menge: 6,
          itemFingerprint: "iron-slot-9",
        },
        {
          physischeKennung: "slot:4",
          name: "iron",
          level: 0,
          menge: 4,
          itemFingerprint: "iron-slot-4",
        },
      ],
    }],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);

  assert.equal(result.status, "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE");
  assert.equal(result.transfers.length, 1);
  assert.deepEqual(
    result.transfers[0].posten.map(x => x.physischeKennung),
    ["slot:4", "slot:9"],
  );
  assert.deepEqual(
    result.transfers[0].posten.map(x => x.menge),
    [4, 6],
  );
  assert.equal(result.pinnedQuantity, 10);
});
