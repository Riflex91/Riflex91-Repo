import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveTransportFenceVor,
  bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor,
  erteilePr22CoordinationProductiveEvidenceExecutionAuthorization,
  fuehrePr22CoordinationProductiveEvidenceEinmalAus,
} from "../../erzeugt/index.js";

const MAIN="10bb731d70201d7b1dc9ee9bb1f1d765b844d4cf";
const PAYLOAD={kind:"SUPPLY_REQUEST",item:"hpot1",quantity:100};
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

function admissionRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
    stage:"PR22",
    shadowEvidenceFingerprint:"0011223344556677",
    shadowEvidenceMainCommit:MAIN,
    admissionMainCommit:MAIN,
    preparedAtMs:9000,
    messageId:"msg-pr22-live-one-shot",
    workflowId:"wf-pr22-live-one-shot",
    workflowRevision:4,
    shadowEvidenceComplete:true,
    cap022FullChainStatus:"CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
    cap022AllRequiredFoundationsPresent:true,
    cap022AllRequiredFoundationsReady:true,
    productiveEvidenceStillRequired:true,
    realCmTransportRequired:true,
    ackEvidenceRequired:true,
    settlementEvidenceRequired:true,
    ttlAndDedupeEvidenceRequired:true,
    rosterSessionEpochEvidenceRequired:true,
    separateExecutionAuthorizationRequired:true,
    exactExecutionAuthorizationRequired:true,
    durableIntentRequiredBeforeSend:true,
    oneShotSendRequired:true,
    sameIntentRetryAllowed:false,
    unknownOutcomeRequiresReconciliation:true,
    cap022FullChainRecheckRequiredAtExecution:true,
    repositoryStateRecheckRequiredAtExecution:true,
    shadowEvidenceFingerprintRecheckRequiredAtExecution:true,
    externalRuntimeStartAuthorized:false,
    productiveEvidenceSatisfied:false,
    productiveRatificationAllowed:false,
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
  return {...basis,admissionFingerprint:evidenceFingerprint(basis)};
}

function admissionBoundary(record=admissionRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
    blocker:[],
    record,
    shadowEvidenceFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    cap022FullChainRevalidated:true,
    productiveEvidenceStillRequired:true,
    externalRuntimeStartAuthorized:false,
    productiveEvidenceSatisfied:false,
    productiveRatificationAllowed:false,
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

function prepared() {
  const admission=admissionRecord();
  const draft=bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
    admissionBoundary(admission),
    "auth-pr22-live-one-shot",
    9100,
    10500,
  );
  const authorization=erteilePr22CoordinationProductiveEvidenceExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-pr22-live-one-shot",
    9150,
  );
  const transportFence=bereitePr22CoordinationProductiveTransportFenceVor({
    schemaVersion:1,
    messageId:admission.messageId,
    dedupeKey:"dedupe-pr22-live-one-shot",
    workflowId:admission.workflowId,
    workflowRevision:admission.workflowRevision,
    senderCharacterId:"My_Merchant",
    recipientCharacterId:"farmer-1",
    recipientSessionId:"session-farmer-1",
    serverRegion:"EU",
    serverIdentifier:"I",
    rosterEpoch:30,
    livenessEpoch:31,
    createdAtMs:9000,
    expiresAtMs:10000,
    nowMs:9200,
    senderTrusted:true,
    recipientRosterFresh:true,
    recipientLivenessFresh:true,
    sameServer:true,
    duplicateObserved:false,
    outOfOrderObserved:false,
    restartReconciled:true,
    priorTerminalSettlement:false,
  },PAYLOAD);
  return {admission,authorization,transportFence};
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

function writer(status="PERSISTED_NEW",events=[]) {
  return {
    async persistPr22CoordinationProductiveEvidenceIntent(input) {
      events.push("intent");
      return {
        schemaVersion:1,
        status,
        durableIntentId:"intent-pr22-live-one-shot",
        authorizationId:input.authorizationId,
        admissionFingerprint:input.admissionFingerprint,
        transportFenceFingerprint:input.transportFenceFingerprint,
        messageId:input.messageId,
        persistedAtMs:9201,
      };
    },
  };
}

