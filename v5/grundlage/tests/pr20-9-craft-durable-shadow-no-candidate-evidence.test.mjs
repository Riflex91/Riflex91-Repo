import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-9-craft-durable-shadow-no-candidate-evidence.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const merchant=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/merchant-remaining-production-preparation.json","utf8"
));

test("PR20.9 Craft shadow no-candidate evidence is terminal zero-write",()=>{
  assert.equal(evidence.status,"RATIFIED_BLOCKED_NO_NORMAL_CANDIDATE_ZERO_WRITE");
  assert.equal(evidence.testId,"pr20-9-craft-durable-shadow-no-write");
  assert.equal(evidence.controllerVersion,"1.0.0");
  assert.equal(evidence.notificationId,3175);
  assert.equal(evidence.runStartedAtMs,1790370242200);
  assert.equal(evidence.observedAtMs,1790370242562);
  assert.equal(evidence.terminalStatus,"BLOCKIERT");
  assert.equal(evidence.phase,"COMPLETE");
  assert.equal(evidence.terminal,true);
  assert.equal(evidence.blocker,"PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT");
  assert.equal(evidence.rejectedCount,134);
  assert.equal(evidence.safety.gameplayWrites,0);
  assert.equal(evidence.safety.publicFunctionCalls,0);
  assert.equal(evidence.safety.rawWriteCalls,0);
  assert.equal(evidence.safety.authorityIssued,false);
  assert.equal(evidence.safety.craftAuthority,false);
  assert.equal(evidence.safety.gameplayAuthority,false);
  assert.equal(evidence.safety.rawWriteAuthority,false);
  assert.equal(evidence.safety.broadGraphExecutionAuthority,false);
  assert.equal(evidence.safety.durableIntentCreated,false);
  assert.equal(evidence.safety.sameIntentRetry,false);
  assert.equal(evidence.safety.normalRuntimeAllowed,false);
});

test("no-candidate evidence preserves NORMAL_CRAFT_ONLY and grants no candidate creation",()=>{
  assert.equal(evidence.scope.normalCraftOnly,true);
  assert.equal(evidence.scope.naturalCurrentInventoryOnly,true);
  assert.equal(evidence.scope.splitStackNormalCraftAllowed,false);
  assert.equal(evidence.scope.anniversaryCraftAllowed,false);
  assert.equal(evidence.scope.autoCraftAllowed,false);
  assert.equal(evidence.conclusion.evidenceRatified,true);
  assert.equal(evidence.conclusion.craftRatified,false);
  assert.equal(evidence.conclusion.productiveCraftAuthorityOpened,false);
  assert.equal(evidence.conclusion.candidateAcquisitionOrMutationAllowed,false);
  assert.equal(
    evidence.conclusion.nextAction,
    "REMAIN_BLOCKED_WAIT_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE",
  );
});

test("active manifest remains the exact no-write durable shadow",()=>{
  assert.equal(manifest.gate,"PR21_MERCHANT_INTEGRATION");
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m-v1-0-1");
  assert.equal(manifest.controllerVersion,"1.0.1");
  assert.equal(manifest.sourceCommit,"2fd7ed8fa1036460fc0188fa053ac48e50d35a54");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr21-merchant-integration-live-15m-v1-0-1.js");
  assert.equal(manifest.packageSha256,"1809a8b198b4682eafd8377f3f4b8423a5f9b6bffb52e42d6cd111489b7c3f07");
  assert.equal(manifest.expectedGlobal,"V5PR21MerchantIntegrationLive15mV101");
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("roadmap and Merchant mirror remain blocked without Craft ratification",()=>{
  const p=roadmap.pr20_9;
  assert.equal(p.status,"MANUAL_OVERRIDE_BESTANDEN_FOR_DEVELOPMENT");
  assert.equal(
    p.nextAction,
    "ADVANCE_TO_PR21_MERCHANT_INTEGRATION_DEVELOPMENT",
  );
  assert.equal(p.liveExecutionAllowed,false);
  assert.equal(p.productiveCraftAuthority,false);
  assert.equal(p.broadGraphExecutionAuthority,false);
  assert.equal(p.normalRuntimeAllowed,false);
  assert.equal(p.craftDurableShadowRunner.active,true);
  assert.equal(p.craftDurableShadowRunner.liveEvidenceObserved,true);
  assert.equal(p.craftDurableShadowRunner.craftRatified,false);
  assert.equal(p.craftDurableShadowRunner.latestObservedStatus,"BLOCKIERT");
  assert.equal(
    p.craftDurableShadowRunner.latestBlocker,
    "PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT",
  );
  assert.equal(p.craftDurableShadowRunner.latestNotificationId,3175);
  assert.equal(p.craftDurableShadowRunner.latestRunStartedAtMs,1790370242200);
  assert.equal(p.craftDurableShadowRunner.latestObservedAtMs,1790370242562);
  assert.equal(
    p.craftDurableShadowRunner.noCandidateEvidence,
    "v5/roadmap/pr20-9-craft-durable-shadow-no-candidate-evidence.json",
  );
  assert.equal(p.craftDurableShadowRunner.candidateAcquisitionOrMutationAllowed,false);

  assert.equal(merchant.pr20_9.status,p.status);
  assert.equal(merchant.pr20_9.nextAction,p.nextAction);
  assert.equal(merchant.pr20_9.mayExecuteLive,false);
  assert.equal(merchant.pr20_9.craftAuthority,false);
  assert.equal(merchant.pr20_9.gameplayAuthority,false);
  assert.equal(merchant.pr20_9.rawWriteAuthority,false);
  assert.equal(merchant.pr20_9.normalRuntimeAllowed,false);
  assert.equal(merchant.pr20_9.craftDurableShadow.liveEvidenceObserved,true);
  assert.equal(merchant.pr20_9.craftDurableShadow.craftRatified,false);
  assert.equal(merchant.pr20_9.craftDurableShadow.latestObservedStatus,"BLOCKIERT");
  assert.equal(
    merchant.pr20_9.craftDurableShadow.latestBlocker,
    "PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT",
  );
  assert.equal(merchant.pr20_9.craftDurableShadow.latestNotificationId,3175);
  assert.equal(
    merchant.pr20_9.craftDurableShadow.noCandidateEvidence,
    "roadmap/pr20-9-craft-durable-shadow-no-candidate-evidence.json",
  );
  assert.equal(
    merchant.pr20_9.craftDurableShadow.candidateAcquisitionOrMutationAllowed,
    false,
  );

  assert.equal(p.craftServiceMount.status,"RATIFIED_BESTANDEN_ONE_SHOT_MOVEMENT");
  assert.equal(p.craftServiceMount.latestNotificationId,3170);
});
