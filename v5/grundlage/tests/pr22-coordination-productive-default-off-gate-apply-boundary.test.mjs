import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveDefaultOffGateApplyVor,
} from "../../erzeugt/index.js";

const MAIN="81ff462ccc284dcf2e14e95aeb463a9b13123d53";

function proposalRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
    stage:"PR22",
    sourceMainCommit:MAIN,
    productiveEvidenceFingerprint:"0011223344556677",
    ratificationFingerprint:"1122334455667788",
    messageId:"msg-pr22-gate-apply",
    workflowId:"wf-pr22-gate-apply",
    workflowRevision:7,
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

test("ready proposal produces deterministic default-off gate apply transaction",()=>{
  const boundary=proposalBoundary();
  const result=bereitePr22CoordinationProductiveDefaultOffGateApplyVor({
    schemaVersion:1,
    proposalBoundary:boundary,
    transactionId:"tx-pr22-gate-apply",
    preparedAtMs:12000,
    currentMainCommit:MAIN,
  });

  assert.equal(result.status,"READY_DEFAULT_OFF");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.proposalFingerprintRevalidated,true);
  assert.equal(result.currentMainMatchedProposalSource,true);
  assert.equal(result.applyAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.productiveAuthorityIssued,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);

  const tx=result.transaction;
  assert.equal(tx.status,"PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF");
  assert.equal(tx.stage,"PR22");
  assert.equal(tx.transactionId,"tx-pr22-gate-apply");
  assert.equal(tx.sourceMainCommit,MAIN);
  assert.equal(tx.proposalFingerprint,boundary.record.proposalFingerprint);
  assert.equal(
    tx.productiveEvidenceFingerprint,
    boundary.record.productiveEvidenceFingerprint,
  );
  assert.equal(tx.ratificationFingerprint,boundary.record.ratificationFingerprint);
  assert.equal(tx.freshMainCheckRequiredAtExecution,true);
  assert.equal(tx.proposalFingerprintRecheckRequiredAtExecution,true);
  assert.equal(tx.evidenceFingerprintRecheckRequiredAtExecution,true);
  assert.equal(tx.ratificationFingerprintRecheckRequiredAtExecution,true);
  assert.equal(tx.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(tx.featureGateRecheckRequiredAtExecution,true);
  assert.equal(tx.cap022FullChainRecheckRequiredAtExecution,true);
  assert.equal(tx.durableIntentRequiredBeforeGateMutation,true);
  assert.equal(tx.oneShotExecutionRequired,true);
  assert.equal(tx.sameIntentRetryAllowed,false);
  assert.equal(tx.postconditionVerificationRequired,true);
  assert.equal(tx.unknownOutcomeRequiresReconciliation,true);
  assert.equal(tx.executionEnabled,false);
  assert.equal(tx.gateMutationPerformed,false);
  assert.match(tx.transactionFingerprint,/^[0-9a-f]{16}$/);
});

test("stale main blocks default-off gate apply preparation",()=>{
  const result=bereitePr22CoordinationProductiveDefaultOffGateApplyVor({
    schemaVersion:1,
    proposalBoundary:proposalBoundary(),
    transactionId:"tx-pr22-gate-apply-stale",
    preparedAtMs:12000,
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.currentMainMatchedProposalSource,false);
  assert.ok(result.blocker.includes("PR22_GATE_APPLY_MAIN_STALE"));
});

test("tampered proposal fingerprint blocks transaction preparation",()=>{
  const valid=proposalRecord();
  const tampered={...valid,workflowRevision:8};
  const result=bereitePr22CoordinationProductiveDefaultOffGateApplyVor({
    schemaVersion:1,
    proposalBoundary:proposalBoundary(tampered),
    transactionId:"tx-pr22-gate-apply-tampered",
    preparedAtMs:12000,
    currentMainCommit:MAIN,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.proposalFingerprintRevalidated,false);
  assert.ok(result.blocker.includes("PR22_GATE_APPLY_PROPOSAL_NICHT_BEREIT"));
});

test("blocked or authority-drifted proposal cannot prepare transaction",()=>{
  const cases=[
    {
      ...proposalBoundary(),
      status:"BLOCKIERT",
      blocker:["PR22_GATE_PROPOSAL_FEATURE_GATE_NICHT_ELIGIBLE"],
      record:null,
    },
    {
      ...proposalBoundary(),
      productiveAuthorityIssued:true,
    },
  ];
  for(const proposalBoundary of cases){
    const result=bereitePr22CoordinationProductiveDefaultOffGateApplyVor({
      schemaVersion:1,
      proposalBoundary,
      transactionId:"tx-pr22-gate-apply-blocked",
      preparedAtMs:12000,
      currentMainCommit:MAIN,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.transaction,null);
  }
});

test("default-off gate apply contract remains non-executable",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-default-off-gate-apply-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_PRODUCTIVE_DEFAULT_OFF_GATE_APPLY_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredProposalStatus,
    "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
  );
  assert.equal(
    contract.success.status,
    "PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF",
  );
  assert.equal(contract.execution.freshMainCheckRequired,true);
  assert.equal(contract.execution.proposalFingerprintRecheckRequired,true);
  assert.equal(contract.execution.evidenceFingerprintRecheckRequired,true);
  assert.equal(contract.execution.ratificationFingerprintRecheckRequired,true);
  assert.equal(contract.execution.repositoryStateRecheckRequired,true);
  assert.equal(contract.execution.featureGateRecheckRequired,true);
  assert.equal(contract.execution.cap022FullChainRecheckRequired,true);
  assert.equal(contract.execution.durableIntentRequiredBeforeGateMutation,true);
  assert.equal(contract.execution.oneShotExecutionRequired,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.postconditionVerificationRequired,true);
  assert.equal(contract.execution.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.safety.applyAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.productiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
});

test("default-off gate apply source contains no mutation or transport backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-default-off-gate-apply-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","applyPr22","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
