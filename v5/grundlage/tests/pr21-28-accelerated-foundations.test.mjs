import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bewertePr21MerchantIntegrationReadiness,
  pruefePr22CoordinationShadowAdmission,
  pruefePr23FarmerShadowAdmission,
  bewertePr24GruppenKonstellation,
  bauePr25GruppenLiveEvidencePlan,
  optimierePr26TaskParty,
  balancierePr27AccountProgression,
  pruefePr28WorldAutonomyGate,
} from "../../erzeugt/index.js";

const merchantBereiche=[
  "TASK","BANK","MARKT","SUPPLY","COLLECTION","RENDEZVOUS",
  "MLUCK","GEAR","WERTMUTATION","CRAFT","PRODUCTION","RECOVERY",
];

function merchantEvidence() {
  return merchantBereiche.map((bereich,index)=>({
    bereich,
    vorbereitet:true,
    evidenceFingerprint:"fp-"+bereich,
    beobachtetAmMs:100+index,
    gueltigBisMs:10_000,
    unerwarteteGameplayWrites:0,
    duplicateIrreversibleEffects:0,
    unresolvedTransactions:0,
    operatorRequiredTransactions:0,
    authorityLeaks:0,
  }));
}

test("PR21 Merchant integration readiness covers all required domains without opening runtime",()=>{
  const result=bewertePr21MerchantIntegrationReadiness({
    schemaVersion:1,
    evidence:merchantEvidence(),
    jetztMs:500,
    nothaltAktiv:false,
    capabilityDenyAktiv:false,
    irreversibleMutationInFlight:false,
    merchantThrashEvents:0,
    merchantPingpongEvents:0,
    starvationCriticalCount:0,
    sameIntentRetryCount:0,
  });
  assert.equal(result.status,"BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE");
  assert.equal(result.abgedeckteBereiche.length,12);
  assert.deepEqual(result.fehlendeBereiche,[]);
  assert.equal(result.liveExecutionAllowed,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("PR21 readiness blocks missing domain, thrash and unresolved non-operator transaction",()=>{
  const evidence=merchantEvidence().slice(0,-1);
  evidence[0]={...evidence[0],unresolvedTransactions:1};
  const result=bewertePr21MerchantIntegrationReadiness({
    schemaVersion:1,
    evidence,
    jetztMs:500,
    nothaltAktiv:false,
    capabilityDenyAktiv:false,
    irreversibleMutationInFlight:false,
    merchantThrashEvents:1,
    merchantPingpongEvents:0,
    starvationCriticalCount:0,
    sameIntentRetryCount:0,
  });
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR21_BEREICH_FEHLT:RECOVERY"));
  assert.ok(result.blocker.includes("PR21_MERCHANT_THRASH"));
  assert.ok(result.blocker.includes("PR21_UNRESOLVED_TRANSACTION:TASK"));
});

function coord(overrides={}) {
  return {
    schemaVersion:1,
    messageId:"msg-1",
    dedupeKey:"dedupe-1",
    workflowId:"wf-1",
    workflowRevision:4,
    senderCharacterId:"merchant",
    recipientCharacterId:"warrior",
    recipientSessionId:"warrior-session-2",
    serverRegion:"EU",
    serverIdentifier:"I",
    rosterEpoch:8,
    livenessEpoch:3,
    createdAtMs:100,
    expiresAtMs:1000,
    nowMs:200,
    senderTrusted:true,
    recipientRosterFresh:true,
    recipientLivenessFresh:true,
    sameServer:true,
    duplicateObserved:false,
    outOfOrderObserved:false,
    restartReconciled:true,
    priorTerminalSettlement:false,
    ...overrides,
  };
}

test("PR22 coordination admission remains transport-only and stale-safe",()=>{
  const ready=pruefePr22CoordinationShadowAdmission(coord());
  assert.equal(ready.status,"BEREIT_NO_WRITE");
  assert.equal(ready.sendCmAuthority,false);
  assert.equal(ready.gameplayAuthority,false);
  assert.equal(ready.rawWriteAuthority,false);
  assert.equal(ready.blindResumeAllowed,false);

  const stale=pruefePr22CoordinationShadowAdmission(coord({
    recipientLivenessFresh:false,
    duplicateObserved:true,
  }));
  assert.equal(stale.status,"BLOCKIERT");
  assert.ok(stale.blocker.includes("PR22_RECIPIENT_STALE"));
  assert.ok(stale.blocker.includes("PR22_DUPLICATE_DEDUPED"));
});

function farmer(overrides={}) {
  return {
    schemaVersion:1,
    action:"AOE",
    characterId:"mage",
    sessionFresh:true,
    rosterFresh:true,
    lifecycleAktiv:true,
    restartReconciled:true,
    movementOwnershipFresh:true,
    arrivalEvidenceFresh:true,
    targetOwnershipFresh:true,
    targetEvidenceFresh:true,
    skillEvidenceFresh:true,
    sharedCooldownReady:true,
    equipmentEvidenceFresh:true,
    conditionEvidenceFresh:true,
    lootEvidenceFresh:true,
    respawnEligible:false,
    hp:900,
    maxHp:1000,
    mp:800,
    maxMp:1000,
    aoeTargetCount:3,
    aoeExpectedDps:250,
    aoeMaxTargets:4,
    aoeMaxExpectedDps:400,
    aoeMinHpRatio:0.5,
    safetyPreempted:false,
    ...overrides,
  };
}

test("PR23 Farmer admission enforces AoE hard caps and never grants action authority",()=>{
  const ready=pruefePr23FarmerShadowAdmission(farmer());
  assert.equal(ready.status,"BEREIT_NO_WRITE",JSON.stringify(ready.blocker));
  assert.equal(ready.combatAuthority,false);
  assert.equal(ready.skillAuthority,false);
  assert.equal(ready.gameplayAuthority,false);

  const denied=pruefePr23FarmerShadowAdmission(farmer({
    aoeTargetCount:5,
    hp:400,
  }));
  assert.equal(denied.status,"BLOCKIERT");
  assert.ok(denied.blocker.includes("PR23_AOE_TARGET_HARD_CAP"));
  assert.ok(denied.blocker.includes("PR23_AOE_HP_HARD_CAP"));

  const movement=pruefePr23FarmerShadowAdmission(farmer({
    action:"MOVEMENT",
    arrivalEvidenceFresh:false,
  }));
  assert.equal(movement.status,"BEREIT_NO_WRITE");
});

test("PR24 group matrix never invents missing capability and invalidates stale members",()=>{
  const ready=bewertePr24GruppenKonstellation({
    schemaVersion:1,
    topologyId:"tank-heal-aoe",
    minMembers:3,
    maxMembers:3,
    requiredCapabilities:["TANK","HEAL","AOE"],
    members:[
      {characterId:"warrior",klasse:"warrior",sessionFresh:true,rosterFresh:true,lifecycleAktiv:true,capabilities:["TANK"],gearScore:10,level:60},
      {characterId:"priest",klasse:"priest",sessionFresh:true,rosterFresh:true,lifecycleAktiv:true,capabilities:["HEAL","REVIVE"],gearScore:10,level:60},
      {characterId:"mage",klasse:"mage",sessionFresh:true,rosterFresh:true,lifecycleAktiv:true,capabilities:["AOE"],gearScore:10,level:60},
    ],
    fremdesPartyMitgliedVorhanden:false,
    mapInstanceDrift:false,
    leaderMovementDrift:false,
    restartReconciled:true,
  });
  assert.equal(ready.status,"ZULAESSIG_NO_WRITE");
  assert.deepEqual(ready.fehlendeCapabilities,[]);
  assert.equal(ready.erfindetFehlendeCapability,false);

  const blocked=bewertePr24GruppenKonstellation({
    schemaVersion:1,
    topologyId:"tank-heal-aoe",
    minMembers:3,
    maxMembers:3,
    requiredCapabilities:["TANK","HEAL","AOE"],
    members:[
      {characterId:"warrior",klasse:"warrior",sessionFresh:true,rosterFresh:true,lifecycleAktiv:true,capabilities:["TANK"],gearScore:10,level:60},
      {characterId:"priest",klasse:"priest",sessionFresh:true,rosterFresh:true,lifecycleAktiv:false,capabilities:["HEAL"],gearScore:10,level:60},
      {characterId:"mage",klasse:"mage",sessionFresh:true,rosterFresh:true,lifecycleAktiv:true,capabilities:["AOE"],gearScore:10,level:60},
    ],
    fremdesPartyMitgliedVorhanden:false,
    mapInstanceDrift:false,
    leaderMovementDrift:false,
    restartReconciled:true,
  });
  assert.equal(blocked.status,"BLOCKIERT");
  assert.ok(blocked.fehlendeCapabilities.includes("HEAL"));
});

test("PR25 evidence planner batches capability 5m segments plus 15m integration",()=>{
  const plan=bauePr25GruppenLiveEvidencePlan({
    schemaVersion:1,
    topologyId:"tank-heal-aoe",
    capabilities:[
      {capabilityId:"movement",neuZuPruefen:true},
      {capabilityId:"aoe",neuZuPruefen:true},
      {capabilityId:"heal",neuZuPruefen:false},
    ],
    integrationRequired:true,
  });
  assert.equal(plan.status,"PLAN_BEREIT_NO_WRITE");
  assert.equal(plan.segmente.length,3);
  assert.equal(plan.gesamtDauerSekunden,1500);
  assert.equal(plan.segmente[0].dauerSekunden,300);
  assert.equal(plan.segmente[2].dauerSekunden,900);
  assert.equal(plan.liveExecutionAllowed,false);
});

test("PR26 optimizer hard-filters unsafe candidates before learning or ranking",()=>{
  const result=optimierePr26TaskParty({
    schemaVersion:1,
    candidates:[
      {
        candidateId:"unsafe",
        taskId:"boss",
        partyId:"p1",
        hardAllowed:false,
        safetyOk:true,
        worldEvidenceFresh:true,
        requiredCapabilities:["TANK"],
        availableCapabilities:["TANK"],
        successScore:100,
        realPerformanceScore:100,
        travelCost:0,
        resourceCost:0,
        learningScore:1000000,
        deterministicPriority:100,
      },
      {
        candidateId:"safe-b",
        taskId:"farm-b",
        partyId:"p2",
        hardAllowed:true,
        safetyOk:true,
        worldEvidenceFresh:true,
        requiredCapabilities:["AOE"],
        availableCapabilities:["AOE"],
        successScore:8,
        realPerformanceScore:7,
        travelCost:3,
        resourceCost:2,
        learningScore:10,
        deterministicPriority:1,
      },
      {
        candidateId:"missing-role",
        taskId:"farm-c",
        partyId:"p3",
        hardAllowed:true,
        safetyOk:true,
        worldEvidenceFresh:true,
        requiredCapabilities:["HEAL"],
        availableCapabilities:["AOE"],
        successScore:999,
        realPerformanceScore:999,
        travelCost:0,
        resourceCost:0,
        learningScore:100,
        deterministicPriority:99,
      },
    ],
  });
  assert.equal(result.status,"AUSWAHL_BEREIT_NO_WRITE");
  assert.equal(result.selected?.candidateId,"safe-b");
  assert.ok(result.rejectedCandidateIds.includes("unsafe"));
  assert.ok(result.rejectedCandidateIds.includes("missing-role"));
  assert.equal(result.learningKannHardFilterNichtLockern,true);
  assert.equal(result.executionAuthority,false);
});

test("PR27 progression balancer keeps safety first and protects mandatory roles",()=>{
  const result=balancierePr27AccountProgression({
    schemaVersion:1,
    targetCorridor:0.05,
    candidates:[
      {
        candidateId:"unsafe-weak",
        characterId:"rogue",
        hardAllowed:true,
        safetyOk:false,
        mandatoryRole:false,
        levelProgress:0.1,
        gearProgress:0.1,
        skillProgress:0.1,
        survivalPerformance:0.1,
        rolePerformance:0.1,
        trainingShare:0.1,
        baseTaskScore:100,
      },
      {
        candidateId:"required-tank",
        characterId:"warrior",
        hardAllowed:true,
        safetyOk:true,
        mandatoryRole:true,
        levelProgress:0.9,
        gearProgress:0.9,
        skillProgress:0.9,
        survivalPerformance:0.9,
        rolePerformance:0.9,
        trainingShare:0.9,
        baseTaskScore:1,
      },
      {
        candidateId:"weak-safe",
        characterId:"mage",
        hardAllowed:true,
        safetyOk:true,
        mandatoryRole:false,
        levelProgress:0.3,
        gearProgress:0.3,
        skillProgress:0.3,
        survivalPerformance:0.3,
        rolePerformance:0.3,
        trainingShare:0.2,
        baseTaskScore:1,
      },
    ],
  });
  assert.equal(result.selected?.candidateId,"required-tank");
  assert.ok(result.rejectedCandidateIds.includes("unsafe-weak"));
  assert.equal(result.safetyVorBalance,true);
  assert.equal(result.starkeCharaktereWerdenNichtGeschwaecht,true);
  assert.equal(result.executionAuthority,false);
});

function world(overrides={}) {
  return {
    schemaVersion:1,
    taskId:"world-task-1",
    art:"EVENT",
    optimizerCandidateAllowed:true,
    contentKnown:true,
    contentQuarantined:false,
    liveEvidenceFresh:true,
    definitionEvidenceFresh:true,
    eventQuestDriftStatus:"GUELTIG",
    rareBossTargetEvidenceFresh:true,
    serverHopRequired:false,
    serverHopEvidenceFresh:true,
    serverHopAllowed:true,
    targetServerModeKnown:true,
    pvpHardcorePolicyAllowsTarget:true,
    restartReconciled:true,
    ...overrides,
  };
}

test("PR28 World gate revalidates event/quest drift and keeps discovery observation-only",()=>{
  const ready=pruefePr28WorldAutonomyGate(world());
  assert.equal(ready.status,"PLAN_BEREIT_NO_WRITE");
  assert.equal(ready.worldActionAuthority,false);
  assert.equal(ready.serverHopAuthority,false);
  assert.equal(ready.gameplayAuthority,false);

  const drift=pruefePr28WorldAutonomyGate(world({
    eventQuestDriftStatus:"REPLAN_ERFORDERLICH",
  }));
  assert.equal(drift.status,"BLOCKIERT");
  assert.ok(drift.blocker.includes("PR28_EVENT_QUEST_DRIFT:REPLAN_ERFORDERLICH"));

  const discovery=pruefePr28WorldAutonomyGate(world({
    art:"DISCOVERY",
    contentKnown:false,
    contentQuarantined:true,
    eventQuestDriftStatus:"NICHT_ERFORDERLICH",
  }));
  assert.equal(discovery.status,"PLAN_BEREIT_NO_WRITE");
  assert.equal(discovery.discoveryKannQuarantaeneNichtFreigeben,true);

  const hop=pruefePr28WorldAutonomyGate(world({
    art:"SERVER_HOP",
    serverHopRequired:true,
    serverHopAllowed:false,
    targetServerModeKnown:false,
    eventQuestDriftStatus:"NICHT_ERFORDERLICH",
  }));
  assert.equal(hop.status,"BLOCKIERT");
  assert.ok(hop.blocker.includes("PR28_SERVER_HOP_POLICY_BLOCKIERT"));
  assert.ok(hop.blocker.includes("PR28_SERVER_MODUS_UNBEKANNT"));
});

test("PR21-28 accelerated foundations contain no direct gameplay mutation bypass",()=>{
  const paths=[
    "grundlage/quelle/merchant/pr21-merchant-integration-readiness.ts",
    "grundlage/quelle/koordination/pr22-coordination-shadow-admission.ts",
    "grundlage/quelle/farmer/pr23-farmer-shadow-admission.ts",
    "grundlage/quelle/gruppe/pr24-group-constellation-matrix.ts",
    "grundlage/quelle/gruppe/pr25-group-live-evidence-plan.ts",
    "grundlage/quelle/optimierung/pr26-task-party-optimizer.ts",
    "grundlage/quelle/optimierung/pr27-account-progression-balancer.ts",
    "grundlage/quelle/welt/pr28-world-autonomy-gate.ts",
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
