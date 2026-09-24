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
    const k=String(key);
    const v=String(value);
    this.rows.set(k,v);
    if(this.onSet) this.onSet(k,v);
  }
  getItem(key) {
    return this.rows.has(String(key)) ? this.rows.get(String(key)) : null;
  }
  removeItem(key) { this.rows.delete(String(key)); }
  key(index) { return [...this.rows.keys()][index] ?? null; }
  get length() { return this.rows.size; }
}

function fakeClock(start=2_000_000) {
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseItems() {
  const items=Array(30).fill(null);
  items[1]={name:"hpamulet",level:0,serial:"A"};
  items[18]={name:"cscroll0",q:20};
  items[22]={name:"hpamulet",level:0,serial:"B"};
  items[23]={name:"hpamulet",level:0,serial:"C"};
  return items;
}

function sandbox({
  mode="success",
  storage=new MemoryStorage(),
  items=baseItems(),
  q={},
  massproduction={},
  massproductionpp={},
  driftOnIntentPersist=false,
  driftOnAuthorityIssue=false,
}={}) {
  const clock=fakeClock();
  let compoundCalls=0;
  let sendSnapshot=null;
  let intentDriftDone=false;
  let authorityDriftDone=false;

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
        hpamulet:{type:"amulet",compound:true,g:20000,grades:[0,0]},
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
      s:{
        massproduction:clone(massproduction),
        massproductionpp:clone(massproductionpp),
      },
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

  storage.onSet=(key,value)=>{
    if(driftOnIntentPersist && !intentDriftDone && key.includes(":intent:")) {
      const row=JSON.parse(value);
      if(row.status==="INTENT_DURABLE" && row.sendCount===0) {
        intentDriftDone=true;
        const tmp=box.character.items[1];
        box.character.items[1]=box.character.items[22];
        box.character.items[22]=tmp;
      }
    }
    if(driftOnAuthorityIssue && !authorityDriftDone && key.includes(":authority:")) {
      const row=JSON.parse(value);
      if(row.consumed===false && row.revoked===false) {
        authorityDriftDone=true;
        box.character.s.massproduction={ms:777};
      }
    }
  };

  box.compound=async (i0,i1,i2,scrollIndex,offering,onlyCalculate)=>{
    compoundCalls += 1;
    captureSendSnapshot();
    assert.deepEqual([i0,i1,i2],[1,22,23]);
    assert.equal(scrollIndex,18);
    assert.equal(offering,null);
    assert.equal(onlyCalculate,false);

    if(mode==="notApplied") return {failed:true,reason:"simulated_reject"};

    box.character.q.compound={ms:1000,items:[i0,i1,i2]};
    box.character.items[i0]={name:"placeholder"};
    box.character.items[i1]=null;
    box.character.items[i2]=null;
    box.character.items[scrollIndex].q -= 1;

    if(Object.keys(box.character.s.massproduction||{}).length) {
      box.character.s.massproduction={};
    }
    if(Object.keys(box.character.s.massproductionpp||{}).length) {
      box.character.s.massproductionpp={};
    }

    if(mode==="pending") return {in_progress:true};

    const finish=()=>{
      delete box.character.q.compound;
      box.character.items[i0]=mode==="failure"
        ? null
        : {name:"hpamulet",level:1,serial:"RESULT"};
    };

    if(mode==="hungPromise") {
      box.setTimeout(finish,1000);
      return new Promise(()=>{});
    }

    box.setTimeout(finish,1000);
    return {in_progress:true};
  };

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

test("PR20.8 Compound runner persists admission before exactly one successful send", async()=>{
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
  assert.deepEqual(beforeSend.intent.candidate.indexes,[1,22,23]);
  assert.equal(beforeSend.intent.scroll.index,18);
  assert.equal(beforeSend.authority.authorityClass,"Pr208CompoundOneShotAuthority");
  assert.equal(beforeSend.authority.maximumUses,1);
  assert.equal(beforeSend.authority.uses,1);
  assert.equal(beforeSend.authority.consumed,true);
  assert.equal(beforeSend.authority.revoked,false);
  assert.deepEqual(beforeSend.authority.binding.candidateIndexes,[1,22,23]);
  assert.match(beforeSend.authority.binding.conditionStateFingerprintSha256,/^[a-f0-9]{64}$/);
  assert.match(beforeSend.authority.binding.compoundEffectsFingerprintSha256,/^[a-f0-9]{64}$/);

  const intent=intentRows(env.storage)[0].value;
  assert.equal(intent.status,"COMMITTED");
  assert.equal(intent.sendCount,1);
  assert.equal(intent.outcome.classification,"COMMITTED_SUCCESS");
  assert.equal(status.evidence.reconciliation.level0Now,0);
  assert.equal(status.evidence.reconciliation.level1Now,1);
  assert.equal(status.evidence.reconciliation.scrollQuantityNow,19);
  assert.equal(status.evidence.reconciliation.conditionsVerified,true);
});

test("PR20.8 Compound runner accepts the normal destructive failure only after all three inputs are gone", async()=>{
  const env=sandbox({mode:"failure"});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.evidence.reconciliation.classification,"COMMITTED_EXPECTED_FAILURE");
  assert.equal(status.evidence.reconciliation.level0Now,0);
  assert.equal(status.evidence.reconciliation.level1Now,0);
  assert.equal(status.evidence.reconciliation.scrollConsumedExactly,true);
  assert.equal(intentRows(env.storage)[0].value.status,"COMMITTED");
});

test("PR20.8 Compound runner marks NOT_APPLIED only with all three inputs, scroll and conditions unchanged", async()=>{
  const env=sandbox({mode:"notApplied"});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.evidence.reconciliation.classification,"NOT_APPLIED");
  assert.equal(status.evidence.reconciliation.allThreeInputsUnchanged,true);
  assert.equal(status.evidence.reconciliation.scrollUnchanged,true);
  assert.equal(status.evidence.reconciliation.conditionStateUnchanged,true);
  assert.equal(status.evidence.reconciliation.compoundEffectStateUnchanged,true);
  assert.equal(intentRows(env.storage)[0].value.sendCount,1);
  assert.equal(intentRows(env.storage)[0].value.status,"FAILED_SAFE_NOT_APPLIED");
});

