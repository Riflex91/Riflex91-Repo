import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveEvidenceAdmissionVor,
} from "../../erzeugt/index.js";

const MAIN="1b566a3e435420fcdad057747fd0212a780e55b5";
const REQUIRED_FOUNDATIONS=[
  "MATERIAL_ACQUISITION",
  "MATERIAL_HANDOFF",
  "POST_SETTLEMENT_CRAFT_RESCAN",
  "PERSISTENT_LIFECYCLE",
  "TEAM_MATERIAL_OBJECTIVE",
  "TEAM_COLLECTION_HANDOFF",
  "TEAM_BATCH_SETTLEMENT_RECOVERY",
  "TEAM_ALL_SETTLED_CRAFT_RESCAN",
  "TEAM_RESCAN_DURABLE_ADMISSION",
];

function evidenceRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY",
    stage:"PR22",
    preflightFingerprint:"0011223344556677",
    preflightMainCommit:MAIN,
    evidenceMainCommit:MAIN,
    messageId:"msg-pr22-productive-1",
    workflowId:"wf-pr22-productive-1",
    workflowRevision:2,
    ackObservedAtMs:7100,
    settlementObservedAtMs:7200,
    observedAtMs:7300,
    workflowTerminalStatus:"ABGESCHLOSSEN",
    ackCorrelated:true,
    settlementCorrelated:true,
    shadowEvidenceComplete:true,
    shadowOnly:true,
    productiveEvidenceSatisfied:false,
    productiveRatificationAllowedFromShadow:false,
    cap022FullChainRecheckRequiredBeforeProductiveEvidence:true,
    separateProductiveEvidenceAdmissionRequired:true,
    separateProductiveRatificationRequired:true,
    externalRuntimeStartAuthorized:false,
    sendCmCallsObserved:0,
    gameplayCallsObserved:0,
    rawWriteCallsObserved:0,
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
  return {...basis,evidenceFingerprint:evidenceFingerprint(basis)};
}

function shadowEvidence(record=evidenceRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY",
    blocker:[],
    record,
    preflightFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    workflowEvidenceVerified:true,
    shadowEvidenceComplete:true,
    productiveEvidenceSatisfied:false,
    productiveRatificationAllowedFromShadow:false,
    externalRuntimeStartAuthorized:false,
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

function cap022(patch={}) {
  return {
    schemaVersion:1,
    status:"CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
    blocker:[],
    requiredFoundationIds:[...REQUIRED_FOUNDATIONS],
    readyFoundationIds:[...REQUIRED_FOUNDATIONS],
    allRequiredFoundationsPresent:true,
    allRequiredFoundationsReady:true,
    currentPr20_9RatificationCredit:false,
    candidateAcquisitionOrMutationAllowedNow:false,
    durableIntentCreated:false,
    productiveCraftAuthorityOpened:false,
    productiveExecutionAllowed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
}

test("verified shadow evidence and CAP-022 prepare productive evidence admission only",()=>{
  const result=bereitePr22CoordinationProductiveEvidenceAdmissionVor({
    schemaVersion:1,
    shadowEvidence:shadowEvidence(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
    preparedAtMs:7400,
  });

  assert.equal(
    result.status,
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.shadowEvidenceFingerprintRevalidated,true);
  assert.equal(result.repositoryStateRevalidated,true);
  assert.equal(result.cap022FullChainRevalidated,true);
  assert.equal(result.productiveEvidenceStillRequired,true);
  assert.equal(result.externalRuntimeStartAuthorized,false);
  assert.equal(result.productiveEvidenceSatisfied,false);
  assert.equal(result.productiveRatificationAllowed,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.record.shadowEvidenceComplete,true);
  assert.equal(
    result.record.cap022FullChainStatus,
    "CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
  );
  assert.equal(result.record.realCmTransportRequired,true);
  assert.equal(result.record.ackEvidenceRequired,true);
  assert.equal(result.record.settlementEvidenceRequired,true);
  assert.equal(result.record.ttlAndDedupeEvidenceRequired,true);
  assert.equal(result.record.rosterSessionEpochEvidenceRequired,true);
  assert.equal(result.record.separateExecutionAuthorizationRequired,true);
  assert.equal(result.record.exactExecutionAuthorizationRequired,true);
  assert.equal(result.record.durableIntentRequiredBeforeSend,true);
  assert.equal(result.record.oneShotSendRequired,true);
  assert.equal(result.record.sameIntentRetryAllowed,false);
  assert.equal(result.record.unknownOutcomeRequiresReconciliation,true);
  assert.match(result.record.admissionFingerprint,/^[0-9a-f]{16}$/);
});

test("shadow evidence drift or productive shadow claim blocks admission",()=>{
  const valid=evidenceRecord();
  for(const record of [
    {...valid,settlementCorrelated:false},
    {...valid,productiveEvidenceSatisfied:true},
    {...valid,sendCmCallsObserved:1},
  ]){
    const result=bereitePr22CoordinationProductiveEvidenceAdmissionVor({
      schemaVersion:1,
      shadowEvidence:shadowEvidence(record),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
      preparedAtMs:7400,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.shadowEvidenceFingerprintRevalidated,false);
  }
});

test("stale main or repository state blocks productive admission",()=>{
  for(const patch of [
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentRepositoryState:state({currentStage:"PR21"})},
    {currentRepositoryState:state({pr22ProductiveAuthorityIssued:true})},
  ]){
    const result=bereitePr22CoordinationProductiveEvidenceAdmissionVor({
      schemaVersion:1,
      shadowEvidence:shadowEvidence(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
      preparedAtMs:7400,
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
  }
});

test("missing or authority-drifted CAP-022 full chain blocks admission",()=>{
  for(const chain of [
    cap022({
      status:"BLOCKIERT",
      blocker:["CAP022_CHAIN_FOUNDATION_FEHLT:TEAM_RESCAN_DURABLE_ADMISSION"],
      readyFoundationIds:REQUIRED_FOUNDATIONS.slice(0,-1),
      allRequiredFoundationsPresent:false,
      allRequiredFoundationsReady:false,
    }),
    cap022({productiveExecutionAllowed:true}),
  ]){
    const result=bereitePr22CoordinationProductiveEvidenceAdmissionVor({
      schemaVersion:1,
      shadowEvidence:shadowEvidence(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      cap022FullChain:chain,
      preparedAtMs:7400,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.cap022FullChainRevalidated,false);
    assert.ok(result.blocker.includes(
      "PR22_PRODUCTIVE_ADMISSION_CAP022_FULL_CHAIN_NICHT_BEREIT",
    ));
  }
});

test("productive evidence admission contract remains no-start and no-send",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-evidence-admission-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredShadowEvidenceStatus,
    "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY",
  );
  assert.equal(
    contract.requiredCap022Status,
    "CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
  );
  assert.equal(
    contract.success.status,
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
  );
  assert.equal(contract.success.productiveEvidenceStillRequired,true);
  assert.equal(contract.execution.separateExecutionAuthorizationRequired,true);
  assert.equal(contract.execution.durableIntentRequiredBeforeSend,true);
  assert.equal(contract.execution.oneShotSendRequired,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.safety.externalRuntimeStartAuthorized,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("productive evidence admission source contains no live send backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-evidence-admission-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
