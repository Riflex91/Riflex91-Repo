import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-9-craft-durable-shadow-no-write.js",
  "utf8",
);
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-runner-preparation.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));
const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/merchant-remaining-production-preparation.json",
  "utf8",
));

class MemoryStorage {
  constructor(){ this.rows=new Map(); }
  getItem(key){ return this.rows.has(String(key))?this.rows.get(String(key)):null; }
  setItem(key,value){ this.rows.set(String(key),String(value)); }
}

function baseItems() {
  return {
    iron:{type:"material",g:100},
    wood:{type:"material",g:50},
    sword:{type:"weapon",g:2000},
    shield:{type:"shield",g:1500},
    cake:{type:"material",g:20},
    special:{type:"misc",g:100},
  };
}

function recipes(overrides={}) {
  return {
    sword:{
      cost:1000,
      items:[[2,"iron",0],[1,"wood",0]],
    },
    ...overrides,
  };
}

function liveInventory(overrides={}) {
  const items=Array(12).fill(null);
  items[2]={name:"iron",q:2};
  items[5]={name:"wood",q:1};
  for(const [index,value] of Object.entries(overrides)) items[Number(index)]=value;
  return items;
}

function sandbox(options={}) {
  let craftCalls=0;
  let autoCraftCalls=0;
  const storage=options.storage??new MemoryStorage();
  const box={
    console,Date,Promise,Object,Array,String,Number,Boolean,JSON,Math,Set,Map,
    Uint8Array,TextEncoder,crypto:webcrypto,localStorage:storage,
    setTimeout:fn=>setImmediate(fn),clearTimeout:()=>{},
    performance_trick(){},
    sounds:{empty:{cplaying:true,playing:()=>true}},
    server_region:"EU",
    server_identifier:"I",
    B:{sell_dist:400},
    entities:{},
    craft(){ craftCalls+=1; throw new Error("CRAFT_MUTATION_MUST_NOT_RUN"); },
    auto_craft(){ autoCraftCalls+=1; throw new Error("AUTO_CRAFT_MUTATION_MUST_NOT_RUN"); },
    character:{
      name:"My_Merchant",
      id:"merchant-session-1",
      ctype:"merchant",
      level:58,
      map:"main",
      x:92,
      y:670,
      moving:false,
      target:null,
      q:{},
      s:{},
      p:{},
      gold:100000,
      esize:0,
      items:liveInventory(),
      ...options.character,
    },
    G:{
      items:{...baseItems(),...(options.itemDefs??{})},
      craft:recipes(options.recipes??{}),
      ...options.G,
    },
  };
  box.parent=box;
  return {
    box,storage,
    craftCalls:()=>craftCalls,
    autoCraftCalls:()=>autoCraftCalls,
  };
}

function splitRootSandbox(options={}) {
  const env=sandbox(options);
  const host=env.box;
  const local={
    console,Date,Promise,Object,Array,String,Number,Boolean,JSON,Math,Set,Map,
    Uint8Array,TextEncoder,crypto:webcrypto,localStorage:env.storage,
    setTimeout:fn=>setImmediate(fn),clearTimeout:()=>{},
    AIO_V3:{operations:{status:()=>({v5AutonomousTest:{
      testId:"stale",version:"0.0.0",terminal:true,
      gameplayWrites:0,rawWriteCalls:0,sameIntentRetry:false,
    }})}},
    parent:host,
  };
  return {...env,box:local,host};
}

