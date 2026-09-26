import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantGateProposalVor,
  bereitePr21MerchantDefaultOffApplyVor,
  pr21MerchantApplyAuthorizationConfirmationText,
  bereitePr21MerchantApplyExecutionAuthorizationVor,
  erteilePr21MerchantApplyExecutionAuthorization,
} from "../../erzeugt/index.js";

const MAIN="ddbd3bc4af96302b75dff2e554bcbecdeca3a828";
const PKG="0123456789abcdef";
const RAT="fedcba9876543210";

function ratification() {
  return {
    schemaVersion:1,
    status:"RATIFIED_RECORD_ONLY",
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    packageId:"pkg-pr21-apply-auth",
    packageFingerprint:PKG,
    sourceMainCommit:MAIN,
    ratifierId:"operator-ratifier",
    ratifiedAtMs:1000,
    confirmationText:"ratified",
    cap022FullChainRequired:false,
    cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,
    ratified:true,
    gateAdvanced:false,
    authorityIssued:false,
    broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,
    resultPackageStillImmutable:true,
    ratificationFingerprint:RAT,
  };
}

function featureGate() {
  return {
    stage:"PR21",
    productiveEligible:true,
    blocker:[],
    cap022FullChainRequired:false,
    cap022FullChainSatisfied:true,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
  };
}

function defaultOffBoundary() {
  const proposal=bereitePr21MerchantGateProposalVor({
    schemaVersion:1,
    currentMainCommit:MAIN,
    expectedPackageFingerprint:PKG,
    ratification:ratification(),
    featureGate:featureGate(),
  });
  return bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,
    proposalBoundary:proposal,
    transactionId:"tx-pr21-apply-auth",
    preparedAtMs:2000,
    currentMainCommit:MAIN,
  });
}

test("PR21 execution authorization draft remains exact, short-lived and non-executing",()=>{
  const boundary=defaultOffBoundary();
  assert.equal(boundary.status,"READY_DEFAULT_OFF");

  const draft=bereitePr21MerchantApplyExecutionAuthorizationVor(
    boundary,
    "auth-pr21-gate-apply-1",
    2100,
    3500,
  );
  assert.equal(draft.status,"AWAITING_EXPLICIT_APPLY_AUTHORIZATION");
  assert.equal(draft.stage,"PR21");
  assert.equal(draft.transactionId,boundary.transaction.transactionId);
  assert.equal(
    draft.transactionFingerprint,
    boundary.transaction.transactionFingerprint,
  );
  assert.equal(draft.sourceMainCommit,MAIN);
  assert.equal(draft.packageFingerprint,PKG);
  assert.equal(draft.ratificationFingerprint,RAT);
  assert.equal(draft.maximumUses,1);
  assert.equal(draft.expiresAtMs-draft.issuedAtMs,1400);
  assert.equal(
    draft.requiredConfirmationText,
    pr21MerchantApplyAuthorizationConfirmationText(
      boundary.transaction.transactionFingerprint,
      MAIN,
    ),
  );
  assert.equal(draft.freshMainCheckRequiredAtExecution,true);
  assert.equal(draft.transactionFingerprintRecheckRequiredAtExecution,true);
  assert.equal(draft.durableIntentRequiredBeforeMutation,true);
  assert.equal(draft.oneShotExecutionRequired,true);
  assert.equal(draft.sameIntentRetryAllowed,false);
  assert.equal(draft.postconditionVerificationRequired,true);
  assert.equal(draft.unknownOutcomeRequiresReconciliation,true);
  assert.equal(draft.applyAdapterInstalled,false);
  assert.equal(draft.executionEnabled,false);
  assert.equal(draft.executionPerformed,false);
  assert.equal(draft.gateMutationPerformed,false);
  assert.equal(draft.gameplayAuthority,false);
  assert.equal(draft.rawWriteAuthority,false);
  assert.equal(draft.broadRuntimeGrant,false);
  assert.equal(draft.normalRuntimeAllowed,false);
});

