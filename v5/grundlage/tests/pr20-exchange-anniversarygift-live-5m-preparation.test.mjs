import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const oneWrite=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-productive-one-write-evidence.json","utf8"
));
const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-live-5m-preparation.json","utf8"
));
const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-live-5m-manifest-cutover.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("anniversarygift productive one-write evidence is exact committed Exchange",()=>{
  assert.equal(oneWrite.status,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(oneWrite.liveTelemetry.notificationId,2949);
  assert.equal(oneWrite.liveTelemetry.status,"BESTANDEN");
  assert.equal(oneWrite.liveTelemetry.phase,"COMPLETE");
  assert.equal(oneWrite.liveTelemetry.terminal,true);
  assert.equal(oneWrite.sourceTransaction.transactionId,
    "pr20-8-exchange-anniversarygift-productive-one-write-live:0c6a1129be4c9c899f88274fab97108a");
  assert.equal(oneWrite.sourceTransaction.status,"COMMITTED");
  assert.equal(oneWrite.sourceTransaction.sendCount,1);
  assert.equal(oneWrite.sourceTransaction.sameIntentRetry,false);
  assert.equal(oneWrite.sourceTransaction.authorityConsumed,true);
  assert.equal(oneWrite.exactInput.quantityBefore,106);
  assert.equal(oneWrite.exactInput.quantityAfter,105);
  assert.equal(oneWrite.exactInput.inputDelta,-1);
  assert.equal(oneWrite.exactReward.kind,"gold");
  assert.equal(oneWrite.exactReward.goldDelta,5000);
  assert.equal(oneWrite.exactReward.insidePinnedRewardDomain,true);
  assert.equal(oneWrite.reconciliation.classification,"COMMITTED");
  assert.equal(oneWrite.reconciliation.promiseTimedOut,true);
  assert.equal(oneWrite.reconciliation.promiseRewardSupportingEvidenceOnly,true);
  assert.equal(oneWrite.reconciliation.qActive,false);
  assert.equal(oneWrite.reconciliation.placeholderCount,0);
  assert.equal(oneWrite.mutationCounters.gameplayWrites,1);
  assert.equal(oneWrite.mutationCounters.publicFunctionCalls,1);
  assert.equal(oneWrite.mutationCounters.rawWriteCalls,0);
  assert.equal(oneWrite.mutationCounters.sameIntentRetry,false);
});

test("5m preparation grants zero additional mutation authority",()=>{
  assert.equal(prep.status,"BEREIT_NO_ADDITIONAL_LIVE_WRITE");
  assert.equal(prep.prerequisiteOneWriteEvidence.status,
    "RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(prep.prerequisiteOneWriteEvidence.notificationId,2949);
  assert.equal(prep.prerequisiteOneWriteEvidence.sendCount,1);
  assert.equal(prep.prerequisiteOneWriteEvidence.gameplayWrites,1);
  assert.equal(prep.prerequisiteOneWriteEvidence.publicFunctionCalls,1);
  assert.equal(prep.prerequisiteOneWriteEvidence.rawWriteCalls,0);
  assert.equal(prep.prerequisiteOneWriteEvidence.sameIntentRetry,false);
  assert.equal(prep.prerequisiteOneWriteEvidence.authorityConsumed,true);
  assert.equal(prep.exactCommittedPostcondition.input.quantity,105);
  assert.equal(prep.exactCommittedPostcondition.sourceIntentMustRemainTerminalCommitted,true);
  assert.equal(prep.exactCommittedPostcondition.sourceAuthorityMustRemainConsumed,true);
  assert.equal(prep.exactCommittedPostcondition.sourceAuthorityUses,1);
  assert.equal(prep.exactCommittedPostcondition.sourceFencesMustRemainInactive,true);
  assert.equal(prep.soak.minimumSamples,60);
  assert.equal(prep.soak.intervalMs,5000);
  assert.equal(prep.soak.minimumDurationMs,299000);
  assert.equal(prep.soak.restartMayNeverResend,true);
  assert.equal(prep.packageBoundary.publicExchangeCallSites,0);
  assert.equal(prep.packageBoundary.maximumAdditionalGameplayWrites,0);
  assert.equal(prep.packageBoundary.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(prep.packageBoundary.maximumAdditionalRawWriteCalls,0);
  assert.equal(prep.packageBoundary.exchangeWriteAuthority,false);
  assert.equal(prep.packageBoundary.gameplayAuthority,false);
  assert.equal(prep.packageBoundary.rawWriteAuthority,false);
  assert.equal(prep.packageBoundary.sameIntentRetry,false);
  assert.equal(prep.exitSemantics.mayAdvanceToPr20_9,false);
});

test("5m cutover pins exact observer bytes and source commit",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(cutover.prerequisite.requiredStatus,
    "RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(cutover.prerequisite.notificationId,2949);
  assert.equal(cutover.prerequisite.requiredGoldDelta,5000);
  assert.equal(cutover.manifest.testId,
    "pr20-8-exchange-anniversarygift-live-5m");
  assert.equal(cutover.manifest.controllerVersion,"1.0.0");
  assert.equal(cutover.manifest.sourceCommit,
    "859c5be1067fbd5360c17ccfe0d912a98537bfc9");
  assert.equal(cutover.manifest.packageSha256,
    "455593d7691dc5436af27a5b89afb5fc208f2ebca4253aa87d0726821abcda94");
  assert.equal(cutover.manifest.packageBytes,28423);
  assert.equal(cutover.manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftLive5m");
  assert.equal(cutover.observerBoundary.maximumAdditionalGameplayWrites,0);
  assert.equal(cutover.observerBoundary.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(cutover.observerBoundary.maximumAdditionalRawWriteCalls,0);
  assert.equal(cutover.observerBoundary.sameIntentRetry,false);
  assert.equal(cutover.observerBoundary.noResendPathPresent,true);
  assert.equal(cutover.deploymentBoundary.autonomyProofStillRequiredAfterPass,true);
  assert.equal(cutover.deploymentBoundary.pr20_8ExitGateStillRequiredAfterPass,true);

  const local=cutover.manifest.packagePath.replace(/^v5\//,"");
  const bytes=fs.readFileSync(local);
  assert.equal(bytes.length,cutover.manifest.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    cutover.manifest.packageSha256
  );
  const pinned=execFileSync("git",[
    "show",cutover.manifest.sourceCommit+":"+cutover.manifest.packagePath,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,bytes);
});

test("active manifest has advanced from the ratified 5m observer to the autonomy route shadow",()=>{
  assert.notEqual(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m-v1-0-2");
  assert.equal(manifest.controllerVersion,"1.0.2");
  assert.equal(manifest.sourceCommit,"21ca224da795c21c7aced7fe8bb3c6d4a7fb7bbb");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr21-merchant-integration-live-15m-v1-0-2.js");
  assert.equal(manifest.packageSha256,"9ad493bad10dbfd565613ebdc0529893610c0c0f4868e1ffda690a77224e8dda");
  assert.equal(manifest.expectedGlobal,"V5PR21MerchantIntegrationLive15mV102");
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("roadmap ratifies one-write and Exchange 5m, then advances only to autonomy preparation",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const live=a.anniversaryGiftProductiveOneWrite;
  const soak=a.anniversaryGiftExchangeLive5m;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_RATIFIED_PR20_8_COMPLETE");
  assert.equal(roadmap.pr20_8.nextAction,
    "ADVANCE_TO_PR20_9_PRODUCTION");
  assert.equal(a.status,
    "ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(live.status,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.latestNotificationId,2949);
  assert.equal(live.latestReconciliation,"COMMITTED");
  assert.equal(live.latestInputQuantityAfter,105);
  assert.equal(live.latestRewardKind,"gold");
  assert.equal(live.latestGoldDelta,5000);
  assert.equal(live.latestGameplayWrites,1);
  assert.equal(live.latestPublicFunctionCalls,1);
  assert.equal(live.latestRawWriteCalls,0);
  assert.equal(live.latestSameIntentRetry,false);
  assert.equal(live.latestAuthorityConsumed,true);
  assert.equal(live.exchangeAuthority,false);
  assert.equal(soak.status,"RATIFIED_BESTANDEN_ZERO_ADDITIONAL_MUTATION");
  assert.equal(soak.minimumSamples,60);
  assert.equal(soak.minimumDurationMs,299000);
  assert.equal(soak.maximumAdditionalGameplayWrites,0);
  assert.equal(soak.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(soak.maximumAdditionalRawWriteCalls,0);
  assert.equal(soak.exchangeAuthority,false);
  assert.equal(soak.manifestCutoverPrepared,true);
  assert.equal(soak.deployed,true);
  assert.equal(soak.liveEvidenceObserved,true);
  assert.equal(soak.exchangeLive5mTested,true);
  assert.equal(soak.latestNotificationId,2986);
  assert.equal(soak.latestSamples,60);
  assert.equal(soak.latestDurationMs,299012);
  assert.equal(soak.latestAdditionalGameplayWrites,0);
  assert.equal(soak.latestAdditionalPublicFunctionCalls,0);
  assert.equal(soak.latestAdditionalRawWriteCalls,0);
  assert.equal(soak.latestSameIntentRetry,false);
});