test("PR20.8 Compound runner reconciles consumed massproduction condition as part of commit", async()=>{
  const env=sandbox({mode:"success",massproduction:{ms:1000}});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.evidence.reconciliation.classification,"COMMITTED_SUCCESS");
  assert.equal(status.evidence.reconciliation.conditionsVerified,true);
  assert.equal(status.evidence.reconciliation.conditionStateUnchanged,false);
  assert.equal(env.compoundCalls(),1);
});

test("PR20.8 Compound runner keeps secondary-input consumption and placeholder state in recovery", async()=>{
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
  assert.equal(status.evidence.reconciliation.anySelectedInputChanged,true);
  assert.equal(status.evidence.reconciliation.acceptedInFlightEvidence,true);
  assert.equal(intentRows(env.storage)[0].value.status,"RECOVERY_PENDING");
  assert.equal(intentRows(env.storage)[0].value.sendCount,1);
});

test("PR20.8 Compound runner restart reconciles committed success without another send", async()=>{
  const shared=new MemoryStorage();
  const firstEnv=sandbox({mode:"success",storage:shared});
  const first=await execute(firstEnv);
  assert.equal(first.status,"BESTANDEN");
  assert.equal(firstEnv.compoundCalls(),1);

  shared.onSet=null;
  const secondEnv=sandbox({
    mode:"success",
    storage:shared,
    items:clone(firstEnv.box.character.items),
    q:clone(firstEnv.box.character.q),
    massproduction:clone(firstEnv.box.character.s.massproduction),
    massproductionpp:clone(firstEnv.box.character.s.massproductionpp),
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

test("PR20.8 Compound runner reuses same-version incumbent and cannot double-send", async()=>{
  const env=sandbox({mode:"success"});
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{filename:"compound.first.js"});
  const firstApi=env.box.V5PR208CompoundProductiveOneWriteLive;
  vm.runInContext(source,env.box,{filename:"compound.second.js"});
  const secondApi=env.box.V5PR208CompoundProductiveOneWriteLive;
  assert.equal(firstApi,secondApi);
  const p1=firstApi.start();
  const p2=secondApi.start();
  assert.equal(p1,p2);
  for(let i=0;i<8000;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    if(firstApi.status().terminal===true) break;
  }
  assert.equal(firstApi.status().status,"BESTANDEN");
  assert.equal(env.compoundCalls(),1);
});

test("PR20.8 Compound runner reobserves conditions after authority issue and aborts before send on drift", async()=>{
  const env=sandbox({driftOnAuthorityIssue:true});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.match(status.blocker[0],/PRE_SEND_REOBSERVE_DRIFT/);
  assert.equal(intentRows(env.storage)[0].value.sendCount,0);
  assert.equal(authorityRows(env.storage)[0].value.revoked,true);
});

test("PR20.8 Compound runner aborts before authority when physical candidate identity drifts after intent", async()=>{
  const env=sandbox({driftOnIntentPersist:true});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.match(status.blocker[0],/FRESH_ADMISSION_DRIFT/);
  assert.equal(intentRows(env.storage)[0].value.sendCount,0);
  assert.equal(authorityRows(env.storage).length,0);
});

test("PR20.8 Compound runner reconciles after a public-function promise timeout", async()=>{
  const env=sandbox({mode:"hungPromise"});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.compoundCalls(),1);
  assert.equal(status.evidence.reconciliation.promiseTimedOut,true);
  assert.equal(status.evidence.reconciliation.promiseError,"PUBLIC_FUNCTION_PROMISE_TIMEOUT");
  assert.equal(status.evidence.reconciliation.classification,"COMMITTED_SUCCESS");
});

test("PR20.8 Compound package exposes exact safety markers and one public call site",()=>{
  for(const marker of [
    'const TEST_ID = "pr20-8-compound-productive-one-write-live"',
    'const AUTHORITY_TTL_MS = 1500',
    'const PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS = 2000',
    'const RATIFIED_SHADOW_OBSERVED_AT_MS = 1790280262923',
    '"Pr208CompoundOneShotAuthority"',
    'function acquireRuntimeLease()',
    'function assertFences(txId)',
    'conditionStateFingerprintSha256',
    'compoundEffectsFingerprintSha256',
    '"character:My_Merchant:condition:massproduction"',
    '"character:My_Merchant:condition:massproductionpp"',
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
    '"PRE_SEND_REOBSERVE_DRIFT"',
    'function startOnce()',
  ]) assert.ok(source.includes(marker),marker);

  assert.equal((source.match(/globalThis\.compound\(/g)||[]).length,1);
  assert.equal(source.includes(".socket.emit("),false);
  assert.equal(source.includes("parent.socket.emit("),false);
  assert.equal(source.includes("sameIntentRetry: true"),false);
  assert.equal(source.includes("normalRuntimeAllowed: true"),false);
});
