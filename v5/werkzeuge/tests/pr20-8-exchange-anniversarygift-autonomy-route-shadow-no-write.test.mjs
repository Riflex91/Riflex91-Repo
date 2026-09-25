import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write.js",
  "utf8",
);

const TEST_ID="pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write";
const PREFIX="v5:"+TEST_ID+":decision:";

function storage(seed=new Map()){
  return {
    seed,
    get length(){return seed.size;},
    key(i){return [...seed.keys()][i] ?? null;},
    getItem(key){return seed.has(key)?seed.get(key):null;},
    setItem(key,value){seed.set(key,String(value));},
    removeItem(key){seed.delete(key);},
  };
}

function exactDefinition(){
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

function makeEnv({
  candidateIndex=7,
  candidateQuantity=105,
  duplicateIndex=null,
  x=-25,
  y=-450,
  map="main",
  q={},
  s={},
  moving=false,
  target=null,
  dead=false,
  definition=exactDefinition(),
  freeSlots=3,
  withExchange=true,
  withPerformance=true,
  store=storage(),
}={}){
  const items=Array.from({length:16},()=>({name:"hpot0",q:1}));
  for(let i=0;i<freeSlots;i+=1) items[15-i]=null;
  items[candidateIndex]={name:"anniversarygift",q:candidateQuantity};
  if(duplicateIndex!==null) items[duplicateIndex]={name:"anniversarygift",q:1};

  let exchangeCalls=0;
  const box={
    console,
    Promise,Object,Array,String,Number,Boolean,JSON,Math,Uint8Array,
    crypto:webcrypto,
    TextEncoder,
    setTimeout:(fn)=>setImmediate(fn),
    clearTimeout:()=>{},
    localStorage:store,
    server_region:"EU",
    server_identifier:"I",
    B:{sell_dist:400},
    G:{items:{anniversarygift:definition}},
    AIO_V3:{},
    sounds:{empty:{cplaying:true,playing:()=>true}},
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      map,x,y,real_x:x,real_y:y,
      q,s,moving,target,dead,rip:dead,
      items,
    },
  };
  if(withExchange) box.exchange=()=>{exchangeCalls+=1;throw new Error("EXCHANGE_MUST_NOT_BE_CALLED");};
  if(withPerformance) box.performance_trick=()=>{};
  box.parent=box;
  return {box,store,getExchangeCalls:()=>exchangeCalls};
}

async function execute(env){
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write.js",
  });
  const deadline=Date.now()+5000;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setImmediate(resolve));
    last=env.box.V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite?.status?.();
    if(last?.terminal) return last;
  }
  throw new Error("TEST_DID_NOT_SETTLE:"+JSON.stringify(last));
}

function decisions(store){
  return [...store.seed.entries()]
    .filter(([key])=>key.startsWith(PREFIX))
    .map(([key,value])=>({key,value:JSON.parse(value)}));
}

test("fresh autonomous scan selects current anniversarygift index and writes only durable shadow decision",async()=>{
  const env=makeEnv({candidateIndex:7,candidateQuantity:105});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(status.candidate.name,"anniversarygift");
  assert.equal(status.candidate.index,7);
  assert.equal(status.candidate.quantity,105);
  assert.equal(status.candidate.selectedByFreshAutonomousScan,true);
  assert.equal(status.candidate.observedIndexCarriesAuthority,false);
  assert.equal(status.candidate.exclusiveTestException,true);
  assert.equal(status.durableDecisionReadback,true);
  assert.equal(status.durableStorageWrites,1);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.exchangeAuthority,false);
  assert.equal(status.gameplayAuthority,false);
  assert.equal(status.rawWriteAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
  assert.equal(status.serviceReachability.reachable,true);
  assert.equal(env.getExchangeCalls(),0);

  const rows=decisions(env.store);
  assert.equal(rows.length,1);
  const d=rows[0].value;
  assert.equal(d.status,"SHADOW_ADMITTED_NO_SEND");
  assert.equal(d.terminal,true);
  assert.equal(d.targetFunction,"exchange");
  assert.equal(d.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(d.sendCount,0);
  assert.equal(d.selectedWithoutManualInventoryIndex,true);
  assert.equal(d.freshCandidateReresolution,true);
  assert.equal(d.genericExclusivePolicyRelaxed,false);
  assert.equal(d.candidate.index,7);
  assert.equal(d.exchangeAuthority,false);
  assert.equal(d.gameplayAuthority,false);
  assert.equal(d.rawWriteAuthority,false);
});

test("candidate index is discovered rather than pinned to historical index four",async()=>{
  const env=makeEnv({candidateIndex:11});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.candidate.index,11);
  assert.equal(env.getExchangeCalls(),0);
});

