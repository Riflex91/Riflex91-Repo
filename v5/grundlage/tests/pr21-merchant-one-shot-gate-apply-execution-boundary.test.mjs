import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantGateProposalVor,
  bereitePr21MerchantDefaultOffApplyVor,
  bereitePr21MerchantApplyExecutionAuthorizationVor,
  erteilePr21MerchantApplyExecutionAuthorization,
  fuehrePr21MerchantGateApplyEinmalAus,
} from "../../erzeugt/index.js";

const MAIN="9956a1154774c1d24491ced8cb21f651c7790508";
const PKG="0123456789abcdef";
const RAT="fedcba9876543210";

function ratification() {
  return {
    schemaVersion:1,
    status:"RATIFIED_RECORD_ONLY",
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    packageId:"pkg-pr21-exec",
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

function fixture() {
  const proposal=bereitePr21MerchantGateProposalVor({
    schemaVersion:1,
    currentMainCommit:MAIN,
    expectedPackageFingerprint:PKG,
    ratification:ratification(),
    featureGate:featureGate(),
  });
  const boundary=bereitePr21MerchantDefaultOffApplyVor({
    schemaVersion:1,
    proposalBoundary:proposal,
    transactionId:"tx-pr21-exec",
    preparedAtMs:2000,
    currentMainCommit:MAIN,
  });
  const draft=bereitePr21MerchantApplyExecutionAuthorizationVor(
    boundary,"auth-pr21-exec",2100,3500,
  );
  const authorization=erteilePr21MerchantApplyExecutionAuthorization(
    draft,draft.requiredConfirmationText,"operator-exec",2200,
  );
  return {boundary,authorization};
}

function durableWriter(calls,{status="PERSISTED_NEW",persistedAtMs=2301}={}) {
  return {
    async persistPr21MerchantGateApplyIntent(input) {
      calls.push(["intent",input]);
      return {
        schemaVersion:1,
        status,
        durableIntentId:"intent-pr21-exec",
        authorizationId:input.authorizationId,
        transactionId:input.transactionId,
        operationKey:input.operationKey,
        transactionFingerprint:input.transactionFingerprint,
        persistedAtMs,
      };
    },
  };
}

function adapter(calls,tx,{postStatus="APPLIED",terminal=true,throwApply=false}={}) {
  return {
    async applyPr21MerchantIntegrationGate(input) {
      calls.push(["apply",input]);
      assert.equal(calls[0][0],"intent");
      if(throwApply) throw new Error("simulated uncertain adapter failure");
      return {
        schemaVersion:1,
        outcome:postStatus==="APPLIED"?"APPLIED":"NOT_APPLIED",
        mutationAttempted:true,
        terminalMutationRecordPersisted:terminal,
      };
    },
    async readPr21MerchantIntegrationGatePostcondition(input) {
      calls.push(["postcondition",input]);
      return {
        schemaVersion:1,
        status:postStatus,
        stage:"PR21",
        transactionFingerprint:postStatus==="APPLIED"
          ?tx.transactionFingerprint
          :null,
        observedAtMs:2400,
      };
    },
  };
}

test("one-shot PR21 gate apply persists intent before narrow control-plane mutation and records verified settlement",async()=>{
  const {boundary,authorization}=fixture();
  const calls=[];
  const result=await fuehrePr21MerchantGateApplyEinmalAus({
    schemaVersion:1,
    authorization,
    transaction:boundary.transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:boundary.transaction.transactionFingerprint,
    executionAtMs:2300,
    restartSinceAuthorization:false,
    durableIntentWriter:durableWriter(calls),
    controlPlaneAdapter:adapter(calls,boundary.transaction),
  });
  assert.deepEqual(calls.map(x=>x[0]),["intent","apply","postcondition"]);
  assert.equal(result.status,"APPLIED_VERIFIED_RECORD_ONLY");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.durableIntentPersisted,true);
  assert.equal(result.mutationAttemptObserved,true);
  assert.equal(result.gateMutationPerformed,true);
  assert.equal(result.controlPlaneMutationOnly,true);
  assert.equal(result.settlement.status,"APPLIED_VERIFIED_RECORD_ONLY");
  assert.equal(result.reconciliation.status,"ALREADY_APPLIED_REQUIRES_RECORD_ONLY");
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.blindResumeAfterRestartAllowed,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("stale main, transaction drift, expiry and restart block before durable intent or mutation",async()=>{
  const {boundary,authorization}=fixture();
  for(const override of [
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentTransactionFingerprint:"1111111111111111"},
    {executionAtMs:3501},
    {restartSinceAuthorization:true},
  ]){
    const calls=[];
    const result=await fuehrePr21MerchantGateApplyEinmalAus({
      schemaVersion:1,
      authorization,
      transaction:boundary.transaction,
      currentMainCommit:MAIN,
      currentTransactionFingerprint:boundary.transaction.transactionFingerprint,
      executionAtMs:2300,
      restartSinceAuthorization:false,
      durableIntentWriter:durableWriter(calls),
      controlPlaneAdapter:adapter(calls,boundary.transaction),
      ...override,
    });
    assert.equal(result.status,"BLOCKIERT_PRECHECK");
    assert.equal(result.authorizationConsumed,false);
    assert.equal(result.gateMutationPerformed,false);
    assert.deepEqual(calls,[]);
  }
});

test("existing durable intent never resumes or retries the gate mutation",async()=>{
  const {boundary,authorization}=fixture();
  const calls=[];
  const result=await fuehrePr21MerchantGateApplyEinmalAus({
    schemaVersion:1,
    authorization,
    transaction:boundary.transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:boundary.transaction.transactionFingerprint,
    executionAtMs:2300,
    restartSinceAuthorization:false,
    durableIntentWriter:durableWriter(calls,{
      status:"ALREADY_PERSISTED_RECONCILIATION_REQUIRED",
    }),
    controlPlaneAdapter:adapter(calls,boundary.transaction),
  });
  assert.deepEqual(calls.map(x=>x[0]),["intent"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.blindResumeAfterRestartAllowed,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.reconciliation.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
});

test("unknown or unverifiable mutation outcome is consumed and forced into reconciliation",async()=>{
  const {boundary,authorization}=fixture();
  const calls=[];
  const result=await fuehrePr21MerchantGateApplyEinmalAus({
    schemaVersion:1,
    authorization,
    transaction:boundary.transaction,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:boundary.transaction.transactionFingerprint,
    executionAtMs:2300,
    restartSinceAuthorization:false,
    durableIntentWriter:durableWriter(calls),
    controlPlaneAdapter:adapter(calls,boundary.transaction,{
      postStatus:"UNKNOWN",
      terminal:false,
      throwApply:true,
    }),
  });
  assert.deepEqual(calls.map(x=>x[0]),["intent","apply","postcondition"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.durableIntentPersisted,true);
  assert.equal(result.mutationAttemptObserved,true);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.reconciliation.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
});

test("execution boundary contract is control-plane only and keeps gameplay authority closed",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-one-shot-gate-apply-execution-boundary.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_ONE_SHOT_CONTROL_PLANE_EXECUTION");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.authorization.requiredStatus,"AUTHORIZED_ONE_SHOT_RECORD_ONLY");
  assert.equal(contract.authorization.maximumUses,1);
  assert.equal(contract.durableIntent.requiredBeforeMutation,true);
  assert.equal(contract.durableIntent.existingIntentRequiresReconciliation,true);
  assert.equal(contract.execution.controlPlaneAdapterOnly,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.blindResumeAfterRestartAllowed,false);
  assert.equal(contract.settlement.reusesRecordPr21_28GateSettlement,true);
  assert.equal(contract.settlement.reusesReconcilePr21_28GateApply,true);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
  assert.equal(contract.safety.pr22Activated,false);
});

test("execution source exposes no gameplay/raw-write or generic mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-one-shot-gate-apply-execution-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(source.includes("applyPr21MerchantIntegrationGate("),true);
  assert.equal(source.includes("recordPr21_28GateSettlement("),true);
  assert.equal(source.includes("reconcilePr21_28GateApply("),true);
});
