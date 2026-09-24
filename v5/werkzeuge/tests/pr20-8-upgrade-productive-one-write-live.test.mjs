import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-upgrade-productive-one-write-live.js",
  "utf8",
);

class MemoryStorage {
  constructor(initial=new Map()) { this.rows=initial; }
  setItem(key,value) { this.rows.set(String(key),String(value)); }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
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

function baseItems() {
  const items=Array(24).fill(null);
  items[6]={name:"gloves",level:0};
  items[13]={name:"gloves",level:0};
  items[14]={name:"scroll0",q:36};
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
}={}) {
  const clock=fakeClock();
  let upgradeCalls=0;
  let sendSnapshot=null;

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
    S:{ugrace:{ms:0}},
    G:{
      items:{
        gloves:{type:"gloves",upgrade:true,scroll:true,g:3400},
        scroll0:{type:"uscroll",grade:0,g:1000},
      },
      maps:{main:{ref:{u_mid:[-235,-203]}}},
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
        massproduction:{ms:0},
        massproductionpp:{ms:0},
      },
      p:{
        ugrace:{ms:0},
        ograce:null,
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

  box.upgrade=async (itemIndex,scrollIndex,offering,onlyCalculate) => {
    upgradeCalls += 1;
    captureSendSnapshot();
    assert.equal(itemIndex,6);
    assert.equal(scrollIndex,14);
    assert.equal(offering,null);
    assert.equal(onlyCalculate,false);

    if(mode==="notApplied") return {failed:true,reason:"simulated_reject"};

    box.character.q.upgrade={ms:1000,num:itemIndex};
    box.character.items[itemIndex]={name:"placeholder"};
    box.character.items[scrollIndex].q -= 1;

    if(mode==="hungPromise") {
      box.setTimeout(() => {
        delete box.character.q.upgrade;
        box.character.items[itemIndex]={name:"gloves",level:1};
      },1000);
      return new Promise(() => {});
    }

    if(mode==="pending") return {in_progress:true};

    box.setTimeout(() => {
      delete box.character.q.upgrade;
      box.character.items[itemIndex]=mode==="failure"
        ? null
        : {name:"gloves",level:1};
    },1000);
    return {in_progress:true};
  };

  box.parent=box;
  box.globalThis=box;
  return {
    box,
    storage,
    upgradeCalls:()=>upgradeCalls,
    sendSnapshot:()=>sendSnapshot,
    clock,
  };
}

async function execute(env,{terminal=true,maxTicks=6000}={}) {
  vm.createContext(env.box);
  vm.runInContext(source,env.box,{
    filename:"pr20-8-upgrade-productive-one-write-live.js",
  });
  const api=env.box.V5PR208UpgradeProductiveOneWriteLive;
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

test("PR20.8 Upgrade one-write runner persists admission before exactly one successful send", async () => {
  const env=sandbox({mode:"success"});
  const status=await execute(env);

  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.phase,"COMPLETE");
  assert.equal(status.terminal,true);
  assert.equal(env.upgradeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.normalRuntimeAllowed,false);
  assert.equal(status.authority.authorityIssued,true);
  assert.equal(status.authority.authorityConsumed,true);
  assert.equal(status.authority.upgradeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);

  const beforeSend=env.sendSnapshot();
  assert.equal(beforeSend.intent.status,"OUTCOME_PENDING");
  assert.equal(beforeSend.intent.sendCount,1);
  assert.equal(beforeSend.intent.sendBoundaryState,"SEND_MOEGLICH_ODER_VERSUCHT");
  assert.equal(beforeSend.intent.sameIntentRetry,false);
  assert.equal(beforeSend.authority.maximumUses,1);
  assert.equal(beforeSend.authority.uses,1);
  assert.equal(beforeSend.authority.consumed,true);
  assert.equal(beforeSend.authority.revoked,false);
  assert.match(
    beforeSend.intent.fingerprints.upgradeEffectsFingerprintSha256,
    /^[a-f0-9]{64}$/,
  );
  assert.equal(
    beforeSend.authority.binding.upgradeEffectsFingerprintSha256,
    beforeSend.intent.fingerprints.upgradeEffectsFingerprintSha256,
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
  assert.equal(e.evidenceArt,"V5_PR20_8_UPGRADE_PRODUCTIVE_ONE_WRITE_LIVE");
  assert.equal(e.status,"BESTANDEN");
  assert.equal(e.candidate.name,"gloves");
  assert.equal(e.candidate.level,0);
  assert.equal(e.candidate.index,6);
  assert.equal(e.scroll.name,"scroll0");
  assert.equal(e.scroll.index,14);
  assert.equal(e.scroll.observedQuantity,36);
  assert.equal(e.offering,null);
  assert.equal(e.sendArguments.onlyCalculate,false);
  assert.equal(e.sendCount,1);
  assert.equal(e.reconciliation.classification,"COMMITTED_SUCCESS");
  assert.equal(e.reconciliation.scrollQuantityNow,35);
  assert.equal(e.promiseResultIsSupportingEvidenceOnly,undefined);
});

test("PR20.8 Upgrade one-write runner accepts source-verified destructive normal-usroll failure as committed", async () => {
  const env=sandbox({mode:"failure"});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.upgradeCalls(),1);
  assert.equal(status.evidence.reconciliation.classification,
    "COMMITTED_EXPECTED_FAILURE");
  assert.equal(status.evidence.reconciliation.scrollConsumedExactly,true);
  assert.equal(status.evidence.reconciliation.target,null);
  assert.equal(intentRows(env.storage)[0].value.status,"COMMITTED");
});

test("PR20.8 Upgrade one-write runner fails safe on NOT_APPLIED and never retries same intent", async () => {
  const env=sandbox({mode:"notApplied"});
  const status=await execute(env);
  assert.equal(status.status,"NICHT_BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.upgradeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.evidence.reconciliation.classification,"NOT_APPLIED");
  assert.equal(intentRows(env.storage)[0].value.status,"FAILED_SAFE_NOT_APPLIED");
  assert.equal(intentRows(env.storage)[0].value.sendCount,1);
});

test("PR20.8 Upgrade one-write runner restart reconciles terminal outcome without a second send", async () => {
  const shared=new MemoryStorage();
  const firstEnv=sandbox({mode:"success",storage:shared});
  const first=await execute(firstEnv);
  assert.equal(first.status,"BESTANDEN");
  assert.equal(firstEnv.upgradeCalls(),1);

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
  assert.equal(secondEnv.upgradeCalls(),0);
  assert.equal(second.gameplayWrites,1);
  assert.equal(second.publicFunctionCalls,1);
  assert.equal(second.rawWriteCalls,0);
  assert.equal(second.sameIntentRetry,false);
  assert.equal(second.evidence.reconciliation.classification,"COMMITTED_SUCCESS");
  assert.equal(intentRows(shared).length,1);
  assert.equal(authorityRows(shared).length,1);
});

test("PR20.8 Upgrade one-write runner reconciles after a bounded public-function promise timeout", async () => {
  const env=sandbox({mode:"hungPromise"});
  const status=await execute(env);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(env.upgradeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.evidence.promiseTimedOut,true);
  assert.equal(
    status.evidence.promiseError,
    "PUBLIC_FUNCTION_PROMISE_TIMEOUT",
  );
  assert.equal(
    status.evidence.reconciliation.classification,
    "COMMITTED_SUCCESS",
  );
});

test("PR20.8 Upgrade one-write runner rejects giveaway and listed targets before any send", async () => {
  const items=baseItems();
  items[6].giveaway=true;
  items[13].list=true;
  const env=sandbox({items});
  const status=await execute(env);
  assert.equal(status.status,"FEHLER");
  assert.equal(status.terminal,true);
  assert.equal(env.upgradeCalls(),0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.match(status.blocker[0],/KANDIDAT_FEHLT/);
});

test("PR20.8 Duplicate package instances on one runtime cannot both send", async () => {
  const env=sandbox({mode:"success"});
  vm.createContext(env.box);

  vm.runInContext(source,env.box,{
    filename:"pr20-8-upgrade-productive-one-write-live.first.js",
  });
  const firstApi=env.box.V5PR208UpgradeProductiveOneWriteLive;

  vm.runInContext(source,env.box,{
    filename:"pr20-8-upgrade-productive-one-write-live.second.js",
  });
  const secondApi=env.box.V5PR208UpgradeProductiveOneWriteLive;

  secondApi.start();
  for(let i=0;i<6000;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    if(firstApi.status().terminal===true && secondApi.status().terminal===true) break;
  }

  assert.equal(env.upgradeCalls(),1);
  const statuses=[firstApi.status(),secondApi.status()];
  assert.ok(statuses.some(s => s.status==="BESTANDEN"));
  assert.ok(statuses.some(s =>
    s.status==="FEHLER"
    && s.blocker.some(b => /DUPLIKAT_INSTANZ_AKTIV/.test(b))
  ));
});

test("PR20.8 Upgrade one-write runner keeps unresolved accepted mutation in recovery and never sends twice", async () => {
  const env=sandbox({mode:"pending"});
  const status=await execute(env,{terminal:false});
  assert.equal(status.phase,"RECOVERY_PENDING");
  assert.equal(status.terminal,false);
  assert.equal(env.upgradeCalls(),1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.evidence.reconciliation.classification,"STILL_PENDING");
  assert.equal(intentRows(env.storage)[0].value.status,"RECOVERY_PENDING");
  assert.equal(intentRows(env.storage)[0].value.sendCount,1);
});

test("PR20.8 Upgrade one-write package exposes exact safety markers and no raw socket write", () => {
  for(const marker of [
    'const TEST_ID = "pr20-8-upgrade-productive-one-write-live"',
    'const AUTHORITY_TTL_MS = 1500',
    'const PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS = 2000',
    'const RATIFIED_SHADOW_EVIDENCE_BATCH = 8244',
    '"Pr208UpgradeOneShotAuthority"',
    'function acquireRuntimeLease()',
    'function assertFences(txId)',
    'upgradeEffectsFingerprintSha256',
    'item?.giveaway === true',
    'item?.list === true',
    '"AL-ACTION-UPGRADE"',
    '"AL-RECOVERY-UPGRADE"',
    '"AL-VERIFIER-UPGRADE"',
    'sendBoundaryState: "SEND_MOEGLICH_ODER_VERSUCHT"',
    'sameIntentRetry: false',
    'globalThis.upgrade(',
    'fresh.candidate.index',
    'fresh.scroll.index',
    'null,',
    'false',
    '"COMMITTED_EXPECTED_FAILURE"',
    '"FAILED_SAFE_NOT_APPLIED"',
    '"RECOVERY_PENDING"',
    'function startOnce()',
  ]) assert.ok(source.includes(marker),marker);

  assert.equal((source.match(/globalThis\.upgrade\(/g)||[]).length,1);
  assert.equal(source.includes(".socket.emit("),false);
  assert.equal(source.includes("parent.socket.emit("),false);
  assert.equal(source.includes("sameIntentRetry: true"),false);
  assert.equal(source.includes("normalRuntimeAllowed: true"),false);
});
