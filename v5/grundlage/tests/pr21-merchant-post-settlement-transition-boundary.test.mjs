import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bauePr21_28StageLedger,
  recordPr21_28GateSettlement,
  bereitePr21MerchantPostSettlementTransitionVor,
} from "../../erzeugt/index.js";

const MAIN="18a350c475b7b5b8e5d9c384201fc47827e9f520";

function transaction() {
  return {
    schemaVersion:1,
    transactionId:"tx-pr21-post-settlement",
    stage:"PR21",
    operationKey:"pr21-28-gate-apply:PR21:0123456789abcdef:fedcba9876543210",
    sourceMainCommit:MAIN,
    packageFingerprint:"0123456789abcdef",
    ratificationFingerprint:"fedcba9876543210",
    cap022FullChainRequired:false,
    cap022FullChainSatisfied:true,
    preparedAtMs:1000,
    status:"PREPARED_DEFAULT_OFF",
    freshMainCheckRequiredAtApply:true,
    durableIntentRequiredBeforeApply:true,
    oneShotApplyRequired:true,
    sameIntentRetryAllowed:false,
    postconditionVerificationRequired:true,
    unknownOutcomeRequiresReconciliation:true,
    applyAdapterInstalled:false,
    executionEnabled:false,
    gateMutationPerformed:false,
    authorityIssued:false,
    broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,
    transactionFingerprint:"0011223344556677",
  };
}

function execution() {
  const settlement=recordPr21_28GateSettlement(transaction(),2400,{
    mutationAttemptObserved:true,
    postconditionVerified:true,
    durableIntentObserved:true,
    terminalSettlementObserved:true,
  });
  return {
    schemaVersion:1,
    status:"APPLIED_VERIFIED_RECORD_ONLY",
    blocker:[],
    stage:"PR21",
    authorizationId:"auth-pr21-transition",
    transactionId:"tx-pr21-post-settlement",
    transactionFingerprint:"0011223344556677",
    authorizationConsumed:true,
    durableIntentPersisted:true,
    mutationAttemptObserved:true,
    gateMutationPerformed:true,
    controlPlaneMutationOnly:true,
    settlement,
    reconciliation:{
      schemaVersion:1,
      status:"ALREADY_APPLIED_REQUIRES_RECORD_ONLY",
      blocker:[],
      sameIntentRetryAllowed:false,
      newApplyAttemptAllowed:false,
      applyAdapterInstalled:false,
      executionEnabled:false,
      gateMutationPerformedByReconciler:false,
      authorityIssued:false,
      broadRuntimeGrant:false,
    },
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
  };
}

const STAGES=["PR21","PR22","PR23","PR24","PR25","PR26","PR27","PR28"];

function states(overrides={}) {
  return STAGES.map(stage=>({
    stage,
    foundationPrepared:true,
    orchestrationPrepared:true,
    featureGatePrepared:true,
    cap022FullChainReady:true,
    cap022TerminalSettlementBinding:null,
    milestoneRunnerPrepared:true,
    checkpointRunbookPrepared:true,
    ratificationRecordPrepared:true,
    gateApplyTransactionPrepared:true,
    gateSettlementPrepared:true,
    liveEvidenceRatified:stage==="PR21",
    explicitRatificationRecorded:stage==="PR21",
    gateApplyVerified:stage==="PR21",
    ...(overrides[stage]||{}),
  }));
}

