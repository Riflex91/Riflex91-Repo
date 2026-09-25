import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-productive-one-write-service-block-evidence.json","utf8"
));
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-service-mount.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("service-unreachable live evidence is exact zero-write",()=>{
  assert.equal(evidence.status,"RATIFIED_ZERO_WRITE_SERVICE_UNREACHABLE");
  assert.equal(evidence.sourceMain,"0c96fdf5ab513c7f1b12a779acc7c27477eb0c61");
  assert.equal(evidence.testId,
    "pr20-8-exchange-anniversarygift-productive-one-write-live");
  assert.equal(evidence.controllerVersion,"1.0.0");
  assert.deepEqual(evidence.observations.map(x=>x.notificationId),[2811,2813]);
  for(const o of evidence.observations){
    assert.equal(o.terminalStatus,"FEHLER");
    assert.equal(o.phase,"ERROR");
    assert.deepEqual(o.blocker,[
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SERVICE_NICHT_ERREICHBAR"
    ]);
    assert.equal(o.gameplayWrites,0);
    assert.equal(o.publicFunctionCalls,0);
    assert.equal(o.rawWriteCalls,0);
    assert.equal(o.authorityIssued,false);
    assert.equal(o.authorityConsumed,false);
    assert.equal(o.exchangeAuthority,false);
    assert.equal(o.durableIntentCreated,false);
  }
  assert.equal(evidence.safetyConclusion.productiveExchangeAttempted,false);
  assert.equal(evidence.safetyConclusion.anniversarygiftConsumed,false);
  assert.equal(evidence.safetyConclusion.rewardGenerated,false);
  assert.equal(evidence.safetyConclusion.retryAuthorityIssued,false);
  assert.equal(evidence.safetyConclusion.sameIntentRetry,false);
  assert.equal(evidence.safetyConclusion.servicePositioningRequired,true);
});

test("service mount package is pinned to one durable smart_move exchange",()=>{
  assert.equal(contract.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(contract.prerequisite.requiredEvidenceStatus,
    "RATIFIED_ZERO_WRITE_SERVICE_UNREACHABLE");
  assert.equal(contract.prerequisite.productiveExchangeAttempted,false);
  assert.equal(contract.package.testId,
    "pr20-8-exchange-anniversarygift-service-mount");
  assert.equal(contract.package.controllerVersion,"1.0.0");
  assert.equal(contract.package.sourceCommit,
    "72e01a9dd911e9a21c8e6d2002851c707f130c98");
  assert.equal(contract.package.sha256,
    "c2a58c21a648ce17693029965380e4c343012d90de528edb43fc1b4a1946b163");
  assert.equal(contract.package.bytes,16659);
  assert.equal(contract.package.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftServiceMount");
  assert.equal(contract.sourcePin.targetNpcId,"exchange");
  assert.deepEqual(contract.sourcePin.targetPoint,{map:"main",x:-25,y:-478});
  assert.equal(contract.sourcePin.sellDistance,400);
  assert.equal(contract.sourcePin.safetyDistance,300);
  assert.equal(contract.movementBoundary.exactPublicFunction,"smart_move");
  assert.equal(contract.movementBoundary.exactArgument,"exchange");
  assert.equal(contract.movementBoundary.maximumGameplayWrites,1);
  assert.equal(contract.movementBoundary.maximumPublicFunctionCalls,1);
  assert.equal(contract.movementBoundary.maximumRawWriteCalls,0);
  assert.equal(contract.movementBoundary.oneShot,true);
  assert.equal(contract.movementBoundary.durableSendJournal,true);
  assert.equal(contract.movementBoundary.sameIntentRetry,false);
  assert.equal(contract.prohibitedInThisStage.exchange,true);
  assert.equal(contract.evidenceSeparation.exchangeWriteAuthority,false);
  assert.equal(contract.evidenceSeparation.normalRuntimeAllowed,false);
});

test("service mount bytes and pinned source commit are exact",()=>{
  const local=contract.package.path.replace(/^v5\//,"");
  const bytes=fs.readFileSync(local);
  assert.equal(bytes.length,contract.package.bytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    contract.package.sha256
  );
  const pinned=execFileSync("git",[
    "show",contract.package.sourceCommit+":"+contract.package.path,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,bytes);
});

test("historical service mount remains exact while active manifest returns to productive one-write",()=>{
  assert.notEqual(manifest.testId,contract.package.testId);
  assert.equal(manifest.testId,
    "pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,
    "578b18dfa96fd7c4809d55aae4664eae5f37eb43");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-0.js");
  assert.equal(manifest.packageSha256,
    "39084a646825c6bca6231b0968e41cebfbbf3548e8a93bba155dcb64b2fbf2be");
  assert.equal(manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite");
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("roadmap ratifies service mount and restores productive one-write deployment",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const live=a.anniversaryGiftProductiveOneWrite;
  const mount=a.anniversaryGiftServiceMount;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_V1_0_1");
  assert.equal(a.status,
    "ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(live.status,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.latestNotificationId,2949);
  assert.equal(live.latestGameplayWrites,1);
  assert.equal(live.latestPublicFunctionCalls,1);
  assert.equal(live.latestRawWriteCalls,0);
  assert.equal(live.exchangeAuthority,false);
  assert.equal(mount.status,"RATIFIED_EXCHANGE_SERVICE_REACHED_ONE_MOVEMENT");
  assert.equal(mount.manifestCutoverPrepared,true);
  assert.equal(mount.deployed,true);
  assert.equal(mount.liveEvidenceObserved,true);
  assert.equal(mount.latestNotificationId,2921);
  assert.equal(mount.latestMovementIssued,true);
  assert.equal(mount.latestMovementCompleted,true);
  assert.equal(mount.latestGameplayWrites,1);
  assert.equal(mount.latestPublicFunctionCalls,1);
  assert.equal(mount.latestRawWriteCalls,0);
  assert.equal(mount.latestSameIntentRetry,false);
  assert.ok(mount.latestObservedDistanceToExchange<=300);
  assert.equal(mount.exchangeAuthority,false);
  assert.equal(mount.normalRuntimeAllowed,false);
});
