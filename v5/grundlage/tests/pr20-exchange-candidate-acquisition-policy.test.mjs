import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const policy=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-candidate-acquisition.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const historical=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-no-candidate-closeout-review.json","utf8"
));

test("controlled acquisition supersedes waiting policy without rewriting historical evidence",()=>{
  assert.equal(policy.status,"DISCOVERY_PREPARED_BANK_ACQUISITION_CONDITIONALLY_ALLOWED");
  assert.equal(policy.supersedesDecisionOnly,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(policy.preservesHistoricalNoCandidateEvidence,true);

  assert.equal(
    historical.safeDecision.acquisitionOrMutationToCreateCandidateAllowed,
    false,
  );
  assert.equal(historical.safeDecision.bankMutationToCreateCandidateAllowed,false);
  assert.equal(historical.nextAction,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");

  assert.equal(
    roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_SERVICE_REPOSITION_MANIFEST_CUTOVER_PREPARED",
  );
  assert.equal(
    roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_EXCHANGE_SERVICE_REPOSITION",
  );
});

test("bank is the only acquisition mutation class enabled by the new policy",()=>{
  assert.equal(policy.bank.controlledMutationMayCreateCandidate,true);
  assert.equal(policy.bank.oneShotBankRetrieveRequired,true);
  assert.equal(policy.bank.durableIntentBeforePossibleSendRequired,true);
  assert.equal(policy.bank.currentFenceRequired,true);
  assert.equal(policy.bank.bankLeaseRequired,true);
  assert.equal(policy.bank.finalFreshCandidateReresolutionRequired,true);
  assert.equal(policy.bank.maximumGameplayWrites,1);
  assert.equal(policy.bank.maximumPublicFunctionCalls,1);
  assert.equal(policy.bank.maximumRawWriteCalls,0);
  assert.equal(policy.bank.sameIntentRetry,false);
  assert.equal(policy.buy.allowedNow,false);
  assert.equal(policy.farm.allowedNow,false);

  const r=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(r.controlledBankMutationToCreateCandidateAllowed,true);
  assert.equal(r.buyToCreateCandidateAllowed,false);
  assert.equal(r.farmToCreateCandidateAllowed,false);
});

test("acquisition remains strictly separate from Exchange ratification",()=>{
  assert.equal(policy.separation.acquisitionDoesNotCountAsExchangeRatification,true);
  assert.equal(policy.separation.acquisitionDoesNotCountAsExchange5mEvidence,true);
  assert.equal(policy.separation.acquisitionDoesNotCountAsExchangeAutonomyProof,true);
  assert.equal(policy.separation.existingExchangeScannerMustRunFreshAfterAcquisition,true);
  assert.equal(policy.separation.exchangeWriteAuthorityRemainsFalse,true);
  assert.equal(policy.separation.normalRuntimeAllowed,false);

  const r=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(r.acquisitionCountsAsExchangeRatification,false);
  assert.equal(r.freshExistingScannerRequiredAfterAcquisition,true);
  assert.equal(r.exchangeWriteAuthority,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.sourceCommit,"3182b137957416b253dde303bbba54dd800f8b14");
  assert.equal(r.packageSha256,"1acc8253cef6b02b33a6a5de289ce5a7095066d36bc727f9cffa77647e8778ec");
  assert.equal(r.packageBytes,12605);
  assert.equal(r.deployed,true);
  assert.equal(r.evidenceObserved,true);
  assert.equal(r.latestNotificationId,2603);
  assert.equal(r.latestRunStartedAtMs,1790332335441);
  assert.equal(r.latestStatus,"BLOCKIERT");
  assert.deepEqual(r.latestBlocker,["PR20_8_ACQUISITION_BANK_SNAPSHOT_REQUIRED"]);
  assert.equal(r.latestEmptyInventorySlot,22);
  assert.equal(r.latestGameplayWrites,0);
  assert.equal(r.latestPublicFunctionCalls,0);
  assert.equal(r.latestRawWriteCalls,0);
  assert.equal(r.latestSameIntentRetry,false);
  assert.equal(r.bankMount.status,"RATIFIED_BANK_SNAPSHOT_NO_CANDIDATE_ONE_MOVEMENT");
  assert.equal(r.bankMount.maximumGameplayWrites,1);
  assert.equal(r.bankMount.bankRetrieveAllowed,false);
  assert.equal(r.bankMount.sourceCommit,"5c84fc95b7fed97c3591462faba0a1315289fdce");
  assert.equal(r.bankMount.packageSha256,"94c053183363c0394922df4f6e422bede3260989e668a3b0942f3e876dbbdc54");
  assert.equal(r.bankMount.packageBytes,15430);
  assert.equal(r.bankMount.manifestCutoverPrepared,true);
  assert.equal(r.bankMount.deployed,true);
  assert.equal(r.bankMount.evidenceObserved,true);
  assert.equal(r.bankMount.notificationId,2633);
  assert.equal(r.bankMount.bankSnapshotAvailable,true);
  assert.deepEqual(r.bankMount.observedBankPacks,["items0","items1"]);
  assert.equal(r.bankMount.inventoryCandidateCount,0);
  assert.equal(r.bankMount.bankCandidateCount,0);
  assert.equal(r.bankMount.gameplayWrites,1);
  assert.equal(r.bankMount.publicFunctionCalls,1);
  assert.equal(r.bankMount.rawWriteCalls,0);
  assert.equal(r.bankMount.sameIntentRetry,false);
  assert.equal(r.marketDiscovery.status,"RATIFIED_NO_ELIGIBLE_MARKET_CANDIDATE_ONE_MOVEMENT");
  assert.equal(r.marketDiscovery.testId,"pr20-8-exchange-market-discovery");
  assert.equal(r.marketDiscovery.manifestCutoverPrepared,true);
  assert.equal(r.marketDiscovery.deployed,true);
  assert.equal(r.marketDiscovery.evidenceObserved,true);
  assert.equal(r.marketDiscovery.notificationId,2673);
  assert.equal(r.marketDiscovery.eligibleListingCount,0);
  assert.equal(r.marketDiscovery.tradeBuyAllowed,false);
  assert.equal(r.marketDiscovery.farmAllowed,false);
  assert.equal(r.marketDiscovery.exchangeAllowed,false);
  assert.equal(r.seashellFarmPreparation.status,"PREPARED_NO_WRITE");
  assert.equal(r.seashellFarmPreparation.targetItem,"seashell");
  assert.equal(r.seashellFarmPreparation.requiredQuantity,20);
  assert.equal(r.seashellFarmPreparation.sourceMonster,"croc");
  assert.equal(r.seashellFarmPreparation.anniversaryGiftAllowed,false);
  assert.equal(r.seashellFarmPreparation.farmAuthority,false);
  assert.equal(r.seashellFarmPreparation.exchangeAuthority,false);
  assert.equal(r.seashellFarmPreparation.normalRuntimeAllowed,false);
  assert.equal(r.seashellFarmShadow.activePath,false);
  assert.equal(r.seashellFarmShadow.supersededBy,"ANNIVERSARYGIFT_TEST_EXCEPTION_RESCAN");
  assert.equal(r.anniversaryGiftExceptionRescan.status,"RATIFIED_ANNIVERSARYGIFT_EXCHANGE_CANDIDATE_ZERO_WRITE");
  assert.equal(r.anniversaryGiftExceptionRescan.exactItem,"anniversarygift");
  assert.equal(r.anniversaryGiftExceptionRescan.exchangeQuantity,1);
  assert.equal(r.anniversaryGiftExceptionRescan.exclusiveException,true);
  assert.equal(r.anniversaryGiftExceptionRescan.genericExclusivePolicyRelaxed,false);
  assert.equal(r.anniversaryGiftExceptionRescan.otherExclusiveItemsRemainBlocked,true);
  assert.equal(r.anniversaryGiftExceptionRescan.scannerOnlyException,true);
  assert.equal(r.anniversaryGiftExceptionRescan.gameplayWrites,0);
  assert.equal(r.anniversaryGiftExceptionRescan.rawWriteCalls,0);
  assert.equal(r.anniversaryGiftExceptionRescan.exchangeAuthority,false);
  assert.equal(r.anniversaryGiftExceptionRescan.normalRuntimeAllowed,false);
});

test("read-only discovery package is pinned as zero-write preparation",()=>{
  const r=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(r.testId,"pr20-8-exchange-candidate-acquisition-readonly");
  assert.equal(r.controllerVersion,"1.0.1");
  assert.equal(r.expectedGlobal,"V5PR208ExchangeCandidateAcquisitionReadonly");
  assert.equal(r.maximumDiscoveryGameplayWrites,0);
  assert.equal(r.maximumDiscoveryPublicFunctionCalls,0);
  assert.equal(r.maximumDiscoveryRawWriteCalls,0);
  assert.equal(r.inventoryCandidateAction,"RUN_EXISTING_EXCHANGE_SCANNER");
  assert.equal(r.bankCandidateAction,"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT");
  assert.equal(r.missingBankSnapshotAction,"ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY");
  assert.equal(r.noInventoryOrBankCandidateAction,"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE");
});

test("parallel roadmap row points at controlled discovery but carries no Exchange authority",()=>{
  const row=roadmap.parallelPreparations.find(x=>x.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(row);
  assert.equal(row.status,"EXCHANGE_ANNIVERSARYGIFT_SERVICE_REPOSITION_MANIFEST_CUTOVER_PREPARED");
  assert.equal(row.nextAction,"DEPLOY_AND_OBSERVE_EXCHANGE_SERVICE_REPOSITION");
  assert.equal(row.gameplayAuthority,false);
  assert.equal(row.rawWriteAuthority,false);
  assert.equal(row.normalRuntimeAllowed,false);
  assert.ok(row.artifacts.includes(
    "v5/grundlage/vertraege/runtime/pr20-8-exchange-candidate-acquisition.json"
  ));
});


test("bank-mount contract is one-shot movement only and cannot retrieve",()=>{
  const mount=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr20-8-exchange-candidate-bank-mount.json","utf8"
  ));
  assert.equal(mount.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(mount.prerequisite.priorTestId,"pr20-8-exchange-candidate-acquisition-readonly");
  assert.equal(mount.prerequisite.requiredPriorBlocker,"PR20_8_ACQUISITION_BANK_SNAPSHOT_REQUIRED");
  assert.equal(mount.movementBoundary.exactPublicFunction,"smart_move");
  assert.equal(mount.movementBoundary.exactArgument,"bank");
  assert.equal(mount.movementBoundary.maximumGameplayWrites,1);
  assert.equal(mount.movementBoundary.maximumPublicFunctionCalls,1);
  assert.equal(mount.movementBoundary.maximumRawWriteCalls,0);
  assert.equal(mount.movementBoundary.sameIntentRetry,false);
  assert.equal(mount.prohibitedInThisStage.bankRetrieve,true);
  assert.equal(mount.prohibitedInThisStage.buy,true);
  assert.equal(mount.prohibitedInThisStage.farm,true);
  assert.equal(mount.prohibitedInThisStage.exchange,true);
  assert.equal(mount.evidenceSeparation.exactBankRetrieveRequiresSeparatePreparation,true);
  assert.equal(mount.evidenceSeparation.exchangeWriteAuthority,false);
  assert.equal(mount.evidenceSeparation.normalRuntimeAllowed,false);
  assert.equal(mount.manifestCutover.prepared,true);
  assert.equal(mount.manifestCutover.sourceCommit,"5c84fc95b7fed97c3591462faba0a1315289fdce");
  assert.equal(mount.manifestCutover.packageSha256,"94c053183363c0394922df4f6e422bede3260989e668a3b0942f3e876dbbdc54");
  assert.equal(mount.manifestCutover.packageBytes,15430);
  assert.equal(mount.manifestCutover.deployed,false);
  assert.equal(mount.manifestCutover.evidenceObserved,false);
  assert.equal(mount.nextAction,"DEPLOY_AND_OBSERVE_BANK_MOUNT");
});
