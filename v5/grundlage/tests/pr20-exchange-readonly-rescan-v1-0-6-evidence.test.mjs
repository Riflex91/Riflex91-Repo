import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));

test("PR20.8 fresh v1.0.6 rescan evidence is exact and persisted",()=>{
  assert.equal(evidence.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(evidence.evidenceArt,"V5_PR20_8_EXCHANGE_FRESH_READONLY_RESCAN_V1_0_6");
  assert.equal(evidence.manifestMainCommit,"c83a83c25cc23ed9ff27b6ddf49217e7d30d372b");
  assert.equal(evidence.package.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.package.controllerVersion,"1.0.6");
  assert.equal(evidence.package.sourceCommit,"a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.equal(evidence.package.path,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js");
  assert.equal(evidence.package.sha256,"fb2395104beee0e611e5150c44183c95976eab188e451c23401271d1ae02e387");
  assert.equal(evidence.package.bytes,21688);
  assert.equal(evidence.liveTelemetry.notificationId,2382);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790318741735);
  assert.equal(evidence.liveTelemetry.observedAtMs,1790318742137);
  assert.equal(evidence.liveTelemetry.completionNotificationPersisted,true);
  assert.equal(evidence.liveTelemetry.deploymentObservedViaStatusAndCompletion,true);
  assert.equal(evidence.liveTelemetry.bridgeDeploymentState,"DEPLOYED");
  assert.equal(evidence.liveTelemetry.debugBatchForV1_0_6Observed,true);
  assert.equal(evidence.liveTelemetry.debugBatchId,8306);
});

test("fresh v1.0.6 observation still has no Compound or Exchange normal candidate",()=>{
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

test("fresh v1.0.6 rescan remains exactly zero-write and authority closed",()=>{
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

test("v1.0.6 is a read-only rescan epoch without policy or authority widening",()=>{
  const r=evidence.rescanEpoch;
  assert.equal(r.controllerVersion,"1.0.6");
  assert.equal(r.priorControllerVersion,"1.0.5");
  assert.equal(r.versionOnlyChangeFromPriorScanner,true);
  assert.equal(r.candidatePolicyChanged,false);
  assert.equal(r.bridgeAdmissionChanged,false);
  assert.equal(r.gameplayLogicChanged,false);
  assert.equal(r.rescanSemanticsChanged,false);
  assert.equal(r.safeSameTestBridgeUpgradeObserved,true);
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
  assert.equal(evidence.priorFreshReadonlyEvidence,
    "v5/roadmap/pr20-8-exchange-readonly-rescan-v1-0-5-evidence.json");
  assert.equal(evidence.outcome,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(evidence.nextAction,"PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
});

test("active manifest is the exact anniversarygift Exchange service mount",()=>{
  assert.equal(manifest.testId,"pr20-8-exchange-anniversarygift-live-5m");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"859c5be1067fbd5360c17ccfe0d912a98537bfc9");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr20-8-exchange-anniversarygift-live-5m-v1-0-0.js");
  assert.equal(manifest.packageSha256,"455593d7691dc5436af27a5b89afb5fc208f2ebca4253aa87d0726821abcda94");
  assert.equal(manifest.expectedGlobal,"V5PR208ExchangeAnniversarygiftLive5m");
  assert.equal(manifest.normalRuntimeAllowed,false);
});
