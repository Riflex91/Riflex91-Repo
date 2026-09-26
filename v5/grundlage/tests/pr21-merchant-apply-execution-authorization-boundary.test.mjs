import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantGateProposalVor,
  bereitePr21MerchantDefaultOffApplyVor,
  bereitePr21MerchantApplyAuthorizationVor,
  autorisierePr21MerchantOneShotApply,
  pr21MerchantApplyAuthorizationConfirmationText,
} from "../../erzeugt/index.js";

const MAIN="ddbd3bc4af96302b75dff2e554bcbecdeca3a828";
const PKG="0123456789abcdef";

function ratificationRecord(){
  return {
    schemaVersion:1,status:"RATIFIED_RECORD_ONLY",
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    packageId:"pkg-pr21-apply-auth",packageFingerprint:PKG,sourceMainCommit:MAIN,
    ratifierId:"operator-ratifier",ratifiedAtMs:1000,
    confirmationText:"RATIFY PR21-28 CHECKPOINT PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT PACKAGE "+PKG,
    cap022FullChainRequired:false,cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,ratified:true,gateAdvanced:false,
    authorityIssued:false,broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,resultPackageStillImmutable:true,
    ratificationFingerprint:"fedcba9876543210",
  };
}

function featureGate(){
  return {
    stage:"PR21",productiveEligible:true,blocker:[],
    cap022FullChainRequired:false,cap022FullChainSatisfied:true,
    authorityIssued:false,gameplayAuthority:false,rawWriteAuthority:false,
    normalRuntimeAllowed:false,
  };
}

function defaultOffBoundary(){
  const proposal=bereitePr21MerchantGateProposalVor({
    schemaVersion:1,currentMainCommit:MAIN,expectedPackageFingerprint:PKG,
    ratification:ratificationRecord(),featureGate:featureGate(),
  });
  return bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,proposalBoundary:proposal,
    transactionId:"tx-pr21-apply-auth-1",preparedAtMs:2000,currentMainCommit:MAIN,
  });
}

test("apply authorization draft is exact transaction/main bound and still no execution",()=>{
  const boundary=defaultOffBoundary();
  const draft=bereitePr21MerchantApplyAuthorizationVor(boundary);
  const expected=pr21MerchantApplyAuthorizationConfirmationText(
    boundary.transaction.transactionFingerprint,MAIN,
  );
  assert.equal(draft.status,"AWAITING_EXPLICIT_APPLY_AUTHORIZATION");
  assert.equal(draft.stage,"PR21");
  assert.equal(draft.transactionId,boundary.transaction.transactionId);
  assert.equal(draft.transactionFingerprint,boundary.transaction.transactionFingerprint);
  assert.equal(draft.sourceMainCommit,MAIN);
  assert.equal(draft.requiredConfirmationText,expected);
  assert.ok(expected.includes(boundary.transaction.transactionFingerprint));
  assert.ok(expected.includes(MAIN));
  assert.equal(draft.oneShotApplyAuthorized,false);
  assert.equal(draft.authorizationConsumed,false);
  assert.equal(draft.freshMainCheckRequiredAtExecution,true);
  assert.equal(draft.durableIntentRequiredBeforeExecution,true);
  assert.equal(draft.postconditionVerificationRequired,true);
  assert.equal(draft.unknownOutcomeRequiresReconciliation,true);
  assert.equal(draft.sameIntentRetryAllowed,false);
  assert.equal(draft.executionEnabled,false);
  assert.equal(draft.gateMutationPerformed,false);
  assert.equal(draft.authorityIssued,false);
  assert.equal(draft.broadRuntimeGrant,false);
  assert.equal(draft.gameplayAuthority,false);
  assert.equal(draft.rawWriteAuthority,false);
  assert.equal(draft.normalRuntimeAllowed,false);
});

test("exact confirmation creates one-shot authorization record only",()=>{
  const draft=bereitePr21MerchantApplyAuthorizationVor(defaultOffBoundary());
  const record=autorisierePr21MerchantOneShotApply(
    draft,draft.requiredConfirmationText,"operator-apply-authorizer",3000,
  );
  assert.equal(record.status,"AUTHORIZED_ONE_SHOT_APPLY_RECORD_ONLY");
  assert.equal(record.stage,"PR21");
  assert.equal(record.transactionId,draft.transactionId);
  assert.equal(record.transactionFingerprint,draft.transactionFingerprint);
  assert.equal(record.oneShotApplyAuthorized,true);
  assert.equal(record.authorizationConsumed,false);
  assert.equal(record.freshMainCheckRequiredAtExecution,true);
  assert.equal(record.durableIntentRequiredBeforeExecution,true);
  assert.equal(record.sameIntentRetryAllowed,false);
  assert.equal(record.executionEnabled,false);
  assert.equal(record.gateMutationPerformed,false);
  assert.equal(record.authorityIssued,false);
  assert.equal(record.broadRuntimeGrant,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.normalRuntimeAllowed,false);
  assert.match(record.authorizationFingerprint,/^[0-9a-f]{16}$/);
});

test("generic or wrong acknowledgement cannot authorize PR21 gate apply",()=>{
  const draft=bereitePr21MerchantApplyAuthorizationVor(defaultOffBoundary());
  for(const confirmation of ["ok","mach weiter","weiter","AUTHORIZE"]){
    assert.throws(
      ()=>autorisierePr21MerchantOneShotApply(draft,confirmation,"operator",3001),
      /PR21_MERCHANT_APPLY_AUTH_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("blocked default-off boundary cannot produce authorization draft",()=>{
  const ready=defaultOffBoundary();
  assert.throws(
    ()=>bereitePr21MerchantApplyAuthorizationVor({
      ...ready,status:"BLOCKIERT",blocker:["PR21_28_GATE_APPLY_MAIN_STALE"],
    }),
    /PR21_MERCHANT_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT/,
  );
});

test("apply authorization contract remains record-only and no-execution",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-apply-execution-authorization-boundary.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_EXPLICIT_ONE_SHOT_AUTHORIZATION_RECORD_ONLY");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.input.exactTransactionAndMainBoundConfirmationRequired,true);
  assert.equal(contract.draft.status,"AWAITING_EXPLICIT_APPLY_AUTHORIZATION");
  assert.equal(contract.record.status,"AUTHORIZED_ONE_SHOT_APPLY_RECORD_ONLY");
  assert.equal(contract.record.authorizationConsumed,false);
  assert.equal(contract.record.freshMainCheckRequiredAtExecution,true);
  assert.equal(contract.record.durableIntentRequiredBeforeExecution,true);
  assert.equal(contract.record.sameIntentRetryAllowed,false);
  assert.equal(contract.safety.recordOnly,true);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.authorityIssued,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
  assert.equal(contract.safety.authorizationDoesNotExecuteApply,true);
});

test("authorization boundary source contains no gameplay mutation or gate execution call",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-apply-execution-authorization-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","executeGateApply(","applyGateMutation(",
  ]) assert.equal(source.includes(marker),false,marker);
});
