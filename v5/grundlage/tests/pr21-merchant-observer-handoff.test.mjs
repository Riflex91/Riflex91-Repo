import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantCheckpointVor,
  bereitePr21MerchantObserverHandoffVor,
  bauePr21MerchantObserverRequest,
  bewertePr21_28MilestoneObservability,
} from "../../erzeugt/index.js";

const MAIN="9ad5ee1404908783d0c7b13c705239012abeee97";

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

function admission(overrides={}) {
  return bereitePr21MerchantCheckpointVor({
    schemaVersion:1,
    sourceMainCommit:MAIN,
    preflight:preflight(),
    pr20_9RatificationBasis:"MANUAL_DEVELOPMENT_OVERRIDE",
    manualOverrideEvidence:"v5/roadmap/pr20-9-craft-manual-development-override.json",
    liveCraftEvidenceSatisfied:false,
    ...overrides,
  });
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
    autoritaeten:[{
      schemaVersion:1,
      authorityId:"runtime:merchant",
      capabilityId:"merchant",
      ownerModulId:"merchant-runtime",
      aktiv:true,
      grund:"externally-authorized-checkpoint-runtime",
      policyId:"policy-pr21",
      evidenceIds:["pr21-checkpoint-runtime"],
      ressourcenIds:["merchant"],
      erwarteteWirkung:"merchant integration",
      ausgestelltAmMs:0,
      gueltigBisMs:999999999,
    }],
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
      dashboardFehler:2,
      verworfeneMetriken:0,
      actionAuthority:false,
    },
    operationsAktuell:true,
    bereit:true,
    actionAuthority:false,
    ...overrides,
  };
}

