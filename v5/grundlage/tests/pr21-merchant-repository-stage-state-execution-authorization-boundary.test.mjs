import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantRepositoryStageStateApplyVor,
  pr21MerchantRepositoryStageStateAuthorizationConfirmationText,
  bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor,
  erteilePr21MerchantRepositoryStageStateExecutionAuthorization,
} from "../../erzeugt/index.js";

const MAIN="64931a95c02c1c369994f25d02f6af38cf331045";

function transitionBoundary() {
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

function defaultOffBoundary() {
  return bereitePr21MerchantRepositoryStageStateApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    currentMainCommit:MAIN,
    currentRepositoryState:{
      schemaVersion:1,
      currentStage:"PR21",
      currentGate:"PR21_MERCHANT_INTEGRATION",
      pr21StageStatus:"IN_PROGRESS",
      pr22StageStatus:"BLOCKED_BY_PR21",
    },
    transactionId:"tx-pr21-repository-stage-auth",
    preparedAtMs:4200,
  });
}

test("repository stage-state authorization draft is exact and non-executing",()=>{
  const boundary=defaultOffBoundary();
  assert.equal(boundary.status,"READY_DEFAULT_OFF");

  const draft=bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
    boundary,
    "auth-pr21-repository-stage-1",
    4300,
    5700,
  );
  assert.equal(
    draft.status,
    "AWAITING_EXPLICIT_REPOSITORY_STAGE_STATE_AUTHORIZATION",
  );
  assert.equal(draft.maximumUses,1);
  assert.equal(draft.expiresAtMs-draft.issuedAtMs,1400);
  assert.equal(draft.requiredCurrentStage,"PR21");
  assert.equal(draft.targetCurrentStage,"PR22");
  assert.equal(draft.targetCurrentGate,"PR22_MULTI_CHARACTER_COORDINATION");
  assert.equal(
    draft.requiredConfirmationText,
    pr21MerchantRepositoryStageStateAuthorizationConfirmationText(
      boundary.transaction.transactionFingerprint,
      MAIN,
    ),
  );
  assert.equal(draft.freshMainCheckRequiredAtExecution,true);
  assert.equal(draft.transactionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(
    draft.repositoryTransitionFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(draft.completionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(draft.durableIntentRequiredBeforeRepositoryMutation,true);
  assert.equal(draft.oneShotExecutionRequired,true);
  assert.equal(draft.sameIntentRetryAllowed,false);
  assert.equal(draft.postconditionVerificationRequired,true);
  assert.equal(draft.unknownOutcomeRequiresReconciliation,true);
  assert.equal(draft.repositoryApplyAdapterInstalled,false);
  assert.equal(draft.executionEnabled,false);
  assert.equal(draft.executionPerformed,false);
  assert.equal(draft.repositoryStageStateApplied,false);
  assert.equal(draft.roadmapMutationPerformed,false);
  assert.equal(draft.controlPlaneMutationPerformed,false);
  assert.equal(draft.pr22ProductiveAuthorityIssued,false);
  assert.equal(draft.gameplayAuthority,false);
  assert.equal(draft.rawWriteAuthority,false);
  assert.equal(draft.normalRuntimeAllowed,false);
});

test("generic acknowledgement cannot authorize repository state transition",()=>{
  const draft=bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
    defaultOffBoundary(),
    "auth-pr21-repository-stage-2",
    4300,
    5700,
  );
  for(const confirmation of ["ok","mach weiter","weiter","merge","authorize"]){
    assert.throws(
      ()=>erteilePr21MerchantRepositoryStageStateExecutionAuthorization(
        draft,
        confirmation,
        "operator",
        4400,
      ),
      /PR21_REPOSITORY_STAGE_AUTH_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("exact confirmation creates repository authorization record only",()=>{
  const draft=bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
    defaultOffBoundary(),
    "auth-pr21-repository-stage-3",
    4300,
    5700,
  );
  const record=erteilePr21MerchantRepositoryStageStateExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-repository-stage-authorizer",
    4400,
  );
  assert.equal(
    record.status,
    "AUTHORIZED_REPOSITORY_STAGE_STATE_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(record.repositoryStageStateExecutionAuthorizationIssued,true);
  assert.equal(record.authorizationConsumed,false);
  assert.equal(record.maximumUses,1);
  assert.equal(record.operatorId,"operator-repository-stage-authorizer");
  assert.equal(record.requiredCurrentStage,"PR21");
  assert.equal(record.targetCurrentStage,"PR22");
  assert.equal(record.targetCurrentGate,"PR22_MULTI_CHARACTER_COORDINATION");
  assert.equal(record.repositoryApplyAdapterInstalled,false);
  assert.equal(record.executionEnabled,false);
  assert.equal(record.executionPerformed,false);
  assert.equal(record.repositoryStageStateApplied,false);
  assert.equal(record.roadmapMutationPerformed,false);
  assert.equal(record.controlPlaneMutationPerformed,false);
  assert.equal(record.pr22ProductiveAuthorityIssued,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.normalRuntimeAllowed,false);
});

test("expired or oversized repository stage authorization is rejected",()=>{
  const boundary=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
      boundary,
      "auth-long",
      4300,
      5801,
    ),
    /PR21_REPOSITORY_STAGE_AUTH_TTL_UNGUELTIG/,
  );

  const draft=bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
    boundary,
    "auth-expired",
    4300,
    5700,
  );
  assert.throws(
    ()=>erteilePr21MerchantRepositoryStageStateExecutionAuthorization(
      draft,
      draft.requiredConfirmationText,
      "operator",
      5701,
    ),
    /PR21_REPOSITORY_STAGE_AUTH_ABGELAUFEN/,
  );
});

test("unsafe repository default-off boundary cannot prepare authorization",()=>{
  const boundary=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
      {...boundary,executionEnabled:true},
      "auth-unsafe",
      4300,
      5700,
    ),
    /PR21_REPOSITORY_STAGE_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT/,
  );
});

test("repository stage authorization contract remains authorization-only",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-repository-stage-state-execution-authorization-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_EXPLICIT_REPOSITORY_STAGE_STATE_ONE_SHOT_AUTHORIZATION_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredDefaultOffStatus,
    "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF",
  );
  assert.equal(contract.authorization.exactConfirmationRequired,true);
  assert.equal(contract.authorization.maximumTtlMs,1500);
  assert.equal(contract.authorization.maximumUses,1);
  assert.equal(contract.authorization.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(
    contract.authorization.repositoryTransitionFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(
    contract.authorization.completionFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(
    contract.authorization.durableIntentRequiredBeforeRepositoryMutation,
    true,
  );
  assert.equal(contract.authorization.sameIntentRetryAllowed,false);
  assert.equal(
    contract.safety.authorizationRecordDoesNotExecuteRepositoryMutation,
    true,
  );
  assert.equal(contract.safety.repositoryApplyAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.repositoryStageStateApplied,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
});

test("repository authorization source contains no mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-repository-stage-state-execution-authorization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "writeFile(","writeFileSync(","fs.write","git ","applyRepositoryState(",
    "execute(","mutieren(","executionEnabled: true",
    "repositoryStageStateApplied: true",
  ]) assert.equal(source.includes(marker),false,marker);
});
