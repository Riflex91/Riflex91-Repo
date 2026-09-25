import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  pruefePr208SeashellFarmShadowAdmission,
} from "../../erzeugt/index.js";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-seashell-farm-shadow.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

function request(overrides={}){
  return {
    schemaVersion:1,
    characterId:"My_Ranger1",
    ctype:"ranger",
    sessionFresh:true,
    serverMatchesEvidence:true,
    rosterFresh:true,
    lifecycleActive:true,
    restartReconciled:true,
    safetyPreempted:false,
    movementOwnershipFresh:true,
    arrivalEvidenceFresh:true,
    targetOwnershipFresh:true,
    targetEvidenceFresh:true,
    equipmentEvidenceFresh:true,
    conditionEvidenceFresh:true,
    lootEvidenceFresh:true,
    inventoryCapacityAvailable:true,
    targetMonster:"croc",
    currentSeashellQuantity:0,
    requiredSeashellQuantity:20,
    hp:1000,
    maxHp:1000,
    ...overrides,
  };
}

test("safe worker snapshot is ready only for a read-only shadow runner",()=>{
  const result=pruefePr208SeashellFarmShadowAdmission(request());
  assert.equal(result.status,"READY_NO_WRITE");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.target.itemName,"seashell");
  assert.equal(result.target.monster,"croc");
  assert.equal(result.target.requiredQuantity,20);
  assert.equal(result.target.currentQuantity,0);
  assert.equal(result.target.remainingQuantity,20);
  assert.equal(result.movementAuthority,false);
  assert.equal(result.combatAuthority,false);
  assert.equal(result.skillAuthority,false);
  assert.equal(result.lootAuthority,false);
  assert.equal(result.farmAuthority,false);
  assert.equal(result.exchangeAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.publicFunctionCalls,0);
  assert.equal(result.rawWriteCalls,0);
  assert.equal(result.sameIntentRetry,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_RUNNER_READ_ONLY");
});

test("merchant cannot become the Seashell farm worker",()=>{
  const result=pruefePr208SeashellFarmShadowAdmission(request({
    characterId:"My_Merchant",
    ctype:"merchant",
  }));
  assert.equal(result.status,"BLOCKED");
  assert.ok(result.blocker.includes("PR20_8_SEASHELL_SHADOW_MERCHANT_KEIN_FARM_WORKER"));
  assert.equal(result.farmAuthority,false);
});

test("stale target, loot, movement or capacity evidence fails closed",()=>{
  const result=pruefePr208SeashellFarmShadowAdmission(request({
    movementOwnershipFresh:false,
    targetEvidenceFresh:false,
    lootEvidenceFresh:false,
    inventoryCapacityAvailable:false,
  }));
  assert.equal(result.status,"BLOCKED");
  assert.ok(result.blocker.includes("PR20_8_SEASHELL_SHADOW_MOVEMENT_OWNER_STALE"));
  assert.ok(result.blocker.includes("PR20_8_SEASHELL_SHADOW_TARGET_EVIDENCE_STALE"));
  assert.ok(result.blocker.includes("PR20_8_SEASHELL_SHADOW_LOOT_EVIDENCE_STALE"));
  assert.ok(result.blocker.includes("PR20_8_SEASHELL_SHADOW_INVENTORY_CAPACITY_FEHLT"));
});

test("HP hard cap remains conservative in shadow admission",()=>{
  const result=pruefePr208SeashellFarmShadowAdmission(request({
    hp:799,
    maxHp:1000,
  }));
  assert.equal(result.status,"BLOCKED");
  assert.ok(result.blocker.includes("PR20_8_SEASHELL_SHADOW_HP_HARD_CAP"));
});

test("already having twenty Seashells skips farm preparation and returns to scanner",()=>{
  const result=pruefePr208SeashellFarmShadowAdmission(request({
    currentSeashellQuantity:20,
    inventoryCapacityAvailable:false,
    movementOwnershipFresh:false,
    arrivalEvidenceFresh:false,
    targetOwnershipFresh:false,
    targetEvidenceFresh:false,
    equipmentEvidenceFresh:false,
    conditionEvidenceFresh:false,
    lootEvidenceFresh:false,
    hp:1,
    maxHp:1000,
  }));
  assert.equal(result.status,"ALREADY_SATISFIED_NO_WRITE");
  assert.equal(result.target.remainingQuantity,0);
  assert.equal(result.nextAction,"PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE");
  assert.equal(result.farmAuthority,false);
  assert.equal(result.exchangeAuthority,false);
});

