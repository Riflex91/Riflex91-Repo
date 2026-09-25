import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-no-candidate-exit-gate-review.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));

test("PR20.8 no-candidate review keeps the roadmap exit gate blocked", () => {
  assert.equal(review.status,"BLOCKED_EXCHANGE_NO_CANDIDATE");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.equal(review.roadmapCriteriaRelaxed,false);

  const families=review.exitGateCriteria.eachFamilyIndividuallyRatifiedAnd5mLiveTested;
  assert.equal(families.upgrade.ratified,true);
  assert.equal(families.compound.ratified,true);
  assert.equal(families.compound.live5mTested,true);
  assert.equal(families.compound.live5mBehaviorObservedPass,true);
  assert.equal(families.compound.completionNotificationPersisted,true);
  assert.equal(families.compound.evidence,"v5/roadmap/pr20-8-compound-live-5m-evidence.json");
  assert.equal(families.compound.reason,"RATIFIED_LIVE_5M_PERSISTED");
  assert.equal(families.exchange.ratified,false);
  assert.equal(families.exchange.live5mTested,false);
  assert.equal(families.exchange.reason,"KEIN_NORMALKANDIDAT");
  assert.equal(review.exitGateCriteria.noDuplicateValueMutationObserved,true);
  assert.equal(review.exitGateCriteria.exchangeAutonomyProductiveProven,false);
});

