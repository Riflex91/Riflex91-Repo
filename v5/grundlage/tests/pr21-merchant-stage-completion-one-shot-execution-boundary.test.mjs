import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantStageCompletionApplyVor,
  bereitePr21MerchantStageCompletionExecutionAuthorizationVor,
  erteilePr21MerchantStageCompletionExecutionAuthorization,
  fuehrePr21MerchantStageCompletionEinmalAus,
} from "../../erzeugt/index.js";

const MAIN="c39c5b818a62e32a59391125d353197afc28cdcf";

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

function prepared() {
  const boundary=bereitePr21MerchantStageCompletionApplyVor({
    schemaVersion:1,
    transitionBoundary:transitionBoundary(),
    transactionId:"tx-pr21-stage-completion-exec",
    currentMainCommit:MAIN,
    preparedAtMs:3000,
  });
  const draft=bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
    boundary,
    "auth-pr21-stage-completion-exec",
    3100,
    4500,
  );
  const authorization=erteilePr21MerchantStageCompletionExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-stage-completion-exec",
    3200,
  );
  return {boundary,authorization,transaction:boundary.transaction};
}

function writer(status="PERSISTED_NEW",events=[]) {
  return {
    async persistPr21MerchantStageCompletionIntent(input) {
      events.push("intent");
      return {
        schemaVersion:1,
        status,
        durableIntentId:"intent-pr21-stage-completion-1",
        authorizationId:input.authorizationId,
        transactionId:input.transactionId,
        operationKey:input.operationKey,
        transactionFingerprint:input.transactionFingerprint,
        persistedAtMs:3301,
      };
    },
  };
}

function adapter(options={},events=[]) {
  return {
    async applyPr21StageCompletion(input) {
      events.push("apply");
      if(options.throwApply) throw new Error("unknown");
      return {
        schemaVersion:1,
        outcome:options.outcome??"APPLIED",
        mutationAttempted:true,
        terminalMutationRecordPersisted:
          options.terminalMutationRecordPersisted??true,
      };
    },
    async readPr21StageCompletionPostcondition(input) {
      events.push("read");
      if(options.throwRead) throw new Error("unknown");
      return {
        schemaVersion:1,
        status:options.postconditionStatus??"APPLIED",
        stage:"PR21",
        nextStage:"PR22",
        transactionFingerprint:
          options.transactionFingerprint===undefined
            ? input.transactionFingerprint
            : options.transactionFingerprint,
        pr21StageCompletionApplied:
          options.pr21StageCompletionApplied??true,
        pr22DevelopmentStageActivated:
          options.pr22DevelopmentStageActivated??true,
        pr22ProductiveAuthorityIssued:false,
        observedAtMs:3302,
      };
    },
  };
}

