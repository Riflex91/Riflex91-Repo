import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {bauePr21_28StageLedger,bauePr21_28ReadinessSnapshot,bewerteCap022FoundationChain} from "../../erzeugt/index.js";

const STAGES=["PR21","PR22","PR23","PR24","PR25","PR26","PR27","PR28"];
function terminalBinding(stage){
  return {
    stage,
    settlementFingerprint:stage==="PR22"?"1111111111111111":"2222222222222222",
    status:"APPLIED_VERIFIED_RECORD_ONLY",
    cap022FullChainRequired:true,
    cap022FullChainSatisfied:true,
  };
}

function states(overrides={}){
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
    liveEvidenceRatified:false,
    explicitRatificationRecorded:false,
    gateApplyVerified:false,
    ...(overrides[stage]??{}),
  }));
}


function cap022Chain(overrides={}){
  const ids=[
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
  return bewerteCap022FoundationChain({
    schemaVersion:1,
    foundations:ids.map(id=>({
      schemaVersion:1,
      id,
      status:"PREPARED_NO_WRITE",
      productiveExecutionAllowed:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    })),
    currentPr20_9RatificationCredit:false,
    candidateAcquisitionOrMutationAllowedNow:false,
    durableIntentCreated:false,
    productiveCraftAuthorityOpened:false,
    ...overrides,
  });
}

function checkpoints(overrides={}){
  return [
    {checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",state:"NOT_READY"},
    {checkpointId:"POST_PR24_25_GROUP_CHECKPOINT",state:"NOT_READY"},
    {checkpointId:"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN",state:"NOT_READY"},
  ].map(x=>({...x,...(overrides[x.checkpointId]??{})}));
}

test("snapshot reports technical preparation through PR28 while live evidence is pending",()=>{
  const ledger=bauePr21_28StageLedger(states());
  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:cap022Chain(),
    checkpoints:checkpoints({
      PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT:{state:"READY_TO_RUN"},
    }),
  });
  assert.equal(snapshot.status,"TECHNICALLY_PREPARED_LIVE_EVIDENCE_PENDING");
  assert.equal(snapshot.preparationThroughPr28Complete,true);
  assert.equal(snapshot.cap022FullChainReady,true);
  assert.equal(snapshot.cap022FullChainStatus,"CAP022_FULL_CHAIN_BEREIT_NO_WRITE");
  assert.deepEqual(snapshot.cap022FullChainBlocker,[]);
  assert.equal(snapshot.cap022TerminalSettlementBindingsReady,false);
  assert.deepEqual(snapshot.cap022TerminalSettlementFingerprints,[]);
  assert.equal(snapshot.stages[1].cap022TerminalSettlementRequired,true);
  assert.equal(snapshot.stages[1].cap022TerminalSettlementSatisfied,false);
  assert.ok(snapshot.stages[1].missing.includes("CAP022_TERMINAL_SETTLEMENT"));
  assert.equal(snapshot.liveEvidenceBoundaryReached,true);
  assert.equal(snapshot.highestPreparationCompleteStage,"PR28");
  assert.equal(snapshot.highestProductiveEligibleStage,null);
  assert.equal(snapshot.nextRequiredCheckpoint,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.ok(snapshot.stages.every(x=>x.preparationComplete));
  assert.ok(snapshot.stages.every(x=>x.productiveEligible===false));
  assert.ok(snapshot.stages[0].missing.includes("LIVE_EVIDENCE"));
  assert.equal(snapshot.gateMutationPerformed,false);
  assert.equal(snapshot.authorityIssued,false);
  assert.equal(snapshot.normalRuntimeAllowed,false);
});

test("snapshot advances the next checkpoint only after prior checkpoint ratification",()=>{
  const ledger=bauePr21_28StageLedger(states({
    PR21:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true},
  }));
  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:cap022Chain(),
    checkpoints:checkpoints({
      PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT:{state:"RATIFIED"},
      POST_PR24_25_GROUP_CHECKPOINT:{state:"READY_TO_RUN"},
    }),
  });
  assert.equal(snapshot.nextRequiredCheckpoint,"POST_PR24_25_GROUP_CHECKPOINT");
  assert.equal(snapshot.highestProductiveEligibleStage,"PR21");
});

