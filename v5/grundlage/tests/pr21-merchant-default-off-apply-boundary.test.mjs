import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantGateProposalVor,
  bereitePr21MerchantDefaultOffApplyVor,
} from "../../erzeugt/index.js";

const MAIN="ab4d0febb3896323fcd6ca3bd0e31a1d7c8cf058";
const PKG="0123456789abcdef";

function record(overrides={}) {
  return {
    schemaVersion:1,status:"RATIFIED_RECORD_ONLY",
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    packageId:"pkg-pr21-default-off",packageFingerprint:PKG,sourceMainCommit:MAIN,
    ratifierId:"operator",ratifiedAtMs:1000,
    confirmationText:"RATIFY PR21-28 CHECKPOINT PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT PACKAGE "+PKG,
    cap022FullChainRequired:false,cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,ratified:true,gateAdvanced:false,
    authorityIssued:false,broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,resultPackageStillImmutable:true,
    ratificationFingerprint:"fedcba9876543210",
    ...overrides,
  };
}

function gate(overrides={}) {
  return {
    stage:"PR21",productiveEligible:true,blocker:[],
    cap022FullChainRequired:false,cap022FullChainSatisfied:true,
    authorityIssued:false,gameplayAuthority:false,rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function proposalBoundary() {
  return bereitePr21MerchantGateProposalVor({
    schemaVersion:1,currentMainCommit:MAIN,expectedPackageFingerprint:PKG,
    ratification:record(),featureGate:gate(),
  });
}

test("PR21 default-off apply boundary prepares and revalidates transaction without execution",()=>{
  const result=bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,
    proposalBoundary:proposalBoundary(),
    transactionId:"tx-pr21-merchant-default-off-1",
    preparedAtMs:2000,
    currentMainCommit:MAIN,
  });
  assert.equal(result.status,"READY_DEFAULT_OFF");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.stage,"PR21");
  assert.equal(result.transaction.status,"PREPARED_DEFAULT_OFF");
  assert.equal(result.validation.status,"READY_DEFAULT_OFF");
  assert.equal(result.transaction.stage,"PR21");
  assert.equal(result.transaction.sourceMainCommit,MAIN);
  assert.equal(result.transaction.packageFingerprint,PKG);
  assert.equal(result.transaction.ratificationFingerprint,"fedcba9876543210");
  assert.equal(result.transaction.durableIntentRequiredBeforeApply,true);
  assert.equal(result.transaction.oneShotApplyRequired,true);
  assert.equal(result.transaction.sameIntentRetryAllowed,false);
  assert.equal(result.transaction.postconditionVerificationRequired,true);
  assert.equal(result.transaction.unknownOutcomeRequiresReconciliation,true);
  assert.equal(result.applyAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.durableIntentCreated,false);
  assert.equal(result.oneShotApplyPreparedButNotExecuted,true);
  assert.equal(result.separateApplyExecutionRequired,true);
});

test("fresh-main drift blocks default-off validation without executing anything",()=>{
  const result=bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,
    proposalBoundary:proposalBoundary(),
    transactionId:"tx-pr21-merchant-stale",
    preparedAtMs:2001,
    currentMainCommit:"1111111111111111111111111111111111111111",
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_28_GATE_APPLY_MAIN_STALE"));
  assert.equal(result.executionEnabled,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.durableIntentCreated,false);
});

test("blocked or unsafe proposal boundary is rejected before transaction creation",()=>{
  const ready=proposalBoundary();
  assert.throws(()=>bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,
    proposalBoundary:{...ready,status:"BLOCKIERT",blocker:["x"]},
    transactionId:"tx-blocked",preparedAtMs:2002,currentMainCommit:MAIN,
  }),/PR21_MERCHANT_DEFAULT_OFF_APPLY_PROPOSAL_NICHT_BEREIT/);

  assert.throws(()=>bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,
    proposalBoundary:{...ready,authorityIssued:true},
    transactionId:"tx-unsafe",preparedAtMs:2003,currentMainCommit:MAIN,
  }),/PR21_MERCHANT_DEFAULT_OFF_APPLY_PROPOSAL_NICHT_BEREIT/);
});

test("default-off contract remains no-execution and no-authority",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-default-off-apply-boundary.json","utf8",
  ));
  assert.equal(contract.status,"PREPARED_DEFAULT_OFF_NO_EXECUTION");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.input.currentMainRecheckRequired,true);
  assert.equal(contract.transaction.status,"PREPARED_DEFAULT_OFF");
  assert.equal(contract.transaction.validationStatus,"READY_DEFAULT_OFF");
  assert.equal(contract.transaction.durableIntentRequiredBeforeApply,true);
  assert.equal(contract.transaction.sameIntentRetryAllowed,false);
  assert.equal(contract.safety.applyAdapterInstalled,false);
  assert.equal(contract.safety.executionEnabled,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.authorityIssued,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
  assert.equal(contract.safety.durableIntentCreated,false);
});

test("PR21 default-off boundary source contains no gameplay or apply execution operation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-default-off-apply-boundary.ts","utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","executeGateApply","applyGateMutation",
  ]) assert.equal(source.includes(marker),false,marker);
});
