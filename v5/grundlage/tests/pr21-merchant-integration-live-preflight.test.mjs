import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bauePr21_28CheckpointRunbook,
  bewertePr21MerchantLivePreflight,
} from "../../erzeugt/index.js";

const MAIN="dcf9f47b2d77fe85039838d2beb15e1cc23cb392";
const ALL_PR20=[
  "PR20.1","PR20.2","PR20.3","PR20.4","PR20.5",
  "PR20.6","PR20.7","PR20.8","PR20.9",
];

function merchantReadiness(overrides={}) {
  return {
    schemaVersion:1,
    status:"BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE",
    blocker:[],
    abgedeckteBereiche:[
      "BANK","COLLECTION","CRAFT","GEAR","MARKT","MLUCK",
      "PRODUCTION","RECOVERY","RENDEZVOUS","SUPPLY","TASK","WERTMUTATION",
    ],
    fehlendeBereiche:[],
    liveExecutionAllowed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function snapshot(overrides={}) {
  return {
    schemaVersion:1,
    mainCommit:MAIN,
    status:"TECHNICALLY_PREPARED_LIVE_EVIDENCE_PENDING",
    stages:[],
    checkpoints:[
      {checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",state:"NOT_READY"},
      {checkpointId:"POST_PR24_25_GROUP_CHECKPOINT",state:"NOT_READY"},
      {checkpointId:"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN",state:"NOT_READY"},
    ],
    highestPreparationCompleteStage:"PR28",
    highestProductiveEligibleStage:null,
    nextRequiredCheckpoint:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    liveEvidenceBoundaryReached:true,
    preparationThroughPr28Complete:true,
    cap022FullChainReady:true,
    cap022FullChainStatus:"CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
    cap022FullChainBlocker:[],
    cap022TerminalSettlementBindingsReady:false,
    cap022TerminalSettlementFingerprints:[],
    gateMutationPerformed:false,
    authorityIssued:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function request(overrides={}) {
  return {
    schemaVersion:1,
    currentMainCommit:MAIN,
    pinnedMainCommit:MAIN,
    merchantReadiness:merchantReadiness(),
    runbook:bauePr21_28CheckpointRunbook(
      "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    ),
    readinessSnapshot:snapshot(),
    ratifiedPr20Stages:ALL_PR20,
    ...overrides,
  };
}

test("clean PR21 preflight becomes ready but never authorizes runtime start",()=>{
  const result=bewertePr21MerchantLivePreflight(request());
  assert.equal(result.status,"PRECHECK_BEREIT_NO_START_AUTHORITY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.currentMainVerified,true);
  assert.equal(result.merchantReadinessSatisfied,true);
  assert.equal(result.checkpointBindingSatisfied,true);
  assert.equal(result.allPr20StagesRatified,true);
  assert.deepEqual(result.missingPr20Stages,[]);
  assert.equal(result.targetCheckpoint,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(result.targetDurationSeconds,900);
  assert.equal(result.separateExternalAuthorizationRequired,true);
  assert.equal(result.externalRuntimeStartAuthorized,false);
  assert.equal(result.runnerOwnsGameplayAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("current repository state remains blocked when PR20.9 is not ratified",()=>{
  const result=bewertePr21MerchantLivePreflight(request({
    ratifiedPr20Stages:ALL_PR20.slice(0,8),
  }));
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.allPr20StagesRatified,false);
  assert.deepEqual(result.missingPr20Stages,["PR20.9"]);
  assert.ok(result.blocker.includes(
    "PR21_LIVE_PREFLIGHT_PREDECESSOR_NOT_RATIFIED:PR20.9",
  ));
  assert.equal(result.externalRuntimeStartAuthorized,false);
});

test("main drift and checkpoint drift fail closed",()=>{
  const stale=bewertePr21MerchantLivePreflight(request({
    currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  }));
  assert.equal(stale.status,"BLOCKIERT");
  assert.equal(stale.currentMainVerified,false);
  assert.ok(stale.blocker.includes("PR21_LIVE_PREFLIGHT_MAIN_DRIFT"));

  const wrongCheckpoint=bewertePr21MerchantLivePreflight(request({
    readinessSnapshot:snapshot({
      nextRequiredCheckpoint:"POST_PR24_25_GROUP_CHECKPOINT",
    }),
  }));
  assert.equal(wrongCheckpoint.status,"BLOCKIERT");
  assert.equal(wrongCheckpoint.checkpointBindingSatisfied,false);
  assert.ok(wrongCheckpoint.blocker.includes(
    "PR21_LIVE_PREFLIGHT_CHECKPOINT_BINDING_UNGUELTIG",
  ));
});

test("blocked merchant readiness cannot pass live preflight",()=>{
  const result=bewertePr21MerchantLivePreflight(request({
    merchantReadiness:merchantReadiness({
      status:"BLOCKIERT",
      blocker:["PR21_NOTHALT_AKTIV"],
    }),
  }));
  assert.equal(result.status,"BLOCKIERT");
  assert.equal(result.merchantReadinessSatisfied,false);
  assert.ok(result.blocker.includes(
    "PR21_LIVE_PREFLIGHT_MERCHANT_READINESS_NICHT_BEREIT",
  ));
});

test("preflight rejects duplicate predecessor ratification declarations",()=>{
  assert.throws(
    ()=>bewertePr21MerchantLivePreflight(request({
      ratifiedPr20Stages:[...ALL_PR20,"PR20.9"],
    })),
    /PR21_LIVE_PREFLIGHT_PR20_STAGE_DOPPELT:PR20.9/,
  );
});

test("PR21 live preflight source contains no gameplay or runtime-start bypass",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-integration-live-preflight.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(","send_cm(","smart_move(","attack(","use_skill(","loot(",
    "respawn(","change_server(","craft(","exchange(","upgrade(","compound(",
    "START_EXTERNALLY_AUTHORIZED_RUNTIME_ONLY",
  ]){
    assert.equal(source.includes(marker),false,marker);
  }
});

test("PR21 live-preflight accepts explicit PR20.9 development override without runtime authority",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-integration-live-preflight.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_NO_WRITE_MANUAL_PR20_9_OVERRIDE");
  assert.deepEqual(contract.requiredProductiveRatifications,ALL_PR20);
  assert.equal(
    contract.currentRepositoryState.status,
    "PRECHECK_BEREIT_NO_START_AUTHORITY_MANUAL_PR20_9_OVERRIDE",
  );
  assert.deepEqual(contract.currentRepositoryState.missingRatifications,[]);
  assert.equal(contract.currentRepositoryState.manualPr20_9OverrideAccepted,true);
  assert.equal(contract.currentRepositoryState.liveCraftEvidenceSatisfied,false);
  assert.equal(contract.currentRepositoryState.externalRuntimeStartAuthorized,false);
  assert.equal(contract.safety.preflightIssuesAuthority,false);
  assert.equal(contract.safety.liveExecutionAllowedByPreflight,false);
  assert.equal(contract.safety.manualDevelopmentRatificationCredit,true);
  assert.equal(contract.safety.currentPr20_9RatificationCredit,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);

  const roadmap=JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  assert.equal(roadmap.currentStage,"PR21");
  assert.equal(roadmap.currentGate,"PR21_MERCHANT_INTEGRATION");
  assert.equal(roadmap.pr20_9.status,"MANUAL_OVERRIDE_BESTANDEN_FOR_DEVELOPMENT");
  assert.equal(roadmap.pr20_9.manualDevelopmentOverride.status,"BESTANDEN_MANUELL");
  assert.equal(roadmap.pr20_9.manualDevelopmentOverride.liveCraftEvidenceProduced,false);
  assert.equal(
    roadmap.pr21.livePreflight.status,
    "PRECHECK_BEREIT_NO_START_AUTHORITY_MANUAL_PR20_9_OVERRIDE",
  );
  assert.deepEqual(roadmap.pr21.livePreflight.missingRatifications,[]);
  assert.equal(roadmap.pr21.livePreflight.externalRuntimeStartAuthorized,false);
  assert.equal(roadmap.pr21.liveExecutionAllowed,false);
});