test("wrong monster or quantity blocks the shadow path",()=>{
  const monster=pruefePr208SeashellFarmShadowAdmission(request({targetMonster:"crab"}));
  assert.equal(monster.status,"BLOCKED");
  assert.ok(monster.blocker.includes("PR20_8_SEASHELL_SHADOW_TARGET_DRIFT"));

  const quantity=pruefePr208SeashellFarmShadowAdmission(request({requiredSeashellQuantity:19}));
  assert.equal(quantity.status,"BLOCKED");
  assert.ok(quantity.blocker.includes("PR20_8_SEASHELL_SHADOW_TARGET_DRIFT"));
});

test("shadow contract remains strictly no-write and has no runner cutover",()=>{
  assert.equal(contract.status,"ADMISSION_PREPARED_NO_WRITE");
  assert.equal(contract.prerequisite.targetItem,"seashell");
  assert.equal(contract.prerequisite.requiredQuantity,20);
  assert.equal(contract.prerequisite.sourceMonster,"croc");
  assert.equal(contract.admission.characterAgnostic,true);
  assert.equal(contract.admission.merchantAsFarmWorkerAllowed,false);
  assert.equal(contract.admission.minimumHpRatio,0.8);
  assert.equal(contract.noWriteBoundary.movementAuthority,false);
  assert.equal(contract.noWriteBoundary.combatAuthority,false);
  assert.equal(contract.noWriteBoundary.skillAuthority,false);
  assert.equal(contract.noWriteBoundary.lootAuthority,false);
  assert.equal(contract.noWriteBoundary.farmAuthority,false);
  assert.equal(contract.noWriteBoundary.exchangeAuthority,false);
  assert.equal(contract.noWriteBoundary.maximumGameplayWrites,0);
  assert.equal(contract.noWriteBoundary.maximumPublicFunctionCalls,0);
  assert.equal(contract.noWriteBoundary.maximumRawWriteCalls,0);
  assert.equal(contract.futureRunnerBoundary.runnerPrepared,false);
  assert.equal(contract.futureRunnerBoundary.manifestCutoverPrepared,false);
  assert.equal(contract.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_RUNNER_READ_ONLY");
});

test("roadmap advances only to read-only shadow-runner preparation",()=>{
  assert.equal(
    roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_SERVICE_MOUNT_MANIFEST_CUTOVER_PREPARED",
  );
  assert.equal(
    roadmap.pr20_8.nextAction,
    "PREPARE_SEASHELL_FARM_SHADOW_RUNNER_READ_ONLY",
  );
  const shadow=roadmap.pr20_8.exchangeCandidateAcquisition.seashellFarmShadow;
  assert.equal(shadow.status,"COORDINATOR_PREPARED_READ_ONLY");
  assert.equal(shadow.coordinatorPrepared,true);
  assert.equal(shadow.coordinatorTestId,"pr20-8-seashell-farm-shadow-coordinator-readonly");
  assert.equal(shadow.coordinatorControllerVersion,"1.0.0");
  assert.equal(shadow.coordinatorExpectedGlobal,"V5PR208SeashellFarmShadowCoordinatorReadonly");
  assert.equal(shadow.coordinatorCharacter,"My_Merchant");
  assert.equal(shadow.coordinatorClass,"merchant");
  assert.equal(shadow.coordinatorPackagePinDeferredUntilManifestCutover,true);
  assert.equal(shadow.runnerPrepared,true);
  assert.equal(shadow.runnerTestId,"pr20-8-seashell-farm-shadow-readonly");
  assert.equal(shadow.runnerControllerVersion,"1.0.0");
  assert.equal(shadow.runnerExpectedGlobal,"V5PR208SeashellFarmShadowReadonly");
  assert.equal(shadow.runnerLocalFarmerOnly,true);
  assert.equal(shadow.packagePinDeferredUntilManifestCutover,true);
  assert.equal(shadow.alreadySatisfiedNextAction,"PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE");
  assert.equal(shadow.manifestCutoverPrepared,false);
  assert.equal(shadow.farmAuthority,false);
  assert.equal(shadow.exchangeAuthority,false);
  assert.equal(shadow.normalRuntimeAllowed,false);
  assert.equal(shadow.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_COORDINATOR_MANIFEST_CUTOVER");

  const row=roadmap.parallelPreparations.find(x=>x.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(row);
  assert.equal(row.status,"EXCHANGE_ANNIVERSARYGIFT_SERVICE_MOUNT_MANIFEST_CUTOVER_PREPARED");
  assert.equal(row.nextAction,"DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_SERVICE_MOUNT");
  assert.equal(row.gameplayAuthority,false);
  assert.equal(row.rawWriteAuthority,false);
  assert.equal(row.normalRuntimeAllowed,false);
});
