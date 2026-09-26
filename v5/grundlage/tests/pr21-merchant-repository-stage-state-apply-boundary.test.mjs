import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantRepositoryStageStateApplyVor,
} from "../../erzeugt/index.js";

const MAIN="1cad77963f2d6e6df14197f4031e0882be5fcc50";

function transitionBoundary(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
    completedStage:"PR21",
    nextDevelopmentStage:"PR22",
    sourceMainCommit:MAIN,
    transactionFingerprint:"0011223344556677",
    transitionFingerprint:"1122334455667788",
    completionFingerprint:"2233445566778899",
    preparedAtMs:4100,
    requiredPr21StageStatusBeforeApply:"IN_PROGRESS",
    requiredPr22StageStatusBeforeApply:"BLOCKED_BY_PR21",
    targetPr21StageStatus:"COMPLETE",
    targetPr22StageStatus:"IN_PROGRESS",
    targetCurrentStage:"PR22",
    pr22ProductiveAuthorityIssued:false,
    freshMainCheckRequiredAtApply:true,
    completionFingerprintRecheckRequiredAtApply:true,
    separateRepositoryStageStateApplyRequired:true,
    repositoryStageStateApplied:false,
    roadmapMutationPerformed:false,
    ledgerMutationPerformed:false,
    controlPlaneMutationPerformedByTransition:false,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
  const record={
    ...basis,
    repositoryTransitionFingerprint:evidenceFingerprint(basis),
  };
  return {
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
    blocker:[],
    completedStage:"PR21",
    nextDevelopmentStage:"PR22",
    record,
    repositoryStageStateApplied:false,
    roadmapMutationPerformed:false,
    ledgerMutationPerformed:false,
    controlPlaneMutationPerformedByTransition:false,
    pr22ProductiveAuthorityIssued:false,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
  };
}

function state(patch={}) {
  return {
    schemaVersion:1,
    currentStage:"PR21",
    currentGate:"PR21_MERCHANT_INTEGRATION",
    pr21StageStatus:"IN_PROGRESS",
    pr22StageStatus:"BLOCKED_BY_PR21",
    ...patch,
  };
}

test("repository stage-state apply prepares deterministic default-off transaction",()=>{
  const result=bereitePr21MerchantRepositoryStageStateApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    transactionId:"tx-pr21-repository-stage-state",
    preparedAtMs:4200,
  });
  assert.equal(result.status,"READY_DEFAULT_OFF");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.currentMainMatched,true);
  assert.equal(result.repositoryTransitionFingerprintMatched,true);
  assert.equal(result.repositoryStateMatched,true);
  assert.equal(
    result.transaction.status,
    "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF",
  );
  assert.equal(result.transaction.requiredCurrentStage,"PR21");
  assert.equal(
    result.transaction.requiredCurrentGate,
    "PR21_MERCHANT_INTEGRATION",
  );
  assert.equal(result.transaction.requiredPr21StageStatus,"IN_PROGRESS");
  assert.equal(result.transaction.requiredPr22StageStatus,"BLOCKED_BY_PR21");
  assert.equal(result.transaction.targetPr21StageStatus,"COMPLETE");
  assert.equal(result.transaction.targetPr22StageStatus,"IN_PROGRESS");
  assert.equal(result.transaction.targetCurrentStage,"PR22");
  assert.equal(
    result.transaction.targetCurrentGate,
    "PR22_MULTI_CHARACTER_COORDINATION",
  );
  assert.equal(result.transaction.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.transaction.freshMainCheckRequiredAtExecution,true);
  assert.equal(
    result.transaction.repositoryTransitionFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(
    result.transaction.completionFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(result.transaction.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(
    result.transaction.durableIntentRequiredBeforeRepositoryMutation,
    true,
  );
  assert.equal(result.transaction.oneShotExecutionRequired,true);
  assert.equal(result.transaction.sameIntentRetryAllowed,false);
  assert.equal(result.transaction.postconditionVerificationRequired,true);
  assert.equal(result.transaction.unknownOutcomeRequiresReconciliation,true);
  assert.match(result.transaction.transactionFingerprint,/^[0-9a-f]{16}$/);
  assert.equal(result.repositoryApplyAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.repositoryStageStateApplied,false);
  assert.equal(result.roadmapMutationPerformed,false);
  assert.equal(result.stageArrayMutationPerformed,false);
  assert.equal(result.currentStageMutationPerformed,false);
  assert.equal(result.currentGateMutationPerformed,false);
  assert.equal(result.controlPlaneMutationPerformed,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.separateExecutionAuthorizationRequired,true);
});

test("stale main blocks repository stage-state apply preparation",()=>{
  const result=bereitePr21MerchantRepositoryStageStateApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    currentRepositoryState:state(),
    transactionId:"tx-pr21-repository-stage-state-stale",
    preparedAtMs:4200,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.currentMainMatched,false);
  assert.ok(result.blocker.includes("PR21_REPOSITORY_STAGE_APPLY_MAIN_STALE"));
});

