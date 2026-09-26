import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantStageCompletionApplyVor,
  pr21MerchantStageCompletionAuthorizationConfirmationText,
  bereitePr21MerchantStageCompletionExecutionAuthorizationVor,
  erteilePr21MerchantStageCompletionExecutionAuthorization,
} from "../../erzeugt/index.js";

const MAIN="f23ae28a17f1eb9c7aabc7a99a141b2a2bce6a02";

function transitionBoundary() {
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

function defaultOffBoundary() {
  return bereitePr21MerchantStageCompletionApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    transactionId:"tx-pr21-stage-completion-auth",
    currentMainCommit:MAIN,
    preparedAtMs:3000,
  });
}

test("stage completion authorization draft is short-lived, exact and non-executing",()=>{
  const boundary=defaultOffBoundary();
  assert.equal(boundary.status,"READY_DEFAULT_OFF");

  const draft=bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
    boundary,
    "auth-pr21-stage-completion-1",
    3100,
    4500,
  );
  assert.equal(
    draft.status,
    "AWAITING_EXPLICIT_STAGE_COMPLETION_AUTHORIZATION",
  );
  assert.equal(draft.stage,"PR21");
  assert.equal(draft.nextStage,"PR22");
  assert.equal(draft.transactionId,boundary.transaction.transactionId);
  assert.equal(
    draft.transactionFingerprint,
    boundary.transaction.transactionFingerprint,
  );
  assert.equal(
    draft.transitionFingerprint,
    boundary.transaction.transitionFingerprint,
  );
  assert.equal(draft.settlementFingerprint,"1122334455667788");
  assert.equal(draft.ledgerFingerprint,"2233445566778899");
  assert.equal(draft.sourceMainCommit,MAIN);
  assert.equal(draft.maximumUses,1);
  assert.equal(draft.expiresAtMs-draft.issuedAtMs,1400);
  assert.equal(
    draft.requiredConfirmationText,
    pr21MerchantStageCompletionAuthorizationConfirmationText(
      boundary.transaction.transactionFingerprint,
      MAIN,
    ),
  );
  assert.equal(draft.freshMainCheckRequiredAtExecution,true);
  assert.equal(draft.transactionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.transitionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.durableIntentRequiredBeforeMutation,true);
  assert.equal(draft.oneShotExecutionRequired,true);
  assert.equal(draft.sameIntentRetryAllowed,false);
  assert.equal(draft.postconditionVerificationRequired,true);
  assert.equal(draft.unknownOutcomeRequiresReconciliation,true);
  assert.equal(draft.stageCompletionAdapterInstalled,false);
  assert.equal(draft.executionEnabled,false);
  assert.equal(draft.executionPerformed,false);
  assert.equal(draft.pr21StageCompletionApplied,false);
  assert.equal(draft.pr22DevelopmentStageActivated,false);
  assert.equal(draft.pr22ProductiveAuthorityIssued,false);
  assert.equal(draft.roadmapMutationPerformed,false);
  assert.equal(draft.ledgerMutationPerformed,false);
  assert.equal(draft.stageMutationPerformed,false);
  assert.equal(draft.gameplayAuthority,false);
  assert.equal(draft.rawWriteAuthority,false);
  assert.equal(draft.broadRuntimeGrant,false);
  assert.equal(draft.normalRuntimeAllowed,false);
});

test("generic acknowledgements cannot authorize PR21 stage completion execution",()=>{
  const draft=bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
    defaultOffBoundary(),
    "auth-pr21-stage-completion-2",
    3100,
    4500,
  );
  for(const confirmation of ["ok","mach weiter","weiter","merge","authorize"]){
    assert.throws(
      ()=>erteilePr21MerchantStageCompletionExecutionAuthorization(
        draft,
        confirmation,
        "operator",
        3200,
      ),
      /PR21_MERCHANT_STAGE_COMPLETION_AUTH_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("exact confirmation creates authorization record only",()=>{
  const draft=bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
    defaultOffBoundary(),
    "auth-pr21-stage-completion-3",
    3100,
    4500,
  );
  const record=erteilePr21MerchantStageCompletionExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-stage-completion-authorizer",
    3200,
  );
  assert.equal(
    record.status,
    "AUTHORIZED_STAGE_COMPLETION_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(record.stageCompletionExecutionAuthorizationIssued,true);
  assert.equal(record.authorizationConsumed,false);
  assert.equal(record.maximumUses,1);
  assert.equal(record.transactionFingerprint,draft.transactionFingerprint);
  assert.equal(record.transitionFingerprint,draft.transitionFingerprint);
  assert.equal(record.sourceMainCommit,MAIN);
  assert.equal(record.operatorId,"operator-stage-completion-authorizer");
  assert.equal(record.stageCompletionAdapterInstalled,false);
  assert.equal(record.executionEnabled,false);
  assert.equal(record.executionPerformed,false);
  assert.equal(record.pr21StageCompletionApplied,false);
  assert.equal(record.pr22DevelopmentStageActivated,false);
  assert.equal(record.pr22ProductiveAuthorityIssued,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.broadRuntimeGrant,false);
  assert.equal(record.normalRuntimeAllowed,false);
});

test("expired or oversized stage completion authorization is rejected",()=>{
  const boundary=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
      boundary,
      "auth-long",
      3100,
      4601,
    ),
    /PR21_MERCHANT_STAGE_COMPLETION_AUTH_TTL_UNGUELTIG/,
  );

  const draft=bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
    boundary,
    "auth-expired",
    3100,
    4500,
  );
  assert.throws(
    ()=>erteilePr21MerchantStageCompletionExecutionAuthorization(
      draft,
      draft.requiredConfirmationText,
      "operator",
      4501,
    ),
    /PR21_MERCHANT_STAGE_COMPLETION_AUTH_ABGELAUFEN/,
  );
});

test("unsafe default-off stage completion boundary cannot prepare authorization",()=>{
  const boundary=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
      {...boundary,executionEnabled:true},
      "auth-unsafe",
      3100,
      4500,
    ),
    /PR21_MERCHANT_STAGE_COMPLETION_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT/,
  );
});

test("stage completion authorization contract remains authorization-only",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-stage-completion-execution-authorization-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_EXPLICIT_STAGE_COMPLETION_ONE_SHOT_AUTHORIZATION_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.nextStage,"PR22");
  assert.equal(
    contract.requiredDefaultOffStatus,
    "PREPARED_STAGE_COMPLETION_DEFAULT_OFF",
  );
  assert.equal(contract.authorization.exactConfirmationRequired,true);
  assert.equal(contract.authorization.maximumTtlMs,1500);
  assert.equal(contract.authorization.maximumUses,1);
  assert.equal(contract.authorization.freshMainCheckRequiredAtExecution,true);
  assert.equal(
    contract.authorization.transitionFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(contract.authorization.durableIntentRequiredBeforeMutation,true);
  assert.equal(contract.authorization.sameIntentRetryAllowed,false);
  assert.equal(
    contract.safety.authorizationRecordDoesNotExecuteStageCompletion,
    true,
  );
  assert.equal(contract.safety.stageCompletionAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.executionPerformed,false);
  assert.equal(contract.safety.pr21StageCompletionApplied,false);
  assert.equal(contract.safety.pr22DevelopmentStageActivated,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("authorization source contains no stage mutation or gameplay execution",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-stage-completion-execution-authorization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","applyPr21StageCompletion(","execute(",
    "mutieren(","executionEnabled: true","executionPerformed: true",
    "pr22DevelopmentStageActivated: true",
  ]) assert.equal(source.includes(marker),false,marker);
});
