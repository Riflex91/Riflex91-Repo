import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-durable-shadow-manifest-cutover.json",
  "utf8",
));
const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-durable-shadow-preparation.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("anniversarygift shadow cutover pins the exact prepared no-send package",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(cutover.sourceMain,"2ae338ac33f0088644593631f068407e9681fcb5");
  assert.equal(cutover.prerequisite.requiredPreparationStatus,"PREPARED_NO_WRITE");
  assert.equal(cutover.prerequisite.requiredEvidenceStatus,
    "RATIFIED_ANNIVERSARYGIFT_EXCHANGE_CANDIDATE_ZERO_WRITE");
  assert.equal(cutover.prerequisite.notificationId,2726);
  assert.equal(cutover.manifest.testId,
    "pr20-8-exchange-anniversarygift-durable-shadow-no-write");
  assert.equal(cutover.manifest.controllerVersion,"1.0.0");
  assert.equal(cutover.manifest.sourceCommit,
    "737118b5ab4d043ca996594aa6db1df309a6a177");
  assert.equal(cutover.manifest.packageSha256,
    "04c765fc9d88b242170ca15d0d28d8dcca84572a745dcaa09ebf0c1caa44135e");
  assert.equal(cutover.manifest.packageBytes,24528);
  assert.equal(cutover.manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftDurableShadowNoWrite");
  assert.equal(cutover.manifest.normalRuntimeAllowed,false);
});

test("historical shadow cutover package bytes remain exact after later manifest advance",()=>{
  const packagePath=cutover.manifest.packagePath.replace(/^v5\//,"");
  const bytes=fs.readFileSync(packagePath);
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
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m-v1-0-3");
});

test("cutover remains no-send, no-authority and non-ratifying",()=>{
  const b=cutover.deploymentBoundary;
  assert.equal(b.bridgeMayDeployPinnedRunner,true);
  assert.equal(b.localStorageShadowWriteAllowed,true);
  assert.equal(b.gameplayWriteAllowed,false);
  assert.equal(b.publicExchangeCallAllowed,false);
  assert.equal(b.rawWriteAllowed,false);
  assert.equal(b.exchangeAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.normalExchangeWriteRatification,false);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.deploymentCountsAsExchangeRatification,false);
  assert.equal(cutover.expectedLiveOutcome.journalTerminalArt,"ABBRUCH");
  assert.equal(cutover.expectedLiveOutcome.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(cutover.expectedLiveOutcome.gameplayWrites,0);
  assert.equal(cutover.expectedLiveOutcome.publicFunctionCalls,0);
  assert.equal(cutover.expectedLiveOutcome.rawWriteCalls,0);
});

test("preparation contract stays immutable while deployment state advances",()=>{
  assert.equal(prep.status,"PREPARED_NO_WRITE");
  assert.equal(prep.deployment.autonomousManifestChanged,false);
  assert.equal(prep.deployment.manifestCutoverPrepared,false);
  assert.equal(prep.deployment.deployed,false);
  assert.equal(prep.authorityBoundary.exchangeAuthority,false);
  assert.equal(prep.authorityBoundary.normalRuntimeAllowed,false);
});

test("roadmap advances only to shadow deployment observation",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const shadow=a.anniversaryGiftExchangeShadow;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_RATIFIED_PR20_8_COMPLETE");
  assert.equal(roadmap.pr20_8.nextAction,
    "ADVANCE_TO_PR20_9_PRODUCTION");
  assert.equal(a.status,"ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(shadow.status,"RATIFIED_LIVE_DURABLE_SHADOW_NO_SEND");
  assert.equal(shadow.manifestCutoverPrepared,true);
  assert.equal(shadow.deployed,true);
  assert.equal(shadow.liveEvidenceObserved,true);
  assert.equal(shadow.exchangeAuthority,false);
  assert.equal(shadow.gameplayAuthority,false);
  assert.equal(shadow.rawWriteAuthority,false);
  assert.equal(shadow.normalRuntimeAllowed,false);
  assert.equal(a.seashellFarmShadow.activePath,false);
});
