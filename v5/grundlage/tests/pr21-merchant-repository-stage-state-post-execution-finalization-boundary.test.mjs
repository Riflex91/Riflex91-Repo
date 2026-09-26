import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  finalisierePr21MerchantRepositoryStageStatePostExecution,
} from "../../erzeugt/index.js";

const SOURCE_MAIN="7e6b21cb022b1d4eaa26d90cd76530736946a671";
const POST_MAIN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function executionRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY",
    authorizationId:"auth-pr21-finalization",
    transactionId:"tx-pr21-finalization",
    transactionFingerprint:"0011223344556677",
    repositoryTransitionFingerprint:"1122334455667788",
    completionFingerprint:"2233445566778899",
    sourceMainCommit:SOURCE_MAIN,
    durableIntentId:"intent-pr21-finalization",
    appliedAtMs:5000,
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr22ProductiveAuthorityIssued:false,
    repositoryStageStateApplied:true,
    roadmapMutationPerformed:true,
    stageArrayMutationPerformed:true,
    currentStageMutationPerformed:true,
    currentGateMutationPerformed:true,
    controlPlaneMutationPerformed:false,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
  return {
    ...basis,
    repositoryExecutionFingerprint:evidenceFingerprint(basis),
  };
}

function execution(record=executionRecord()) {
  return {
    schemaVersion:1,
    status:"APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY",
    blocker:[],
    authorizationId:record.authorizationId,
    transactionId:record.transactionId,
    transactionFingerprint:record.transactionFingerprint,
    authorizationConsumed:true,
    durableIntentPersisted:true,
    mutationAttemptObserved:true,
    repositoryStageStateApplied:true,
    roadmapMutationPerformed:true,
    stageArrayMutationPerformed:true,
    currentStageMutationPerformed:true,
    currentGateMutationPerformed:true,
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr22ProductiveAuthorityIssued:false,
    controlPlaneMutationPerformed:false,
    executionRecord:record,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
  };
}

function postState(patch={}) {
  return {
    schemaVersion:1,
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    pr22ProductiveAuthorityIssued:false,
    ...patch,
  };
}

test("verified repository execution yields PR22 development handoff record only",()=>{
  const result=finalisierePr21MerchantRepositoryStageStatePostExecution({
    schemaVersion:1,
    execution:execution(),
    currentMainCommit:POST_MAIN,
    currentRepositoryState:postState(),
    finalizedAtMs:5100,
  });
  assert.equal(
    result.status,
    "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.executionFingerprintRevalidated,true);
  assert.equal(result.repositoryPostconditionRevalidated,true);
  assert.equal(result.pr22DevelopmentHandoffPrepared,true);
  assert.equal(result.pr22ProductiveHandoffPrepared,false);
  assert.equal(result.additionalRepositoryMutationPerformed,false);
  assert.equal(result.record.completedStage,"PR21");
  assert.equal(result.record.nextDevelopmentStage,"PR22");
  assert.equal(result.record.sourceMainCommit,SOURCE_MAIN);
  assert.equal(result.record.finalizedOnMainCommit,POST_MAIN);
  assert.equal(result.record.pr21StageStatus,"COMPLETE");
  assert.equal(result.record.pr22StageStatus,"IN_PROGRESS");
  assert.equal(result.record.currentStage,"PR22");
  assert.equal(
    result.record.currentGate,
    "PR22_MULTI_CHARACTER_COORDINATION",
  );
  assert.equal(result.record.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.record.pr22ProductiveHandoffPrepared,false);
  assert.equal(result.record.additionalRepositoryMutationPerformed,false);
  assert.equal(result.record.gameplayAuthority,false);
  assert.equal(result.record.rawWriteAuthority,false);
  assert.equal(result.record.normalRuntimeAllowed,false);
  assert.match(result.record.finalizationFingerprint,/^[0-9a-f]{16}$/);
});

test("tampered repository execution record is rejected",()=>{
  const valid=executionRecord();
  const tampered={
    ...valid,
    completionFingerprint:"abcdefabcdefabcd",
  };
  const result=finalisierePr21MerchantRepositoryStageStatePostExecution({
    schemaVersion:1,
    execution:execution(tampered),
    currentMainCommit:POST_MAIN,
    currentRepositoryState:postState(),
    finalizedAtMs:5100,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.equal(result.executionFingerprintRevalidated,false);
  assert.ok(result.blocker.includes(
    "PR21_REPOSITORY_FINALIZATION_EXECUTION_FP_DRIFT",
  ));
});

test("repository postcondition drift blocks finalization",()=>{
  for(const patch of [
    {currentStage:"PR21"},
    {currentGate:"PR21_MERCHANT_INTEGRATION"},
    {pr21StageStatus:"IN_PROGRESS"},
    {pr22StageStatus:"BLOCKED_BY_PR21"},
    {pr22ProductiveAuthorityIssued:true},
  ]){
    const result=finalisierePr21MerchantRepositoryStageStatePostExecution({
      schemaVersion:1,
      execution:execution(),
      currentMainCommit:POST_MAIN,
      currentRepositoryState:postState(patch),
      finalizedAtMs:5100,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.repositoryPostconditionRevalidated,false);
    assert.ok(result.blocker.includes(
      "PR21_REPOSITORY_FINALIZATION_POSTCONDITION_DRIFT",
    ));
  }
});

test("non-success execution cannot finalize PR21 transition",()=>{
  const failed={
    ...execution(),
    status:"BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker:["unknown"],
    repositoryStageStateApplied:false,
    roadmapMutationPerformed:false,
    stageArrayMutationPerformed:false,
    currentStageMutationPerformed:false,
    currentGateMutationPerformed:false,
    pr21StageStatus:"IN_PROGRESS",
    pr22StageStatus:"BLOCKED_BY_PR21",
    currentStage:"PR21",
    currentGate:"PR21_MERCHANT_INTEGRATION",
    executionRecord:null,
  };
  const result=finalisierePr21MerchantRepositoryStageStatePostExecution({
    schemaVersion:1,
    execution:failed,
    currentMainCommit:POST_MAIN,
    currentRepositoryState:postState(),
    finalizedAtMs:5100,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes(
    "PR21_REPOSITORY_FINALIZATION_EXECUTION_NICHT_VERIFIZIERT",
  ));
});

test("post-execution finalization contract is record-only and non-productive",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_POST_EXECUTION_FINALIZATION_RECORD_ONLY",
  );
  assert.equal(contract.sourceMain,SOURCE_MAIN);
  assert.equal(
    contract.requiredExecutionStatus,
    "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY",
  );
  assert.equal(
    contract.success.status,
    "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
  );
  assert.equal(contract.success.pr21StageStatus,"COMPLETE");
  assert.equal(contract.success.pr22StageStatus,"IN_PROGRESS");
  assert.equal(contract.success.currentStage,"PR22");
  assert.equal(
    contract.success.currentGate,
    "PR22_MULTI_CHARACTER_COORDINATION",
  );
  assert.equal(contract.success.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.additionalRepositoryMutationPerformed,false);
  assert.equal(contract.safety.controlPlaneMutationPerformed,false);
  assert.equal(contract.safety.pr22ProductiveHandoffPrepared,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("finalization source contains no repository or gameplay mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","writeFile(","writeFileSync(","git ",
    "applyPr21RepositoryStageStateTransition(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
