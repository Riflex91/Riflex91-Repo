import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-manifest-cutover.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const merchant=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/merchant-remaining-production-preparation.json","utf8"
));

test("PR20.9 Craft shadow cutover is restored as the exact active no-write manifest",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED");
  assert.equal(cutover.gate,"PR20.9_PRODUCTION");

  const local=cutover.manifest.packagePath.replace(/^v5\//,"");
  const bytes=fs.readFileSync(local);
  assert.equal(bytes.length,cutover.manifest.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    cutover.manifest.packageSha256,
  );
  const pinned=execFileSync("git",["show",cutover.manifest.sourceCommit+":"+cutover.manifest.packagePath],{
    encoding:null,maxBuffer:256*1024,
  });
  assert.deepEqual(pinned,bytes);

  assert.equal(manifest.gate,"PR20.9_PRODUCTION");
  assert.equal(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.controllerVersion,cutover.manifest.controllerVersion);
  assert.equal(manifest.sourceCommit,cutover.manifest.sourceCommit);
  assert.equal(manifest.packagePath,cutover.manifest.packagePath);
  assert.equal(manifest.packageSha256,cutover.manifest.packageSha256);
  assert.equal(manifest.expectedGlobal,cutover.manifest.expectedGlobal);
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("PR20.9 cutover remains strict NORMAL_CRAFT_ONLY zero gameplay write",()=>{
  assert.equal(cutover.scope.normalCraftOnly,true);
  assert.equal(cutover.scope.naturalCurrentInventoryOnly,true);
  assert.equal(cutover.scope.splitStackAllowed,false);
  assert.equal(cutover.scope.anniversaryCraftAllowed,false);
  assert.equal(cutover.scope.autoCraftAllowed,false);
  assert.equal(cutover.scope.stableDoubleObservationRequired,true);
  assert.equal(cutover.scope.stablePostIntentReobserveRequired,true);
  assert.equal(cutover.scope.exactPhysicalInputIndexesPinned,true);
  assert.equal(cutover.scope.exactTerminalRecoveryAllowed,true);

  const d=cutover.deploymentBoundary;
  assert.equal(d.bridgeMayDeployPinnedRunner,true);
  assert.equal(d.localStorageShadowWriteAllowed,true);
  assert.equal(d.gameplayWriteAllowed,false);
  assert.equal(d.publicCraftCallAllowed,false);
  assert.equal(d.rawWriteAllowed,false);
  assert.equal(d.authorityIssued,false);
  assert.equal(d.craftAuthority,false);
  assert.equal(d.gameplayAuthority,false);
  assert.equal(d.rawWriteAuthority,false);
  assert.equal(d.broadGraphExecutionAuthority,false);
  assert.equal(d.sameIntentRetry,false);
  assert.equal(d.normalRuntimeAllowed,false);
  assert.equal(d.deploymentCountsAsCraftRatification,false);
});

test("PR20.9 roadmap and Merchant mirror remain no-write after no-candidate observation",()=>{
  assert.equal(roadmap.currentGate,"PR20.9_PRODUCTION");
  assert.equal(roadmap.pr20_9.status,"CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE");
  assert.deepEqual(roadmap.pr20_9.blockedBy,[]);
  assert.equal(roadmap.pr20_9.nextAction,"REMAIN_BLOCKED_WAIT_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE");
  assert.equal(roadmap.pr20_9.liveExecutionAllowed,false);
  assert.equal(roadmap.pr20_9.productiveCraftAuthority,false);
  assert.equal(roadmap.pr20_9.broadGraphExecutionAuthority,false);
  assert.equal(roadmap.pr20_9.normalRuntimeAllowed,false);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.manifestCutoverPrepared,true);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.active,true);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.liveEvidenceObserved,true);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.latestObservedStatus,"BLOCKIERT");
  assert.equal(
    roadmap.pr20_9.craftDurableShadowRunner.latestBlocker,
    "PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT",
  );
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.latestNotificationId,3175);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.craftRatified,false);

  const parallel=roadmap.parallelPreparations.find(x=>x?.id==="PR20.9_PRODUCTION");
  assert.ok(parallel);
  assert.equal(parallel.status,roadmap.pr20_9.status);
  assert.equal(parallel.nextAction,roadmap.pr20_9.nextAction);
  assert.deepEqual(parallel.blockedBy,[]);
  assert.equal(parallel.gameplayAuthority,false);
  assert.equal(parallel.rawWriteAuthority,false);
  assert.equal(parallel.normalRuntimeAllowed,false);

  assert.equal(merchant.pr20_9.status,roadmap.pr20_9.status);
  assert.equal(merchant.pr20_9.nextAction,roadmap.pr20_9.nextAction);
  assert.deepEqual(merchant.pr20_9.produktivBlockiertBis,[]);
  assert.equal(merchant.pr20_9.mayExecuteLive,false);
  assert.equal(merchant.pr20_9.craftAuthority,false);
  assert.equal(merchant.pr20_9.gameplayAuthority,false);
  assert.equal(merchant.pr20_9.rawWriteAuthority,false);
  assert.equal(merchant.pr20_9.normalRuntimeAllowed,false);
});

test("PR20.9 expected live outcome is terminal durable shadow without Craft mutation",()=>{
  const e=cutover.expectedLiveOutcome;
  assert.equal(e.acceptedStatus,"BESTANDEN");
  assert.equal(e.phase,"COMPLETE");
  assert.equal(e.durableReadback,true);
  assert.equal(e.journalTerminalArt,"ABBRUCH");
  assert.equal(e.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(e.reconciliationClassification,"NOT_APPLIED");
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.authorityIssued,false);
  assert.equal(e.craftAuthority,false);
  assert.equal(e.sameIntentRetry,false);
});
