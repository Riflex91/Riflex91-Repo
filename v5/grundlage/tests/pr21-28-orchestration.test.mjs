import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bewertePr22ShadowWorkflow,
  bauePr24PflichtMatrix,
  wertePr25GruppenEvidenceAus,
  planePr26_28AutonomyShadow,
  orchestrierePr21_28ShadowPipeline,
} from "../../erzeugt/index.js";

test("PR22 shadow workflow models ACK and terminal settlement without send authority",()=>{
  const base={
    schemaVersion:1,
    messageId:"msg-1",
    workflowId:"wf-1",
    workflowRevision:3,
    admissionReady:true,
    ackObserved:false,
    settlementObserved:false,
    ackCorrelated:true,
    settlementCorrelated:true,
    ttlFresh:true,
    recipientFresh:true,
    restartObserved:false,
    restartReconciled:true,
  };
  const ackPending=bewertePr22ShadowWorkflow(base);
  assert.equal(ackPending.status,"ACK_AUSSTEHEND");
  assert.equal(ackPending.sendCmAuthority,false);
  assert.equal(ackPending.gameplayAuthority,false);

  const settlementPending=bewertePr22ShadowWorkflow({
    ...base,
    ackObserved:true,
  });
  assert.equal(settlementPending.status,"SETTLEMENT_AUSSTEHEND");

  const complete=bewertePr22ShadowWorkflow({
    ...base,
    ackObserved:true,
    settlementObserved:true,
  });
  assert.equal(complete.status,"ABGESCHLOSSEN");
  assert.equal(complete.settlementTerminal,true);
  assert.equal(complete.sameMessageIdAcrossRetry,true);
  assert.equal(complete.semanticRetryCreatesNewMessage,false);

  const stale=bewertePr22ShadowWorkflow({
    ...base,
    recipientFresh:false,
    restartObserved:true,
    restartReconciled:false,
  });
  assert.equal(stale.status,"BLOCKIERT");
  assert.ok(stale.blocker.includes("PR22_SHADOW_RECIPIENT_STALE"));
  assert.ok(stale.blocker.includes("PR22_SHADOW_RESTART_RECONCILIATION_FEHLT"));
});

test("PR24 mandatory matrix covers all topology classes with the full fault set",()=>{
  const matrix=bauePr24PflichtMatrix();
  assert.equal(matrix.length,14);
  const ids=new Set(matrix.map(x=>x.topologyId));
  for(const topology of [
    "solo","two-farmer","three-farmer","tank-heal","tank-dps",
    "tank-aoe","heal-dps","tank-heal-single","tank-heal-aoe",
    "multi-dps","duplicate-classes","without-tank","without-heal","without-aoe",
  ]) assert.ok(ids.has(topology),topology);

  for(const row of matrix){
    assert.equal(row.faults.length,17,row.topologyId);
    assert.ok(row.faults.includes("RESTART"));
    assert.ok(row.faults.includes("ROSTER_SESSION_DRIFT"));
    assert.ok(row.faults.includes("CAPABILITY_VERLUST"));
  }
});

