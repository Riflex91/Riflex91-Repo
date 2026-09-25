import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  planePr208SeashellFarmPreparation,
} from "../../erzeugt/index.js";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-market-discovery-evidence.json","utf8"
));
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-seashell-farm-preparation.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

function request(overrides={}){
  return {
    schemaVersion:1,
    marketDiscovery:{
      notificationId:2673,
      status:"BLOCKIERT",
      blocker:["PR20_8_ACQUISITION_KEIN_MARKET_KANDIDAT"],
      eligibleListingCount:0,
      tradeBuyAuthority:false,
      farmAuthority:false,
      rawWriteCalls:0,
      sameIntentRetry:false,
      ...(overrides.marketDiscovery||{}),
    },
    item:{
      name:"seashell",
      exchangeQuantity:20,
      baseGold:800,
      questMarker:"seashell",
      cash:false,
      event:false,
      exclusive:false,
      specialProperty:false,
      ...(overrides.item||{}),
    },
    source:{
      monster:"croc",
      dropContainsTarget:true,
      ...(overrides.source||{}),
    },
  };
}

test("market discovery evidence ratifies only the no-candidate outcome",()=>{
  assert.equal(evidence.status,"RATIFIED_NO_ELIGIBLE_MARKET_CANDIDATE_ONE_MOVEMENT");
  assert.equal(evidence.manifestMainCommit,"e8744d77789ab9141dba04d5be561d11567f745a");
  assert.equal(evidence.notificationId,2673);
  assert.equal(evidence.runStartedAtMs,1790336636167);
  assert.equal(evidence.observedAtMs,1790336641774);
  assert.equal(evidence.terminalStatus,"BLOCKIERT");
  assert.deepEqual(evidence.blocker,["PR20_8_ACQUISITION_KEIN_MARKET_KANDIDAT"]);
  assert.equal(evidence.movement.target,"main");
  assert.equal(evidence.movement.issued,true);
  assert.equal(evidence.movement.completed,true);
  assert.equal(evidence.movement.gameplayWrites,1);
  assert.equal(evidence.movement.publicFunctionCalls,1);
  assert.equal(evidence.movement.rawWriteCalls,0);
  assert.equal(evidence.movement.sameIntentRetry,false);
  assert.equal(evidence.discovery.visibleSellerCount,13);
  assert.equal(evidence.discovery.eligibleListingCount,0);
  assert.equal(evidence.discovery.selected,null);
  assert.equal(evidence.observedAuthority.tradeBuy,false);
  assert.equal(evidence.observedAuthority.farm,false);
  assert.equal(evidence.policyAuthority.exchange,false);
  assert.equal(evidence.policyAuthority.normalRuntimeAllowed,false);
  assert.equal(evidence.evidenceSeparation.exchangeStillUnratified,true);
  assert.equal(evidence.nextAction,"PREPARE_SEASHELL_FARM_STAGE");
});

