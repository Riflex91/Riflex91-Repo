import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-compound-productive-one-write-live.js",
  "utf8",
);

class MemoryStorage {
  constructor(initial=new Map()) {
    this.rows=initial;
    this.onSet=null;
  }
  setItem(key,value) {
    this.rows.set(String(key),String(value));
    if(typeof this.onSet==="function") this.onSet(String(key),String(value));
  }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  removeItem(key) { this.rows.delete(String(key)); }
  key(index) { return [...this.rows.keys()][index] ?? null; }
  get length() { return this.rows.size; }
}

function fakeClock(start=3_000_000) {
  let now=start;
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  function setTimeoutFake(fn,ms=0) {
    now += Number(ms)||0;
    Promise.resolve().then(fn);
    return 1;
  }
  return {FakeDate,setTimeoutFake,now:()=>now};
}

function baseItems() {
  const items=Array(30).fill(null);
  items[1]={name:"hpamulet",level:0};
  items[22]={name:"hpamulet",level:0};
  items[23]={name:"hpamulet",level:0};
  items[18]={name:"cscroll0",q:20};
  return items;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sandbox({
  mode="success",
  storage=new MemoryStorage(),
  items=baseItems(),
  q={},
  massproduction=null,
  massproductionpp=null,
  driftAfterAuthorityConsume=false,
}={}) {
  const clock=fakeClock();
  let compoundCalls=0;
  let sendSnapshot=null;

  const s={};
  if(massproduction) s.massproduction=clone(massproduction);
  if(massproductionpp) s.massproductionpp=clone(massproductionpp);

  const box={
    console,
    crypto:webcrypto,
    TextEncoder,
    Uint8Array,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Promise,
    Map,
    Set,
    Math,
    Date:clock.FakeDate,
    setTimeout:clock.setTimeoutFake,
    clearTimeout() {},
    localStorage:storage,
    user_id:"account-1",
    server_region:"EU",
    server_identifier:"I",
    entities:{},
    B:{sell_dist:400},
    S:{cgrace:{}},
    G:{
      items:{
        hpamulet:{type:"amulet",compound:{hp:240},g:20000,grades:[7,8,9,10]},
        cscroll0:{type:"cscroll",grade:0,g:6400},
      },
      maps:{main:{ref:{c_mid:[-180,-203]}}},
    },
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      owner:"account-1",
      ctype:"merchant",
      level:58,
      map:"main",
      x:-100,
      y:-160,
      rip:false,
      dead:false,
      moving:false,
      target:null,
      q:clone(q),
      s,
      p:{
        ograce:null,
        c_roll:null,
        c_item:null,
        c_itemx:null,
      },
      items:clone(items),
    },
    sounds:{
      empty:{
        cplaying:true,
        playing(){ return true; },
      },
    },
    performance_trick() {},
  };

  function captureSendSnapshot() {
    const intent=[...storage.rows.entries()]
      .filter(([key])=>key.includes(":intent:"))
      .map(([,value])=>JSON.parse(value))[0] ?? null;
    const authority=[...storage.rows.entries()]
      .filter(([key])=>key.includes(":authority:"))
      .map(([,value])=>JSON.parse(value))[0] ?? null;
    sendSnapshot={intent,authority};
  }

  box.compound=async (item0,item1,item2,scrollIndex,offering,onlyCalculate) => {
    compoundCalls += 1;
    captureSendSnapshot();
    assert.deepEqual([item0,item1,item2],[1,22,23]);
    assert.equal(scrollIndex,18);
    assert.equal(offering,null);
    assert.equal(onlyCalculate,false);

    if(mode==="notApplied") return {failed:true,reason:"simulated_reject"};

    if(box.character.s.massproduction) delete box.character.s.massproduction;
    if(box.character.s.massproductionpp) delete box.character.s.massproductionpp;
    box.character.p.c_roll=0.1;
    box.character.q.compound={ms:1000,num:item0};
    box.character.items[item0]={name:"placeholder"};
    box.character.items[item1]=null;
    box.character.items[item2]=null;
    box.character.items[scrollIndex].q -= 1;

    if(mode==="hungPromise") {
      box.setTimeout(() => {
        delete box.character.q.compound;
        box.character.items[item0]={name:"hpamulet",level:1};
        box.character.p.c_item=null;
        box.character.p.c_itemx=null;
      },1000);
      return new Promise(() => {});
    }

    if(mode==="pending") return {in_progress:true};

    box.setTimeout(() => {
      delete box.character.q.compound;
      box.character.items[item0]=mode==="failure"
        ? null
        : {name:"hpamulet",level:1};
      box.character.p.c_item=null;
      box.character.p.c_itemx=null;
    },1000);
    return {in_progress:true};
  };

  if(driftAfterAuthorityConsume) {
    storage.onSet=(key,value)=>{
      if(!key.includes(":authority:")) return;
      const parsed=JSON.parse(value);
      if(parsed.consumed===true && parsed.uses===1) {
        box.character.s.massproduction={ms:999};
      }
    };
  }

  box.parent=box;
  box.globalThis=box;
  return {
    box,
    storage,
    compoundCalls:()=>compoundCalls,
    sendSnapshot:()=>sendSnapshot,
    clock,
  };
}

