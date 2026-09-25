import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-exchange-anniversarygift-live-5m-v1-0-0.js","utf8"
);

const SOURCE_TEST_ID="pr20-8-exchange-anniversarygift-productive-one-write-live";
const TX="pr20-8-exchange-anniversarygift-productive-one-write-live:0c6a1129be4c9c899f88274fab97108a";
const INTENT_KEY="v5:"+SOURCE_TEST_ID+":intent:test";
const AUTH_KEY="v5:"+SOURCE_TEST_ID+":authority:"+TX;
const PROGRESS_KEY="v5:pr20-8-exchange-anniversarygift-live-5m:progress:"+TX;

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

function committedIntent(){
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
    actionContractId:"AL-ACTION-EXCHANGE",
    recoveryContractId:"AL-RECOVERY-EXCHANGE",
    verifierId:"AL-VERIFIER-EXCHANGE",
    publicFunction:"exchange",
    sourceSnapshotCommit:"90052162eb3ebda36c893e1eb4af643913c8f984",
    dropGraphSha256:"2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342",
    candidate:{
      name:"anniversarygift",
      index:4,
      quantity:106,
      exchangeQuantity:1,
    },
    prestate:{
      gold:1000,
      aggregate:{cake:18,anniversarygift:106},
    },
    outcome:{
      classification:"COMMITTED",
      candidateQuantityBefore:106,
      candidateQuantityNow:105,
      expectedQuantity:105,
      rewardDomain:{
        valid:true,
        reward:{gold:5000},
        rewardKind:"gold",
        goldDelta:5000,
        inputDelta:-1,
        inputConsumedExactly:true,
        noOtherNegative:true,
        afterAggregate:{cake:18,anniversarygift:105},
      },
    },
  };
}

function consumedAuthority(){
  return {
    schemaVersion:1,
    testId:SOURCE_TEST_ID,
    transactionId:TX,
    authorityClass:"Pr208AnniversaryGiftExchangeOneShotAuthority",
    maximumUses:1,
    uses:1,
    consumed:true,
    revoked:false,
    sameIntentRetry:false,
  };
}

function makeEnv({
  mutateIntent,
  mutateAuthority,
  itemQuantity=105,
  gold=6000,
  moving=false,
  target=null,
  q={},
  s={},
  withPerformance=true,
  existingProgress=null,
}={}){
  const seed=new Map();
  const intent=committedIntent();
  const authority=consumedAuthority();
  if(mutateIntent) mutateIntent(intent);
  if(mutateAuthority) mutateAuthority(authority);
  seed.set(INTENT_KEY,JSON.stringify(intent));
  seed.set(AUTH_KEY,JSON.stringify(authority));
  if(existingProgress) seed.set(PROGRESS_KEY,JSON.stringify(existingProgress));
  const ls=storage(seed);

  let now=1_000_000;
  class FakeDate extends Date {
    constructor(...args){ super(...(args.length?args:[now])); }
    static now(){ return now; }
  }

  const items=[];
  items[0]={name:"cake",q:18};
  items[4]={name:"anniversarygift",q:itemQuantity};

  const box={
    console,
    Date:FakeDate,
    Promise,Object,Array,String,Number,Boolean,JSON,Math,
    setTimeout:(fn,ms)=>{
      now+=Number(ms)||0;
      return setImmediate(fn);
    },
    clearTimeout:()=>{},
    setImmediate,
    localStorage:ls,
    server_region:"EU",
    server_identifier:"I",
    AIO_V3:{},
    sounds:{
      empty:{
        cplaying:true,
        playing:()=>true,
      },
    },
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      items,
      gold,
      q,
      s,
      moving,
      target,
    },
  };
  if(withPerformance) box.performance_trick=()=>{};
  box.parent=box;
  return {box,ls,getNow:()=>now};
}

async function execute(env){
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-exchange-anniversarygift-live-5m-v1-0-0.js",
  });
  const deadline=Date.now()+5000;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setImmediate(resolve));
    last=env.box.V5PR208ExchangeAnniversarygiftLive5m?.status?.();
    if(last?.terminal) return last;
  }
  throw new Error("TEST_DID_NOT_SETTLE:"+JSON.stringify(last));
}

