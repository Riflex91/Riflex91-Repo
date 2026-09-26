import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantGateProposalVor,
  bereitePr21MerchantDefaultOffGateApplyVor,
} from "../../erzeugt/index.js";

const MAIN="ab4d0febb3896323fcd6ca3bd0e31a1d7c8cf058";
const PKG="0123456789abcdef";
const RAT="fedcba9876543210";

function record(overrides={}) {
  return {
    schemaVersion:1,status:"RATIFIED_RECORD_ONLY",checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    packageId:"pkg-pr21-default-off",packageFingerprint:PKG,sourceMainCommit:MAIN,
    ratifierId:"operator",ratifiedAtMs:1000,confirmationText:"confirmed",
    cap022FullChainRequired:false,cap022FullChainSatisfied:true,cap022FullChainBoundToPackage:true,
    ratified:true,gateAdvanced:false,authorityIssued:false,broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,resultPackageStillImmutable:true,
    ratificationFingerprint:RAT,...overrides,
  };
}

function gate(overrides={}) {
  return {
    stage:"PR21",productiveEligible:true,blocker:[],
    cap022FullChainRequired:false,cap022FullChainSatisfied:true,
    authorityIssued:false,gameplayAuthority:false,rawWriteAuthority:false,
    normalRuntimeAllowed:false,...overrides,
  };
}

function proposalBoundary(overrides={}) {
  return bereitePr21MerchantGateProposalVor({
    schemaVersion:1,currentMainCommit:MAIN,expectedPackageFingerprint:PKG,
    ratification:record(),featureGate:gate(),...overrides,
  });
}

test("PR21 default-off gate apply prepares and validates transaction without applying",()=>{
  const result=bereitePr21MerchantDefaultOffGateApplyVor({
    schemaVersion:1,currentMainCommit:MAIN,transactionId:"tx-pr21-default-off-1",
    preparedAtMs:2000,proposalBoundary:proposalBoundary(),
  });

  assert.equal(result.status,"READY_DEFAULT_OFF_NO_APPLY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.stage,"PR21");
  assert.equal(result.freshMainMatchedProposalSource,true);
  assert.equal(result.transactionPreparedDefaultOff,true);
  assert.equal(result.transactionValidatedDefaultOff,true);
  assert.equal(result.reconciliationConfirmedNoApply,true);

  assert.equal(result.transaction.status,"PREPARED_DEFAULT_OFF");
  assert.equal(result.transaction.applyAdapterInstalled,false);
  assert.equal(result.transaction.executionEnabled,false);
  assert.equal(result.transaction.gateMutationPerformed,false);
  assert.equal(result.transaction.authorityIssued,false);
  assert.equal(result.validation.status,"READY_DEFAULT_OFF");
  assert.equal(result.reconciliation.status,"DEFAULT_OFF_NO_APPLY");
  assert.equal(result.reconciliation.newApplyAttemptAllowed,false);

  assert.equal(result.durableIntentCreated,false);
  assert.equal(result.mutationAttemptObserved,false);
  assert.equal(result.applyAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("stale main blocks before transaction preparation",()=>{
  const result=bereitePr21MerchantDefaultOffGateApplyVor({
    schemaVersion:1,currentMainCommit:"1111111111111111111111111111111111111111",
    transactionId:"tx-stale",preparedAtMs:2000,proposalBoundary:proposalBoundary(),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_GATE_APPLY_MAIN_STALE"));
  assert.equal(result.transaction,null);
  assert.equal(result.validation,null);
  assert.equal(result.reconciliation,null);
  assert.equal(result.freshMainMatchedProposalSource,false);
  assert.equal(result.gateMutationPerformed,false);
});

test("blocked proposal boundary cannot create transaction",()=>{
  const blocked=proposalBoundary({
    currentMainCommit:"1111111111111111111111111111111111111111",
  });
  assert.equal(blocked.status,"BLOCKIERT");
  const result=bereitePr21MerchantDefaultOffGateApplyVor({
    schemaVersion:1,currentMainCommit:MAIN,transactionId:"tx-blocked",
    preparedAtMs:2000,proposalBoundary:blocked,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_GATE_APPLY_PROPOSAL_BOUNDARY_NICHT_BEREIT",
  ));
  assert.equal(result.transaction,null);
});

test("default-off contract guarantees no apply and no authority",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-default-off-gate-apply-boundary.json","utf8",
  ));
  assert.equal(contract.status,"PREPARED_DEFAULT_OFF_NO_APPLY");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.input.freshMainRequired,true);
  assert.equal(contract.transaction.status,"PREPARED_DEFAULT_OFF");
  assert.equal(contract.transaction.applyAdapterInstalled,false);
  assert.equal(contract.transaction.executionEnabled,false);
  assert.equal(contract.reconciliation.observedState,"NOT_APPLIED");
  assert.equal(contract.reconciliation.mutationAttemptObserved,false);
  assert.equal(contract.reconciliation.expectedStatus,"DEFAULT_OFF_NO_APPLY");
  assert.equal(contract.safety.durableIntentCreated,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.authorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("default-off boundary source contains no gameplay mutation or gate apply execution",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-default-off-gate-apply-boundary.ts","utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","applyAdapterInstalled: true","executionEnabled: true",
  ]) assert.equal(source.includes(marker),false,marker);
});
