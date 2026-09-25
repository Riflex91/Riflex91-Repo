import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-exchange-anniversarygift-durable-shadow-no-write.js",
  "utf8",
);

function definition(overrides={}){
  return {
    type:"gem",
    skin:"anniversarygift",
    name:"Anniversary Gift",
    explanation:"Ten years, tied with a ribbon.",
    s:9999,
    g:100,
    e:1,
    exclusive:true,
    cx:{accent:"#3DB5A5"},
    ...overrides,
  };
}

function storage(seed=new Map()){
  const calls={get:0,set:0};
  return {
    calls,
    seed,
    getItem(key){calls.get+=1;return seed.has(key)?seed.get(key):null;},
    setItem(key,value){calls.set+=1;seed.set(key,String(value));},
  };
}

function makeBox({
  items=[{name:"anniversarygift",q:106}],
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
    sounds:{empty:performanceActive?{cplaying:true,playing:()=>true}:{cplaying:false,playing:()=>false}},
    server_region:region,
    server_identifier:identifier,
    character:{
      name,
      id:name,
      ctype,
      level:58,
      map:"main",
      moving,
      target,
      dead,
      rip:dead,
      q,
      items,
    },
    G:{items:{anniversarygift:def}},
    localStorage:localStore,
    AIO_V3:{},
  };
  if(runtime) box.AIO_V3.__runtime=runtime;
  if(exchangeAvailable) box.exchange=()=>{exchangeCalls+=1;throw new Error("EXCHANGE_MUST_NOT_BE_CALLED");};
  box.parent=box;
  return {box,localStore,getExchangeCalls:()=>exchangeCalls};
}

