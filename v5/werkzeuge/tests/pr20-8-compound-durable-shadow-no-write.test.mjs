import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-compound-durable-shadow-no-write.js",
  "utf8",
);

class MemoryStorage {
  constructor(){ this.rows=new Map(); }
  getItem(key){ return this.rows.has(key)?this.rows.get(key):null; }
  setItem(key,value){ this.rows.set(String(key),String(value)); }
}

function defs(overrides={}) {
  return {
    hpamulet:{
      type:"amulet",
      g:20000,
      compound:{hp:240},
      ...overrides.hpamulet,
    },
    cscroll0:{
      type:"cscroll",
      g:6400,
      grade:0,
      ...overrides.cscroll0,
    },
  };
}

function sandbox(items,options={}) {
  let compoundCalls=0;
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
    compound(){
      compoundCalls+=1;
      throw new Error("MUTATION_MUST_NOT_BE_CALLED");
    },
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      level:58,
      map:"main",
      x:-100,
      y:-160,
      moving:false,
      target:null,
      q:{},
      p:{ograce:0},
      s:{},
      items,
      ...options.character,
    },
    G:{
      items:defs(options.itemDefOverrides??{}),
      maps:{main:{ref:{c_mid:[-135,-164]}}},
      ...options.G,
    },
    S:{cgrace:{}},
  };
  box.parent=box;
  return {box,storage,compoundCalls:()=>compoundCalls};
}

function splitRootSandbox(items) {
  const env=sandbox(items);
  const host=env.box;
  const local={
    console,Date,Promise,Object,Array,String,Number,Boolean,JSON,Math,Set,Map,
    Uint8Array,TextEncoder,crypto:webcrypto,localStorage:env.storage,
    setTimeout:fn=>setImmediate(fn),clearTimeout:()=>{},
    AIO_V3:{operations:{status:()=>({v5AutonomousTest:{
      testId:"stale-test-id",version:"0.0.0",terminal:true,
      gameplayWrites:0,rawWriteCalls:0,sameIntentRetry:false,
      authority:{durableIntentCreated:false},intents:[],
    }})}},
    parent:host,
  };
  return {box:local,host,storage:env.storage,compoundCalls:env.compoundCalls};
}

