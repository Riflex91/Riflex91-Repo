import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-equip-live-5m.js",
  "utf8",
);

function storageFake(initial = new Map()) {
  const data = initial;
  return {
    setItem(key,value) { data.set(String(key),String(value)); },
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    removeItem(key) { data.delete(String(key)); },
    key(index) { return [...data.keys()][index] ?? null; },
    get length() { return data.size; },
    data,
  };
}

function fakeClock(start = 1_000_000) {
  let now = start;
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const setTimeoutFake = (fn,ms=0) => {
    now += Number(ms) || 0;
    queueMicrotask(fn);
    return 1;
  };
  return {FakeDate,setTimeoutFake};
}

function context({
  storage = storageFake(),
  equipped = false,
  offhandOccupied = false,
  multipleCandidates = false,
  serverRegion = "EU",
  serverIdentifier = "I",
  offhandKinds = { shield: {} },
  mainhandWtype = "staff",
  doublehandWtypes = { basher: {} },
} = {}) {
  const clock = fakeClock();
  let equipCalls = 0;
  const wshield = {name:"wshield",level:0};
  const staff = {name:"staff",level:0,gift:1};
  const oldShield = {name:"oldshield",level:0};
  const items = Array(12).fill(null);
  if (!equipped) items[7] = wshield;
  if (multipleCandidates) items[8] = {name:"wshield",level:0};

  const sandbox = {
    console,crypto:webcrypto,TextEncoder,Uint8Array,JSON,Object,Array,Number,
    String,Boolean,Promise,Map,Math,Date:clock.FakeDate,
    setTimeout:clock.setTimeoutFake,clearTimeout() {},
    localStorage:storage,
    user_id:"account-1",
    server_region:serverRegion,
    server_identifier:serverIdentifier,
    entities:{},
    G:{
      items:{
        wshield:{type:"shield"},
        oldshield:{type:"shield"},
        staff:{type:"weapon",wtype:mainhandWtype},
      },
      classes:{
        merchant:{
          mainhand:{staff:{}},
          doublehand:doublehandWtypes,
          offhand:offhandKinds,
        },
      },
    },
    character:{
      name:"My_Merchant",id:"My_Merchant",owner:"account-1",
      ctype:"merchant",level:58,map:"main",rip:false,dead:false,moving:false,
      target:null,q:{},items,
      slots:{
        mainhand:staff,
        offhand:equipped ? wshield : (offhandOccupied ? oldShield : null),
      },
    },
    sounds:{empty:{cplaying:true,playing(){return true;}}},
    performance_trick() {},
    async equip(index,slot) {
      equipCalls += 1;
      const existing = sandbox.character.slots[slot] ?? null;
      sandbox.character.slots[slot] = sandbox.character.items[index];
      sandbox.character.items[index] = existing;
      return true;
    },
  };
  sandbox.parent=sandbox;
  sandbox.globalThis=sandbox;
  return {sandbox,storage,equipCalls:()=>equipCalls};
}

async function execute(env) {
  vm.createContext(env.sandbox);
  vm.runInContext(source,env.sandbox,{
    filename:"pr20-7-weapon-offhand-equip-live-5m.js",
  });
  for (let i=0;i<1000;i+=1) {
    await new Promise(resolve=>setImmediate(resolve));
    const api=env.sandbox.V5PR207WeaponOffhandEquipLiveTest;
    if (api?.status()?.terminal === true) return api.status();
  }
  throw new Error("TEST_DID_NOT_REACH_TERMINAL_STATE");
}

