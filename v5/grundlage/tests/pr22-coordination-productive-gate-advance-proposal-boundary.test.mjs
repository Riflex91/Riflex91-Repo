import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  bereitePr22CoordinationProductiveGateAdvanceProposalVor,
} from "../../erzeugt/index.js";

const MAIN="dfb8e7be61fc77107ea6397eb12ab943d0ba2bbc";
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

function ratification(patch={}) {
  const basis={
    schemaVersion:1,
    status:"RATIFIED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
    stage:"PR22",
    productiveEvidenceFingerprint:"0011223344556677",
    sourceMainCommit:MAIN,
    messageId:"msg-pr22-gate-proposal",
    workflowId:"wf-pr22-gate-proposal",
    workflowRevision:6,
    ratifierId:"operator-pr22-ratifier",
    ratifiedAtMs:11000,
    confirmationText:
      "RATIFY PR22 COORDINATION PRODUCTIVE EVIDENCE 0011223344556677 MAIN "+MAIN,
    evidenceFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    cap022FullChainRevalidated:true,
    evidenceStillImmutable:true,
    ratified:true,
    gateAdvanced:false,
    separateGateAdvanceRequired:true,
    productiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    ...patch,
  };
  return {...basis,ratificationFingerprint:evidenceFingerprint(basis)};
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

test("ratified PR22 evidence prepares separate productive gate apply proposal only",()=>{
  const rat=ratification();
  const result=bereitePr22CoordinationProductiveGateAdvanceProposalVor({
    schemaVersion:1,
    currentMainCommit:MAIN,
    expectedProductiveEvidenceFingerprint:rat.productiveEvidenceFingerprint,
    ratification:rat,
    featureGate:gate(),
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
  });

  assert.equal(result.status,"READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.ratificationFingerprintRevalidated,true);
  assert.equal(result.productiveEvidenceFingerprintMatched,true);
  assert.equal(result.repositoryStateRevalidated,true);
  assert.equal(result.featureGateRevalidated,true);
  assert.equal(result.cap022FullChainRevalidated,true);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.productiveAuthorityIssued,false);
  assert.equal(result.sendCmAuthority,false);
  assert.equal(result.pr22ProductiveAuthorityIssued,false);
  assert.equal(result.record.stage,"PR22");
  assert.equal(result.record.featureGateProductiveEligible,true);
  assert.equal(result.record.cap022FullChainRequired,true);
  assert.equal(result.record.cap022FullChainSatisfied,true);
  assert.equal(result.record.freshMainCheckRequiredAtApply,true);
  assert.equal(result.record.evidenceFingerprintRecheckRequiredAtApply,true);
  assert.equal(result.record.ratificationFingerprintRecheckRequiredAtApply,true);
  assert.equal(result.record.repositoryStateRecheckRequiredAtApply,true);
  assert.equal(result.record.cap022FullChainRecheckRequiredAtApply,true);
  assert.equal(result.record.separateApplyRequired,true);
  assert.match(result.record.proposalFingerprint,/^[0-9a-f]{16}$/);
});

test("ratification, main, evidence, repository, feature gate or CAP-022 drift blocks proposal",()=>{
  const valid=ratification();
  const cases=[
    {ratification:{...valid,ratified:false}},
    {currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {expectedProductiveEvidenceFingerprint:"abcdefabcdefabcd"},
    {currentRepositoryState:state({currentStage:"PR21"})},
    {featureGate:gate({productiveEligible:false,blocker:["PR22_BLOCKED"]})},
    {cap022FullChain:cap022({allRequiredFoundationsReady:false})},
  ];

  for(const patch of cases){
    const result=bereitePr22CoordinationProductiveGateAdvanceProposalVor({
      schemaVersion:1,
      currentMainCommit:MAIN,
      expectedProductiveEvidenceFingerprint:valid.productiveEvidenceFingerprint,
      ratification:valid,
      featureGate:gate(),
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
      ...patch,
    });
    assert.equal(result.status,"BLOCKIERT");
    assert.equal(result.record,null);
    assert.ok(result.blocker.length>0);
  }
});

test("proposal contract stays proposal-only and no-authority",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-gate-advance-proposal-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_PR22_PRODUCTIVE_GATE_ADVANCE_PROPOSAL_ONLY",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredRatificationStatus,
    "RATIFIED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
  );
  assert.equal(contract.requiredFeatureGateStage,"PR22");
  assert.equal(contract.requiredFeatureGateProductiveEligible,true);
  assert.equal(contract.requiredCap022Status,"CAP022_FULL_CHAIN_BEREIT_NO_WRITE");
  assert.equal(
    contract.success.status,
    "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
  );
  assert.equal(contract.success.separateApplyRequired,true);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.productiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.pr22ProductiveAuthorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("proposal source contains no gate, transport or gameplay mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-gate-advance-proposal-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","applyGate(","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
