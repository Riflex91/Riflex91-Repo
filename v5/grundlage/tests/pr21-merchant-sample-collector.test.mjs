import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantCheckpointVor,
  bereitePr21MerchantObserverHandoffVor,
  initialisierePr21MerchantSampleCollector,
  sammlePr21MerchantSample,
  planePr21_28MilestoneRunner,
  wertePr21_28MilestoneSamplesAus,
  planePr21_28MilestoneRunner,
} from "../../erzeugt/index.js";

const MAIN="aa779a0fe1321a68c89ad9ae0eec02108904e978";

function preflight(overrides={}) {
  return {
    schemaVersion:1,
    status:"PRECHECK_BEREIT_NO_START_AUTHORITY",
    blocker:[],
    currentMainVerified:true,
    merchantReadinessSatisfied:true,
    checkpointBindingSatisfied:true,
    allPr20StagesRatified:true,
    ratifiedPr20Stages:[
      "PR20.1","PR20.2","PR20.3","PR20.4","PR20.5",
      "PR20.6","PR20.7","PR20.8","PR20.9",
    ],
    missingPr20Stages:[],
    targetCheckpoint:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    targetDurationSeconds:900,
    separateExternalAuthorizationRequired:true,
    externalRuntimeStartAuthorized:false,
    runnerOwnsGameplayAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function handoff() {
  const admission=bereitePr21MerchantCheckpointVor({
    schemaVersion:1,
    sourceMainCommit:MAIN,
    preflight:preflight(),
    pr20_9RatificationBasis:"MANUAL_DEVELOPMENT_OVERRIDE",
    manualOverrideEvidence:"v5/roadmap/pr20-9-craft-manual-development-override.json",
    liveCraftEvidenceSatisfied:false,
  });
  return bereitePr21MerchantObserverHandoffVor(admission);
}

function authority(id="runtime:merchant") {
  return {
    schemaVersion:1,
    authorityId:id,
    capabilityId:id==="runtime:merchant"?"merchant":"other",
    ownerModulId:id==="runtime:merchant"?"merchant-runtime":"other-runtime",
    aktiv:true,
    grund:"externally-authorized-checkpoint-runtime",
    policyId:"policy-pr21",
    evidenceIds:["pr21-checkpoint-runtime"],
    ressourcenIds:["merchant"],
    erwarteteWirkung:"merchant integration",
    ausgestelltAmMs:0,
    gueltigBisMs:999999999,
  };
}

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
    autoritaeten:[authority()],
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
      dashboardFehler:0,
      verworfeneMetriken:0,
      actionAuthority:false,
    },
    operationsAktuell:true,
    bereit:true,
    actionAuthority:false,
    ...overrides,
  };
}

function counters(overrides={}) {
  return {
    unerwarteteGameplayWrites:0,
    duplicateIrreversibleEffects:0,
    safetyViolations:0,
    sameIntentRetries:0,
    unresolvedTransactions:0,
    restartRecoveryFailures:0,
    staleEvidenceActions:0,
    thrashEvents:0,
    pingpongEvents:0,
    starvationCriticalCount:0,
    ...overrides,
  };
}

function input(beobachtetAmMs,overrides={}) {
  return {
    schemaVersion:1,
    beobachtetAmMs,
    supervisor:supervisor(),
    counters:counters(),
    ...overrides,
  };
}

