import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-live-5m-evidence.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));

test("PR20.8 Compound 5m evidence ratifies persisted terminal completion",()=>{
  assert.equal(evidence.status,"RATIFIED_BESTANDEN_ZERO_ADDITIONAL_MUTATION");
  assert.equal(evidence.evidenceArt,"V5_PR20_8_COMPOUND_LIVE_5M_POSTCOMMIT_RATIFICATION");
  assert.equal(evidence.manifestMainCommit,"1e3e61a49e57e078991c29b0d08102579100fddd");
  assert.equal(evidence.package.testId,"pr20-8-compound-live-5m");
  assert.equal(evidence.package.controllerVersion,"1.0.2");
  assert.equal(evidence.package.sourceCommit,"18568cbc9689bd7e27c5a26a4342901d470b72c0");
  assert.equal(evidence.package.path,"v5/werkzeuge/pr20-8-compound-live-5m-v1-0-2.js");
  assert.equal(evidence.package.sha256,"4d9083bf163d98f15d842d64ecfc49ae4c9b8c3452b0b31a499d4b0b5687c849");
  assert.equal(evidence.package.bytes,28166);
  assert.equal(evidence.liveTelemetry.notificationId,2272);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790310011908);
  assert.equal(evidence.liveTelemetry.runIdentityNonZero,true);
  assert.equal(evidence.liveTelemetry.completionNotificationPersisted,true);
  assert.equal(evidence.controller.status,"BESTANDEN");
  assert.equal(evidence.controller.phase,"COMPLETE");
  assert.equal(evidence.controller.terminal,true);
  assert.equal(evidence.controller.startedAtMs,1790310011908);
});

test("PR20.8 Compound 5m evidence proves the full soak without new mutation",()=>{
  assert.equal(evidence.soak.status,"BESTANDEN");
  assert.equal(evidence.soak.samples,60);
  assert.equal(evidence.soak.minimumSamples,60);
  assert.equal(evidence.soak.intervalMs,5000);
  assert.equal(evidence.soak.durationMs,300545);
  assert.equal(evidence.soak.minimumDurationMs,299000);
  assert.ok(evidence.soak.durationMs>=evidence.soak.minimumDurationMs);
  assert.equal(evidence.sourceTransaction.status,"COMMITTED");
  assert.equal(evidence.sourceTransaction.terminal,true);
  assert.equal(evidence.sourceTransaction.sendCount,1);
  assert.equal(evidence.sourceTransaction.reconciliation,"COMMITTED_SUCCESS");
  assert.equal(evidence.sourceTransaction.authorityConsumed,true);
  assert.equal(evidence.sourceTransaction.authorityUses,1);
  assert.equal(evidence.sourceTransaction.authorityMaximumUses,1);
  assert.equal(evidence.sourceTransaction.activeFences,0);
  assert.equal(evidence.additionalMutationCounters.gameplayWrites,0);
  assert.equal(evidence.additionalMutationCounters.publicFunctionCalls,0);
  assert.equal(evidence.additionalMutationCounters.rawWriteCalls,0);
  assert.equal(evidence.additionalMutationCounters.sameIntentRetry,false);
  assert.equal(evidence.additionalMutationCounters.noResendPathPresent,true);
});

test("PR20.8 Compound 5m final postcondition stays exact",()=>{
  const p=evidence.postcondition;
  assert.equal(p.stable,true);
  assert.equal(p.recipient.characterName,"My_Merchant");
  assert.equal(p.recipient.sessionId,"My_Merchant");
  assert.equal(p.recipient.ctype,"merchant");
  assert.equal(p.recipient.serverRegion,"EU");
  assert.equal(p.recipient.serverIdentifier,"I");
  assert.deepEqual(p.resultItem,{name:"hpamulet",index:1,level:1});
  assert.deepEqual(p.consumedInputIndexes,[22,23]);
  assert.equal(p.consumedInputsEmpty,true);
  assert.deepEqual(p.scroll,{name:"cscroll0",index:18,quantity:19});
  assert.equal(p.qClear,true);
  assert.equal(p.compoundQueueClear,true);
  assert.equal(p.placeholderCount,0);
  assert.equal(p.compoundEffectsClear,true);
  assert.equal(p.massproductionPresent,false);
  assert.equal(p.massproductionppPresent,false);
  assert.equal(evidence.performanceTrick.verification,"HOWLER_PLAYING_TRUE");
  assert.equal(evidence.performanceTrick.active,true);
});

test("notification identity recovery re-published only the existing terminal success",()=>{
  const r=evidence.notificationIdentityRecovery;
  assert.equal(r.fromControllerVersion,"1.0.1");
  assert.equal(r.priorSuccessfulBehaviorObserved,true);
  assert.equal(r.priorRunStartedAtMs,0);
  assert.equal(r.priorCompletionNotificationPersisted,false);
  assert.equal(r.priorCollisionNotificationId,2221);
  assert.equal(r.uniqueConstraint,"UNIQUE (bot_id, test_id, run_started_at_ms)");
  assert.equal(r.recoveredWithoutResampling,true);
  assert.equal(r.recoveredWithoutResend,true);
  assert.equal(r.recoveredTerminalEvent,"PR20_8_COMPOUND_5M_TERMINAL_RECOVERED");
  assert.equal(r.stableRunIdentityFromPersistedSoakStartedAtMs,true);
});

test("Compound 5m ratification closes only Compound and leaves PR20.8 blocked by Exchange",()=>{
  const s=evidence.safetyBoundary;
  assert.equal(s.compoundWriteRatified,true);
  assert.equal(s.compoundLive5mTested,true);
  assert.equal(s.live5mCriterionRelaxed,false);
  assert.equal(s.noDuplicateValueChangingEffectObserved,true);
  assert.equal(s.exactAdditionalGameplayWritesObserved,0);
  assert.equal(s.exactAdditionalPublicFunctionCallsObserved,0);
  assert.equal(s.exactAdditionalRawWriteCallsObserved,0);
  assert.equal(s.exchangeRatification,false);
  assert.equal(s.exchangeLive5mTested,false);
  assert.equal(s.exchangeAutonomyProductiveProven,false);
  assert.equal(s.exchangeWriteAuthority,false);
  assert.equal(s.pr20_8ExitGateSatisfied,false);
  assert.equal(s.mayAdvanceToPr20_9,false);
  assert.equal(s.acquisitionOrMutationToCreateExchangeCandidateAllowed,false);
  assert.equal(s.normalRuntimeAllowed,false);
  assert.equal(evidence.nextGate,"PR20_8_NO_CANDIDATE_CLOSEOUT_REVIEW");
});

test("Compound 5m evidence stays immutable while the active manifest advances to the anniversarygift Exchange service mount",()=>{
  assert.equal(manifest.testId,"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"578b18dfa96fd7c4809d55aae4664eae5f37eb43");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-0.js");
  assert.equal(manifest.packageSha256,"39084a646825c6bca6231b0968e41cebfbbf3548e8a93bba155dcb64b2fbf2be");
  assert.equal(manifest.expectedGlobal,"V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite");
  assert.equal(manifest.normalRuntimeAllowed,false);
});
