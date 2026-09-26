import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr21MerchantCheckpointVor,
  bereitePr21MerchantObserverHandoffVor,
  initialisierePr21MerchantSampleCollector,
  sammlePr21MerchantSample,
  bereitePr21MerchantFreezeEvaluationHandoffVor,
} from "../../erzeugt/index.js";

const MAIN="fb55619666d4c2c166bfc2a2c020d90bb37ec2cd";

function preflight() {
  return {
    schemaVersion:1,status:"PRECHECK_BEREIT_NO_START_AUTHORITY",blocker:[],
    currentMainVerified:true,merchantReadinessSatisfied:true,
    checkpointBindingSatisfied:true,allPr20StagesRatified:true,
    ratifiedPr20Stages:["PR20.1","PR20.2","PR20.3","PR20.4","PR20.5","PR20.6","PR20.7","PR20.8","PR20.9"],
    missingPr20Stages:[],
    targetCheckpoint:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    targetDurationSeconds:900,separateExternalAuthorizationRequired:true,
    externalRuntimeStartAuthorized:false,runnerOwnsGameplayAuthority:false,
    gameplayAuthority:false,rawWriteAuthority:false,normalRuntimeAllowed:false,
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

function supervisor() {
  return {
    schemaVersion:1,
    health:{zustand:"GESUND",fehlendeHealthIds:[],staleHealthIds:[],kritischeHealthIds:[],degradiertHealthIds:[],mutationErlaubt:true},
    autoritaeten:[{
      schemaVersion:1,authorityId:"runtime:merchant",capabilityId:"merchant",
      ownerModulId:"merchant-runtime",aktiv:true,grund:"externally-authorized-checkpoint-runtime",
      policyId:"policy-pr21",evidenceIds:["pr21-checkpoint-runtime"],ressourcenIds:["merchant"],
      erwarteteWirkung:"merchant integration",ausgestelltAmMs:0,gueltigBisMs:999999999,
    }],
    operations:{
      schemaVersion:1,
      metrik:{schemaVersion:1,zeitMs:1000,ssdIoLatenzMs:2,ioQueueTiefe:0,backpressureAktiv:false,freieBytes:1000000000,recorderDrops:0},
      dashboardFehler:0,verworfeneMetriken:0,actionAuthority:false,
    },
    operationsAktuell:true,bereit:true,actionAuthority:false,
  };
}

function counters() {
  return {
    unerwarteteGameplayWrites:0,duplicateIrreversibleEffects:0,safetyViolations:0,
    sameIntentRetries:0,unresolvedTransactions:0,restartRecoveryFailures:0,
    staleEvidenceActions:0,thrashEvents:0,pingpongEvents:0,starvationCriticalCount:0,
  };
}

function frozenCollector() {
  const h=handoff();
  let state=initialisierePr21MerchantSampleCollector(h);
  for(let t=0;t<=900000;t+=5000){
    state=sammlePr21MerchantSample(state,h,{
      schemaVersion:1,beobachtetAmMs:t,supervisor:supervisor(),counters:counters(),
    });
  }
  return {h,state};
}

function observability(overrides={}) {
  return {
    schemaVersion:1,status:"BEOBACHTUNG_BEREIT",blocker:[],
    activeAuthorityIds:["runtime:merchant"],missingRequiredAuthorityIds:[],
    unexpectedActiveAuthorityIds:[],authorityLeakCount:0,
    dashboardFehlerDiagnosticOnly:0,recorderDrops:0,
    operationsBackpressureAktiv:false,resourceMetricsComplete:true,
    dashboardFailureBlocksGameplay:false,observerActionAuthority:false,
    gameplayAuthority:false,rawWriteAuthority:false,normalRuntimeAllowed:false,
    ...overrides,
  };
}

test("clean frozen PR21 series produces result package and explicit ratification draft only",()=>{
  const {h,state}=frozenCollector();
  const result=bereitePr21MerchantFreezeEvaluationHandoffVor({
    schemaVersion:1,sourceMainCommit:MAIN,packageId:"pkg-pr21-merchant-15m",
    createdAtMs:1000000,handoff:h,collector:state,finalObservability:observability(),
  });
  assert.equal(result.status,"READY_FOR_EXPLICIT_MANUAL_RATIFICATION");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.runner.status,"EVIDENCE_READY_TARGET_REACHED");
  assert.equal(result.runner.sampleAnzahl,181);
  assert.equal(result.runner.sampleGaps,0);
  assert.equal(result.evidence.length,1);
  assert.equal(result.evidence[0].status,"EVIDENCE_RATIFIZIERBAR");
  assert.equal(result.resultPackage.status,"READY_FOR_MANUAL_RATIFICATION");
  assert.equal(result.ratificationDraft.status,"AWAITING_EXPLICIT_RATIFICATION");
  assert.match(result.ratificationDraft.requiredConfirmationText,/^RATIFY PR21-28 CHECKPOINT /);
  assert.equal(result.automaticRatification,false);
  assert.equal(result.gateMutationPerformed,false);
  assert.equal(result.authorityIssued,false);
  assert.equal(result.broadRuntimeGrant,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("non-frozen or incomplete collector cannot enter evaluation handoff",()=>{
  const h=handoff();
  const state=initialisierePr21MerchantSampleCollector(h);
  const result=bereitePr21MerchantFreezeEvaluationHandoffVor({
    schemaVersion:1,sourceMainCommit:MAIN,packageId:"pkg-blocked",
    createdAtMs:1,handoff:h,collector:state,finalObservability:observability(),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_FREEZE_EVAL_SAMPLE_SERIE_NICHT_BEREIT"));
  assert.equal(result.resultPackage,null);
  assert.equal(result.ratificationDraft,null);
});

test("blocked final observability cannot produce result package",()=>{
  const {h,state}=frozenCollector();
  const result=bereitePr21MerchantFreezeEvaluationHandoffVor({
    schemaVersion:1,sourceMainCommit:MAIN,packageId:"pkg-observer-blocked",
    createdAtMs:2,handoff:h,collector:state,
    finalObservability:observability({
      status:"BLOCKIERT",
      blocker:["PR21_28_MILESTONE_UNEXPECTED_AUTHORITY"],
      authorityLeakCount:1,
    }),
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_MERCHANT_FREEZE_EVAL_OBSERVABILITY_NICHT_BEREIT"));
  assert.equal(result.resultPackage,null);
});

test("freeze/evaluation contract forbids automatic ratification and gate mutation",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-freeze-evaluation-handoff.json","utf8",
  ));
  assert.equal(contract.status,"PREPARED_NO_WRITE_NO_AUTO_RATIFICATION");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.prerequisites.exactSamples,181);
  assert.equal(contract.prerequisites.minimumDurationMs,900000);
  assert.equal(contract.output.resultPackageStatus,"READY_FOR_MANUAL_RATIFICATION");
  assert.equal(contract.output.ratificationDraftStatus,"AWAITING_EXPLICIT_RATIFICATION");
  assert.equal(contract.output.explicitConfirmationRequired,true);
  assert.equal(contract.safety.automaticRatification,false);
  assert.equal(contract.safety.gateMutationPerformed,false);
  assert.equal(contract.safety.authorityIssued,false);
  assert.equal(contract.safety.broadRuntimeGrant,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("freeze/evaluation source contains no gameplay mutation or ratification execution",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-freeze-evaluation-handoff.ts","utf8",
  );
  for(const marker of [
    "ratifizierePr21_28ResultPackage(",
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(",
  ]) assert.equal(source.includes(marker),false,marker);
});