test("fully hypothetical ratified chain reports productive eligibility without changing authority",()=>{
  const all=Object.fromEntries(STAGES.map(stage=>[stage,{
    liveEvidenceRatified:true,
    explicitRatificationRecorded:true,
    gateApplyVerified:true,
    cap022TerminalSettlementBinding:
      stage==="PR22"||stage==="PR23" ? terminalBinding(stage) : null,
  }]));
  const ledger=bauePr21_28StageLedger(states(all));
  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:cap022Chain(),
    checkpoints:checkpoints({
      PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT:{state:"RATIFIED"},
      POST_PR24_25_GROUP_CHECKPOINT:{state:"RATIFIED"},
      POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN:{state:"RATIFIED"},
    }),
  });
  assert.equal(snapshot.status,"PRODUCTIVE_CHAIN_ELIGIBLE");
  assert.equal(snapshot.highestProductiveEligibleStage,"PR28");
  assert.equal(snapshot.nextRequiredCheckpoint,null);
  assert.equal(snapshot.cap022TerminalSettlementBindingsReady,true);
  assert.deepEqual(snapshot.cap022TerminalSettlementFingerprints,[
    {stage:"PR22",settlementFingerprint:"1111111111111111"},
    {stage:"PR23",settlementFingerprint:"2222222222222222"},
  ]);
  assert.equal(snapshot.gateMutationPerformed,false);
  assert.equal(snapshot.authorityIssued,false);
});

test("partial preparation remains distinct from live-evidence boundary",()=>{
  const partial=states({PR28:{gateSettlementPrepared:false}});
  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger:bauePr21_28StageLedger(partial),
    cap022FoundationChain:cap022Chain(),
    checkpoints:checkpoints(),
  });
  assert.equal(snapshot.status,"PARTIALLY_PREPARED");
  assert.equal(snapshot.preparationThroughPr28Complete,false);
  assert.equal(snapshot.liveEvidenceBoundaryReached,false);
  assert.ok(snapshot.stages.at(-1).missing.includes("PREPARATION_INCOMPLETE"));
});

test("snapshot surfaces partial terminal CAP-022 settlement binding without granting authority",()=>{
  const ledger=bauePr21_28StageLedger(states({
    PR22:{cap022TerminalSettlementBinding:terminalBinding("PR22")},
  }));
  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:cap022Chain(),
    checkpoints:checkpoints(),
  });
  assert.equal(snapshot.cap022TerminalSettlementBindingsReady,false);
  assert.deepEqual(snapshot.cap022TerminalSettlementFingerprints,[
    {stage:"PR22",settlementFingerprint:"1111111111111111"},
  ]);
  assert.equal(snapshot.stages[1].cap022TerminalSettlementSatisfied,true);
  assert.equal(snapshot.stages[2].cap022TerminalSettlementSatisfied,false);
  assert.ok(snapshot.stages[2].missing.includes("CAP022_TERMINAL_SETTLEMENT"));
  assert.equal(snapshot.authorityIssued,false);
  assert.equal(snapshot.gateMutationPerformed,false);
  assert.equal(snapshot.normalRuntimeAllowed,false);
});

test("readiness snapshot rejects incomplete checkpoint set",()=>{
  const ledger=bauePr21_28StageLedger(states());
  assert.throws(()=>bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:cap022Chain(),
    checkpoints:checkpoints().slice(0,2),
  }),/PR21_28_READINESS_SNAPSHOT_CHECKPOINTS_UNVOLLSTAENDIG/);
});

test("readiness snapshot source contains no mutation bypass",()=>{
  const source=fs.readFileSync("grundlage/quelle/runtime/pr21-28-readiness-snapshot.ts","utf8");
  for(const marker of ["socket.emit(","send_cm(","smart_move(","attack(","use_skill(","loot(","respawn(","change_server(","craft(","exchange(","upgrade(","compound(","V5 GESAMTFREIGABE ERTEILEN"]){
    assert.equal(source.includes(marker),false,marker);
  }
});