function adapter(fence,options={},events=[]) {
  return {
    async sendPr22CoordinationProductiveEvidenceMessage() {
      events.push("send");
      if(options.throwSend) throw new Error("unknown");
      return {
        schemaVersion:1,
        outcome:options.outcome??"SENT",
        transportAttempted:true,
        terminalSendRecordPersisted:
          options.terminalSendRecordPersisted??true,
        sendCmCallsObserved:options.sendCmCallsObserved??1,
      };
    },
    async readPr22CoordinationProductiveEvidence() {
      events.push("read");
      if(options.throwRead) throw new Error("unknown");
      return {
        schemaVersion:1,
        status:options.status??"COMPLETE",
        messageId:options.messageId===undefined?fence.messageId:options.messageId,
        dedupeKey:options.dedupeKey===undefined?fence.dedupeKey:options.dedupeKey,
        workflowId:options.workflowId===undefined?fence.workflowId:options.workflowId,
        workflowRevision:
          options.workflowRevision===undefined
            ? fence.workflowRevision
            : options.workflowRevision,
        recipientCharacterId:
          options.recipientCharacterId===undefined
            ? fence.recipientCharacterId
            : options.recipientCharacterId,
        recipientSessionId:
          options.recipientSessionId===undefined
            ? fence.recipientSessionId
            : options.recipientSessionId,
        serverRegion:
          options.serverRegion===undefined?fence.serverRegion:options.serverRegion,
        serverIdentifier:
          options.serverIdentifier===undefined
            ? fence.serverIdentifier
            : options.serverIdentifier,
        rosterEpoch:
          options.rosterEpoch===undefined?fence.rosterEpoch:options.rosterEpoch,
        livenessEpoch:
          options.livenessEpoch===undefined
            ? fence.livenessEpoch
            : options.livenessEpoch,
        ackObserved:options.ackObserved??true,
        settlementObserved:options.settlementObserved??true,
        ackCorrelated:options.ackCorrelated??true,
        settlementCorrelated:options.settlementCorrelated??true,
        ttlEvidenceSatisfied:options.ttlEvidenceSatisfied??true,
        dedupeEvidenceSatisfied:options.dedupeEvidenceSatisfied??true,
        rosterSessionEpochEvidenceSatisfied:
          options.rosterSessionEpochEvidenceSatisfied??true,
        duplicateSendObserved:options.duplicateSendObserved??false,
        sendCmCallsObserved:options.observedSendCmCalls??1,
        observedAtMs:9300,
      };
    },
  };
}

test("one-shot productive evidence persists intent, sends once, then verifies evidence",async()=>{
  const {admission,authorization,transportFence}=prepared();
  const events=[];
  const result=await fuehrePr22CoordinationProductiveEvidenceEinmalAus({
    schemaVersion:1,
    authorization,
    admissionRecord:admission,
    transportFence,
    payload:PAYLOAD,
    currentMainCommit:MAIN,
    currentAdmissionFingerprint:admission.admissionFingerprint,
    currentShadowEvidenceFingerprint:admission.shadowEvidenceFingerprint,
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
    executionAtMs:9200,
    restartSinceAuthorization:false,
    durableIntentWriter:writer("PERSISTED_NEW",events),
    transportAdapter:adapter(transportFence,{},events),
  });

  assert.deepEqual(events,["intent","send","read"]);
  assert.equal(
    result.status,
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.durableIntentPersisted,true);
  assert.equal(result.transportAttemptObserved,true);
  assert.equal(result.transportExecutionPerformed,true);
  assert.equal(result.sendCmCallsObserved,1);
  assert.equal(result.productiveEvidenceSatisfied,true);
  assert.equal(result.productiveRatificationAllowed,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.oneShotTransportAuthorityConsumed,true);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(
    result.record.status,
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
  );
  assert.equal(result.record.ackEvidenceSatisfied,true);
  assert.equal(result.record.settlementEvidenceSatisfied,true);
  assert.equal(result.record.ttlAndDedupeEvidenceSatisfied,true);
  assert.equal(result.record.rosterSessionEpochEvidenceSatisfied,true);
  assert.match(result.record.productiveEvidenceFingerprint,/^[0-9a-f]{16}$/);
});

