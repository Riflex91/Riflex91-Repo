import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-compound-live-5m.js",
  "utf8",
);

const SOURCE_TEST_ID="pr20-8-compound-productive-one-write-live";
const TX="pr20-8-compound-productive-one-write-live:ff08418e6003250471c98f5893dec8dd";
const INTENT_PREFIX="v5:"+SOURCE_TEST_ID+":intent:";
const AUTHORITY_PREFIX="v5:"+SOURCE_TEST_ID+":authority:";
const FENCE_PREFIX="v5:"+SOURCE_TEST_ID+":fence:";
const PROGRESS_KEY="v5:pr20-8-compound-live-5m:progress:"+TX;

class MemoryStorage {
  constructor() { this.rows=new Map(); }
  get length() { return this.rows.size; }
  key(index) { return [...this.rows.keys()][index] ?? null; }
  getItem(key) { return this.rows.has(key) ? this.rows.get(key) : null; }
  setItem(key,value) { this.rows.set(String(key),String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
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
  return {FakeDate,setTimeoutFake,now:()=>now,advance:ms=>{now+=Number(ms)||0;}};
}

function sourceIntent(overrides={}) {
  return {
    schemaVersion:1,
    testId:SOURCE_TEST_ID,
    version:"1.0.0",
    transactionId:TX,
    status:"COMMITTED",
    terminal:true,
    sendCount:1,
    sameIntentRetry:false,
    sendBoundaryState:"SEND_MOEGLICH_ODER_VERSUCHT",
    actionContractId:"AL-ACTION-COMPOUND",
    recoveryContractId:"AL-RECOVERY-COMPOUND",
    verifierId:"AL-VERIFIER-COMPOUND",
    publicFunction:"compound",
    candidate:{name:"hpamulet",level:0,indexes:[1,22,23]},
    scroll:{name:"cscroll0",index:18,observedQuantity:20,consumeQuantity:1},
    outcome:{classification:"COMMITTED_SUCCESS"},
    ...overrides,
  };
}

function sourceAuthority(overrides={}) {
  return {
    schemaVersion:1,
    testId:SOURCE_TEST_ID,
    transactionId:TX,
    authorityClass:"Pr208CompoundOneShotAuthority",
    maximumUses:1,
    uses:1,
    consumed:true,
    revoked:false,
    sameIntentRetry:false,
    ...overrides,
  };
}

function baseItems() {
  const items=Array(24).fill(null);
  items[1]={name:"hpamulet",level:1};
  items[18]={name:"cscroll0",q:19};
  return items;
}

function seed(storage,{intent={},authority={},activeFence=false}={}) {
  storage.setItem(INTENT_PREFIX+"ff08418e6003250471c98f5893dec8dd",
    JSON.stringify(sourceIntent(intent)));
  storage.setItem(AUTHORITY_PREFIX+TX,JSON.stringify(sourceAuthority(authority)));
  if(activeFence) {
    storage.setItem(
      FENCE_PREFIX+encodeURIComponent("character:My_Merchant:inventory"),
      JSON.stringify({
        schemaVersion:1,
        testId:SOURCE_TEST_ID,
        transactionId:TX,
        expiresAtMs:99_999_999,
      }),
    );
  }
}

function sandbox({
  storage=new MemoryStorage(),
  items=baseItems(),
  q={},
  s={},
  p={},
  S={},
  seedRows=true,
  sourceOptions={},
  progress=null,
  clockStart=2_000_000,
}={}) {
  if(seedRows) seed(storage,sourceOptions);
  if(progress) storage.setItem(PROGRESS_KEY,JSON.stringify(progress));
  const clock=fakeClock(clockStart);
  let compoundCalls=0;
  const box={
    console,
    JSON,Object,Array,Number,String,Boolean,Promise,Map,Set,Math,
    Date:clock.FakeDate,
    setTimeout:clock.setTimeoutFake,
    clearTimeout() {},
    localStorage:storage,
    server_region:"EU",
    server_identifier:"I",
    S,
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      map:"main",
      q:JSON.parse(JSON.stringify(q)),
      s:JSON.parse(JSON.stringify(s)),
      p:JSON.parse(JSON.stringify(p)),
      items:JSON.parse(JSON.stringify(items)),
    },
    sounds:{empty:{cplaying:true,playing(){return true;}}},
    performance_trick() {},
    compound(){ compoundCalls+=1; throw new Error("UNEXPECTED_COMPOUND_CALL"); },
  };
  box.parent=box;
  box.globalThis=box;
  return {box,storage,clock,compoundCalls:()=>compoundCalls};
}

async function execute(env,{maxTicks=1000}={}) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{filename:"pr20-8-compound-live-5m.js"});
  const api=env.box.V5PR208CompoundLive5m;
  assert.ok(api);
  const p1=api.start();
  const p2=api.start();
  assert.equal(p1,p2);
  for(let i=0;i<maxTicks;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    const status=api.status();
    if(status.terminal===true) return {status,api};
  }
  throw new Error("TEST_DID_NOT_REACH_TERMINAL_STATE");
}