async function run(env) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-9-craft-durable-shadow-no-write.js",
  });
  for(let i=0;i<400;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    const status=env.box.V5PR209CraftDurableShadowNoWrite?.status?.();
    if(status?.terminal) return status;
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

test("PR20.9 Craft shadow selects natural Normal Craft candidate and persists no-send intent",async()=>{
  const env=sandbox();
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.deepEqual(Array.from(status.blocker),[]);
  assert.equal(env.craftCalls(),0);
  assert.equal(env.autoCraftCalls(),0);

  const e=status.evidence;
  assert.equal(e.evidenceArt,"V5_PR20_9_CRAFT_DURABLE_SHADOW_NO_WRITE");
  assert.equal(e.normalCraftOnly,true);
  assert.equal(e.anniversaryCraftAllowed,false);
  assert.equal(e.autoCraftAllowed,false);
  assert.equal(e.splitStackNormalCraftAllowed,false);
  assert.equal(e.candidate.recipeName,"sword");
  assert.equal(e.candidate.recipeKey,"iron,wood");
  assert.equal(e.candidate.goldCost,1000);
  assert.deepEqual(
    Array.from(e.candidate.inputs,x=>[x.name,x.inventoryIndex,x.consumeQuantity]),
    [["iron",2,2],["wood",5,1]],
  );
  assert.equal(e.serviceReachability.reachable,true);
  assert.equal(e.serviceReachability.distance,0);
  assert.equal(e.durableReadback,true);
  assert.equal(e.journalTerminalArt,"ABBRUCH");
  assert.equal(e.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(e.reconciliationClassification,"NOT_APPLIED");
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.craftAuthority,false);
  assert.equal(e.gameplayAuthority,false);
  assert.equal(e.rawWriteAuthority,false);
  assert.equal(e.broadGraphExecutionAuthority,false);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.normalRuntimeAllowed,false);

  assert.equal(env.storage.rows.size,1);
  const durable=JSON.parse([...env.storage.rows.values()][0]);
  assert.equal(durable.art,"PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE");
  assert.equal(durable.actionContractId,"AL-ACTION-CRAFT");
  assert.equal(durable.recoveryContractId,"AL-RECOVERY-CRAFT");
  assert.equal(durable.verifierId,"AL-VERIFIER-CRAFT");
  assert.equal(durable.publicFunction,"craft");
  assert.equal(durable.craftPath,"NORMAL");
  assert.equal(durable.terminal,true);
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

test("PR20.9 Craft shadow chooses recipes and physical stacks deterministically",async()=>{
  const items=Array(15).fill(null);
  items[1]={name:"iron",q:3};
  items[4]={name:"iron",q:2};
  items[6]={name:"wood",q:1};
  items[9]={name:"wood",q:2};
  const env=sandbox({
    character:{items,esize:0},
    recipes:{
      aaa:{cost:100,items:[[1,"special",0],[1,"wood",0]]},
      zzz:{cost:100,items:[[1,"wood",0],[1,"iron",0]]},
    },
  });
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.evidence.candidate.recipeName,"sword");
  assert.deepEqual(
    Array.from(status.evidence.candidate.inputs,x=>x.inventoryIndex),
    [1,6],
  );
  assert.equal(env.craftCalls(),0);
});

test("PR20.9 Craft shadow excludes Anniversary, output-override and duplicate-name recipes",async()=>{
  const env=sandbox({
    recipes:{
      aaa:{cost:1,quest:"anniversary_baker",items:[[1,"iron",0],[1,"wood",0]]},
      aab:{cost:1,output:{name:"special"},items:[[1,"iron",0],[1,"wood",0]]},
      aac:{cost:1,items:[[1,"iron",0],[1,"iron",0]]},
    },
  });
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.evidence.candidate.recipeName,"sword");
  assert.equal(status.evidence.candidate.recipeName==="aaa",false);
  assert.equal(status.evidence.candidate.recipeName==="aab",false);
  assert.equal(status.evidence.candidate.recipeName==="aac",false);
  assert.equal(env.craftCalls(),0);
});

test("PR20.9 Craft shadow blocks when only split-stack or protected inputs exist",async()=>{
  {
    const items=Array(12).fill(null);
    items[1]={name:"iron",q:1};
    items[2]={name:"iron",q:1};
    items[5]={name:"wood",q:1};
    const env=sandbox({character:{items,esize:1}});
    const status=await run(env);
    assert.equal(status.status,"BLOCKIERT");
    assert.deepEqual(Array.from(status.blocker),["PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT"]);
    assert.equal(env.storage.rows.size,0);
  }
  {
    const items=liveInventory({2:{name:"iron",q:2,gift:true}});
    const env=sandbox({character:{items,esize:1}});
    const status=await run(env);
    assert.equal(status.status,"BLOCKIERT");
    assert.equal(env.storage.rows.size,0);
  }
});

