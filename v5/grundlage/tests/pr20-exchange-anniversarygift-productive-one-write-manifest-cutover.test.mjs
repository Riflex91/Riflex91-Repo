import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-productive-one-write-manifest-cutover.json",
  "utf8",
));
const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-productive-one-write-preparation.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("anniversarygift productive cutover pins the exact one-write package",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(cutover.sourceMain,"f5e9685ce77bf2922172108ea3f5bbb17440669c");
  assert.equal(cutover.prerequisite.requiredPreparationStatus,
    "RUNNER_PREPARED_NOT_DEPLOYED");
  assert.equal(cutover.prerequisite.requiredRewardEvidenceStatus,
    "RATIFIED_SCOPED_CURRENT_SOURCE_REVALIDATION");
  assert.equal(cutover.prerequisite.shadowNotificationId,2752);
  assert.equal(cutover.prerequisite.shadowRequiredStatus,"BESTANDEN");
  assert.equal(cutover.prerequisite.shadowRequiredSendBoundaryState,"NICHT_GESENDET");
  assert.equal(cutover.manifest.testId,
    "pr20-8-exchange-anniversarygift-productive-one-write-live");
  assert.equal(cutover.manifest.controllerVersion,"1.0.0");
  assert.equal(cutover.manifest.sourceCommit,
    "5c43c182e2cd2b9ef4361ce1699af00748ad0d95");
  assert.equal(cutover.manifest.packageSha256,
    "eb7cc9760966ddf7026cdc200e373c8716c80126ce6b2651aba8fd4e0420ef74");
  assert.equal(cutover.manifest.packageBytes,50047);
  assert.equal(cutover.manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftProductiveOneWriteLive");
  assert.equal(cutover.manifest.normalRuntimeAllowed,false);
});

test("historical productive cutover package remains exact after service-mount advance",()=>{
  const localPath=cutover.manifest.packagePath.replace(/^v5\//,"");
  const bytes=fs.readFileSync(localPath);
  assert.equal(bytes.length,cutover.manifest.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    cutover.manifest.packageSha256,
  );
  const pinned=execFileSync("git",[
    "show",cutover.manifest.sourceCommit+":"+cutover.manifest.packagePath,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,bytes);
  assert.notEqual(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.testId,"pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live");
});

test("productive boundary remains exactly-once and fail-closed",()=>{
  const b=cutover.productiveBoundary;
  assert.equal(b.exactItem,"anniversarygift");
  assert.equal(b.exchangeQuantity,1);
  assert.equal(b.observedHistoricalIndexCarriesAuthority,false);
  assert.equal(b.freshPhysicalIndexReresolutionRequired,true);
  assert.equal(b.minimumEmptyInventorySlots,1);
  assert.equal(b.massExchangeForbidden,true);
  assert.equal(b.massExchangePpForbidden,true);
  assert.equal(b.maximumGameplayWrites,1);
  assert.equal(b.maximumPublicFunctionCalls,1);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.publicFunction,"exchange");
  assert.equal(b.rawSocketEmitForbidden,true);
  assert.equal(b.rawApiCallForbidden,true);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.oneShotAuthorityMaximumUses,1);
  assert.equal(b.unknownOutcomeBlindRetryForbidden,true);
});

test("reward boundary is exact and still requires full reconciliation",()=>{
  const b=cutover.rewardBoundary;
  assert.equal(b.scopedOfficialSourceCommit,
    "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(b.dropGraphSha256,
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342");
  assert.deepEqual(b.rewardDomains,["gold","inventory","empty"]);
  assert.deepEqual(b.allowedGoldDeltas,[5000,20000]);
  assert.equal(b.maximumPhysicalOutputs,1);
  assert.deepEqual(b.allowedCxjarData,["makeawish","ikissyou"]);
  assert.equal(b.fullPoststateReconciliationRequired,true);
  assert.equal(b.promiseRewardSupportingOnly,true);
});

test("deployment itself does not ratify Exchange",()=>{
  const b=cutover.deploymentBoundary;
  assert.equal(b.bridgeMayDeployPinnedRunner,true);
  assert.equal(b.deploymentCreatesLiveAuthorityOnlyInsideFreshRunnerAdmission,true);
  assert.equal(b.deploymentCountsAsExchangeRatification,false);
  assert.equal(b.committedTerminalEvidenceRequiredForRatification,true);
  assert.equal(b.fiveMinuteObservationStillRequiredAfterProductiveOneWrite,true);
  assert.equal(b.autonomyProofStillRequired,true);
  assert.equal(b.normalRuntimeAllowed,false);
});

test("preparation contract remains immutable while deployment state advances",()=>{
  assert.equal(prep.status,"RUNNER_PREPARED_NOT_DEPLOYED");
  assert.equal(prep.runner.autonomousManifestChanged,false);
  assert.equal(prep.runner.deployed,false);
  assert.equal(prep.authorityBoundary.exchangeAuthority,false);
  assert.equal(prep.authorityBoundary.gameplayAuthority,false);
  assert.equal(prep.authorityBoundary.rawWriteAuthority,false);
  assert.equal(prep.authorityBoundary.normalExchangeWriteRatification,false);
});

test("roadmap advances only to productive deployment observation",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const live=a.anniversaryGiftProductiveOneWrite;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_ONE_WRITE_MANIFEST_CUTOVER_PREPARED");
  assert.equal(roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_PRODUCTIVE_ONE_WRITE");
  assert.equal(a.status,
    "ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(live.status,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(live.manifestCutoverPrepared,true);
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.exchangeAuthority,false);
  assert.equal(live.gameplayAuthority,false);
  assert.equal(live.rawWriteAuthority,false);
  assert.equal(live.normalRuntimeAllowed,false);
  assert.equal(a.anniversaryGiftExchangeShadow.status,
    "RATIFIED_LIVE_DURABLE_SHADOW_NO_SEND");
  assert.equal(a.seashellFarmShadow.activePath,false);
});
