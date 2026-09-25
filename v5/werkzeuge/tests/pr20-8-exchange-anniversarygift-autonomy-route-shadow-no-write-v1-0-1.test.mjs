import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-1.js",
  "utf8",
);

function definition(){
  return {
    type:"gem",
    skin:"anniversarygift",
    name:"Anniversary Gift",
    explanation:"Ten years, tied with a ribbon.",
    s:9999,
    g:100,
    e:1,
    exclusive:true,
    cash:false,
    event:false,
    quest:false,
    cx:{accent:"#3DB5A5"},
  };
}

function storage(seed=new Map()){
  let writes=0;
  return {
    seed,
    get writes(){return writes;},
    get length(){return seed.size;},
    key(i){return [...seed.keys()][i] ?? null;},
    getItem(key){return seed.has(key)?seed.get(key):null;},
    setItem(key,value){writes+=1;seed.set(key,String(value));},
    removeItem(key){seed.delete(key);},
  };
}

function inventoryAt(index=7,quantity=105,size=16,itemPatch={}){
  const items=Array(size).fill(null);
  items[0]={name:"cake",q:18};
  items[index]={name:"anniversarygift",q:quantity,...itemPatch};
  return items;
}

function makeBox({
  items=inventoryAt(),
  def=definition(),
  q={},
  moving=false,
  target=null,
  dead=false,
  name="My_Merchant",
  ctype="merchant",
  region="EU",
  identifier="I",
  performanceActive=true,
  exchangeAvailable=true,
  localStore=storage(),
  runtime=null,
  map="main",
  x=0,
  y=-450,
  esize=9,
  isize=16,
  computer=false,
  sellDist=400,
  s={},
  entities={},
}={}){
  let exchangeCalls=0;
  const box={
    console,
    Date,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    Set,
    Map,
    Error,
    RegExp,
    Uint8Array,
    TextEncoder,
    crypto:webcrypto,
    setTimeout:fn=>setImmediate(fn),
    clearTimeout:()=>{},
    performance_trick(){},
    sounds:{
      empty:performanceActive
        ? {cplaying:true,playing:()=>true}
        : {cplaying:false,playing:()=>false},
    },
    server_region:region,
    server_identifier:identifier,
    B:{sell_dist:sellDist},
    character:{
      name,
      id:name,
      ctype,
      level:58,
      map,
      x,
      y,
      real_x:x,
      real_y:y,
      moving,
      target,
      dead,
      rip:dead,
      q,
      s,
      items,
      esize,
      isize,
      computer,
    },
    G:{items:{anniversarygift:def}},
    entities,
    localStorage:localStore,
    AIO_V3:{},
  };
  if(runtime) box.AIO_V3.__runtime=runtime;
  if(exchangeAvailable){
    box.exchange=()=>{
      exchangeCalls+=1;
      throw new Error("EXCHANGE_MUST_NOT_BE_CALLED");
    };
  }
  box.parent=box;
  return {box,localStore,getExchangeCalls:()=>exchangeCalls};
}

async function run(options={}){
  const ctx=makeBox(options);
  vm.createContext(ctx.box);
  vm.runInContext(source,ctx.box,{
    filename:"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-1.js",
  });
  const deadline=Date.now()+5000;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,1));
    last=ctx.box.V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite?.status?.();
    if(last?.terminal) return {...ctx,status:last};
  }
  throw new Error("TEST_DID_NOT_TERMINATE:"+JSON.stringify(last));
}

test("v1.0.1 enters recovery run synchronously before first async yield",()=>{
  const ctx=makeBox();
  vm.createContext(ctx.box);
  vm.runInContext(source,ctx.box,{
    filename:"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-1.js",
  });
  const status=ctx.box.V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite?.status?.();
  assert.equal(status.version,"1.0.1");
  assert.equal(status.startMode,"DIRECT_ASYNC_ENTRY");
  assert.equal(status.bootStallRecovery,true);
  assert.equal(status.startCalls,1);
  assert.equal(status.phase,"PERFORMANCE_TRICK_CHECK");
  assert.ok(status.progressSequence>=2);
  assert.ok(Number(status.lastProgressAtMs)>=Number(status.startedAtMs));
  assert.equal(status.terminal,false);
  assert.equal(ctx.getExchangeCalls(),0);
});

