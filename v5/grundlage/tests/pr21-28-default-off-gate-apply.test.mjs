import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21_28GateApplyTransaktionVor,
  validierePr21_28GateApplyTransaktion,
  reconcilePr21_28GateApply,
} from "../../erzeugt/index.js";

function proposal(overrides={}) {
  return {
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_GATE_APPLY",
    stage:"PR21",
    blocker:[],
    sourceMainCommit:"0e5a1e0bb3f31d30924a924eddaaa4270124b119",
    packageFingerprint:"0123456789abcdef",
    ratificationFingerprint:"fedcba9876543210",
    featureGateProductiveEligible:true,
    cap022FullChainRequired:false,
    cap022FullChainSatisfied:true,
    requiresFreshMainCheckAtApply:true,
    separateApplyRequired:true,
    gateMutationPerformed:false,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,
    ...overrides,
  };
}

test("gate apply transaction is deterministic, bound and default-off",()=>{
  const tx=bereitePr21_28GateApplyTransaktionVor(proposal(),"tx-pr21-1",1000);
  assert.equal(tx.status,"PREPARED_DEFAULT_OFF");
  assert.equal(tx.stage,"PR21");
  assert.equal(
    tx.operationKey,
    "pr21-28-gate-apply:PR21:0123456789abcdef:fedcba9876543210",
  );
  assert.equal(tx.freshMainCheckRequiredAtApply,true);
  assert.equal(tx.durableIntentRequiredBeforeApply,true);
  assert.equal(tx.oneShotApplyRequired,true);
  assert.equal(tx.sameIntentRetryAllowed,false);
  assert.equal(tx.cap022FullChainRequired,false);
  assert.equal(tx.cap022FullChainSatisfied,true);
  assert.equal(tx.postconditionVerificationRequired,true);
  assert.equal(tx.unknownOutcomeRequiresReconciliation,true);
  assert.equal(tx.applyAdapterInstalled,false);
  assert.equal(tx.executionEnabled,false);
  assert.equal(tx.gateMutationPerformed,false);
  assert.equal(tx.authorityIssued,false);
  assert.equal(tx.broadRuntimeGrant,false);
  assert.equal(tx.gesamtfreigabeRequiredSeparately,true);
  assert.match(tx.transactionFingerprint,/^[0-9a-f]{16}$/);
});

test("gate apply validation requires fresh main and exact evidence bindings",()=>{
  const tx=bereitePr21_28GateApplyTransaktionVor(proposal(),"tx-pr21-1",1000);
  const ready=validierePr21_28GateApplyTransaktion(
    tx,
    tx.sourceMainCommit,
    "PR21",
    tx.packageFingerprint,
    tx.ratificationFingerprint,
  );
  assert.equal(ready.status,"READY_DEFAULT_OFF");
  assert.deepEqual(ready.blocker,[]);
  assert.equal(ready.cap022FullChainRequired,false);
  assert.equal(ready.cap022FullChainSatisfied,true);
  assert.equal(ready.applyAdapterInstalled,false);
  assert.equal(ready.executionEnabled,false);
  assert.equal(ready.gateMutationPerformed,false);
  assert.equal(ready.authorityIssued,false);

  const stale=validierePr21_28GateApplyTransaktion(
    tx,
    "1111111111111111111111111111111111111111",
    "PR22",
    "aaaaaaaaaaaaaaaa",
    "bbbbbbbbbbbbbbbb",
  );
  assert.equal(stale.status,"BLOCKIERT");
  assert.ok(stale.blocker.includes("PR21_28_GATE_APPLY_STAGE_DRIFT"));
  assert.ok(stale.blocker.includes("PR21_28_GATE_APPLY_MAIN_STALE"));
  assert.ok(stale.blocker.includes("PR21_28_GATE_APPLY_PACKAGE_FP_DRIFT"));
  assert.ok(stale.blocker.includes("PR21_28_GATE_APPLY_RATIFICATION_FP_DRIFT"));
});



test("PR22/PR23 gate apply requires CAP-022 binding from proposal through validation",()=>{
  const tx=bereitePr21_28GateApplyTransaktionVor(
    proposal({
      stage:"PR23",
      cap022FullChainRequired:true,
      cap022FullChainSatisfied:true,
    }),
    "tx-pr23-1",
    1000,
  );
  assert.equal(tx.cap022FullChainRequired,true);
  assert.equal(tx.cap022FullChainSatisfied,true);

  const ready=validierePr21_28GateApplyTransaktion(
    tx,
    tx.sourceMainCommit,
    "PR23",
    tx.packageFingerprint,
    tx.ratificationFingerprint,
  );
  assert.equal(ready.status,"READY_DEFAULT_OFF");
  assert.equal(ready.cap022FullChainRequired,true);
  assert.equal(ready.cap022FullChainSatisfied,true);

  assert.throws(
    ()=>bereitePr21_28GateApplyTransaktionVor(
      proposal({
        stage:"PR23",
        cap022FullChainRequired:true,
        cap022FullChainSatisfied:false,
      }),
      "tx-pr23-unsafe",
      1000,
    ),
    /PR21_28_GATE_APPLY_PROPOSAL_NICHT_BEREIT/,
  );

  assert.throws(
    ()=>reconcilePr21_28GateApply({
      schemaVersion:1,
      transaction:{...tx,cap022FullChainSatisfied:false},
      observedState:"NOT_APPLIED",
      mutationAttemptObserved:false,
      durableIntentObserved:false,
      terminalSettlementObserved:false,
    }),
    /PR21_28_GATE_APPLY_RECONCILIATION_INPUT_UNGUELTIG/,
  );
});