test("PR20.8 no-candidate evidence cannot silently create authority or substitute ratification", () => {
  assert.equal(review.noCandidateEvidence.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(review.noCandidateEvidence.priorEvidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json");
  assert.equal(review.noCandidateEvidence.ratifiedObservation,true);
  assert.equal(review.noCandidateEvidence.substitutesForCompoundRatification,false);
  assert.equal(review.noCandidateEvidence.substitutesForExchangeRatification,false);
  assert.equal(review.noCandidateEvidence.controllerVersion,"1.0.6");
  assert.equal(review.noCandidateEvidence.notificationId,2382);
  assert.equal(review.noCandidateEvidence.runStartedAtMs,1790318741735);
  assert.equal(review.noCandidateEvidence.observedAtMs,1790318742137);
  assert.equal(review.noCandidateEvidence.status,"BLOCKIERT");
  assert.equal(review.noCandidateEvidence.phase,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(review.noCandidateEvidence.terminal,true);
  assert.equal(review.noCandidateEvidence.blocker,"PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT");
  assert.equal(review.noCandidateEvidence.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(review.noCandidateEvidence.compoundCandidateCount,0);
  assert.equal(review.noCandidateEvidence.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(review.noCandidateEvidence.exchangeCandidateCount,0);
  assert.equal(review.noCandidateEvidence.gameplayWrites,0);
  assert.equal(review.noCandidateEvidence.publicFunctionCalls,0);
  assert.equal(review.noCandidateEvidence.rawWriteCalls,0);
  assert.equal(review.noCandidateEvidence.sameIntentRetry,false);
  assert.equal(review.noCandidateEvidence.exchangeAuthority,false);
  assert.equal(review.noCandidateEvidence.durableIntentCreated,false);
  assert.equal(review.noCandidateEvidence.normalRuntimeAllowed,false);
  assert.equal(review.noCandidateEvidence.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.authority.compoundAuthority,false);
  assert.equal(review.authority.exchangeAuthority,false);
  assert.equal(review.authority.gameplayAuthority,false);
  assert.equal(review.authority.rawWriteAuthority,false);
  assert.equal(review.authority.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(review.authority.normalRuntimeAllowed,false);
  assert.deepEqual(review.blockers,[
    "PR20_8_EXCHANGE_NOT_RATIFIED_NO_NORMAL_CANDIDATE",
    "PR20_8_EXCHANGE_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_AUTONOMY_NOT_PRODUCTIVE_PROVEN",
  ]);
  assert.equal(
    review.nextAction,
    "REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN",
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
  assert.equal(p.activeRecoveryControllerVersion,"1.0.2");
  assert.equal(p.activeRecoveryPackage,"v5/werkzeuge/pr20-8-compound-live-5m-v1-0-2.js");
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

test("PR20.8 Compound 5m performance recovery is linked to persisted completion ratification", () => {
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
  assert.equal(r.completionNotificationPersisted,true);
  assert.equal(r.notificationPersistenceBlocker,"RUN_STARTED_AT_MS_IDENTITY_COLLISION");
  assert.equal(r.observedRunStartedAtMs,0);
  assert.equal(r.ratifiedCompoundLive5m,true);
  assert.equal(r.notificationId,2272);
  assert.equal(r.ratificationEvidence,"v5/roadmap/pr20-8-compound-live-5m-evidence.json");
  assert.equal(r.maySetCompoundLive5mTestedOnlyAfterRealFiveMinutePass,true);
  assert.equal(r.retiredFromActiveManifest,true);
  assert.equal(r.supersededByNotificationIdentityRecovery,true);
  assert.equal(r.nextGate,"PR20_8_NO_CANDIDATE_CLOSEOUT_REVIEW");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 Compound 5m notification identity recovery is persisted and remains authority-closed", () => {
  const r=review.compoundLive5mNotificationIdentityRecovery;
  assert.equal(r.status,"RATIFIED_COMPLETION_PERSISTED");
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
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.deployed,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.deploymentEvidenceObserved,true);
  assert.equal(r.completionNotificationPersisted,true);
  assert.equal(r.notificationId,2272);
  assert.equal(r.runStartedAtMs,1790310011908);
  assert.equal(r.observedAtMs,1790311955056);
  assert.equal(r.samples,60);
  assert.equal(r.durationMs,300545);
  assert.equal(r.sourceSendCount,1);
  assert.equal(r.observedAdditionalGameplayWrites,0);
  assert.equal(r.observedAdditionalPublicFunctionCalls,0);
  assert.equal(r.observedAdditionalRawWriteCalls,0);
  assert.equal(r.ratifiedCompoundLive5m,true);
  assert.equal(r.evidence,"v5/roadmap/pr20-8-compound-live-5m-evidence.json");
  assert.equal(r.liveWriteEnabled,false);
  assert.equal(r.nextGate,"PR20_8_NO_CANDIDATE_CLOSEOUT_REVIEW");
  const active=review.activeCompoundLive5mManifest;
  assert.equal(active.testId,"pr20-8-compound-live-5m");
  assert.equal(active.controllerVersion,"1.0.2");
  assert.equal(active.package,"v5/werkzeuge/pr20-8-compound-live-5m-v1-0-2.js");
  assert.equal(active.sourceCommit,"18568cbc9689bd7e27c5a26a4342901d470b72c0");
  assert.equal(active.packageSha256,"4d9083bf163d98f15d842d64ecfc49ae4c9b8c3452b0b31a499d4b0b5687c849");
  assert.equal(active.packageBytes,28166);
  assert.equal(active.normalRuntimeAllowed,false);
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 Compound 5m evidence closes only the Compound live gate", () => {
  const e=review.compoundLive5mEvidence;
  assert.equal(e.status,"RATIFIED_BESTANDEN_ZERO_ADDITIONAL_MUTATION");
  assert.equal(e.evidence,"v5/roadmap/pr20-8-compound-live-5m-evidence.json");
  assert.equal(e.notificationId,2272);
  assert.equal(e.runStartedAtMs,1790310011908);
  assert.equal(e.observedAtMs,1790311955056);
  assert.equal(e.samples,60);
  assert.equal(e.durationMs,300545);
  assert.equal(e.sourceSendCount,1);
  assert.equal(e.additionalGameplayWrites,0);
  assert.equal(e.additionalPublicFunctionCalls,0);
  assert.equal(e.additionalRawWriteCalls,0);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.completionNotificationPersisted,true);
  assert.equal(e.noDuplicateValueChangingEffectObserved,true);
  assert.equal(e.compoundLive5mTested,true);
  assert.equal(e.exchangeRatified,false);
  assert.equal(e.exchangeLive5mTested,false);
  assert.equal(e.exchangeAutonomyProductiveProven,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 Exchange closeout records the fresh v1.0.6 no-candidate evidence", () => {
  const r=review.exchangeNoCandidateCloseoutReview;
  assert.equal(r.status,"V1_0_6_FRESH_READONLY_RESCAN_NO_CANDIDATE_RATIFIED");
  assert.equal(r.review,"v5/roadmap/pr20-8-exchange-no-candidate-closeout-review.json");
  assert.equal(r.existingEvidence,"v5/roadmap/pr20-8-compound-exchange-target-family-rescan-v1-0-4-evidence.json");
  assert.equal(r.existingObservedAtMs,1790278399271);
  assert.equal(r.existingExchangeStatus,"KEIN_KANDIDAT");
  assert.equal(r.existingExchangeCandidateCount,0);
  assert.equal(r.compoundMutationCommittedAfterExistingObservation,true);
  assert.equal(r.freshCurrentInventoryEvidenceRequired,false);
  assert.equal(r.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(r.buyToCreateCandidateAllowed,false);
  assert.equal(r.farmToCreateCandidateAllowed,false);
  assert.equal(r.bankMutationToCreateCandidateAllowed,false);
  assert.equal(r.exchangeWriteAuthority,false);
  assert.equal(r.gameplayAuthority,false);
  assert.equal(r.rawWriteAuthority,false);
  assert.equal(r.durableIntentCreationAllowed,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.scannerTestId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(r.scannerControllerVersion,"1.0.4");
  assert.equal(r.scannerPackage,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-4.js");
  assert.equal(r.scannerSourceCommit,"27e25e69dc0e26d8ae05328335718c36a6a0c659");
  assert.equal(r.scannerPackageSha256,"0f52db42f8c8a0656ef89653aca0406eaef16f57a762d21222e98b9277297a1b");
  assert.equal(r.scannerPackageBytes,21343);
  assert.equal(r.scannerExpectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(r.scannerMaximumGameplayWrites,0);
  assert.equal(r.scannerMaximumPublicFunctionCalls,0);
  assert.equal(r.scannerMaximumRawWriteCalls,0);
  assert.equal(r.manifest,"v5/roadmap/v5-autonomous-test-manifest.json");
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.deployed,true);
  assert.equal(r.evidenceObserved,true);
  assert.equal(r.latestEvidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(r.latestControllerVersion,"1.0.6");
  assert.equal(r.latestNotificationId,2382);
  assert.equal(r.latestRunStartedAtMs,1790318741735);
  assert.equal(r.latestObservedAtMs,1790318742137);
  assert.equal(r.latestCompoundStatus,"KEIN_KANDIDAT");
  assert.equal(r.latestCompoundCandidateCount,0);
  assert.equal(r.latestExchangeStatus,"KEIN_KANDIDAT");
  assert.equal(r.latestExchangeCandidateCount,0);
  assert.equal(r.latestGameplayWrites,0);
  assert.equal(r.latestPublicFunctionCalls,0);
  assert.equal(r.latestRawWriteCalls,0);
  assert.equal(r.latestSameIntentRetry,false);
  assert.equal(r.bridgeState,"ERROR");
  assert.equal(r.bridgeError,"InvalidOperationException: V5_TEST_DEPLOYMENT_HANDSHAKE_FAILED");
  assert.equal(r.observedAtMs,1790314474502);
  assert.equal(r.observedCurrentTestId,"pr20-8-compound-live-5m");
  assert.equal(r.observedCurrentControllerVersion,"1.0.2");
  assert.equal(r.observedCurrentTerminal,true);
  assert.equal(r.observedCurrentGameplayWrites,0);
  assert.equal(r.observedCurrentRawWriteCalls,0);
  assert.equal(r.observedCurrentSameIntentRetry,false);
  assert.equal(r.observedCurrentIntentCount,1);
  const fresh=r.freshRescanEvidence;
  assert.equal(fresh.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(fresh.controllerVersion,"1.0.6");
  assert.equal(fresh.notificationId,2382);
  assert.equal(fresh.runStartedAtMs,1790318741735);
  assert.equal(fresh.observedAtMs,1790318742137);
  assert.equal(fresh.status,"BLOCKIERT");
  assert.equal(fresh.phase,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(fresh.terminal,true);
  assert.equal(fresh.blocker,"PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT");
  assert.equal(fresh.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(fresh.compoundCandidateCount,0);
  assert.equal(fresh.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(fresh.exchangeCandidateCount,0);
  assert.equal(fresh.gameplayWrites,0);
  assert.equal(fresh.publicFunctionCalls,0);
  assert.equal(fresh.rawWriteCalls,0);
  assert.equal(fresh.sameIntentRetry,false);
  assert.equal(fresh.exchangeAuthority,false);
  assert.equal(fresh.durableIntentCreated,false);
  assert.equal(fresh.normalRuntimeAllowed,false);
  assert.equal(fresh.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(r.nextGate,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  const retired=review.activeCompoundLive5mManifest;
  assert.equal(retired.active,false);
  assert.equal(retired.retiredFromActiveManifest,true);
  assert.equal(retired.supersededByTestId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(retired.supersededByControllerVersion,"1.0.4");
  const active=review.activeAutonomousManifest;
  assert.equal(active.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(active.controllerVersion,"1.0.6");
  assert.equal(active.package,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js");
  assert.equal(active.sourceCommit,"a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.equal(active.packageSha256,"fb2395104beee0e611e5150c44183c95976eab188e451c23401271d1ae02e387");
  assert.equal(active.packageBytes,21688);
  assert.equal(active.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(active.maximumGameplayWrites,0);
  assert.equal(active.maximumPublicFunctionCalls,0);
  assert.equal(active.maximumRawWriteCalls,0);
  assert.equal(active.exchangeAuthority,false);
  assert.equal(active.gameplayAuthority,false);
  assert.equal(active.rawWriteAuthority,false);
  assert.equal(active.normalRuntimeAllowed,false);
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 historical v1.0.5 Exchange facade recovery completed zero-write rescan", () => {
  const r=review.exchangeReadonlyRescanFacadeRecovery;
  assert.equal(r.status,"REAL_BROWSER_FRESH_RESCAN_COMPLETED_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(r.contract,"v5/grundlage/vertraege/runtime/pr20-8-exchange-readonly-rescan-facade-recovery-preparation.json");
  assert.equal(r.package,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.js");
  assert.equal(r.test,"v5/werkzeuge/tests/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.test.mjs");
  assert.equal(r.contractTest,"v5/grundlage/tests/pr20-exchange-readonly-rescan-facade-recovery-preparation.test.mjs");
  assert.equal(r.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(r.fromControllerVersion,"1.0.4");
  assert.equal(r.controllerVersion,"1.0.5");
  assert.equal(r.sourceCommit,"36bece2cc75854e7d02c6c8dc6ddaf75a74579cb");
  assert.equal(r.packageSha256,"e87996be9ee56b31f7737923b5bf8999a0a8af82393dea9419f5f4fd3d4b494e");
  assert.equal(r.packageBytes,21688);
  assert.equal(r.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(r.recoveryScope,"TELEMETRY_FACADE_IDEMPOTENCY_ONLY");
  assert.equal(r.markerAloneSufficient,false);
  assert.equal(r.existingStatusMustMatchTestId,true);
  assert.equal(r.existingStatusMustMatchVersion,true);
  assert.equal(r.staleForeignStatusForcesFacadeReplacement,true);
  assert.equal(r.gameplaySelectionLogicChanged,false);
  assert.equal(r.candidatePolicyChanged,false);
  assert.equal(r.bridgeAdmissionChanged,false);
  assert.equal(r.maximumGameplayWrites,0);
  assert.equal(r.maximumPublicFunctionCalls,0);
  assert.equal(r.maximumRawWriteCalls,0);
  assert.equal(r.exchangeAuthority,false);
  assert.equal(r.gameplayAuthority,false);
  assert.equal(r.rawWriteAuthority,false);
  assert.equal(r.durableIntentCreated,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(r.manifest,"v5/roadmap/v5-autonomous-test-manifest.json");
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.deployed,true);
  assert.equal(r.evidenceObserved,true);
  assert.equal(r.notificationId,2332);
  assert.equal(r.runStartedAtMs,1790315652844);
  assert.equal(r.observedAtMs,1790315653250);
  assert.equal(r.observedStatus,"BLOCKIERT");
  assert.equal(r.observedPhase,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(r.observedTerminal,true);
  assert.equal(r.observedBlocker,"PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT");
  assert.equal(r.observedUpgradeStatus,"KANDIDAT_GEFUNDEN");
  assert.equal(r.observedUpgradeCandidateCount,3);
  assert.equal(r.observedCompoundStatus,"KEIN_KANDIDAT");
  assert.equal(r.observedCompoundCandidateCount,0);
  assert.equal(r.observedExchangeStatus,"KEIN_KANDIDAT");
  assert.equal(r.observedExchangeCandidateCount,0);
  assert.equal(r.observedGameplayWrites,0);
  assert.equal(r.observedPublicFunctionCalls,0);
  assert.equal(r.observedRawWriteCalls,0);
  assert.equal(r.observedSameIntentRetry,false);
  assert.equal(r.observedPerformanceTrickVerification,"HOWLER_PLAYING_TRUE");
  assert.equal(r.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json");
  assert.equal(r.nextGate,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 fresh Exchange read-only rescan evidence keeps the exit gate blocked", () => {
  const e=review.exchangeFreshReadonlyRescanEvidence;
  assert.equal(e.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(e.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(e.controllerVersion,"1.0.6");
  assert.equal(e.notificationId,2382);
  assert.equal(e.runStartedAtMs,1790318741735);
  assert.equal(e.observedAtMs,1790318742137);
  assert.equal(e.statusObserved,"BLOCKIERT");
  assert.equal(e.phaseObserved,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(e.terminalObserved,true);
  assert.equal(e.blocker,"PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT");
  assert.equal(e.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(e.compoundCandidateCount,0);
  assert.equal(e.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(e.exchangeCandidateCount,0);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.exchangeRatified,false);
  assert.equal(e.exchangeLive5mTested,false);
  assert.equal(e.exchangeAutonomyProductiveProven,false);
  assert.equal(e.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(e.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
  assert.deepEqual(review.blockers,[
    "PR20_8_EXCHANGE_NOT_RATIFIED_NO_NORMAL_CANDIDATE",
    "PR20_8_EXCHANGE_5M_LIVE_NOT_RUN",
    "PR20_8_EXCHANGE_AUTONOMY_NOT_PRODUCTIVE_PROVEN",
  ]);
});

test("PR20.8 v1.0.5 Exchange no-candidate evidence cannot substitute Exchange ratification", () => {
  const e=review.exchangeReadonlyRescanV1_0_5Evidence;
  assert.equal(e.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(e.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json");
  assert.equal(e.notificationId,2332);
  assert.equal(e.runStartedAtMs,1790315652844);
  assert.equal(e.observedAtMs,1790315653250);
  assert.equal(e.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(e.exchangeCandidateCount,0);
  assert.equal(e.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(e.compoundCandidateCount,0);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.exchangeAuthority,false);
  assert.equal(e.durableIntentCreated,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(e.exchangeRatified,false);
  assert.equal(e.exchangeLive5mTested,false);
  assert.equal(e.exchangeAutonomyProductiveProven,false);
  assert.equal(e.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 v1.0.6 Exchange no-candidate evidence remains non-substitutive", () => {
  const e=review.exchangeReadonlyRescanV1_0_6Evidence;
  assert.equal(e.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(e.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(e.notificationId,2382);
  assert.equal(e.runStartedAtMs,1790318741735);
  assert.equal(e.observedAtMs,1790318742137);
  assert.equal(e.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(e.exchangeCandidateCount,0);
  assert.equal(e.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(e.compoundCandidateCount,0);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.exchangeAuthority,false);
  assert.equal(e.durableIntentCreated,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(e.exchangeRatified,false);
  assert.equal(e.exchangeLive5mTested,false);
  assert.equal(e.exchangeAutonomyProductiveProven,false);
  assert.equal(e.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.currentExitGateSatisfied,false);
  assert.equal(review.mayAdvanceToPr20_9,false);
});

test("PR20.8 v1.0.6 rescan epoch records real deployment without authority widening", () => {
  const e=review.exchangeReadonlyRescanEpochV1_0_6;
  assert.equal(e.status,"REAL_BROWSER_FRESH_RESCAN_COMPLETED_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(e.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(e.controllerVersion,"1.0.6");
  assert.equal(e.priorControllerVersion,"1.0.5");
  assert.equal(e.versionOnlyChangeFromPriorScanner,true);
  assert.equal(e.candidatePolicyChanged,false);
  assert.equal(e.bridgeAdmissionChanged,false);
  assert.equal(e.gameplayLogicChanged,false);
  assert.equal(e.bridgeDeploymentState,"DEPLOYED");
  assert.equal(e.notificationId,2382);
  assert.equal(e.runStartedAtMs,1790318741735);
  assert.equal(e.observedAtMs,1790318742137);
  assert.equal(e.debugBatchId,8306);
  assert.equal(e.maximumGameplayWrites,0);
  assert.equal(e.maximumPublicFunctionCalls,0);
  assert.equal(e.maximumRawWriteCalls,0);
  assert.equal(e.exchangeAuthority,false);
  assert.equal(e.gameplayAuthority,false);
  assert.equal(e.rawWriteAuthority,false);
  assert.equal(e.durableIntentCreated,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(e.nextGate,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
});


test("PR20.8 parallel preparation index mirrors the superseding controlled acquisition discovery state", () => {
  const parallel=roadmap.parallelPreparations.find(x=>x?.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(parallel);
  assert.equal(parallel.status,roadmap.pr20_8.status);
  assert.equal(parallel.nextAction,roadmap.pr20_8.nextAction);
  assert.equal(
    parallel.status,
    "EXCHANGE_ANNIVERSARYGIFT_EXCEPTION_RESCAN_MANIFEST_CUTOVER_PREPARED",
  );
  assert.equal(
    parallel.nextAction,
    "DEPLOY_ANNIVERSARYGIFT_EXCEPTION_RESCAN",
  );
  for (const artifact of [
    "v5/roadmap/pr20-8-compound-live-5m-evidence.json",
    "v5/roadmap/pr20-8-exchange-no-candidate-closeout-review.json",
    "v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json",
    "v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js",
    "v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json",
    "v5/grundlage/vertraege/runtime/pr20-8-exchange-candidate-acquisition.json",
    "v5/werkzeuge/pr20-8-exchange-candidate-acquisition-readonly-v1-0-1.js",
    "v5/grundlage/vertraege/runtime/pr20-8-exchange-candidate-bank-mount.json",
    "v5/werkzeuge/pr20-8-exchange-candidate-bank-mount-v1-0-0.js",
    "v5/werkzeuge/tests/pr20-8-exchange-candidate-bank-mount-v1-0-0.test.mjs",
    "v5/roadmap/pr20-8-exchange-candidate-bank-mount-evidence.json",
    "v5/grundlage/tests/pr20-exchange-candidate-bank-mount-evidence.test.mjs",
    "v5/werkzeuge/pr20-8-exchange-market-discovery-v1-0-0.js",
    "v5/werkzeuge/tests/pr20-8-exchange-market-discovery-v1-0-0.test.mjs",
    "v5/grundlage/vertraege/runtime/pr20-8-exchange-market-discovery.json",
  ]) {
    assert.ok(parallel.artifacts.includes(artifact), `missing parallel PR20.8 artifact: ${artifact}`);
  }
  assert.equal(roadmap.pr20_8.exchangeCandidateAcquisition.controlledBankMutationToCreateCandidateAllowed,true);
  assert.equal(roadmap.pr20_8.exchangeCandidateAcquisition.buyToCreateCandidateAllowed,false);
  assert.equal(roadmap.pr20_8.exchangeCandidateAcquisition.farmToCreateCandidateAllowed,false);
  assert.equal(roadmap.pr20_8.exitGateReview.currentExitGateSatisfied,false);
  assert.equal(roadmap.pr20_8.exitGateReview.mayAdvanceToPr20_9,false);
});

test("PR20.8 current parallel preparation artifact index contains only existing files", () => {
  const parallel=roadmap.parallelPreparations.find(x=>x?.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(parallel);
  assert.ok(Array.isArray(parallel.artifacts));
  assert.ok(parallel.artifacts.length > 0);

  for (const artifact of parallel.artifacts) {
    assert.equal(typeof artifact,"string");
    assert.ok(artifact.length > 0);
    const localPath=artifact.startsWith("v5/") ? artifact.slice(3) : artifact;
    assert.ok(fs.existsSync(localPath), `missing PR20.8 parallel artifact: ${artifact}`);
  }
});
