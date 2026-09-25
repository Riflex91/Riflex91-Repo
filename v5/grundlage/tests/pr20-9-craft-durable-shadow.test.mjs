import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  persistierePr20_9CraftDurableShadow,
  pruefePr20_9CraftReadOnlyPreflight,
} from "../../erzeugt/index.js";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-preparation.json",
  "utf8",
));
const source=fs.readFileSync(
  "grundlage/quelle/produktion/pr20-9-craft-durable-shadow.ts",
  "utf8",
);
const roadmap=JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));
const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/merchant-remaining-production-preparation.json",
  "utf8",
));

class MemorySpeicher {
  constructor({dropReadback=false}={}) {
    this.rows=new Map();
    this.writes=[];
    this.dropReadback=dropReadback;
  }
  async schreibe(anfrage) {
    this.writes.push(anfrage);
    this.rows.set(anfrage.relativerPfad,anfrage.inhalt);
  }
  async lies(pfad) {
    if(this.dropReadback) return undefined;
    return this.rows.get(pfad);
  }
}

function recipe(overrides={}) {
  return {
    schemaVersion:1,
    craftPath:"NORMAL",
    recipeKey:"iron-sword",
    outputName:"sword",
    outputLevel:0,
    outputMenge:1,
    goldKosten:1000,
    inputs:[
      {name:"iron",level:0,menge:2},
      {name:"wood",level:0,menge:1},
    ],
    beobachtetAmMs:100,
    gueltigBisMs:1000,
    sourceSnapshotCommit:"ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4",
    fingerprint:"recipe-fp",
    ...overrides,
  };
}

function reachability(overrides={}) {
  return {
    schemaVersion:1,
    erreichbar:true,
    gateRequired:false,
    gateFresh:true,
    beobachtetAmMs:100,
    gueltigBisMs:1000,
    fingerprint:"reachability-fp",
    ...overrides,
  };
}

function item(index,name,menge,overrides={}) {
  return {
    index,name,level:0,menge,
    locked:false,
    blocked:false,
    valueProtected:false,
    fingerprint:`${name}-${index}-fp`,
    ...overrides,
  };
}

function preflightRequest(overrides={}) {
  return {
    schemaVersion:1,
    recipe:recipe(),
    inventory:[item(4,"iron",2),item(7,"wood",1)],
    gold:5000,
    freieSlots:0,
    workspaceNachweisFingerprint:"workspace-fp",
    reachability:reachability(),
    maximalesEvidenceAlterMs:1000,
    ...overrides,
  };
}

function preflight(overrides={}) {
  return pruefePr20_9CraftReadOnlyPreflight(
    preflightRequest(overrides),
    200,
  );
}

function epochs(overrides={}) {
  return {
    inventory:11,
    q:12,
    socketBudget:13,
    actionChannel:14,
    ...overrides,
  };
}

function plan(overrides={}) {
  return {
    schemaVersion:1,
    transaktionsId:"CRAFT-TX-1",
    auftragId:"ORDER-1",
    ablaufId:"FLOW-1",
    characterId:"My_Merchant",
    sessionId:"My_Merchant",
    serverRegion:"EU",
    serverIdentifier:"I",
    recipeKey:"iron-sword",
    outputName:"sword",
    outputLevel:0,
    outputMenge:1,
    recipeFingerprint:"recipe-fp",
    workspaceNachweisFingerprint:"workspace-fp",
    inventoryFingerprint:"inventory-fp",
    qFingerprint:"q-fp",
    selectedInputs:[
      {
        name:"iron",
        level:0,
        inventoryIndex:4,
        verbrauchMenge:2,
        fingerprint:"iron-4-fp",
      },
      {
        name:"wood",
        level:0,
        inventoryIndex:7,
        verbrauchMenge:1,
        fingerprint:"wood-7-fp",
      },
    ],
    resourceEpochen:epochs(),
    observedAtMs:100,
    gueltigBisMs:1000,
    ...overrides,
  };
}

function snapshot(overrides={}) {
  const p=plan();
  return {
    schemaVersion:1,
    characterId:p.characterId,
    sessionId:p.sessionId,
    serverRegion:p.serverRegion,
    serverIdentifier:p.serverIdentifier,
    recipeFingerprint:p.recipeFingerprint,
    workspaceNachweisFingerprint:p.workspaceNachweisFingerprint,
    inventoryFingerprint:p.inventoryFingerprint,
    qFingerprint:p.qFingerprint,
    selectedInputs:p.selectedInputs,
    resourceEpochen:p.resourceEpochen,
    offeneCraftAuthority:false,
    offeneCraftTransaktionId:null,
    ...overrides,
  };
}

