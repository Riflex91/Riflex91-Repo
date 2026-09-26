import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source=fs.readFileSync(
  "werkzeuge/pr20-9-craft-durable-shadow-natural-recheck-no-write.js",
  "utf8",
);
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-durable-shadow-natural-recheck.json",
  "utf8",
));

class MemoryStorage {
  constructor(){ this.rows=new Map(); }
  getItem(key){ return this.rows.has(String(key))?this.rows.get(String(key)):null; }
  setItem(key,value){ this.rows.set(String(key),String(value)); }
}

function candidateItems() {
  const items=Array(12).fill(null);
  items[2]={name:"iron",q:2};
  items[5]={name:"wood",q:1};
  return items;
}

function sandbox({candidate=false}={}) {
  let craftCalls=0;
  let autoCraftCalls=0;
  let longTimer=null;
  const storage=new MemoryStorage();
  const box={
    console,Date,Promise,Object,Array,String,Number,Boolean,JSON,Math,Set,Map,
    Uint8Array,TextEncoder,crypto:webcrypto,localStorage:storage,
    setTimeout(fn,ms){
      if(Number(ms)>=60000){ longTimer=fn; return 99; }
      return setImmediate(fn);
    },
    clearTimeout(id){ if(id===99) longTimer=null; },
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
      gold:100000,
      esize:1,
      items:candidate?candidateItems():Array(12).fill(null),
    },
    G:{
      items:{
        iron:{type:"material",g:100},
        wood:{type:"material",g:50},
        sword:{type:"weapon",g:2000},
      },
      craft:{
        sword:{cost:1000,items:[[2,"iron",0],[1,"wood",0]]},
      },
    },
  };
  box.parent=box;
  return {
    box,storage,
    craftCalls:()=>craftCalls,
    autoCraftCalls:()=>autoCraftCalls,
    fireLongTimer:()=>{ const fn=longTimer; longTimer=null; if(fn) fn(); return !!fn; },
  };
}

async function waitFor(env,predicate) {
  for(let i=0;i<400;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    const status=env.box.V5PR209CraftDurableShadowNaturalRecheckNoWrite?.status?.();
    if(status && predicate(status)) return status;
  }
  throw new Error("TEST_STATE_TIMEOUT");
}

function install(env) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-9-craft-durable-shadow-natural-recheck-no-write.js",
  });
}

test("PR20.9 natural recheck waits without writes and rechecks automatically",async()=>{
  const env=sandbox({candidate:false});
  install(env);
  const waiting=await waitFor(env,s=>s.status==="WAITING_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE");
  assert.equal(waiting.terminal,false);
  assert.equal(waiting.phase,"WAITING_CANDIDATE");
  assert.deepEqual(Array.from(waiting.blocker),["PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT"]);
  assert.equal(waiting.recheckCount,1);
  assert.ok(Number(waiting.nextRecheckAtMs)>0);
  assert.equal(env.storage.rows.size,0);
  assert.equal(env.craftCalls(),0);
  assert.equal(env.autoCraftCalls(),0);

  env.box.character.items=candidateItems();
  assert.equal(env.fireLongTimer(),true);
  const done=await waitFor(env,s=>s.terminal===true);
  assert.equal(done.status,"BESTANDEN");
  assert.equal(done.phase,"COMPLETE");
  assert.equal(done.evidence.evidenceArt,"V5_PR20_9_CRAFT_DURABLE_SHADOW_NO_WRITE");
  assert.equal(done.evidence.candidate.recipeName,"sword");
  assert.equal(done.evidence.gameplayWrites,0);
  assert.equal(done.evidence.publicFunctionCalls,0);
  assert.equal(done.evidence.rawWriteCalls,0);
  assert.equal(done.evidence.craftAuthority,false);
  assert.equal(done.evidence.normalRuntimeAllowed,false);
  assert.equal(env.storage.rows.size,1);
  assert.equal(env.craftCalls(),0);
  assert.equal(env.autoCraftCalls(),0);
});

test("PR20.9 natural recheck is still strict NORMAL_CRAFT_ONLY no-write",()=>{
  assert.equal(contract.status,"PREPARED_NO_WRITE");
  assert.equal(contract.testId,"pr20-9-craft-durable-shadow-natural-recheck-no-write");
  assert.equal(contract.controllerVersion,"1.1.0");
  assert.equal(contract.scope,"NORMAL_CRAFT_ONLY");
  assert.equal(contract.recheckPolicy.intervalMs,60000);
  assert.equal(contract.recheckPolicy.naturalCurrentInventoryOnly,true);
  assert.equal(contract.recheckPolicy.candidateAcquisitionOrMutationAllowed,false);
  assert.equal(contract.authority.craftAuthority,false);
  assert.equal(contract.authority.gameplayAuthority,false);
  assert.equal(contract.authority.rawWriteAuthority,false);
  assert.equal(contract.authority.normalRuntimeAllowed,false);
  assert.equal(contract.writes.maximumGameplayWrites,0);
  assert.equal(contract.writes.maximumPublicFunctionCalls,0);
  assert.equal(contract.writes.maximumRawWriteCalls,0);
  assert.equal(contract.pr21Boundary.countsAsPr20_9ProductiveRatification,false);
  assert.equal(contract.pr21Boundary.pr21LivePreflightRemainsBlockedUntilPr20_9Ratified,true);

  for(const marker of [
    "craft(","auto_craft(","compound(","upgrade(","exchange(","buy(",
    "buy_with_gold(","send_item(","send_gold(","start_character(",
    "command_character(","use_skill(","equip(","unequip(","api_call(",
    "socket.emit(",".socket.emit(",
  ]) assert.equal(source.includes(marker),false,marker);

  for(const marker of [
    "NATURAL_CANDIDATE_RECHECK_MS=60_000",
    "WAITING_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE",
    "PR20_9_CRAFT_SHADOW_NATURAL_CANDIDATE_WAITING",
    "gameplayWrites:0",
    "publicFunctionCalls:0",
    "rawWriteCalls:0",
    "sameIntentRetry:false",
    "normalRuntimeAllowed:false",
    "craftAuthority:false",
    "journalTerminalArt:'ABBRUCH'",
    "sendBoundaryState:'NICHT_GESENDET'",
    "reconciliationClassification:'NOT_APPLIED'",
  ]) assert.ok(source.includes(marker),marker);
});