async function run(env) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-compound-durable-shadow-no-write.js",
  });
  for(let i=0;i<320;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    const status=env.box.V5PR208CompoundDurableShadowNoWrite?.status?.();
    if(status?.terminal) return status;
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

function liveItems(indexes=[1,22,23],scrollIndex=14) {
  const items=Array(30).fill(null);
  for(const i of indexes) items[i]={name:"hpamulet",level:0};
  items[scrollIndex]={name:"cscroll0",q:20};
  return items;
}

test("PR20.8 Compound durable shadow persists exact three-input no-send intent", async()=>{
  const env=sandbox(liveItems());
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.deepEqual(Array.from(status.blocker),[]);
  assert.equal(env.compoundCalls(),0);

  const e=status.evidence;
  assert.equal(e.evidenceArt,"V5_PR20_8_COMPOUND_DURABLE_SHADOW_NO_WRITE");
  assert.equal(e.recipient.characterName,"My_Merchant");
  assert.deepEqual(Array.from(e.candidate.inventoryIndexes),[1,22,23]);
  assert.equal(e.candidate.name,"hpamulet");
  assert.equal(e.candidate.level,0);
  assert.equal(e.candidate.quantity,3);
  assert.equal(e.candidate.quantityEach,1);
  assert.equal(e.candidate.baseGold,20000);
  assert.equal(e.candidate.matchingCandidateCount,3);
  assert.equal(e.scroll.name,"cscroll0");
  assert.equal(e.scroll.inventoryIndex,14);
  assert.equal(e.scroll.observedQuantity,20);
  assert.equal(e.scroll.consumeQuantity,1);
  assert.equal(e.publicFunction,"compound");
  assert.equal(e.publicFunctionAvailable,true);
  assert.equal(e.serviceReachability.reachable,true);
  assert.equal(e.sourceSnapshotCommit,"ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4");
  assert.equal(e.ratifiedCandidateEvidenceCommit,"5974e293e973493241e3d659ea30d3cae85ebc35");
  assert.equal(e.stableDoubleObservation,true);
  assert.equal(e.stablePostIntentReobserve,true);
  assert.equal(e.durableReadback,true);
  assert.equal(e.journalTerminalArt,"ABBRUCH");
  assert.equal(e.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(e.reconciliationClassification,"NOT_APPLIED");
  assert.equal(e.exactPhysicalCandidateIndexesPinned,true);
  assert.equal(e.exactPhysicalScrollIndexPinned,true);
  assert.equal(e.freshReresolutionRequiredBeforeFutureSend,true);
  assert.equal(e.oneShotBindingPrepared,true);
  assert.equal(e.oneShotMaximumUses,1);
  assert.equal(e.oneShotCompoundAuthorityIssued,false);
  assert.equal(e.compoundActionChannelFencePrepared,true);
  assert.equal(e.gameplayWrites,0);
  assert.equal(e.publicFunctionCalls,0);
  assert.equal(e.rawWriteCalls,0);
  assert.equal(e.authorityIssued,false);
  assert.equal(e.compoundAuthority,false);
  assert.equal(e.gameplayAuthority,false);
  assert.equal(e.rawWriteAuthority,false);
  assert.equal(e.normalCompoundWriteRatification,false);
  assert.equal(e.normalRuntimeAllowed,false);

  assert.equal(env.storage.rows.size,1);
  const durable=JSON.parse([...env.storage.rows.values()][0]);
  assert.equal(durable.art,"PR20_8_COMPOUND_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE");
  assert.equal(durable.actionContractId,"AL-ACTION-COMPOUND");
  assert.equal(durable.recoveryContractId,"AL-RECOVERY-COMPOUND");
  assert.equal(durable.verifierId,"AL-VERIFIER-COMPOUND");
  assert.equal(durable.publicFunction,"compound");
  assert.deepEqual(durable.candidate.indexes,[1,22,23]);
  assert.equal(durable.oneShot.compoundAuthorityIssued,false);
  assert.equal(durable.gameplayAuthority,false);
  assert.equal(durable.rawWriteAuthority,false);
  assert.equal(durable.compoundAuthority,false);
});

test("PR20.8 Compound shadow mirrors telemetry into split CDP and game root",async()=>{
  const env=splitRootSandbox(liveItems());
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  const local=env.box.AIO_V3.operations.status().v5AutonomousTest;
  const host=env.host.AIO_V3.operations.status().v5AutonomousTest;
  assert.equal(local.testId,"pr20-8-compound-durable-shadow-no-write");
  assert.equal(host.testId,"pr20-8-compound-durable-shadow-no-write");
  assert.equal(local.version,"1.0.0");
  assert.equal(host.version,"1.0.0");
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound shadow deterministically selects the first three live physical inputs",async()=>{
  const env=sandbox(liveItems([4,7,18,25],29));
  const status=await run(env);
  assert.equal(status.status,"BESTANDEN");
  assert.deepEqual(Array.from(status.evidence.candidate.inventoryIndexes),[4,7,18]);
  assert.equal(status.evidence.candidate.matchingCandidateCount,4);
  assert.equal(status.evidence.scroll.inventoryIndex,29);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound shadow blocks fewer than three safe physical inputs",async()=>{
  const env=sandbox(liveItems([1,22],14));
  const status=await run(env);
  assert.equal(status.status,"FEHLER");
  assert.deepEqual(Array.from(status.blocker),["PR20_8_COMPOUND_SHADOW_DREI_KANDIDATEN_ERFORDERLICH"]);
  assert.equal(env.storage.rows.size,0);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound shadow blocks unsafe candidate, active q and scroll-definition drift",async()=>{
  {
    const items=liveItems();
    items[22]={name:"hpamulet",level:0,gift:true};
    const env=sandbox(items);
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.deepEqual(Array.from(status.blocker),["PR20_8_COMPOUND_SHADOW_DREI_KANDIDATEN_ERFORDERLICH"]);
    assert.equal(env.storage.rows.size,0);
  }
  {
    const env=sandbox(liveItems(),{character:{q:{compound:{ms:500}}}});
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.deepEqual(Array.from(status.blocker),["PR20_8_COMPOUND_SHADOW_Q_NICHT_FREI"]);
    assert.equal(env.storage.rows.size,0);
  }
  {
    const env=sandbox(liveItems(),{itemDefOverrides:{cscroll0:{g:9999}}});
    const status=await run(env);
    assert.equal(status.status,"FEHLER");
    assert.deepEqual(Array.from(status.blocker),["PR20_8_COMPOUND_SHADOW_SCROLL_DEFINITION_DRIFT"]);
    assert.equal(env.storage.rows.size,0);
  }
});

test("PR20.8 Compound shadow blocks service drift before durable intent",async()=>{
  const env=sandbox(liveItems(),{character:{x:1000,y:1000}});
  const status=await run(env);
  assert.equal(status.status,"FEHLER");
  assert.deepEqual(Array.from(status.blocker),["PR20_8_COMPOUND_SHADOW_SERVICE_NICHT_ERREICHBAR"]);
  assert.equal(env.storage.rows.size,0);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 exact terminal Compound shadow intent is recovered without rewrite or send",async()=>{
  const storage=new MemoryStorage();
  const first=sandbox(liveItems(),{storage});
  const firstStatus=await run(first);
  assert.equal(firstStatus.status,"BESTANDEN");
  assert.equal(firstStatus.evidence.shadowIntent.createdThisRun,true);
  const before=[...storage.rows.entries()];
  const second=sandbox(liveItems(),{storage});
  const secondStatus=await run(second);
  assert.equal(secondStatus.status,"BESTANDEN");
  assert.equal(secondStatus.evidence.shadowIntent.createdThisRun,false);
  assert.equal(secondStatus.evidence.shadowIntent.recoveredExistingTerminal,true);
  assert.deepEqual([...storage.rows.entries()],before);
  assert.equal(first.compoundCalls(),0);
  assert.equal(second.compoundCalls(),0);
});

test("PR20.8 Compound shadow package contains no gameplay mutation bypass",()=>{
  for(const marker of [
    "compound(","upgrade(","exchange(","buy(","buy_with_gold(","send_item(",
    "send_gold(","start_character(","command_character(","use_skill(","equip(",
    "unequip(","api_call(","socket.emit(",".socket.emit(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    "gameplayWrites: 0","publicFunctionCalls: 0","rawWriteCalls: 0",
    "sameIntentRetry: false","normalRuntimeAllowed: false",
    "authorityIssued: false","durableIntentCreated: false",
    "compoundAuthority: false","gameplayAuthority: false","rawWriteAuthority: false",
    "DREI_KANDIDATEN_ERFORDERLICH","ref?.c_mid","Number(scrollDef.g) !== 6400",
  ]) assert.ok(source.includes(marker),marker);
});
