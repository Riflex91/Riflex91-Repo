import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantStageCompletionPostExecutionTransitionVor,
} from "../../erzeugt/index.js";

const MAIN="d946a109be4580f6b4aeb42aeca09f27631b0ef7";

function completionRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
    stage:"PR21",
    nextStage:"PR22",
    authorizationId:"auth-pr21-post-exec",
    transactionId:"tx-pr21-post-exec",
    transactionFingerprint:"0011223344556677",
    transitionFingerprint:"1122334455667788",
    settlementFingerprint:"2233445566778899",
    ledgerFingerprint:"33445566778899aa",
    sourceMainCommit:MAIN,
    durableIntentId:"intent-pr21-post-exec",
    appliedAtMs:4000,
    pr21StageCompletionApplied:true,
    pr22DevelopmentStageActivated:true,
    pr22ProductiveAuthorityIssued:false,
    controlPlaneMutationOnly:true,
    roadmapMutationPerformed:false,
    ledgerMutationPerformed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
  return {
    ...basis,
    completionFingerprint:evidenceFingerprint(basis),
  };
}

function execution(record=completionRecord()) {
  return {
    schemaVersion:1,
    status:"APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
    blocker:[],
    stage:"PR21",
    nextStage:"PR22",
    authorizationId:record.authorizationId,
    transactionId:record.transactionId,
    transactionFingerprint:record.transactionFingerprint,
    authorizationConsumed:true,
    durableIntentPersisted:true,
    mutationAttemptObserved:true,
    stageMutationPerformed:true,
    pr21StageCompletionApplied:true,
    pr22DevelopmentStageActivated:true,
    pr22ProductiveAuthorityIssued:false,
    controlPlaneMutationOnly:true,
    completionRecord:record,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
    roadmapMutationPerformed:false,
    ledgerMutationPerformed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
  };
}

test("verified stage completion yields repository stage-state apply proposal only",()=>{
  const result=bereitePr21MerchantStageCompletionPostExecutionTransitionVor({
    schemaVersion:1,
    execution:execution(),
    currentMainCommit:MAIN,
    preparedAtMs:4100,
  });
  assert.equal(
    result.status,
    "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.completedStage,"PR21");
  assert.equal(result.nextDevelopmentStage,"PR22");
  assert.equal(
    result.record.status,
    "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
  );
  assert.equal(result.record.requiredPr21StageStatusBeforeApply,"IN_PROGRESS");
  assert.equal(result.record.requiredPr22StageStatusBeforeApply,"BLOCKED_BY_PR21");
  assert.equal(result.record.targetPr21StageStatus,"COMPLETE");
  assert.equal(result.record.targetPr22StageStatus,"IN_PROGRESS");
  assert.equal(result.record.targetCurrentStage,"PR22");
  assert.equal(result.record.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.record.freshMainCheckRequiredAtApply,true);
  assert.equal(result.record.completionFingerprintRecheckRequiredAtApply,true);
  assert.equal(result.record.separateRepositoryStageStateApplyRequired,true);
  assert.match(
    result.record.repositoryTransitionFingerprint,
    /^[0-9a-f]{16}$/,
  );
  assert.equal(result.repositoryStageStateApplied,false);
  assert.equal(result.roadmapMutationPerformed,false);
  assert.equal(result.ledgerMutationPerformed,false);
  assert.equal(result.controlPlaneMutationPerformedByTransition,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("stale main blocks repository transition proposal",()=>{
  const result=bereitePr21MerchantStageCompletionPostExecutionTransitionVor({
    schemaVersion:1,
    execution:execution(),
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    preparedAtMs:4100,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_POST_EXECUTION_MAIN_STALE",
  ));
});

test("tampered completion record is rejected",()=>{
  const valid=completionRecord();
  const tampered={
    ...valid,
    ledgerFingerprint:"abcdefabcdefabcd",
  };
  const result=bereitePr21MerchantStageCompletionPostExecutionTransitionVor({
    schemaVersion:1,
    execution:execution(tampered),
    currentMainCommit:MAIN,
    preparedAtMs:4100,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_POST_EXECUTION_COMPLETION_RECORD_UNGUELTIG",
  ));
});

test("non-successful execution cannot prepare repository state apply",()=>{
  const failed={
    ...execution(),
    status:"BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker:["unknown"],
    stageMutationPerformed:false,
    pr21StageCompletionApplied:false,
    pr22DevelopmentStageActivated:false,
    completionRecord:null,
  };
  const result=bereitePr21MerchantStageCompletionPostExecutionTransitionVor({
    schemaVersion:1,
    execution:failed,
    currentMainCommit:MAIN,
    preparedAtMs:4100,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_POST_EXECUTION_EXECUTION_NICHT_VERIFIZIERT",
  ));
});

test("post-execution transition contract stays proposal-only",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-stage-completion-post-execution-transition-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_POST_EXECUTION_REPOSITORY_TRANSITION_PROPOSAL_ONLY",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredExecutionStatus,
    "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
  );
  assert.equal(
    contract.requiredProposalStatus,
    "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
  );
  assert.equal(contract.target.completedStage,"PR21");
  assert.equal(contract.target.nextDevelopmentStage,"PR22");
  assert.equal(contract.target.pr21StageStatus,"COMPLETE");
  assert.equal(contract.target.pr22StageStatus,"IN_PROGRESS");
  assert.equal(contract.target.currentStage,"PR22");
  assert.equal(contract.target.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.apply.separateRepositoryStageStateApplyRequired,true);
  assert.equal(contract.apply.repositoryStageStateApplied,false);
  assert.equal(contract.safety.roadmapMutationPerformed,false);
  assert.equal(contract.safety.ledgerMutationPerformed,false);
  assert.equal(contract.safety.controlPlaneMutationPerformed,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("post-execution transition source contains no mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-stage-completion-post-execution-transition-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","applyPr21StageCompletion(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
