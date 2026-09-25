import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-compound-live-5m-v1-0-1.js",
  "utf8",
);

const SOURCE_TEST_ID="pr20-8-compound-productive-one-write-live";
const TX="pr20-8-compound-productive-one-write-live:ff08418e6003250471c98f5893dec8dd";
const INTENT_PREFIX="v5:"+SOURCE_TEST_ID+":intent:";
const AUTHORITY_PREFIX="v5:"+SOURCE_TEST_ID+":authority:";

class MemoryStorage {
  constructor(){ this.rows=new Map(); }
  get length(){ return this.rows.size; }
  key(index){ return [...this.rows.keys()][index] ?? null; }
  getItem(key){ return this.rows.has(key) ? this.rows.get(key) : null; }
  setItem(key,value){ this.rows.set(String(key),String(value)); }
}

function fakeClock(start=2_000_000){
  let now=start;
  class FakeDate extends Date {
    constructor(...args){ super(...(args.length?args:[now])); }
    static now(){ return now; }
  }
  function setTimeoutFake(fn,ms=0){
    now+=Number(ms)||0;
    Promise.resolve().then(fn);
    return 1;
  }
  return {FakeDate,setTimeoutFake};
}

function seed(storage){
  storage.setItem(
    INTENT_PREFIX+"ff08418e6003250471c98f5893dec8dd",
    JSON.stringify({
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
    }),
  );
  storage.setItem(
    AUTHORITY_PREFIX+TX,
    JSON.stringify({
      schemaVersion:1,
      testId:SOURCE_TEST_ID,
      transactionId:TX,
      authorityClass:"Pr208CompoundOneShotAuthority",
      maximumUses:1,
      uses:1,
      consumed:true,
      revoked:false,
      sameIntentRetry:false,
    }),
  );
}

function environment({activateOnCall=2}={}){
  const storage=new MemoryStorage();
  seed(storage);
  const clock=fakeClock();
  const items=Array(24).fill(null);
  items[1]={name:"hpamulet",level:1};
  items[18]={name:"cscroll0",q:19};
  let performanceCalls=0;
  let active=false;
  let compoundCalls=0;
  const box={
    console,JSON,Object,Array,Number,String,Boolean,Promise,Map,Set,Math,
    Date:clock.FakeDate,
    setTimeout:clock.setTimeoutFake,
    clearTimeout(){},
    localStorage:storage,
    server_region:"EU",
    server_identifier:"I",
    S:{},
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      map:"main",
      q:{},
      s:{},
      p:{},
      items,
    },
    sounds:{
      empty:{
        cplaying:false,
        playing(){ return active; },
      },
    },
    performance_trick(){
      performanceCalls+=1;
      if(Number.isFinite(activateOnCall) && performanceCalls>=activateOnCall){
        active=true;
      }
    },
    compound(){
      compoundCalls+=1;
      throw new Error("UNEXPECTED_COMPOUND_CALL");
    },
  };
  box.parent=box;
  box.globalThis=box;
  return {
    box,
    performanceCalls:()=>performanceCalls,
    compoundCalls:()=>compoundCalls,
  };
}

async function execute(env,{maxTicks=1200}={}){
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{filename:"pr20-8-compound-live-5m-v1-0-1.js"});
  const api=env.box.V5PR208CompoundLive5m;
  assert.ok(api);
  for(let i=0;i<maxTicks;i+=1){
    await new Promise(resolve=>setImmediate(resolve));
    const status=api.status();
    if(status.terminal===true) return status;
  }
  throw new Error("TEST_DID_NOT_REACH_TERMINAL_STATE");
}

test("v1.0.1 waits and retries performance_trick once before the zero-write soak",async()=>{
  const env=environment({activateOnCall:2});
  const status=await execute(env);
  assert.equal(status.version,"1.0.1");
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(env.performanceCalls(),2);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.additionalGameplayWrites,0);
  assert.equal(status.additionalPublicFunctionCalls,0);
  assert.equal(status.additionalRawWriteCalls,0);
  assert.equal(status.evidence.performanceTrick.active,true);
  assert.equal(status.evidence.performanceTrick.playing,true);
  assert.equal(status.evidence.performanceTrick.verification,"HOWLER_PLAYING_TRUE");
  assert.equal(status.evidence.soak.samples,60);
  assert.ok(status.evidence.soak.durationMs>=299000);
  assert.equal(status.evidence.sourceSendCount,1);
  assert.equal(status.evidence.compoundLive5mTested,true);
  assert.equal(status.evidence.mayAdvanceToPr20_9,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("v1.0.1 remains fail-safe when performance_trick stays inactive",async()=>{
  const env=environment({activateOnCall:Number.POSITIVE_INFINITY});
  const status=await execute(env);
  assert.equal(status.version,"1.0.1");
  assert.equal(status.status,"BLOCKIERT");
  assert.equal(status.phase,"ERROR");
  assert.equal(status.terminal,true);
  assert.match(status.blocker[0],/PR20_8_COMPOUND_5M_PERFORMANCE_TRICK_NICHT_AKTIV/);
  assert.equal(env.performanceCalls(),2);
  assert.equal(env.compoundCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.additionalGameplayWrites,0);
  assert.equal(status.additionalPublicFunctionCalls,0);
  assert.equal(status.additionalRawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("v1.0.1 recovery package changes only activation timing and keeps zero-send surface",()=>{
  for(const marker of [
    'const VERSION = "1.0.1"',
    'async function ensurePerformanceTrick()',
    'await sleep(350)',
    'await sleep(150)',
    'const performance = await ensurePerformanceTrick();',
    'const SOAK_SAMPLES = 60',
    'const SOAK_INTERVAL_MS = 5000',
    'const SOAK_MIN_DURATION_MS = 299000',
    'sourceSendCount: 1',
    'additionalGameplayWrites: 0',
    'additionalPublicFunctionCalls: 0',
    'additionalRawWriteCalls: 0',
    'normalRuntimeAllowed: false',
  ]) assert.ok(source.includes(marker),marker);

  for(const forbidden of [
    "globalThis.compound(",
    "compound(",
    "upgrade(",
    "exchange(",
    ".socket.emit(",
    "api_call(",
    "sameIntentRetry: true",
    "normalRuntimeAllowed: true",
  ]) assert.equal(source.includes(forbidden),false,forbidden);
});
