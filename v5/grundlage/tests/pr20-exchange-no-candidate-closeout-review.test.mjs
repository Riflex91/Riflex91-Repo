import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-no-candidate-closeout-review.json",
  "utf8",
));

test("PR20.8 Exchange no-candidate closeout keeps the roadmap exit gate blocked",()=>{
  assert.equal(review.status,"V1_0_6_FRESH_READONLY_RESCAN_NO_CANDIDATE_RATIFIED");
  assert.equal(review.reviewedAtMainCommit,"6555ee2b3f48e8f73f75bf58f2ade29caa958c9a");
  assert.equal(review.roadmapExitGate.upgradeRatified,true);
  assert.equal(review.roadmapExitGate.compoundRatified,true);
  assert.equal(review.roadmapExitGate.compoundLive5mTested,true);
  assert.equal(review.roadmapExitGate.exchangeRatified,false);
  assert.equal(review.roadmapExitGate.exchangeLive5mTested,false);
  assert.equal(review.roadmapExitGate.exchangeAutonomyProductiveProven,false);
  assert.equal(review.roadmapExitGate.currentExitGateSatisfied,false);
  assert.equal(review.roadmapExitGate.mayAdvanceToPr20_9,false);
});

test("historical Exchange observation remains preserved and non-authorizing",()=>{
  const e=review.existingExchangeObservation;
  assert.equal(e.evidence,"v5/roadmap/pr20-8-compound-exchange-target-family-rescan-v1-0-4-evidence.json");
  assert.equal(e.observedAtMs,1790278399271);
  assert.equal(e.controllerVersion,"1.0.4");
  assert.equal(e.status,"BESTANDEN");
  assert.equal(e.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(e.exchangeCandidateCount,0);
  assert.deepEqual(e.rejected,[{name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"}]);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.exchangeAuthority,false);
  assert.equal(e.normalRuntimeAllowed,false);
});

test("required fresh current-inventory evidence has now been observed without widening authority",()=>{
  const why=review.whyFreshRescanRequired;
  assert.equal(why.compoundMutationCommittedAfterExistingExchangeObservation,true);
  assert.equal(why.compoundEvidence,"v5/roadmap/pr20-8-compound-live-5m-evidence.json");
  assert.equal(why.compoundFinalInventoryChanged,true);
  assert.equal(why.oldExchangeObservationMayNotAuthorizeCurrentWrite,true);
  assert.equal(why.freshCurrentInventoryEvidenceRequiredBeforeAnyExchangePreparation,false);
  assert.equal(why.freshCurrentInventoryEvidenceObserved,true);
  assert.equal(why.latestFreshEvidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(why.latestFreshControllerVersion,"1.0.6");
  assert.equal(why.latestFreshNotificationId,2382);
  assert.equal(why.latestFreshRunStartedAtMs,1790318741735);
  assert.equal(why.latestFreshObservedAtMs,1790318742137);
});

test("closeout still authorizes no acquisition, mutation, intent or runtime",()=>{
  const s=review.safeDecision;
  assert.equal(s.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(s.buyToCreateCandidateAllowed,false);
  assert.equal(s.farmToCreateCandidateAllowed,false);
  assert.equal(s.bankMutationToCreateCandidateAllowed,false);
  assert.equal(s.exchangeWriteAuthority,false);
  assert.equal(s.gameplayAuthority,false);
  assert.equal(s.rawWriteAuthority,false);
  assert.equal(s.durableIntentCreationAllowed,false);
  assert.equal(s.sameIntentRetry,false);
  assert.equal(s.normalRuntimeAllowed,false);
  assert.equal(s.roadmapCriteriaRelaxed,false);
});

test("latest read-only rescan is exact v1.0.6 zero-write evidence",()=>{
  const r=review.rescan;
  assert.equal(r.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(r.controllerVersion,"1.0.6");
  assert.equal(r.priorControllerVersion,"1.0.5");
  assert.equal(r.package,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js");
  assert.equal(r.test,"v5/werkzeuge/tests/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.test.mjs");
  assert.equal(r.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(r.sourceCommit,"a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.equal(r.packageSha256,"fb2395104beee0e611e5150c44183c95976eab188e451c23401271d1ae02e387");
  assert.equal(r.packageBytes,21688);
  assert.equal(r.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.deepEqual(r.targetFamilies,["COMPOUND","EXCHANGE"]);
  assert.equal(r.upgradeInformationalOnly,true);
  assert.equal(r.versionOnlyChangeFromPriorScanner,true);
  assert.equal(r.candidatePolicyChanged,false);
  assert.equal(r.bridgeAdmissionChanged,false);
  assert.equal(r.gameplayLogicChanged,false);
  assert.equal(r.maximumGameplayWrites,0);
  assert.equal(r.maximumPublicFunctionCalls,0);
  assert.equal(r.maximumRawWriteCalls,0);
  assert.equal(r.compoundAuthority,false);
  assert.equal(r.exchangeAuthority,false);
  assert.equal(r.gameplayAuthority,false);
  assert.equal(r.rawWriteAuthority,false);
  assert.equal(r.durableIntentCreated,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.manifest,"v5/roadmap/v5-autonomous-test-manifest.json");
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.deployed,true);
  assert.equal(r.evidenceObserved,true);
  assert.equal(r.bridgeDeploymentState,"DEPLOYED");
  assert.equal(r.bridgeCurrentState,"ALREADY_PRESENT");
  assert.equal(r.bridgeError,null);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(r.notificationId,2382);
  assert.equal(r.runStartedAtMs,1790318741735);
  assert.equal(r.observedAtMs,1790318742137);
  assert.equal(r.debugBatchId,8306);
  assert.equal(r.status,"BLOCKIERT");
  assert.equal(r.phase,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(r.terminal,true);
  assert.equal(r.blocker,"PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT");
  assert.equal(r.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(r.compoundCandidateCount,0);
  assert.equal(r.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(r.exchangeCandidateCount,0);
  assert.equal(r.gameplayWrites,0);
  assert.equal(r.publicFunctionCalls,0);
  assert.equal(r.rawWriteCalls,0);
  assert.equal(r.sameIntentRetry,false);
});

test("fresh current inventory evidence remains non-substitutive for Exchange gates",()=>{
  const e=review.freshCurrentInventoryEvidence;
  assert.equal(e.evidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json");
  assert.equal(e.priorFreshEvidence,"v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json");
  assert.equal(e.controllerVersion,"1.0.6");
  assert.equal(e.notificationId,2382);
  assert.equal(e.runStartedAtMs,1790318741735);
  assert.equal(e.observedAtMs,1790318742137);
  assert.equal(e.exchangeStatus,"KEIN_KANDIDAT");
  assert.equal(e.exchangeCandidateCount,0);
  assert.equal(e.compoundStatus,"KEIN_KANDIDAT");
  assert.equal(e.compoundCandidateCount,0);
  assert.deepEqual(e.rejected,[{name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"}]);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.authorityIssued,false);
  assert.equal(e.durableIntentCreated,false);
  assert.equal(e.exchangeAuthority,false);
  assert.equal(e.gameplayAuthority,false);
  assert.equal(e.rawWriteAuthority,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(e.substitutesForExchangeRatification,false);
  assert.equal(e.substitutesForExchangeLive5m,false);
  assert.equal(e.substitutesForExchangeAutonomyProof,false);
  assert.equal(e.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
});

test("all outcomes remain fail-closed and PR20.9 stays unavailable",()=>{
  assert.equal(review.outcomes.exchangeCandidateFound,"PREPARE_EXCHANGE_DURABLE_SHADOW_NO_WRITE_ONLY");
  assert.equal(review.outcomes.exchangeNoCandidate,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.outcomes.scannerFailure,"REMAIN_BLOCKED_NO_AUTHORITY");
  assert.equal(review.nextAction,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.roadmapExitGate.mayAdvanceToPr20_9,false);
});
