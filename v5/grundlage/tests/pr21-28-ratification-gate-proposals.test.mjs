import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  pr21_28RatificationConfirmationText,
  bereitePr21_28RatificationVor,
  ratifizierePr21_28ResultPackage,
  bereitePr21_28GateAdvanceVor,
} from "../../erzeugt/index.js";

function readyPackage(overrides={}) {
  return {
    schemaVersion:1,
    packageId:"pkg-pr21-ready",
    sourceMainCommit:"00ac4d8af6fe59e6adf1f09a7b2c04bc6990364d",
    createdAtMs:1000,
    checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    status:"READY_FOR_MANUAL_RATIFICATION",
    blocker:[],
    runnerStatus:"EVIDENCE_READY_TARGET_REACHED",
    observabilityStatus:"BEOBACHTUNG_BEREIT",
    evidenceIds:["ev-1"],
    evidenceStatuses:["ev-1:EVIDENCE_RATIFIZIERBAR"],
    sampleAnzahl:181,
    sampleGaps:0,
    alleMinimaErreicht:true,
    alleZieleErreicht:true,
    cap022FullChainRequired:false,
    cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,
    authorityLeakCount:0,
    recorderDrops:0,
    dashboardFehlerDiagnosticOnly:0,
    manualRatificationRequired:true,
    ratifiedByPackageBuilder:false,
    authorityIssuedByPackageBuilder:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    packageFingerprint:"0123456789abcdef",
    ...overrides,
  };
}