async function execute(env,{terminal=true,maxTicks=8000}={}) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-compound-productive-one-write-live.js",
  });
  const api=env.box.V5PR208CompoundProductiveOneWriteLive;
  assert.ok(api);
  const p1=api.start();
  const p2=api.start();
  assert.equal(p1,p2);
  for(let i=0;i<maxTicks;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    const status=api.status();
    if(terminal && status.terminal===true) return status;
    if(!terminal && status.phase==="RECOVERY_PENDING") return status;
  }
  throw new Error("TEST_DID_NOT_REACH_EXPECTED_STATE");
}

function intentRows(storage) {
  return [...storage.rows.entries()]
    .filter(([key])=>key.includes(":intent:"))
    .map(([key,value])=>({key,value:JSON.parse(value)}));
}

function authorityRows(storage) {
  return [...storage.rows.entries()]
    .filter(([key])=>key.includes(":authority:"))
    .map(([key,value])=>({key,value:JSON.parse(value)}));
}

test("PR20.8 Compound one-write persists admission before exactly one successful send", async () => {
  const env=sandbox({mode:"success"});
  const status=await execute(env);

  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.normalRuntimeAllowed,false);
  assert.equal(status.authority.authorityIssued,true);
  assert.equal(status.authority.authorityConsumed,true);
  assert.equal(status.authority.compoundAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);

  const beforeSend=env.sendSnapshot();
  assert.equal(beforeSend.intent.status,"OUTCOME_PENDING");
  assert.equal(beforeSend.intent.sendCount,1);
  assert.equal(beforeSend.intent.sendBoundaryState,"SEND_MOEGLICH_ODER_VERSUCHT");
  assert.equal(beforeSend.intent.sameIntentRetry,false);
  assert.deepEqual(Array.from(beforeSend.intent.candidate.indexes),[1,22,23]);
  assert.equal(beforeSend.authority.maximumUses,1);
  assert.equal(beforeSend.authority.uses,1);
  assert.equal(beforeSend.authority.consumed,true);
  assert.equal(beforeSend.authority.revoked,false);
  assert.deepEqual(Array.from(beforeSend.authority.binding.candidateIndexes),[1,22,23]);
  assert.match(beforeSend.intent.fingerprints.compoundEffectsFingerprintSha256,/^[a-f0-9]{64}$/);
  assert.equal(
    beforeSend.authority.binding.compoundEffectsFingerprintSha256,
    beforeSend.intent.fingerprints.compoundEffectsFingerprintSha256,
  );
  assert.equal(
    beforeSend.authority.binding.runnerInstanceId,
    beforeSend.intent.runnerInstanceId,
  );

  const intents=intentRows(env.storage);
  assert.equal(intents.length,1);
  assert.equal(intents[0].value.status,"COMMITTED");
  assert.equal(intents[0].value.sendCount,1);
  assert.equal(intents[0].value.outcome.classification,"COMMITTED_SUCCESS");

  const e=status.evidence;
  assert.equal(e.evidenceArt,"V5_PR20_8_COMPOUND_PRODUCTIVE_ONE_WRITE_LIVE");
  assert.equal(e.status,"BESTANDEN");
  assert.equal(e.candidate.name,"hpamulet");
  assert.equal(e.candidate.level,0);
  assert.deepEqual(Array.from(e.candidate.indexes),[1,22,23]);
  assert.equal(e.scroll.name,"cscroll0");
  assert.equal(e.scroll.index,18);
  assert.equal(e.scroll.observedQuantity,20);
  assert.equal(e.offering,null);
  assert.deepEqual(Array.from(e.sendArguments.candidateIndexes),[1,22,23]);
  assert.equal(e.sendArguments.onlyCalculate,false);
  assert.equal(e.sendCount,1);
  assert.equal(e.reconciliation.classification,"COMMITTED_SUCCESS");
  assert.equal(e.reconciliation.scrollQuantityNow,19);
  assert.equal(e.reconciliation.conditionConsumptionReconciled,true);
  assert.equal(e.compoundEffectDomainBound,true);
});