test("vollstaendiger Ledger bleibt PARTIALLY_PREPARED wenn CAP-022 Full-Chain fehlt",()=>{
  const ledger=bauePr21_28StageLedger(states());
  const basis={
    schemaVersion:1,
    foundations:[
      "MATERIAL_ACQUISITION",
      "MATERIAL_HANDOFF",
      "POST_SETTLEMENT_CRAFT_RESCAN",
      "PERSISTENT_LIFECYCLE",
      "TEAM_MATERIAL_OBJECTIVE",
      "TEAM_COLLECTION_HANDOFF",
      "TEAM_BATCH_SETTLEMENT_RECOVERY",
      "TEAM_ALL_SETTLED_CRAFT_RESCAN",
    ].map(id=>({
      schemaVersion:1,
      id,
      status:"PREPARED_NO_WRITE",
      productiveExecutionAllowed:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    })),
    currentPr20_9RatificationCredit:false,
    candidateAcquisitionOrMutationAllowedNow:false,
    durableIntentCreated:false,
    productiveCraftAuthorityOpened:false,
  };
  const blockedChain=bewerteCap022FoundationChain(basis);
  assert.equal(blockedChain.status,"BLOCKIERT");

  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:blockedChain,
    checkpoints:checkpoints({
      PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT:{state:"READY_TO_RUN"},
    }),
  });

  assert.equal(snapshot.status,"PARTIALLY_PREPARED");
  assert.equal(snapshot.preparationThroughPr28Complete,false);
  assert.equal(snapshot.liveEvidenceBoundaryReached,false);
  assert.equal(snapshot.cap022FullChainReady,false);
  assert.equal(snapshot.cap022FullChainStatus,"BLOCKIERT");
  assert.ok(snapshot.cap022FullChainBlocker.includes(
    "CAP022_CHAIN_FOUNDATION_FEHLT:TEAM_RESCAN_DURABLE_ADMISSION",
  ));
  assert.equal(snapshot.gateMutationPerformed,false);
  assert.equal(snapshot.authorityIssued,false);
  assert.equal(snapshot.normalRuntimeAllowed,false);
});

test("hypothetisch produktiver Ledger kann CAP-022 Full-Chain nicht umgehen",()=>{
  const all=Object.fromEntries(STAGES.map(stage=>[stage,{
    liveEvidenceRatified:true,
    explicitRatificationRecorded:true,
    gateApplyVerified:true,
    cap022TerminalSettlementBinding:
      stage==="PR22"||stage==="PR23" ? terminalBinding(stage) : null,
  }]));
  const ledger=bauePr21_28StageLedger(states(all));
  const ready=cap022Chain();
  const blocked={
    ...ready,
    status:"BLOCKIERT",
    blocker:["CAP022_CHAIN_FOUNDATION_BLOCKIERT:TEAM_BATCH_SETTLEMENT_RECOVERY"],
    allRequiredFoundationsReady:false,
  };
  const snapshot=bauePr21_28ReadinessSnapshot({
    schemaVersion:1,
    mainCommit:"6b7828d06b440ddc2fbce5fd0e22bb544674e8fb",
    ledger,
    cap022FoundationChain:blocked,
    checkpoints:checkpoints({
      PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT:{state:"RATIFIED"},
      POST_PR24_25_GROUP_CHECKPOINT:{state:"RATIFIED"},
      POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN:{state:"RATIFIED"},
    }),
  });
  assert.equal(snapshot.status,"PARTIALLY_PREPARED");
  assert.equal(snapshot.cap022FullChainReady,false);
  assert.equal(snapshot.preparationThroughPr28Complete,false);
  assert.equal(snapshot.liveEvidenceBoundaryReached,false);
  assert.equal(snapshot.authorityIssued,false);
});