function eligibleGate(overrides={}) {
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

test("ratification draft requires an exact package-bound confirmation and grants nothing",()=>{
  const pkg=readyPackage();
  const draft=bereitePr21_28RatificationVor(pkg);
  const expected=pr21_28RatificationConfirmationText(
    pkg.checkpointId,
    pkg.packageFingerprint,
  );

  assert.equal(draft.status,"AWAITING_EXPLICIT_RATIFICATION");
  assert.equal(draft.requiredConfirmationText,expected);
  assert.ok(expected.includes(pkg.checkpointId));
  assert.ok(expected.includes(pkg.packageFingerprint));
  assert.notEqual(expected,"V5 GESAMTFREIGABE ERTEILEN");
  assert.equal(draft.automaticRatification,false);
  assert.equal(draft.gateAdvanced,false);
  assert.equal(draft.authorityIssued,false);
  assert.equal(draft.broadRuntimeGrant,false);
  assert.equal(draft.gesamtfreigabeRequiredSeparately,true);
  assert.equal(draft.cap022FullChainRequired,false);
  assert.equal(draft.cap022FullChainSatisfied,true);
  assert.equal(draft.cap022FullChainBoundToPackage,true);
});



test("group checkpoint ratification requires CAP-022 binding in result package",()=>{
  const group=readyPackage({
    packageId:"pkg-group-ready",
    checkpointId:"POST_PR24_25_GROUP_CHECKPOINT",
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,
  });
  const draft=bereitePr21_28RatificationVor(group);
  assert.equal(draft.cap022FullChainRequired,true);
  assert.equal(draft.cap022FullChainSatisfied,true);
  assert.equal(draft.cap022FullChainBoundToPackage,true);

  assert.throws(
    ()=>bereitePr21_28RatificationVor({
      ...group,
      cap022FullChainSatisfied:false,
    }),
    /PR21_28_RATIFICATION_CAP022_BINDING_UNGUELTIG/,
  );
  assert.throws(
    ()=>bereitePr21_28RatificationVor({
      ...group,
      cap022FullChainBoundToPackage:false,
    }),
    /PR21_28_RATIFICATION_CAP022_BINDING_UNGUELTIG/,
  );
});

test("PR22/PR23 gate advance cannot bypass CAP-022 via forged eligible gate view",()=>{
  const group=readyPackage({
    packageId:"pkg-group-pr23",
    checkpointId:"POST_PR24_25_GROUP_CHECKPOINT",
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
    cap022FullChainBoundToPackage:true,
  });
  const draft=bereitePr21_28RatificationVor(group);
  const record=ratifizierePr21_28ResultPackage(
    draft,
    draft.requiredConfirmationText,
    "operator-1",
    2000,
  );
  const proposal=bereitePr21_28GateAdvanceVor({
    schemaVersion:1,
    stage:"PR23",
    currentMainCommit:record.sourceMainCommit,
    expectedPackageFingerprint:record.packageFingerprint,
    ratification:record,
    featureGate:eligibleGate({
      stage:"PR23",
      cap022FullChainRequired:true,
      cap022FullChainSatisfied:false,
    }),
  });

  assert.equal(proposal.status,"BLOCKIERT");
  assert.equal(proposal.cap022FullChainRequired,true);
  assert.equal(proposal.cap022FullChainSatisfied,false);
  assert.ok(proposal.blocker.includes(
    "PR21_28_GATE_ADVANCE_CAP022_FULL_CHAIN_NICHT_BEREIT",
  ));
  assert.equal(proposal.gateMutationPerformed,false);
  assert.equal(proposal.authorityIssued,false);
});

test("generic acknowledgements cannot ratify a PR21-28 checkpoint package",()=>{
  const draft=bereitePr21_28RatificationVor(readyPackage());
  for(const text of ["ok","mach weiter","weiter","V5 GESAMTFREIGABE ERTEILEN"]){
    assert.throws(
      ()=>ratifizierePr21_28ResultPackage(draft,text,"operator",2000),
      /PR21_28_RATIFICATION_BESTAETIGUNG_UNGUELTIG/,
      text,
    );
  }
});

test("exact confirmation creates a ratification record only, not a gate or authority change",()=>{
  const draft=bereitePr21_28RatificationVor(readyPackage());
  const record=ratifizierePr21_28ResultPackage(
    draft,
    draft.requiredConfirmationText,
    "operator-1",
    2000,
  );

  assert.equal(record.status,"RATIFIED_RECORD_ONLY");
  assert.equal(record.ratified,true);
  assert.equal(record.gateAdvanced,false);
  assert.equal(record.authorityIssued,false);
  assert.equal(record.broadRuntimeGrant,false);
  assert.equal(record.gesamtfreigabeRequiredSeparately,true);
  assert.equal(record.resultPackageStillImmutable,true);
  assert.equal(record.cap022FullChainRequired,false);
  assert.equal(record.cap022FullChainSatisfied,true);
  assert.equal(record.cap022FullChainBoundToPackage,true);
  assert.match(record.ratificationFingerprint,/^[0-9a-f]{16}$/);
});

test("gate advance proposal becomes ready only after ratification plus fresh main and eligible feature gate",()=>{
  const draft=bereitePr21_28RatificationVor(readyPackage());
  const record=ratifizierePr21_28ResultPackage(
    draft,
    draft.requiredConfirmationText,
    "operator-1",
    2000,
  );
  const proposal=bereitePr21_28GateAdvanceVor({
    schemaVersion:1,
    stage:"PR21",
    currentMainCommit:record.sourceMainCommit,
    expectedPackageFingerprint:record.packageFingerprint,
    ratification:record,
    featureGate:eligibleGate(),
  });

  assert.equal(proposal.status,"READY_FOR_SEPARATE_GATE_APPLY");
  assert.deepEqual(proposal.blocker,[]);
  assert.equal(proposal.featureGateProductiveEligible,true);
  assert.equal(proposal.cap022FullChainRequired,false);
  assert.equal(proposal.cap022FullChainSatisfied,true);
  assert.equal(proposal.requiresFreshMainCheckAtApply,true);
  assert.equal(proposal.separateApplyRequired,true);
  assert.equal(proposal.gateMutationPerformed,false);
  assert.equal(proposal.authorityIssued,false);
  assert.equal(proposal.gameplayAuthority,false);
  assert.equal(proposal.rawWriteAuthority,false);
  assert.equal(proposal.broadRuntimeGrant,false);
  assert.equal(proposal.gesamtfreigabeRequiredSeparately,true);
});

test("gate advance proposal blocks stale main, package drift and closed feature gates",()=>{
  const draft=bereitePr21_28RatificationVor(readyPackage());
  const record=ratifizierePr21_28ResultPackage(
    draft,
    draft.requiredConfirmationText,
    "operator-1",
    2000,
  );
  const proposal=bereitePr21_28GateAdvanceVor({
    schemaVersion:1,
    stage:"PR21",
    currentMainCommit:"1111111111111111111111111111111111111111",
    expectedPackageFingerprint:"fedcba9876543210",
    ratification:record,
    featureGate:eligibleGate({
      productiveEligible:false,
      blocker:["PR21_LIVE_EVIDENCE_NICHT_RATIFIZIERT"],
    }),
  });

  assert.equal(proposal.status,"BLOCKIERT");
  assert.ok(proposal.blocker.includes("PR21_28_GATE_ADVANCE_MAIN_STALE"));
  assert.ok(proposal.blocker.includes("PR21_28_GATE_ADVANCE_PACKAGE_FP_DRIFT"));
  assert.ok(proposal.blocker.includes("PR21_28_GATE_ADVANCE_FEATURE_GATE_NICHT_ELIGIBLE"));
  assert.ok(proposal.blocker.includes("PR21_28_GATE_ADVANCE_FEATURE_GATE_BLOCKER_OFFEN"));
  assert.equal(proposal.gateMutationPerformed,false);
});

test("gate advance proposal rejects stage drift and unsafe authority-bearing gate views",()=>{
  const draft=bereitePr21_28RatificationVor(readyPackage());
  const record=ratifizierePr21_28ResultPackage(
    draft,
    draft.requiredConfirmationText,
    "operator-1",
    2000,
  );

  assert.throws(()=>bereitePr21_28GateAdvanceVor({
    schemaVersion:1,
    stage:"PR22",
    currentMainCommit:record.sourceMainCommit,
    expectedPackageFingerprint:record.packageFingerprint,
    ratification:record,
    featureGate:eligibleGate(),
  }),/PR21_28_GATE_ADVANCE_STAGE_DRIFT/);

  assert.throws(()=>bereitePr21_28GateAdvanceVor({
    schemaVersion:1,
    stage:"PR21",
    currentMainCommit:record.sourceMainCommit,
    expectedPackageFingerprint:record.packageFingerprint,
    ratification:record,
    featureGate:eligibleGate({authorityIssued:true}),
  }),/PR21_28_GATE_ADVANCE_GATE_BOUNDARY_UNSAFE/);
});

test("ratification and gate-proposal sources contain no gameplay or gate-apply bypass",()=>{
  const paths=[
    "grundlage/quelle/zertifizierung/pr21-28-ratification-record.ts",
    "grundlage/quelle/runtime/pr21-28-gate-advance-proposal.ts",
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