test("PR25 evidence evaluator enforces 5m/15m durations and zero safety regressions",()=>{
  const passed=wertePr25GruppenEvidenceAus([
    {
      segmentId:"cap:aoe",
      art:"CAPABILITY_5M",
      dauerSekunden:300,
      unerwarteteGameplayWrites:0,
      duplicateIrreversibleEffects:0,
      safetyViolations:0,
      staleTargetActions:0,
      movementThrashEvents:0,
      unresolvedRecoveryCount:0,
      deaths:0,
      disconnectRejoinFailures:0,
      killrate:10,
      xpProMinute:1000,
    },
    {
      segmentId:"integration:tank-heal-aoe",
      art:"INTEGRATION_15M",
      dauerSekunden:900,
      unerwarteteGameplayWrites:0,
      duplicateIrreversibleEffects:0,
      safetyViolations:0,
      staleTargetActions:0,
      movementThrashEvents:0,
      unresolvedRecoveryCount:0,
      deaths:0,
      disconnectRejoinFailures:0,
      killrate:12,
      xpProMinute:1200,
    },
  ]);
  assert.equal(passed.status,"BESTANDEN");
  assert.equal(passed.capabilitySegmente,1);
  assert.equal(passed.integrationsSegmente,1);
  assert.equal(passed.gesamteDauerSekunden,1200);
  assert.equal(passed.liveEvidenceRatified,false);
  assert.equal(passed.productiveAuthority,false);

  const blocked=wertePr25GruppenEvidenceAus([
    {
      segmentId:"cap:movement",
      art:"CAPABILITY_5M",
      dauerSekunden:299,
      unerwarteteGameplayWrites:1,
      duplicateIrreversibleEffects:0,
      safetyViolations:1,
      staleTargetActions:1,
      movementThrashEvents:1,
      unresolvedRecoveryCount:1,
      deaths:0,
      disconnectRejoinFailures:1,
      killrate:0,
      xpProMinute:0,
    },
  ]);
  assert.equal(blocked.status,"BLOCKIERT");
  assert.ok(blocked.blocker.includes("PR25_CAPABILITY_DAUER_ZU_KURZ:cap:movement"));
  assert.ok(blocked.blocker.includes("PR25_UNERWARTETER_WRITE:cap:movement"));
  assert.ok(blocked.blocker.includes("PR25_INTEGRATION_SEGMENT_FEHLT"));
});

