import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  finalisierePr22CoordinationShadowEvidence,
} from "../../erzeugt/index.js";

const MAIN="9d632559d08e73479bd2c29408f9f46f729908de";

function preflightRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY",
    stage:"PR22",
    handoffFingerprint:"0011223344556677",
    handoffPreparedOnMainCommit:MAIN,
    preflightMainCommit:MAIN,
    preparedAtMs:7000,
    messageId:"msg-pr22-shadow-1",
    workflowId:"wf-pr22-shadow-1",
    workflowRevision:1,
    recipientCharacterId:"farmer-1",
    recipientSessionId:"session-farmer-1",
    serverRegion:"EU",
    serverIdentifier:"I",
    rosterEpoch:20,
    livenessEpoch:21,
    shadowAdmissionStatus:"BEREIT_NO_WRITE",
    shadowWorkflowInitialStatus:"ACK_AUSSTEHEND",
    shadowScenarioCorrelated:true,
    restartReconciled:true,
    shadowDevelopmentAllowed:true,
    productiveEvidenceRequired:true,
    cap022FullChainRecheckRequiredBeforeProductiveEvidence:true,
    separateProductiveRatificationRequired:true,
    externalRuntimeStartAuthorized:false,
    shadowTransportSendPerformed:false,
    sendCmAuthority:false,
    pr22ProductiveAuthorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    ...patch,
  };
  return {...basis,preflightFingerprint:evidenceFingerprint(basis)};
}

function preflight(record=preflightRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY",
    blocker:[],
    record,
    handoffFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    shadowAdmissionReady:true,
    shadowWorkflowReady:true,
    shadowDevelopmentAllowed:true,
    productiveEvidenceRequired:true,
    externalRuntimeStartAuthorized:false,
    shadowTransportSendPerformed:false,
    sendCmAuthority:false,
    pr22ProductiveAuthorityIssued:false,
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

function workflow(patch={}) {
  return {
    schemaVersion:1,
    messageId:"msg-pr22-shadow-1",
    workflowId:"wf-pr22-shadow-1",
    workflowRevision:1,
    ackObserved:true,
    settlementObserved:true,
    ackCorrelated:true,
    settlementCorrelated:true,
    ttlFresh:true,
    recipientFresh:true,
    restartObserved:false,
    restartReconciled:true,
    ...patch,
  };
}

test("terminal correlated shadow workflow yields no-write evidence record",()=>{
  const result=finalisierePr22CoordinationShadowEvidence({
    schemaVersion:1,
    preflight:preflight(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    workflowRequest:workflow(),
    ackObservedAtMs:7100,
    settlementObservedAtMs:7200,
    observedAtMs:7300,
    sendCmCallsObserved:0,
    gameplayCallsObserved:0,
    rawWriteCallsObserved:0,
  });
  assert.equal(
    result.status,
    "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.preflightFingerprintRevalidated,true);
  assert.equal(result.repositoryStateRevalidated,true);
  assert.equal(result.workflowEvidenceVerified,true);
  assert.equal(result.shadowEvidenceComplete,true);
  assert.equal(result.productiveEvidenceSatisfied,false);
  assert.equal(result.productiveRatificationAllowedFromShadow,false);
  assert.equal(result.externalRuntimeStartAuthorized,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.record.workflowTerminalStatus,"ABGESCHLOSSEN");
  assert.equal(result.record.ackCorrelated,true);
  assert.equal(result.record.settlementCorrelated,true);
  assert.equal(result.record.sendCmCallsObserved,0);
  assert.equal(result.record.gameplayCallsObserved,0);
  assert.equal(result.record.rawWriteCallsObserved,0);
  assert.match(result.record.evidenceFingerprint,/^[0-9a-f]{16}$/);
});

test("nonterminal or uncorrelated workflow cannot become shadow evidence",()=>{
  for(const patch of [
    {settlementObserved:false,settlementCorrelated:false},
    {ackCorrelated:false},
    {settlementCorrelated:false},
    {recipientFresh:false},
  ]){
    const result=finalisierePr22CoordinationShadowEvidence({
      schemaVersion:1,
      preflight:preflight(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      workflowRequest:workflow(patch),
      ackObservedAtMs:7100,
      settlementObservedAtMs:7200,
      observedAtMs:7300,
      sendCmCallsObserved:0,
      gameplayCallsObserved:0,
      rawWriteCallsObserved:0,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.workflowEvidenceVerified,false);
  }
});

test("preflight/main/state drift blocks shadow evidence",()=>{
  const cases=[
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentRepositoryState:state({currentStage:"PR21"})},
    {currentRepositoryState:state({pr22ProductiveAuthorityIssued:true})},
  ];
  for(const patch of cases){
    const result=finalisierePr22CoordinationShadowEvidence({
      schemaVersion:1,
      preflight:preflight(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      workflowRequest:workflow(),
      ackObservedAtMs:7100,
      settlementObservedAtMs:7200,
      observedAtMs:7300,
      sendCmCallsObserved:0,
      gameplayCallsObserved:0,
      rawWriteCallsObserved:0,
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
  }
});

test("time order and any observed write fail closed",()=>{
  const badTimes=finalisierePr22CoordinationShadowEvidence({
    schemaVersion:1,
    preflight:preflight(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    workflowRequest:workflow(),
    ackObservedAtMs:7200,
    settlementObservedAtMs:7100,
    observedAtMs:7300,
    sendCmCallsObserved:0,
    gameplayCallsObserved:0,
    rawWriteCallsObserved:0,
  });
  assert.equal(badTimes.status,"BLOCKIERT");
  assert.ok(badTimes.blocker.includes(
    "PR22_SHADOW_EVIDENCE_ZEITREIHENFOLGE_UNGUELTIG",
  ));

  const writeObserved=finalisierePr22CoordinationShadowEvidence({
    schemaVersion:1,
    preflight:preflight(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    workflowRequest:workflow(),
    ackObservedAtMs:7100,
    settlementObservedAtMs:7200,
    observedAtMs:7300,
    sendCmCallsObserved:1,
    gameplayCallsObserved:0,
    rawWriteCallsObserved:0,
  });
  assert.equal(writeObserved.status,"BLOCKIERT");
  assert.ok(writeObserved.blocker.includes(
    "PR22_SHADOW_EVIDENCE_WRITE_BEOBACHTET",
  ));
});

test("shadow evidence contract never counts as productive evidence",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-shadow-evidence-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_COORDINATION_SHADOW_EVIDENCE_NO_WRITE",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredPreflightStatus,
    "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY",
  );
  assert.equal(
    contract.success.status,
    "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY",
  );
  assert.equal(contract.success.workflowTerminalStatus,"ABGESCHLOSSEN");
  assert.equal(contract.success.shadowEvidenceComplete,true);
  assert.equal(contract.success.productiveEvidenceSatisfied,false);
  assert.equal(contract.success.productiveRatificationAllowedFromShadow,false);
  assert.equal(contract.safety.sendCmCallsObserved,0);
  assert.equal(contract.safety.gameplayCallsObserved,0);
  assert.equal(contract.safety.rawWriteCallsObserved,0);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
});

test("shadow evidence source contains no transport or gameplay writer",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-shadow-evidence-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