test("Seashell contract is preparation-only and grants no farm authority",()=>{
  assert.equal(contract.status,"PREPARED_NO_WRITE");
  assert.equal(contract.prerequisite.requiredNotificationId,2673);
  assert.equal(contract.prerequisite.requiredEligibleListingCount,0);
  assert.equal(contract.target.itemName,"seashell");
  assert.equal(contract.target.exchangeQuantity,20);
  assert.equal(contract.target.baseGold,800);
  assert.equal(contract.target.sourceMonster,"croc");
  assert.equal(contract.target.questMarker,"seashell");
  assert.equal(contract.target.scannerQuestBlockCondition,"BOOLEAN_TRUE_ONLY");
  assert.equal(contract.target.scannerCompatible,true);
  assert.equal(contract.sourceEvidence.anniversaryGiftAllowed,false);
  assert.equal(contract.sourceEvidence.playerMarketBuyAllowed,false);
  assert.equal(contract.sourceEvidence.npcBuyAllowed,false);
  assert.equal(contract.noWriteBoundary.movementAuthority,false);
  assert.equal(contract.noWriteBoundary.combatAuthority,false);
  assert.equal(contract.noWriteBoundary.skillAuthority,false);
  assert.equal(contract.noWriteBoundary.lootAuthority,false);
  assert.equal(contract.noWriteBoundary.farmAuthority,false);
  assert.equal(contract.noWriteBoundary.exchangeAuthority,false);
  assert.equal(contract.noWriteBoundary.gameplayAuthority,false);
  assert.equal(contract.noWriteBoundary.rawWriteAuthority,false);
  assert.equal(contract.noWriteBoundary.maximumGameplayWrites,0);
  assert.equal(contract.noWriteBoundary.maximumPublicFunctionCalls,0);
  assert.equal(contract.noWriteBoundary.maximumRawWriteCalls,0);
  assert.equal(contract.noWriteBoundary.sameIntentRetry,false);
  assert.equal(contract.noWriteBoundary.normalRuntimeAllowed,false);
  assert.equal(contract.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE");
});

test("planner accepts the live Seashell quest string without granting writes",()=>{
  const plan=planePr208SeashellFarmPreparation(request());
  assert.equal(plan.status,"READY_NO_WRITE");
  assert.deepEqual(plan.blocker,[]);
  assert.equal(plan.target?.itemName,"seashell");
  assert.equal(plan.target?.exchangeQuantity,20);
  assert.equal(plan.target?.sourceMonster,"croc");
  assert.equal(plan.movementAuthority,false);
  assert.equal(plan.combatAuthority,false);
  assert.equal(plan.skillAuthority,false);
  assert.equal(plan.lootAuthority,false);
  assert.equal(plan.farmAuthority,false);
  assert.equal(plan.exchangeAuthority,false);
  assert.equal(plan.gameplayAuthority,false);
  assert.equal(plan.rawWriteAuthority,false);
  assert.equal(plan.gameplayWrites,0);
  assert.equal(plan.publicFunctionCalls,0);
  assert.equal(plan.rawWriteCalls,0);
  assert.equal(plan.sameIntentRetry,false);
  assert.equal(plan.anniversaryGiftAllowed,false);
  assert.equal(plan.freshExistingExchangeScannerRequiredAfterAcquisition,true);
  assert.equal(plan.normalRuntimeAllowed,false);
  assert.equal(plan.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE");
});

test("boolean quest flag, exclusive item, or different target fail closed",()=>{
  for(const item of [
    {questMarker:true},
    {exclusive:true},
    {name:"anniversarygift",exchangeQuantity:1,baseGold:100,exclusive:true},
  ]){
    const plan=planePr208SeashellFarmPreparation(request({item}));
    assert.equal(plan.status,"BLOCKED");
    assert.equal(plan.target,null);
    assert.ok(plan.blocker.some(x=>
      x==="PR20_8_SEASHELL_FARM_TARGET_SCANNER_UNSAFE"
      ||x==="PR20_8_SEASHELL_FARM_TARGET_DEFINITION_DRIFT"
    ));
  }
});

test("market evidence or source drift blocks before any farm preparation",()=>{
  const market=planePr208SeashellFarmPreparation(request({
    marketDiscovery:{eligibleListingCount:1},
  }));
  assert.equal(market.status,"BLOCKED");
  assert.ok(market.blocker.includes("PR20_8_SEASHELL_FARM_MARKET_OUTCOME_UNGUELTIG"));

  const source=planePr208SeashellFarmPreparation(request({
    source:{dropContainsTarget:false},
  }));
  assert.equal(source.status,"BLOCKED");
  assert.ok(source.blocker.includes("PR20_8_SEASHELL_FARM_SOURCE_EVIDENCE_FEHLT"));
});

test("current roadmap advances only to the no-write Seashell farm shadow preparation",()=>{
  assert.equal(roadmap.pr20_8.status,"EXCHANGE_SEASHELL_FARM_PREPARATION_READY_NO_WRITE");
  assert.equal(roadmap.pr20_8.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE");
  const prep=roadmap.pr20_8.exchangeCandidateAcquisition.seashellFarmPreparation;
  assert.equal(prep.status,"PREPARED_NO_WRITE");
  assert.equal(prep.targetItem,"seashell");
  assert.equal(prep.requiredQuantity,20);
  assert.equal(prep.sourceMonster,"croc");
  assert.equal(prep.farmAuthority,false);
  assert.equal(prep.exchangeAuthority,false);
  assert.equal(prep.normalRuntimeAllowed,false);
  assert.equal(prep.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE");

  const row=roadmap.parallelPreparations.find(x=>x.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(row);
  assert.equal(row.status,"EXCHANGE_SEASHELL_FARM_PREPARATION_READY_NO_WRITE");
  assert.equal(row.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE");
  assert.equal(row.gameplayAuthority,false);
  assert.equal(row.rawWriteAuthority,false);
  assert.equal(row.normalRuntimeAllowed,false);
});
