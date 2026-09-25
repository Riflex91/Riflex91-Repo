import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bereitePr20_9CraftTeamRescanDurableAdmissionVor,
  persistierePr20_9CraftDurableShadow,
  pruefePr20_9CraftReadOnlyPreflight,
} from "../../erzeugt/index.js";

class MemorySpeicher {
  constructor() {
    this.rows = new Map();
    this.writes = [];
  }
  async schreibe(anfrage) {
    this.rows.set(anfrage.relativerPfad, anfrage.inhalt);
    this.writes.push({ ...anfrage });
  }
  async lies(pfad) {
    return this.rows.get(pfad);
  }
}

function preflightRequest(overrides={}) {
  return {
    schemaVersion:1,
    recipe:{
      schemaVersion:1,
      craftPath:"NORMAL",
      recipeKey:"iron-sword",
      outputName:"sword",
      outputLevel:0,
      outputMenge:1,
      goldKosten:100,
      inputs:[
        {name:"iron",level:0,menge:2},
        {name:"wood",level:0,menge:1},
      ],
      beobachtetAmMs:100,
      gueltigBisMs:1000,
      sourceSnapshotCommit:"0123456789abcdef0123456789abcdef01234567",
      fingerprint:"recipe-fp",
    },
    inventory:[
      {
        index:4,
        name:"iron",
        level:0,
        menge:2,
        locked:false,
        blocked:false,
        valueProtected:false,
        fingerprint:"iron-4-fp",
      },
      {
        index:7,
        name:"wood",
        level:0,
        menge:1,
        locked:false,
        blocked:false,
        valueProtected:false,
        fingerprint:"wood-7-fp",
      },
    ],
    gold:1000,
    freieSlots:1,
    workspaceNachweisFingerprint:"workspace-fp",
    reachability:{
      schemaVersion:1,
      erreichbar:true,
      gateRequired:false,
      gateFresh:true,
      beobachtetAmMs:100,
      gueltigBisMs:1000,
      fingerprint:"reachability-fp",
    },
    maximalesEvidenceAlterMs:1000,
    ...overrides,
  };
}

