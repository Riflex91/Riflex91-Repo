import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveDefaultOffGateApplyVor,
  bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor,
  erteilePr22CoordinationProductiveGateApplyExecutionAuthorization,
  fuehrePr22CoordinationProductiveGateApplyEinmalAus,
} from "../../erzeugt/index.js";

const MAIN="9a80f846c0cf078bd604b6cce2ab613d7ba3cd70";
const REQUIRED_FOUNDATIONS=[
  "MATERIAL_ACQUISITION",
  "MATERIAL_HANDOFF",
  "POST_SETTLEMENT_CRAFT_RESCAN",
  "PERSISTENT_LIFECYCLE",
  "TEAM_MATERIAL_OBJECTIVE",
  "TEAM_COLLECTION_HANDOFF",
  "TEAM_BATCH_SETTLEMENT_RECOVERY",
  "TEAM_ALL_SETTLED_CRAFT_RESCAN",
  "TEAM_RESCAN_DURABLE_ADMISSION",
];

function proposalRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
    stage:"PR22",
    sourceMainCommit:MAIN,
    productiveEvidenceFingerprint:"0011223344556677",
    ratificationFingerprint:"1122334455667788",
    messageId:"msg-pr22-gate-exec",
    workflowId:"wf-pr22-gate-exec",
    workflowRevision:9,
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

function prepared() {
  const boundary=bereitePr22CoordinationProductiveDefaultOffGateApplyVor({
    schemaVersion:1,
    proposalBoundary:proposalBoundary(),
    transactionId:"tx-pr22-gate-exec",
    preparedAtMs:15000,
    currentMainCommit:MAIN,
  });
  const draft=bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
    boundary,
    "auth-pr22-gate-exec",
    15100,
    16500,
  );
  const authorization=erteilePr22CoordinationProductiveGateApplyExecutionAuthorization(
    draft,
    draft.requiredConfirmationText,
    "operator-pr22-gate-exec",
    15200,
  );
  return {boundary,authorization};
}

function state(patch={}) {
  return {
    schemaVersion:1,
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    pr22ProductiveAuthorityIssued:false,
    ...patch,
  };
}

