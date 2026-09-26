import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationDevelopmentPreflightVor,
} from "../../erzeugt/index.js";

const MAIN="6a49364670dece415736256ec89a309719ae588b";
const SOURCE_MAIN="1111111111111111111111111111111111111111";
const FINAL_MAIN="2222222222222222222222222222222222222222";

function handoffRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY",
    predecessorStage:"PR21",
    stage:"PR22",
    finalizationFingerprint:"0011223344556677",
    predecessorSourceMainCommit:SOURCE_MAIN,
    finalizedOnMainCommit:FINAL_MAIN,
    preparedOnMainCommit:MAIN,
    preparedAtMs:6000,
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr21CompletionFinalized:true,
    pr22DevelopmentStageActive:true,
    pr22ShadowAdmissionRequiredStatus:"BEREIT_NO_WRITE",
    pr22ShadowWorkflowRequiredStatus:"PREPARED_NO_WRITE",
    shadowDevelopmentAllowed:true,
    productiveEvidenceRequired:true,
    cap022FullChainRecheckRequiredBeforeProductiveEvidence:true,
    separateProductiveRatificationRequired:true,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    ...patch,
  };
  return {...basis,handoffFingerprint:evidenceFingerprint(basis)};
}

function handoff(record=handoffRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY",
    blocker:[],
    record,
    finalizationFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    shadowDevelopmentAllowed:true,
    productiveEvidenceRequired:true,
    separateProductiveRatificationRequired:true,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
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

function admission(patch={}) {
  return {
    schemaVersion:1,
    messageId:"msg-pr22-dev-1",
    dedupeKey:"dedupe-pr22-dev-1",
    workflowId:"wf-pr22-dev-1",
    workflowRevision:1,
    senderCharacterId:"merchant",
    recipientCharacterId:"farmer-1",
    recipientSessionId:"session-farmer-1",
    serverRegion:"EU",
    serverIdentifier:"I",
    rosterEpoch:10,
    livenessEpoch:11,
    createdAtMs:6100,
    expiresAtMs:7600,
    nowMs:6200,
    senderTrusted:true,
    recipientRosterFresh:true,
    recipientLivenessFresh:true,
    sameServer:true,
    duplicateObserved:false,
    outOfOrderObserved:false,
    restartReconciled:true,
    priorTerminalSettlement:false,
    ...patch,
  };
}

function workflow(patch={}) {
  return {
    schemaVersion:1,
    messageId:"msg-pr22-dev-1",
    workflowId:"wf-pr22-dev-1",
    workflowRevision:1,
    ackObserved:false,
    settlementObserved:false,
    ackCorrelated:false,
    settlementCorrelated:false,
    ttlFresh:true,
    recipientFresh:true,
    restartObserved:false,
    restartReconciled:true,
    ...patch,
  };
}

test("verified handoff yields correlated no-write PR22 coordination preflight",()=>{
  const result=bereitePr22CoordinationDevelopmentPreflightVor({
    schemaVersion:1,
    handoff:handoff(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    admissionRequest:admission(),
    workflowRequest:workflow(),
    preparedAtMs:6300,
  });
  assert.equal(
    result.status,
    "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.handoffFingerprintRevalidated,true);
  assert.equal(result.repositoryStateRevalidated,true);
  assert.equal(result.shadowAdmissionReady,true);
  assert.equal(result.shadowWorkflowReady,true);
  assert.equal(result.shadowDevelopmentAllowed,true);
  assert.equal(result.externalRuntimeStartAuthorized,false);
  assert.equal(result.shadowTransportSendPerformed,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.record.shadowAdmissionStatus,"BEREIT_NO_WRITE");
  assert.equal(result.record.shadowWorkflowInitialStatus,"ACK_AUSSTEHEND");
  assert.equal(result.record.shadowScenarioCorrelated,true);
  assert.equal(result.record.messageId,"msg-pr22-dev-1");
  assert.match(result.record.preflightFingerprint,/^[0-9a-f]{16}$/);
});

test("stale main or repository drift blocks preflight",()=>{
  for(const patch of [
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentRepositoryState:state({currentStage:"PR21"})},
    {currentRepositoryState:state({pr22ProductiveAuthorityIssued:true})},
  ]){
    const result=bereitePr22CoordinationDevelopmentPreflightVor({
      schemaVersion:1,
      handoff:handoff(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      admissionRequest:admission(),
      workflowRequest:workflow(),
      preparedAtMs:6300,
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.shadowTransportSendPerformed,false);
    assert.equal(result.sendCmAuthority,false);
  }
});

test("blocked shadow admission blocks PR22 development preflight",()=>{
  const result=bereitePr22CoordinationDevelopmentPreflightVor({
    schemaVersion:1,
    handoff:handoff(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    admissionRequest:admission({recipientLivenessFresh:false}),
    workflowRequest:workflow(),
    preparedAtMs:6300,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.equal(result.shadowAdmissionReady,false);
  assert.ok(result.blocker.includes(
    "PR22_DEV_PREFLIGHT_SHADOW_ADMISSION_BLOCKIERT",
  ));
});

test("preflight requires initial ACK-pending shadow workflow",()=>{
  const result=bereitePr22CoordinationDevelopmentPreflightVor({
    schemaVersion:1,
    handoff:handoff(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    admissionRequest:admission(),
    workflowRequest:workflow({
      ackObserved:true,
      ackCorrelated:true,
    }),
    preparedAtMs:6300,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.equal(result.shadowWorkflowReady,false);
  assert.ok(result.blocker.includes(
    "PR22_DEV_PREFLIGHT_SHADOW_WORKFLOW_NICHT_INITIAL_BEREIT",
  ));
});

test("scenario identity drift is rejected",()=>{
  const result=bereitePr22CoordinationDevelopmentPreflightVor({
    schemaVersion:1,
    handoff:handoff(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    admissionRequest:admission(),
    workflowRequest:workflow({messageId:"msg-pr22-dev-other"}),
    preparedAtMs:6300,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes(
    "PR22_DEV_PREFLIGHT_SCENARIO_BINDING_DRIFT",
  ));
});

test("PR22 development preflight contract stays no-write and non-productive",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-development-preflight-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_COORDINATION_DEVELOPMENT_PREFLIGHT_NO_WRITE",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredHandoffStatus,
    "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY",
  );
  assert.equal(contract.preflight.shadowAdmissionRequiredStatus,"BEREIT_NO_WRITE");
  assert.equal(contract.preflight.shadowWorkflowInitialStatus,"ACK_AUSSTEHEND");
  assert.equal(contract.preflight.externalRuntimeStartAuthorized,false);
  assert.equal(contract.preflight.shadowTransportSendPerformed,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("preflight source contains no transport or gameplay write backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-development-preflight-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
