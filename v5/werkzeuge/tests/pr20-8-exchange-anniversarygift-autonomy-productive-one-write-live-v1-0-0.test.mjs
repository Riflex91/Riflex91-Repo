import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live-v1-0-0.js",
  "utf8",
);

function localStorage(seed=new Map()){
  const calls={get:0,set:0,remove:0};
  return {
    seed,calls,
    get length(){return seed.size;},
    key(i){return [...seed.keys()][i] ?? null;},
    getItem(key){calls.get+=1;return seed.has(key)?seed.get(key):null;},
    setItem(key,value){calls.set+=1;seed.set(key,String(value));},
    removeItem(key){calls.remove+=1;seed.delete(key);},
  };
}

function anniversaryDefinition(overrides={}){
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

function fastTimeout(fn,ms){
  if(Number(ms) >= 1000 && Number(ms) !== 2000) return {suppressed:true};
  return setImmediate(fn);
}

function makeBox({
  items=[{name:"anniversarygift",q:106},null,null,null],
  esize=null,
  isize=null,
  reward={kind:"gold",amount:5000},
  reject=false,
  s={},
  q={},
  definition=anniversaryDefinition(),
  computer=true,
  map="main",
  x=-25,
  y=-478,
  moving=false,
  target=null,
  dead=false,
  name="My_Merchant",
  ctype="merchant",
  region="EU",
  identifier="I",
  store=localStorage(),
}={}){
  let exchangeCalls=0;
  const size=isize ?? items.length;
  const empty=esize ?? items.slice(0,size).filter(x=>x==null).length;
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
    setTimeout:fastTimeout,
    clearTimeout:()=>{},
    performance_trick(){},
    sounds:{empty:{cplaying:true,playing:()=>true}},
    server_region:region,
    server_identifier:identifier,
    B:{sell_dist:400},
    entities:{},
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
      computer,
      moving,
      target,
      dead,
      rip:dead,
      q,
      s,
      items,
      isize:size,
      esize:empty,
      gold:1000000,
    },
    G:{items:{anniversarygift:definition}},
    localStorage:store,
    AIO_V3:{},
  };

  box.exchange=async(index)=>{
    exchangeCalls+=1;
    if(reject) throw new Error("SIMULATED_REJECT");
    const input=box.character.items[index];
    if(!input || input.name!=="anniversarygift") throw new Error("BAD_INDEX");
    if((input.q??1)>1) input.q-=1;
    else box.character.items[index]=null;

    if(reward.kind==="gold"){
      box.character.gold+=reward.amount;
    }else if(reward.kind==="item"){
      const existing=box.character.items.find(x=>x?.name===reward.name && reward.name!=="cxjar");
      if(existing && existing.q!=null){
        existing.q+=1;
      }else{
        const slot=box.character.items.findIndex(x=>x==null);
        if(slot<0) throw new Error("NO_REWARD_SLOT");
        box.character.items[slot]=reward.name==="cxjar"
          ? {name:"cxjar",data:reward.data}
          : {name:reward.name};
      }
    }else if(reward.kind!=="empty"){
      throw new Error("UNKNOWN_TEST_REWARD");
    }
    box.character.esize=box.character.items.slice(0,size).filter(x=>x==null).length;
    return {success:true,reward:reward.kind==="item"?reward.name:undefined,num:index};
  };
  box.parent=box;
  return {box,store,getExchangeCalls:()=>exchangeCalls};
}

async function execute(env){
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live-v1-0-0.js",
  });
  const deadline=Date.now()+5000;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setImmediate(resolve));
    last=env.box.V5PR208ExchangeAnniversarygiftAutonomyProductiveOneWriteLive?.status?.();
    if(last?.terminal || last?.phase==="RECOVERY_PENDING") return last;
  }
  throw new Error("TEST_DID_NOT_SETTLE:"+JSON.stringify(last));
}

