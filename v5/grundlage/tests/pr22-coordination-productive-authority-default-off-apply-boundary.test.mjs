import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveAuthorityDefaultOffApplyVor,
} from "../../erzeugt/index.js";

const MAIN="9af97b7dc84f508fd90b08cf6e4a20264aacf9ae";

function postSettlementBoundary(recordPatch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
    stage:"PR22",
    sourceMainCommit:MAIN,
    authorizationId:"auth-pr22-authority-apply",
    transactionId:"tx-pr22-gate-apply",
    transactionFingerprint:"0011223344556677",
    proposalFingerprint:"1122334455667788",
    productiveEvidenceFingerprint:"2233445566778899",
    ratificationFingerprint:"33445566778899aa",
    settlementFingerprint:"445566778899aabb",
    preparedAtMs:18000,
    gateApplyVerified:true,
    repositoryStateRevalidated:true,
    featureGateProductiveEligible:true,
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
    freshMainCheckRequiredAtAuthorityApply:true,
    settlementFingerprintRecheckRequiredAtAuthorityApply:true,
    transactionFingerprintRecheckRequiredAtAuthorityApply:true,
    proposalFingerprintRecheckRequiredAtAuthorityApply:true,
    evidenceFingerprintRecheckRequiredAtAuthorityApply:true,
    ratificationFingerprintRecheckRequiredAtAuthorityApply:true,
    repositoryStateRecheckRequiredAtAuthorityApply:true,
    featureGateRecheckRequiredAtAuthorityApply:true,
    cap022FullChainRecheckRequiredAtAuthorityApply:true,
    separateProductiveAuthorityApplyRequired:true,
    authorityApplyAdapterInstalled:false,
    authorityApplyExecutionEnabled:false,
    additionalGateMutationPerformed:false,
    productiveAuthorityIssued:false,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    ...recordPatch,
  };
  const record={
    ...basis,
    postSettlementFingerprint:evidenceFingerprint(basis),
  };
  return {
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
    blocker:[],
    record,
    executionRevalidated:true,
    settlementFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    featureGateRevalidated:true,
    cap022FullChainRevalidated:true,
    authorityApplyAdapterInstalled:false,
    authorityApplyExecutionEnabled:false,
    additionalGateMutationPerformed:false,
    productiveAuthorityIssued:false,
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

test("productive authority apply prepares deterministic default-off transaction only",()=>{
  const result=
    bereitePr22CoordinationProductiveAuthorityDefaultOffApplyVor({
      schemaVersion:1,
      postSettlementBoundary:postSettlementBoundary(),
      transactionId:"tx-pr22-authority-apply-1",
      currentMainCommit:MAIN,
      preparedAtMs:18100,
    });

  assert.equal(result.status,"READY_DEFAULT_OFF");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.postSettlementFingerprintRevalidated,true);
  assert.equal(result.currentMainMatched,true);
  assert.equal(
    result.transaction.status,
    "PREPARED_PR22_PRODUCTIVE_AUTHORITY_APPLY_DEFAULT_OFF",
  );
  assert.equal(result.transaction.stage,"PR22");
  assert.equal(result.transaction.freshMainCheckRequiredAtExecution,true);
  assert.equal(
    result.transaction.postSettlementFingerprintRecheckRequiredAtExecution,
    true,
  );
  assert.equal(result.transaction.settlementFingerprintRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.gateTransactionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.proposalFingerprintRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.evidenceFingerprintRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.ratificationFingerprintRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.repositoryStateRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.featureGateRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.cap022FullChainRecheckRequiredAtExecution,true);
  assert.equal(result.transaction.durableIntentRequiredBeforeAuthorityMutation,true);
  assert.equal(result.transaction.oneShotExecutionRequired,true);
  assert.equal(result.transaction.sameIntentRetryAllowed,false);
  assert.equal(result.transaction.postconditionVerificationRequired,true);
  assert.equal(result.transaction.unknownOutcomeRequiresReconciliation,true);
  assert.match(result.transaction.authorityTransactionFingerprint,/^[0-9a-f]{16}$/);
  assert.equal(result.authorityApplyAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.productiveAuthorityIssued,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.separateExecutionAuthorizationRequired,true);
});

test("stale main blocks productive authority apply preparation",()=>{
  const result=
    bereitePr22CoordinationProductiveAuthorityDefaultOffApplyVor({
      schemaVersion:1,
      postSettlementBoundary:postSettlementBoundary(),
      transactionId:"tx-pr22-authority-apply-stale",
      currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      preparedAtMs:18100,
    });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.currentMainMatched,false);
  assert.ok(result.blocker.includes("PR22_AUTHORITY_APPLY_MAIN_STALE"));
});

test("tampered post-settlement fingerprint blocks authority transaction",()=>{
  const ready=postSettlementBoundary();
  const tampered={
    ...ready,
    record:{
      ...ready.record,
      settlementFingerprint:"aaaaaaaaaaaaaaaa",
    },
  };
  const result=
    bereitePr22CoordinationProductiveAuthorityDefaultOffApplyVor({
      schemaVersion:1,
      postSettlementBoundary:tampered,
      transactionId:"tx-pr22-authority-apply-tampered",
      currentMainCommit:MAIN,
      preparedAtMs:18100,
    });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.transaction,null);
  assert.equal(result.postSettlementFingerprintRevalidated,false);
  assert.ok(result.blocker.includes(
    "PR22_AUTHORITY_APPLY_POST_SETTLEMENT_FP_DRIFT",
  ));
});

test("blocked or unsafe post-settlement boundary cannot prepare authority apply",()=>{
  const ready=postSettlementBoundary();
  const cases=[
    {...ready,status:"BLOCKIERT",blocker:["blocked"],record:null},
    {...ready,productiveAuthorityIssued:true},
  ];
  for(const boundary of cases){
    const result=
      bereitePr22CoordinationProductiveAuthorityDefaultOffApplyVor({
        schemaVersion:1,
        postSettlementBoundary:boundary,
        transactionId:"tx-pr22-authority-apply-blocked",
        currentMainCommit:MAIN,
        preparedAtMs:18100,
      });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.transaction,null);
  }
});

test("productive authority apply contract remains default-off",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-authority-default-off-apply-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_PRODUCTIVE_AUTHORITY_DEFAULT_OFF_APPLY_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredPostSettlementStatus,
    "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
  );
  assert.equal(
    contract.transaction.status,
    "PREPARED_PR22_PRODUCTIVE_AUTHORITY_APPLY_DEFAULT_OFF",
  );
  assert.equal(contract.transaction.freshMainCheckRequiredAtExecution,true);
  assert.equal(contract.transaction.durableIntentRequiredBeforeAuthorityMutation,true);
  assert.equal(contract.transaction.oneShotExecutionRequired,true);
  assert.equal(contract.transaction.sameIntentRetryAllowed,false);
  assert.equal(contract.transaction.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.safety.authorityApplyAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.productiveAuthorityIssued,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("productive authority default-off source contains no authority backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-authority-default-off-apply-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","issuePr22ProductiveAuthority(",
    "executionEnabled:true","productiveAuthorityIssued:true",
  ]) assert.equal(source.includes(marker),false,marker);
});