test("PR20.9 Craft shadow blocks insufficient gold and conservative outputspace",async()=>{
  {
    const env=sandbox({character:{gold:100,esize:1}});
    const status=await run(env);
    assert.equal(status.status,"BLOCKIERT");
    assert.equal(env.storage.rows.size,0);
  }
  {
    const items=liveInventory({
      2:{name:"iron",q:3},
      5:{name:"wood",q:2},
    });
    const env=sandbox({character:{items,esize:0}});
    const status=await run(env);
    assert.equal(status.status,"BLOCKIERT");
    assert.equal(env.storage.rows.size,0);
  }
});

test("PR20.9 Craft shadow blocks service drift and active q before durable intent",async()=>{
  {
    const env=sandbox({character:{x:1000,y:1000}});
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.deepEqual(Array.from(status.blocker),["PR20_9_CRAFT_SHADOW_SERVICE_NICHT_ERREICHBAR"]);
    assert.equal(env.storage.rows.size,0);
  }
  {
    const env=sandbox({character:{q:{craft:{ms:100}}}});
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.deepEqual(Array.from(status.blocker),["PR20_9_CRAFT_SHADOW_Q_NICHT_FREI"]);
    assert.equal(env.storage.rows.size,0);
  }
});

test("PR20.9 exact terminal Craft shadow is recovered without rewrite or send",async()=>{
  const storage=new MemoryStorage();
  const first=sandbox({storage});
  const firstStatus=await run(first);
  assert.equal(firstStatus.status,"BESTANDEN");
  assert.equal(firstStatus.evidence.shadowIntent.createdThisRun,true);
  const before=[...storage.rows.entries()];

  const second=sandbox({storage});
  const secondStatus=await run(second);
  assert.equal(secondStatus.status,"BESTANDEN");
  assert.equal(secondStatus.evidence.shadowIntent.createdThisRun,false);
  assert.equal(secondStatus.evidence.shadowIntent.recoveredExistingTerminal,true);
  assert.deepEqual([...storage.rows.entries()],before);
  assert.equal(first.craftCalls(),0);
  assert.equal(second.craftCalls(),0);
});

test("PR20.9 conflicting terminal Craft shadow fails closed without rewrite",async()=>{
  const storage=new MemoryStorage();
  const first=sandbox({storage});
  const firstStatus=await run(first);
  assert.equal(firstStatus.status,"BESTANDEN");
  const [key,raw]=[...storage.rows.entries()][0];
  const damaged=JSON.parse(raw);
  damaged.candidate.recipeName="drifted";
  storage.rows.set(key,JSON.stringify(damaged));
  const before=[...storage.rows.entries()];

  const second=sandbox({storage});
  const secondStatus=await run(second);
  assert.equal(secondStatus.status,"FEHLER");
  assert.deepEqual(Array.from(secondStatus.blocker),["PR20_9_CRAFT_SHADOW_EXISTING_INTENT_DRIFT"]);
  assert.deepEqual([...storage.rows.entries()],before);
  assert.equal(second.craftCalls(),0);
});

test("PR20.9 Craft shadow mirrors telemetry into split CDP and game root",async()=>{
  const env=splitRootSandbox();
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  const local=env.box.AIO_V3.operations.status().v5AutonomousTest;
  const host=env.host.AIO_V3.operations.status().v5AutonomousTest;
  assert.equal(local.testId,"pr20-9-craft-durable-shadow-no-write");
  assert.equal(host.testId,"pr20-9-craft-durable-shadow-no-write");
  assert.equal(local.version,"1.0.0");
  assert.equal(host.version,"1.0.0");
  assert.equal(env.craftCalls(),0);
});

test("PR20.9 Craft runner package contains no gameplay mutation bypass",()=>{
  for(const marker of [
    "craft(","auto_craft(","compound(","upgrade(","exchange(","buy(",
    "buy_with_gold(","send_item(","send_gold(","start_character(",
    "command_character(","use_skill(","equip(","unequip(","api_call(",
    "socket.emit(",".socket.emit(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    "gameplayWrites:0",
    "publicFunctionCalls:0",
    "rawWriteCalls:0",
    "sameIntentRetry:false",
    "normalRuntimeAllowed:false",
    "craftAuthority:false",
    "broadGraphExecutionAuthority:false",
    "journalTerminalArt:'ABBRUCH'",
    "sendBoundaryState:'NICHT_GESENDET'",
    "reconciliationClassification:'NOT_APPLIED'",
    "UNSAFE_OR_SPECIAL_RECIPE",
    "NO_SAFE_EXACT_SINGLE_STACK_INPUTS",
    "NO_CONSERVATIVE_OUTPUTSPACE",
    "CRAFTSMAN_POINT",
  ]) assert.ok(source.includes(marker),marker);
});