test("stale main, state, CAP-022, payload drift or restart block before intent",async()=>{
  for(const patch of [
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentRepositoryState:state({currentStage:"PR21"})},
    {cap022FullChain:cap022({status:"BLOCKIERT",blocker:["missing"]})},
    {payload:{...PAYLOAD,quantity:101}},
    {restartSinceAuthorization:true},
  ]){
    const {admission,authorization,transportFence}=prepared();
    const events=[];
    const result=await fuehrePr22CoordinationProductiveEvidenceEinmalAus({
      schemaVersion:1,
      authorization,
      admissionRecord:admission,
      transportFence,
      payload:PAYLOAD,
      currentMainCommit:MAIN,
      currentAdmissionFingerprint:admission.admissionFingerprint,
      currentShadowEvidenceFingerprint:admission.shadowEvidenceFingerprint,
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
      executionAtMs:9200,
      restartSinceAuthorization:false,
      durableIntentWriter:writer("PERSISTED_NEW",events),
      transportAdapter:adapter(transportFence,{},events),
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT_PRECHECK");
    assert.equal(result.authorizationConsumed,false);
    assert.equal(result.transportExecutionPerformed,false);
    assert.deepEqual(events,[]);
  }
});

test("existing durable intent never resumes or retries transport",async()=>{
  const {admission,authorization,transportFence}=prepared();
  const events=[];
  const result=await fuehrePr22CoordinationProductiveEvidenceEinmalAus({
    schemaVersion:1,
    authorization,
    admissionRecord:admission,
    transportFence,
    payload:PAYLOAD,
    currentMainCommit:MAIN,
    currentAdmissionFingerprint:admission.admissionFingerprint,
    currentShadowEvidenceFingerprint:admission.shadowEvidenceFingerprint,
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
    executionAtMs:9200,
    restartSinceAuthorization:false,
    durableIntentWriter:writer(
      "ALREADY_PERSISTED_RECONCILIATION_REQUIRED",
      events,
    ),
    transportAdapter:adapter(transportFence,{},events),
  });
  assert.deepEqual(events,["intent"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.transportAttemptObserved,false);
  assert.equal(result.transportExecutionPerformed,false);
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.blindResumeAfterRestartAllowed,false);
});

test("unknown send or incomplete ACK/settlement evidence requires reconciliation",async()=>{
  for(const options of [
    {throwSend:true,status:"UNKNOWN",observedSendCmCalls:0},
    {settlementObserved:false,settlementCorrelated:false},
    {duplicateSendObserved:true},
  ]){
    const {admission,authorization,transportFence}=prepared();
    const events=[];
    const result=await fuehrePr22CoordinationProductiveEvidenceEinmalAus({
      schemaVersion:1,
      authorization,
      admissionRecord:admission,
      transportFence,
      payload:PAYLOAD,
      currentMainCommit:MAIN,
      currentAdmissionFingerprint:admission.admissionFingerprint,
      currentShadowEvidenceFingerprint:admission.shadowEvidenceFingerprint,
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
      executionAtMs:9200,
      restartSinceAuthorization:false,
      durableIntentWriter:writer("PERSISTED_NEW",events),
      transportAdapter:adapter(transportFence,options,events),
    });
    assert.deepEqual(events,["intent","send","read"]);
    assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
    assert.equal(result.authorizationConsumed,true);
    assert.equal(result.productiveEvidenceSatisfied,false);
    assert.equal(result.productiveRatificationAllowed,false);
    assert.equal(result.sameIntentRetryAllowed,false);
  }
});

test("one-shot execution contract keeps ratification and broad authority closed",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-evidence-one-shot-execution-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_ONE_SHOT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredAuthorizationStatus,
    "AUTHORIZED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(contract.execution.typedTransportAdapterOnly,true);
  assert.equal(
    contract.execution.transportAdapterMethod,
    "sendPr22CoordinationProductiveEvidenceMessage",
  );
  assert.equal(contract.execution.durableIntentRequiredBeforeSend,true);
  assert.equal(contract.execution.oneShotSendRequired,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.execution.ackEvidenceRequired,true);
  assert.equal(contract.execution.settlementEvidenceRequired,true);
  assert.equal(contract.execution.terminalSendRecordRequired,true);
  assert.equal(contract.success.productiveEvidenceSatisfied,true);
  assert.equal(contract.success.productiveRatificationAllowed,false);
  assert.equal(contract.success.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthorityPersisted,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("one-shot execution source exposes only typed transport adapter",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-evidence-one-shot-execution-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(
    source.includes("sendPr22CoordinationProductiveEvidenceMessage("),
    true,
  );
  assert.equal(
    source.includes("readPr22CoordinationProductiveEvidence("),
    true,
  );
});