async function run(options={}){
  const ctx=makeBox(options);
  vm.createContext(ctx.box);
  vm.runInContext(source,ctx.box,{
    filename:"pr20-8-exchange-anniversarygift-durable-shadow-no-write.js",
  });
  for(let i=0;i<30;i+=1){
    await new Promise(resolve=>setImmediate(resolve));
    const status=ctx.box.V5PR208ExchangeAnniversarygiftDurableShadowNoWrite?.status?.();
    if(status?.terminal) return {...ctx,status};
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

test("exact anniversarygift candidate creates one durable no-send shadow and zero gameplay writes",async()=>{
  const {status,localStore,getExchangeCalls}=await run();
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.deepEqual(status.blocker,[]);
  assert.equal(status.sourceEvidence.scannerVersion,"1.0.7");
  assert.equal(status.sourceEvidence.notificationId,2726);
  assert.equal(status.candidate.name,"anniversarygift");
  assert.equal(status.candidate.index,0);
  assert.equal(status.candidate.quantity,106);
  assert.equal(status.candidate.exchangeQuantity,1);
  assert.equal(status.candidate.baseGold,100);
  assert.equal(status.candidate.exclusive,true);
  assert.equal(status.candidate.observedIndexCarriesAuthority,false);
  assert.equal(status.shadowIntent.storage,"LOCAL_STORAGE_SHADOW_ONLY");
  assert.equal(status.shadowIntent.journalTerminalArt,"ABBRUCH");
  assert.equal(status.shadowIntent.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(status.shadowIntent.freshReresolutionRequiredBeforeFutureSend,true);
  assert.equal(status.shadowIntent.fullRewardDomainProofRequiredBeforeFutureSend,true);
  assert.equal(status.shadowIntent.createdThisRun,true);
  assert.equal(status.durableStorageWrites,1);
  assert.equal(localStore.calls.set,1);
  assert.equal(getExchangeCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.authority.authorityIssued,false);
  assert.equal(status.authority.durableIntentCreated,false);
  assert.equal(status.authority.shadowDurableIntentCreated,true);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
  assert.equal(status.authority.rawWriteAuthority,false);
  assert.equal(status.authority.normalExchangeWriteRatification,false);
  assert.equal(status.normalRuntimeAllowed,false);

  const [raw]=localStore.seed.values();
  const intent=JSON.parse(raw);
  assert.equal(intent.art,"PR20_8_EXCHANGE_ANNIVERSARYGIFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE");
  assert.equal(intent.actionContractId,"AL-ACTION-EXCHANGE");
  assert.equal(intent.recoveryContractId,"AL-RECOVERY-EXCHANGE");
  assert.equal(intent.verifierId,"AL-VERIFIER-EXCHANGE");
  assert.equal(intent.publicFunction,"exchange");
  assert.equal(intent.oneShot.bindingPrepared,true);
  assert.equal(intent.oneShot.maximumUses,1);
  assert.equal(intent.oneShot.exchangeAuthorityIssued,false);
  assert.equal(intent.massExchangeAllowed,false);
  assert.equal(intent.recursiveDropAuthority,false);
  assert.equal(intent.specialMultiOutputAuthority,false);
  assert.equal(intent.exchangeAuthority,false);
  assert.equal(intent.normalExchangeWriteRatification,false);
});

test("exact existing terminal shadow is recovered without rewrite or send",async()=>{
  const shared=storage();
  const first=await run({localStore:shared});
  assert.equal(first.status.status,"BESTANDEN");
  assert.equal(shared.calls.set,1);
  const second=await run({localStore:shared});
  assert.equal(second.status.status,"BESTANDEN");
  assert.equal(second.status.shadowIntent.recoveredExistingTerminal,true);
  assert.equal(second.status.shadowIntent.createdThisRun,false);
  assert.equal(second.status.durableStorageWrites,0);
  assert.equal(shared.calls.set,1);
  assert.equal(second.getExchangeCalls(),0);
  assert.equal(second.status.gameplayWrites,0);
  assert.equal(second.status.rawWriteCalls,0);
});

test("definition drift is fail-closed before durable storage",async()=>{
  for(const def of [
    definition({type:"quest"}),
    definition({g:101}),
    definition({e:2}),
    definition({s:1}),
    definition({exclusive:false}),
    definition({cash:true}),
    definition({event:true}),
    definition({quest:true}),
    definition({skin:"other"}),
    definition({cx:{accent:"#000000"}}),
  ]){
    const localStore=storage();
    const {status}=await run({def,localStore});
    assert.equal(status.status,"BLOCKIERT");
    assert.ok(status.blocker.includes(
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_SHADOW_ITEM_DEFINITION_DRIFT"
    ));
    assert.equal(localStore.calls.set,0);
  }
});

test("unsafe or missing physical input remains blocked",async()=>{
  for(const item of [
    {name:"anniversarygift",q:106,gift:1},
    {name:"anniversarygift",q:106,p:"rare"},
    {name:"anniversarygift",q:106,l:true},
    {name:"anniversarygift",q:106,blocked:true},
    {name:"otherexclusive",q:106},
  ]){
    const localStore=storage();
    const {status}=await run({items:[item],localStore});
    assert.equal(status.status,"BLOCKIERT");
    assert.ok(status.blocker.includes(
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_SHADOW_EXAKTER_INPUT_FEHLT"
    ));
    assert.equal(localStore.calls.set,0);
  }
});

test("session and runtime fences block before shadow persistence",async()=>{
  const variants=[
    {q:{exchange:{ms:1}}},
    {moving:true},
    {target:"mob-1"},
    {dead:true},
    {name:"OtherMerchant"},
    {ctype:"mage"},
    {region:"US"},
    {identifier:"II"},
    {performanceActive:false},
    {exchangeAvailable:false},
    {runtime:{timer:1,status:()=>({running:true})}},
  ];
  for(const variant of variants){
    const localStore=storage();
    const {status}=await run({...variant,localStore});
    assert.equal(status.status,"BLOCKIERT",JSON.stringify(variant));
    assert.equal(localStore.calls.set,0);
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
    assert.equal(status.authority.exchangeAuthority,false);
  }
});

test("terminal shadow intent drift blocks instead of rewriting",async()=>{
  const shared=storage();
  const first=await run({localStore:shared});
  assert.equal(first.status.status,"BESTANDEN");
  const [key]=shared.seed.keys();
  const decoded=JSON.parse(shared.seed.get(key));
  decoded.exchangeAuthority=true;
  shared.seed.set(key,JSON.stringify(decoded));
  const beforeSets=shared.calls.set;
  const second=await run({localStore:shared});
  assert.equal(second.status.status,"BLOCKIERT");
  assert.ok(second.status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_SHADOW_TERMINAL_INTENT_DRIFT"
  ));
  assert.equal(shared.calls.set,beforeSets);
  assert.equal(second.getExchangeCalls(),0);
});

test("package has no gameplay mutation or raw bypass call surface",()=>{
  for(const marker of [
    "exchange(",
    "upgrade(",
    "compound(",
    "buy(",
    "buy_with_gold(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "equip(",
    "unequip(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    "gameplayWrites: 0",
    "publicFunctionCalls: 0",
    "rawWriteCalls: 0",
    "sameIntentRetry: false",
    "normalRuntimeAllowed: false",
    "exchangeAuthority: false",
    "normalExchangeWriteRatification: false",
    "freshReresolutionRequiredBeforeFutureSend:true",
    "fullRewardDomainProofRequiredBeforeFutureSend:true",
  ]) assert.ok(source.includes(marker),marker);
});