function assertCommitted(status,env,kind){
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.deepEqual(Array.from(status.blocker),[]);
  assert.equal(env.getExchangeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.authority.maximumUses,1);
  assert.equal(status.authority.durableAutonomyDecisionCreated,true);
  assert.equal(status.authority.durableIntentCreated,true);
  assert.equal(status.authority.authorityIssued,true);
  assert.equal(status.authority.authorityConsumed,true);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
  assert.equal(status.authority.rawWriteAuthority,false);
  assert.equal(status.authority.normalExchangeWriteRatification,false);
  assert.equal(status.evidence.reconciliation.classification,"COMMITTED");
  assert.equal(status.evidence.reconciliation.rewardDomain.rewardKind,kind);
  assert.equal(status.evidence.sendCount,1);
  assert.equal(status.evidence.sameIntentRetry,false);
  assert.equal(status.evidence.autonomyDecisionReadback,true);
  assert.equal(status.evidence.selectionMode,"AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN");
  assert.equal(status.evidence.manualPinnedInventoryIndex,false);
  assert.equal(status.evidence.observedIndexCarriesAuthority,false);
  assert.equal(status.evidence.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(status.autonomyDecision.createdThisRun,true);
  assert.equal(status.autonomyDecision.manualPinnedInventoryIndex,false);
  assert.equal(status.autonomyDecision.observedIndexCarriesAuthority,false);
  assert.equal(status.autonomyDecision.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(status.evidence.sourceSnapshotCommit,
    "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(status.evidence.dropGraphSha256,
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342");
}

test("gold reward commits exactly one public exchange call",async()=>{
  const env=makeBox({reward:{kind:"gold",amount:5000}});
  const status=await execute(env);
  assertCommitted(status,env,"gold");
  assert.equal(status.evidence.reconciliation.rewardDomain.goldDelta,5000);
  assert.equal(status.evidence.reconciliation.rewardDomain.inputDelta,-1);
  assert.equal(env.box.character.items[0].q,105);
});

test("fresh current inventory index is selected autonomously and not pinned",async()=>{
  const env=makeBox({
    items:[null,null,{name:"anniversarygift",q:106},null],
    reward:{kind:"gold",amount:5000},
  });
  const status=await execute(env);
  assertCommitted(status,env,"gold");
  assert.equal(status.evidence.candidate.index,2);
  assert.equal(status.autonomyDecision.observedCandidateIndex,2);
  assert.equal(status.evidence.sendArguments.candidateIndex,2);
  assert.equal(env.box.character.items[2].q,105);
});

test("durable autonomy decision precedes intent and binds one-shot authority",async()=>{
  const shared=localStorage();
  const env=makeBox({store:shared,reward:{kind:"gold",amount:5000}});
  const status=await execute(env);
  assertCommitted(status,env,"gold");

  const entries=[...shared.seed.entries()].map(([key,value])=>[key,JSON.parse(value)]);
  const decisionEntry=entries.find(([key])=>key.includes(":autonomy-decision:"));
  const intentEntry=entries.find(([key])=>key.includes(":intent:"));
  const authorityEntry=entries.find(([key])=>key.includes(":authority:"));
  assert.ok(decisionEntry);
  assert.ok(intentEntry);
  assert.ok(authorityEntry);

  const decision=decisionEntry[1];
  const intent=intentEntry[1];
  const authority=authorityEntry[1];
  assert.equal(decision.testId,"pr20-8-exchange-anniversarygift-autonomy-productive-one-write-live");
  assert.equal(decision.prerequisiteAutonomyShadowNotificationId,3020);
  assert.equal(decision.priorCommittedTransactionId,
    "pr20-8-exchange-anniversarygift-productive-one-write-live:0c6a1129be4c9c899f88274fab97108a");
  assert.equal(decision.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(decision.manualPinnedInventoryIndex,false);
  assert.equal(decision.observedIndexCarriesAuthority,false);
  assert.equal(intent.autonomyDecisionId,decision.decisionId);
  assert.equal(intent.autonomyDecisionKey,decisionEntry[0]);
  assert.equal(intent.priorCommittedTransactionGrantsAuthority,false);
  assert.equal(authority.binding.autonomyDecisionId,decision.decisionId);
  assert.equal(authority.maximumUses,1);
  assert.equal(authority.uses,1);
  assert.equal(authority.consumed,true);
  assert.ok(Number(decision.createdAtMs)<=Number(intent.createdAtMs));
  assert.ok(Number(intent.createdAtMs)<=Number(authority.issuedAtMs));
});

test("second legal gold reward is accepted",async()=>{
  const env=makeBox({reward:{kind:"gold",amount:20000}});
  const status=await execute(env);
  assertCommitted(status,env,"gold");
  assert.equal(status.evidence.reconciliation.rewardDomain.goldDelta,20000);
});

test("physical reward merged into an existing stack is reconciled semantically",async()=>{
  const env=makeBox({
    items:[{name:"anniversarygift",q:106},{name:"cake",q:5},null],
    reward:{kind:"item",name:"cake"},
  });
  const status=await execute(env);
  assertCommitted(status,env,"inventory");
  assert.equal(env.box.character.items[1].q,6);
  assert.deepEqual(
    Array.from(status.evidence.reconciliation.rewardDomain.positives[0]),
    ["cake",1],
  );
});

test("allowed cxjar data is a valid single physical reward",async()=>{
  const env=makeBox({reward:{kind:"item",name:"cxjar",data:"makeawish"}});
  const status=await execute(env);
  assertCommitted(status,env,"inventory");
  assert.deepEqual(
    Array.from(status.evidence.reconciliation.rewardDomain.positives[0]),
    ["cxjar|makeawish",1],
  );
});

test("empty reward commits with only exact input consumption",async()=>{
  const env=makeBox({reward:{kind:"empty"}});
  const status=await execute(env);
  assertCommitted(status,env,"empty");
  assert.equal(status.evidence.reconciliation.rewardDomain.goldDelta,0);
  assert.equal(status.evidence.reconciliation.rewardDomain.positives.length,0);
});

test("immediate public wrapper rejection is terminal NOT_APPLIED and never retries",async()=>{
  const env=makeBox({reject:true});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.evidence.reconciliation.classification,"NOT_APPLIED");
  assert.equal(env.getExchangeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
});

test("terminal committed intent recovery does not send a second time",async()=>{
  const shared=localStorage();
  const env=makeBox({store:shared,reward:{kind:"gold",amount:5000}});
  const first=await execute(env);
  assertCommitted(first,env,"gold");
  const callsAfterFirst=env.getExchangeCalls();

  delete env.box.V5PR208ExchangeAnniversarygiftAutonomyProductiveOneWriteLive;
  const second=await execute(env);
  assert.equal(second.status,"BESTANDEN");
  assert.equal(second.terminal,true);
  assert.equal(env.getExchangeCalls(),callsAfterFirst);
  assert.equal(second.gameplayWrites,1);
  assert.equal(second.publicFunctionCalls,1);
  assert.equal(second.rawWriteCalls,0);
  assert.equal(second.sameIntentRetry,false);
});

test("no empty inventory slot blocks before any gameplay write",async()=>{
  const env=makeBox({
    items:[{name:"anniversarygift",q:106},{name:"hpot1",q:100}],
    esize:0,
    isize:2,
  });
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_OUTPUTSPACE_FEHLT"
  ));
  assert.equal(env.getExchangeCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
});

test("mass exchange conditions block before authority or send",async()=>{
  for(const s of [{massexchange:{ms:1000}},{massexchangepp:{ms:1000}}]){
    const env=makeBox({s});
    const status=await execute(env);
    assert.equal(status.status,"FEHLER");
    assert.equal(env.getExchangeCalls(),0);
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
    assert.equal(status.authority.authorityIssued,false);
  }
});

test("ambiguous anniversarygift stacks block before send",async()=>{
  const env=makeBox({
    items:[
      {name:"anniversarygift",q:50},
      {name:"anniversarygift",q:56},
      null,
    ],
  });
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_KANDIDAT_NICHT_EINDEUTIG"
  ));
  assert.equal(env.getExchangeCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
});

test("definition drift blocks fail-closed",async()=>{
  for(const definition of [
    anniversaryDefinition({e:2}),
    anniversaryDefinition({g:101}),
    anniversaryDefinition({exclusive:false}),
    anniversaryDefinition({type:"quest"}),
    anniversaryDefinition({s:1}),
  ]){
    const env=makeBox({definition});
    const status=await execute(env);
    assert.equal(status.status,"FEHLER");
    assert.ok(status.blocker.includes(
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_ITEM_DEFINITION_DRIFT"
    ));
    assert.equal(env.getExchangeCalls(),0);
  }
});

test("unprovable poststate is UNKNOWN fail-closed and never retries",async()=>{
  const env=makeBox({reward:{kind:"item",name:"not_allowed_autonomy_reward"}});
  const status=await execute(env);
  assert.equal(status.status,"UNGEKLAERT");
  assert.equal(status.phase,"RECOVERY_PENDING");
  assert.equal(status.terminal,false);
  assert.equal(status.evidence.reconciliation.classification,"UNKNOWN");
  assert.equal(env.getExchangeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.authority.authorityIssued,true);
  assert.equal(status.authority.authorityConsumed,true);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
});

test("service distance over 300 blocks even with computer before authority or send",async()=>{
  const env=makeBox({computer:true,x:400,y:-478});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_SERVICE_NICHT_ERREICHBAR"
  ));
  assert.equal(env.getExchangeCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.authority.authorityIssued,false);
});

