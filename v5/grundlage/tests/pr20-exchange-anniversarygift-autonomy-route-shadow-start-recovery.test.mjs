import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-autonomy-route-shadow-start-recovery.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const packagePath="werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-1.js";
const packageBytes=fs.readFileSync(packagePath);
const packageSource=packageBytes.toString("utf8");

test("PR20.8 autonomy route shadow recovery records the observed live BOOT stall without ratifying it",()=>{
  assert.equal(contract.status,"LIVE_BOOT_STALL_OBSERVED_RECOVERY_PREPARED_NO_WRITE");
  const o=contract.observedLiveBootStall;
  assert.equal(o.botId,"pi-main");
  assert.equal(o.runStartedAtMs,1790361264446);
  assert.equal(o.debugBatchId,8348);
  assert.equal(o.status,"BOOT");
  assert.equal(o.terminal,false);
  assert.equal(o.notificationObserved,false);
  assert.equal(o.processRunning,true);
  assert.equal(o.restartCount,0);
  assert.equal(o.gameplayWrites,0);
  assert.equal(o.publicFunctionCalls,0);
  assert.equal(o.rawWriteCalls,0);
  assert.equal(o.authorityIssued,false);
  assert.equal(o.sameIntentRetry,false);
  assert.equal(o.normalRuntimeAllowed,false);
  assert.equal(o.exactCauseProven,false);
  assert.equal(o.boundedFinding,"NO_PROGRESS_OBSERVED_BEYOND_INITIAL_BOOT_SNAPSHOT");
});

test("v1.0.1 recovery package is exact pinned and remains gameplay no-write",()=>{
  const p=contract.recoveryPackage;
  assert.equal(p.testId,"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write");
  assert.equal(p.controllerVersion,"1.0.1");
  assert.equal(p.sourceCommit,"9e1066800aaf92cccaaf088c846df1057e4a8eaa");
  assert.equal(p.packageSha256,"9a459d62653f0420c89343196ce2469611e01d110ebab2d2717cb54bb7596604");
  assert.equal(p.packageBytes,33769);
  assert.equal(packageBytes.length,p.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(packageBytes).digest("hex"),
    p.packageSha256,
  );
  const pinned=execFileSync("git",[
    "show",p.sourceCommit+":"+p.packagePath,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,packageBytes);
  assert.equal(p.directAsyncEntry,true);
  assert.equal(p.synchronousProgressBeforeFirstAwait,true);
  assert.equal(p.asyncStageTimeoutMs,2000);
  assert.equal(p.webCryptoTimeoutFailClosed,true);
  assert.deepEqual(p.exactLegacyTerminalVersionRecoveryAllowed,["1.0.0","1.0.1"]);
  assert.equal(p.legacyRecoveryRewritesDecision,false);

  for(const marker of [
    "globalThis.exchange(",
    "parent.exchange(",
    ".exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "smart_move(",
    "move(",
    "upgrade(",
    "compound(",
    "buy(",
    "trade_buy(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
  ]) assert.equal(packageSource.includes(marker),false,marker);
});

test("active manifest is exactly the v1.0.1 no-write recovery",()=>{
  const p=contract.recoveryPackage;
  assert.equal(manifest.testId,p.testId);
  assert.equal(manifest.controllerVersion,p.controllerVersion);
  assert.equal(manifest.sourceCommit,p.sourceCommit);
  assert.equal(manifest.packagePath,p.packagePath);
  assert.equal(manifest.packageSha256,p.packageSha256);
  assert.equal(manifest.expectedGlobal,p.expectedGlobal);
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("roadmap advances only to recovery observation and keeps productive autonomy blocked",()=>{
  const p=roadmap.pr20_8;
  const s=p.exchangeCandidateAcquisition.anniversaryGiftExchangeAutonomyRouteShadow;
  assert.equal(
    p.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_MANIFEST_CUTOVER_PREPARED_NO_WRITE",
  );
  assert.equal(
    p.nextAction,
    "DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_V1_0_1",
  );
  assert.equal(
    p.exchangeCandidateAcquisition.status,
    "ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_MANIFEST_CUTOVER_PREPARED_NO_WRITE",
  );
  assert.equal(s.status,"START_RECOVERY_MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(s.controllerVersion,"1.0.1");
  assert.equal(s.manifestCutoverPrepared,true);
  assert.equal(s.deployed,false);
  assert.equal(s.liveEvidenceObserved,false);
  assert.equal(s.productiveAutonomyProven,false);
  assert.equal(s.maximumGameplayWrites,0);
  assert.equal(s.maximumPublicFunctionCalls,0);
  assert.equal(s.maximumRawWriteCalls,0);
  assert.equal(s.exchangeAuthority,false);
  assert.equal(s.gameplayAuthority,false);
  assert.equal(s.rawWriteAuthority,false);
  assert.equal(s.movementAuthority,false);
  assert.equal(s.normalRuntimeAllowed,false);
  assert.equal(p.exitGateReview.exchangeAutonomyProductiveProven,false);
  assert.equal(p.exitGateReview.currentExitGateSatisfied,false);
  assert.equal(p.exitGateReview.mayAdvanceToPr20_9,false);
  assert.ok(roadmap.pr20_9.blockedBy.includes("PR20.8"));
  assert.equal(roadmap.pr20_9.liveExecutionAllowed,false);
});
