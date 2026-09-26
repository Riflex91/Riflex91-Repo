import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-autonomy-route-shadow-evidence.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));

test("autonomy route shadow evidence ratifies persisted real-browser completion",()=>{
  assert.equal(evidence.status,"RATIFIED_BESTANDEN_AUTONOMY_ROUTE_ZERO_WRITE");
  assert.equal(evidence.manifestMainCommit,"3fde62bd75aaed495b60cc71b1cfc4c197af4316");
  assert.equal(evidence.liveTelemetry.notificationId,3020);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790361264446);
  assert.equal(evidence.liveTelemetry.observedAtMs,1790361265162);
  assert.equal(evidence.liveTelemetry.completionNotificationPersisted,true);
  assert.equal(evidence.liveTelemetry.emailStatus,"SENT");
  assert.equal(evidence.liveTelemetry.status,"BESTANDEN");
  assert.equal(evidence.liveTelemetry.phase,"COMPLETE");
  assert.equal(evidence.liveTelemetry.terminal,true);
  assert.equal(evidence.liveTelemetry.processRunningAfterCompletion,true);
  assert.equal(evidence.liveTelemetry.restartCountAfterCompletion,0);
});

test("autonomy route shadow proves fresh self-selection without index authority",()=>{
  const s=evidence.autonomousSelection;
  assert.equal(s.exactItem,"anniversarygift");
  assert.equal(s.observedCandidateIndex,4);
  assert.equal(s.observedQuantity,105);
  assert.equal(s.exchangeQuantity,1);
  assert.equal(s.baseGold,100);
  assert.equal(s.exclusive,true);
  assert.equal(s.selectionMode,"AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN");
  assert.equal(s.manualPinnedInventoryIndex,false);
  assert.equal(s.observedIndexCarriesAuthority,false);
  assert.equal(s.priorCommittedTransactionGrantsAuthority,false);
});

test("autonomy route shadow durable decision is read back but never authorizes send",()=>{
  const d=evidence.durableDecision;
  assert.equal(d.storage,"LOCAL_STORAGE_SHADOW_ONLY");
  assert.equal(d.createdThisRun,true);
  assert.equal(d.durableReadback,true);
  assert.equal(d.terminalArt,"ABBRUCH");
  assert.equal(d.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(d.authorityIssued,false);
  assert.equal(d.sameIntentRetry,false);
  assert.equal(d.recoveredExistingTerminal,false);
  assert.equal(d.freshCandidateReresolutionRequiredBeforeFutureSend,true);
  assert.equal(evidence.routeAdmission.serviceReachable,true);
  assert.equal(evidence.routeAdmission.visibleEmptySlots,20);
  assert.equal(evidence.routeAdmission.esize,20);
  assert.equal(evidence.routeAdmission.performanceTrickActive,true);
  assert.equal(evidence.routeAdmission.performanceTrickVerification,"HOWLER_PLAYING_TRUE");
  assert.equal(evidence.routeAdmission.stableDoubleObservationRequiredByRunner,true);
  assert.equal(evidence.routeAdmission.terminalCompletionObserved,true);
});

test("autonomy route shadow remains exact zero gameplay/public/raw write",()=>{
  const c=evidence.noWriteCounters;
  assert.equal(c.gameplayWrites,0);
  assert.equal(c.publicFunctionCalls,0);
  assert.equal(c.rawWriteCalls,0);
  assert.equal(c.durableStorageWrites,1);
  assert.equal(c.startCalls,0);
  assert.equal(c.disconnectCalls,0);
  assert.equal(c.farmerWorkersInstalled,0);
  const b=evidence.safetyBoundary;
  assert.equal(b.exchangeAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.movementAuthority,false);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.normalExchangeWriteRatification,false);
  assert.equal(b.productiveAutonomyProven,false);
  assert.equal(b.exchangeAutonomyProductiveProven,false);
  assert.equal(b.pr20_8ExitGateSatisfied,false);
  assert.equal(b.mayAdvanceToPr20_9,false);
});

test("autonomy route shadow package pin remains exact",()=>{
  const local=evidence.package.path.replace(/^v5\//,"");
  const bytes=fs.readFileSync(local);
  assert.equal(bytes.length,evidence.package.bytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    evidence.package.sha256
  );
  const pinned=execFileSync("git",[
    "show",evidence.package.sourceCommit+":"+evidence.package.path,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,bytes);
});

test("ratified route-shadow evidence stays immutable while active manifest advances to productive autonomy one-write",()=>{
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"ac265002a8c86418e17fd1f3d7ed426007b99dd0");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr21-merchant-integration-live-15m.js");
  assert.equal(manifest.packageSha256,"4066d751ac0a9f67db7f3eb318b6a1ffc882b37c4b93638c6151403a8616e1f9");
  assert.equal(manifest.expectedGlobal,"V5PR21MerchantIntegrationLive15m");
  assert.equal(manifest.normalRuntimeAllowed,false);

  const p=roadmap.pr20_8;
  const s=p.exchangeCandidateAcquisition.anniversaryGiftExchangeAutonomyRouteShadow;
  assert.equal(p.status,"EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_RATIFIED_PR20_8_COMPLETE");
  assert.equal(p.nextAction,"ADVANCE_TO_PR20_9_PRODUCTION");
  assert.equal(s.status,"RATIFIED_BESTANDEN_AUTONOMY_ROUTE_ZERO_WRITE");
  assert.equal(s.deployed,true);
  assert.equal(s.liveEvidenceObserved,true);
  assert.equal(s.evidence,"v5/roadmap/pr20-8-exchange-anniversarygift-autonomy-route-shadow-evidence.json");
  assert.equal(s.latestNotificationId,3020);
  assert.equal(s.latestObservedCandidateIndex,4);
  assert.equal(s.latestGameplayWrites,0);
  assert.equal(s.latestPublicFunctionCalls,0);
  assert.equal(s.latestRawWriteCalls,0);
  assert.equal(s.latestAuthorityIssued,false);
  assert.equal(s.productiveAutonomyProven,false);
  assert.equal(p.exitGateReview.exchangeAutonomyProductiveProven,true);
  assert.equal(p.exitGateReview.currentExitGateSatisfied,true);
  assert.equal(p.exitGateReview.mayAdvanceToPr20_9,true);
});