test("PR20.8 Compound 5m observer proves 60 stable samples with zero additional mutation",async()=>{
  const env=sandbox();
  const {status}=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.deepEqual(status.blocker,[]);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.additionalGameplayWrites,0);
  assert.equal(status.additionalPublicFunctionCalls,0);
  assert.equal(status.additionalRawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.normalRuntimeAllowed,false);

  const e=status.evidence;
  assert.equal(e.evidenceArt,"V5_PR20_8_COMPOUND_LIVE_5M_POSTCOMMIT");
  assert.equal(e.status,"BESTANDEN");
  assert.equal(e.continuationOfRatifiedMutation,true);
  assert.equal(e.sourceTransactionId,TX);
  assert.equal(e.sourceIntentStatus,"COMMITTED");
  assert.equal(e.sourceIntentTerminal,true);
  assert.equal(e.sourceSendCount,1);
  assert.equal(e.sourceReconciliation,"COMMITTED_SUCCESS");
  assert.equal(e.sourceAuthorityConsumed,true);
  assert.equal(e.sourceAuthorityUses,1);
  assert.equal(e.sourceAuthorityMaximumUses,1);
  assert.equal(e.sourceActiveFences,0);
  assert.deepEqual(e.historicalMutationCounters,{
    gameplayWrites:1,publicFunctionCalls:1,rawWriteCalls:0,
  });
  assert.deepEqual(e.additionalMutationCounters,{
    gameplayWrites:0,publicFunctionCalls:0,rawWriteCalls:0,
  });
  assert.equal(e.noResendPathPresent,true);
  assert.equal(e.postcondition.stable,true);
  assert.deepEqual(e.postcondition.resultItem,{index:1,name:"hpamulet",level:1});
  assert.deepEqual(e.postcondition.consumedInputIndexes,[22,23]);
  assert.equal(e.postcondition.consumedInputsEmpty,true);
  assert.deepEqual(e.postcondition.scroll,{index:18,name:"cscroll0",quantity:19});
  assert.equal(e.soak.status,"BESTANDEN");
  assert.equal(e.soak.samples,60);
  assert.equal(e.soak.minimumSamples,60);
  assert.equal(e.soak.intervalMs,5000);
  assert.ok(e.soak.durationMs>=299000);
  assert.equal(e.compoundLive5mTested,true);
  assert.equal(e.exchangeRatified,false);
  assert.equal(e.exchangeAutonomyProductiveProven,false);
  assert.equal(e.mayAdvanceToPr20_9,false);

  const persistedIntent=JSON.parse(
    env.storage.getItem(INTENT_PREFIX+"ff08418e6003250471c98f5893dec8dd"),
  );
  assert.equal(persistedIntent.status,"COMMITTED");
  assert.equal(persistedIntent.sendCount,1);
  const persistedAuthority=JSON.parse(env.storage.getItem(AUTHORITY_PREFIX+TX));
  assert.equal(persistedAuthority.consumed,true);
  assert.equal(persistedAuthority.uses,1);
  const progress=JSON.parse(env.storage.getItem(PROGRESS_KEY));
  assert.equal(progress.status,"BESTANDEN");
  assert.equal(progress.terminal,true);
  assert.equal(progress.samples,60);
});

test("PR20.8 Compound 5m observer blocks source sendCount drift without any send",async()=>{
  const storage=new MemoryStorage();
  seed(storage,{intent:{sendCount:2}});
  const env=sandbox({storage,seedRows:false});
  const {status}=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.match(status.blocker[0],/SOURCE_INTENT_DRIFT/);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
});

