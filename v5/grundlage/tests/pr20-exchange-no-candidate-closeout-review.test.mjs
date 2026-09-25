import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-no-candidate-closeout-review.json",
  "utf8",
));

test("PR20.8 Exchange no-candidate closeout keeps the roadmap exit gate blocked",()=>{
  assert.equal(review.status,"MANIFEST_CUTOVER_PREPARED_FOR_FRESH_READONLY_RESCAN");
  assert.equal(review.reviewedAtMainCommit,"f5072e112c2a25fa872627e3269d1d26e63e5f66");
  assert.equal(review.roadmapExitGate.upgradeRatified,true);
  assert.equal(review.roadmapExitGate.compoundRatified,true);
  assert.equal(review.roadmapExitGate.compoundLive5mTested,true);
  assert.equal(review.roadmapExitGate.exchangeRatified,false);
  assert.equal(review.roadmapExitGate.exchangeLive5mTested,false);
  assert.equal(review.roadmapExitGate.exchangeAutonomyProductiveProven,false);
  assert.equal(review.roadmapExitGate.currentExitGateSatisfied,false);
  assert.equal(review.roadmapExitGate.mayAdvanceToPr20_9,false);
});

test("existing Exchange observation is zero-write but cannot authorize current Exchange",()=>{
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

test("Compound commit makes a fresh current-inventory read-only rescan the only safe next observation",()=>{
  const why=review.whyFreshRescanRequired;
  assert.equal(why.compoundMutationCommittedAfterExistingExchangeObservation,true);
  assert.equal(why.compoundEvidence,"v5/roadmap/pr20-8-compound-live-5m-evidence.json");
  assert.equal(why.compoundFinalInventoryChanged,true);
  assert.equal(why.oldExchangeObservationMayNotAuthorizeCurrentWrite,true);
  assert.equal(why.freshCurrentInventoryEvidenceRequiredBeforeAnyExchangePreparation,true);
});

test("closeout does not authorize acquisition, mutation, intent or runtime",()=>{
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

test("fresh Exchange closeout rescan reuses the already ratified zero-write v1.0.4 scanner",()=>{
  const r=review.rescan;
  assert.equal(r.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(r.controllerVersion,"1.0.4");
  assert.equal(r.package,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-4.js");
  assert.equal(r.test,"v5/werkzeuge/tests/pr20-8-wertmutation-live-candidate-readonly-v1-0-4.test.mjs");
  assert.equal(r.sourceCommit,"27e25e69dc0e26d8ae05328335718c36a6a0c659");
  assert.equal(r.packageSha256,"0f52db42f8c8a0656ef89653aca0406eaef16f57a762d21222e98b9277297a1b");
  assert.equal(r.packageBytes,21343);
  assert.equal(r.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.deepEqual(r.targetFamilies,["COMPOUND","EXCHANGE"]);
  assert.equal(r.upgradeInformationalOnly,true);
  assert.equal(r.maximumGameplayWrites,0);
  assert.equal(r.maximumPublicFunctionCalls,0);
  assert.equal(r.maximumRawWriteCalls,0);
  assert.equal(r.compoundAuthority,false);
  assert.equal(r.exchangeAuthority,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.manifest,"v5/roadmap/v5-autonomous-test-manifest.json");
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,true);
  assert.equal(r.deployed,false);
  assert.equal(r.evidenceObserved,false);
});

test("all rescan outcomes remain fail-closed and PR20.9 stays unavailable",()=>{
  assert.equal(review.outcomes.exchangeCandidateFound,"PREPARE_EXCHANGE_DURABLE_SHADOW_NO_WRITE_ONLY");
  assert.equal(review.outcomes.exchangeNoCandidate,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(review.outcomes.scannerFailure,"REMAIN_BLOCKED_NO_AUTHORITY");
  assert.equal(review.nextAction,"PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
  assert.equal(review.roadmapExitGate.mayAdvanceToPr20_9,false);
});
