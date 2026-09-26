import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr21MerchantRepositoryStageStateApplyVor,
  bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor,
  erteilePr21MerchantRepositoryStageStateExecutionAuthorization,
  fuehrePr21MerchantRepositoryStageStateEinmalAus,
} from "../../erzeugt/index.js";

const MAIN="ec84fbf03025e3962d8af51c6e66af733f8dfe4d";

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

function prepared() {
  const boundary=bereitePr21MerchantRepositoryStageStateApplyVor({
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
    transactionId:"tx-pr21-repository-stage-exec",
    preparedAtMs:4200,
  });
  const draft=bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
    boundary,
    "auth-pr21-repository-stage-exec",
    4300,
    5700,
  );
  const authorization=erteilePr21MerchantRepositoryStageStateExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-repository-stage-exec",
    4400,
  );
  return {boundary,authorization,transaction:boundary.transaction};
}

function writer(status="PERSISTED_NEW",events=[]) {
  return {
    async persistPr21MerchantRepositoryStageStateIntent(input) {
      events.push("intent");
      return {
        schemaVersion:1,
        status,
        durableIntentId:"intent-pr21-repository-stage-1",
        authorizationId:input.authorizationId,
        transactionId:input.transactionId,
        operationKey:input.operationKey,
        transactionFingerprint:input.transactionFingerprint,
        persistedAtMs:4501,
      };
    },
  };
}

