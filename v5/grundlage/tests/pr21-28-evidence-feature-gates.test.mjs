import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bewertePr21_28FeatureGates,
  bewertePr21_28LiveEvidence,
  planePr21_28IntegrationCheckpoints,
} from "../../erzeugt/index.js";

const STAGES=["PR21","PR22","PR23","PR24","PR25","PR26","PR27","PR28"];

function gateRows(overrides={}) {
  return STAGES.map(stage=>({
    stage,
    foundationPrepared:true,
    orchestrationPrepared:true,
    cap022FullChainReady:true,
    predecessorProductiveComplete:true,
    requiredLiveEvidenceRatified:true,
    restartReconciliationRatified:true,
    safetyViolations:0,
    duplicateIrreversibleEffects:0,
    unresolvedTransactions:0,
    ...(overrides[stage]??{}),
  }));
}

test("PR21-28 feature gates evaluate eligibility without issuing authority",()=>{
  const result=bewertePr21_28FeatureGates(gateRows());
  assert.equal(result.allThroughPr28Eligible,true);
  assert.equal(result.highestProductiveEligibleStage,"PR28");
  assert.equal(result.stages.length,8);
  assert.ok(result.stages.every(x=>x.productiveEligible===true));
  assert.ok(result.stages.every(x=>x.authorityIssued===false));
  assert.ok(result.stages.every(x=>x.gameplayAuthority===false));
  assert.ok(result.stages.every(x=>x.rawWriteAuthority===false));
  assert.deepEqual(result.cap022FullChainRequiredStages,["PR22","PR23"]);
  assert.equal(result.stages[0].cap022FullChainRequired,false);
  assert.equal(result.stages[1].cap022FullChainRequired,true);
  assert.equal(result.stages[1].cap022FullChainSatisfied,true);
  assert.equal(result.stages[2].cap022FullChainRequired,true);
  assert.equal(result.stages[2].cap022FullChainSatisfied,true);
  assert.equal(result.authorityIssuedByGateEvaluation,false);
});

test("PR21-28 feature gate closes the dependency chain after missing evidence",()=>{
  const result=bewertePr21_28FeatureGates(gateRows({
    PR23:{requiredLiveEvidenceRatified:false},
  }));
  assert.equal(result.allThroughPr28Eligible,false);
  assert.equal(result.highestProductiveEligibleStage,"PR22");
  assert.equal(result.stages[2].productiveEligible,false);
  assert.ok(result.stages[2].blocker.includes("PR23_LIVE_EVIDENCE_NICHT_RATIFIZIERT"));
  for(const row of result.stages.slice(3)){
    assert.equal(row.productiveEligible,false,row.stage);
    assert.ok(row.blocker.includes(row.stage+"_VORGAENGER_KETTE_GESCHLOSSEN"),row.stage);
  }
});



test("PR22/PR23 Feature Gates verlangen CAP-022 Full-Chain explizit",()=>{
  const result=bewertePr21_28FeatureGates(gateRows({
    PR22:{cap022FullChainReady:false},
  }));
  assert.equal(result.allThroughPr28Eligible,false);
  assert.equal(result.highestProductiveEligibleStage,"PR21");

  const pr22=result.stages[1];
  assert.equal(pr22.cap022FullChainRequired,true);
  assert.equal(pr22.cap022FullChainSatisfied,false);
  assert.equal(pr22.productiveEligible,false);
  assert.ok(pr22.blocker.includes("PR22_CAP022_FULL_CHAIN_NICHT_BEREIT"));

  for(const row of result.stages.slice(2)){
    assert.equal(row.productiveEligible,false,row.stage);
    assert.ok(
      row.blocker.includes(row.stage+"_VORGAENGER_KETTE_GESCHLOSSEN"),
      row.stage,
    );
  }

  const pr23Direct=bewertePr21_28FeatureGates(gateRows({
    PR23:{cap022FullChainReady:false},
  }));
  assert.equal(pr23Direct.highestProductiveEligibleStage,"PR22");
  assert.ok(
    pr23Direct.stages[2].blocker.includes(
      "PR23_CAP022_FULL_CHAIN_NICHT_BEREIT",
    ),
  );
});

test("PR21-28 feature gates reject safety, duplicate-effect and unresolved-transaction evidence",()=>{
  const result=bewertePr21_28FeatureGates(gateRows({
    PR21:{
      safetyViolations:1,
      duplicateIrreversibleEffects:1,
      unresolvedTransactions:1,
    },
  }));
  const pr21=result.stages[0];
  assert.equal(pr21.productiveEligible,false);
  assert.ok(pr21.blocker.includes("PR21_SAFETY_VIOLATION"));
  assert.ok(pr21.blocker.includes("PR21_DUPLICATE_IRREVERSIBLE_EFFECT"));
  assert.ok(pr21.blocker.includes("PR21_UNRESOLVED_TRANSACTION"));
  assert.equal(result.highestProductiveEligibleStage,null);
});