function gate(patch={}) {
  return {
    stage:"PR22",
    productiveEligible:true,
    blocker:[],
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
    authorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
}

function cap022(patch={}) {
  return {
    schemaVersion:1,
    status:"CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
    blocker:[],
    requiredFoundationIds:[...REQUIRED_FOUNDATIONS],
    readyFoundationIds:[...REQUIRED_FOUNDATIONS],
    allRequiredFoundationsPresent:true,
    allRequiredFoundationsReady:true,
    currentPr20_9RatificationCredit:false,
    candidateAcquisitionOrMutationAllowedNow:false,
    durableIntentCreated:false,
    productiveCraftAuthorityOpened:false,
    productiveExecutionAllowed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
}

function writer(events,status="PERSISTED_NEW") {
  return {
    async persistPr22CoordinationProductiveGateApplyIntent(input) {
      events.push("intent");
      return {
        schemaVersion:1,
        status,
        durableIntentId:"intent-pr22-gate-exec",
        authorizationId:input.authorizationId,
        transactionId:input.transactionId,
        operationKey:input.operationKey,
        transactionFingerprint:input.transactionFingerprint,
        persistedAtMs:15301,
      };
    },
  };
}

function adapter(events,tx,options={}) {
  return {
    async applyPr22CoordinationProductiveGate() {
      events.push("apply");
      assert.equal(events[0],"intent");
      if(options.throwApply) throw new Error("unknown");
      return {
        schemaVersion:1,
        outcome:options.outcome??"APPLIED",
        mutationAttempted:true,
        terminalMutationRecordPersisted:options.terminal??true,
        productiveAuthorityIssued:false,
        pr22ProductiveAuthorityIssued:false,
      };
    },
    async readPr22CoordinationProductiveGatePostcondition() {
      events.push("read");
      if(options.throwRead) throw new Error("unknown");
      const applied=(options.status??"APPLIED")==="APPLIED";
      return {
        schemaVersion:1,
        status:options.status??"APPLIED",
        stage:"PR22",
        transactionFingerprint:applied?tx.transactionFingerprint:null,
        proposalFingerprint:applied?tx.proposalFingerprint:null,
        productiveEvidenceFingerprint:
          applied?tx.productiveEvidenceFingerprint:null,
        ratificationFingerprint:applied?tx.ratificationFingerprint:null,
        productiveAuthorityIssued:false,
        pr22ProductiveAuthorityIssued:false,
        observedAtMs:15400,
      };
    },
  };
}

function request(preparedFixture,events,patch={}) {
  const tx=preparedFixture.boundary.transaction;
  return {
    schemaVersion:1,
    authorization:preparedFixture.authorization,
    transaction:tx,
    currentMainCommit:MAIN,
    currentTransactionFingerprint:tx.transactionFingerprint,
    currentProposalFingerprint:tx.proposalFingerprint,
    currentProductiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
    currentRatificationFingerprint:tx.ratificationFingerprint,
    currentRepositoryState:state(),
    featureGate:gate(),
    cap022FullChain:cap022(),
    executionAtMs:15300,
    restartSinceAuthorization:false,
    durableIntentWriter:writer(events),
    controlPlaneAdapter:adapter(events,tx),
    ...patch,
  };
}

test("one-shot PR22 gate apply persists intent before typed control-plane mutation and verifies settlement",async()=>{
  const fixture=prepared();
  const events=[];
  const result=await fuehrePr22CoordinationProductiveGateApplyEinmalAus(
    request(fixture,events),
  );

  assert.deepEqual(events,["intent","apply","read"]);
  assert.equal(
    result.status,
    "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.durableIntentPersisted,true);
  assert.equal(result.mutationAttemptObserved,true);
  assert.equal(result.gateMutationPerformed,true);
  assert.equal(result.controlPlaneMutationPerformed,true);
  assert.equal(result.productiveAuthorityIssued,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(
    result.settlement.status,
    "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
  );
  assert.match(result.settlement.settlementFingerprint,/^[0-9a-f]{16}$/);
});

test("freshness, repository-state, feature-gate, CAP-022 or restart drift blocks before durable intent",async()=>{
  const cases=[
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {currentTransactionFingerprint:"aaaaaaaaaaaaaaaa"},
    {currentProposalFingerprint:"aaaaaaaaaaaaaaaa"},
    {currentProductiveEvidenceFingerprint:"aaaaaaaaaaaaaaaa"},
    {currentRatificationFingerprint:"aaaaaaaaaaaaaaaa"},
    {currentRepositoryState:state({currentStage:"PR21"})},
    {featureGate:gate({productiveEligible:false,blocker:["blocked"]})},
    {cap022FullChain:cap022({status:"BLOCKIERT",blocker:["missing"]})},
    {restartSinceAuthorization:true},
  ];
  for(const patch of cases){
    const fixture=prepared();
    const events=[];
    const result=await fuehrePr22CoordinationProductiveGateApplyEinmalAus(
      request(fixture,events,patch),
    );
    assert.equal(result.status,"BLOCKIERT_PRECHECK");
    assert.equal(result.authorizationConsumed,false);
    assert.equal(result.gateMutationPerformed,false);
    assert.deepEqual(events,[]);
  }
});

test("existing durable intent forces reconciliation and never retries gate apply",async()=>{
  const fixture=prepared();
  const events=[];
  const tx=fixture.boundary.transaction;
  const result=await fuehrePr22CoordinationProductiveGateApplyEinmalAus(
    request(fixture,events,{
      durableIntentWriter:writer(
        events,
        "ALREADY_PERSISTED_RECONCILIATION_REQUIRED",
      ),
      controlPlaneAdapter:adapter(events,tx),
    }),
  );
  assert.deepEqual(events,["intent"]);
  assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
  assert.equal(result.authorizationConsumed,true);
  assert.equal(result.mutationAttemptObserved,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.sameIntentRetryAllowed,false);
  assert.equal(result.blindResumeAfterRestartAllowed,false);
});

test("unknown or unverifiable control-plane outcome requires reconciliation",async()=>{
  const cases=[
    {throwApply:true},
    {terminal:false},
    {status:"UNKNOWN"},
    {status:"NOT_APPLIED"},
  ];
  for(const options of cases){
    const fixture=prepared();
    const events=[];
    const tx=fixture.boundary.transaction;
    const result=await fuehrePr22CoordinationProductiveGateApplyEinmalAus(
      request(fixture,events,{
        controlPlaneAdapter:adapter(events,tx,options),
      }),
    );
    assert.deepEqual(events,["intent","apply","read"]);
    assert.equal(result.status,"BLOCKIERT_RECONCILIATION_REQUIRED");
    assert.equal(result.authorizationConsumed,true);
    assert.equal(result.gateMutationPerformed,false);
    assert.equal(result.productiveAuthorityIssued,false);
    assert.equal(result.pr22ProductiveAuthorityIssued,false);
    assert.equal(result.sameIntentRetryAllowed,false);
  }
});

test("one-shot gate apply execution contract keeps productive authority separate",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-one-shot-gate-apply-execution-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_ONE_SHOT_PR22_PRODUCTIVE_GATE_APPLY_CONTROL_PLANE_EXECUTION",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredAuthorizationStatus,
    "AUTHORIZED_PR22_PRODUCTIVE_GATE_APPLY_ONE_SHOT_RECORD_ONLY",
  );
  assert.equal(contract.execution.typedControlPlaneAdapterOnly,true);
  assert.equal(
    contract.execution.controlPlaneAdapterMethod,
    "applyPr22CoordinationProductiveGate",
  );
  assert.equal(contract.execution.durableIntentRequiredBeforeGateMutation,true);
  assert.equal(contract.execution.oneShotExecutionRequired,true);
  assert.equal(contract.execution.sameIntentRetryAllowed,false);
  assert.equal(contract.execution.unknownOutcomeRequiresReconciliation,true);
  assert.equal(contract.success.gateMutationPerformed,true);
  assert.equal(contract.success.productiveAuthorityIssued,false);
  assert.equal(contract.success.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("one-shot gate apply source exposes only typed control-plane adapter",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-one-shot-gate-apply-execution-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","executeGateApply(","applyGateMutation(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(
    source.includes("applyPr22CoordinationProductiveGate("),
    true,
  );
  assert.equal(
    source.includes("readPr22CoordinationProductiveGatePostcondition("),
    true,
  );
});
