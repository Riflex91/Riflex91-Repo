import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-autonomy-productive-one-write-preparation.json","utf8"
));
const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-autonomy-productive-one-write-manifest-cutover.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const packagePath="werkzeuge/pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live-v1-0-0.js";
const packageBytes=fs.readFileSync(packagePath);
const packageSource=packageBytes.toString("utf8");

test("autonomy productive preparation requires the ratified no-write route shadow",()=>{
  assert.equal(prep.status,"RUNNER_PREPARED_NOT_DEPLOYED");
  assert.equal(
    prep.prerequisites.requiredAutonomyRouteShadowStatus,
    "RATIFIED_BESTANDEN_AUTONOMY_ROUTE_ZERO_WRITE",
  );
  assert.equal(prep.prerequisites.autonomyRouteShadowNotificationId,3020);
  assert.equal(prep.prerequisites.priorCommittedTransactionMayNotGrantAuthority,true);
  assert.equal(prep.autonomousDecision.newDecisionRequired,true);
  assert.equal(prep.autonomousDecision.freshCurrentInventoryObservationRequired,true);
  assert.equal(prep.autonomousDecision.freshCandidateReresolutionRequired,true);
  assert.equal(prep.autonomousDecision.manualPinnedInventoryIndexForbidden,true);
  assert.equal(prep.autonomousDecision.historicalObservedIndexCarriesAuthority,false);
  assert.equal(prep.autonomousDecision.exactItem,"anniversarygift");
  assert.equal(prep.autonomousDecision.exchangeQuantity,1);
  assert.equal(prep.autonomousDecision.exclusiveExceptionOnlyForExactItem,true);
  assert.equal(prep.autonomousDecision.genericExclusivePolicyRelaxationForbidden,true);
  assert.equal(prep.autonomousDecision.durableDecisionRequiredBeforeExchangeIntent,true);
  assert.equal(prep.autonomousDecision.exactDecisionReadbackRequired,true);
  assert.equal(prep.autonomousDecision.priorCommittedTransactionGrantsAuthority,false);
});

test("autonomy productive one-write boundary is exactly one public exchange and zero raw",()=>{
  const a=prep.durableIntentAndAuthority;
  assert.equal(a.durableExchangeIntentRequiredBeforeAuthority,true);
  assert.equal(a.exactIntentReadbackRequired,true);
  assert.equal(a.authorityClass,"Pr208AnniversaryGiftExchangeAutonomyOneShotAuthority");
  assert.equal(a.authorityMustBindAutonomyDecisionId,true);
  assert.equal(a.maximumUses,1);
  assert.equal(a.maximumTtlMs,1500);
  assert.equal(a.maximumGameplayWrites,1);
  assert.equal(a.maximumPublicFunctionCalls,1);
  assert.equal(a.maximumRawWriteCalls,0);
  assert.equal(a.freshObservationAfterAuthorityRequired,true);
  assert.equal(a.sameIntentRetry,false);
  assert.equal(a.unknownOutcomeBlindRetryForbidden,true);
  assert.equal(prep.sendBoundary.publicFunction,"exchange");
  assert.equal(prep.sendBoundary.exactlyOneCallMaximum,true);
  assert.equal(prep.sendBoundary.rawSocketEmitForbidden,true);
  assert.equal(prep.sendBoundary.rawApiCallForbidden,true);
  assert.equal(prep.sendBoundary.smartMoveForbidden,true);
  assert.equal(prep.sendBoundary.normalRuntimeAllowed,false);
});

