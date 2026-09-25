import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));

test("PR20.8 fresh v1.0.5 rescan evidence is exact and persisted",()=>{
  assert.equal(evidence.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(evidence.evidenceArt,"V5_PR20_8_EXCHANGE_FRESH_READONLY_RESCAN_V1_0_5");
  assert.equal(evidence.manifestMainCommit,"ffb9f12c82d5f38f6b364b0340915003b196b68b");
  assert.equal(evidence.package.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.package.controllerVersion,"1.0.5");
  assert.equal(evidence.package.sourceCommit,"36bece2cc75854e7d02c6c8dc6ddaf75a74579cb");
  assert.equal(evidence.package.path,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.js");
  assert.equal(evidence.package.sha256,"e87996be9ee56b31f7737923b5bf8999a0a8af82393dea9419f5f4fd3d4b494e");
  assert.equal(evidence.package.bytes,21688);
  assert.equal(evidence.liveTelemetry.notificationId,2332);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790315652844);
  assert.equal(evidence.liveTelemetry.observedAtMs,1790315653250);
  assert.equal(evidence.liveTelemetry.completionNotificationPersisted,true);
  assert.equal(evidence.liveTelemetry.deploymentObservedViaStatusAndCompletion,true);
});

test("fresh post-Compound observation has no Compound or Exchange normal candidate",()=>{
  assert.equal(evidence.controller.status,"BLOCKIERT");
  assert.equal(evidence.controller.phase,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(evidence.controller.terminal,true);
  assert.deepEqual(evidence.controller.blocker,[
    "PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT",
  ]);
  assert.equal(evidence.controller.performanceTrickVerification,"HOWLER_PLAYING_TRUE");
  assert.equal(evidence.observations.upgrade.status,"KANDIDAT_GEFUNDEN");
  assert.equal(evidence.observations.upgrade.candidateCount,3);
  assert.equal(evidence.observations.upgrade.informationalOnly,true);
  assert.deepEqual(evidence.observations.upgrade.selected,{
    name:"gloves",
    level:0,
    index:13,
    scrollName:"scroll0",
    scrollQuantity:35,
    normalPathOnly:true,
  });
  assert.deepEqual(evidence.observations.compound,{
    status:"KEIN_KANDIDAT",
    candidateCount:0,
    selected:null,
  });
  assert.equal(evidence.observations.exchange.status,"KEIN_KANDIDAT");
  assert.equal(evidence.observations.exchange.candidateCount,0);
  assert.equal(evidence.observations.exchange.selected,null);
  assert.deepEqual(evidence.observations.exchange.rejected,[
    {name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"},
  ]);
});

test("fresh v1.0.5 rescan remains exactly zero-write and authority closed",()=>{
  assert.deepEqual(evidence.mutationCounters,{
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
  });
  assert.deepEqual(evidence.authority,{
    authorityIssued:false,
    durableIntentCreated:false,
    upgradeAuthority:false,
    compoundAuthority:false,
    exchangeAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
  });
  assert.equal(evidence.controller.normalRuntimeAllowed,false);
});

test("facade recovery changes no candidate or Bridge admission semantics",()=>{
  const r=evidence.facadeRecovery;
  assert.equal(r.recoveryControllerVersion,"1.0.5");
  assert.equal(r.staleFacadeHandshakeRecoveredBySuccessfulScannerExecution,true);
  assert.equal(r.candidatePolicyChanged,false);
  assert.equal(r.bridgeAdmissionChanged,false);
  assert.equal(r.rescanSemanticsChanged,false);
});

test("fresh no-candidate evidence does not satisfy Exchange or PR20.8 exit criteria",()=>{
  const x=evidence.exitBoundary;
  assert.equal(x.upgradeRatified,true);
  assert.equal(x.compoundRatified,true);
  assert.equal(x.compoundLive5mTested,true);
  assert.equal(x.exchangeRatified,false);
  assert.equal(x.exchangeLive5mTested,false);
  assert.equal(x.exchangeAutonomyProductiveProven,false);
  assert.equal(x.currentExitGateSatisfied,false);
  assert.equal(x.mayAdvanceToPr20_9,false);
  assert.equal(x.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(x.exchangeWriteAuthority,false);
  assert.equal(x.normalRuntimeAllowed,false);
  assert.equal(x.roadmapCriteriaRelaxed,false);
  assert.equal(evidence.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(evidence.nextAction,"PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
});

test("active manifest is the exact anniversarygift Exchange service mount",()=>{
  assert.equal(manifest.testId,"pr20-9-craft-durable-shadow-no-write");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"116d762a1e1fad230cbd64a5a44d6762465501f0");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr20-9-craft-durable-shadow-no-write-v1-0-0.js");
  assert.equal(manifest.packageSha256,"a384ce89e3d843b5a1d0fe24a1212f8c0ad9583a7598d570136601b7bb03325a");
  assert.equal(manifest.expectedGlobal,"V5PR209CraftDurableShadowNoWrite");
  assert.equal(manifest.normalRuntimeAllowed,false);
});
