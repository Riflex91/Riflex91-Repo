import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-service-mount-evidence.json","utf8"
));
const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-productive-one-write-restore-manifest-cutover.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("service mount live evidence proves one movement and no Exchange write",()=>{
  assert.equal(evidence.status,"RATIFIED_EXCHANGE_SERVICE_REACHED_ONE_MOVEMENT");
  assert.equal(evidence.sourceMain,"3d4fc0f7014e22913ee8f240fb64f6fd012cc984");
  assert.equal(evidence.liveTelemetry.notificationId,2921);
  assert.equal(evidence.liveTelemetry.status,"BESTANDEN");
  assert.equal(evidence.liveTelemetry.phase,"COMPLETE");
  assert.equal(evidence.liveTelemetry.terminal,true);
  assert.equal(evidence.liveTelemetry.target,"exchange");
  assert.equal(evidence.liveTelemetry.movementIssued,true);
  assert.equal(evidence.liveTelemetry.movementCompleted,true);
  assert.equal(evidence.liveTelemetry.sendCount,1);
  assert.equal(evidence.liveTelemetry.gameplayWrites,1);
  assert.equal(evidence.liveTelemetry.publicFunctionCalls,1);
  assert.equal(evidence.liveTelemetry.rawWriteCalls,0);
  assert.equal(evidence.liveTelemetry.sameIntentRetry,false);
  assert.equal(evidence.liveTelemetry.exchangeAuthority,false);
  assert.equal(evidence.liveTelemetry.gameplayAuthority,false);
  assert.equal(evidence.liveTelemetry.rawWriteAuthority,false);
  assert.ok(evidence.liveTelemetry.recipient.distanceToExchange<=300);
  assert.equal(evidence.safetyConclusion.exchangeAttempted,false);
  assert.equal(evidence.safetyConclusion.anniversarygiftConsumed,false);
  assert.equal(evidence.safetyConclusion.productiveRunnerMayBeRestored,true);
});

test("restore cutover requires ratified service mount and pins original productive runner",()=>{
  assert.equal(cutover.status,"MANIFEST_RESTORE_PREPARED");
  assert.equal(cutover.sourceMain,"3d4fc0f7014e22913ee8f240fb64f6fd012cc984");
  assert.equal(cutover.prerequisite.requiredServiceMountStatus,
    "RATIFIED_EXCHANGE_SERVICE_REACHED_ONE_MOVEMENT");
  assert.equal(cutover.prerequisite.requiredNotificationId,2921);
  assert.equal(cutover.prerequisite.requiredMovementCompleted,true);
  assert.equal(cutover.prerequisite.requiredMaximumGameplayWrites,1);
  assert.equal(cutover.prerequisite.requiredMaximumPublicFunctionCalls,1);
  assert.equal(cutover.prerequisite.requiredRawWriteCalls,0);
  assert.equal(cutover.prerequisite.requiredSameIntentRetry,false);
  assert.equal(cutover.prerequisite.requiredExchangeAuthority,false);
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

test("historical restored productive bytes remain exact while active manifest advances to 5m",()=>{
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
  assert.notEqual(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.testId,"pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live");
});

test("restored productive boundary is still exactly-once and fail-closed",()=>{
  const b=cutover.productiveBoundary;
  assert.equal(b.exactItem,"anniversarygift");
  assert.equal(b.exchangeQuantity,1);
  assert.equal(b.minimumEmptyInventorySlots,1);
  assert.equal(b.freshPhysicalIndexReresolutionRequired,true);
  assert.equal(b.stableDoubleObservationRequired,true);
  assert.equal(b.qMustBeEmpty,true);
  assert.equal(b.massExchangeForbidden,true);
  assert.equal(b.massExchangePpForbidden,true);
  assert.equal(b.maximumGameplayWrites,1);
  assert.equal(b.maximumPublicFunctionCalls,1);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.exactPublicFunction,"exchange");
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.unknownOutcomeBlindRetryForbidden,true);
});

test("roadmap records service mount as ratified and only restores productive deployment",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const mount=a.anniversaryGiftServiceMount;
  const live=a.anniversaryGiftProductiveOneWrite;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_ONE_WRITE_MANIFEST_CUTOVER_PREPARED");
  assert.equal(roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_PRODUCTIVE_ONE_WRITE");
  assert.equal(a.status,
    "ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(mount.status,"RATIFIED_EXCHANGE_SERVICE_REACHED_ONE_MOVEMENT");
  assert.equal(mount.deployed,true);
  assert.equal(mount.liveEvidenceObserved,true);
  assert.equal(mount.latestNotificationId,2921);
  assert.equal(mount.latestMovementCompleted,true);
  assert.equal(mount.latestGameplayWrites,1);
  assert.equal(mount.latestPublicFunctionCalls,1);
  assert.equal(mount.latestRawWriteCalls,0);
  assert.equal(mount.latestSameIntentRetry,false);
  assert.ok(mount.latestObservedDistanceToExchange<=300);
  assert.equal(mount.exchangeAuthority,false);
  assert.equal(live.status,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.exchangeAuthority,false);
  assert.equal(live.gameplayAuthority,false);
  assert.equal(live.rawWriteAuthority,false);
  assert.equal(live.normalRuntimeAllowed,false);
});
