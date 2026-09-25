import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-no-candidate-exit-gate-review.json",
  "utf8",
));

test("PR20.8 no-candidate review keeps the roadmap exit gate blocked", () => {
  assert.equal(review.status,"BLOCKED_COMPOUND_5M_NOTIFICATION_EXCHANGE_NO_CANDIDATE");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.equal(review.roadmapCriteriaRelaxed,false);

  const families=review.exitGateCriteria.eachFamilyIndividuallyRatifiedAnd5mLiveTested;
  assert.equal(families.upgrade.ratified,true);
  assert.equal(families.compound.ratified,true);
  assert.equal(families.compound.live5mTested,false);
  assert.equal(families.compound.live5mBehaviorObservedPass,true);
  assert.equal(families.compound.completionNotificationPersisted,false);
  assert.equal(families.compound.reason,"REAL_5M_BEHAVIOR_BESTANDEN_NOTIFICATION_IDENTITY_RECOVERY_PENDING");
  assert.equal(families.exchange.ratified,false);
  assert.equal(families.exchange.live5mTested,false);
  assert.equal(families.exchange.reason,"KEIN_NORMALKANDIDAT");
  assert.equal(review.exitGateCriteria.noDuplicateValueMutationObserved,true);
  assert.equal(review.exitGateCriteria.exchangeAutonomyProductiveProven,false);
});

