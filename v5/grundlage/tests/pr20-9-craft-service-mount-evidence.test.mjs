import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync("roadmap/pr20-9-craft-service-mount-evidence.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));

test("PR20.9 Craft service mount live evidence is terminal one-shot movement",()=>{
  assert.equal(evidence.status,"RATIFIED_BESTANDEN_ONE_SHOT_MOVEMENT");
  assert.equal(evidence.notificationId,3170);
  assert.equal(evidence.terminalStatus,"BESTANDEN");
  assert.equal(evidence.phase,"COMPLETE");
  assert.equal(evidence.terminal,true);
  assert.equal(evidence.movement.target,"craftsman");
  assert.equal(evidence.movement.movementIssued,true);
  assert.equal(evidence.movement.movementCompleted,true);
  assert.equal(evidence.movement.sendCount,1);
  assert.equal(evidence.movement.gameplayWrites,1);
  assert.equal(evidence.movement.publicFunctionCalls,1);
  assert.equal(evidence.movement.rawWriteCalls,0);
  assert.equal(evidence.movement.sameIntentRetry,false);
  assert.equal(evidence.movement.durableIntentReadback,true);
  assert.equal(evidence.movement.recoveredExistingIntent,false);
  assert.ok(evidence.recipient.distanceToCraftsman<=300);
});

test("service mount does not open Craft or runtime authority",()=>{
  assert.equal(evidence.authority.craftAuthority,false);
  assert.equal(evidence.authority.gameplayAuthority,false);
  assert.equal(evidence.authority.rawWriteAuthority,false);
  assert.equal(evidence.authority.normalRuntimeAllowed,false);
  assert.equal(evidence.conclusion.movementCountsAsCraftRatification,false);
  assert.equal(evidence.conclusion.productiveCraftAttempted,false);
});

test("active manifest is restored to the exact PR20.9 Craft durable shadow runner",()=>{
  assert.equal(manifest.gate,"PR21_MERCHANT_INTEGRATION");
  assert.equal(manifest.testId,"pr21-merchant-integration-live-15m-v1-0-1");
  assert.equal(manifest.controllerVersion,"1.0.1");
  assert.equal(manifest.sourceCommit,"2fd7ed8fa1036460fc0188fa053ac48e50d35a54");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr21-merchant-integration-live-15m-v1-0-1.js");
  assert.equal(manifest.packageSha256,"1809a8b198b4682eafd8377f3f4b8423a5f9b6bffb52e42d6cd111489b7c3f07");
  assert.equal(manifest.expectedGlobal,"V5PR21MerchantIntegrationLive15mV101");
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("roadmap preserves service-mount ratification while current Craft shadow is blocked no-candidate",()=>{
  const p=roadmap.pr20_9;
  assert.equal(p.status,"MANUAL_OVERRIDE_BESTANDEN_FOR_DEVELOPMENT");
  assert.equal(p.nextAction,"ADVANCE_TO_PR21_MERCHANT_INTEGRATION_DEVELOPMENT");
  assert.equal(p.craftDurableShadowRunner.active,true);
  assert.equal(p.craftDurableShadowRunner.liveEvidenceObserved,true);
  assert.equal(p.craftDurableShadowRunner.craftRatified,false);
  assert.equal(p.craftDurableShadowRunner.latestObservedStatus,"BLOCKIERT");
  assert.equal(p.craftDurableShadowRunner.latestBlocker,"PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT");
  assert.equal(p.craftDurableShadowRunner.latestNotificationId,3175);
  assert.equal(p.craftServiceMount.status,"RATIFIED_BESTANDEN_ONE_SHOT_MOVEMENT");
  assert.equal(p.craftServiceMount.evidenceObserved,true);
  assert.equal(p.craftServiceMount.latestNotificationId,3170);
  assert.equal(p.craftServiceMount.movementCompleted,true);
  assert.equal(p.productiveCraftAuthority,false);
  assert.equal(p.broadGraphExecutionAuthority,false);
  assert.equal(p.normalRuntimeAllowed,false);
});