test("recovery of exact terminal decision does not rewrite or send",async()=>{
  const shared=storage();
  const firstEnv=makeEnv({candidateIndex:6,store:shared});
  const first=await execute(firstEnv);
  assert.equal(first.status,"BESTANDEN");
  const before=[...shared.seed.entries()];
  assert.equal(before.filter(([k])=>k.startsWith(PREFIX)).length,1);

  const secondEnv=makeEnv({candidateIndex:6,store:shared});
  const second=await execute(secondEnv);
  assert.equal(second.status,"BESTANDEN");
  assert.equal(second.recoveredExistingDecision,true);
  assert.equal(second.durableStorageWrites,0);
  assert.equal(second.gameplayWrites,0);
  assert.equal(second.publicFunctionCalls,0);
  assert.equal(second.rawWriteCalls,0);
  assert.equal(secondEnv.getExchangeCalls(),0);
  assert.deepEqual([...shared.seed.entries()],before);
});

test("multiple safe anniversarygift stacks block autonomous selection",async()=>{
  const env=makeEnv({candidateIndex:7,duplicateIndex:8});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.some(x=>x.startsWith(
    "PR20_8_EXCHANGE_AUTONOMY_SHADOW_KANDIDAT_MEHRDEUTIG:"
  )));
  assert.equal(decisions(env.store).length,0);
  assert.equal(env.getExchangeCalls(),0);
});

test("definition drift blocks before durable decision",async()=>{
  const def=exactDefinition();
  def.exclusive=false;
  const env=makeEnv({definition:def});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_AUTONOMY_SHADOW_ITEM_DEFINITION_DRIFT"
  ));
  assert.equal(decisions(env.store).length,0);
  assert.equal(env.getExchangeCalls(),0);
});

test("admission drift blocks without gameplay writes",async()=>{
  for(const opts of [
    {q:{exchange:{ms:100}}},
    {s:{massexchange:{ms:100}}},
    {s:{massexchangepp:{ms:100}}},
    {moving:true},
    {target:"goo"},
    {dead:true},
    {x:1000,y:1000},
    {freeSlots:0,candidateIndex:7},
    {withExchange:false},
  ]){
    const env=makeEnv(opts);
    const status=await execute(env);
    assert.equal(status.status,"FEHLER");
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
    assert.equal(status.exchangeAuthority,false);
    assert.equal(env.getExchangeCalls(),0);
    assert.equal(decisions(env.store).length,0);
  }
});

test("missing performance trick blocks before durable decision",async()=>{
  const env=makeEnv({withPerformance:false});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_AUTONOMY_SHADOW_PERFORMANCE_TRICK_NICHT_AKTIV"
  ));
  assert.equal(decisions(env.store).length,0);
  assert.equal(env.getExchangeCalls(),0);
});

test("package exposes no Exchange send or raw gameplay write surface",()=>{
  assert.equal(source.includes("selectedWithoutManualInventoryIndex:true"),true);
  assert.equal(source.includes("freshCandidateReresolution:true"),true);
  assert.equal(source.includes("genericExclusivePolicyRelaxed:false"),true);
  assert.equal(source.includes("observedIndexCarriesAuthority:false"),true);
  assert.equal(source.includes("sameIntentRetry:false"),true);
  assert.equal(source.includes("gameplayWrites:0"),true);
  assert.equal(source.includes("publicFunctionCalls:0"),true);
  assert.equal(source.includes("rawWriteCalls:0"),true);
  assert.equal(source.includes("exchangeAuthority:false"),true);
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
