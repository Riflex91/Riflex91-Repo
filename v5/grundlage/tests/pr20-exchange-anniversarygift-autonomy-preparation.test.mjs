import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-autonomy-preparation.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("Exchange autonomy preparation binds ratified one-write and 5m evidence",()=>{
  assert.equal(prep.status,"FOUNDATION_BEREIT_NO_WRITE");
  assert.equal(prep.prerequisites.oneWriteStatus,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(prep.prerequisites.live5mStatus,
    "RATIFIED_BESTANDEN_ZERO_ADDITIONAL_MUTATION");
  assert.equal(prep.prerequisites.sourceSendCount,1);
  assert.equal(prep.prerequisites.sourceSameIntentRetry,false);
});

test("productive autonomy definition forbids manual stale-index authority",()=>{
  const d=prep.autonomyProofDefinition;
  assert.equal(d.productiveProofRequiresNewAutonomousDecision,true);
  assert.equal(d.manualPinnedInventoryIndexForbidden,true);
  assert.equal(d.historicalObservedIndexCarriesAuthority,false);
  assert.equal(d.priorCommittedTransactionMayNotBeReusedAsNewWriteAuthority,true);
  assert.equal(d.freshCurrentInventoryObservationRequired,true);
  assert.equal(d.freshCandidateReresolutionRequired,true);
  assert.equal(d.freshExactItemDefinitionRequired,true);
  assert.equal(d.exactItem,"anniversarygift");
  assert.equal(d.exchangeQuantity,1);
  assert.equal(d.anniversaryGiftExclusiveExceptionOnly,true);
  assert.equal(d.genericExclusivePolicyRelaxationForbidden,true);
  assert.equal(d.oneShotAuthorityMaximumUses,1);
  assert.equal(d.oneShotAuthorityMaximumTtlMs,1500);
  assert.equal(d.onlyPublicExchangeFunctionAllowed,true);
  assert.equal(d.rawSocketOrApiBypassForbidden,true);
  assert.equal(d.fullPoststateReconciliationRequired,true);
  assert.equal(d.unknownOutcomeBlindRetryForbidden,true);
  assert.equal(d.sameIntentRetry,false);
});

test("autonomy preparation itself grants zero gameplay authority",()=>{
  const b=prep.currentPreparationBoundary;
  assert.equal(b.preparationOnly,true);
  assert.equal(b.runnerPresent,false);
  assert.equal(b.newDurableAutonomyDecisionCreated,false);
  assert.equal(b.exchangeWriteAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.gameplayWrites,0);
  assert.equal(b.publicFunctionCalls,0);
  assert.equal(b.rawWriteCalls,0);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.mayAdvanceToPr20_9,false);
  assert.deepEqual(prep.recommendedStaging,[
    "AUTONOMY_ROUTE_SHADOW_NO_WRITE",
    "AUTONOMY_PRODUCTIVE_ONE_WRITE",
    "AUTONOMY_EVIDENCE_RATIFICATION",
    "PR20_8_EXIT_GATE_REVIEW",
  ]);
});

test("roadmap advances only to autonomy route shadow preparation",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const p=a.anniversaryGiftExchangeAutonomyPreparation;
  assert.equal(p.status,"FOUNDATION_BEREIT_NO_WRITE");
  assert.equal(p.productiveProofRequiresNewAutonomousDecision,true);
  assert.equal(p.manualPinnedInventoryIndexForbidden,true);
  assert.equal(p.freshCandidateReresolutionRequired,true);
  assert.equal(p.gameplayWrites,0);
  assert.equal(p.publicFunctionCalls,0);
  assert.equal(p.rawWriteCalls,0);
  assert.equal(p.exchangeAuthority,false);
  assert.equal(p.gameplayAuthority,false);
  assert.equal(p.rawWriteAuthority,false);
  assert.equal(p.normalRuntimeAllowed,false);
  assert.equal(roadmap.pr20_8.nextAction,
    "PREPARE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_ROUTE_SHADOW_MANIFEST_CUTOVER");
});