test("verified PR21 settlement plus productive PR21 ledger yields transition proposal only",()=>{
  const ledger=bauePr21_28StageLedger(states());
  const result=bereitePr21MerchantPostSettlementTransitionVor({
    schemaVersion:1,
    execution:execution(),
    ledger,
    currentMainCommit:MAIN,
    preparedAtMs:2500,
  });
  assert.equal(result.status,"READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.stage,"PR21");
  assert.equal(result.nextStage,"PR22");
  assert.equal(result.record.status,"READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY");
  assert.equal(result.record.pr21ProductiveEligible,true);
  assert.equal(result.record.pr22ProductiveEligibleAtTransition,false);
  assert.equal(result.record.freshMainCheckRequiredAtApply,true);
  assert.equal(result.record.separateStageCompletionApplyRequired,true);
  assert.match(result.record.transitionFingerprint,/^[0-9a-f]{16}$/);
  assert.equal(result.pr21StageCompletionApplied,false);
  assert.equal(result.pr22DevelopmentStageActivated,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.roadmapMutationPerformed,false);
  assert.equal(result.ledgerMutationPerformed,false);
  assert.equal(result.stageMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("stale main or unverified settlement blocks transition",()=>{
  const ledger=bauePr21_28StageLedger(states());
  const stale=bereitePr21MerchantPostSettlementTransitionVor({
    schemaVersion:1,
    execution:execution(),
    ledger,
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    preparedAtMs:2500,
  });
  assert.equal(stale.status,"BLOCKIERT");
  assert.ok(stale.blocker.includes("PR21_MERCHANT_POST_SETTLEMENT_MAIN_STALE"));
  assert.equal(stale.record,null);

  const badExecution={
    ...execution(),
    status:"BLOCKIERT_RECONCILIATION_REQUIRED",
    gateMutationPerformed:false,
    settlement:null,
  };
  const bad=bereitePr21MerchantPostSettlementTransitionVor({
    schemaVersion:1,
    execution:badExecution,
    ledger,
    currentMainCommit:MAIN,
    preparedAtMs:2500,
  });
  assert.equal(bad.status,"BLOCKIERT");
  assert.equal(bad.record,null);
  assert.ok(bad.blocker.includes(
    "PR21_MERCHANT_POST_SETTLEMENT_EXECUTION_NICHT_VERIFIZIERT",
  ));
});

test("PR21 ledger must contain ratification, live evidence and verified gate apply",()=>{
  for(const patch of [
    {liveEvidenceRatified:false},
    {explicitRatificationRecorded:false},
    {gateApplyVerified:false},
  ]){
    const ledger=bauePr21_28StageLedger(states({PR21:patch}));
    const result=bereitePr21MerchantPostSettlementTransitionVor({
      schemaVersion:1,
      execution:execution(),
      ledger,
      currentMainCommit:MAIN,
      preparedAtMs:2500,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.ok(result.blocker.includes(
      "PR21_MERCHANT_POST_SETTLEMENT_PR21_LEDGER_NICHT_PRODUCTIV",
    ));
  }
});

test("transition refuses to run after PR22 is already productively eligible",()=>{
  const ledger=bauePr21_28StageLedger(states({
    PR22:{
      liveEvidenceRatified:true,
      explicitRatificationRecorded:true,
      gateApplyVerified:true,
      cap022TerminalSettlementBinding:{
        stage:"PR22",
        settlementFingerprint:"1111111111111111",
        status:"APPLIED_VERIFIED_RECORD_ONLY",
        cap022FullChainRequired:true,
        cap022FullChainSatisfied:true,
      },
    },
  }));
  const result=bereitePr21MerchantPostSettlementTransitionVor({
    schemaVersion:1,
    execution:execution(),
    ledger,
    currentMainCommit:MAIN,
    preparedAtMs:2500,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.ok(result.blocker.includes(
    "PR21_MERCHANT_POST_SETTLEMENT_STAGE_FORTSCHRITT_DRIFT",
  ));
});

test("transition contract is proposal-only and leaves PR22 authority closed",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-post-settlement-transition-boundary.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_POST_SETTLEMENT_TRANSITION_PROPOSAL_ONLY");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.nextStage,"PR22");
  assert.equal(contract.requiredSettlementStatus,"APPLIED_VERIFIED_RECORD_ONLY");
  assert.equal(contract.requiredTransitionStatus,"READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY");
  assert.equal(contract.ledger.pr21ProductiveEligibleRequired,true);
  assert.equal(contract.ledger.highestProductiveEligibleStageRequired,"PR21");
  assert.equal(contract.apply.separateStageCompletionApplyRequired,true);
  assert.equal(contract.apply.pr21StageCompletionApplied,false);
  assert.equal(contract.apply.pr22DevelopmentStageActivated,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("transition source contains no runtime or generic mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-post-settlement-transition-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","applyPr21MerchantIntegrationGate(",
    "execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(source.includes("bauePr21_28StageLedger("),true);
  assert.equal(source.includes("replayPr21_28AdvanceChain("),true);
});