test("one-shot stage completion persists intent before typed mutation and verifies postcondition",async()=>{
  const {authorization,transaction}=prepared();
  const events=[];
  const result=await fuehrePr21MerchantStageCompletionEinmalAus({
    schemaVersion:1,
    authorization,
    transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:transaction.transactionFingerprint,
    currentTransitionFingerprint:transaction.transitionFingerprint,
    executionAtMs:3300,
    restartSinceAuthorization:false,
    durableIntentWriter:writer("PERSISTED_NEW",events),
    controlPlaneAdapter:adapter({},events),
  });
  assert.deepEqual(events,["intent","apply","read"]);
  assert.equal(
    result.status,
    "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.durableIntentPersisted,true);
  assert.equal(result.mutationAttemptObserved,true);
  assert.equal(result.stageMutationPerformed,true);
  assert.equal(result.pr21StageCompletionApplied,true);
  assert.equal(result.pr22DevelopmentStageActivated,true);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.controlPlaneMutationOnly,true);
  assert.equal(result.roadmapMutationPerformed,false);
  assert.equal(result.ledgerMutationPerformed,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(
    result.completionRecord.status,
    "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
  );
  assert.match(result.completionRecord.completionFingerprint,/^[0-9a-f]{16}$/);
});

test("stale main, transition drift and restart block before durable intent",async()=>{
  for(const patch of [
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentTransitionFingerprint:"aaaaaaaaaaaaaaaa"},
    {restartSinceAuthorization:true},
  ]){
    const {authorization,transaction}=prepared();
    const events=[];
    const result=await fuehrePr21MerchantStageCompletionEinmalAus({
      schemaVersion:1,
      authorization,
      transaction,
      currentMainCommit:MAIN,
      currentTransactionFingerprint:transaction.transactionFingerprint,
      currentTransitionFingerprint:transaction.transitionFingerprint,
      executionAtMs:3300,
      restartSinceAuthorization:false,
      durableIntentWriter:writer("PERSISTED_NEW",events),
      controlPlaneAdapter:adapter({},events),
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT_PRECHECK");
    assert.equal(result.authorizationConsumed,false);
    assert.equal(result.stageMutationPerformed,false);
    assert.deepEqual(events,[]);
  }
});

test("existing durable intent never resumes or retries the stage mutation",async()=>{
  const {authorization,transaction}=prepared();
  const events=[];
  const result=await fuehrePr21MerchantStageCompletionEinmalAus({
    schemaVersion:1,
    authorization,
    transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:transaction.transactionFingerprint,
    currentTransitionFingerprint:transaction.transitionFingerprint,
    executionAtMs:3300,
    restartSinceAuthorization:false,
    durableIntentWriter:writer(
      "ALREADY_PERSISTED_RECONCILIATION_REQUIRED",
      events,
    ),
    controlPlaneAdapter:adapter({},events),
  });
  assert.deepEqual(events,["intent"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.durableIntentPersisted,true);
  assert.equal(result.mutationAttemptObserved,false);
  assert.equal(result.stageMutationPerformed,false);
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.blindResumeAfterRestartAllowed,false);
});

test("unknown or unverifiable mutation outcome is consumed and requires reconciliation",async()=>{
  const {authorization,transaction}=prepared();
  const events=[];
  const result=await fuehrePr21MerchantStageCompletionEinmalAus({
    schemaVersion:1,
    authorization,
    transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:transaction.transactionFingerprint,
    currentTransitionFingerprint:transaction.transitionFingerprint,
    executionAtMs:3300,
    restartSinceAuthorization:false,
    durableIntentWriter:writer("PERSISTED_NEW",events),
    controlPlaneAdapter:adapter({
      throwApply:true,
      postconditionStatus:"UNKNOWN",
      transactionFingerprint:null,
      pr21StageCompletionApplied:false,
      pr22DevelopmentStageActivated:false,
    },events),
  });
  assert.deepEqual(events,["intent","apply","read"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.mutationAttemptObserved,true);
  assert.equal(result.stageMutationPerformed,false);
  assert.equal(result.pr22DevelopmentStageActivated,false);
  assert.equal(result.sameIntentRetryAllowed,false);
});

test("stage completion execution contract keeps PR22 productive authority closed",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-stage-completion-one-shot-execution-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_ONE_SHOT_STAGE_COMPLETION_CONTROL_PLANE_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredAuthorizationStatus,
    "AUTHORIZED_STAGE_COMPLETION_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(contract.execution.typedControlPlaneAdapterOnly,true);
  assert.equal(contract.execution.controlPlaneAdapterMethod,"applyPr21StageCompletion");
  assert.equal(contract.execution.durableIntentRequiredBeforeMutation,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.execution.terminalMutationRecordRequired,true);
  assert.equal(contract.success.pr21StageCompletionApplied,true);
  assert.equal(contract.success.pr22DevelopmentStageActivated,true);
  assert.equal(contract.success.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.roadmapMutationPerformedByBoundary,false);
  assert.equal(contract.safety.ledgerMutationPerformedByBoundary,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("stage completion execution source exposes only typed control-plane mutation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-stage-completion-one-shot-execution-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(source.includes("applyPr21StageCompletion("),true);
  assert.equal(source.includes("readPr21StageCompletionPostcondition("),true);
});