test("v1.0.1 bounds async hash stages and stays gameplay no-write",()=>{
  assert.ok(source.includes("const ASYNC_STAGE_TIMEOUT_MS = 2000;"));
  assert.ok(source.includes("PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_WEB_CRYPTO_TIMEOUT"));
  assert.ok(source.includes("run().catch(error =>"));
  assert.equal(source.includes("Promise.resolve().then(run)"),false);
  for(const marker of [
    "globalThis.exchange(",
    "parent.exchange(",
    ".exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "smart_move(",
  ]) assert.equal(source.includes(marker),false,marker);
});


test("autonomy shadow freshly selects current anniversarygift slot with zero gameplay writes",async()=>{
  const ctx=await run({items:inventoryAt(7)});
  const {status}=ctx;
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(status.candidate.name,"anniversarygift");
  assert.equal(status.candidate.index,7);
  assert.equal(status.candidate.quantity,105);
  assert.equal(status.candidate.selectionMode,"AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN");
  assert.equal(status.candidate.manualPinnedInventoryIndex,false);
  assert.equal(status.candidate.observedIndexCarriesAuthority,false);
  assert.equal(status.autonomyDecision.observedCandidateIndex,7);
  assert.equal(status.autonomyDecision.manualPinnedInventoryIndex,false);
  assert.equal(status.autonomyDecision.observedIndexCarriesAuthority,false);
  assert.equal(status.autonomyDecision.serviceReachable,true);
  assert.equal(status.autonomyDecision.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(status.shadowIntent.durableReadback,true);
  assert.equal(status.shadowIntent.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(status.shadowIntent.authorityIssued,false);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
  assert.equal(status.authority.rawWriteAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
  assert.equal(ctx.getExchangeCalls(),0);
});

test("candidate index is not manually pinned and follows a different current slot",async()=>{
  const ctx=await run({items:inventoryAt(11)});
  assert.equal(ctx.status.status,"BESTANDEN");
  assert.equal(ctx.status.candidate.index,11);
  assert.equal(ctx.status.autonomyDecision.observedCandidateIndex,11);
  assert.equal(ctx.getExchangeCalls(),0);
});

test("ambiguous current anniversarygift stacks fail closed",async()=>{
  const items=inventoryAt(7);
  items[11]={name:"anniversarygift",q:1};
  const ctx=await run({items});
  assert.equal(ctx.status.status,"BLOCKIERT");
  assert.ok(ctx.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_KANDIDAT_NICHT_EINDEUTIG",
  ));
  assert.equal(ctx.getExchangeCalls(),0);
});

test("unsafe candidate is rejected rather than silently authorized",async()=>{
  const ctx=await run({items:inventoryAt(7,105,16,{locked:true})});
  assert.equal(ctx.status.status,"BLOCKIERT");
  assert.ok(ctx.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_EXAKTER_INPUT_FEHLT",
  ));
  assert.equal(ctx.getExchangeCalls(),0);
});

test("exact anniversarygift definition drift fails closed",async()=>{
  const def=definition();
  def.g=101;
  const ctx=await run({def});
  assert.equal(ctx.status.status,"BLOCKIERT");
  assert.ok(ctx.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_ITEM_DEFINITION_DRIFT",
  ));
  assert.equal(ctx.getExchangeCalls(),0);
});

test("output space and service reachability are productive admission gates",async()=>{
  const full=Array(16).fill(null).map((_,i)=>({name:"hpot0",q:1,data:String(i)}));
  full[7]={name:"anniversarygift",q:105};
  const noSpace=await run({items:full,esize:0,isize:16});
  assert.equal(noSpace.status.status,"BLOCKIERT");
  assert.ok(noSpace.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_OUTPUTSPACE_FEHLT",
  ));
  assert.equal(noSpace.getExchangeCalls(),0);

  const far=await run({x:1000,y:1000});
  assert.equal(far.status.status,"BLOCKIERT");
  assert.ok(far.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SERVICE_NICHT_ERREICHBAR",
  ));
  assert.equal(far.getExchangeCalls(),0);
});