test("autonomy productive runner package is exact pinned and narrow",()=>{
  const r=prep.runner;
  assert.equal(r.testId,"pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live");
  assert.equal(r.controllerVersion,"1.0.0");
  assert.equal(r.expectedGlobal,"V5PR208ExchangeAnniversarygiftAutonomyProductiveOneWriteLive");
  assert.equal(r.sourceCommit,"3b2c7ad641bda34838f6fe4a1b1a277bebf6b88c");
  assert.equal(r.sha256,"65dcf3892501f5181bf9a2ab02995cad87132738f8fb2d64a1f14d7b9b9d9b2a");
  assert.equal(r.bytes,60226);
  assert.equal(packageBytes.length,r.bytes);
  assert.equal(crypto.createHash("sha256").update(packageBytes).digest("hex"),r.sha256);
  const pinned=execFileSync("git",["show",r.sourceCommit+":"+r.path],{
    encoding:null,maxBuffer:256*1024
  });
  assert.deepEqual(pinned,packageBytes);
  assert.equal((packageSource.match(/globalThis\.exchange\(/g)||[]).length,1);
  for(const marker of ["socket.emit(",".socket.emit(","api_call(","smart_move(","parent.exchange("]){
    assert.equal(packageSource.includes(marker),false,marker);
  }
});

test("historical autonomy productive cutover stays exact while active manifest advances to PR20.9",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(
    cutover.prerequisite.requiredAutonomyRouteShadowStatus,
    "RATIFIED_BESTANDEN_AUTONOMY_ROUTE_ZERO_WRITE",
  );
  assert.equal(cutover.prerequisite.autonomyRouteShadowNotificationId,3020);
  assert.equal(cutover.prerequisite.priorCommittedTransactionMayNotGrantAuthority,true);
  assert.notEqual(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.gate,"PR21_MERCHANT_INTEGRATION");
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m-v1-0-1");
  assert.equal(manifest.controllerVersion,"1.0.1");
  assert.equal(manifest.sourceCommit,"2fd7ed8fa1036460fc0188fa053ac48e50d35a54");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr21-merchant-integration-live-15m-v1-0-1.js");
  assert.equal(manifest.packageSha256,"4066d751ac0a9f67db7f3eb318b6a1ffc882b37c4b93638c6151403a8616e1f9");
  assert.equal(manifest.expectedGlobal,"V5PR21MerchantIntegrationLive15mV101");
  assert.equal(manifest.normalRuntimeAllowed,false);
  assert.equal(cutover.productiveBoundary.newAutonomousDecisionRequired,true);
  assert.equal(cutover.productiveBoundary.manualPinnedInventoryIndexForbidden,true);
  assert.equal(cutover.productiveBoundary.durableAutonomyDecisionBeforeIntent,true);
  assert.equal(cutover.productiveBoundary.durableExchangeIntentBeforeAuthority,true);
  assert.equal(cutover.productiveBoundary.authorityBindsAutonomyDecisionId,true);
  assert.equal(cutover.productiveBoundary.oneShotAuthorityMaximumUses,1);
  assert.equal(cutover.productiveBoundary.oneShotAuthorityMaximumTtlMs,1500);
  assert.equal(cutover.productiveBoundary.maximumGameplayWrites,1);
  assert.equal(cutover.productiveBoundary.maximumPublicFunctionCalls,1);
  assert.equal(cutover.productiveBoundary.maximumRawWriteCalls,0);
  assert.equal(cutover.productiveBoundary.movementAuthority,false);
  assert.equal(cutover.deploymentBoundary.deploymentCountsAsAutonomyRatification,false);
  assert.equal(cutover.deploymentBoundary.exchangeAutonomyProductiveProven,false);
  assert.equal(cutover.deploymentBoundary.mayAdvanceToPr20_9,false);
});

test("roadmap reflects ratified productive autonomy and closes PR20.8",()=>{
  const p=roadmap.pr20_8;
  const a=p.exchangeCandidateAcquisition.anniversaryGiftExchangeAutonomyProductiveOneWrite;
  assert.equal(
    p.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_RATIFIED_PR20_8_COMPLETE",
  );
  assert.equal(p.nextAction,"ADVANCE_TO_PR20_9_PRODUCTION");
  assert.equal(a.status,"RATIFIED_BESTANDEN_COMMITTED_AUTONOMOUS_ONE_WRITE");
  assert.equal(a.testId,"pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live");
  assert.equal(a.manifestCutoverPrepared,true);
  assert.equal(a.deployed,true);
  assert.equal(a.liveEvidenceObserved,true);
  assert.equal(a.productiveAutonomyProven,true);
  assert.equal(a.manualPinnedInventoryIndex,false);
  assert.equal(a.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(a.maximumGameplayWrites,1);
  assert.equal(a.maximumPublicFunctionCalls,1);
  assert.equal(a.maximumRawWriteCalls,0);
  assert.equal(a.sameIntentRetry,false);
  assert.equal(a.normalRuntimeAllowed,false);
  assert.equal(p.exitGateReview.exchangeAutonomyProductiveProven,true);
  assert.equal(p.exitGateReview.currentExitGateSatisfied,true);
  assert.equal(p.exitGateReview.mayAdvanceToPr20_9,true);
});

test("parallel PR20.8 mirror matches the productive autonomy deployment state",()=>{
  const p=roadmap.pr20_8;
  const parallel=roadmap.parallelPreparations.find(x=>x?.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(parallel);
  assert.equal(parallel.status,p.status);
  assert.equal(parallel.nextAction,p.nextAction);
  assert.equal(parallel.gameplayAuthority,false);
  assert.equal(parallel.rawWriteAuthority,false);
  assert.equal(parallel.normalRuntimeAllowed,false);
});