function evidence(overrides={}) {
  return {
    evidenceId:"evidence-1",
    art:"MERCHANT_INTEGRATION_15M",
    stage:"PR21",
    dauerSekunden:900,
    samples:60,
    unerwarteteGameplayWrites:0,
    duplicateIrreversibleEffects:0,
    safetyViolations:0,
    sameIntentRetries:0,
    unresolvedTransactions:0,
    authorityLeaks:0,
    restartRecoveryFailures:0,
    staleEvidenceActions:0,
    thrashEvents:0,
    pingpongEvents:0,
    starvationCriticalCount:0,
    ...overrides,
  };
}

test("PR21 merchant 15m evidence becomes ratifiable only after full duration and clean safety metrics",()=>{
  const ready=bewertePr21_28LiveEvidence(evidence());
  assert.equal(ready.status,"EVIDENCE_RATIFIZIERBAR");
  assert.equal(ready.minimumDauerSekunden,900);
  assert.equal(ready.evidenceRatifiedByEvaluation,false);
  assert.equal(ready.productiveAuthorityIssued,false);

  const short=bewertePr21_28LiveEvidence(evidence({dauerSekunden:899}));
  assert.equal(short.status,"BLOCKIERT");
  assert.ok(short.blocker.includes("PR21_28_EVIDENCE_DAUER_ZU_KURZ"));

  const unsafe=bewertePr21_28LiveEvidence(evidence({
    unerwarteteGameplayWrites:1,
    safetyViolations:1,
    sameIntentRetries:1,
    authorityLeaks:1,
    thrashEvents:1,
    pingpongEvents:1,
    starvationCriticalCount:1,
  }));
  assert.equal(unsafe.status,"BLOCKIERT");
  assert.ok(unsafe.blocker.includes("PR21_28_EVIDENCE_UNERWARTETER_WRITE"));
  assert.ok(unsafe.blocker.includes("PR21_28_EVIDENCE_SAFETY_VIOLATION"));
  assert.ok(unsafe.blocker.includes("PR21_28_EVIDENCE_AUTHORITY_LEAK"));
});

test("PR23 capability evidence requires 5m and PR25 group integration requires 15m",()=>{
  const cap=bewertePr21_28LiveEvidence(evidence({
    evidenceId:"cap-aoe",
    art:"CAPABILITY_5M",
    stage:"PR23",
    dauerSekunden:300,
  }));
  assert.equal(cap.status,"EVIDENCE_RATIFIZIERBAR");
  assert.equal(cap.minimumDauerSekunden,300);

  const group=bewertePr21_28LiveEvidence(evidence({
    evidenceId:"group-integration",
    art:"GROUP_INTEGRATION_15M",
    stage:"PR25",
    dauerSekunden:900,
  }));
  assert.equal(group.status,"EVIDENCE_RATIFIZIERBAR");
  assert.equal(group.minimumDauerSekunden,900);
});

test("PR28 final integration requires at least two hours while the planned target is three hours",()=>{
  const tooShort=bewertePr21_28LiveEvidence(evidence({
    evidenceId:"full-run-short",
    art:"FULL_INTEGRATION_MULTI_HOUR",
    stage:"PR28",
    dauerSekunden:7199,
  }));
  assert.equal(tooShort.status,"BLOCKIERT");
  assert.equal(tooShort.minimumDauerSekunden,7200);

  const ready=bewertePr21_28LiveEvidence(evidence({
    evidenceId:"full-run",
    art:"FULL_INTEGRATION_MULTI_HOUR",
    stage:"PR28",
    dauerSekunden:10800,
    samples:300,
  }));
  assert.equal(ready.status,"EVIDENCE_RATIFIZIERBAR");

  const checkpoints=planePr21_28IntegrationCheckpoints();
  assert.equal(checkpoints.length,3);
  assert.equal(checkpoints[0].checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(checkpoints[0].rows[0].zielDauerSekunden,900);
  assert.equal(checkpoints[1].checkpointId,"POST_PR24_25_GROUP_CHECKPOINT");
  assert.deepEqual(checkpoints[1].rows.map(x=>x.zielDauerSekunden),[300,900]);
  assert.equal(checkpoints[2].checkpointId,"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN");
  assert.equal(checkpoints[2].rows[0].zielDauerSekunden,10800);
  assert.ok(checkpoints.every(x=>x.produktiveGatesBleibenBisEvidenceGeschlossen===true));
});

test("PR21-28 evidence and feature-gate source contains no authority or gameplay mutation bypass",()=>{
  const paths=[
    "grundlage/quelle/runtime/pr21-28-feature-gates.ts",
    "grundlage/quelle/zertifizierung/pr21-28-live-evidence.ts",
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
  ];
  for(const path of paths){
    const source=fs.readFileSync(path,"utf8");
    for(const marker of forbidden){
      assert.equal(source.includes(marker),false,path+" -> "+marker);
    }
  }
});