test("PR21 sample collector initializes bounded and without runtime authority",()=>{
  const state=initialisierePr21MerchantSampleCollector(handoff());
  assert.equal(state.status,"SAMMELBEREIT_NO_START_AUTHORITY");
  assert.deepEqual(state.blocker,[]);
  assert.equal(state.checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(state.segmentId,"pr21-merchant-integration");
  assert.equal(state.sampleIntervalMs,5000);
  assert.equal(state.maximumSampleGapMs,15000);
  assert.equal(state.maximumSamples,184);
  assert.equal(state.targetDurationMs,900000);
  assert.equal(state.sampleAnzahl,0);
  assert.equal(state.frozen,false);
  assert.equal(state.observerOnly,true);
  assert.equal(state.externalRuntimeStartAuthorized,false);
  assert.equal(state.collectorGameplayWrites,0);
  assert.equal(state.collectorPublicFunctionCalls,0);
  assert.equal(state.collectorRawWriteCalls,0);
  assert.equal(state.gameplayAuthority,false);
  assert.equal(state.rawWriteAuthority,false);
  assert.equal(state.normalRuntimeAllowed,false);
});

test("clean 181-sample 15m run freezes at target and feeds existing milestone evaluator",()=>{
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  for(let t=0;t<=900000;t+=5000){
    state=sammlePr21MerchantSample(state,h,input(t));
  }

  assert.equal(state.status,"ZIEL_ERREICHT_EINGEFROREN");
  assert.equal(state.frozen,true);
  assert.equal(state.sampleAnzahl,181);
  assert.equal(state.gestartetAmMs,0);
  assert.equal(state.letzterSampleAmMs,900000);
  assert.equal(state.dauerMs,900000);
  assert.deepEqual(state.blocker,[]);
  assert.equal(state.samples[0].sequenz,1);
  assert.equal(state.samples.at(-1).sequenz,181);
  assert.equal(state.samples.at(-1).beobachtetAmMs,900000);

  const evaluated=wertePr21_28MilestoneSamplesAus(
    planePr21_28MilestoneRunner("PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT"),
    state.samples,
    {schemaVersion:1,cap022FullChainReady:true},
  );
  assert.equal(evaluated.status,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(evaluated.sampleGaps,0);
  assert.equal(evaluated.alleMinimaErreicht,true);
  assert.equal(evaluated.alleZieleErreicht,true);
  assert.equal(evaluated.runnerGameplayWrites,0);
  assert.equal(evaluated.authorityIssuedByRunner,false);

  assert.throws(
    ()=>sammlePr21MerchantSample(state,h,input(905000)),
    /PR21_MERCHANT_SAMPLE_COLLECTOR_EINGEFROREN/,
  );
});

test("sample gap above 15s is recorded once and freezes fail-closed",()=>{
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  state=sammlePr21MerchantSample(state,h,input(0));
  state=sammlePr21MerchantSample(state,h,input(16000));
  assert.equal(state.status,"ABGEBROCHEN_FAIL_CLOSED");
  assert.equal(state.frozen,true);
  assert.equal(state.sampleAnzahl,2);
  assert.ok(state.blocker.includes("SAMPLE_GAPS"));
});

test("unexpected runtime authority freezes through existing observability boundary",()=>{
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  state=sammlePr21MerchantSample(state,h,input(0,{
    supervisor:supervisor({autoritaeten:[authority(),authority("runtime:unexpected")]}),
  }));
  assert.equal(state.status,"ABGEBROCHEN_FAIL_CLOSED");
  assert.equal(state.frozen,true);
  assert.equal(state.sampleAnzahl,1);
  assert.ok(state.blocker.includes("PR21_28_MILESTONE_UNEXPECTED_AUTHORITY"));
  assert.equal(state.samples[0].authorityLeaks,1);
});

test("runtime safety counters freeze immediately with runbook-compatible signal",()=>{
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  state=sammlePr21MerchantSample(state,h,input(0,{
    counters:counters({sameIntentRetries:1,thrashEvents:1}),
  }));
  assert.equal(state.status,"ABGEBROCHEN_FAIL_CLOSED");
  assert.equal(state.frozen,true);
  assert.ok(state.blocker.includes("SAME_INTENT_RETRY"));
  assert.ok(state.blocker.includes("THRASH"));
  assert.equal(state.samples[0].sameIntentRetries,1);
  assert.equal(state.samples[0].thrashEvents,1);
});

test("collector never exceeds its bounded 184-sample capacity before target",()=>{
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  for(let i=0;i<184;i+=1){
    state=sammlePr21MerchantSample(state,h,input(i*1000));
    if(state.frozen) break;
  }
  assert.equal(state.status,"ABGEBROCHEN_FAIL_CLOSED");
  assert.equal(state.frozen,true);
  assert.equal(state.sampleAnzahl,184);
  assert.equal(state.dauerMs,183000);
  assert.ok(state.blocker.includes("PR21_MERCHANT_SAMPLE_LIMIT_VOR_ZIEL"));
});

test("non-monotonic time freezes collector without appending a duplicate sample",()=>{
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  state=sammlePr21MerchantSample(state,h,input(5000));
  state=sammlePr21MerchantSample(state,h,input(5000));
  assert.equal(state.status,"ABGEBROCHEN_FAIL_CLOSED");
  assert.equal(state.frozen,true);
  assert.equal(state.sampleAnzahl,1);
  assert.ok(state.blocker.includes("PR21_MERCHANT_SAMPLE_ZEIT_NICHT_MONOTON"));
});

test("sample collector contract stays bounded, no-write and no-start",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-sample-collector.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_NO_WRITE_NO_START_AUTHORITY");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(contract.segmentId,"pr21-merchant-integration");
  assert.equal(contract.boundary.targetDurationMs,900000);
  assert.equal(contract.boundary.sampleIntervalMs,5000);
  assert.equal(contract.boundary.maximumSampleGapMs,15000);
  assert.equal(contract.boundary.expectedSamplesForTarget,181);
  assert.equal(contract.boundary.maximumSamples,184);
  assert.equal(contract.boundary.boundedInMemoryOnly,true);
  assert.deepEqual(contract.observability.requiredActiveAuthorityIds,["runtime:merchant"]);
  assert.equal(contract.observability.existingMilestoneRunnerOutputCompatible,true);
  assert.equal(contract.safety.externalRuntimeStartAuthorized,false);
  assert.equal(contract.safety.collectorGameplayWrites,0);
  assert.equal(contract.safety.collectorPublicFunctionCalls,0);
  assert.equal(contract.safety.collectorRawWriteCalls,0);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("sample collector source contains no gameplay or runtime-start operation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-sample-collector.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","START_EXTERNALLY_AUTHORIZED_RUNTIME_ONLY",
  ]) assert.equal(source.includes(marker),false,marker);
});