test("PR20.9 Craft durable shadow persists one exact terminal no-send intent",async()=>{
  const speicher=new MemorySpeicher();
  const result=await persistierePr20_9CraftDurableShadow(
    plan(),preflight(),snapshot(),200,speicher,
  );

  assert.equal(result.status,"DURABLE_SHADOW_BESTAETIGT_NO_WRITE");
  assert.equal(result.durableReadback,true);
  assert.equal(result.createdThisRun,true);
  assert.equal(result.recoveredExistingTerminal,false);
  assert.equal(result.persistenceWrites,1);
  assert.equal(result.journalTerminalArt,"ABBRUCH");
  assert.equal(result.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(result.reconciliationClassification,"NOT_APPLIED");
  assert.equal(result.sameIntentRetry,false);
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.publicFunctionCalls,0);
  assert.equal(result.rawWriteCalls,0);
  assert.equal(result.craftAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.broadGraphExecutionAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);

  assert.equal(speicher.writes.length,1);
  assert.equal(speicher.writes[0].kritisch,true);
  assert.equal(
    speicher.writes[0].relativerPfad,
    "produktion/pr20-9/craft-shadow/CRAFT-TX-1.json",
  );
  const durable=JSON.parse(speicher.writes[0].inhalt);
  assert.equal(
    durable.art,
    "PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE",
  );
  assert.equal(durable.actionContractId,"AL-ACTION-CRAFT");
  assert.equal(durable.recoveryContractId,"AL-RECOVERY-CRAFT");
  assert.equal(durable.verifierId,"AL-VERIFIER-CRAFT");
  assert.equal(durable.publicFunction,"craft");
  assert.equal(durable.craftPath,"NORMAL");
  assert.equal(durable.recipeFingerprint,"recipe-fp");
  assert.equal(durable.workspaceNachweisFingerprint,"workspace-fp");
  assert.deepEqual(
    durable.selectedInputs.map(x=>[x.inventoryIndex,x.fingerprint]),
    [[4,"iron-4-fp"],[7,"wood-7-fp"]],
  );
  assert.deepEqual(durable.resourceEpochen,epochs());
  assert.equal(durable.journalTerminalArt,"ABBRUCH");
  assert.equal(durable.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(durable.reconciliationClassification,"NOT_APPLIED");
  assert.equal(durable.sameIntentRetry,false);
  assert.equal(durable.craftAuthority,false);
  assert.equal(durable.gameplayAuthority,false);
  assert.equal(durable.rawWriteAuthority,false);
  assert.equal(durable.broadGraphExecutionAuthority,false);
  assert.equal(durable.normalRuntimeAllowed,false);
});

test("PR20.9 exact terminal Craft shadow is recovered after restart without rewrite",async()=>{
  const speicher=new MemorySpeicher();
  const first=await persistierePr20_9CraftDurableShadow(
    plan(),preflight(),snapshot(),200,speicher,
  );
  assert.equal(first.createdThisRun,true);
  assert.equal(speicher.writes.length,1);

  const second=await persistierePr20_9CraftDurableShadow(
    plan(),preflight(),snapshot(),5000,speicher,
  );
  assert.equal(second.createdThisRun,false);
  assert.equal(second.recoveredExistingTerminal,true);
  assert.equal(second.persistenceWrites,0);
  assert.equal(speicher.writes.length,1);
  assert.equal(second.gameplayWrites,0);
  assert.equal(second.craftAuthority,false);
});

test("PR20.9 Craft shadow blocks Current-Fence drift before persistence",async()=>{
  const drifts=[
    {sessionId:"other"},
    {recipeFingerprint:"recipe-drift"},
    {inventoryFingerprint:"inventory-drift"},
    {qFingerprint:"q-drift"},
    {resourceEpochen:epochs({inventory:99})},
    {offeneCraftAuthority:true},
    {offeneCraftTransaktionId:"OTHER-TX"},
  ];
  for(const drift of drifts) {
    const speicher=new MemorySpeicher();
    await assert.rejects(
      () => persistierePr20_9CraftDurableShadow(
        plan(),preflight(),snapshot(drift),200,speicher,
      ),
      /PR20_9_CRAFT_SHADOW_CURRENT_FENCE_BLOCKIERT/,
    );
    assert.equal(speicher.writes.length,0,JSON.stringify(drift));
  }
});

test("PR20.9 Craft shadow blocks preflight drift before persistence",async()=>{
  const speicher=new MemorySpeicher();
  const blocked=preflight({gold:0});
  assert.equal(blocked.status,"BLOCKIERT");
  await assert.rejects(
    () => persistierePr20_9CraftDurableShadow(
      plan(),blocked,snapshot(),200,speicher,
    ),
    /PR20_9_CRAFT_SHADOW_PREFLIGHT_DRIFT/,
  );
  assert.equal(speicher.writes.length,0);
});

test("PR20.9 Craft shadow rejects conflicting pre-existing intent without overwrite",async()=>{
  const speicher=new MemorySpeicher();
  const path="produktion/pr20-9/craft-shadow/CRAFT-TX-1.json";
  speicher.rows.set(path,JSON.stringify({
    schemaVersion:1,
    art:"PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE",
    transaktionsId:"CRAFT-TX-1",
    recipeFingerprint:"OTHER",
    journalTerminalArt:"ABBRUCH",
    sendBoundaryState:"NICHT_GESENDET",
  }));
  await assert.rejects(
    () => persistierePr20_9CraftDurableShadow(
      plan(),preflight(),snapshot(),200,speicher,
    ),
    /PR20_9_CRAFT_SHADOW_EXISTING_INTENT_DRIFT/,
  );
  assert.equal(speicher.writes.length,0);
});

test("PR20.9 Craft shadow requires durable readback",async()=>{
  const speicher=new MemorySpeicher({dropReadback:true});
  await assert.rejects(
    () => persistierePr20_9CraftDurableShadow(
      plan(),preflight(),snapshot(),200,speicher,
    ),
    /PR20_9_CRAFT_SHADOW_DURABLE_READBACK_FEHLT/,
  );
  assert.equal(speicher.writes.length,1);
  assert.equal(speicher.writes[0].kritisch,true);
});

test("PR20.9 Craft durable shadow contract stays terminal and authority-free",()=>{
  assert.equal(contract.status,"FOUNDATION_BEREIT_NO_WRITE");
  assert.equal(contract.scope,"NORMAL_CRAFT_ONLY");
  assert.equal(contract.preconditions.readOnlyPreflightRequired,true);
  assert.equal(contract.preconditions.exactCurrentFenceRequired,true);
  assert.equal(contract.preconditions.maximumPlanTtlMs,1500);
  assert.equal(contract.durableShadow.exactReadbackRequired,true);
  assert.equal(contract.durableShadow.existingExactTerminalRecoveryAllowed,true);
  assert.equal(contract.durableShadow.recoveryRewritesIntent,false);
  assert.equal(contract.durableShadow.journalTerminalArt,"ABBRUCH");
  assert.equal(contract.durableShadow.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(contract.durableShadow.reconciliationClassification,"NOT_APPLIED");
  assert.equal(contract.durableShadow.sameIntentRetry,false);
  assert.equal(contract.authority.craftAuthority,false);
  assert.equal(contract.authority.gameplayAuthority,false);
  assert.equal(contract.authority.rawWriteAuthority,false);
  assert.equal(contract.authority.broadGraphExecutionAuthority,false);
  assert.equal(contract.authority.normalRuntimeAllowed,false);
  assert.equal(contract.writes.maximumGameplayWrites,0);
  assert.equal(contract.writes.maximumPublicFunctionCalls,0);
  assert.equal(contract.writes.maximumRawWriteCalls,0);
  assert.equal(contract.specialPaths.anniversaryCraftAllowed,false);
  assert.equal(contract.specialPaths.autoCraftAllowed,false);
  assert.equal(contract.nextGate,"PR20_9_CRAFT_DURABLE_SHADOW_RUNNER_PACKAGE");
});

test("PR20.9 Craft durable shadow source contains no gameplay mutation bypass",()=>{
  for(const marker of [
    "craft(",
    "auto_craft(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "send_item(",
    "send_gold(",
    "exchange(",
    "upgrade(",
    "compound(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    'journalTerminalArt: "ABBRUCH"',
    'sendBoundaryState: "NICHT_GESENDET"',
    'reconciliationClassification: "NOT_APPLIED"',
    "sameIntentRetry: false",
    "gameplayWrites: 0",
    "publicFunctionCalls: 0",
    "rawWriteCalls: 0",
    "craftAuthority: false",
    "broadGraphExecutionAuthority: false",
    "normalRuntimeAllowed: false",
  ]) assert.ok(source.includes(marker),marker);
});

test("PR20.9 roadmap and Merchant preparation retain the durable shadow foundation after gate advancement",()=>{
  assert.equal(roadmap.pr20_9.craftDurableShadow.status,"FOUNDATION_BEREIT_NO_WRITE");
  assert.equal(prep.pr20_9.craftDurableShadow.status,"FOUNDATION_BEREIT_NO_WRITE");
  assert.equal(roadmap.pr20_9.craftDurableShadow.craftAuthority,false);
  assert.equal(roadmap.pr20_9.craftDurableShadow.gameplayAuthority,false);
  assert.equal(roadmap.pr20_9.craftDurableShadow.rawWriteAuthority,false);
  assert.equal(roadmap.pr20_9.craftDurableShadow.broadGraphExecutionAuthority,false);
  assert.equal(roadmap.pr20_9.craftDurableShadow.normalRuntimeAllowed,false);
  assert.equal(prep.pr20_9.craftDurableShadow.craftAuthority,false);
  assert.equal(prep.pr20_9.craftDurableShadow.gameplayAuthority,false);
  assert.equal(prep.pr20_9.craftDurableShadow.rawWriteAuthority,false);
  assert.equal(prep.pr20_9.craftDurableShadow.normalRuntimeAllowed,false);

  const parallel=roadmap.parallelPreparations.find(
    x=>x?.id==="PR20.9_PRODUCTION",
  );
  assert.ok(parallel);
  assert.equal(parallel.liveExecutionAllowed,false);
  assert.ok(parallel.artifacts.includes(
    "v5/grundlage/quelle/produktion/pr20-9-craft-durable-shadow.ts",
  ));
  assert.ok(parallel.artifacts.includes(
    "v5/grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-preparation.json",
  ));
  assert.ok(parallel.artifacts.includes(
    "v5/grundlage/tests/pr20-9-craft-durable-shadow.test.mjs",
  ));
});
