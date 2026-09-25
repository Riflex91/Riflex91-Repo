import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-autonomy-productive-one-write-evidence.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("autonomous anniversarygift Exchange evidence is persisted terminal COMMITTED",()=>{
  assert.equal(evidence.status,"RATIFIED_BESTANDEN_COMMITTED_AUTONOMOUS_ONE_WRITE");
  assert.equal(evidence.liveTelemetry.notificationId,3080);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790365138987);
  assert.equal(evidence.liveTelemetry.status,"BESTANDEN");
  assert.equal(evidence.liveTelemetry.phase,"COMPLETE");
  assert.equal(evidence.liveTelemetry.terminal,true);
  assert.equal(evidence.liveTelemetry.completionNotificationPersisted,true);
  assert.equal(evidence.transaction.journalStatus,"COMMITTED");
  assert.equal(evidence.reconciliation.classification,"COMMITTED");
});

test("autonomous anniversarygift decision is fresh and carries no historical authority",()=>{
  const a=evidence.autonomousDecision;
  assert.equal(a.createdThisRun,true);
  assert.equal(a.selectionMode,"AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN");
  assert.equal(a.exactItem,"anniversarygift");
  assert.equal(a.exchangeQuantity,1);
  assert.equal(a.exclusive,true);
  assert.equal(a.manualPinnedInventoryIndex,false);
  assert.equal(a.observedIndexCarriesAuthority,false);
  assert.equal(a.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(a.durableReadback,true);
});

test("autonomous anniversarygift transaction is exactly one public write and no retry",()=>{
  const tx=evidence.transaction;
  assert.equal(tx.sendCount,1);
  assert.equal(tx.publicFunction,"exchange");
  assert.equal(tx.gameplayWrites,1);
  assert.equal(tx.publicFunctionCalls,1);
  assert.equal(tx.rawWriteCalls,0);
  assert.equal(tx.sameIntentRetry,false);
  assert.equal(tx.durableIntentReadback,true);
  assert.equal(evidence.authority.issued,true);
  assert.equal(evidence.authority.consumed,true);
  assert.equal(evidence.authority.maximumUses,1);
  assert.equal(evidence.authority.historicalIndexAuthority,false);
  assert.equal(evidence.authority.priorCommittedTransactionAuthority,false);
  assert.equal(evidence.authority.movementAuthority,false);
});

test("autonomous anniversarygift reconciliation proves exact bounded poststate",()=>{
  const r=evidence.reconciliation;
  assert.equal(r.classification,"COMMITTED");
  assert.equal(r.candidateQuantityBefore,105);
  assert.equal(r.candidateQuantityAfter,104);
  assert.equal(r.inputDelta,-1);
  assert.equal(r.rewardKind,"gold");
  assert.equal(r.goldDelta,5000);
  assert.equal(r.noOtherNegative,true);
  assert.equal(r.inputConsumedExactly,true);
  assert.equal(r.rewardDomainValid,true);
  assert.equal(r.qClear,true);
  assert.equal(r.exchangeQueueClear,true);
  assert.equal(r.placeholderCount,0);
  assert.equal(r.massexchangeClear,true);
  assert.equal(r.massexchangeppClear,true);
  assert.equal(r.movingClear,true);
  assert.equal(r.targetClear,true);
  assert.equal(r.serviceReachable,true);
  assert.ok(r.serviceDistance<=r.serviceSafetyLimit);
});

test("recovery observations prove no duplicate resend",()=>{
  assert.deepEqual(evidence.recoveryObservation.notifications,[3082,3085]);
  assert.equal(evidence.recoveryObservation.sameTransaction,true);
  assert.equal(evidence.recoveryObservation.recoveredExisting,true);
  assert.equal(evidence.recoveryObservation.sendCountStillOne,true);
  assert.equal(evidence.recoveryObservation.noResendObserved,true);
  assert.equal(evidence.recoveryObservation.restartCount,0);
});

test("autonomous package pin remains exact",()=>{
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

test("roadmap closes PR20.8 and permits PR20.9 without enabling normal runtime",()=>{
  const p=roadmap.pr20_8;
  const a=p.exchangeCandidateAcquisition.anniversaryGiftExchangeAutonomyProductiveOneWrite;
  const exit=p.exitGateReview;
  assert.equal(p.status,"EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_RATIFIED_PR20_8_COMPLETE");
  assert.equal(p.nextAction,"ADVANCE_TO_PR20_9_PRODUCTION");
  assert.equal(p.remainingGates.normalExchange,"PRODUCTIVE_ONE_WRITE_COMMITTED_SUCCESS_RATIFIED_LIVE_5M_RATIFIED_AUTONOMY_PRODUCTIVE_RATIFIED");
  assert.equal(a.status,"RATIFIED_BESTANDEN_COMMITTED_AUTONOMOUS_ONE_WRITE");
  assert.equal(a.deployed,true);
  assert.equal(a.liveEvidenceObserved,true);
  assert.equal(a.productiveAutonomyProven,true);
  assert.equal(a.evidence,"v5/roadmap/pr20-8-exchange-anniversarygift-autonomy-productive-one-write-evidence.json");
  assert.equal(a.latestNotificationId,3080);
  assert.equal(exit.exchangeAutonomyProductiveProven,true);
  assert.equal(exit.currentExitGateSatisfied,true);
  assert.equal(exit.mayAdvanceToPr20_9,true);
  assert.equal(exit.remainingBlocker,null);
  assert.equal(p.normalRuntimeAllowed,false);
});
