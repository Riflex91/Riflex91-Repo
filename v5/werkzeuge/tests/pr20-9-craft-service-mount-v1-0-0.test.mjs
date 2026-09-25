import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-9-craft-service-mount-v1-0-0.js",
  "utf8",
);

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

function makeBox({
  x=1000,y=1000,map="main",moving=false,q={},target=null,
  dead=false,region="EU",identifier="I",store=storage(),
  smartMoveMode="success",withSmartMove=true,
}={}){
  let moveCalls=0;
  const box={
    console,Date,Promise,Object,Array,String,Number,Boolean,JSON,Math,
    setTimeout:(fn,ms)=>Number(ms)>=1000?{suppressed:true}:setImmediate(fn),
    clearTimeout:()=>{},
    server_region:region,
    server_identifier:identifier,
    B:{sell_dist:400},
    localStorage:store,
    AIO_V3:{},
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      map,x,y,real_x:x,real_y:y,
      moving,target,q,dead,rip:dead,
      items:[{name:"anniversarygift",q:106},null],
    },
  };
  if(withSmartMove){
    box.smart_move=(destination)=>{
      moveCalls+=1;
      assert.equal(destination,"craftsman");
      if(smartMoveMode==="throw") throw new Error("MOVE_THROW");
      if(smartMoveMode==="reject") return Promise.reject(new Error("MOVE_REJECT"));
      if(smartMoveMode==="pending"){
        box.character.moving=true;
        return new Promise(()=>{});
      }
      box.character.map="main";
      box.character.x=92;
      box.character.y=670;
      box.character.real_x=92;
      box.character.real_y=670;
      box.character.moving=false;
      return Promise.resolve({success:true});
    };
  }
  box.parent=box;
  return {box,store,getMoveCalls:()=>moveCalls};
}

async function execute(env){
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-9-craft-service-mount-v1-0-0.js",
  });
  const deadline=Date.now()+4000;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setImmediate(resolve));
    last=env.box.V5PR209CraftServiceMount?.status?.();
    if(last?.terminal || last?.phase==="RECOVERY_PENDING") return last;
  }
  throw new Error("TEST_DID_NOT_SETTLE:"+JSON.stringify(last));
}

test("already in safe Craftsman range completes with zero movement writes",async()=>{
  const env=makeBox({x:92,y:670});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.movementCompleted,true);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(env.getMoveCalls(),0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.craftAuthority,false);
  assert.equal(status.nextAction,
    "RESTORE_PR20_9_CRAFT_DURABLE_SHADOW_MANIFEST");
});

test("out-of-range Merchant issues exactly one smart_move craftsman and arrives",async()=>{
  const env=makeBox();
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.movementIssued,true);
  assert.equal(status.movementCompleted,true);
  assert.equal(status.sendCount,1);
  assert.equal(status.sendBoundaryState,"SEND_MOEGLICH_ODER_VERSUCHT");
  assert.equal(status.durableIntentReadback,true);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(env.getMoveCalls(),1);
  assert.equal(status.recipient.map,"main");
  assert.ok(status.recipient.distanceToCraftsman<=300);
  assert.equal(status.craftAuthority,false);
  assert.equal(status.gameplayAuthority,false);
  assert.equal(status.rawWriteAuthority,false);
});

test("reloading after a completed movement reconciles without second smart_move",async()=>{
  const shared=storage();
  const env=makeBox({store:shared});
  const first=await execute(env);
  assert.equal(first.status,"BESTANDEN");
  assert.equal(env.getMoveCalls(),1);

  delete env.box.V5PR209CraftServiceMount;
  const second=await execute(env);
  assert.equal(second.status,"BESTANDEN");
  assert.equal(second.recoveredExistingIntent,true);
  assert.equal(second.sendCount,1);
  assert.equal(second.gameplayWrites,1);
  assert.equal(second.publicFunctionCalls,1);
  assert.equal(second.rawWriteCalls,0);
  assert.equal(env.getMoveCalls(),1);
  assert.equal(second.sameIntentRetry,false);
});

test("existing sent intent outside service range never sends a second movement",async()=>{
  const seed=new Map();
  const key="v5:pr20-9-craft-service-mount:intent:craft-service";
  seed.set(key,JSON.stringify({
    schemaVersion:1,
    testId:"pr20-9-craft-service-mount",
    version:"1.0.0",
    target:"craftsman",
    sourceCommit:"ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4",
    sendCount:1,
    sendBoundaryState:"SEND_MOEGLICH_ODER_VERSUCHT",
    sameIntentRetry:false,
    movementError:null,
  }));
  const env=makeBox({store:storage(seed),x:1000,y:1000,moving:false});
  const status=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.equal(status.terminal,true);
  assert.ok(status.blocker.includes(
    "PR20_9_CRAFT_SERVICE_MOUNT_MOVEMENT_OUTCOME_UNGEKLAERT_NO_RETRY"
  ));
  assert.equal(env.getMoveCalls(),0);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
});

test("missing smart_move blocks before any gameplay write",async()=>{
  const env=makeBox({withSmartMove:false});
  const status=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes(
    "PR20_9_CRAFT_SERVICE_MOUNT_SMART_MOVE_FEHLT"
  ));
  assert.equal(env.getMoveCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
});

test("q, server, motion and target drift fail closed before movement",async()=>{
  for(const opts of [
    {q:{craft:{ms:100}}},
    {region:"US"},
    {identifier:"II"},
    {moving:true},
    {target:"goo"},
    {dead:true},
  ]){
    const env=makeBox(opts);
    const status=await execute(env);
    assert.equal(status.status,"FEHLER");
    assert.equal(env.getMoveCalls(),0);
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
  }
});

test("package contains exactly one smart_move call surface and no Exchange write surface",()=>{
  assert.equal((source.match(/smartMove\(TARGET\)/g)||[]).length,1);
  assert.equal(source.includes('const TARGET = "craftsman"'),true);
  assert.equal(source.includes("sameIntentRetry: false"),true);
  assert.equal(source.includes("SOURCE_PINNED_SELL_DISTANCE = 400"),true);
  assert.equal(source.includes("SAFETY_DISTANCE = 300"),true);
  for(const marker of [
    "globalThis.exchange(",
    "parent.exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "upgrade(",
    "compound(",
    "buy(",
    "trade_buy(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
    "move(",
  ]) assert.equal(source.includes(marker),false,marker);
});
