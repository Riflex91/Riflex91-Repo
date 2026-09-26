import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {bauePr21_28StageLedger,replayPr21_28AdvanceChain} from "../../erzeugt/index.js";

const STAGES=["PR21","PR22","PR23","PR24","PR25","PR26","PR27","PR28"];
function terminalBinding(stage,fp=stage==="PR22"?"1111111111111111":"2222222222222222"){
  return {
    stage,
    settlementFingerprint:fp,
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

test("all PR21-28 preparation can be complete while productive chain remains closed",()=>{
  const ledger=bauePr21_28StageLedger(states());
  assert.equal(ledger.allPreparationComplete,true);
  assert.equal(ledger.highestPreparationCompleteStage,"PR28");
  assert.equal(ledger.allProductiveEligible,false);
  assert.equal(ledger.highestProductiveEligibleStage,null);
  assert.equal(ledger.replayOnly,true);
  assert.equal(ledger.gateMutationPerformed,false);
  assert.equal(ledger.authorityIssued,false);
  assert.equal(ledger.broadRuntimeGrant,false);
  assert.equal(ledger.normalRuntimeAllowed,false);
  assert.match(ledger.ledgerFingerprint,/^[0-9a-f]{16}$/);

  const replay=replayPr21_28AdvanceChain(ledger);
  assert.equal(replay.status,"PREPARATION_COMPLETE_PRODUCTIVE_CHAIN_CLOSED");
  assert.equal(replay.highestPreparationCompleteStage,"PR28");
  assert.equal(replay.highestProductiveEligibleStage,null);
  assert.ok(replay.blocker.includes("PR21_LIVE_EVIDENCE_REQUIRED"));
  assert.ok(replay.blocker.includes("PR21_EXPLICIT_RATIFICATION_REQUIRED"));
  assert.ok(replay.blocker.includes("PR21_VERIFIED_GATE_APPLY_REQUIRED"));
  assert.equal(replay.replayMutatedGate,false);
  assert.equal(replay.replayIssuedAuthority,false);
});

test("productive replay is strictly ordered and closes after first incomplete stage",()=>{
  const ledger=bauePr21_28StageLedger(states({
    PR21:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true},
    PR22:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true,cap022TerminalSettlementBinding:terminalBinding("PR22")},
    PR23:{liveEvidenceRatified:false,explicitRatificationRecorded:false,gateApplyVerified:false},
    PR24:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true},
  }));
  assert.equal(ledger.highestProductiveEligibleStage,"PR22");
  assert.equal(ledger.entries[2].productiveChainEligible,false);
  assert.equal(ledger.entries[3].productiveChainEligible,false);
  const replay=replayPr21_28AdvanceChain(ledger);
  assert.ok(replay.blocker.includes("PR23_LIVE_EVIDENCE_REQUIRED"));
  assert.ok(replay.blocker.includes("PR24_PREDECESSOR_CHAIN_CLOSED"));
});

test("fully hypothetical evidence chain can replay eligible without mutating gates",()=>{
  const all=Object.fromEntries(STAGES.map(stage=>[stage,{
    liveEvidenceRatified:true,
    explicitRatificationRecorded:true,
    gateApplyVerified:true,
    cap022TerminalSettlementBinding:
      stage==="PR22"||stage==="PR23" ? terminalBinding(stage) : null,
  }]));
  const ledger=bauePr21_28StageLedger(states(all));
  const replay=replayPr21_28AdvanceChain(ledger);
  assert.equal(ledger.allProductiveEligible,true);
  assert.equal(ledger.highestProductiveEligibleStage,"PR28");
  assert.equal(replay.status,"PRODUCTIVE_CHAIN_REPLAY_ELIGIBLE");
  assert.deepEqual(replay.blocker,[]);
  assert.equal(replay.replayMutatedGate,false);
  assert.equal(replay.replayIssuedAuthority,false);
  assert.equal(replay.broadRuntimeGrant,false);
});

test("missing preparation remains distinct from missing productive evidence",()=>{
  const ledger=bauePr21_28StageLedger(states({
    PR26:{gateSettlementPrepared:false},
  }));
  assert.equal(ledger.allPreparationComplete,false);
  const replay=replayPr21_28AdvanceChain(ledger);
  assert.equal(replay.status,"PREPARATION_INCOMPLETE");
  assert.ok(replay.blocker.includes("PR26_PREPARATION_INCOMPLETE"));
});



