import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-service-unreachable-evidence.json","utf8"
));
const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-service-reposition-manifest-cutover.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("productive v1.0.0 failed closed before any Exchange write",()=>{
  assert.equal(evidence.status,"RATIFIED_FAIL_CLOSED_ZERO_WRITE_SERVICE_UNREACHABLE");
  assert.equal(evidence.testId,"pr20-8-exchange-anniversarygift-productive-one-write-live");
  assert.equal(evidence.observations.length,2);
  assert.deepEqual(evidence.observations.map(x=>x.notificationId),[2811,2813]);
  for(const x of evidence.observations){
    assert.equal(x.status,"FEHLER");
    assert.equal(x.phase,"ERROR");
    assert.deepEqual(x.blocker,[
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SERVICE_NICHT_ERREICHBAR"
    ]);
    assert.equal(x.gameplayWrites,0);
    assert.equal(x.publicFunctionCalls,0);
    assert.equal(x.rawWriteCalls,0);
    assert.equal(x.durableIntentCreated,false);
    assert.equal(x.authorityIssued,false);
    assert.equal(x.exchangeAuthority,false);
    assert.equal(x.sameIntentRetry,false);
  }
  assert.equal(evidence.safetyConclusion.anniversarygiftConsumed,false);
  assert.equal(evidence.safetyConclusion.exchangeSendAttempted,false);
  assert.equal(evidence.safetyConclusion.productiveOneWriteRatified,false);
  assert.equal(evidence.blockerConclusion.movementRecoveryRequiredBeforeNextProductiveAttempt,true);
  assert.equal(evidence.blockerConclusion.movementAndExchangeMustRemainSeparate,true);
});

test("service reposition source pin resolves smart_move exchange safely",()=>{
  const s=cutover.officialSourcePin;
  assert.equal(s.repository,"kaansoral/adventureland_mongodb");
  assert.equal(s.commit,"90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(s.runnerFunctionsBlob,"8b40ac9931a48995cd179fa4cb6b3057df677b02");
  assert.equal(s.mapsBlob,"78350dac1a18c4eb0e7c6f545ebf08bb3d6729e4");
  assert.equal(s.smartMoveTarget,"exchange");
  assert.deepEqual(s.smartMoveResolvedTarget,{map:"main",x:-26,y:-432});
  assert.deepEqual(s.exchangeNpc,{map:"main",x:-25,y:-478});
  assert.equal(s.sourcePinnedSellDistance,400);
  assert.equal(s.conservativeServiceDistance,300);
  assert.ok(Math.hypot(
    s.smartMoveResolvedTarget.x-s.exchangeNpc.x,
    s.smartMoveResolvedTarget.y-s.exchangeNpc.y,
  )<s.conservativeServiceDistance);
});

test("movement-only manifest and pinned package are exact",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(cutover.sourceMain,"0c96fdf5ab513c7f1b12a779acc7c27477eb0c61");
  assert.equal(cutover.prerequisite.latestNotificationId,2813);
  assert.equal(cutover.manifest.testId,
    "pr20-8-exchange-anniversarygift-service-reposition");
  assert.equal(cutover.manifest.controllerVersion,"1.0.0");
  assert.equal(cutover.manifest.sourceCommit,
    "d7f48070228e1bb620beb39717655287defc4e6f");
  assert.equal(cutover.manifest.packageSha256,
    "21121e5a8465848732b415dc05451935a7679dd33d23a7c42996c2f4456f54f7");
  assert.equal(cutover.manifest.packageBytes,12769);
  assert.equal(cutover.manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftServiceReposition");

  assert.equal(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.controllerVersion,cutover.manifest.controllerVersion);
  assert.equal(manifest.sourceCommit,cutover.manifest.sourceCommit);
  assert.equal(manifest.packagePath,cutover.manifest.packagePath);
  assert.equal(manifest.packageSha256,cutover.manifest.packageSha256);
  assert.equal(manifest.expectedGlobal,cutover.manifest.expectedGlobal);
  assert.equal(manifest.normalRuntimeAllowed,false);

  const path=manifest.packagePath.replace(/^v5\//,"");
  const bytes=fs.readFileSync(path);
  assert.equal(bytes.length,cutover.manifest.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    manifest.packageSha256
  );
  const pinned=execFileSync("git",[
    "show",manifest.sourceCommit+":"+manifest.packagePath,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,bytes);
});

test("reposition is exactly one movement call and grants no Exchange authority",()=>{
  const b=cutover.movementBoundary;
  assert.equal(b.publicFunction,"smart_move");
  assert.equal(b.exactArgument,"exchange");
  assert.equal(b.maximumGameplayWrites,1);
  assert.equal(b.maximumPublicFunctionCalls,1);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.exchangeCallAllowed,false);
  assert.equal(b.exchangeAuthority,false);
  assert.equal(b.gameplayBroadAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.alreadyReachableMayCompleteWithZeroWrites,true);
});

test("movement and productive Exchange stay separate",()=>{
  assert.equal(cutover.separation.movementDoesNotCountAsExchangeRatification,true);
  assert.equal(cutover.separation.movementDoesNotCountAsProductiveOneWrite,true);
  assert.equal(cutover.separation.anniversarygiftMustNotBeConsumed,true);
  assert.equal(cutover.separation.productiveRunnerMustBeVersionBumpedBeforeReturn,true);
  assert.equal(cutover.separation.productiveRunnerV1_0_0TerminalFailureMustNotBeReused,true);
});

test("roadmap records blocked productive v1.0.0 and pending reposition",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const live=a.anniversaryGiftProductiveOneWrite;
  const move=a.anniversaryGiftServiceReposition;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_SERVICE_REPOSITION_MANIFEST_CUTOVER_PREPARED");
  assert.equal(roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_EXCHANGE_SERVICE_REPOSITION");
  assert.equal(a.status,
    "ANNIVERSARYGIFT_SERVICE_REPOSITION_MANIFEST_CUTOVER_PREPARED");
  assert.equal(live.status,"BLOCKED_SERVICE_UNREACHABLE_ZERO_WRITE");
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.latestNotificationId,2813);
  assert.equal(live.latestGameplayWrites,0);
  assert.equal(live.latestPublicFunctionCalls,0);
  assert.equal(live.latestRawWriteCalls,0);
  assert.equal(live.latestAuthorityIssued,false);
  assert.equal(live.productiveOneWriteRatified,false);
  assert.equal(move.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(move.manifestCutoverPrepared,true);
  assert.equal(move.deployed,false);
  assert.equal(move.liveEvidenceObserved,false);
  assert.equal(move.exchangeAuthority,false);
  assert.equal(move.exchangeCallAllowed,false);
  assert.equal(move.normalRuntimeAllowed,false);
});
