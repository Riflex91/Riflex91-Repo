import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  recordPr21_28GateSettlement,
  planePr21_28GateRollback,
} from "../../erzeugt/index.js";

function transaction(overrides={}) {
  return {
    schemaVersion:1,
    transactionId:"tx-pr21-1",
    stage:"PR21",
    operationKey:"pr21-28-gate-apply:PR21:0123456789abcdef:fedcba9876543210",
    sourceMainCommit:"7497da76cd62a53c1aca77535ec98193dab943de",
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
    ...overrides,
  };
}

test("no-mutation settlement records an abort only and performs no action",()=>{
  const result=recordPr21_28GateSettlement(transaction(),2000,{
    mutationAttemptObserved:false,
    postconditionVerified:false,
    durableIntentObserved:false,
    terminalSettlementObserved:false,
  });
  assert.equal(result.status,"ABORTED_NO_MUTATION");
  assert.equal(result.cap022FullChainRequired,false);
  assert.equal(result.cap022FullChainSatisfied,true);
  assert.equal(result.gateMutationPerformedBySettlement,false);
  assert.equal(result.authorityIssuedBySettlement,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.match(result.settlementFingerprint,/^[0-9a-f]{16}$/);
});

test("verified applied settlement requires durable intent, postcondition and terminal settlement",()=>{
  const result=recordPr21_28GateSettlement(transaction(),2000,{
    mutationAttemptObserved:true,
    postconditionVerified:true,
    durableIntentObserved:true,
    terminalSettlementObserved:true,
  });
  assert.equal(result.status,"APPLIED_VERIFIED_RECORD_ONLY");
  assert.equal(result.durableIntentObserved,true);
  assert.equal(result.postconditionVerified,true);
  assert.equal(result.terminalSettlementObserved,true);
  assert.equal(result.cap022FullChainRequired,false);
  assert.equal(result.cap022FullChainSatisfied,true);
  assert.equal(result.gateMutationPerformedBySettlement,false);
  assert.equal(result.authorityIssuedBySettlement,false);
});

test("unverified mutation cannot be settled as applied",()=>{
  for(const observed of [
    {mutationAttemptObserved:true,postconditionVerified:false,durableIntentObserved:true,terminalSettlementObserved:true},
    {mutationAttemptObserved:true,postconditionVerified:true,durableIntentObserved:false,terminalSettlementObserved:true},
    {mutationAttemptObserved:true,postconditionVerified:true,durableIntentObserved:true,terminalSettlementObserved:false},
  ]){
    assert.throws(
      ()=>recordPr21_28GateSettlement(transaction(),2000,observed),
      /PR21_28_GATE_SETTLEMENT_UNVERIFIED_MUTATION/,
    );
  }
});

test("rollback plan exists only for verified applied settlement and remains default-off",()=>{
  const settlement=recordPr21_28GateSettlement(transaction(),2000,{
    mutationAttemptObserved:true,
    postconditionVerified:true,
    durableIntentObserved:true,
    terminalSettlementObserved:true,
  });
  const rollback=planePr21_28GateRollback(settlement,"post-apply regression detected");
  assert.equal(rollback.status,"PREPARED_DEFAULT_OFF");
  assert.equal(rollback.stage,"PR21");
  assert.equal(rollback.cap022FullChainRequired,false);
  assert.equal(rollback.cap022FullChainSatisfied,true);
  assert.equal(rollback.freshMainCheckRequired,true);
  assert.equal(rollback.currentPostconditionVerificationRequired,true);
  assert.equal(rollback.durableRollbackIntentRequired,true);
  assert.equal(rollback.oneShotRollbackRequired,true);
  assert.equal(rollback.sameIntentRetryAllowed,false);
  assert.equal(rollback.rollbackAdapterInstalled,false);
  assert.equal(rollback.rollbackExecutionEnabled,false);
  assert.equal(rollback.rollbackMutationPerformed,false);
  assert.equal(rollback.authorityIssued,false);
  assert.equal(rollback.broadRuntimeGrant,false);
});



test("PR23 settlement and rollback preserve CAP-022 Full-Chain binding",()=>{
  const tx=transaction({
    transactionId:"tx-pr23-1",
    stage:"PR23",
    operationKey:"pr21-28-gate-apply:PR23:0123456789abcdef:fedcba9876543210",
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
  });
  const settlement=recordPr21_28GateSettlement(tx,2000,{
    mutationAttemptObserved:true,
    postconditionVerified:true,
    durableIntentObserved:true,
    terminalSettlementObserved:true,
  });
  assert.equal(settlement.stage,"PR23");
  assert.equal(settlement.cap022FullChainRequired,true);
  assert.equal(settlement.cap022FullChainSatisfied,true);

  const rollback=planePr21_28GateRollback(
    settlement,
    "verified regression after PR23 apply",
  );
  assert.equal(rollback.stage,"PR23");
  assert.equal(rollback.cap022FullChainRequired,true);
  assert.equal(rollback.cap022FullChainSatisfied,true);
  assert.equal(rollback.rollbackAdapterInstalled,false);
  assert.equal(rollback.rollbackExecutionEnabled,false);
});

test("settlement and rollback reject missing or stage-inconsistent CAP-022 binding",()=>{
  assert.throws(
    ()=>recordPr21_28GateSettlement(
      transaction({
        stage:"PR23",
        cap022FullChainRequired:true,
        cap022FullChainSatisfied:false,
      }),
      2000,
      {
        mutationAttemptObserved:false,
        postconditionVerified:false,
        durableIntentObserved:false,
        terminalSettlementObserved:false,
      },
    ),
    /PR21_28_GATE_SETTLEMENT_INPUT_UNGUELTIG/,
  );

  const valid=recordPr21_28GateSettlement(
    transaction({
      stage:"PR23",
      cap022FullChainRequired:true,
      cap022FullChainSatisfied:true,
    }),
    2000,
    {
      mutationAttemptObserved:true,
      postconditionVerified:true,
      durableIntentObserved:true,
      terminalSettlementObserved:true,
    },
  );
  assert.throws(
    ()=>planePr21_28GateRollback(
      {...valid,cap022FullChainSatisfied:false},
      "tampered cap022 binding",
    ),
    /PR21_28_ROLLBACK_SETTLEMENT_NICHT_BEREIT/,
  );
});

test("aborted no-mutation settlement cannot create rollback plan",()=>{
  const settlement=recordPr21_28GateSettlement(transaction(),2000,{
    mutationAttemptObserved:false,
    postconditionVerified:false,
    durableIntentObserved:false,
    terminalSettlementObserved:false,
  });
  assert.throws(
    ()=>planePr21_28GateRollback(settlement,"nothing to rollback"),
    /PR21_28_ROLLBACK_SETTLEMENT_NICHT_BEREIT/,
  );
});

test("settlement and rollback source contains no apply, rollback or gameplay bypass",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/runtime/pr21-28-gate-settlement-rollback.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",
    ".socket.emit(",
    "send_cm(",
    "smart_move(",
    "attack(",
    "use_skill(",
    "loot(",
    "respawn(",
    "change_server(",
    "craft(",
    "exchange(",
    "upgrade(",
    "compound(",
    "V5 GESAMTFREIGABE ERTEILEN",
  ]){
    assert.equal(source.includes(marker),false,marker);
  }
});


