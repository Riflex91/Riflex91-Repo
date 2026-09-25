import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  planeProductionMaterialTeam,
} from "../../erzeugt/index.js";

const anchorFarmer = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "ranger",
  sessionId: "ranger-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

function binding(characterId, sessionId = characterId + "-session") {
  return Object.freeze({
    schemaVersion: 1,
    accountId: "account-1",
    characterId,
    sessionId,
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    rosterFingerprint: "roster-fp",
  });
}

function ziel(overrides = {}) {
  return {
    schemaVersion: 1,
    objectiveId: "prod-1:material:farm:1",
    produktionsId: "prod-1",
    ablaufId: "workflow-1",
    farmNodeId: "farm:1",
    farmer: anchorFarmer,
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
    ...overrides,
  };
}

function worker(farmer, overrides = {}) {
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
    ...overrides,
  };
}

function inventory(farmer, menge, overrides = {}) {
  return {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_500,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
    ...overrides,
  };
}

test("CAP-022 verteilt Restmenge bounded auf mehrere Farmer desselben Production-Objectives", () => {
  const mage = binding("mage");
  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [
      worker(mage),
      worker(anchorFarmer),
    ],
    inventar: [
      inventory(anchorFarmer, 2),
      inventory(mage, 3),
    ],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(result.status, "TEAM_FARM_REQUIRED_NO_WRITE");
  assert.equal(result.objectiveId, "prod-1:material:farm:1");
  assert.equal(result.heldByFarmers, 5);
  assert.equal(result.remainingToFarm, 5);
  assert.equal(result.zuteilungen.length, 2);
  assert.deepEqual(
    result.zuteilungen.map(x => x.farmer.characterId),
    ["ranger", "mage"],
  );
  assert.deepEqual(
    result.zuteilungen.map(x => x.farmRestZuteilung),
    [3, 2],
  );
  assert.ok(result.zuteilungen.every(
    x => x.objectiveId === result.objectiveId
      && x.sameProductionObjective === true,
  ));
  assert.equal(result.allWorkersSameProductionObjective, true);
  assert.equal(result.splitAcrossProductionObjectives, false);
  assert.equal(result.farmStopRequired, false);
  assert.equal(result.handoffBatchRequired, false);
  assert.equal(result.productiveExecutionAllowed, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.rawWriteAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
});

test("CAP-022 stoppt alle Farmer sobald aggregierte Materialmenge erreicht ist", () => {
  const mage = binding("mage");
  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(anchorFarmer), worker(mage)],
    inventar: [inventory(anchorFarmer, 4), inventory(mage, 6)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(result.status, "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE");
  assert.equal(result.heldByFarmers, 10);
  assert.equal(result.remainingToFarm, 0);
  assert.equal(result.farmStopRequired, true);
  assert.equal(result.handoffBatchRequired, true);
  assert.ok(result.zuteilungen.every(x => x.farmRestZuteilung === 0));
  assert.ok(result.zuteilungen.every(x => x.movementAuthority === false));
  assert.ok(result.zuteilungen.every(x => x.combatAuthority === false));
  assert.ok(result.zuteilungen.every(x => x.lootAuthority === false));
});

test("CAP-022 verlangt den urspruenglich gebundenen Anchor-Farmer frisch im Team", () => {
  const mage = binding("mage");
  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [
      worker(anchorFarmer, { gueltigBisMs: 150 }),
      worker(mage),
    ],
    inventar: [
      inventory(anchorFarmer, 2),
      inventory(mage, 8),
    ],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(result.status, "BLOCKIERT");
  assert.ok(result.blocker.includes("CAP022_TEAM_ANCHOR_FARMER_FEHLT_ODER_STALE"));
  assert.equal(result.farmStopRequired, false);
  assert.equal(result.handoffBatchRequired, false);
  assert.equal(result.productiveExecutionAllowed, false);
});

test("CAP-022 bindet nur Farmer desselben Accounts und Servers an dasselbe Objective", () => {
  const mage = binding("mage");
  const fremd = Object.freeze({
    ...binding("priest"),
    accountId: "account-2",
  });

  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [
      worker(anchorFarmer),
      worker(mage),
      worker(fremd),
    ],
    inventar: [
      inventory(anchorFarmer, 2),
      inventory(mage, 3),
      inventory(fremd, 100),
    ],
    maximaleFarmer: 8,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(result.status, "TEAM_FARM_REQUIRED_NO_WRITE");
  assert.equal(result.heldByFarmers, 5);
  assert.deepEqual(
    result.zuteilungen.map(x => x.farmer.characterId),
    ["ranger", "mage"],
  );
  assert.equal(
    result.zuteilungen.some(x => x.farmer.characterId === "priest"),
    false,
  );
});

test("CAP-022 Teamwahl ist bounded und deterministisch mit Anchor zuerst", () => {
  const mage = binding("mage");
  const priest = binding("priest");
  const warrior = binding("warrior");

  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel({ menge: 20 }),
    farmer: [
      worker(warrior),
      worker(priest),
      worker(mage),
      worker(anchorFarmer),
    ],
    inventar: [
      inventory(warrior, 1),
      inventory(priest, 1),
      inventory(mage, 1),
      inventory(anchorFarmer, 1),
    ],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.deepEqual(
    result.zuteilungen.map(x => x.farmer.characterId),
    ["ranger", "mage", "priest"],
  );
  assert.equal(result.zuteilungen.length, 3);
  assert.equal(result.heldByFarmers, 3);
  assert.equal(result.remainingToFarm, 17);
  assert.deepEqual(
    result.zuteilungen.map(x => x.farmRestZuteilung),
    [6, 6, 5],
  );
});

test("CAP-022 Team blockiert wenn fuer einen ausgewaehlten Farmer frische Inventory-Evidence fehlt", () => {
  const mage = binding("mage");
  const result = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(anchorFarmer), worker(mage)],
    inventar: [inventory(anchorFarmer, 2)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(result.status, "BLOCKIERT");
  assert.ok(result.blocker.includes(
    "CAP022_TEAM_INVENTAR_FEHLT_ODER_STALE:mage",
  ));
  assert.equal(result.productiveExecutionAllowed, false);
});


test("CAP-022 Team-Vertrag und Roadmap halten Multi-Farmer-Ausfuehrung fail-closed", () => {
  const contract = JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-23-production-material-team-objective-foundation.json",
    "utf8",
  ));
  assert.equal(contract.status, "PREPARED_NO_WRITE");
  assert.equal(contract.historicalInvariant.allFarmersRemainOnOneProductionObjective, true);
  assert.equal(contract.historicalInvariant.aggregateFarmerHeldMaterial, true);
  assert.equal(contract.historicalInvariant.farmStopWhenAggregateReady, true);
  assert.equal(contract.planning.allWorkersSameProductionObjective, true);
  assert.equal(contract.planning.splitAcrossProductionObjectives, false);
  assert.equal(contract.readyBoundary.handoffBatchRequired, true);
  assert.equal(contract.readyBoundary.singleFarmerHandoffDoesNotCoverMultiFarmerBatch, true);
  assert.equal(contract.safetyBoundary.productiveExecutionAllowed, false);
  assert.equal(contract.safetyBoundary.movementAuthority, false);
  assert.equal(contract.safetyBoundary.combatAuthority, false);
  assert.equal(contract.safetyBoundary.lootAuthority, false);
  assert.equal(contract.safetyBoundary.gameplayAuthority, false);
  assert.equal(contract.safetyBoundary.rawWriteAuthority, false);
  assert.equal(contract.safetyBoundary.normalRuntimeAllowed, false);
  assert.equal(contract.safetyBoundary.currentPr20_9RatificationCredit, false);
  assert.equal(contract.safetyBoundary.candidateAcquisitionOrMutationAllowedNow, false);

  const roadmap = JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  assert.equal(
    roadmap.pr20_9.status,
    "CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE",
  );
  assert.equal(
    roadmap.pr20_9.craftDurableShadowRunner.candidateAcquisitionOrMutationAllowed,
    false,
  );
  const team =
    roadmap.pr20_9.deferredAutomaticMaterialRecheck.teamMaterialObjectiveFoundation;
  assert.equal(team.status, "PREPARED_NO_WRITE");
  assert.equal(team.allWorkersSameProductionObjective, true);
  assert.equal(team.splitAcrossProductionObjectives, false);
  assert.equal(team.farmStopWhenAggregateReady, true);
  assert.equal(team.multiSourceCollectionHandoffRequiredAfterAggregateReady, true);
  assert.equal(team.productiveExecutionAllowed, false);
  assert.equal(team.gameplayAuthority, false);
  assert.equal(team.normalRuntimeAllowed, false);
});

test("CAP-022 Team-Foundation besitzt keinen direkten Gameplay-Write-Bypass", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/koordination/production-material-team-coordination.ts",
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
    assert.equal(source.includes(marker), false, marker);
  }
});