function adapter(options={},events=[]) {
  return {
    async applyPr21RepositoryStageStateTransition(input) {
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
    async readPr21RepositoryStageStatePostcondition(input) {
      events.push("read");
      if(options.throwRead) throw new Error("unknown");
      return {
        schemaVersion:1,
        status:options.postconditionStatus??"APPLIED",
        transactionFingerprint:
          options.transactionFingerprint===undefined
            ? input.transactionFingerprint
            : options.transactionFingerprint,
        currentStage:options.currentStage??"PR22",
        currentGate:options.currentGate??"PR22_MULTI_CHARACTER_COORDINATION",
        pr21StageStatus:options.pr21StageStatus??"COMPLETE",
        pr22StageStatus:options.pr22StageStatus??"IN_PROGRESS",
        pr22ProductiveAuthorityIssued:false,
        observedAtMs:4502,
      };
    },
  };
}

function currentState(patch={}) {
  return {
    schemaVersion:1,
    currentStage:"PR21",
    currentGate:"PR21_MERCHANT_INTEGRATION",
    pr21StageStatus:"IN_PROGRESS",
    pr22StageStatus:"BLOCKED_BY_PR21",
    ...patch,
  };
}

test("one-shot repository state execution persists intent before typed mutation",async()=>{
  const {authorization,transaction}=prepared();
  const events=[];
  const result=await fuehrePr21MerchantRepositoryStageStateEinmalAus({
    schemaVersion:1,
    authorization,
    transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:transaction.transactionFingerprint,
    currentRepositoryTransitionFingerprint:
      transaction.repositoryTransitionFingerprint,
    currentCompletionFingerprint:transaction.completionFingerprint,
    currentRepositoryState:currentState(),
    executionAtMs:4500,
    restartSinceAuthorization:false,
    durableIntentWriter:writer("PERSISTED_NEW",events),
    repositoryAdapter:adapter({},events),
  });
  assert.deepEqual(events,["intent","apply","read"]);
  assert.equal(
    result.status,
    "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.repositoryStageStateApplied,true);
  assert.equal(result.roadmapMutationPerformed,true);
  assert.equal(result.stageArrayMutationPerformed,true);
  assert.equal(result.currentStageMutationPerformed,true);
  assert.equal(result.currentGateMutationPerformed,true);
  assert.equal(result.pr21StageStatus,"COMPLETE");
  assert.equal(result.pr22StageStatus,"IN_PROGRESS");
  assert.equal(result.currentStage,"PR22");
  assert.equal(result.currentGate,"PR22_MULTI_CHARACTER_COORDINATION");
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.controlPlaneMutationPerformed,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.match(
    result.executionRecord.repositoryExecutionFingerprint,
    /^[0-9a-f]{16}$/,
  );
});

test("stale main, fingerprint drift, state drift and restart block before intent",async()=>{
  for(const patch of [
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentTransactionFingerprint:"aaaaaaaaaaaaaaaa"},
    {currentRepositoryTransitionFingerprint:"bbbbbbbbbbbbbbbb"},
    {currentCompletionFingerprint:"cccccccccccccccc"},
    {currentRepositoryState:currentState({currentStage:"PR22"})},
    {restartSinceAuthorization:true},
  ]){
    const {authorization,transaction}=prepared();
    const events=[];
    const result=await fuehrePr21MerchantRepositoryStageStateEinmalAus({
      schemaVersion:1,
      authorization,
      transaction,
      currentMainCommit:MAIN,
      currentTransactionFingerprint:transaction.transactionFingerprint,
      currentRepositoryTransitionFingerprint:
        transaction.repositoryTransitionFingerprint,
      currentCompletionFingerprint:transaction.completionFingerprint,
      currentRepositoryState:currentState(),
      executionAtMs:4500,
      restartSinceAuthorization:false,
      durableIntentWriter:writer("PERSISTED_NEW",events),
      repositoryAdapter:adapter({},events),
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT_PRECHECK");
    assert.equal(result.authorizationConsumed,false);
    assert.equal(result.repositoryStageStateApplied,false);
    assert.deepEqual(events,[]);
  }
});

test("existing durable intent never resumes repository mutation",async()=>{
  const {authorization,transaction}=prepared();
  const events=[];
  const result=await fuehrePr21MerchantRepositoryStageStateEinmalAus({
    schemaVersion:1,
    authorization,
    transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:transaction.transactionFingerprint,
    currentRepositoryTransitionFingerprint:
      transaction.repositoryTransitionFingerprint,
    currentCompletionFingerprint:transaction.completionFingerprint,
    currentRepositoryState:currentState(),
    executionAtMs:4500,
    restartSinceAuthorization:false,
    durableIntentWriter:writer(
      "ALREADY_PERSISTED_RECONCILIATION_REQUIRED",
      events,
    ),
    repositoryAdapter:adapter({},events),
  });
  assert.deepEqual(events,["intent"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.repositoryStageStateApplied,false);
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.blindResumeAfterRestartAllowed,false);
});

test("unknown repository mutation outcome requires reconciliation",async()=>{
  const {authorization,transaction}=prepared();
  const events=[];
  const result=await fuehrePr21MerchantRepositoryStageStateEinmalAus({
    schemaVersion:1,
    authorization,
    transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:transaction.transactionFingerprint,
    currentRepositoryTransitionFingerprint:
      transaction.repositoryTransitionFingerprint,
    currentCompletionFingerprint:transaction.completionFingerprint,
    currentRepositoryState:currentState(),
    executionAtMs:4500,
    restartSinceAuthorization:false,
    durableIntentWriter:writer("PERSISTED_NEW",events),
    repositoryAdapter:adapter({
      throwApply:true,
      postconditionStatus:"UNKNOWN",
      transactionFingerprint:null,
      currentStage:"PR21",
      currentGate:"PR21_MERCHANT_INTEGRATION",
      pr21StageStatus:"IN_PROGRESS",
      pr22StageStatus:"BLOCKED_BY_PR21",
    },events),
  });
  assert.deepEqual(events,["intent","apply","read"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.repositoryStageStateApplied,false);
  assert.equal(result.sameIntentRetryAllowed,false);
});

test("repository one-shot execution contract keeps productive authority closed",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-repository-stage-state-one-shot-execution-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_ONE_SHOT_REPOSITORY_STAGE_STATE_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredAuthorizationStatus,
    "AUTHORIZED_REPOSITORY_STAGE_STATE_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(contract.execution.typedRepositoryAdapterOnly,true);
  assert.equal(
    contract.execution.repositoryAdapterMethod,
    "applyPr21RepositoryStageStateTransition",
  );
  assert.equal(contract.execution.durableIntentRequiredBeforeMutation,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.execution.terminalMutationRecordRequired,true);
  assert.equal(contract.success.pr21StageStatus,"COMPLETE");
  assert.equal(contract.success.pr22StageStatus,"IN_PROGRESS");
  assert.equal(contract.success.currentStage,"PR22");
  assert.equal(
    contract.success.currentGate,
    "PR22_MULTI_CHARACTER_COORDINATION",
  );
  assert.equal(contract.success.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.controlPlaneMutationPerformed,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("repository execution source exposes only typed repository mutation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-repository-stage-state-one-shot-execution-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","writeFile(","writeFileSync(","git ",
    "execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(
    source.includes("applyPr21RepositoryStageStateTransition("),
    true,
  );
  assert.equal(
    source.includes("readPr21RepositoryStageStatePostcondition("),
    true,
  );
});