function optimizerResult(overrides={}) {
  return {
    schemaVersion:1,
    status:"AUSWAHL_BEREIT_NO_WRITE",
    selected:{
      candidateId:"candidate-1",
      taskId:"world-task-1",
      partyId:"party-1",
      score:100,
      learningContribution:5,
    },
    ranking:[],
    rejectedCandidateIds:[],
    learningKannHardFilterNichtLockern:true,
    deterministicFallbackVorhanden:true,
    executionAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function progressionResult(overrides={}) {
  return {
    schemaVersion:1,
    status:"AUSWAHL_BEREIT_NO_WRITE",
    selected:{
      candidateId:"progression-1",
      characterId:"mage",
      score:10,
      weaknessBoost:0.2,
      mandatoryRoleProtected:false,
    },
    ranking:[],
    rejectedCandidateIds:[],
    safetyVorBalance:true,
    starkeCharaktereWerdenNichtGeschwaecht:true,
    progressionStarvationGuard:true,
    executionAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function worldResult(overrides={}) {
  return {
    schemaVersion:1,
    status:"PLAN_BEREIT_NO_WRITE",
    blocker:[],
    taskId:"world-task-1",
    art:"EVENT",
    discoveryKannQuarantaeneNichtFreigeben:true,
    worldActionAuthority:false,
    serverHopAuthority:false,
    movementAuthority:false,
    combatAuthority:false,
    merchantAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

test("PR26-28 autonomy shadow binds optimizer, progression and world plan without authority",()=>{
  const ready=planePr26_28AutonomyShadow({
    schemaVersion:1,
    optimizer:optimizerResult(),
    progression:progressionResult(),
    world:worldResult(),
    expectedTaskId:"world-task-1",
    expectedPartyId:"party-1",
    expectedCharacterId:"mage",
    worldTaskRequired:true,
  });
  assert.equal(ready.status,"PLAN_BEREIT_NO_WRITE");
  assert.equal(ready.taskId,"world-task-1");
  assert.equal(ready.partyId,"party-1");
  assert.equal(ready.progressionCharacterId,"mage");
  assert.equal(ready.learningCanRelaxHardFilter,false);
  assert.equal(ready.safetyBeforeProgression,true);
  assert.equal(ready.worldRevalidationBeforeAction,true);
  assert.equal(ready.executionAuthority,false);
  assert.equal(ready.gameplayAuthority,false);
  assert.equal(ready.rawWriteAuthority,false);

  const drift=planePr26_28AutonomyShadow({
    schemaVersion:1,
    optimizer:optimizerResult(),
    progression:progressionResult(),
    world:worldResult({taskId:"other-task"}),
    expectedTaskId:"world-task-1",
    expectedPartyId:"party-1",
    expectedCharacterId:"mage",
    worldTaskRequired:true,
  });
  assert.equal(drift.status,"BLOCKIERT");
  assert.ok(drift.blocker.includes("PR26_28_WORLD_TASK_BINDING_DRIFT"));
});


function cap022FoundationChain(overrides={}) {
  const ids=[
    "MATERIAL_ACQUISITION",
    "MATERIAL_HANDOFF",
    "POST_SETTLEMENT_CRAFT_RESCAN",
    "PERSISTENT_LIFECYCLE",
    "TEAM_MATERIAL_OBJECTIVE",
    "TEAM_COLLECTION_HANDOFF",
    "TEAM_BATCH_SETTLEMENT_RECOVERY",
    "TEAM_ALL_SETTLED_CRAFT_RESCAN",
    "TEAM_RESCAN_DURABLE_ADMISSION",
  ];
  return {
    schemaVersion:1,
    foundations:ids.map(id=>({
      schemaVersion:1,
      id,
      status:"PREPARED_NO_WRITE",
      productiveExecutionAllowed:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    })),
    currentPr20_9RatificationCredit:false,
    candidateAcquisitionOrMutationAllowedNow:false,
    durableIntentCreated:false,
    productiveCraftAuthorityOpened:false,
    ...overrides,
  };
}

function orchestrationRequest(overrides={}) {
  return {
    schemaVersion:1,
    pr20ProductiveComplete:false,
    materialAcquisition:{
      schemaVersion:1,
      status:"KEIN_FARM_BEDARF",
      produktionsId:"prod-material-shadow",
      ablaufId:"workflow-material-shadow",
      ziele:[],
      blocker:[],
      pr22ProduktivGateErforderlich:true,
      pr23ProduktivGateErforderlich:true,
      currentPr20_9CandidateAcquisitionAllowed:false,
      planningOnly:true,
      ausfuehrungsAutoritaet:false,
      gameplayAutoritaet:false,
      rawWriteAutoritaet:false,
      normalRuntimeAllowed:false,
    },
    materialFoundationChain:cap022FoundationChain(),
    pr21:{
      schemaVersion:1,
      status:"BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE",
      blocker:[],
      abgedeckteBereiche:[],
      fehlendeBereiche:[],
      liveExecutionAllowed:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    },
    pr22:{
      schemaVersion:1,
      status:"BEREIT_NO_WRITE",
      blocker:[],
      messageId:"m",
      workflowId:"w",
      workflowRevision:1,
      sendCmAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      staleCharacterAuthority:false,
      blindResumeAllowed:false,
      normalRuntimeAllowed:false,
    },
    pr23:{
      schemaVersion:1,
      action:"AOE",
      status:"BEREIT_NO_WRITE",
      blocker:[],
      movementAuthority:false,
      combatAuthority:false,
      skillAuthority:false,
      lootAuthority:false,
      respawnAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      blindResumeAllowed:false,
      normalRuntimeAllowed:false,
    },
    pr24:{
      schemaVersion:1,
      status:"ZULAESSIG_NO_WRITE",
      blocker:[],
      vorhandeneCapabilities:["TANK","HEAL","AOE"],
      fehlendeCapabilities:[],
      activeMemberIds:["warrior","priest","mage"],
      erfindetFehlendeCapability:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    },
    pr25:{
      schemaVersion:1,
      status:"PLAN_BEREIT_NO_WRITE",
      topologyId:"tank-heal-aoe",
      segmente:[{
        segmentId:"integration:tank-heal-aoe",
        art:"INTEGRATION_15M",
        capabilityId:null,
        dauerSekunden:900,
        erwarteteGameplayWrites:"NUR_RATIFIZIERTE_CAPABILITIES",
        unerwarteteGameplayWritesErlaubt:false,
        safetyViolationErlaubt:false,
      }],
      gesamtDauerSekunden:900,
      liveExecutionAllowed:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    },
    pr26:optimizerResult(),
    pr27:progressionResult(),
    pr28:worldResult(),
    ...overrides,
  };
}

test("PR21-28 orchestrator connects every foundation while productive dependency gates stay closed",()=>{
  const result=orchestrierePr21_28ShadowPipeline(orchestrationRequest());
  assert.equal(result.status,"SHADOW_PIPELINE_BEREIT_NO_WRITE");
  assert.equal(result.allFoundationsConnected,true);
  assert.equal(result.materialAcquisitionFoundationReady,true);
  assert.equal(result.materialFoundationChainReady,true);
  assert.equal(result.materialFoundationChainStatus,"CAP022_FULL_CHAIN_BEREIT_NO_WRITE");
  assert.deepEqual(result.materialFoundationChainBlocker,[]);
  assert.equal(result.materialAcquisitionProductiveExecutionAllowed,false);
  assert.equal(result.highestPreparedStage,"PR28");
  assert.equal(result.stages.length,8);
  assert.equal(result.stages[0].productiveDependencySatisfied,false);
  assert.ok(result.stages.every(x=>x.productiveExecutionAllowed===false));
  assert.equal(result.deferredLiveEvidenceRequired,true);
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.publicFunctionCalls,0);
  assert.equal(result.rawWriteCalls,0);
  assert.equal(result.normalRuntimeAllowed,false);

  const blocked=orchestrierePr21_28ShadowPipeline(orchestrationRequest({
    pr28:worldResult({status:"BLOCKIERT",blocker:["drift"]}),
  }));
  assert.equal(blocked.status,"BLOCKIERT");
  assert.equal(blocked.highestPreparedStage,"PR27");
  assert.ok(blocked.blocker.includes("PR21_28_FOUNDATION_BLOCKIERT:PR28"));

  const materialBlocked=orchestrierePr21_28ShadowPipeline(orchestrationRequest({
    materialAcquisition:{
      ...orchestrationRequest().materialAcquisition,
      status:"BLOCKIERT",
      blocker:["CAP022_FARMER_FEHLT_ODER_STALE:farm:1"],
    },
  }));
  assert.equal(materialBlocked.status,"BLOCKIERT");
  assert.equal(materialBlocked.materialAcquisitionFoundationReady,false);
  assert.equal(materialBlocked.materialAcquisitionProductiveExecutionAllowed,false);
  assert.ok(materialBlocked.blocker.includes(
    "PR21_28_FOUNDATION_BLOCKIERT:CAP022_MATERIAL_ACQUISITION",
  ));

  const chainMissing=cap022FoundationChain();
  const fullChainBlocked=orchestrierePr21_28ShadowPipeline(orchestrationRequest({
    materialFoundationChain:{
      ...chainMissing,
      foundations:chainMissing.foundations.filter(
        x=>x.id!=="TEAM_RESCAN_DURABLE_ADMISSION",
      ),
    },
  }));
  assert.equal(fullChainBlocked.status,"BLOCKIERT");
  assert.equal(fullChainBlocked.materialFoundationChainReady,false);
  assert.equal(fullChainBlocked.materialFoundationChainStatus,"BLOCKIERT");
  assert.ok(fullChainBlocked.blocker.includes(
    "PR21_28_FOUNDATION_BLOCKIERT:CAP022_FULL_CHAIN",
  ));
  assert.ok(fullChainBlocked.blocker.includes(
    "PR21_28_CAP022_CHAIN:CAP022_CHAIN_FOUNDATION_FEHLT:TEAM_RESCAN_DURABLE_ADMISSION",
  ));

  const chainDrift=cap022FoundationChain();
  const authorityBlocked=orchestrierePr21_28ShadowPipeline(orchestrationRequest({
    materialFoundationChain:{
      ...chainDrift,
      foundations:chainDrift.foundations.map(x=>
        x.id==="TEAM_BATCH_SETTLEMENT_RECOVERY"
          ? {...x,status:"BLOCKIERT"}
          : x),
    },
  }));
  assert.equal(authorityBlocked.status,"BLOCKIERT");
  assert.equal(authorityBlocked.materialFoundationChainReady,false);
  assert.ok(authorityBlocked.blocker.includes(
    "PR21_28_CAP022_CHAIN:CAP022_CHAIN_FOUNDATION_BLOCKIERT:TEAM_BATCH_SETTLEMENT_RECOVERY",
  ));
});

test("PR21-28 orchestration batch contains no direct gameplay mutation bypass",()=>{
  const paths=[
    "grundlage/quelle/runtime/pr21-28-shadow-orchestrator.ts",
    "grundlage/quelle/koordination/pr22-coordination-shadow-workflow.ts",
    "grundlage/quelle/koordination/production-material-acquisition.ts",
    "grundlage/quelle/gruppe/pr24-25-group-validation-suite.ts",
    "grundlage/quelle/optimierung/pr26-28-autonomy-shadow-plan.ts",
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