test("PR22/PR23 Stage-Ledger verlangt CAP-022 Full-Chain fuer Preparation",()=>{
  const ledger=bauePr21_28StageLedger(states({
    PR22:{cap022FullChainReady:false},
  }));
  assert.equal(ledger.allPreparationComplete,false);
  assert.equal(ledger.entries[1].cap022FullChainRequired,true);
  assert.equal(ledger.entries[1].cap022FullChainSatisfied,false);
  assert.equal(ledger.entries[1].preparationComplete,false);
  assert.equal(ledger.entries[1].productiveChainEligible,false);

  const replay=replayPr21_28AdvanceChain(ledger);
  assert.equal(replay.status,"PREPARATION_INCOMPLETE");
  assert.ok(replay.blocker.includes("PR22_CAP022_FULL_CHAIN_REQUIRED"));
  assert.ok(replay.blocker.includes("PR22_PREPARATION_INCOMPLETE"));
  assert.equal(replay.stages[1].requiresCap022FullChain,true);
  assert.equal(replay.replayMutatedGate,false);
  assert.equal(replay.replayIssuedAuthority,false);

  for(const row of ledger.entries.slice(2)){
    assert.equal(row.productiveChainEligible,false,row.stage);
  }

  const directPr23=bauePr21_28StageLedger(states({
    PR23:{cap022FullChainReady:false},
    PR21:{
      liveEvidenceRatified:true,
      explicitRatificationRecorded:true,
      gateApplyVerified:true,
    },
    PR22:{
      liveEvidenceRatified:true,
      explicitRatificationRecorded:true,
      gateApplyVerified:true,
      cap022TerminalSettlementBinding:terminalBinding("PR22"),
    },
  }));
  const directReplay=replayPr21_28AdvanceChain(directPr23);
  assert.ok(directReplay.blocker.includes("PR23_CAP022_FULL_CHAIN_REQUIRED"));
  assert.equal(directPr23.entries[2].cap022FullChainSatisfied,false);
});

test("PR22/PR23 productive replay requires terminal CAP-022 settlement binding",()=>{
  const missing=bauePr21_28StageLedger(states({
    PR21:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true},
    PR22:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true},
  }));
  assert.equal(missing.entries[1].preparationComplete,true);
  assert.equal(missing.entries[1].cap022TerminalSettlementRequired,true);
  assert.equal(missing.entries[1].cap022TerminalSettlementSatisfied,false);
  assert.equal(missing.entries[1].productiveChainEligible,false);
  const missingReplay=replayPr21_28AdvanceChain(missing);
  assert.ok(missingReplay.blocker.includes("PR22_CAP022_TERMINAL_SETTLEMENT_REQUIRED"));
  assert.equal(missingReplay.stages[1].requiresCap022TerminalSettlement,true);

  const bound=bauePr21_28StageLedger(states({
    PR21:{liveEvidenceRatified:true,explicitRatificationRecorded:true,gateApplyVerified:true},
    PR22:{
      liveEvidenceRatified:true,
      explicitRatificationRecorded:true,
      gateApplyVerified:true,
      cap022TerminalSettlementBinding:terminalBinding("PR22"),
    },
  }));
  assert.equal(bound.entries[1].cap022TerminalSettlementSatisfied,true);
  assert.equal(bound.entries[1].cap022TerminalSettlementFingerprint,"1111111111111111");
  assert.equal(bound.entries[1].productiveChainEligible,true);

  assert.throws(
    ()=>bauePr21_28StageLedger(states({
      PR22:{cap022TerminalSettlementBinding:terminalBinding("PR23")},
    })),
    /PR21_28_STAGE_LEDGER_CAP022_SETTLEMENT_BINDING_UNGUELTIG:PR22/,
  );
  assert.throws(
    ()=>bauePr21_28StageLedger(states({
      PR21:{cap022TerminalSettlementBinding:terminalBinding("PR22")},
    })),
    /PR21_28_STAGE_LEDGER_CAP022_SETTLEMENT_UNERWARTET:PR21/,
  );
});

