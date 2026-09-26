import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveDefaultOffGateApplyVor,
  pr22CoordinationProductiveGateApplyAuthorizationConfirmationText,
  bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor,
  erteilePr22CoordinationProductiveGateApplyExecutionAuthorization,
} from "../../erzeugt/index.js";

const MAIN="078680a5bfeb170ba800723a1d65023c780138af";

function proposalRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
    stage:"PR22",
    sourceMainCommit:MAIN,
    productiveEvidenceFingerprint:"0011223344556677",
    ratificationFingerprint:"1122334455667788",
    messageId:"msg-pr22-gate-auth",
    workflowId:"wf-pr22-gate-auth",
    workflowRevision:8,
    featureGateProductiveEligible:true,
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
    repositoryStateRevalidated:true,
    freshMainCheckRequiredAtApply:true,
    evidenceFingerprintRecheckRequiredAtApply:true,
    ratificationFingerprintRecheckRequiredAtApply:true,
    repositoryStateRecheckRequiredAtApply:true,
    cap022FullChainRecheckRequiredAtApply:true,
    separateApplyRequired:true,
    gateMutationPerformed:false,
    productiveAuthorityIssued:false,
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
  return {...basis,proposalFingerprint:evidenceFingerprint(basis)};
}

function proposalBoundary(record=proposalRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
    blocker:[],
    record,
    ratificationFingerprintRevalidated:true,
    productiveEvidenceFingerprintMatched:true,
    repositoryStateRevalidated:true,
    featureGateRevalidated:true,
    cap022FullChainRevalidated:true,
    gateMutationPerformed:false,
    productiveAuthorityIssued:false,
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

function defaultOff() {
  return bereitePr22CoordinationProductiveDefaultOffGateApplyVor({
    schemaVersion:1,
    proposalBoundary:proposalBoundary(),
    transactionId:"tx-pr22-gate-auth",
    preparedAtMs:13000,
    currentMainCommit:MAIN,
  });
}

test("gate apply authorization draft is exact, short-lived and non-executing",()=>{
  const boundary=defaultOff();
  const draft=bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
    boundary,
    "auth-pr22-gate-apply-1",
    13100,
    14500,
  );

  assert.equal(
    draft.status,
    "AWAITING_EXPLICIT_PR22_PRODUCTIVE_GATE_APPLY_AUTHORIZATION",
  );
  assert.equal(draft.stage,"PR22");
  assert.equal(draft.maximumUses,1);
  assert.equal(draft.expiresAtMs-draft.issuedAtMs,1400);
  assert.equal(
    draft.requiredConfirmationText,
    pr22CoordinationProductiveGateApplyAuthorizationConfirmationText(
      boundary.transaction.transactionFingerprint,
      MAIN,
    ),
  );
  assert.equal(draft.transactionFingerprint,boundary.transaction.transactionFingerprint);
  assert.equal(draft.proposalFingerprint,boundary.transaction.proposalFingerprint);
  assert.equal(
    draft.productiveEvidenceFingerprint,
    boundary.transaction.productiveEvidenceFingerprint,
  );
  assert.equal(
    draft.ratificationFingerprint,
    boundary.transaction.ratificationFingerprint,
  );
  assert.equal(draft.freshMainCheckRequiredAtExecution,true);
  assert.equal(draft.transactionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.proposalFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.evidenceFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.ratificationFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(draft.featureGateRecheckRequiredAtExecution,true);
  assert.equal(draft.cap022FullChainRecheckRequiredAtExecution,true);
  assert.equal(draft.durableIntentRequiredBeforeGateMutation,true);
  assert.equal(draft.oneShotExecutionRequired,true);
  assert.equal(draft.sameIntentRetryAllowed,false);
  assert.equal(draft.postconditionVerificationRequired,true);
  assert.equal(draft.unknownOutcomeRequiresReconciliation,true);
  assert.equal(draft.executionEnabled,false);
  assert.equal(draft.executionPerformed,false);
  assert.equal(draft.gateMutationPerformed,false);
  assert.equal(draft.sendCmAuthority,false);
  assert.equal(draft.pr22ProductiveAuthorityIssued,false);
});

test("generic acknowledgement cannot authorize PR22 productive gate apply",()=>{
  const draft=bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
    defaultOff(),
    "auth-pr22-gate-apply-2",
    13100,
    14500,
  );
  for(const confirmation of ["ok","mach weiter","weiter","authorize","apply"]){
    assert.throws(
      ()=>erteilePr22CoordinationProductiveGateApplyExecutionAuthorization(
        draft,confirmation,"operator",13200,
      ),
      /PR22_GATE_APPLY_AUTH_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("exact confirmation creates one-shot authorization record only",()=>{
  const draft=bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
    defaultOff(),
    "auth-pr22-gate-apply-3",
    13100,
    14500,
  );
  const record=erteilePr22CoordinationProductiveGateApplyExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-pr22-gate-apply",
    13200,
  );

  assert.equal(
    record.status,
    "AUTHORIZED_PR22_PRODUCTIVE_GATE_APPLY_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(record.gateApplyExecutionAuthorizationIssued,true);
  assert.equal(record.authorizationConsumed,false);
  assert.equal(record.maximumUses,1);
  assert.equal(record.operatorId,"operator-pr22-gate-apply");
  assert.equal(record.executionEnabled,false);
  assert.equal(record.executionPerformed,false);
  assert.equal(record.gateMutationPerformed,false);
  assert.equal(record.productiveAuthorityIssued,false);
  assert.equal(record.sendCmAuthority,false);
  assert.equal(record.pr22ProductiveAuthorityIssued,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.normalRuntimeAllowed,false);
});

test("expired or oversized authorization is rejected",()=>{
  assert.throws(
    ()=>bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
      defaultOff(),"auth-too-long",13100,14601,
    ),
    /PR22_GATE_APPLY_AUTH_TTL_UNGUELTIG/,
  );
  const draft=bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
    defaultOff(),"auth-expired",13100,14500,
  );
  assert.throws(
    ()=>erteilePr22CoordinationProductiveGateApplyExecutionAuthorization(
      draft,draft.requiredConfirmationText,"operator",14501,
    ),
    /PR22_GATE_APPLY_AUTH_ABGELAUFEN/,
  );
});

test("unsafe default-off boundary cannot prepare authorization",()=>{
  assert.throws(
    ()=>bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
      {...defaultOff(),executionEnabled:true},
      "auth-unsafe",13100,14500,
    ),
    /PR22_GATE_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT/,
  );
});

test("authorization contract remains record-only and no-authority",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-gate-apply-execution-authorization-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_EXPLICIT_PR22_PRODUCTIVE_GATE_APPLY_ONE_SHOT_AUTHORIZATION_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredTransactionStatus,
    "PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF",
  );
  assert.equal(contract.authorization.exactConfirmationRequired,true);
  assert.equal(contract.authorization.maximumTtlMs,1500);
  assert.equal(contract.authorization.maximumUses,1);
  assert.equal(contract.authorization.durableIntentRequiredBeforeGateMutation,true);
  assert.equal(contract.authorization.sameIntentRetryAllowed,false);
  assert.equal(contract.authorization.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.executionPerformed,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
});

test("authorization source contains no gate or transport execution backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-gate-apply-execution-authorization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","writeFile(","writeFileSync(",
    "applyPr22","execute(","mutieren(","executionEnabled:true",
    "gateMutationPerformed:true",
  ]) assert.equal(source.includes(marker),false,marker);
});