test("PR20.8 Compound one-write accepts source-verified normal compound failure as committed", async () => {
  const env=sandbox({mode:"failure"});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.evidence.reconciliation.classification,
    "COMMITTED_EXPECTED_FAILURE");
  assert.equal(status.evidence.reconciliation.scrollConsumedExactly,true);
  assert.deepEqual(Array.from(status.evidence.reconciliation.slots),[null,null,null]);
  assert.equal(intentRows(env.storage)[0].value.status,"COMMITTED");
});

test("PR20.8 Compound one-write reconciles consumed massproduction condition", async () => {
  const env=sandbox({
    mode:"success",
    massproduction:{ms:5000},
  });
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.evidence.conditions.massproductionPresent,true);
  assert.equal(status.evidence.reconciliation.massproductionPresent,false);
  assert.equal(status.evidence.reconciliation.massproductionppPresent,false);
  assert.equal(status.evidence.reconciliation.conditionConsumptionReconciled,true);
  assert.equal(
    env.sendSnapshot().authority.binding.massproductionPresent,
    true,
  );
});

test("PR20.8 Compound one-write blocks final send when condition state drifts after authority consume", async () => {
  const env=sandbox({driftAfterAuthorityConsume:true});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.evidence.reconciliation.classification,"NOT_APPLIED");
  assert.equal(status.evidence.reconciliation.reason,"FINAL_SEND_DRIFT");
  assert.equal(authorityRows(env.storage)[0].value.consumed,true);
});

test("PR20.8 Compound one-write fails safe on NOT_APPLIED and never retries same intent", async () => {
  const env=sandbox({mode:"notApplied"});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.evidence.reconciliation.classification,"NOT_APPLIED");
  assert.equal(intentRows(env.storage)[0].value.status,"FAILED_SAFE_NOT_APPLIED");
  assert.equal(intentRows(env.storage)[0].value.sendCount,1);
});

test("PR20.8 Compound one-write restart reconciles terminal outcome without a second send", async () => {
  const shared=new MemoryStorage();
  const firstEnv=sandbox({mode:"success",storage:shared});
  const first=await execute(firstEnv);
  assert.equal(first.status,"BESTANDEN");
  assert.equal(firstEnv.compoundCalls(),1);

  const postItems=clone(firstEnv.box.character.items);
  const secondEnv=sandbox({
    mode:"success",
    storage:shared,
    items:postItems,
    q:firstEnv.box.character.q,
  });
  const second=await execute(secondEnv);
  assert.equal(second.status,"BESTANDEN");
  assert.equal(second.terminal,true);
  assert.equal(secondEnv.compoundCalls(),0);
  assert.equal(second.gameplayWrites,1);
  assert.equal(second.publicFunctionCalls,1);
  assert.equal(second.rawWriteCalls,0);
  assert.equal(second.sameIntentRetry,false);
  assert.equal(second.evidence.reconciliation.classification,"COMMITTED_SUCCESS");
  assert.equal(intentRows(shared).length,1);
  assert.equal(authorityRows(shared).length,1);
});

test("PR20.8 Compound one-write reconciles after bounded public-function promise timeout", async () => {
  const env=sandbox({mode:"hungPromise"});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.evidence.reconciliation.promiseTimedOut,true);
  assert.equal(status.evidence.reconciliation.promiseError,
    "PUBLIC_FUNCTION_PROMISE_TIMEOUT");
  assert.equal(status.evidence.reconciliation.classification,
    "COMMITTED_SUCCESS");
});

test("PR20.8 Compound one-write accepts exact object-valued hpamulet compound definition", async () => {
  const env=sandbox({mode:"success"});
  assert.deepEqual(env.box.G.items.hpamulet.compound,{hp:240});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(env.compoundCalls(),1);
});

test("PR20.8 Compound one-write rejects drifted object-valued hpamulet compound definition before send", async () => {
  const env=sandbox({mode:"success"});
  env.box.G.items.hpamulet.compound={hp:241};
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.match(status.blocker[0],/ITEM_DEFINITION_DRIFT/);
});

test("PR20.8 zero-write preflight failure releases runtime lease for safe reinjection", async () => {
  const env=sandbox({mode:"success"});
  env.box.G.items.hpamulet.compound={hp:241};
  const first=await execute(env);
  assert.equal(first.status,"FEHLER");
  assert.equal(env.compoundCalls(),0);
  assert.equal(first.gameplayWrites,0);
  assert.equal(first.publicFunctionCalls,0);
  assert.equal(first.authority.durableIntentCreated,false);
  assert.equal(
    env.box.__V5PR208CompoundProductiveOneWriteLiveLease,
    undefined,
  );

  env.box.G.items.hpamulet.compound={hp:240};
  vm.runInContext(source,env.box,{
    filename:"pr20-8-compound-productive-one-write-live.reinject.js",
  });
  const api=env.box.V5PR208CompoundProductiveOneWriteLive;
  for(let i=0;i<8000;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    if(api.status().terminal===true) break;
  }
  assert.equal(api.status().status,"BESTANDEN");
  assert.equal(env.compoundCalls(),1);
});

