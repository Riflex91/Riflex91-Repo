import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  new URL("../../roadmap/pr20-8-exchange-candidate-bank-mount-evidence.json",import.meta.url),
  "utf8",
));

test("bank mount evidence records one movement and a real zero-candidate bank snapshot",()=>{
  assert.equal(evidence.status,"RATIFIED_BANK_SNAPSHOT_NO_CANDIDATE_ONE_MOVEMENT");
  assert.equal(evidence.manifestMainCommit,"1afb29733ee20915966bdcdf242419414d9869e4");
  assert.equal(evidence.testId,"pr20-8-exchange-candidate-bank-mount");
  assert.equal(evidence.controllerVersion,"1.0.0");
  assert.equal(evidence.notificationId,2633);
  assert.equal(evidence.terminalStatus,"BLOCKIERT");
  assert.equal(evidence.phase,"PR20_8_EXCHANGE_ACQUISITION_BANK_MOUNT");
  assert.deepEqual(evidence.blocker,[
    "PR20_8_ACQUISITION_KEIN_INVENTORY_ODER_BANK_KANDIDAT",
  ]);
  assert.equal(evidence.movement.target,"bank");
  assert.equal(evidence.movement.issued,true);
  assert.equal(evidence.movement.completed,true);
  assert.equal(evidence.movement.gameplayWrites,1);
  assert.equal(evidence.movement.publicFunctionCalls,1);
  assert.equal(evidence.movement.rawWriteCalls,0);
  assert.equal(evidence.movement.maximumCalls,1);
  assert.equal(evidence.movement.sameIntentRetry,false);
  assert.equal(evidence.discovery.bankSnapshotAvailable,true);
  assert.deepEqual(evidence.discovery.observedBankPacks,["items0","items1"]);
  assert.equal(evidence.discovery.emptyInventorySlot,22);
  assert.equal(evidence.discovery.inventoryCandidateCount,0);
  assert.equal(evidence.discovery.bankCandidateCount,0);
  assert.equal(evidence.discovery.selected,null);
  assert.equal(evidence.authority.bankRetrieve,false);
  assert.equal(evidence.authority.buy,false);
  assert.equal(evidence.authority.farm,false);
  assert.equal(evidence.authority.exchange,false);
  assert.equal(evidence.authority.rawWrite,false);
  assert.equal(evidence.normalRuntimeAllowed,false);
  assert.equal(evidence.evidenceSeparation.exchangeStillUnratified,true);
  assert.equal(evidence.nextAction,"PREPARE_PLAYER_MARKET_DISCOVERY_BEFORE_FARM");
});
