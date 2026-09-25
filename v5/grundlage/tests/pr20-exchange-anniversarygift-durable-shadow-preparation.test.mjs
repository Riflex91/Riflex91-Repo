import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-v1-0-7-evidence.json","utf8"
));
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-durable-shadow.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("v1.0.7 live evidence ratifies anniversarygift candidate only, not Exchange write",()=>{
  assert.equal(evidence.status,"RATIFIED_ANNIVERSARYGIFT_CANDIDATE_ZERO_WRITE");
  assert.equal(evidence.manifestMainCommit,"4e04bc6e114f0f3959c562f6ff9e0571b983b371");
  assert.equal(evidence.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.controllerVersion,"1.0.7");
  assert.equal(evidence.notificationId,2729);
  assert.equal(evidence.priorSuccessfulNotificationId,2726);
  assert.equal(evidence.terminalStatus,"BESTANDEN");
  assert.equal(evidence.phase,"COMPLETE");
  assert.deepEqual(evidence.blocker,[]);
  assert.equal(evidence.candidate.name,"anniversarygift");
  assert.equal(evidence.candidate.observedInventoryIndex,4);
  assert.equal(evidence.candidate.observedQuantity,106);
  assert.equal(evidence.candidate.baseGold,100);
  assert.equal(evidence.candidate.exchangeQuantity,1);
  assert.equal(evidence.candidate.exclusive,true);
  assert.equal(evidence.candidate.exclusiveTestException,true);
  assert.equal(evidence.exchangePolicy.candidateCount,1);
  assert.equal(evidence.exchangePolicy.genericExclusivePolicyRelaxed,false);
  assert.equal(evidence.exchangePolicy.otherExclusiveItemsRemainBlocked,true);
  assert.equal(evidence.writes.gameplayWrites,0);
  assert.equal(evidence.writes.publicFunctionCalls,0);
  assert.equal(evidence.writes.rawWriteCalls,0);
  assert.equal(evidence.writes.sameIntentRetry,false);
  assert.equal(evidence.authority.exchange,false);
  assert.equal(evidence.authority.durableIntentCreated,false);
  assert.equal(evidence.evidenceSeparation.exchangeStillUnratified,true);
  assert.equal(evidence.normalRuntimeAllowed,false);
});

test("anniversarygift durable shadow remains no-send and exact-item bound",()=>{
  assert.equal(contract.status,"PREPARED_NO_WRITE");
  assert.equal(contract.prerequisite.requiredStatus,
    "RATIFIED_ANNIVERSARYGIFT_CANDIDATE_ZERO_WRITE");
  assert.equal(contract.prerequisite.requiredNotificationId,2729);
  assert.equal(contract.actionBinding.actionContractId,"AL-ACTION-EXCHANGE");
  assert.equal(contract.actionBinding.recoveryContractId,"AL-RECOVERY-EXCHANGE");
  assert.equal(contract.actionBinding.verifierId,"AL-VERIFIER-EXCHANGE");
  assert.equal(contract.actionBinding.publicFunction,"exchange");
  assert.equal(contract.exactCandidate.name,"anniversarygift");
  assert.equal(contract.exactCandidate.definitionBaseGold,100);
  assert.equal(contract.exactCandidate.definitionExchangeQuantity,1);
  assert.equal(contract.exactCandidate.definitionExclusive,true);
  assert.equal(contract.exactCandidate.observedIndexCarriesWriteAuthority,false);
  assert.equal(contract.exactCandidate.exactPhysicalIndexReresolveRequired,true);
  assert.equal(contract.exactCandidate.genericExclusiveRelaxationForbidden,true);
  assert.equal(contract.preflight.rewardGraph,"D.drops.anniversarygift");
  assert.equal(contract.preflight.rewardGraphFreshBoundedReconciliationRequired,true);
  assert.equal(contract.preflight.liveExchangeServiceReachabilityRequired,true);
  assert.equal(contract.preflight.exchangeServiceCoordinateHardcodeAllowed,false);
  assert.equal(contract.durableShadow.doubleObservationRequired,true);
  assert.equal(contract.durableShadow.durableIntentBeforeAnyFutureSendRequired,true);
  assert.equal(contract.durableShadow.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(contract.durableShadow.exchangeCallSiteAllowedInShadow,false);
  assert.equal(contract.durableShadow.rawSocketCallAllowed,false);
  assert.equal(contract.durableShadow.sameIntentRetry,false);
  assert.equal(contract.authority.exchangeAuthority,false);
  assert.equal(contract.authority.gameplayWrites,0);
  assert.equal(contract.authority.publicFunctionCalls,0);
  assert.equal(contract.authority.rawWriteCalls,0);
  assert.equal(contract.runner.present,false);
  assert.equal(contract.runner.manifestCutoverPrepared,false);
  assert.equal(contract.nextAction,
    "PREPARE_ANNIVERSARYGIFT_EXCHANGE_DURABLE_SHADOW_RUNNER_NO_WRITE");
});

test("roadmap exits acquisition and moves only to no-write anniversarygift shadow runner",()=>{
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_CANDIDATE_RATIFIED_SHADOW_PREPARED_NO_WRITE");
  assert.equal(roadmap.pr20_8.nextAction,
    "PREPARE_ANNIVERSARYGIFT_EXCHANGE_DURABLE_SHADOW_RUNNER_NO_WRITE");
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(a.status,"ANNIVERSARYGIFT_CANDIDATE_RATIFIED_SHADOW_PREPARED_NO_WRITE");
  assert.equal(a.anniversaryGiftExceptionRescan.deployed,true);
  assert.equal(a.anniversaryGiftExceptionRescan.evidenceObserved,true);
  assert.equal(a.anniversaryGiftExceptionRescan.latestNotificationId,2729);
  assert.equal(a.anniversaryGiftExceptionRescan.latestStatus,"BESTANDEN");
  assert.equal(a.anniversaryGiftExceptionRescan.exchangeCandidateCount,1);
  assert.equal(a.anniversaryGiftExceptionRescan.selectedItem,"anniversarygift");
  assert.equal(a.anniversaryGiftExchangeDurableShadow.status,"PREPARED_NO_WRITE");
  assert.equal(a.anniversaryGiftExchangeDurableShadow.runnerPresent,false);
  assert.equal(a.anniversaryGiftExchangeDurableShadow.exchangeAuthority,false);
  assert.equal(a.anniversaryGiftExchangeDurableShadow.normalRuntimeAllowed,false);
});
