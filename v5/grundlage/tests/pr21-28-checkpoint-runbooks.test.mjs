import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bauePr21_28CheckpointRunbook,
  bauePr21_28ResultPackage,
  planePr21_28MilestoneRunner,
  wertePr21_28MilestoneSamplesAus,
  bewertePr21_28LiveEvidence,
} from "../../erzeugt/index.js";

function sample(sequenz, beobachtetAmMs, segmentId, overrides={}) {
  return {
    schemaVersion:1,
    sequenz,
    beobachtetAmMs,
    segmentId,
    healthZustand:"GESUND",
    operationsAktuell:true,
    recorderDrops:0,
    unerwarteteGameplayWrites:0,
    duplicateIrreversibleEffects:0,
    safetyViolations:0,
    sameIntentRetries:0,
    unresolvedTransactions:0,
    authorityLeaks:0,
    restartRecoveryFailures:0,
    staleEvidenceActions:0,
    thrashEvents:0,
    pingpongEvents:0,
    starvationCriticalCount:0,
    ...overrides,
  };
}

function series(segmentId,startMs,dauerSekunden,intervallMs,startSequence=1) {
  const out=[];
  const endMs=startMs+dauerSekunden*1000;
  let sequence=startSequence;
  for(let t=startMs;t<=endMs;t+=intervallMs){
    out.push(sample(sequence,t,segmentId));
    sequence+=1;
  }
  if(out.at(-1)?.beobachtetAmMs!==endMs){
    out.push(sample(sequence,endMs,segmentId));
  }
  return out;
}