function readyTeamRescan(overrides={}) {
  const request=preflightRequest();
  const preflight=pruefePr20_9CraftReadOnlyPreflight(request,200);
  assert.equal(preflight.status,"BEREIT_NO_WRITE");
  return {
    schemaVersion:1,
    status:"TEAM_CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE",
    blocker:[],
    objectiveId:"prod-1:material:farm:1",
    batchId:"prod-1:material:farm:1:collection-batch",
    finalSettlementFingerprint:"settlement-final-fp",
    merchantInventoryFingerprint:"merchant-inventory-fp",
    allSettledVerified:true,
    allTransferIdsSettledInOrder:true,
    noActiveTransferVerified:true,
    finalMerchantBaselineVerified:true,
    postSettlementInventoryVerified:true,
    handedMaterialMatchesRecipeInput:true,
    preflight,
    candidateObserved:true,
    rescanTriggerEligible:true,
    currentPr20_9RatificationCredit:false,
    foundationCountsAsCraftRatification:false,
    productiveCraftAuthorityOpened:false,
    broadGraphExecutionAuthority:false,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    craftAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function fence(overrides={}) {
  return {
    schemaVersion:1,
    characterId:"merchant",
    sessionId:"merchant-session",
    serverRegion:"EU",
    serverIdentifier:"I",
    inventoryFingerprint:"merchant-inventory-fp",
    qFingerprint:"q-fp",
    resourceEpochen:{
      inventory:11,
      q:12,
      socketBudget:13,
      actionChannel:14,
    },
    beobachtetAmMs:180,
    gueltigBisMs:1000,
    offeneCraftAuthority:false,
    offeneCraftTransaktionId:null,
    ...overrides,
  };
}

function request(overrides={}) {
  return {
    schemaVersion:1,
    transaktionsId:"CRAFT-TX-TEAM-1",
    auftragId:"ORDER-TEAM-1",
    ablaufId:"FLOW-TEAM-1",
    teamRescan:readyTeamRescan(),
    craftPreflightRequest:preflightRequest(),
    fence:fence(),
    ...overrides,
  };
}

test("CAP-022 Team-Rescan Admission baut exakt gebundenen PR20.9 Durable-Shadow-Plan NO-WRITE",()=>{
  const result=bereitePr20_9CraftTeamRescanDurableAdmissionVor(request(),200);

  assert.equal(result.status,"TEAM_RESCAN_DURABLE_SHADOW_PLAN_BEREIT_NO_WRITE");
  assert.equal(result.objectiveId,"prod-1:material:farm:1");
  assert.equal(result.batchId,"prod-1:material:farm:1:collection-batch");
  assert.equal(result.transaktionsId,"CRAFT-TX-TEAM-1");
  assert.equal(result.teamRescanReadyVerified,true);
  assert.equal(result.preflightBindingVerified,true);
  assert.equal(result.currentFenceVerified,true);
  assert.equal(result.finalMerchantInventoryBindingVerified,true);
  assert.equal(result.durableShadowPersistenceEligible,true);

  assert.equal(result.plan.characterId,"merchant");
  assert.equal(result.plan.sessionId,"merchant-session");
  assert.equal(result.plan.serverRegion,"EU");
  assert.equal(result.plan.serverIdentifier,"I");
  assert.equal(result.plan.recipeKey,"iron-sword");
  assert.equal(result.plan.recipeFingerprint,"recipe-fp");
  assert.equal(result.plan.workspaceNachweisFingerprint,"workspace-fp");
  assert.equal(result.plan.inventoryFingerprint,"merchant-inventory-fp");
  assert.equal(result.plan.qFingerprint,"q-fp");
  assert.equal(result.plan.observedAtMs,180);
  assert.equal(result.plan.gueltigBisMs,1000);
  assert.deepEqual(
    result.plan.selectedInputs.map(x=>[
      x.name,x.inventoryIndex,x.verbrauchMenge,x.fingerprint,
    ]),
    [
      ["iron",4,2,"iron-4-fp"],
      ["wood",7,1,"wood-7-fp"],
    ],
  );
  assert.deepEqual(result.plan.resourceEpochen,{
    inventory:11,q:12,socketBudget:13,actionChannel:14,
  });

  assert.equal(result.snapshot.inventoryFingerprint,"merchant-inventory-fp");
  assert.equal(result.snapshot.qFingerprint,"q-fp");
  assert.equal(result.snapshot.offeneCraftAuthority,false);
  assert.equal(result.snapshot.offeneCraftTransaktionId,null);

  assert.equal(result.durableIntentCreated,false);
  assert.equal(result.persistenceWrites,0);
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.publicFunctionCalls,0);
  assert.equal(result.rawWriteCalls,0);
  assert.equal(result.currentPr20_9RatificationCredit,false);
  assert.equal(result.foundationCountsAsCraftRatification,false);
  assert.equal(result.productiveCraftAuthorityOpened,false);
  assert.equal(result.broadGraphExecutionAuthority,false);
  assert.equal(result.sameIntentRetry,false);
  assert.equal(result.craftAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("CAP-022 Admission-Ausgabe ist direkt mit bestehendem PR20.9 Durable-Shadow-Controller kompatibel",async()=>{
  const admission=bereitePr20_9CraftTeamRescanDurableAdmissionVor(
    request(),
    200,
  );
  const speicher=new MemorySpeicher();

  const durable=await persistierePr20_9CraftDurableShadow(
    admission.plan,
    admission.preflight,
    admission.snapshot,
    200,
    speicher,
  );

  assert.equal(durable.status,"DURABLE_SHADOW_BESTAETIGT_NO_WRITE");
  assert.equal(durable.createdThisRun,true);
  assert.equal(durable.persistenceWrites,1);
  assert.equal(durable.gameplayWrites,0);
  assert.equal(durable.publicFunctionCalls,0);
  assert.equal(durable.rawWriteCalls,0);
  assert.equal(durable.craftAuthority,false);
  assert.equal(durable.gameplayAuthority,false);
  assert.equal(durable.rawWriteAuthority,false);
  assert.equal(durable.broadGraphExecutionAuthority,false);
  assert.equal(durable.normalRuntimeAllowed,false);
  assert.equal(speicher.writes.length,1);
  assert.equal(speicher.writes[0].kritisch,true);
});

test("CAP-022 Admission blockiert nicht-bereiten oder authority-driftenden Team-Rescan",()=>{
  for(const drift of [
    {status:"TEAM_CRAFT_RESCAN_BLOCKIERT",candidateObserved:false},
    {currentPr20_9RatificationCredit:true},
    {productiveCraftAuthorityOpened:true},
    {craftAuthority:true},
    {gameplayWrites:1},
  ]) {
    assert.throws(
      ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
        request({teamRescan:readyTeamRescan(drift)}),
        200,
      ),
      /PR20_9_TEAM_RESCAN_ADMISSION_RESCAN_NICHT_BEREIT/,
      JSON.stringify(drift),
    );
  }
});

test("CAP-022 Admission verlangt exakte Original-Preflight-Bindung",()=>{
  const drift=preflightRequest({
    workspaceNachweisFingerprint:"workspace-other",
  });
  assert.throws(
    ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
      request({craftPreflightRequest:drift}),
      200,
    ),
    /PR20_9_TEAM_RESCAN_ADMISSION_PREFLIGHT_BINDUNG_DRIFT/,
  );
});

test("CAP-022 Admission bindet finalen Merchant-Inventar-Fingerprint exakt an Current-Fence",()=>{
  assert.throws(
    ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
      request({fence:fence({inventoryFingerprint:"inventory-drift"})}),
      200,
    ),
    /PR20_9_TEAM_RESCAN_ADMISSION_INVENTORY_BINDUNG_DRIFT/,
  );
});

test("CAP-022 Admission verbietet offene Craft-Authority oder offene Transaktion",()=>{
  assert.throws(
    ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
      request({fence:fence({offeneCraftAuthority:true})}),
      200,
    ),
    /PR20_9_TEAM_RESCAN_ADMISSION_OFFENE_CRAFT_AUTHORITY/,
  );
  assert.throws(
    ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
      request({fence:fence({offeneCraftTransaktionId:"OTHER"})}),
      200,
    ),
    /PR20_9_TEAM_RESCAN_ADMISSION_OFFENE_CRAFT_AUTHORITY/,
  );
});

test("CAP-022 Admission erzwingt frische maximal 1500ms Durable-Shadow-Plan-TTL",()=>{
  assert.throws(
    ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
      request({fence:fence({beobachtetAmMs:0,gueltigBisMs:2000})}),
      200,
    ),
    /PR20_9_TEAM_RESCAN_ADMISSION_PLAN_TTL_UNGUELTIG/,
  );

  assert.throws(
    ()=>bereitePr20_9CraftTeamRescanDurableAdmissionVor(
      request({fence:fence({gueltigBisMs:190})}),
      200,
    ),
    /PR20_9_TEAM_RESCAN_ADMISSION_FENCE_NICHT_FRISCH/,
  );
});

test("CAP-022 Team-Rescan Durable-Admission besitzt keinen direkten Gameplay-Write-Bypass",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/produktion/pr20-9-craft-team-rescan-durable-admission.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",
    ".socket.emit(",
    "send_item(",
    "send_cm(",
    "smart_move(",
    "attack(",
    "use_skill(",
    "loot(",
    "craft(",
    "exchange(",
    "upgrade(",
    "compound(",
    "speicher.schreibe(",
  ]) {
    assert.equal(source.includes(marker),false,marker);
  }
});