test("Settlement-/Rollback-Vertrag und Roadmap erhalten CAP-022 terminal",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-28-gate-settlement-rollback.json",
    "utf8",
  ));
  const boundary=contract.cap022FullChainBoundary;
  assert.deepEqual(boundary.requiredStages,["PR22","PR23"]);
  assert.deepEqual(boundary.settlementFields,[
    "cap022FullChainRequired",
    "cap022FullChainSatisfied",
  ]);
  assert.equal(boundary.settlementFingerprintIncludesBinding,true);
  assert.equal(boundary.settlementRequiresStageConsistentBinding,true);
  assert.equal(boundary.rollbackPlanCarriesBinding,true);
  assert.equal(boundary.rollbackRequiresSatisfiedBinding,true);
  assert.equal(boundary.settlementPerformsGateMutation,false);
  assert.equal(boundary.settlementIssuesAuthority,false);
  assert.equal(boundary.rollbackAdapterInstalled,false);
  assert.equal(boundary.rollbackExecutionEnabled,false);
  assert.equal(boundary.currentPr20_9RatificationCredit,false);
  assert.equal(boundary.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(boundary.durableIntentCreatedBySettlement,false);
  assert.equal(boundary.productiveCraftAuthorityOpened,false);

  const roadmap=JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  const binding=
    roadmap.pr23.materialAcquisitionFoundation
      .fullChainOrchestrationReadiness.gateSettlementRollbackBinding;
  assert.deepEqual(binding.requiredStages,["PR22","PR23"]);
  assert.equal(binding.settlementFingerprintIncludesCap022,true);
  assert.equal(binding.settlementRequiresStageConsistentBinding,true);
  assert.equal(binding.rollbackPlanCarriesBinding,true);
  assert.equal(binding.rollbackRequiresSatisfiedBinding,true);
  assert.equal(binding.settlementPerformsGateMutation,false);
  assert.equal(binding.settlementIssuesAuthority,false);
  assert.equal(binding.rollbackAdapterInstalled,false);
  assert.equal(binding.rollbackExecutionEnabled,false);
  assert.equal(binding.currentPr20_9RatificationCredit,false);
  assert.equal(binding.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(binding.durableIntentCreatedBySettlement,false);
  assert.equal(binding.productiveCraftAuthorityOpened,false);
  assert.equal(binding.normalRuntimeAllowed,false);
});
