import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-live-5m-evidence.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("Exchange anniversarygift 5m evidence ratifies persisted terminal completion",()=>{
  assert.equal(evidence.status,"RATIFIED_BESTANDEN_ZERO_ADDITIONAL_MUTATION");
  assert.equal(evidence.liveTelemetry.notificationId,2986);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790355794825);
  assert.equal(evidence.liveTelemetry.observedAtMs,1790356094190);
  assert.equal(evidence.liveTelemetry.completionNotificationPersisted,true);
  assert.equal(evidence.liveTelemetry.status,"BESTANDEN");
  assert.equal(evidence.liveTelemetry.phase,"COMPLETE");
  assert.equal(evidence.liveTelemetry.terminal,true);
});

test("Exchange anniversarygift 5m evidence proves full soak with zero new mutation",()=>{
  assert.equal(evidence.soak.status,"BESTANDEN");
  assert.equal(evidence.soak.samples,60);
  assert.equal(evidence.soak.minimumSamples,60);
  assert.equal(evidence.soak.intervalMs,5000);
  assert.equal(evidence.soak.durationMs,299012);
  assert.equal(evidence.soak.minimumDurationMs,299000);
  assert.ok(evidence.soak.durationMs>=evidence.soak.minimumDurationMs);
  assert.equal(evidence.soak.restartCount,0);
  assert.equal(evidence.sourceTransaction.intentStatus,"COMMITTED");
  assert.equal(evidence.sourceTransaction.terminal,true);
  assert.equal(evidence.sourceTransaction.sendCount,1);
  assert.equal(evidence.sourceTransaction.reconciliation,"COMMITTED");
  assert.equal(evidence.sourceTransaction.rewardKind,"gold");
  assert.equal(evidence.sourceTransaction.goldDelta,5000);
  assert.equal(evidence.sourceTransaction.inputDelta,-1);
  assert.equal(evidence.sourceTransaction.authorityConsumed,true);
  assert.equal(evidence.sourceTransaction.authorityUses,1);
  assert.equal(evidence.sourceTransaction.authorityMaximumUses,1);
  assert.equal(evidence.sourceTransaction.activeSourceFences,0);
  assert.equal(evidence.additionalMutationCounters.gameplayWrites,0);
  assert.equal(evidence.additionalMutationCounters.publicFunctionCalls,0);
  assert.equal(evidence.additionalMutationCounters.rawWriteCalls,0);
  assert.equal(evidence.additionalMutationCounters.sameIntentRetry,false);
  assert.equal(evidence.additionalMutationCounters.noResendPathPresent,true);
});

test("Exchange anniversarygift 5m final postcondition remains exact",()=>{
  const p=evidence.postcondition;
  assert.equal(p.stable,true);
  assert.equal(p.recipient.characterName,"My_Merchant");
  assert.equal(p.recipient.sessionId,"My_Merchant");
  assert.equal(p.recipient.ctype,"merchant");
  assert.equal(p.recipient.serverRegion,"EU");
  assert.equal(p.recipient.serverIdentifier,"I");
  assert.deepEqual(p.input,{name:"anniversarygift",index:4,quantity:105});
  assert.equal(p.gold,14429844);
  assert.equal(p.expectedGold,14429844);
  assert.equal(p.goldExact,true);
  assert.equal(p.aggregateExact,true);
  assert.equal(p.qClear,true);
  assert.equal(p.exchangeQueueClear,true);
  assert.equal(p.placeholderCount,0);
  assert.equal(p.massexchangePresent,false);
  assert.equal(p.massexchangeppPresent,false);
  assert.equal(p.moving,false);
  assert.equal(p.targetClear,true);
  assert.equal(evidence.performanceTrick.active,true);
  assert.equal(evidence.performanceTrick.verification,"HOWLER_PLAYING_TRUE");
});

test("Exchange 5m package pin remains exact",()=>{
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

test("roadmap closes Exchange 5m but keeps autonomy and PR20.9 blocked",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const live=a.anniversaryGiftExchangeLive5m;
  const exit=roadmap.pr20_8.exitGateReview;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_RATIFIED_NO_WRITE");
  assert.equal(live.status,"RATIFIED_BESTANDEN_ZERO_ADDITIONAL_MUTATION");
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.exchangeLive5mTested,true);
  assert.equal(live.latestNotificationId,2986);
  assert.equal(live.latestSamples,60);
  assert.equal(live.latestDurationMs,299012);
  assert.equal(live.latestAdditionalGameplayWrites,0);
  assert.equal(live.latestAdditionalPublicFunctionCalls,0);
  assert.equal(live.latestAdditionalRawWriteCalls,0);
  assert.equal(exit.exchangeRatified,true);
  assert.equal(exit.exchangeLive5mTested,true);
  assert.equal(exit.exchangeAutonomyProductiveProven,false);
  assert.equal(exit.currentExitGateSatisfied,false);
  assert.equal(exit.mayAdvanceToPr20_9,false);
});
