import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const cutover=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-natural-recheck-manifest-cutover.json",
  "utf8",
));
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-natural-recheck.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));
const packageFile=cutover.manifest.packagePath.replace(/^v5\//,"");
const packageBytes=fs.readFileSync(packageFile);
const packageSha256=crypto.createHash("sha256").update(packageBytes).digest("hex");

test("PR20.9 natural recheck manifest cutover is exact and hash-pinned",()=>{
  assert.equal(cutover.status,"MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(cutover.predecessor.testId,"pr20-9-craft-durable-shadow-no-write");
  assert.equal(cutover.predecessor.controllerVersion,"1.0.0");
  assert.equal(cutover.predecessor.terminalStatus,"BLOCKIERT");
  assert.equal(cutover.predecessor.blocker,"PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT");
  assert.equal(cutover.predecessor.historicalEvidenceRemainsImmutable,true);

  assert.equal(manifest.gate,"PR20.9_PRODUCTION");
  assert.equal(manifest.testId,cutover.manifest.testId);
  assert.equal(manifest.controllerVersion,cutover.manifest.controllerVersion);
  assert.equal(manifest.sourceCommit,cutover.manifest.sourceCommit);
  assert.equal(manifest.packagePath,cutover.manifest.packagePath);
  assert.equal(manifest.packageSha256,cutover.manifest.packageSha256);
  assert.equal(manifest.expectedGlobal,cutover.manifest.expectedGlobal);
  assert.equal(manifest.normalRuntimeAllowed,false);

  assert.equal(packageBytes.length,cutover.manifest.packageBytes);
  assert.equal(packageSha256,cutover.manifest.packageSha256);
  const pinned=execFileSync(
    "git",
    ["show",cutover.manifest.sourceCommit+":"+cutover.manifest.packagePath],
    {encoding:null,maxBuffer:256*1024},
  );
  assert.deepEqual(pinned,packageBytes);
});

test("PR20.9 natural recheck remains passive while no candidate exists",()=>{
  assert.equal(contract.status,"PREPARED_NO_WRITE");
  assert.equal(contract.scope,"NORMAL_CRAFT_ONLY");
  assert.equal(contract.recheckPolicy.intervalMs,60000);
  assert.equal(contract.recheckPolicy.naturalCurrentInventoryOnly,true);
  assert.equal(contract.recheckPolicy.candidateAcquisitionOrMutationAllowed,false);
  assert.equal(contract.authority.authorityIssued,false);
  assert.equal(contract.authority.craftAuthority,false);
  assert.equal(contract.authority.gameplayAuthority,false);
  assert.equal(contract.authority.rawWriteAuthority,false);
  assert.equal(contract.authority.broadGraphExecutionAuthority,false);
  assert.equal(contract.authority.normalRuntimeAllowed,false);
  assert.equal(contract.writes.maximumGameplayWrites,0);
  assert.equal(contract.writes.maximumPublicFunctionCalls,0);
  assert.equal(contract.writes.maximumRawWriteCalls,0);

  assert.equal(cutover.recheck.noCandidateIsTerminal,false);
  assert.equal(cutover.recheck.intervalMs,60000);
  assert.equal(cutover.recheck.candidateAcquisitionOrMutationAllowed,false);
  assert.equal(cutover.deploymentBoundary.gameplayWriteAllowed,false);
  assert.equal(cutover.deploymentBoundary.publicCraftCallAllowed,false);
  assert.equal(cutover.deploymentBoundary.rawWriteAllowed,false);
  assert.equal(cutover.deploymentBoundary.authorityIssued,false);
  assert.equal(cutover.pr20_9Boundary.manifestCutoverCountsAsCraftRatification,false);
  assert.equal(cutover.pr20_9Boundary.waitingObservationCountsAsCraftRatification,false);
  assert.equal(cutover.pr20_9Boundary.durableShadowSuccessCountsAsProductiveCraftRatification,false);
  assert.equal(cutover.pr20_9Boundary.pr21LivePreflightRemainsBlockedUntilPr20_9Ratified,true);
});

test("roadmap points at the recheck without advancing PR20.9",()=>{
  const p=roadmap.pr20_9;
  assert.equal(roadmap.currentGate,"PR20.9_PRODUCTION");
  assert.equal(p.status,"CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE");
  assert.equal(p.nextAction,"REMAIN_BLOCKED_WAIT_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE");
  assert.equal(p.liveExecutionAllowed,false);
  assert.equal(p.productiveCraftAuthority,false);
  assert.equal(p.broadGraphExecutionAuthority,false);
  assert.equal(p.normalRuntimeAllowed,false);

  assert.equal(p.craftDurableShadowRunner.active,false);
  assert.equal(p.craftDurableShadowRunner.supersededInManifest,true);
  assert.equal(p.craftDurableShadowRunner.historicalEvidenceImmutable,true);

  const recheck=p.craftDurableShadowNaturalRecheck;
  assert.equal(recheck.status,"MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(recheck.testId,manifest.testId);
  assert.equal(recheck.controllerVersion,manifest.controllerVersion);
  assert.equal(recheck.packageSha256,manifest.packageSha256);
  assert.equal(recheck.packageBytes,28696);
  assert.equal(recheck.recheckIntervalMs,60000);
  assert.equal(recheck.candidateAcquisitionOrMutationAllowed,false);
  assert.equal(recheck.maximumGameplayWrites,0);
  assert.equal(recheck.maximumPublicFunctionCalls,0);
  assert.equal(recheck.maximumRawWriteCalls,0);
  assert.equal(recheck.craftAuthority,false);
  assert.equal(recheck.gameplayAuthority,false);
  assert.equal(recheck.rawWriteAuthority,false);
  assert.equal(recheck.normalRuntimeAllowed,false);
  assert.equal(recheck.activeManifestTarget,true);
  assert.equal(recheck.liveDeploymentObserved,false);
  assert.equal(recheck.craftRatified,false);
  assert.equal(recheck.pr21RemainsBlockedUntilProductiveCraftRatification,true);
});