test("repository state drift blocks default-off preparation",()=>{
  for(const patch of [
    {currentStage:"PR22"},
    {currentGate:"PR22_MULTI_CHARACTER_COORDINATION"},
    {pr21StageStatus:"COMPLETE"},
    {pr22StageStatus:"IN_PROGRESS"},
  ]){
    const result=bereitePr21MerchantRepositoryStageStateApplyVor({
      schemaVersion:1,
      transitionBoundary:transitionBoundary(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(patch),
      transactionId:"tx-pr21-repository-stage-state-drift",
      preparedAtMs:4200,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.transaction,null);
    assert.equal(result.repositoryStateMatched,false);
    assert.ok(result.blocker.includes("PR21_REPOSITORY_STAGE_APPLY_STATE_DRIFT"));
  }
});

test("tampered repository transition fingerprint blocks preparation",()=>{
  const boundary=transitionBoundary();
  const tampered={
    ...boundary,
    record:{
      ...boundary.record,
      completionFingerprint:"abcdefabcdefabcd",
    },
  };
  const result=bereitePr21MerchantRepositoryStageStateApplyVor({
    schemaVersion:1,
    transitionBoundary:tampered,
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    transactionId:"tx-pr21-repository-stage-state-tampered",
    preparedAtMs:4200,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.repositoryTransitionFingerprintMatched,false);
  assert.ok(result.blocker.includes(
    "PR21_REPOSITORY_STAGE_APPLY_TRANSITION_FP_DRIFT",
  ));
});

test("repository stage-state apply contract remains default-off",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-repository-stage-state-apply-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredTransitionStatus,
    "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
  );
  assert.equal(
    contract.transaction.status,
    "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF",
  );
  assert.equal(contract.transaction.requiredCurrentStage,"PR21");
  assert.equal(
    contract.transaction.requiredCurrentGate,
    "PR21_MERCHANT_INTEGRATION",
  );
  assert.equal(contract.transaction.targetCurrentStage,"PR22");
  assert.equal(
    contract.transaction.targetCurrentGate,
    "PR22_MULTI_CHARACTER_COORDINATION",
  );
  assert.equal(contract.transaction.targetPr21StageStatus,"COMPLETE");
  assert.equal(contract.transaction.targetPr22StageStatus,"IN_PROGRESS");
  assert.equal(contract.safety.repositoryApplyAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.repositoryStageStateApplied,false);
  assert.equal(contract.safety.roadmapMutationPerformed,false);
  assert.equal(contract.safety.controlPlaneMutationPerformed,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("repository apply source contains no repository mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-repository-stage-state-apply-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "writeFile(","writeFileSync(","fs.write","git ","applyRepositoryState(",
    "execute(","mutieren(","executionEnabled: true",
  ]) assert.equal(source.includes(marker),false,marker);
});