test("PR20.9 Craft shadow runner stays no-write while current observation is blocked no-candidate",()=>{
  assert.equal(contract.status,"PACKAGE_BEREIT_NO_WRITE");
  assert.equal(contract.testId,"pr20-9-craft-durable-shadow-no-write");
  assert.equal(contract.controllerVersion,"1.0.0");
  assert.equal(contract.expectedGlobal,"V5PR209CraftDurableShadowNoWrite");
  assert.equal(contract.scope,"NORMAL_CRAFT_ONLY");
  assert.equal(contract.candidatePolicy.naturalCurrentInventoryOnly,true);
  assert.equal(contract.candidatePolicy.splitStackAllowed,false);
  assert.equal(contract.candidatePolicy.anniversaryCraftAllowed,false);
  assert.equal(contract.candidatePolicy.autoCraftAllowed,false);
  assert.equal(contract.shadowSemantics.exactTerminalRecoveryAllowed,true);
  assert.equal(contract.shadowSemantics.conflictingExistingIntentFailsClosed,true);
  assert.equal(contract.shadowSemantics.journalTerminalArt,"ABBRUCH");
  assert.equal(contract.shadowSemantics.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(contract.shadowSemantics.reconciliationClassification,"NOT_APPLIED");
  assert.equal(contract.authority.craftAuthority,false);
  assert.equal(contract.authority.gameplayAuthority,false);
  assert.equal(contract.authority.rawWriteAuthority,false);
  assert.equal(contract.authority.broadGraphExecutionAuthority,false);
  assert.equal(contract.authority.normalRuntimeAllowed,false);
  assert.equal(contract.writes.maximumGameplayWrites,0);
  assert.equal(contract.writes.maximumPublicFunctionCalls,0);
  assert.equal(contract.writes.maximumRawWriteCalls,0);
  assert.equal(contract.manifest.cutoverPrepared,false);
  assert.equal(contract.manifest.active,false);

  assert.equal(
    roadmap.pr20_9.status,
    "CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE",
  );
  assert.equal(prep.pr20_9.status,roadmap.pr20_9.status);
  assert.equal(
    roadmap.pr20_9.nextAction,
    "REMAIN_BLOCKED_WAIT_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE",
  );
  assert.equal(prep.pr20_9.nextAction,roadmap.pr20_9.nextAction);
  assert.equal(roadmap.pr20_9.liveExecutionAllowed,false);
  assert.equal(roadmap.pr20_9.productiveCraftAuthority,false);
  assert.equal(roadmap.pr20_9.broadGraphExecutionAuthority,false);
  assert.equal(roadmap.pr20_9.normalRuntimeAllowed,false);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.active,true);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.manifestCutoverPrepared,true);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.liveEvidenceObserved,true);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.craftRatified,false);
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.latestObservedStatus,"BLOCKIERT");
  assert.equal(
    roadmap.pr20_9.craftDurableShadowRunner.latestBlocker,
    "PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT",
  );
  assert.equal(roadmap.pr20_9.craftDurableShadowRunner.latestNotificationId,3175);

  const parallel=roadmap.parallelPreparations.find(x=>x?.id==="PR20.9_PRODUCTION");
  assert.ok(parallel);
  assert.equal(parallel.status,roadmap.pr20_9.status);
  assert.equal(parallel.nextAction,roadmap.pr20_9.nextAction);
  assert.equal(parallel.liveExecutionAllowed,false);
  for(const artifact of [
    "v5/werkzeuge/pr20-9-craft-durable-shadow-no-write.js",
    "v5/werkzeuge/tests/pr20-9-craft-durable-shadow-no-write.test.mjs",
    "v5/grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-runner-preparation.json",
  ]) assert.ok(parallel.artifacts.includes(artifact),artifact);
});
