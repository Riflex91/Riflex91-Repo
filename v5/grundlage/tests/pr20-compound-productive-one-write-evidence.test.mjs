import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-productive-one-write-evidence.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));

test("PR20.8 productive Compound one-write evidence ratifies one committed mutation",()=>{
  assert.equal(evidence.status,"RATIFIED_COMMITTED_SUCCESS");
  assert.equal(evidence.package.testId,"pr20-8-compound-productive-one-write-live");
  assert.equal(evidence.package.controllerVersion,"1.0.0");
  assert.equal(evidence.mutation.publicFunction,"compound");
  assert.equal(evidence.mutation.gameplayWrites,1);
  assert.equal(evidence.mutation.publicFunctionCalls,1);
  assert.equal(evidence.mutation.rawWriteCalls,0);
  assert.equal(evidence.mutation.sendCount,1);
  assert.equal(evidence.mutation.sameIntentRetry,false);
  assert.equal(evidence.mutation.journalStatus,"COMMITTED");
  assert.equal(evidence.mutation.reconciliationClassification,"COMMITTED_SUCCESS");
  assert.deepEqual(evidence.candidate.indexesAtSend,[1,22,23]);
  assert.equal(evidence.candidate.name,"hpamulet");
  assert.equal(evidence.candidate.levelBefore,0);
  assert.equal(evidence.candidate.levelAfter,1);
  assert.equal(evidence.scroll.name,"cscroll0");
  assert.equal(evidence.scroll.indexAtSend,18);
  assert.equal(evidence.scroll.quantityBefore,20);
  assert.equal(evidence.scroll.quantityAfter,19);
  assert.equal(evidence.reconciliation.qActive,false);
  assert.equal(evidence.reconciliation.placeholderCount,0);
  assert.equal(evidence.reconciliation.secondaryConsumed,true);
  assert.equal(evidence.reconciliation.scrollConsumedExactly,true);
  assert.equal(evidence.reconciliation.promiseTimedOut,true);
  assert.equal(evidence.reconciliation.promiseResultSupportingEvidenceOnly,true);
  assert.equal(evidence.reconciliation.stateReconciliationAuthoritative,true);
});

test("Compound durable restart evidence proves no same-intent resend",()=>{
  assert.equal(evidence.durability.durableIntentCreated,true);
  assert.equal(evidence.durability.durableIntentReadback,true);
  assert.equal(evidence.durability.authorityIssued,true);
  assert.equal(evidence.durability.authorityConsumed,true);
  assert.equal(evidence.durability.oneShotAuthorityClass,"Pr208CompoundOneShotAuthority");
  assert.equal(evidence.durability.oneShotAuthorityMaximumUses,1);
  assert.equal(evidence.restartSafety.laterRestartRecoveredSameTransaction,true);
  assert.equal(evidence.restartSafety.laterRestartSendCount,1);
  assert.equal(evidence.restartSafety.laterRestartReconciliation,"COMMITTED_SUCCESS");
  assert.equal(evidence.restartSafety.noDuplicateValueChangingEffectObserved,true);
  assert.equal(evidence.legacyShadowAfterSuccess.gameplayWrites,0);
  assert.equal(evidence.legacyShadowAfterSuccess.publicFunctionCalls,0);
  assert.equal(evidence.legacyShadowAfterSuccess.rawWriteCalls,0);
});

test("Compound one-write ratification does not relax PR20.8 remaining gates",()=>{
  assert.equal(evidence.safetyBoundary.compoundWriteRatified,true);
  assert.equal(evidence.safetyBoundary.compoundLive5mTested,false);
  assert.equal(evidence.safetyBoundary.live5mCriterionRelaxed,false);
  assert.equal(evidence.safetyBoundary.exchangeRatification,false);
  assert.equal(evidence.safetyBoundary.exchangeWriteAuthority,false);
  assert.equal(evidence.safetyBoundary.pr20_8ExitGateSatisfied,false);
  assert.equal(evidence.safetyBoundary.mayAdvanceToPr20_9,false);
  assert.equal(evidence.safetyBoundary.normalRuntimeAllowed,false);
  assert.equal(evidence.nextGate,"PR20_8_COMPOUND_LIVE_5M_PREPARATION");
});

test("after Compound ratification the active manifest advances to the anniversarygift Exchange service mount",()=>{
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"ac265002a8c86418e17fd1f3d7ed426007b99dd0");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr21-merchant-integration-live-15m.js");
  assert.equal(manifest.packageSha256,"4066d751ac0a9f67db7f3eb318b6a1ffc882b37c4b93638c6151403a8616e1f9");
  assert.equal(manifest.expectedGlobal,"V5PR21MerchantIntegrationLive15m");
  assert.equal(manifest.normalRuntimeAllowed,false);
});