test("PR20.7 wshield offhand live equips exactly one dynamically located shield and soaks 5m", async () => {
  const env=context();
  const state=await execute(env);
  assert.equal(state.status,"BESTANDEN");
  assert.equal(state.phase,"COMPLETE");
  assert.equal(state.terminal,true);
  assert.equal(env.equipCalls(),1);
  assert.equal(state.gameplayWrites,1);
  assert.equal(state.publicFunctionCalls,1);
  assert.equal(state.rawWriteCalls,0);
  assert.equal(state.sameIntentRetry,false);
  assert.equal(state.normalRuntimeAllowed,false);
  assert.equal(state.evidence.candidate.slot,"offhand");
  assert.equal(state.evidence.candidate.inventoryIndex,7);
  assert.equal(state.evidence.candidate.name,"wshield");
  assert.equal(state.evidence.previousSlotItem,null);
  assert.equal(state.evidence.oppositeHand.slot,"mainhand");
  assert.equal(state.evidence.oppositeHand.name,"staff");
  assert.equal(state.evidence.durableIntentReadback,true);
  assert.equal(state.evidence.reconciliation,"COMMITTED");
  assert.equal(state.evidence.settlement,"BESTAETIGT");
  assert.equal(state.evidence.oneShotAuthority.maximumUses,1);
  assert.equal(state.evidence.oneShotAuthority.consumed,true);
  assert.equal(state.evidence.oneShotAuthority.exactEmptyOffhandPrestate,true);
  assert.equal(state.evidence.oneShotAuthority.oppositeHandPinned,true);
  assert.equal(state.evidence.soak.samples,60);
  assert.ok(state.evidence.soak.durationMs >= 299_000);
});

test("PR20.7 wshield offhand live fails closed on occupied slot, class drift, doublehand or ambiguity", async () => {
  const cases=[
    {offhandOccupied:true},
    {offhandKinds:{}},
    {mainhandWtype:"great_staff",doublehandWtypes:{great_staff:{}}},
    {multipleCandidates:true},
    {serverRegion:"US"},
  ];
  for (const options of cases) {
    const env=context(options);
    const state=await execute(env);
    assert.equal(state.status,"BLOCKIERT");
    assert.ok(state.blocker.includes("PR20_7_WEAPON_OFFHAND_EQUIP_KEIN_EXAKTER_WSHIELD_KANDIDAT"));
    assert.equal(env.equipCalls(),0);
    assert.equal(state.gameplayWrites,0);
    assert.equal(state.publicFunctionCalls,0);
  }
});

test("PR20.7 wshield restart reconciles committed send and never resends", async () => {
  const first=context();
  const firstState=await execute(first);
  assert.equal(firstState.status,"BESTANDEN");
  assert.equal(first.equipCalls(),1);
  const entry=[...first.storage.data.entries()].find(([key])=>key.includes(":intent:"));
  assert.ok(entry);
  const [key,encoded]=entry;
  const interrupted=JSON.parse(encoded);
  delete interrupted.completionStatus;
  delete interrupted.completionEvidence;
  delete interrupted.soak;
  interrupted.terminal=false;
  first.storage.setItem(key,JSON.stringify(interrupted));

  const restarted=context({storage:first.storage,equipped:true});
  const recovered=await execute(restarted);
  assert.equal(restarted.equipCalls(),0);
  assert.equal(recovered.status,"BESTANDEN");
  assert.equal(recovered.evidence.restartRecovered,true);
  assert.equal(recovered.evidence.resendAttempted,false);
  assert.equal(recovered.evidence.reconciliation,"COMMITTED");
  assert.equal(recovered.sameIntentRetry,false);
});

test("PR20.7 wshield offhand live exposes one equip write and object-shaped merchant class rules", () => {
  assert.equal((source.match(/r\.equip\(/g)||[]).length,1);
  assert.ok(source.includes("Object.keys(merchantClass.offhand || {})"));
  assert.ok(source.includes("Object.keys(merchantClass.doublehand || {})"));
  assert.ok(source.includes('candidateName: "wshield"'));
  assert.ok(source.includes('slot: "offhand"'));
  assert.ok(source.includes("previousMaterial:null"));
  assert.ok(source.includes("sameIntentRetry:false"));
  assert.ok(source.includes("normalRuntimeAllowed:false"));
  for (const forbidden of [
    "unequip(","socket.emit(",".socket.emit(","api_call(","use_skill(",
    "send_item(","buy_with_gold(","start_character(","command_character(","/disconnect ",
  ]) assert.equal(source.includes(forbidden),false,forbidden);
});