test("queue, movement, target, aggro and mass exchange all fail closed",async()=>{
  const cases=[
    [{q:{exchange:{ms:100}}},"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_Q_NICHT_FREI"],
    [{moving:true},"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_BEWEGT_SICH"],
    [{target:"goo"},"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_HAT_ZIEL"],
    [{entities:{m:{type:"monster",target:"My_Merchant",dead:false,rip:false}}},
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_UNTER_ANGRIFF"],
    [{s:{massexchange:{ms:100}}},"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_MASSEXCHANGE_AKTIV"],
    [{s:{massexchangepp:{ms:100}}},"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_MASSEXCHANGEPP_AKTIV"],
  ];
  for(const [options,blocker] of cases){
    const ctx=await run(options);
    assert.equal(ctx.status.status,"BLOCKIERT",blocker);
    assert.ok(ctx.status.blocker.includes(blocker),JSON.stringify(ctx.status.blocker));
    assert.equal(ctx.getExchangeCalls(),0);
  }
});

test("performance and public exchange wrapper are required but exchange is never called",async()=>{
  const perf=await run({performanceActive:false});
  assert.equal(perf.status.status,"BLOCKIERT");
  assert.ok(perf.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_PERFORMANCE_TRICK_BLOCKED",
  ));
  assert.equal(perf.getExchangeCalls(),0);

  const wrapper=await run({exchangeAvailable:false});
  assert.equal(wrapper.status.status,"BLOCKIERT");
  assert.ok(wrapper.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_EXCHANGE_SERVICE_FEHLT",
  ));
});

test("exact terminal autonomy shadow recovery performs no send and no decision rewrite",async()=>{
  const store=storage();
  const first=await run({localStore:store,items:inventoryAt(9)});
  assert.equal(first.status.status,"BESTANDEN");
  const firstWrites=store.writes;
  assert.equal(firstWrites,1);
  assert.equal(first.status.shadowIntent.createdThisRun,true);
  assert.equal(first.getExchangeCalls(),0);

  const second=await run({localStore:store,items:inventoryAt(9)});
  assert.equal(second.status.status,"BESTANDEN");
  assert.equal(second.status.shadowIntent.recoveredExistingTerminal,true);
  assert.equal(second.status.shadowIntent.createdThisRun,false);
  assert.equal(store.writes,firstWrites);
  assert.equal(second.getExchangeCalls(),0);
});

test("v1.0.1 recovers exact terminal v1.0.0 shadow without rewrite",async()=>{
  const store=storage();
  const first=await run({localStore:store,items:inventoryAt(10)});
  assert.equal(first.status.status,"BESTANDEN");
  const key=first.status.shadowIntent.key;
  const legacy=JSON.parse(store.getItem(key));
  legacy.version="1.0.0";
  store.setItem(key,JSON.stringify(legacy));
  const writesBeforeRecovery=store.writes;

  const recovered=await run({localStore:store,items:inventoryAt(10)});
  assert.equal(recovered.status.status,"BESTANDEN");
  assert.equal(recovered.status.shadowIntent.recoveredExistingTerminal,true);
  assert.equal(recovered.status.shadowIntent.recoveredVersion,"1.0.0");
  assert.equal(recovered.status.shadowIntent.createdThisRun,false);
  assert.equal(store.writes,writesBeforeRecovery);
  assert.equal(recovered.getExchangeCalls(),0);
});


test("runner source has no gameplay mutation call site",()=>{
  assert.ok(source.includes(
    "selectionMode:'AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN'",
  ));
  assert.ok(source.includes("manualPinnedInventoryIndex:false"));
  assert.ok(source.includes("priorCommittedTransactionGrantsAuthority:false"));
  assert.ok(source.includes("freshCandidateReresolutionRequiredBeforeFutureSend:true"));
  for(const marker of [
    "globalThis.exchange(",
    "parent.exchange(",
    ".exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "smart_move(",
    "move(",
    "upgrade(",
    "compound(",
    "buy(",
    "trade_buy(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
  ]) assert.equal(source.includes(marker),false,marker);
});