test("generic acknowledgements cannot authorize PR21 gate apply execution",()=>{
  const draft=bereitePr21MerchantApplyExecutionAuthorizationVor(
    defaultOffBoundary(),"auth-pr21-gate-apply-2",2100,3500,
  );
  for(const confirmation of ["ok","mach weiter","weiter","merge","authorize"]){
    assert.throws(
      ()=>erteilePr21MerchantApplyExecutionAuthorization(
        draft,confirmation,"operator",2200,
      ),
      /PR21_MERCHANT_APPLY_AUTH_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("exact confirmation creates authorization record only, not execution",()=>{
  const draft=bereitePr21MerchantApplyExecutionAuthorizationVor(
    defaultOffBoundary(),"auth-pr21-gate-apply-3",2100,3500,
  );
  const record=erteilePr21MerchantApplyExecutionAuthorization(
    draft,draft.requiredConfirmationText,"operator-apply-authorizer",2200,
  );
  assert.equal(record.status,"AUTHORIZED_ONE_SHOT_RECORD_ONLY");
  assert.equal(record.applyExecutionAuthorizationIssued,true);
  assert.equal(record.authorizationConsumed,false);
  assert.equal(record.maximumUses,1);
  assert.equal(record.transactionFingerprint,draft.transactionFingerprint);
  assert.equal(record.sourceMainCommit,MAIN);
  assert.equal(record.operatorId,"operator-apply-authorizer");
  assert.equal(record.applyAdapterInstalled,false);
  assert.equal(record.executionEnabled,false);
  assert.equal(record.executionPerformed,false);
  assert.equal(record.gateMutationPerformed,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.broadRuntimeGrant,false);
  assert.equal(record.normalRuntimeAllowed,false);
  assert.equal(record.durableIntentRequiredBeforeMutation,true);
  assert.equal(record.sameIntentRetryAllowed,false);
});

test("expired or oversized authorization window is rejected",()=>{
  const boundary=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantApplyExecutionAuthorizationVor(
      boundary,"auth-long",2100,3601,
    ),
    /PR21_MERCHANT_APPLY_AUTH_TTL_UNGUELTIG/,
  );

  const draft=bereitePr21MerchantApplyExecutionAuthorizationVor(
    boundary,"auth-expired",2100,3500,
  );
  assert.throws(
    ()=>erteilePr21MerchantApplyExecutionAuthorization(
      draft,draft.requiredConfirmationText,"operator",3501,
    ),
    /PR21_MERCHANT_APPLY_AUTH_ABGELAUFEN/,
  );
});

test("unsafe default-off boundary cannot prepare execution authorization",()=>{
  const boundary=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantApplyExecutionAuthorizationVor(
      {...boundary,executionEnabled:true},
      "auth-unsafe",
      2100,
      3500,
    ),
    /PR21_MERCHANT_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT/,
  );
});

test("execution authorization contract remains authorization-only",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-apply-execution-authorization-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_EXPLICIT_ONE_SHOT_AUTHORIZATION_NO_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.authorization.exactConfirmationRequired,true);
  assert.equal(contract.authorization.maximumTtlMs,1500);
  assert.equal(contract.authorization.maximumUses,1);
  assert.equal(contract.authorization.freshMainCheckRequiredAtExecution,true);
  assert.equal(contract.authorization.durableIntentRequiredBeforeMutation,true);
  assert.equal(contract.authorization.sameIntentRetryAllowed,false);
  assert.equal(contract.safety.authorizationRecordDoesNotExecuteApply,true);
  assert.equal(contract.safety.applyAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.executionPerformed,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("authorization boundary source contains no gate-apply or gameplay execution",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-apply-execution-authorization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","executeGateApply(","applyGateMutation(",
    "executionEnabled: true","executionPerformed: true",
  ]) assert.equal(source.includes(marker),false,marker);
});