function readyObservability(overrides={}) {
  return {
    schemaVersion:1,
    status:"BEOBACHTUNG_BEREIT",
    blocker:[],
    activeAuthorityIds:["runtime:merchant"],
    missingRequiredAuthorityIds:[],
    unexpectedActiveAuthorityIds:[],
    authorityLeakCount:0,
    dashboardFehlerDiagnosticOnly:2,
    recorderDrops:0,
    operationsBackpressureAktiv:false,
    resourceMetricsComplete:true,
    dashboardFailureBlocksGameplay:false,
    observerActionAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

test("checkpoint runbooks encode the agreed operator-independent control flow",()=>{
  const merchant=bauePr21_28CheckpointRunbook("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const group=bauePr21_28CheckpointRunbook("POST_PR24_25_GROUP_CHECKPOINT");
  const final=bauePr21_28CheckpointRunbook("POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN");

  assert.equal(merchant.minimumDurationSeconds,900);
  assert.equal(merchant.targetDurationSeconds,900);
  assert.equal(merchant.cap022FullChainRequired,false);
  assert.equal(merchant.requiredPreconditions.includes("CAP022_FULL_CHAIN_READY"),false);
  assert.equal(group.minimumDurationSeconds,1200);
  assert.equal(group.targetDurationSeconds,1200);
  assert.equal(group.cap022FullChainRequired,true);
  assert.ok(group.requiredPreconditions.includes("CAP022_FULL_CHAIN_READY"));
  assert.equal(final.minimumDurationSeconds,7200);
  assert.equal(final.targetDurationSeconds,10800);
  assert.equal(final.cap022FullChainRequired,false);
  assert.equal(final.requiredPreconditions.includes("CAP022_FULL_CHAIN_READY"),false);

  for(const runbook of [merchant,group,final]){
    assert.deepEqual(runbook.steps.map(x=>x.order),[1,2,3,4,5,6,7,8,9,10]);
    assert.ok(runbook.steps.every(x=>x.requiresProductiveWriteFromRunner===false));
    assert.ok(runbook.steps.every(x=>x.failClosed===true));
    assert.equal(runbook.manualRatificationRequired,true);
    assert.equal(runbook.externalRuntimeOwnsGameplayAuthority,true);
    assert.equal(runbook.runnerOwnsGameplayAuthority,false);
    assert.equal(runbook.runnerGameplayWrites,0);
    assert.equal(runbook.runnerPublicFunctionCalls,0);
    assert.equal(runbook.runnerRawWriteCalls,0);
    assert.equal(runbook.normalRuntimeAllowedByRunbook,false);
    assert.ok(runbook.requiredPreconditions.includes("CURRENT_MAIN_VERIFIED"));
    assert.ok(runbook.requiredPreconditions.includes("REQUIRED_FEATURE_GATES_RATIFIED"));
    assert.ok(runbook.abortSignals.includes("SAME_INTENT_RETRY"));
    assert.ok(runbook.abortSignals.includes("AUTHORITY_LEAK"));
    assert.ok(runbook.completionArtifacts.includes("IMMUTABLE_RESULT_PACKAGE"));
    assert.ok(runbook.completionArtifacts.includes("MANUAL_RATIFICATION_DECISION"));
  }
});

test("clean Merchant checkpoint builds a deterministic package ready only for manual ratification",()=>{
  const plan=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const runner=wertePr21_28MilestoneSamplesAus(
    plan,
    series("pr21-merchant-integration",0,900,5000),
    {schemaVersion:1,cap022FullChainReady:true},
  );
  const evidence=runner.evidenceRows.map(row=>bewertePr21_28LiveEvidence(row));
  const input={
    schemaVersion:1,
    packageId:"pkg-pr21-merchant-1",
    sourceMainCommit:"3f916863117c9b59aa6476049bf390ce1cd15d8b",
    createdAtMs:1000000,
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    runner,
    observability:readyObservability(),
    evidence,
  };

  const first=bauePr21_28ResultPackage(input);
  const second=bauePr21_28ResultPackage(input);

  assert.equal(first.status,"READY_FOR_MANUAL_RATIFICATION");
  assert.deepEqual(first.blocker,[]);
  assert.equal(first.runnerStatus,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(first.observabilityStatus,"BEOBACHTUNG_BEREIT");
  assert.equal(first.evidenceIds.length,1);
  assert.equal(first.sampleGaps,0);
  assert.equal(first.alleMinimaErreicht,true);
  assert.equal(first.alleZieleErreicht,true);
  assert.equal(first.manualRatificationRequired,true);
  assert.equal(first.ratifiedByPackageBuilder,false);
  assert.equal(first.authorityIssuedByPackageBuilder,false);
  assert.equal(first.gameplayAuthority,false);
  assert.equal(first.rawWriteAuthority,false);
  assert.equal(first.normalRuntimeAllowed,false);
  assert.match(first.packageFingerprint,/^[0-9a-f]{16}$/);
  assert.equal(first.packageFingerprint,second.packageFingerprint);
});

test("result package fingerprint changes on diagnostic evidence change without turning dashboard failure into a blocker",()=>{
  const plan=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const runner=wertePr21_28MilestoneSamplesAus(
    plan,
    series("pr21-merchant-integration",0,900,5000),
    {schemaVersion:1,cap022FullChainReady:true},
  );
  const evidence=runner.evidenceRows.map(row=>bewertePr21_28LiveEvidence(row));
  const common={
    schemaVersion:1,
    packageId:"pkg-pr21-merchant-diag",
    sourceMainCommit:"3f916863117c9b59aa6476049bf390ce1cd15d8b",
    createdAtMs:1000000,
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    runner,
    evidence,
  };
  const a=bauePr21_28ResultPackage({
    ...common,
    observability:readyObservability({dashboardFehlerDiagnosticOnly:1}),
  });
  const b=bauePr21_28ResultPackage({
    ...common,
    observability:readyObservability({dashboardFehlerDiagnosticOnly:9}),
  });
  assert.equal(a.status,"READY_FOR_MANUAL_RATIFICATION");
  assert.equal(b.status,"READY_FOR_MANUAL_RATIFICATION");
  assert.notEqual(a.packageFingerprint,b.packageFingerprint);
});

test("result package blocks runner, observability and evidence drift",()=>{
  const plan=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const samples=series("pr21-merchant-integration",0,900,5000);
  samples[20]={...samples[20],safetyViolations:1};
  const runner=wertePr21_28MilestoneSamplesAus(
    plan,
    samples,
    {schemaVersion:1,cap022FullChainReady:true},
  );
  const evidence=runner.evidenceRows.map(row=>bewertePr21_28LiveEvidence(row));

  const result=bauePr21_28ResultPackage({
    schemaVersion:1,
    packageId:"pkg-blocked",
    sourceMainCommit:"3f916863117c9b59aa6476049bf390ce1cd15d8b",
    createdAtMs:1000000,
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    runner,
    observability:readyObservability({
      status:"BLOCKIERT",
      blocker:["PR21_28_MILESTONE_UNEXPECTED_AUTHORITY"],
      unexpectedActiveAuthorityIds:["runtime:unexpected"],
      authorityLeakCount:1,
    }),
    evidence,
  });

  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_28_RESULT_RUNNER_BLOCKIERT"));
  assert.ok(result.blocker.includes("PR21_28_RESULT_OBSERVABILITY_BLOCKIERT"));
  assert.ok(result.blocker.includes("PR21_28_RESULT_AUTHORITY_LEAK"));
  assert.ok(result.blocker.some(x=>x.startsWith("PR21_28_RESULT_EVIDENCE_BLOCKIERT:")));
  assert.equal(result.ratifiedByPackageBuilder,false);
  assert.equal(result.authorityIssuedByPackageBuilder,false);
});

test("result package rejects checkpoint binding drift and invalid main pin",()=>{
  const plan=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const runner=wertePr21_28MilestoneSamplesAus(
    plan,
    series("pr21-merchant-integration",0,900,5000),
    {schemaVersion:1,cap022FullChainReady:true},
  );
  const evidence=runner.evidenceRows.map(row=>bewertePr21_28LiveEvidence(row));

  assert.throws(()=>bauePr21_28ResultPackage({
    schemaVersion:1,
    packageId:"pkg-bad-main",
    sourceMainCommit:"not-a-commit",
    createdAtMs:1,
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    runner,
    observability:readyObservability(),
    evidence,
  }),/PR21_28_RESULT_PACKAGE_MAIN_COMMIT_UNGUELTIG/);

  assert.throws(()=>bauePr21_28ResultPackage({
    schemaVersion:1,
    packageId:"pkg-drift",
    sourceMainCommit:"3f916863117c9b59aa6476049bf390ce1cd15d8b",
    createdAtMs:1,
    checkpointId:"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN",
    runner,
    observability:readyObservability(),
    evidence,
  }),/PR21_28_RESULT_PACKAGE_CHECKPOINT_DRIFT/);
});

test("checkpoint runbook and result package contain no gameplay mutation bypass",()=>{
  const paths=[
    "grundlage/quelle/zertifizierung/pr21-28-checkpoint-runbook.ts",
    "grundlage/quelle/zertifizierung/pr21-28-result-package.ts",
  ];
  const forbidden=[
    "socket.emit(",
    ".socket.emit(",
    "send_cm(",
    "smart_move(",
    "attack(",
    "use_skill(",
    "loot(",
    "respawn(",
    "change_server(",
    "craft(",
    "exchange(",
    "upgrade(",
    "compound(",
  ];
  for(const path of paths){
    const source=fs.readFileSync(path,"utf8");
    for(const marker of forbidden){
      assert.equal(source.includes(marker),false,path+" -> "+marker);
    }
  }
});


test("Checkpoint-Runbook-Vertrag und Roadmap verlangen CAP-022 vor Group-Runtime",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-28-checkpoint-runbooks.json",
    "utf8",
  ));
  const boundary=contract.cap022FullChainBoundary;
  assert.equal(boundary.requiredCheckpoint,"POST_PR24_25_GROUP_CHECKPOINT");
  assert.equal(boundary.requiredPrecondition,"CAP022_FULL_CHAIN_READY");
  assert.equal(boundary.runbookField,"cap022FullChainRequired");
  assert.equal(boundary.milestoneEvaluationMustConfirmFullChain,true);
  assert.equal(boundary.missingFullChainMayNotStartExternalRuntime,true);
  assert.equal(boundary.manualRatificationStillRequired,true);
  assert.equal(boundary.runnerOwnsGameplayAuthority,false);
  assert.equal(boundary.currentPr20_9RatificationCredit,false);
  assert.equal(boundary.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(boundary.durableIntentCreated,false);
  assert.equal(boundary.productiveCraftAuthorityOpened,false);

  const roadmap=JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  const binding=
    roadmap.pr23.materialAcquisitionFoundation
      .fullChainOrchestrationReadiness.checkpointRunbookBinding;
  assert.equal(binding.requiredCheckpoint,"POST_PR24_25_GROUP_CHECKPOINT");
  assert.equal(binding.requiredPrecondition,"CAP022_FULL_CHAIN_READY");
  assert.equal(binding.runbookField,"cap022FullChainRequired");
  assert.equal(binding.missingFullChainMayNotStartExternalRuntime,true);
  assert.equal(binding.manualRatificationStillRequired,true);
  assert.equal(binding.runnerOwnsGameplayAuthority,false);
  assert.equal(binding.currentPr20_9RatificationCredit,false);
  assert.equal(binding.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(binding.durableIntentCreated,false);
  assert.equal(binding.productiveCraftAuthorityOpened,false);
  assert.equal(binding.normalRuntimeAllowed,false);
});
