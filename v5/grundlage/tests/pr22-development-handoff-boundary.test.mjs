import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22DevelopmentHandoffVor,
} from "../../erzeugt/index.js";

const SOURCE_MAIN="7e6b21cb022b1d4eaa26d90cd76530736946a671";
const FINAL_MAIN="92c1f134cdd6c9a1537e53726ad15fcde307677e";

function finalizationRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
    completedStage:"PR21",
    nextDevelopmentStage:"PR22",
    sourceMainCommit:SOURCE_MAIN,
    finalizedOnMainCommit:FINAL_MAIN,
    authorizationId:"auth-pr22-handoff",
    transactionId:"tx-pr22-handoff",
    transactionFingerprint:"0011223344556677",
    repositoryTransitionFingerprint:"1122334455667788",
    completionFingerprint:"2233445566778899",
    repositoryExecutionFingerprint:"33445566778899aa",
    finalizedAtMs:5100,
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr22ProductiveAuthorityIssued:false,
    repositoryStageStateApplied:true,
    executionFingerprintRevalidated:true,
    repositoryPostconditionRevalidated:true,
    pr22DevelopmentHandoffPrepared:true,
    pr22ProductiveHandoffPrepared:false,
    additionalRepositoryMutationPerformed:false,
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
    finalizationFingerprint:evidenceFingerprint(basis),
  };
}

function finalization(record=finalizationRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
    blocker:[],
    record,
    executionFingerprintRevalidated:true,
    repositoryPostconditionRevalidated:true,
    pr22DevelopmentHandoffPrepared:true,
    pr22ProductiveHandoffPrepared:false,
    additionalRepositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
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
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    pr22ProductiveAuthorityIssued:false,
    ...patch,
  };
}

test("verified PR21 finalization prepares PR22 shadow development handoff only",()=>{
  const result=bereitePr22DevelopmentHandoffVor({
    schemaVersion:1,
    finalization:finalization(),
    currentMainCommit:FINAL_MAIN,
    currentRepositoryState:state(),
    preparedAtMs:5200,
  });
  assert.equal(
    result.status,
    "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.finalizationFingerprintRevalidated,true);
  assert.equal(result.repositoryStateRevalidated,true);
  assert.equal(result.shadowDevelopmentAllowed,true);
  assert.equal(result.productiveEvidenceRequired,true);
  assert.equal(result.separateProductiveRatificationRequired,true);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(
    result.record.pr22ShadowAdmissionRequiredStatus,
    "BEREIT_NO_WRITE",
  );
  assert.equal(
    result.record.pr22ShadowWorkflowRequiredStatus,
    "PREPARED_NO_WRITE",
  );
  assert.equal(result.record.pr21CompletionFinalized,true);
  assert.equal(result.record.pr22DevelopmentStageActive,true);
  assert.equal(result.record.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.record.sendCmAuthority,false);
  assert.match(result.record.handoffFingerprint,/^[0-9a-f]{16}$/);
});

test("stale main blocks PR22 development handoff",()=>{
  const result=bereitePr22DevelopmentHandoffVor({
    schemaVersion:1,
    finalization:finalization(),
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    currentRepositoryState:state(),
    preparedAtMs:5200,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes("PR22_DEV_HANDOFF_MAIN_STALE"));
});

test("tampered PR21 finalization fingerprint blocks PR22 handoff",()=>{
  const valid=finalizationRecord();
  const tampered={...valid,completionFingerprint:"abcdefabcdefabcd"};
  const result=bereitePr22DevelopmentHandoffVor({
    schemaVersion:1,
    finalization:finalization(tampered),
    currentMainCommit:FINAL_MAIN,
    currentRepositoryState:state(),
    preparedAtMs:5200,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.equal(result.finalizationFingerprintRevalidated,false);
  assert.ok(result.blocker.includes("PR22_DEV_HANDOFF_FINALIZATION_FP_DRIFT"));
});

test("repository state drift blocks PR22 development handoff",()=>{
  for(const patch of [
    {currentStage:"PR21"},
    {currentGate:"PR21_MERCHANT_INTEGRATION"},
    {pr21StageStatus:"IN_PROGRESS"},
    {pr22StageStatus:"BLOCKED_BY_PR21"},
    {pr22ProductiveAuthorityIssued:true},
  ]){
    const result=bereitePr22DevelopmentHandoffVor({
      schemaVersion:1,
      finalization:finalization(),
      currentMainCommit:FINAL_MAIN,
      currentRepositoryState:state(patch),
      preparedAtMs:5200,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.repositoryStateRevalidated,false);
  }
});

test("PR22 development handoff contract stays shadow-only",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-development-handoff-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
  );
  assert.equal(contract.sourceMain,FINAL_MAIN);
  assert.equal(
    contract.requiredFinalizationStatus,
    "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
  );
  assert.equal(
    contract.success.status,
    "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY",
  );
  assert.equal(contract.success.shadowDevelopmentAllowed,true);
  assert.equal(contract.success.productiveEvidenceRequired,true);
  assert.equal(contract.success.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
  assert.equal(contract.safety.repositoryMutationPerformed,false);
  assert.equal(contract.safety.controlPlaneMutationPerformed,false);
});

test("PR22 handoff source contains no send or gameplay mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-development-handoff-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
