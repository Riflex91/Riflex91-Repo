import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantStageCompletionApplyVor,
} from "../../erzeugt/index.js";

const MAIN="f7d19086bc4576ed1df7b76591073b0806a53057";

function transitionBoundary(recordPatch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY",
    stage:"PR21",
    nextStage:"PR22",
    sourceMainCommit:MAIN,
    transactionFingerprint:"0011223344556677",
    settlementFingerprint:"1122334455667788",
    ledgerFingerprint:"2233445566778899",
    preparedAtMs:2500,
    pr21ProductiveEligible:true,
    pr22ProductiveEligibleAtTransition:false,
    freshMainCheckRequiredAtApply:true,
    separateStageCompletionApplyRequired:true,
    pr21StageCompletionApplied:false,
    pr22DevelopmentStageActivated:false,
    pr22ProductiveAuthorityIssued:false,
    roadmapMutationPerformed:false,
    ledgerMutationPerformed:false,
    stageMutationPerformed:false,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    ...recordPatch,
  };
  const record={
    ...basis,
    transitionFingerprint:evidenceFingerprint(basis),
  };
  return {
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY",
    blocker:[],
    stage:"PR21",
    nextStage:"PR22",
    record,
    pr21StageCompletionApplied:false,
    pr22DevelopmentStageActivated:false,
    pr22ProductiveAuthorityIssued:false,
    roadmapMutationPerformed:false,
    ledgerMutationPerformed:false,
    stageMutationPerformed:false,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
  };
}

test("stage completion apply prepares a deterministic default-off transaction only",()=>{
  const result=bereitePr21MerchantStageCompletionApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    transactionId:"tx-pr21-stage-completion-1",
    currentMainCommit:MAIN,
    preparedAtMs:3000,
  });
  assert.equal(result.status,"READY_DEFAULT_OFF");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.transitionFingerprintMatched,true);
  assert.equal(result.currentMainMatched,true);
  assert.equal(result.transaction.status,"PREPARED_STAGE_COMPLETION_DEFAULT_OFF");
  assert.equal(result.transaction.stage,"PR21");
  assert.equal(result.transaction.nextStage,"PR22");
  assert.equal(result.transaction.freshMainCheckRequiredAtExecution,true);
  assert.equal(result.transaction.transitionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.durableIntentRequiredBeforeMutation,true);
  assert.equal(result.transaction.oneShotExecutionRequired,true);
  assert.equal(result.transaction.sameIntentRetryAllowed,false);
  assert.equal(result.transaction.postconditionVerificationRequired,true);
  assert.equal(result.transaction.unknownOutcomeRequiresReconciliation,true);
  assert.match(result.transaction.transactionFingerprint,/^[0-9a-f]{16}$/);
  assert.equal(result.stageCompletionAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.pr21StageCompletionApplied,false);
  assert.equal(result.pr22DevelopmentStageActivated,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.roadmapMutationPerformed,false);
  assert.equal(result.ledgerMutationPerformed,false);
  assert.equal(result.stageMutationPerformed,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.separateExecutionAuthorizationRequired,true);
});

test("stale main blocks stage completion apply preparation",()=>{
  const result=bereitePr21MerchantStageCompletionApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    transactionId:"tx-pr21-stage-completion-stale",
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    preparedAtMs:3000,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.currentMainMatched,false);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_MAIN_STALE",
  ));
});

test("tampered transition fingerprint blocks stage completion apply",()=>{
  const boundary=transitionBoundary();
  const tampered={
    ...boundary,
    record:{
      ...boundary.record,
      ledgerFingerprint:"abcdefabcdefabcd",
    },
  };
  const result=bereitePr21MerchantStageCompletionApplyVor({
    schemaVersion:1,
    transitionBoundary:tampered,
    transactionId:"tx-pr21-stage-completion-tampered",
    currentMainCommit:MAIN,
    preparedAtMs:3000,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.transitionFingerprintMatched,false);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSITION_FP_DRIFT",
  ));
});

test("blocked transition boundary cannot prepare stage completion",()=>{
  const ready=transitionBoundary();
  const blocked={
    ...ready,
    status:"BLOCKIERT",
    blocker:["synthetic blocker"],
    record:null,
  };
  const result=bereitePr21MerchantStageCompletionApplyVor({
    schemaVersion:1,
    transitionBoundary:blocked,
    transactionId:"tx-pr21-stage-completion-blocked",
    currentMainCommit:MAIN,
    preparedAtMs:3000,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSITION_NICHT_BEREIT",
  ));
});

test("stage completion apply contract remains default-off and does not activate PR22",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-stage-completion-apply-boundary.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_STAGE_COMPLETION_DEFAULT_OFF_NO_EXECUTION");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.nextStage,"PR22");
  assert.equal(contract.requiredTransitionStatus,"READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY");
  assert.equal(contract.transaction.status,"PREPARED_STAGE_COMPLETION_DEFAULT_OFF");
  assert.equal(contract.transaction.freshMainCheckRequiredAtExecution,true);
  assert.equal(contract.transaction.durableIntentRequiredBeforeMutation,true);
  assert.equal(contract.transaction.sameIntentRetryAllowed,false);
  assert.equal(contract.safety.stageCompletionAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.pr21StageCompletionApplied,false);
  assert.equal(contract.safety.pr22DevelopmentStageActivated,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
  assert.equal(contract.nextAction,"PREPARE_PR21_STAGE_COMPLETION_EXECUTION_AUTHORIZATION_BOUNDARY");
});

test("stage completion apply source contains no stage mutation or gameplay execution",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-stage-completion-apply-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","applyPr21StageCompletion(","execute(","mutieren(",
    "executionEnabled: true","pr22DevelopmentStageActivated: true",
  ]) assert.equal(source.includes(marker),false,marker);
});
