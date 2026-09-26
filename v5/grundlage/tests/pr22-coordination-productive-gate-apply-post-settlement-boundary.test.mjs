import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveGateApplyPostSettlementVor,
} from "../../erzeugt/index.js";

const MAIN="1a935d092aa933e351210bd6673018b0bcbfdaa0";
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

function settlement(patch={}) {
  const basis={
    schemaVersion:1,
    status:"APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
    stage:"PR22",
    authorizationId:"auth-pr22-post-settlement",
    transactionId:"tx-pr22-post-settlement",
    transactionFingerprint:"0011223344556677",
    proposalFingerprint:"1122334455667788",
    productiveEvidenceFingerprint:"2233445566778899",
    ratificationFingerprint:"33445566778899aa",
    sourceMainCommit:MAIN,
    durableIntentId:"intent-pr22-post-settlement",
    settledAtMs:17000,
    durableIntentObserved:true,
    mutationAttemptObserved:true,
    postconditionVerified:true,
    terminalMutationRecordObserved:true,
    gateMutationPerformedBySettlement:false,
    productiveAuthorityIssuedBySettlement:false,
    pr22ProductiveAuthorityIssuedBySettlement:false,
    sendCmAuthorityIssuedBySettlement:false,
    gameplayAuthorityIssuedBySettlement:false,
    rawWriteAuthorityIssuedBySettlement:false,
    broadRuntimeGrantIssuedBySettlement:false,
    normalRuntimeAllowedBySettlement:false,
    ...patch,
  };
  return {...basis,settlementFingerprint:evidenceFingerprint(basis)};
}

function execution(settlementRecord=settlement(),patch={}) {
  return {
    schemaVersion:1,
    status:"APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
    blocker:[],
    stage:"PR22",
    authorizationId:settlementRecord.authorizationId,
    transactionId:settlementRecord.transactionId,
    transactionFingerprint:settlementRecord.transactionFingerprint,
    authorizationConsumed:true,
    durableIntentPersisted:true,
    mutationAttemptObserved:true,
    gateMutationPerformed:true,
    controlPlaneMutationPerformed:true,
    settlement:settlementRecord,
    productiveAuthorityIssued:false,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
    ...patch,
  };
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

function request(patch={}) {
  return {
    schemaVersion:1,
    execution:execution(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    featureGate:gate(),
    cap022FullChain:cap022(),
    preparedAtMs:17100,
    ...patch,
  };
}

test("verified PR22 gate apply settlement yields authority-apply proposal only",()=>{
  const result=
    bereitePr22CoordinationProductiveGateApplyPostSettlementVor(request());

  assert.equal(
    result.status,
    "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
  );
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.executionRevalidated,true);
  assert.equal(result.settlementFingerprintRevalidated,true);
  assert.equal(result.repositoryStateRevalidated,true);
  assert.equal(result.featureGateRevalidated,true);
  assert.equal(result.cap022FullChainRevalidated,true);
  assert.equal(
    result.record.status,
    "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
  );
  assert.equal(result.record.gateApplyVerified,true);
  assert.equal(result.record.separateProductiveAuthorityApplyRequired,true);
  assert.match(result.record.postSettlementFingerprint,/^[0-9a-f]{16}$/);
  assert.equal(result.authorityApplyAdapterInstalled,false);
  assert.equal(result.authorityApplyExecutionEnabled,false);
  assert.equal(result.additionalGateMutationPerformed,false);
  assert.equal(result.productiveAuthorityIssued,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("stale main or unverified execution blocks post-settlement proposal",()=>{
  const stale=
    bereitePr22CoordinationProductiveGateApplyPostSettlementVor(request({
      currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }));
  assert.equal(stale.status,"BLOCKIERT");
  assert.equal(stale.record,null);
  assert.ok(stale.blocker.includes("PR22_GATE_POST_SETTLEMENT_MAIN_STALE"));

  const badExecution=execution(null,{
    status:"BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker:["unknown"],
    authorizationConsumed:true,
    gateMutationPerformed:false,
    controlPlaneMutationPerformed:false,
  });
  const bad=
    bereitePr22CoordinationProductiveGateApplyPostSettlementVor(request({
      execution:badExecution,
    }));
  assert.equal(bad.status,"BLOCKIERT");
  assert.equal(bad.record,null);
  assert.ok(bad.blocker.includes(
    "PR22_GATE_POST_SETTLEMENT_EXECUTION_NICHT_VERIFIZIERT",
  ));
});

test("tampered settlement fingerprint is rejected",()=>{
  const valid=settlement();
  const tampered={...valid,settledAtMs:valid.settledAtMs+1};
  const result=
    bereitePr22CoordinationProductiveGateApplyPostSettlementVor(request({
      execution:execution(tampered),
    }));
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.record,null);
  assert.equal(result.settlementFingerprintRevalidated,false);
  assert.ok(result.blocker.includes(
    "PR22_GATE_POST_SETTLEMENT_RECORD_UNGUELTIG",
  ));
});

test("repository, feature-gate or CAP-022 drift blocks authority proposal",()=>{
  const cases=[
    {currentRepositoryState:state({currentStage:"PR21"})},
    {featureGate:gate({productiveEligible:false,blocker:["blocked"]})},
    {cap022FullChain:cap022({status:"BLOCKIERT",blocker:["missing"]})},
  ];
  for(const patch of cases){
    const result=
      bereitePr22CoordinationProductiveGateApplyPostSettlementVor(
        request(patch),
      );
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.equal(result.productiveAuthorityIssued,false);
    assert.equal(result.pr22ProductiveAuthorityIssued,false);
  }
});

test("post-settlement contract remains proposal-only and default-off",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-gate-apply-post-settlement-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_PRODUCTIVE_GATE_APPLY_POST_SETTLEMENT_PROPOSAL_ONLY",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredExecutionStatus,
    "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
  );
  assert.equal(
    contract.successStatus,
    "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
  );
  assert.equal(contract.revalidation.settlementFingerprintRequired,true);
  assert.equal(contract.revalidation.repositoryStateRequired,true);
  assert.equal(contract.revalidation.featureGateRequired,true);
  assert.equal(contract.revalidation.cap022FullChainRequired,true);
  assert.equal(contract.authorityApply.separateApplyRequired,true);
  assert.equal(contract.authorityApply.adapterInstalled,false);
  assert.equal(contract.authorityApply.executionEnabled,false);
  assert.equal(contract.safety.productiveAuthorityIssued,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("post-settlement source contains no execution or authority backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-gate-apply-post-settlement-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","applyPr22CoordinationProductiveGate(",
    "issuePr22ProductiveAuthority(","executionEnabled:true",
  ]) assert.equal(source.includes(marker),false,marker);
});