test("q moving target and hostile aggro each block before authority or send",async()=>{
  const cases=[
    [()=>makeBox({q:{exchange:{ms:1}}}),
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_Q_NICHT_FREI"],
    [()=>makeBox({moving:true}),
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_CHARACTER_BEWEGT_SICH"],
    [()=>makeBox({target:"goo"}),
      "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_CHARACTER_HAT_ZIEL"],
    [()=>{
      const env=makeBox();
      env.box.entities.hostile={type:"monster",dead:false,rip:false,target:"My_Merchant"};
      return env;
    },"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_PRODUCTIVE_CHARACTER_UNTER_ANGRIFF"],
  ];
  for(const [make,marker] of cases){
    const env=make();
    const status=await execute(env);
    assert.equal(status.status,"FEHLER");
    assert.ok(status.blocker.includes(marker),marker);
    assert.equal(env.getExchangeCalls(),0);
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
    assert.equal(status.authority.authorityIssued,false);
  }
});

test("runner source exposes exactly one public wrapper call and no raw bypass",()=>{
  assert.equal((source.match(/globalThis\.exchange\(/g)||[]).length,1);
  for(const marker of [
    "parent.exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "buy(",
    "buy_with_gold(",
    "trade_buy(",
    "upgrade(",
    "compound(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    'const SOURCE_COMMIT = "90052162eb3ebda36c893e1eb4af643913c8f984"',
    'const DROP_GRAPH_SHA256 = "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342"',
    "maximumPhysicalOutputs:1",
    "minimumPreSendEmptySlots:REQUIRED_EMPTY_SLOTS",
    "sameIntentRetry:false",
    "maximumUses:1",
    "durableAutonomyDecisionCreated",
    "AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN",
    "priorCommittedTransactionGrantsAuthority:false",
    "autonomyDecisionId",
    "state.gameplayWrites += 1",
    "state.publicFunctionCalls += 1",
    'classification:"UNKNOWN"',
  ]) assert.ok(source.includes(marker),marker);
});