test("60-sample anniversarygift postcommit soak passes with zero additional mutation",async()=>{
  const env=makeEnv();
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.additionalGameplayWrites,0);
  assert.equal(status.additionalPublicFunctionCalls,0);
  assert.equal(status.additionalRawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.exchangeAuthority,false);
  assert.equal(status.gameplayAuthority,false);
  assert.equal(status.rawWriteAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
  assert.equal(status.evidence.exchangeLive5mTested,true);
  assert.equal(status.evidence.sourceTransactionId,TX);
  assert.equal(status.evidence.sourceSendCount,1);
  assert.equal(status.evidence.noResendPathPresent,true);
  assert.equal(status.evidence.sourceGuard.reconciliation,"COMMITTED");
  assert.equal(status.evidence.sourceGuard.rewardKind,"gold");
  assert.equal(status.evidence.sourceGuard.goldDelta,5000);
  assert.equal(status.evidence.sourceGuard.inputDelta,-1);
  assert.equal(status.evidence.sourceGuard.authorityConsumed,true);
  assert.equal(status.evidence.sourceGuard.authorityUses,1);
  assert.equal(status.evidence.sourceGuard.activeSourceFences,0);
  assert.equal(status.evidence.postcondition.stable,true);
  assert.equal(status.evidence.postcondition.input.quantity,105);
  assert.equal(status.evidence.postcondition.gold,6000);
  assert.equal(status.evidence.postcondition.expectedGold,6000);
  assert.equal(status.evidence.postcondition.placeholderCount,0);
  assert.equal(status.evidence.soak.samples,60);
  assert.ok(status.evidence.soak.durationMs>=299000);
});

test("completed soak reload returns persisted terminal evidence without mutation",async()=>{
  const env=makeEnv();
  const first=await execute(env);
  assert.equal(first.status,"BESTANDEN");
  const progress=JSON.parse(env.ls.getItem(PROGRESS_KEY));
  assert.equal(progress.terminal,true);
  assert.equal(progress.status,"BESTANDEN");

  delete env.box.V5PR208ExchangeAnniversarygiftLive5m;
  delete env.box.__V5PR208ExchangeAnniversarygiftLive5mLease;
  const second=await execute(env);
  assert.equal(second.status,"BESTANDEN");
  assert.equal(second.evidence.sourceTransactionId,TX);
  assert.equal(second.gameplayWrites,0);
  assert.equal(second.publicFunctionCalls,0);
  assert.equal(second.rawWriteCalls,0);
});

test("source intent drift fails closed",async()=>{
  const env=makeEnv({
    mutateIntent:intent=>{ intent.outcome.rewardDomain.goldDelta=20000; },
  });
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes("PR20_8_EXCHANGE_5M_SOURCE_INTENT_DRIFT"));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
});

test("source authority drift fails closed",async()=>{
  const env=makeEnv({
    mutateAuthority:authority=>{ authority.uses=0; authority.consumed=false; },
  });
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes("PR20_8_EXCHANGE_5M_SOURCE_AUTHORITY_DRIFT"));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
});

test("committed inventory or gold drift fails closed",async()=>{
  for(const opts of [
    {itemQuantity:104},
    {gold:6001},
    {moving:true},
    {target:"goo"},
    {q:{exchange:{ms:100}}},
    {s:{massexchange:{ms:100}}},
  ]){
    const env=makeEnv(opts);
    const status=await execute(env);
    assert.equal(status.status,"FEHLER");
    assert.equal(status.gameplayWrites,0);
    assert.equal(status.publicFunctionCalls,0);
    assert.equal(status.rawWriteCalls,0);
  }
});

test("missing performance trick fails before observation soak",async()=>{
  const env=makeEnv({withPerformance:false});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes("PR20_8_EXCHANGE_5M_PERFORMANCE_TRICK_FEHLT"));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
});

test("observer contains no Exchange or raw write surface",()=>{
  assert.equal(source.includes('const SOAK_SAMPLES = 60'),true);
  assert.equal(source.includes('const SOAK_INTERVAL_MS = 5000'),true);
  assert.equal(source.includes('const SOAK_MIN_DURATION_MS = 299000'),true);
  assert.equal(source.includes('additionalGameplayWrites: 0'),true);
  assert.equal(source.includes('additionalPublicFunctionCalls: 0'),true);
  assert.equal(source.includes('additionalRawWriteCalls: 0'),true);
  assert.equal(source.includes('sameIntentRetry: false'),true);
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
    "trade_buy(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
    "smart_move(",
    "move(",
  ]) assert.equal(source.includes(marker),false,marker);
});