test("PR21 Merchant observer handoff binds exact 15m sampling boundary",()=>{
  const result=bereitePr21MerchantObserverHandoffVor(admission());
  assert.equal(result.status,"OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.sourceMainCommit,MAIN);
  assert.equal(result.checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(result.segmentId,"pr21-merchant-integration");
  assert.equal(result.milestoneArt,"MERCHANT_INTEGRATION_15M");
  assert.equal(result.stage,"PR21");
  assert.equal(result.minimumDurationSeconds,900);
  assert.equal(result.targetDurationSeconds,900);
  assert.equal(result.sampleIntervalMs,5000);
  assert.equal(result.maximumSampleGapMs,15000);
  assert.equal(result.expectedSamplesForTarget,181);
  assert.equal(result.maximumSamples,184);
  assert.deepEqual(result.requiredActiveAuthorityIds,["runtime:merchant"]);
  assert.deepEqual(result.allowedActiveAuthorityIds,["runtime:merchant"]);
  assert.equal(result.requiredHealthState,"GESUND");
  assert.equal(result.operationsMustBeCurrent,true);
  assert.deepEqual(
    result.operationsResourceMetricsRequired,
    ["ssdIoLatenzMs","ioQueueTiefe","freieBytes"],
  );
  assert.equal(result.recorderDropsAllowed,0);
  assert.equal(result.backpressureAllowed,false);
  assert.ok(result.abortSignals.includes("HEALTH_NOT_HEALTHY"));
  assert.ok(result.abortSignals.includes("OPERATIONS_STALE"));
  assert.ok(result.abortSignals.includes("UNEXPECTED_AUTHORITY"));
  assert.ok(result.abortSignals.includes("THRASH"));
  assert.ok(result.abortSignals.includes("PINGPONG"));
  assert.ok(result.abortSignals.includes("CRITICAL_STARVATION"));
});

test("observer handoff preserves manual PR20.9 boundary without inventing live Craft evidence",()=>{
  const result=bereitePr21MerchantObserverHandoffVor(admission());
  assert.equal(result.pr20_9RatificationBasis,"MANUAL_DEVELOPMENT_OVERRIDE");
  assert.equal(
    result.manualOverrideEvidence,
    "v5/roadmap/pr20-9-craft-manual-development-override.json",
  );
  assert.equal(result.liveCraftEvidenceSatisfied,false);
  assert.equal(result.manualOverrideExplicitlyDistinguishedFromLiveEvidence,true);
  assert.equal(result.observerOnly,true);
  assert.equal(result.observerActionAuthority,false);
  assert.equal(result.externalRuntimeStartAuthorized,false);
  assert.equal(result.separateExternalAuthorizationRequired,true);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("observer request bridges to existing milestone observability with strict runtime authority set",()=>{
  const handoff=bereitePr21MerchantObserverHandoffVor(admission());
  const request=bauePr21MerchantObserverRequest(handoff,supervisor());
  assert.deepEqual(request.requiredActiveAuthorityIds,["runtime:merchant"]);
  assert.deepEqual(request.allowedActiveAuthorityIds,["runtime:merchant"]);

  const ready=bewertePr21_28MilestoneObservability(request);
  assert.equal(ready.status,"BEOBACHTUNG_BEREIT");
  assert.deepEqual(ready.blocker,[]);
  assert.equal(ready.authorityLeakCount,0);
  assert.equal(ready.recorderDrops,0);
  assert.equal(ready.operationsBackpressureAktiv,false);
  assert.equal(ready.resourceMetricsComplete,true);
  assert.equal(ready.dashboardFehlerDiagnosticOnly,2);
  assert.equal(ready.observerActionAuthority,false);
  assert.equal(ready.gameplayAuthority,false);
  assert.equal(ready.rawWriteAuthority,false);
  assert.equal(ready.normalRuntimeAllowed,false);
});

test("missing or unexpected runtime authority blocks observer evaluation fail-closed",()=>{
  const handoff=bereitePr21MerchantObserverHandoffVor(admission());

  const missing=bewertePr21_28MilestoneObservability(
    bauePr21MerchantObserverRequest(
      handoff,
      supervisor({autoritaeten:[]}),
    ),
  );
  assert.equal(missing.status,"BLOCKIERT");
  assert.ok(missing.blocker.includes(
    "PR21_28_MILESTONE_REQUIRED_AUTHORITY_FEHLT",
  ));

  const unexpected=bewertePr21_28MilestoneObservability(
    bauePr21MerchantObserverRequest(
      handoff,
      supervisor({
        autoritaeten:[
          ...supervisor().autoritaeten,
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
      }),
    ),
  );
  assert.equal(unexpected.status,"BLOCKIERT");
  assert.ok(unexpected.blocker.includes(
    "PR21_28_MILESTONE_UNEXPECTED_AUTHORITY",
  ));
  assert.equal(unexpected.authorityLeakCount,1);
});

test("health, operations and resource telemetry failures remain fail-closed",()=>{
  const handoff=bereitePr21MerchantObserverHandoffVor(admission());
  const bad=supervisor({
    health:{
      zustand:"DEGRADIERT",
      fehlendeHealthIds:[],
      staleHealthIds:[],
      kritischeHealthIds:[],
      degradiertHealthIds:["bridge"],
      mutationErlaubt:false,
    },
    operations:{
      schemaVersion:1,
      metrik:{
        schemaVersion:1,
        zeitMs:1000,
        ssdIoLatenzMs:null,
        ioQueueTiefe:null,
        backpressureAktiv:true,
        freieBytes:null,
        recorderDrops:1,
      },
      dashboardFehler:0,
      verworfeneMetriken:0,
      actionAuthority:false,
    },
    operationsAktuell:false,
    bereit:false,
  });
  const result=bewertePr21_28MilestoneObservability(
    bauePr21MerchantObserverRequest(handoff,bad),
  );
  assert.equal(result.status,"BLOCKIERT");
  for(const blocker of [
    "PR21_28_MILESTONE_SUPERVISOR_NICHT_BEREIT",
    "PR21_28_MILESTONE_HEALTH_NICHT_GESUND",
    "PR21_28_MILESTONE_OPERATIONS_STALE",
    "PR21_28_MILESTONE_RECORDER_DROPS",
    "PR21_28_MILESTONE_BACKPRESSURE",
    "PR21_28_MILESTONE_RESOURCE_METRICS_UNVOLLSTAENDIG",
  ]) assert.ok(result.blocker.includes(blocker),blocker);
});

test("blocked checkpoint admission cannot produce a usable observer request",()=>{
  const blockedAdmission=admission({
    preflight:preflight({
      status:"BLOCKIERT",
      blocker:["PR21_LIVE_PREFLIGHT_MAIN_DRIFT"],
      currentMainVerified:false,
    }),
  });
  const handoff=bereitePr21MerchantObserverHandoffVor(blockedAdmission);
  assert.equal(handoff.status,"BLOCKIERT");
  assert.ok(handoff.blocker.includes(
    "PR21_MERCHANT_OBSERVER_CHECKPOINT_ADMISSION_NICHT_BEREIT",
  ));
  assert.throws(
    ()=>bauePr21MerchantObserverRequest(handoff,supervisor()),
    /PR21_MERCHANT_OBSERVER_HANDOFF_NICHT_BEREIT/,
  );
});

test("observer handoff contract remains no-write and no-start",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-observer-handoff.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_NO_WRITE_NO_START_AUTHORITY");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(contract.segment.minimumSeconds,900);
  assert.equal(contract.segment.targetSeconds,900);
  assert.equal(contract.segment.sampleIntervalMs,5000);
  assert.equal(contract.segment.maximumSampleGapMs,15000);
  assert.equal(contract.segment.expectedSamplesForTarget,181);
  assert.deepEqual(contract.observability.requiredActiveAuthorityIds,["runtime:merchant"]);
  assert.deepEqual(contract.observability.allowedActiveAuthorityIds,["runtime:merchant"]);
  assert.equal(contract.pr20_9Boundary.ratificationBasis,"MANUAL_DEVELOPMENT_OVERRIDE");
  assert.equal(contract.pr20_9Boundary.liveCraftEvidenceSatisfied,false);
  assert.equal(contract.safety.observerOnly,true);
  assert.equal(contract.safety.observerActionAuthority,false);
  assert.equal(contract.safety.externalRuntimeStartAuthorized,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("observer handoff source contains no gameplay or runtime-start operation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-observer-handoff.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","START_EXTERNALLY_AUTHORIZED_RUNTIME_ONLY",
  ]) assert.equal(source.includes(marker),false,marker);
});