test("PR20.8 Compound 5m observer blocks unconsumed source authority",async()=>{
  const storage=new MemoryStorage();
  seed(storage,{authority:{uses:0,consumed:false}});
  const env=sandbox({storage,seedRows:false});
  const {status}=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.match(status.blocker[0],/SOURCE_AUTHORITY_DRIFT/);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound 5m observer blocks an active source fence",async()=>{
  const storage=new MemoryStorage();
  seed(storage,{activeFence:true});
  const env=sandbox({storage,seedRows:false});
  const {status}=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.match(status.blocker[0],/SOURCE_FENCE_NOCH_AKTIV/);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound 5m observer blocks committed postcondition drift",async()=>{
  const items=baseItems();
  items[22]={name:"hpamulet",level:0};
  const env=sandbox({items});
  const {status}=await execute(env);
  assert.equal(status.status,"BLOCKIERT");
  assert.match(status.blocker[0],/POSTCONDITION_DRIFT_VOR_START/);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound 5m observer terminal restart recovers evidence without resampling or resend",async()=>{
  const shared=new MemoryStorage();
  const first=sandbox({storage:shared});
  const firstResult=await execute(first);
  assert.equal(firstResult.status.status,"BESTANDEN");
  assert.equal(first.compoundCalls(),0);
  const terminalProgress=JSON.parse(shared.getItem(PROGRESS_KEY));
  assert.equal(terminalProgress.samples,60);

  const second=sandbox({storage:shared,seedRows:false,clockStart:9_000_000});
  const secondResult=await execute(second);
  assert.equal(secondResult.status.status,"BESTANDEN");
  assert.equal(secondResult.status.terminal,true);
  assert.equal(secondResult.status.evidence.sourceSendCount,1);
  assert.equal(secondResult.status.evidence.soak.samples,60);
  assert.equal(second.compoundCalls(),0);
  assert.equal(secondResult.status.gameplayWrites,0);
  assert.equal(secondResult.status.publicFunctionCalls,0);
  assert.equal(secondResult.status.rawWriteCalls,0);
});

test("PR20.8 Compound 5m observer resets stale partial soak and still requires 60 fresh samples",async()=>{
  const progress={
    schemaVersion:1,
    testId:"pr20-8-compound-live-5m",
    version:"1.0.0",
    transactionId:TX,
    status:"SOAK",
    terminal:false,
    soakStartedAtMs:1_000_000,
    lastObservedAtMs:1_100_000,
    samples:30,
    restartCount:0,
    baseline:{
      transactionId:TX,
      resultItem:{index:1,name:"hpamulet",level:1},
      consumedInputIndexes:[22,23],
      scroll:{index:18,name:"cscroll0",quantity:19},
      sourceSendCount:1,
    },
    evidence:null,
  };
  const env=sandbox({progress,clockStart:2_000_000});
  const {status}=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.evidence.soak.samples,60);
  assert.equal(status.evidence.soak.restartCount,1);
  assert.ok(status.evidence.soak.durationMs>=299000);
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 duplicate same-version injection reuses one observer API",async()=>{
  const env=sandbox();
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{filename:"pr20-8-compound-live-5m.first.js"});
  const first=env.box.V5PR208CompoundLive5m;
  vm.runInContext(source,env.box,{filename:"pr20-8-compound-live-5m.second.js"});
  const second=env.box.V5PR208CompoundLive5m;
  assert.equal(second,first);
  const p1=first.start();
  const p2=second.start();
  assert.equal(p1,p2);
  for(let i=0;i<1000;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    if(first.status().terminal===true) break;
  }
  assert.equal(first.status().status,"BESTANDEN");
  assert.equal(env.compoundCalls(),0);
});

test("PR20.8 Compound 5m package exposes a zero-write, zero-resend surface",()=>{
  for(const marker of [
    'const VERSION = "1.0.0"',
    'const TEST_ID = "pr20-8-compound-live-5m"',
    'const API_NAME = "V5PR208CompoundLive5m"',
    'const SOAK_SAMPLES = 60',
    'const SOAK_INTERVAL_MS = 5000',
    'const SOAK_MIN_DURATION_MS = 299000',
    'sourceSendCount: 1',
    'additionalGameplayWrites: 0',
    'additionalPublicFunctionCalls: 0',
    'additionalRawWriteCalls: 0',
    'continuationOfRatifiedMutation: true',
    'noResendPathPresent: true',
    'compoundLive5mTested: true',
    'mayAdvanceToPr20_9: false',
    'normalRuntimeAllowed: false',
  ]) assert.ok(source.includes(marker),marker);

  assert.equal(source.includes("globalThis.compound("),false);
  assert.equal(source.includes("compound("),false);
  assert.equal(source.includes("upgrade("),false);
  assert.equal(source.includes("exchange("),false);
  assert.equal(source.includes(".socket.emit("),false);
  assert.equal(source.includes("api_call("),false);
  assert.equal(source.includes("sameIntentRetry: true"),false);
  assert.equal(source.includes("normalRuntimeAllowed: true"),false);
});
