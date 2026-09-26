import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantGateProposalVor,
} from "../../erzeugt/index.js";

const MAIN="c5cf7c651b7b3e744ac7647afa4441ede429e832";
const PKG="0123456789abcdef";

function record(overrides={}) {
  return {
    schemaVersion:1,
    status:"RATIFIED_RECORD_ONLY",
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    packageId:"pkg-pr21-gate-proposal",
    packageFingerprint:PKG,
    sourceMainCommit:MAIN,
    ratifierId:"operator",
    ratifiedAtMs:1000,
    confirmationText:"RATIFY PR21-28 CHECKPOINT PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT PACKAGE "+PKG,
    cap022FullChainRequired:false,
    cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,
    ratified:true,
    gateAdvanced:false,
    authorityIssued:false,
    broadRuntimeGrant:false,
    gesamtfreigabeRequiredSeparately:true,
    resultPackageStillImmutable:true,
    ratificationFingerprint:"fedcba9876543210",
    ...overrides,
  };
}

function gate(overrides={}) {
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
    ...overrides,
  };
}

test("PR21 Merchant proposal becomes ready only as separate-apply proposal",()=>{
  const result=bereitePr21MerchantGateProposalVor({
    schemaVersion:1,
    currentMainCommit:MAIN,
    expectedPackageFingerprint:PKG,
    ratification:record(),
    featureGate:gate(),
  });
  assert.equal(result.status,"READY_FOR_SEPARATE_GATE_APPLY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.stage,"PR21");
  assert.equal(result.sourceMainCommit,MAIN);
  assert.equal(result.packageFingerprint,PKG);
  assert.equal(result.currentMainMatchedRatificationSource,true);
  assert.equal(result.packageFingerprintMatched,true);
  assert.equal(result.featureGateProductiveEligible,true);
  assert.equal(result.separateApplyRequired,true);
  assert.equal(result.requiresFreshMainCheckAtApply,true);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.normalRuntimeAllowed,false);
  assert.equal(result.proposal.gateMutationPerformed,false);
});

test("stale main and package drift remain blocked",()=>{
  const result=bereitePr21MerchantGateProposalVor({
    schemaVersion:1,
    currentMainCommit:"1111111111111111111111111111111111111111",
    expectedPackageFingerprint:"1111111111111111",
    ratification:record(),
    featureGate:gate(),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.currentMainMatchedRatificationSource,false);
  assert.equal(result.packageFingerprintMatched,false);
  assert.ok(result.blocker.includes("PR21_28_GATE_ADVANCE_MAIN_STALE"));
  assert.ok(result.blocker.includes("PR21_28_GATE_ADVANCE_PACKAGE_FP_DRIFT"));
  assert.equal(result.gateMutationPerformed,false);
});

test("closed PR21 feature gate blocks proposal without mutation",()=>{
  const result=bereitePr21MerchantGateProposalVor({
    schemaVersion:1,
    currentMainCommit:MAIN,
    expectedPackageFingerprint:PKG,
    ratification:record(),
    featureGate:gate({
      productiveEligible:false,
      blocker:["PR21_LIVE_EVIDENCE_NICHT_RATIFIZIERT"],
    }),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_28_GATE_ADVANCE_FEATURE_GATE_NICHT_ELIGIBLE"));
  assert.ok(result.blocker.includes("PR21_28_GATE_ADVANCE_FEATURE_GATE_BLOCKER_OFFEN"));
  assert.equal(result.authorityIssued,false);
});

test("non-PR21 or authority-bearing gate views are rejected",()=>{
  assert.throws(()=>bereitePr21MerchantGateProposalVor({
    schemaVersion:1,currentMainCommit:MAIN,expectedPackageFingerprint:PKG,
    ratification:record(),featureGate:gate({stage:"PR22"}),
  }),/PR21_MERCHANT_GATE_PROPOSAL_STAGE_DRIFT/);

  assert.throws(()=>bereitePr21MerchantGateProposalVor({
    schemaVersion:1,currentMainCommit:MAIN,expectedPackageFingerprint:PKG,
    ratification:record(),featureGate:gate({authorityIssued:true}),
  }),/PR21_MERCHANT_GATE_PROPOSAL_FEATURE_GATE_BOUNDARY_DRIFT/);
});

test("wrong checkpoint ratification record cannot enter PR21 proposal boundary",()=>{
  assert.throws(()=>bereitePr21MerchantGateProposalVor({
    schemaVersion:1,currentMainCommit:MAIN,expectedPackageFingerprint:PKG,
    ratification:record({checkpointId:"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN"}),
    featureGate:gate(),
  }),/PR21_MERCHANT_GATE_PROPOSAL_RECORD_NICHT_BEREIT/);
});

test("proposal boundary contract remains proposal-only and default-off",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-gate-proposal-boundary.json","utf8",
  ));
  assert.equal(contract.status,"PREPARED_PROPOSAL_ONLY_DEFAULT_OFF");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.stage,"PR21");
  assert.equal(contract.requirements.freshMainRequired,true);
  assert.equal(contract.requirements.packageFingerprintMatchRequired,true);
  assert.equal(contract.output.proposalStatus,"READY_FOR_SEPARATE_GATE_APPLY");
  assert.equal(contract.output.separateApplyRequired,true);
  assert.equal(contract.safety.proposalOnly,true);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.authorityIssued,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
  assert.equal(contract.safety.proposalDoesNotApplyGate,true);
});

test("PR21 proposal boundary source contains no gameplay mutation or gate apply call",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-gate-proposal-boundary.ts","utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","bereitePr21_28GateApply","applyPr21",
  ]) assert.equal(source.includes(marker),false,marker);
});
