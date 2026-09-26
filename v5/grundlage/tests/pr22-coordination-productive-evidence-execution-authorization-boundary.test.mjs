import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  pr22CoordinationProductiveEvidenceAuthorizationConfirmationText,
  bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor,
  erteilePr22CoordinationProductiveEvidenceExecutionAuthorization,
} from "../../erzeugt/index.js";

const MAIN="0f6059ebc63972fd995d16dfb3fd497b6e6bec6b";

function admissionRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
    stage:"PR22",
    shadowEvidenceFingerprint:"0011223344556677",
    shadowEvidenceMainCommit:MAIN,
    admissionMainCommit:MAIN,
    preparedAtMs:8000,
    messageId:"msg-pr22-live-1",
    workflowId:"wf-pr22-live-1",
    workflowRevision:3,
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

function admission(record=admissionRecord()) {
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

test("productive evidence authorization draft is exact, short-lived and record-only",()=>{
  const boundary=admission();
  const draft=bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
    boundary,
    "auth-pr22-productive-1",
    8100,
    9500,
  );

  assert.equal(
    draft.status,
    "AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_AUTHORIZATION",
  );
  assert.equal(draft.maximumUses,1);
  assert.equal(draft.expiresAtMs-draft.issuedAtMs,1400);
  assert.equal(
    draft.requiredConfirmationText,
    pr22CoordinationProductiveEvidenceAuthorizationConfirmationText(
      boundary.record.admissionFingerprint,
      MAIN,
    ),
  );
  assert.equal(draft.cap022FullChainRequired,true);
  assert.equal(draft.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(draft.admissionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.shadowEvidenceFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.cap022FullChainRecheckRequiredAtExecution,true);
  assert.equal(draft.durableIntentRequiredBeforeSend,true);
  assert.equal(draft.oneShotSendRequired,true);
  assert.equal(draft.sameIntentRetryAllowed,false);
  assert.equal(draft.unknownOutcomeRequiresReconciliation,true);
  assert.equal(draft.executionAuthorizationIssued,false);
  assert.equal(draft.authorizationConsumed,false);
  assert.equal(draft.externalRuntimeStartAuthorized,false);
  assert.equal(draft.transportExecutionPerformed,false);
  assert.equal(draft.sendCmAuthority,false);
  assert.equal(draft.pr22ProductiveAuthorityIssued,false);
});

test("generic acknowledgement cannot authorize productive PR22 transport",()=>{
  const draft=bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
    admission(),
    "auth-pr22-productive-2",
    8100,
    9500,
  );
  for(const confirmation of ["ok","mach weiter","weiter","authorize","start"]){
    assert.throws(
      ()=>erteilePr22CoordinationProductiveEvidenceExecutionAuthorization(
        draft,
        confirmation,
        "operator",
        8200,
      ),
      /PR22_PRODUCTIVE_AUTH_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("exact confirmation creates one-shot authorization record only",()=>{
  const draft=bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
    admission(),
    "auth-pr22-productive-3",
    8100,
    9500,
  );
  const record=erteilePr22CoordinationProductiveEvidenceExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-pr22-live",
    8200,
  );

  assert.equal(
    record.status,
    "AUTHORIZED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(record.executionAuthorizationIssued,true);
  assert.equal(record.authorizationConsumed,false);
  assert.equal(record.maximumUses,1);
  assert.equal(record.operatorId,"operator-pr22-live");
  assert.equal(record.externalRuntimeStartAuthorized,false);
  assert.equal(record.transportExecutionPerformed,false);
  assert.equal(record.productiveEvidenceSatisfied,false);
  assert.equal(record.productiveRatificationAllowed,false);
  assert.equal(record.sendCmAuthority,false);
  assert.equal(record.pr22ProductiveAuthorityIssued,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.normalRuntimeAllowed,false);
});

test("expired or oversized authorization is rejected",()=>{
  const boundary=admission();
  assert.throws(
    ()=>bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
      boundary,
      "auth-too-long",
      8100,
      9601,
    ),
    /PR22_PRODUCTIVE_AUTH_TTL_UNGUELTIG/,
  );

  const draft=bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
    boundary,
    "auth-expired",
    8100,
    9500,
  );
  assert.throws(
    ()=>erteilePr22CoordinationProductiveEvidenceExecutionAuthorization(
      draft,
      draft.requiredConfirmationText,
      "operator",
      9501,
    ),
    /PR22_PRODUCTIVE_AUTH_ABGELAUFEN/,
  );
});

test("tampered or unsafe admission cannot prepare authorization",()=>{
  const valid=admissionRecord();
  for(const boundary of [
    admission({...valid,shadowEvidenceComplete:false}),
    {...admission(),sendCmAuthority:true},
  ]){
    assert.throws(
      ()=>bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
        boundary,
        "auth-unsafe",
        8100,
        9500,
      ),
      /PR22_PRODUCTIVE_AUTH_(ADMISSION_NICHT_BEREIT|ADMISSION_FP_DRIFT)/,
    );
  }
});

test("authorization contract remains no-execution and no-send",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-evidence-execution-authorization-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_EXPLICIT_PR22_PRODUCTIVE_EVIDENCE_ONE_SHOT_AUTHORIZATION_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredAdmissionStatus,
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
  );
  assert.equal(contract.authorization.exactConfirmationRequired,true);
  assert.equal(contract.authorization.maximumTtlMs,1500);
  assert.equal(contract.authorization.maximumUses,1);
  assert.equal(contract.authorization.durableIntentRequiredBeforeSend,true);
  assert.equal(contract.authorization.oneShotSendRequired,true);
  assert.equal(contract.authorization.sameIntentRetryAllowed,false);
  assert.equal(contract.authorization.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.safety.externalRuntimeStartAuthorized,false);
  assert.equal(contract.safety.transportExecutionPerformed,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("authorization source contains no live transport backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-evidence-execution-authorization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