test("ledger rejects duplicate or incomplete stage sets",()=>{
  assert.throws(()=>bauePr21_28StageLedger(states().slice(0,7)),/PR21_28_STAGE_LEDGER_UNVOLLSTAENDIG/);
  const duplicate=states();
  duplicate[7]={...duplicate[7],stage:"PR21"};
  assert.throws(()=>bauePr21_28StageLedger(duplicate),/PR21_28_STAGE_LEDGER_STAGE_DOPPELT/);
});

test("stage-ledger source contains no mutation or overall-grant bypass",()=>{
  const source=fs.readFileSync("grundlage/quelle/runtime/pr21-28-stage-state-ledger.ts","utf8");
  for(const marker of ["socket.emit(","send_cm(","smart_move(","attack(","use_skill(","loot(","respawn(","change_server(","craft(","exchange(","upgrade(","compound(","V5 GESAMTFREIGABE ERTEILEN"]){
    assert.equal(source.includes(marker),false,marker);
  }
});


test("Stage-Ledger-Vertrag und Roadmap binden PR22/PR23 an CAP-022 Full-Chain",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-28-stage-ledger-replay.json",
    "utf8",
  ));
  const boundary=contract.cap022FullChainBoundary;
  assert.deepEqual(boundary.requiredStages,["PR22","PR23"]);
  assert.equal(boundary.stateField,"cap022FullChainReady");
  assert.equal(boundary.preparationCompleteRequiresFullChain,true);
  assert.equal(boundary.productiveReplayCannotBypassFullChain,true);
  assert.equal(boundary.terminalSettlementStateField,"cap022TerminalSettlementBinding");
  assert.deepEqual(boundary.terminalSettlementRequiredStages,["PR22","PR23"]);
  assert.equal(boundary.terminalSettlementRequiresAppliedVerifiedStatus,true);
  assert.equal(boundary.terminalSettlementFingerprintRequired,true);
  assert.equal(boundary.terminalSettlementMustMatchStage,true);
  assert.equal(boundary.productiveReplayRequiresTerminalSettlementBinding,true);
  assert.equal(boundary.entryFingerprintIncludesTerminalSettlementBinding,true);
  assert.equal(
    boundary.explicitTerminalSettlementBlockerByStage.PR22,
    "PR22_CAP022_TERMINAL_SETTLEMENT_REQUIRED",
  );
  assert.equal(
    boundary.explicitTerminalSettlementBlockerByStage.PR23,
    "PR23_CAP022_TERMINAL_SETTLEMENT_REQUIRED",
  );
  assert.equal(
    boundary.explicitReplayBlockerByStage.PR22,
    "PR22_CAP022_FULL_CHAIN_REQUIRED",
  );
  assert.equal(
    boundary.explicitReplayBlockerByStage.PR23,
    "PR23_CAP022_FULL_CHAIN_REQUIRED",
  );
  assert.equal(boundary.replayMutatesGate,false);
  assert.equal(boundary.replayIssuesAuthority,false);
  assert.equal(boundary.currentPr20_9RatificationCredit,false);
  assert.equal(boundary.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(boundary.durableIntentCreated,false);
  assert.equal(boundary.productiveCraftAuthorityOpened,false);

  const roadmap=JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  assert.equal(
    roadmap.pr20_9.status,
    "MANUAL_OVERRIDE_BESTANDEN_FOR_DEVELOPMENT",
  );
  const binding=
    roadmap.pr22.materialAcquisitionFoundation
      .fullChainOrchestrationReadiness.stageLedgerBinding;
  assert.deepEqual(binding.requiredStages,["PR22","PR23"]);
  assert.equal(binding.stateField,"cap022FullChainReady");
  assert.equal(binding.preparationCompleteRequiresFullChain,true);
  assert.equal(binding.productiveReplayCannotBypassFullChain,true);
  assert.equal(binding.terminalSettlementStateField,"cap022TerminalSettlementBinding");
  assert.equal(binding.productiveReplayRequiresTerminalSettlementBinding,true);
  assert.equal(binding.entryFingerprintIncludesTerminalSettlementBinding,true);
  assert.equal(binding.replayMutatesGate,false);
  assert.equal(binding.replayIssuesAuthority,false);
  assert.equal(binding.currentPr20_9RatificationCredit,false);
  assert.equal(binding.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(binding.durableIntentCreated,false);
  assert.equal(binding.productiveCraftAuthorityOpened,false);
  assert.equal(binding.normalRuntimeAllowed,false);
});
