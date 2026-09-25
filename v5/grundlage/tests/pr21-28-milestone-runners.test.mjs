import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  planePr21_28MilestoneRunner,
  wertePr21_28MilestoneSamplesAus,
  bewertePr21_28MilestoneObservability,
  bewertePr21_28LiveEvidence,
} from "../../erzeugt/index.js";

function sample(sequenz, beobachtetAmMs, segmentId, overrides={}) {
  return {
    schemaVersion:1,
    sequenz,
    beobachtetAmMs,
    segmentId,
    healthZustand:"GESUND",
    operationsAktuell:true,
    recorderDrops:0,
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

function series(segmentId, startMs, dauerSekunden, intervallMs, startSequence=1) {
  const endMs=startMs+dauerSekunden*1000;
  const out=[];
  let sequence=startSequence;
  for(let t=startMs;t<=endMs;t+=intervallMs){
    out.push(sample(sequence,t,segmentId));
    sequence+=1;
  }
  if(out.at(-1)?.beobachtetAmMs!==endMs){
    out.push(sample(sequence,endMs,segmentId));
  }
  return out;
}

test("milestone plans encode the three agreed checkpoints without runtime authority",()=>{
  const merchant=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(merchant.segmente.length,1);
  assert.equal(merchant.segmente[0].minimumDauerSekunden,900);
  assert.equal(merchant.segmente[0].zielDauerSekunden,900);
  assert.equal(merchant.segmente[0].sampleIntervallMs,5000);
  assert.equal(merchant.cap022FullChainRequired,false);

  const group=planePr21_28MilestoneRunner("POST_PR24_25_GROUP_CHECKPOINT");
  assert.equal(group.segmente.length,2);
  assert.deepEqual(group.segmente.map(x=>x.minimumDauerSekunden),[300,900]);
  assert.equal(group.cap022FullChainRequired,true);

  const final=planePr21_28MilestoneRunner("POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN");
  assert.equal(final.segmente[0].minimumDauerSekunden,7200);
  assert.equal(final.segmente[0].zielDauerSekunden,10800);
  assert.equal(final.segmente[0].sampleIntervallMs,10000);
  assert.equal(final.cap022FullChainRequired,false);

  for(const plan of [merchant,group,final]){
    assert.equal(plan.runtimeMussSeparatAutorisiertSein,true);
    assert.equal(plan.runnerErteiltKeineAuthority,true);
    assert.equal(plan.observerOnly,true);
    assert.equal(plan.gameplayAuthority,false);
    assert.equal(plan.rawWriteAuthority,false);
    assert.equal(plan.normalRuntimeAllowed,false);
  }
});

test("15m Merchant milestone produces ratifiable evidence without runner writes",()=>{
  const plan=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const samples=series("pr21-merchant-integration",0,900,5000);
  const result=wertePr21_28MilestoneSamplesAus(
    plan,
    samples,
    {schemaVersion:1,cap022FullChainReady:true},
  );

  assert.equal(result.status,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(result.sampleGaps,0);
  assert.equal(result.segmentReihenfolgeVerletzt,0);
  assert.equal(result.evidenceRows.length,1);
  assert.equal(result.evidenceRows[0].dauerSekunden,900);
  assert.equal(result.runnerGameplayWrites,0);
  assert.equal(result.runnerPublicFunctionCalls,0);
  assert.equal(result.runnerRawWriteCalls,0);
  assert.equal(result.evidenceRatifiedByRunner,false);
  assert.equal(result.authorityIssuedByRunner,false);

  const evidence=bewertePr21_28LiveEvidence(result.evidenceRows[0]);
  assert.equal(evidence.status,"EVIDENCE_RATIFIZIERBAR");
  assert.equal(evidence.evidenceRatifiedByEvaluation,false);
  assert.equal(evidence.productiveAuthorityIssued,false);
});

test("group checkpoint chains 5m capability and 15m integration evidence",()=>{
  const plan=planePr21_28MilestoneRunner("POST_PR24_25_GROUP_CHECKPOINT");
  const first=series("pr23-capability",0,300,5000,1);
  const second=series(
    "pr25-group-integration",
    305000,
    900,
    5000,
    first.length+1,
  );
  const result=wertePr21_28MilestoneSamplesAus(
    plan,
    [...first,...second],
    {schemaVersion:1,cap022FullChainReady:true},
  );

  assert.equal(result.status,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(result.sampleGaps,0);
  assert.equal(result.segmentReihenfolgeVerletzt,0);
  assert.deepEqual(result.evidenceRows.map(x=>x.dauerSekunden),[300,900]);
  assert.ok(result.evidenceRows.every(x=>
    bewertePr21_28LiveEvidence(x).status==="EVIDENCE_RATIFIZIERBAR"));
});



test("group milestone evaluation blockiert ohne CAP-022 Full-Chain",()=>{
  const plan=planePr21_28MilestoneRunner("POST_PR24_25_GROUP_CHECKPOINT");
  const first=series("pr23-capability",0,300,5000,1);
  const second=series(
    "pr25-group-integration",
    305000,
    900,
    5000,
    first.length+1,
  );
  const result=wertePr21_28MilestoneSamplesAus(
    plan,
    [...first,...second],
    {schemaVersion:1,cap022FullChainReady:false},
  );

  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.cap022FullChainRequired,true);
  assert.equal(result.cap022FullChainSatisfied,false);
  assert.ok(result.blocker.includes(
    "PR21_28_MILESTONE_CAP022_FULL_CHAIN_NICHT_BEREIT",
  ));
  assert.equal(result.evidenceRatifiedByRunner,false);
  assert.equal(result.authorityIssuedByRunner,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("final PR28 run accepts two-hour minimum and distinguishes the three-hour target",()=>{
  const plan=planePr21_28MilestoneRunner("POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN");

  const minimum=wertePr21_28MilestoneSamplesAus(
    plan,
    series("pr28-full-integration",0,7200,10000),
    {schemaVersion:1,cap022FullChainReady:true},
  );
  assert.equal(minimum.status,"EVIDENCE_READY_MINIMUM_REACHED");
  assert.equal(minimum.alleMinimaErreicht,true);
  assert.equal(minimum.alleZieleErreicht,false);
  assert.equal(bewertePr21_28LiveEvidence(minimum.evidenceRows[0]).status,"EVIDENCE_RATIFIZIERBAR");

  const target=wertePr21_28MilestoneSamplesAus(
    plan,
    series("pr28-full-integration",0,10800,10000),
    {schemaVersion:1,cap022FullChainReady:true},
  );
  assert.equal(target.status,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(target.alleMinimaErreicht,true);
  assert.equal(target.alleZieleErreicht,true);
});

test("milestone runner fails closed on safety, health, recorder and sample-gap failures",()=>{
  const plan=planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  const samples=series("pr21-merchant-integration",0,900,5000);
  samples[10]={...samples[10],healthZustand:"DEGRADIERT"};
  samples[20]={...samples[20],recorderDrops:1};
  samples[30]={...samples[30],safetyViolations:1,authorityLeaks:1};
  samples[40]={...samples[40],sameIntentRetries:1};
  for(let i=51;i<samples.length;i+=1){
    samples[i]={...samples[i],beobachtetAmMs:samples[i].beobachtetAmMs+20000};
  }

  const result=wertePr21_28MilestoneSamplesAus(
    plan,
    samples,
    {schemaVersion:1,cap022FullChainReady:true},
  );
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_HEALTH_NICHT_GESUND"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_RECORDER_DROPS"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_SAFETY_VIOLATION"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_AUTHORITY_LEAK"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_SAME_INTENT_RETRY"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_SAMPLE_GAPS"));
  assert.ok(result.sampleGaps>0);
});

function supervisor(overrides={}) {
  return {
    schemaVersion:1,
    health:{
      zustand:"GESUND",
      fehlendeHealthIds:[],
      staleHealthIds:[],
      kritischeHealthIds:[],
      degradiertHealthIds:[],
      mutationErlaubt:true,
    },
    autoritaeten:[
      {
        schemaVersion:1,
        authorityId:"runtime:merchant",
        capabilityId:"merchant",
        ownerModulId:"merchant-runtime",
        aktiv:true,
        grund:"ratified-evidence",
        policyId:"policy-1",
        evidenceIds:["ev-1"],
        ressourcenIds:["merchant"],
        erwarteteWirkung:"merchant integration",
        ausgestelltAmMs:0,
        gueltigBisMs:999999999,
      },
    ],
    operations:{
      schemaVersion:1,
      metrik:{
        schemaVersion:1,
        zeitMs:1000,
        ssdIoLatenzMs:2,
        ioQueueTiefe:0,
        backpressureAktiv:false,
        freieBytes:1000000000,
        recorderDrops:0,
      },
      dashboardFehler:3,
      verworfeneMetriken:0,
      actionAuthority:false,
    },
    operationsAktuell:true,
    bereit:true,
    actionAuthority:false,
    ...overrides,
  };
}

test("milestone observability accepts only healthy bounded observer state and ignores dashboard transport errors",()=>{
  const result=bewertePr21_28MilestoneObservability({
    schemaVersion:1,
    supervisor:supervisor(),
    requiredActiveAuthorityIds:["runtime:merchant"],
    allowedActiveAuthorityIds:["runtime:merchant"],
  });
  assert.equal(result.status,"BEOBACHTUNG_BEREIT");
  assert.deepEqual(result.missingRequiredAuthorityIds,[]);
  assert.deepEqual(result.unexpectedActiveAuthorityIds,[]);
  assert.equal(result.authorityLeakCount,0);
  assert.equal(result.dashboardFehlerDiagnosticOnly,3);
  assert.equal(result.dashboardFailureBlocksGameplay,false);
  assert.equal(result.resourceMetricsComplete,true);
  assert.equal(result.observerActionAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
});

test("milestone observability blocks stale health, missing/unexpected authority, backpressure and recorder drops",()=>{
  const bad=supervisor({
    health:{
      zustand:"UNBEKANNT",
      fehlendeHealthIds:["bridge"],
      staleHealthIds:[],
      kritischeHealthIds:[],
      degradiertHealthIds:[],
      mutationErlaubt:false,
    },
    autoritaeten:[
      {
        schemaVersion:1,
        authorityId:"runtime:unexpected",
        capabilityId:"other",
        ownerModulId:"other-runtime",
        aktiv:true,
        grund:"unexpected",
        policyId:"policy-x",
        evidenceIds:["ev-x"],
        ressourcenIds:[],
        erwarteteWirkung:"unexpected",
        ausgestelltAmMs:0,
        gueltigBisMs:999999999,
      },
    ],
    operations:{
      schemaVersion:1,
      metrik:{
        schemaVersion:1,
        zeitMs:1000,
        ssdIoLatenzMs:null,
        ioQueueTiefe:null,
        backpressureAktiv:true,
        freieBytes:null,
        recorderDrops:2,
      },
      dashboardFehler:0,
      verworfeneMetriken:0,
      actionAuthority:false,
    },
    operationsAktuell:false,
    bereit:false,
  });
  const result=bewertePr21_28MilestoneObservability({
    schemaVersion:1,
    supervisor:bad,
    requiredActiveAuthorityIds:["runtime:merchant"],
    allowedActiveAuthorityIds:["runtime:merchant"],
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_SUPERVISOR_NICHT_BEREIT"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_HEALTH_NICHT_GESUND"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_OPERATIONS_STALE"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_REQUIRED_AUTHORITY_FEHLT"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_UNEXPECTED_AUTHORITY"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_RECORDER_DROPS"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_BACKPRESSURE"));
  assert.ok(result.blocker.includes("PR21_28_MILESTONE_RESOURCE_METRICS_UNVOLLSTAENDIG"));
  assert.equal(result.authorityLeakCount,1);
});

test("milestone runner and observability sources contain no gameplay mutation bypass",()=>{
  const paths=[
    "grundlage/quelle/zertifizierung/pr21-28-milestone-runner.ts",
    "grundlage/quelle/operations/pr21-28-milestone-observability.ts",
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


test("Milestone-Vertrag und Roadmap binden Group-Checkpoint an CAP-022 Full-Chain",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-28-milestone-runners.json",
    "utf8",
  ));
  const boundary=contract.cap022FullChainBoundary;
  assert.equal(boundary.requiredCheckpoint,"POST_PR24_25_GROUP_CHECKPOINT");
  assert.deepEqual(boundary.requiredStages,["PR23"]);
  assert.equal(boundary.planField,"cap022FullChainRequired");
  assert.equal(boundary.evaluationInputField,"cap022FullChainReady");
  assert.equal(
    boundary.blocker,
    "PR21_28_MILESTONE_CAP022_FULL_CHAIN_NICHT_BEREIT",
  );
  assert.equal(boundary.evaluationWithoutFullChainStatus,"BLOCKIERT");
  assert.equal(boundary.runnerRatifiesEvidence,false);
  assert.equal(boundary.runnerIssuesAuthority,false);
  assert.equal(boundary.currentPr20_9RatificationCredit,false);
  assert.equal(boundary.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(boundary.durableIntentCreated,false);
  assert.equal(boundary.productiveCraftAuthorityOpened,false);

  const roadmap=JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  const binding=
    roadmap.pr23.materialAcquisitionFoundation
      .fullChainOrchestrationReadiness.milestoneRunnerBinding;
  assert.equal(binding.requiredCheckpoint,"POST_PR24_25_GROUP_CHECKPOINT");
  assert.deepEqual(binding.requiredStages,["PR23"]);
  assert.equal(binding.evaluationInputField,"cap022FullChainReady");
  assert.equal(binding.missingFullChainStatus,"BLOCKIERT");
  assert.equal(binding.runnerRatifiesEvidence,false);
  assert.equal(binding.runnerIssuesAuthority,false);
  assert.equal(binding.currentPr20_9RatificationCredit,false);
  assert.equal(binding.candidateAcquisitionOrMutationAllowedNow,false);
  assert.equal(binding.durableIntentCreated,false);
  assert.equal(binding.productiveCraftAuthorityOpened,false);
  assert.equal(binding.normalRuntimeAllowed,false);
});