test("Readiness-Snapshot-Vertrag und Roadmap binden CAP-022 Full-Chain fail-closed",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-28-readiness-snapshot.json",
    "utf8",
  ));
  const boundary=contract.cap022FullChainBoundary;
  assert.equal(boundary.required,true);
  assert.equal(boundary.readyStatus,"CAP022_FULL_CHAIN_BEREIT_NO_WRITE");
  assert.equal(boundary.requiredFoundationCount,9);
  assert.equal(boundary.technicallyPreparedRequiresFullChain,true);
  assert.equal(boundary.productiveChainEligibleRequiresFullChain,true);
  assert.equal(boundary.missingOrBlockedChainForcesStatus,"PARTIALLY_PREPARED");
  assert.equal(boundary.currentPr20_9RatificationCredit,false);
  assert.equal(boundary.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(boundary.durableIntentCreated,false);
  assert.equal(boundary.productiveCraftAuthorityOpened,false);
  assert.equal(boundary.productiveExecutionAllowed,false);
  assert.equal(boundary.gameplayAuthority,false);
  assert.equal(boundary.rawWriteAuthority,false);
  assert.equal(boundary.normalRuntimeAllowed,false);

  const terminal=contract.cap022TerminalSettlementBoundary;
  assert.deepEqual(terminal.requiredStages,["PR22","PR23"]);
  assert.equal(terminal.ledgerStateField,"cap022TerminalSettlementBinding");
  assert.equal(terminal.snapshotReadyField,"cap022TerminalSettlementBindingsReady");
  assert.equal(terminal.snapshotFingerprintField,"cap022TerminalSettlementFingerprints");
  assert.equal(terminal.missingMarker,"CAP022_TERMINAL_SETTLEMENT");
  assert.equal(terminal.terminalSettlementRequiresAppliedVerifiedStatus,true);
  assert.equal(terminal.terminalSettlementMustMatchStage,true);
  assert.equal(terminal.terminalSettlementFingerprintRequired,true);
  assert.equal(terminal.productiveChainEligibleRequiresBinding,true);
  assert.equal(terminal.technicallyPreparedDoesNotRequireTerminalSettlement,true);
  assert.equal(terminal.snapshotPerformsGateMutation,false);
  assert.equal(terminal.snapshotIssuesAuthority,false);
  assert.equal(terminal.currentPr20_9RatificationCredit,false);
  assert.equal(terminal.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(terminal.durableIntentCreated,false);
  assert.equal(terminal.productiveCraftAuthorityOpened,false);
  assert.equal(terminal.normalRuntimeAllowed,false);

  const roadmap=JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  assert.equal(
    roadmap.pr20_9.status,
    "MANUAL_OVERRIDE_BESTANDEN_FOR_DEVELOPMENT",
  );
  const binding=
    roadmap.pr20_9.deferredAutomaticMaterialRecheck
      .fullChainOrchestrationReadiness.readinessSnapshotBinding;
  assert.equal(binding.status,"PREPARED_REPLAY_ONLY");
  assert.equal(binding.cap022FullChainRequired,true);
  assert.equal(binding.technicallyPreparedRequiresFullChain,true);
  assert.equal(binding.productiveChainEligibleRequiresFullChain,true);
  assert.equal(binding.missingOrBlockedChainForcesStatus,"PARTIALLY_PREPARED");
  assert.deepEqual(binding.cap022TerminalSettlementRequiredStages,["PR22","PR23"]);
  assert.equal(binding.terminalSettlementLedgerStateField,"cap022TerminalSettlementBinding");
  assert.equal(binding.terminalSettlementSnapshotReadyField,"cap022TerminalSettlementBindingsReady");
  assert.equal(binding.terminalSettlementSnapshotFingerprintField,"cap022TerminalSettlementFingerprints");
  assert.equal(binding.terminalSettlementMissingMarker,"CAP022_TERMINAL_SETTLEMENT");
  assert.equal(binding.productiveChainEligibleRequiresTerminalSettlementBinding,true);
  assert.equal(binding.technicallyPreparedDoesNotRequireTerminalSettlement,true);
  assert.equal(binding.currentPr20_9RatificationCredit,false);
  assert.equal(binding.durableIntentCreated,false);
  assert.equal(binding.productiveCraftAuthorityOpened,false);
  assert.equal(binding.normalRuntimeAllowed,false);
});
