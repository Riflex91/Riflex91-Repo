import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-exchange-anniversarygift-service-reposition-v1-0-0.js",
  "utf8",
);

function makeBox({
  map="main",
  x=1000,
  y=1000,
  computer=false,
  q={},
  moving=false,
  target=null,
  hostile=false,
  serverRegion="EU",
  serverIdentifier="I",
  performance=true,
  moveReject=false,
}={}){
  let smartMoveCalls=0;
  let exchangeCalls=0;
  const character={
    name:"My_Merchant",
    id:"My_Merchant",
    ctype:"merchant",
    map,x,y,real_x:x,real_y:y,
    computer,moving,target,q,
    items:[{name:"anniversarygift",q:106},null],
    esize:1,
    rip:false,dead:false,
  };
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
    setTimeout:(fn)=>setImmediate(fn),
    clearTimeout:()=>{},
    performance_trick(){},
    sounds:{empty:{cplaying:performance,playing:()=>performance}},
    server_region:serverRegion,
    server_identifier:serverIdentifier,
    entities:hostile?{
      bad:{type:"monster",dead:false,rip:false,target:"My_Merchant"}
    }:{},
    character,
    G:{items:{anniversarygift:{type:"gem"}}},
    AIO_V3:{},
    smart_move:async destination=>{
      smartMoveCalls+=1;
      assert.equal(destination,"exchange");
      if(moveReject) throw new Error("SIMULATED_MOVE_REJECT");
      character.map="main";
      character.x=character.real_x=-26;
      character.y=character.real_y=-432;
      character.moving=false;
      return {success:true};
    },
    exchange(){
      exchangeCalls+=1;
      throw new Error("EXCHANGE_MUST_NOT_BE_CALLED");
    },
  };
  box.parent=box;
  return {
    box,
    getSmartMoveCalls:()=>smartMoveCalls,
    getExchangeCalls:()=>exchangeCalls,
  };
}

async function execute(env){
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-exchange-anniversarygift-service-reposition-v1-0-0.js",
  });
  const deadline=Date.now()+5000;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setImmediate(resolve));
    last=env.box.V5PR208ExchangeAnniversarygiftServiceReposition?.status?.();
    if(last?.terminal) return last;
  }
  throw new Error("TEST_DID_NOT_SETTLE:"+JSON.stringify(last));
}

test("already reachable completes with zero gameplay writes",async()=>{
  const env=makeBox({x:-26,y:-432});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.movementIssued,false);
  assert.equal(status.movementCompleted,true);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(env.getSmartMoveCalls(),0);
  assert.equal(env.getExchangeCalls(),0);
  assert.equal(status.after.serviceReachable,true);
  assert.ok(status.after.distanceToExchangeNpc<50);
});

test("unreachable merchant gets exactly one smart_move exchange call",async()=>{
  const env=makeBox({x:1000,y:1000});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.movementIssued,true);
  assert.equal(status.movementCompleted,true);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.exchangeAuthority,false);
  assert.equal(status.gameplayAuthority,false);
  assert.equal(status.rawWriteAuthority,false);
  assert.equal(status.normalExchangeWriteRatification,false);
  assert.equal(env.getSmartMoveCalls(),1);
  assert.equal(env.getExchangeCalls(),0);
  assert.equal(status.after.map,"main");
  assert.equal(status.after.x,-26);
  assert.equal(status.after.y,-432);
  assert.equal(status.after.serviceReachable,true);
  assert.ok(status.after.distanceToExchangeNpc<50);
  assert.equal(status.nextAction,
    "RESTORE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_V1_0_1");
});

test("smart_move rejection is terminal and never retries",async()=>{
  const env=makeBox({moveReject:true});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.equal(status.terminal,true);
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_SERVICE_REPOSITION_MOVE_FEHLER_NO_RETRY"
  ));
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(env.getSmartMoveCalls(),1);
  assert.equal(env.getExchangeCalls(),0);
});

test("q, target, aggro and server drift block before movement",async()=>{
  for(const opts of [
    {q:{upgrade:{ms:1}}},
    {target:"enemy"},
    {hostile:true},
    {serverRegion:"US"},
    {serverIdentifier:"II"},
  ]){
    const env=makeBox(opts);
    const status=await execute(env);
    assert.equal(status.terminal,true);
    assert.equal(status.status,"BLOCKIERT");
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
    assert.equal(env.getSmartMoveCalls(),0);
    assert.equal(env.getExchangeCalls(),0);
  }
});

test("performance trick failure blocks before movement",async()=>{
  const env=makeBox({performance:false});
  const status=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes(
    "PR20_8_EXCHANGE_SERVICE_REPOSITION_PERFORMANCE_TRICK_BLOCKED"
  ));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(env.getSmartMoveCalls(),0);
  assert.equal(env.getExchangeCalls(),0);
});

test("package is movement-only and contains no Exchange mutation bypass",()=>{
  assert.ok(source.includes(
    'const SMART_MOVE_TARGET = "exchange"'
  ));
  assert.ok(source.includes(
    'const SMART_MOVE_RESOLVED_TARGET = Object.freeze({map:"main",x:-26,y:-432})'
  ));
  assert.ok(source.includes(
    'const EXCHANGE_NPC = Object.freeze({map:"main",x:-25,y:-478})'
  ));
  assert.ok(source.includes("smartMove(SMART_MOVE_TARGET)"));
  assert.equal((source.match(/smartMove\(SMART_MOVE_TARGET\)/g)||[]).length,1);

  for(const marker of [
    "globalThis.exchange(",
    "parent.exchange(",
    ".exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "upgrade(",
    "compound(",
    "buy(",
    "buy_with_gold(",
    "trade_buy(",
    "send_item(",
    "send_gold(",
    "bank_retrieve(",
    "bank_store(",
  ]) assert.equal(source.includes(marker),false,marker);
});