test("PR20.8 no-candidate evidence cannot silently create authority or substitute ratification", () => {
  assert.equal(review.noCandidateEvidence.ratifiedObservation,true);
  assert.equal(review.noCandidateEvidence.substitutesForCompoundRatification,false);
  assert.equal(review.noCandidateEvidence.substitutesForExchangeRatification,false);
  assert.equal(review.authority.compoundAuthority,false);
  assert.equal(review.authority.exchangeAuthority,false);
  assert.equal(review.authority.gameplayAuthority,false);
  assert.equal(review.authority.rawWriteAuthority,false);
  assert.equal(review.authority.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(review.authority.normalRuntimeAllowed,false);
  assert.deepEqual(review.blockers,[
    "PR20_8_COMPOUND_5M_COMPLETION_NOTIFICATION_NOT_PERSISTED",
    "PR20_8_EXCHANGE_NOT_RATIFIED_NO_NORMAL_CANDIDATE",
    "PR20_8_EXCHANGE_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_AUTONOMY_NOT_PRODUCTIVE_PROVEN",
  ]);
  assert.equal(
    review.nextAction,
    "PR20_8_COMPOUND_LIVE_5M_NOTIFICATION_IDENTITY_RECOVERY_MANIFEST_CUTOVER",
  );
});

test("PR20.8 Compound 5m preparation changes no remaining exit authority", () => {
  const p=review.compoundLive5mPreparation;
  assert.equal(p.status,"MANIFEST_CUTOVER_PREPARED_FOR_REAL_5M");
  assert.equal(
    p.contract,
    "v5/grundlage/vertraege/runtime/pr20-8-compound-live-5m-preparation.json",
  );
  assert.equal(p.additionalGameplayWritesAllowed,0);
  assert.equal(p.additionalPublicFunctionCallsAllowed,0);
  assert.equal(p.rawWriteCallsAllowed,0);
  assert.equal(p.maySetCompoundLive5mTestedOnlyAfterRealFiveMinutePass,true);
  assert.equal(p.runnerPackage,"v5/werkzeuge/pr20-8-compound-live-5m.js");
  assert.equal(
    p.runnerContract,
    "v5/grundlage/vertraege/runtime/pr20-8-compound-live-5m-runner-preparation.json",
  );
  assert.equal(p.publicCompoundCallSites,0);
  assert.equal(p.manifestCutoverPrepared,true);
  assert.equal(p.deployed,false);
  assert.equal(p.bridgeMayDeployPinnedRunner,false);
  assert.equal(p.retiredFromActiveManifest,true);
  assert.equal(p.supersededByPerformanceRecovery,true);
  assert.equal(p.activeRecoveryControllerVersion,"1.0.1");
  assert.equal(p.activeRecoveryPackage,"v5/werkzeuge/pr20-8-compound-live-5m-v1-0-1.js");
  assert.equal(p.deploymentEvidenceObserved,false);
  assert.equal(p.realFiveMinuteRunCompleted,false);
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.equal(review.roadmapCriteriaRelaxed,false);
});

test("PR20.8 Compound 5m runner package remains authority-closed before manifest cutover", () => {
  const r=review.compoundLive5mRunner;
  assert.equal(r.status,"V1_0_0_BLOCKED_PERFORMANCE_TRICK_ZERO_WRITE");
  assert.equal(r.testId,"pr20-8-compound-live-5m");
  assert.equal(r.controllerVersion,"1.0.0");
  assert.equal(r.package,"v5/werkzeuge/pr20-8-compound-live-5m.js");
  assert.equal(r.sourceCommit,"61db398373d1909bc11eb883af5902ac339a123c");
  assert.equal(r.packageSha256,"2c68619ffb7359373a6a817ac939c34278a66f5c69e7d3efba59a5ff5c00e221");
  assert.equal(r.packageBytes,25081);
  assert.equal(r.additionalGameplayWritesAllowed,0);
  assert.equal(r.additionalPublicFunctionCallsAllowed,0);
  assert.equal(r.rawWriteCallsAllowed,0);
  assert.equal(r.publicCompoundCallSites,0);
  assert.equal(r.compoundWriteAuthority,false);
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.deployed,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.retiredFromActiveManifest,true);
  assert.equal(r.deploymentEvidenceObserved,true);
  assert.equal(r.realFiveMinuteRunCompleted,false);
  assert.equal(r.maySetCompoundLive5mTestedOnlyAfterRealFiveMinutePass,true);
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 Compound 5m performance recovery records observed pass but awaits persistent completion", () => {
  const r=review.compoundLive5mPerformanceRecovery;
  assert.equal(r.status,"V1_0_1_REAL_BROWSER_BESTANDEN_NOTIFICATION_PERSISTENCE_GAP");
  assert.equal(r.controllerVersion,"1.0.1");
  assert.equal(r.package,"v5/werkzeuge/pr20-8-compound-live-5m-v1-0-1.js");
  assert.equal(r.sourceCommit,"51b1fc8038740f828cacffe866c6db799a447348");
  assert.equal(r.packageSha256,"23af77b23467e99fddfa437b9dc54873d0e3f25d783c940c819b447e44863a2b");
  assert.equal(r.packageBytes,26060);
  assert.equal(r.exactBridgeRecoveryGate,true);
  assert.equal(r.requiredPriorTerminal,true);
  assert.equal(r.requiredPriorGameplayWrites,0);
  assert.equal(r.requiredPriorRawWriteCalls,0);
  assert.equal(r.requiredPriorSameIntentRetry,false);
  assert.equal(r.requiredPriorIntentCount,0);
  assert.equal(r.additionalGameplayWritesAllowed,0);
  assert.equal(r.additionalPublicFunctionCallsAllowed,0);
  assert.equal(r.rawWriteCallsAllowed,0);
  assert.equal(r.publicCompoundCallSites,0);
  assert.equal(r.compoundWriteAuthority,false);
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.deployed,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.deploymentEvidenceObserved,true);
  assert.equal(r.realFiveMinuteRunCompleted,true);
  assert.equal(r.observedStatus,"BESTANDEN");
  assert.equal(r.observedPhase,"COMPLETE");
  assert.equal(r.observedTerminal,true);
  assert.equal(r.observedAtMs,1790310312453);
  assert.equal(r.observedDebugTelemetryBatchId,8297);
  assert.equal(r.observedSamples,60);
  assert.equal(r.observedDurationMs,300545);
  assert.equal(r.observedSourceSendCount,1);
  assert.equal(r.observedAdditionalGameplayWrites,0);
  assert.equal(r.observedAdditionalPublicFunctionCalls,0);
  assert.equal(r.observedAdditionalRawWriteCalls,0);
  assert.equal(r.completionNotificationPersisted,false);
  assert.equal(r.notificationPersistenceBlocker,"RUN_STARTED_AT_MS_IDENTITY_COLLISION");
  assert.equal(r.observedRunStartedAtMs,0);
  assert.equal(r.ratifiedCompoundLive5m,false);
  assert.equal(r.maySetCompoundLive5mTestedOnlyAfterRealFiveMinutePass,true);
  assert.equal(r.nextGate,"PR20_8_COMPOUND_LIVE_5M_NOTIFICATION_IDENTITY_RECOVERY_MANIFEST_CUTOVER");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 Compound 5m notification identity recovery stays authority-closed before cutover", () => {
  const r=review.compoundLive5mNotificationIdentityRecovery;
  assert.equal(r.status,"PACKAGE_BEREIT_NOT_DEPLOYED");
  assert.equal(r.controllerVersion,"1.0.2");
  assert.equal(r.package,"v5/werkzeuge/pr20-8-compound-live-5m-v1-0-2.js");
  assert.equal(r.sourceCommit,"18568cbc9689bd7e27c5a26a4342901d470b72c0");
  assert.equal(r.packageSha256,"4d9083bf163d98f15d842d64ecfc49ae4c9b8c3452b0b31a499d4b0b5687c849");
  assert.equal(r.packageBytes,28166);
  assert.equal(r.recoveryScope,"TELEMETRY_RUN_IDENTITY_ONLY");
  assert.equal(r.exactPreviousTerminalVersion,"1.0.1");
  assert.equal(r.previousTerminalSuccessRequired,true);
  assert.equal(r.topLevelStartedAtMsFromPersistedSoak,true);
  assert.equal(r.resampleExistingSuccess,false);
  assert.equal(r.resendAllowed,false);
  assert.equal(r.requiredPriorTerminal,true);
  assert.equal(r.requiredPriorGameplayWrites,0);
  assert.equal(r.requiredPriorRawWriteCalls,0);
  assert.equal(r.requiredPriorSameIntentRetry,false);
  assert.equal(r.requiredPriorIntentCount,1);
  assert.equal(r.additionalGameplayWritesAllowed,0);
  assert.equal(r.additionalPublicFunctionCallsAllowed,0);
  assert.equal(r.rawWriteCallsAllowed,0);
  assert.equal(r.publicCompoundCallSites,0);
  assert.equal(r.compoundWriteAuthority,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.manifestCutoverPrepared,false);
  assert.equal(r.deployed,false);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.nextGate,"PR20_8_COMPOUND_LIVE_5M_NOTIFICATION_IDENTITY_RECOVERY_MANIFEST_CUTOVER");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});