test("gate apply transaction rejects non-ready or authority-bearing proposals",()=>{
  assert.throws(
    ()=>bereitePr21_28GateApplyTransaktionVor(
      proposal({status:"BLOCKIERT"}),
      "tx-blocked",
      1000,
    ),
    /PR21_28_GATE_APPLY_PROPOSAL_NICHT_BEREIT/,
  );
  assert.throws(
    ()=>bereitePr21_28GateApplyTransaktionVor(
      proposal({authorityIssued:true}),
      "tx-unsafe",
      1000,
    ),
    /PR21_28_GATE_APPLY_PROPOSAL_NICHT_BEREIT/,
  );
});

test("default-off reconciliation records no-apply without enabling retry",()=>{
  const tx=bereitePr21_28GateApplyTransaktionVor(proposal(),"tx-pr21-1",1000);
  const result=reconcilePr21_28GateApply({
    schemaVersion:1,
    transaction:tx,
    observedState:"NOT_APPLIED",
    mutationAttemptObserved:false,
    durableIntentObserved:false,
    terminalSettlementObserved:false,
  });
  assert.equal(result.status,"DEFAULT_OFF_NO_APPLY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.newApplyAttemptAllowed,false);
  assert.equal(result.applyAdapterInstalled,false);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.gateMutationPerformedByReconciler,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.broadRuntimeGrant,false);
});

test("already-applied observation can only become a record when durable intent and settlement exist",()=>{
  const tx=bereitePr21_28GateApplyTransaktionVor(proposal(),"tx-pr21-1",1000);
  const verified=reconcilePr21_28GateApply({
    schemaVersion:1,
    transaction:tx,
    observedState:"POSTCONDITION_TRUE",
    mutationAttemptObserved:true,
    durableIntentObserved:true,
    terminalSettlementObserved:true,
  });
  assert.equal(verified.status,"ALREADY_APPLIED_REQUIRES_RECORD_ONLY");
  assert.equal(verified.newApplyAttemptAllowed,false);

  const missingLedger=reconcilePr21_28GateApply({
    schemaVersion:1,
    transaction:tx,
    observedState:"POSTCONDITION_TRUE",
    mutationAttemptObserved:true,
    durableIntentObserved:false,
    terminalSettlementObserved:false,
  });
  assert.equal(missingLedger.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.ok(missingLedger.blocker.includes("PR21_28_GATE_APPLY_POSTCONDITION_OHNE_DURABLE_INTENT"));
  assert.ok(missingLedger.blocker.includes("PR21_28_GATE_APPLY_TERMINAL_SETTLEMENT_FEHLT"));
  assert.equal(missingLedger.sameIntentRetryAllowed,false);
  assert.equal(missingLedger.newApplyAttemptAllowed,false);
});

test("unknown or false postcondition after mutation attempt fails closed without retry",()=>{
  const tx=bereitePr21_28GateApplyTransaktionVor(proposal(),"tx-pr21-1",1000);
  for(const observedState of ["UNKNOWN","POSTCONDITION_FALSE"]){
    const result=reconcilePr21_28GateApply({
      schemaVersion:1,
      transaction:tx,
      observedState,
      mutationAttemptObserved:true,
      durableIntentObserved:true,
      terminalSettlementObserved:false,
    });
    assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
    assert.ok(result.blocker.includes("PR21_28_GATE_APPLY_UNKNOWN_ODER_UNVERIFIZIERT"));
    assert.equal(result.sameIntentRetryAllowed,false);
    assert.equal(result.newApplyAttemptAllowed,false);
  }
});

test("default-off gate apply sources contain no mutation or overall-grant bypass",()=>{
  const paths=[
    "grundlage/quelle/runtime/pr21-28-gate-apply-transaction.ts",
    "grundlage/quelle/runtime/pr21-28-gate-apply-reconciliation.ts",
  ];
  const forbidden=[
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
  ];
  for(const path of paths){
    const source=fs.readFileSync(path,"utf8");
    for(const marker of forbidden){
      assert.equal(source.includes(marker),false,path+" -> "+marker);
    }
  }
});
