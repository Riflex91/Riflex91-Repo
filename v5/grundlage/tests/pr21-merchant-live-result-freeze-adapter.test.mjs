import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  adaptierePr21MerchantLiveResultFuerFreezeEvaluation,
} from "../../erzeugt/index.js";

const MAIN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const CHECKPOINT="PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
const TEST_ID="pr21-merchant-integration-live-15m-v1-0-2";

function handoff(overrides={}) {
  return {
    schemaVersion:1,
    status:"OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY",
    blocker:[],
    sourceMainCommit:MAIN,
    checkpointId:CHECKPOINT,
    segmentId:"pr21-merchant-integration",
    milestoneArt:"MERCHANT_INTEGRATION_15M",
    stage:"PR21",
    minimumDurationSeconds:900,
    targetDurationSeconds:900,
    sampleIntervalMs:5000,
    maximumSampleGapMs:15000,
    expectedSamplesForTarget:181,
    maximumSamples:184,
    requiredActiveAuthorityIds:["runtime:merchant"],
    allowedActiveAuthorityIds:["runtime:merchant"],
    requiredHealthState:"GESUND",
    operationsMustBeCurrent:true,
    operationsResourceMetricsRequired:["ssdIoLatenzMs","ioQueueTiefe","freieBytes"],
    recorderDropsAllowed:0,
    backpressureAllowed:false,
    abortSignals:[
      "HEALTH_NOT_HEALTHY","OPERATIONS_STALE","RECORDER_DROPS",
      "UNEXPECTED_AUTHORITY","THRASH","PINGPONG","CRITICAL_STARVATION",
    ],
    pr20_9RatificationBasis:"MANUAL_DEVELOPMENT_OVERRIDE",
    manualOverrideEvidence:"manual-override-evidence",
    liveCraftEvidenceSatisfied:false,
    manualOverrideExplicitlyDistinguishedFromLiveEvidence:true,
    observerOnly:true,
    observerActionAuthority:false,
    externalRuntimeStartAuthorized:false,
    separateExternalAuthorizationRequired:true,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function sample(index,overrides={}) {
  return {
    schemaVersion:1,
    sequenz:index+1,
    beobachtetAmMs:index*5000,
    segmentId:"pr21-merchant-integration",
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
    runtimeAuthorityId:"runtime:merchant",
    runtimeRunning:true,
    snapshotAgeMs:250,
    heartbeatAgeMs:200,
    captureErrors:0,
    reconciliationBlockers:[],
    heartbeatType:"AIO_V3_HOST_WATCHDOG_BEACON",
    ...overrides,
  };
}

function liveResult(overrides={}) {
  const samples=Array.from({length:181},(_,i)=>sample(i));
  return {
    schemaVersion:1,
    testId:TEST_ID,
    version:"1.0.2",
    checkpointId:CHECKPOINT,
    phase:"COMPLETE",
    status:"BESTANDEN",
    terminal:true,
    blocker:[],
    samples,
    sampleCount:181,
    durationMs:900000,
    startedAtMs:0,
    completedAtMs:900000,
    evidence:{
      schemaVersion:1,
      status:"EVIDENCE_READY_TARGET_REACHED",
      checkpointId:CHECKPOINT,
      sampleCount:181,
      durationMs:900000,
      activeAuthorityIds:["runtime:merchant"],
      observerOnly:true,
      collectorGameplayWrites:0,
      collectorPublicFunctionCalls:0,
      collectorRawWriteCalls:0,
      authorityIssuedByHarness:false,
      externalRuntimeStartAuthorized:true,
      externalRuntimeStartCalls:1,
      externalRuntimeStopCalls:1,
      runtimeStartedByCheckpoint:true,
      runtimeWasRunningBeforeCheckpoint:false,
      normalRuntimeAllowed:false,
      observationSource:"AIO_V3.__operations",
    },
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
    normalRuntimeAllowed:false,
    authorityIssuedByHarness:false,
    externalRuntimeStartAuthorized:true,
    observationSource:"AIO_V3.__operations",
    ...overrides,
  };
}

function observability(overrides={}) {
  return {
    schemaVersion:1,
    status:"BEOBACHTUNG_BEREIT",
    blocker:[],
    activeAuthorityIds:["runtime:merchant"],
    missingRequiredAuthorityIds:[],
    unexpectedActiveAuthorityIds:[],
    authorityLeakCount:0,
    dashboardFehlerDiagnosticOnly:0,
    recorderDrops:0,
    operationsBackpressureAktiv:false,
    resourceMetricsComplete:true,
    dashboardFailureBlocksGameplay:false,
    observerActionAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function adapt({h=handoff(),live=liveResult(),obs=observability()}={}) {
  return adaptierePr21MerchantLiveResultFuerFreezeEvaluation({
    schemaVersion:1,
    sourceMainCommit:MAIN,
    packageId:"pkg-pr21-live-v1-0-2",
    createdAtMs:1000000,
    handoff:h,
    liveResult:live,
    finalObservability:obs,
  });
}

test("clean terminal v1.0.2 live result enters existing freeze/evaluation handoff",()=>{
  const result=adapt();
  assert.equal(result.status,"READY_FOR_EXPLICIT_MANUAL_RATIFICATION");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.liveEvidenceBound,true);
  assert.equal(result.externalRuntimeAuthorizationObserved,true);
  assert.equal(result.collectorOwnsRuntimeStartAuthority,false);
  assert.equal(result.collector.status,"ZIEL_ERREICHT_EINGEFROREN");
  assert.equal(result.collector.sampleAnzahl,181);
  assert.equal(result.collector.dauerMs,900000);
  assert.equal(result.collector.externalRuntimeStartAuthorized,false);
  assert.equal(result.freezeEvaluation.status,"READY_FOR_EXPLICIT_MANUAL_RATIFICATION");
  assert.equal(result.freezeEvaluation.runner.status,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(result.freezeEvaluation.resultPackage.status,"READY_FOR_MANUAL_RATIFICATION");
  assert.equal(result.freezeEvaluation.ratificationDraft.status,"AWAITING_EXPLICIT_RATIFICATION");
  assert.equal(result.automaticRatification,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("running or failed live result cannot be promoted into frozen evidence",()=>{
  const result=adapt({
    live:liveResult({
      status:"RUNNING",
      phase:"MERCHANT_INTEGRATION_15M",
      terminal:false,
      sampleCount:1,
      durationMs:0,
      completedAtMs:null,
      samples:[sample(0)],
      evidence:null,
    }),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_LIVE_RESULT_NICHT_TERMINAL_BESTANDEN"));
  assert.equal(result.freezeEvaluation,null);
  assert.equal(result.liveEvidenceBound,false);
});

test("wrong live test id or version is rejected before freeze evaluation",()=>{
  const result=adapt({
    live:liveResult({testId:"pr21-merchant-integration-live-15m-v1-0-1",version:"1.0.1"}),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_LIVE_RESULT_BINDING_DRIFT"));
  assert.equal(result.collector,null);
});

test("sample safety drift is fail closed",()=>{
  const samples=Array.from({length:181},(_,i)=>sample(i));
  samples[44]=sample(44,{authorityLeaks:1});
  const result=adapt({live:liveResult({samples})});
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_LIVE_RESULT_SAMPLE_UNGUELTIG"));
  assert.equal(result.freezeEvaluation,null);
});

test("external runtime lifecycle is validated but never copied into collector authority",()=>{
  const result=adapt({
    live:liveResult({
      evidence:{
        ...liveResult().evidence,
        externalRuntimeStartCalls:0,
        externalRuntimeStopCalls:0,
        runtimeStartedByCheckpoint:false,
        runtimeWasRunningBeforeCheckpoint:true,
      },
    }),
  });
  assert.equal(result.status,"READY_FOR_EXPLICIT_MANUAL_RATIFICATION");
  assert.equal(result.externalRuntimeAuthorizationObserved,true);
  assert.equal(result.collector.externalRuntimeStartAuthorized,false);
  assert.equal(result.collectorOwnsRuntimeStartAuthority,false);
});

test("missing final resource observability blocks result package creation",()=>{
  const result=adapt({
    obs:observability({
      status:"BLOCKIERT",
      blocker:["PR21_28_MILESTONE_RESOURCE_METRICS_UNVOLLSTAENDIG"],
      resourceMetricsComplete:false,
    }),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_FREEZE_EVAL_OBSERVABILITY_NICHT_BEREIT"));
  assert.equal(result.collector.status,"ZIEL_ERREICHT_EINGEFROREN");
  assert.equal(result.freezeEvaluation.status,"BLOCKIERT");
  assert.equal(result.freezeEvaluation.resultPackage,null);
});

test("contract remains evidence-only and cannot ratify or mutate gates",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-live-result-freeze-adapter.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_EVIDENCE_ONLY_WAITING_FOR_TERMINAL_LIVE_RESULT");
  assert.equal(contract.bindings.liveTestId,TEST_ID);
  assert.equal(contract.bindings.liveVersion,"1.0.2");
  assert.equal(contract.safety.automaticRatification,false);
  assert.equal(contract.safety.gateMutationAllowed,false);
  assert.equal(contract.safety.collectorRuntimeStartAuthority,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});