test("PR20.8 Compound one-write rejects unsafe candidates before any send", async () => {
  const items=baseItems();
  items[1].giveaway=true;
  items[22].list=true;
  const env=sandbox({items});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.match(status.blocker[0],/DREI_KANDIDATEN_ERFORDERLICH/);
});

test("PR20.8 Duplicate Compound runner instances cannot both send", async () => {
  const env=sandbox({mode:"success"});
  vm.createContext(env.box);

  vm.runInContext(source,env.box,{
    filename:"pr20-8-compound-productive-one-write-live.first.js",
  });
  const firstApi=env.box.V5PR208CompoundProductiveOneWriteLive;

  vm.runInContext(source,env.box,{
    filename:"pr20-8-compound-productive-one-write-live.second.js",
  });
  const secondApi=env.box.V5PR208CompoundProductiveOneWriteLive;

  secondApi.start();
  for(let i=0;i<8000;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    if(firstApi.status().terminal===true && secondApi.status().terminal===true) break;
  }

  assert.equal(env.compoundCalls(),1);
  const statuses=[firstApi.status(),secondApi.status()];
  assert.ok(statuses.some(s => s.status==="BESTANDEN"));
  assert.ok(statuses.some(s =>
    s.status==="FEHLER"
    && s.blocker.some(b => /DUPLIKAT_INSTANZ_AKTIV/.test(b))
  ));
});

test("PR20.8 Compound one-write keeps unresolved accepted mutation in recovery and never sends twice", async () => {
  const env=sandbox({mode:"pending"});
  const status=await execute(env,{terminal:false});
  assert.equal(status.phase,"RECOVERY_PENDING");
  assert.equal(status.terminal,false);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.evidence.reconciliation.classification,"STILL_PENDING");
  assert.equal(intentRows(env.storage)[0].value.status,"RECOVERY_PENDING");
  assert.equal(intentRows(env.storage)[0].value.sendCount,1);
});

test("PR20.8 Compound one-write package exposes exact safety markers and no raw write", () => {
  for(const marker of [
    'const TEST_ID = "pr20-8-compound-productive-one-write-live"',
    'const AUTHORITY_TTL_MS = 1500',
    'const PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS = 2000',
    'const RATIFIED_SHADOW_EVIDENCE_OBSERVED_AT_MS = 1790280262923',
    '"Pr208CompoundOneShotAuthority"',
    'function acquireRuntimeLease()',
    'function assertFences(txId)',
    'compoundEffectsFingerprintSha256',
    'Number(compoundDef.hp) === 240',
    'compound: stableScalarObject(itemDef?.compound || {}, 32)',
    'safeZeroWriteNoIntentFailure',
    'character:My_Merchant:condition:massproduction',
    'character:My_Merchant:condition:massproductionpp',
    'item?.giveaway === true',
    'item?.list === true',
    '"AL-ACTION-COMPOUND"',
    '"AL-RECOVERY-COMPOUND"',
    '"AL-VERIFIER-COMPOUND"',
    'sendBoundaryState: "SEND_MOEGLICH_ODER_VERSUCHT"',
    'sameIntentRetry: false',
    'globalThis.compound(',
    'sendFresh.candidate.indexes[0]',
    'sendFresh.candidate.indexes[1]',
    'sendFresh.candidate.indexes[2]',
    'sendFresh.scroll.index',
    '"COMMITTED_EXPECTED_FAILURE"',
    '"FAILED_SAFE_NOT_APPLIED"',
    '"RECOVERY_PENDING"',
    '"FINAL_SEND_DRIFT"',
    'function startOnce()',
  ]) assert.ok(source.includes(marker),marker);

  assert.equal((source.match(/globalThis\.compound\(/g)||[]).length,1);
  assert.equal(source.includes("globalThis.upgrade("),false);
  assert.equal(source.includes("globalThis.exchange("),false);
  assert.equal(source.includes(".socket.emit("),false);
  assert.equal(source.includes("parent.socket.emit("),false);
  assert.equal(source.includes("sameIntentRetry: true"),false);
  assert.equal(source.includes("normalRuntimeAllowed: true"),false);
});
