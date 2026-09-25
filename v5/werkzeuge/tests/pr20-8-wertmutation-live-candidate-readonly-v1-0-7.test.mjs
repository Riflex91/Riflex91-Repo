import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const previous = fs.readFileSync(
  "werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-7.js",
  "utf8",
);
const source = fs.readFileSync(
  "werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-7.js",
  "utf8",
);

function defs() {
  return {
    gloves: { type:"gloves", g:3400, scroll:true, upgrade:{}, grades:[7,9] },
    scroll0: { type:"scroll", g:1000 },
    gem1: { type:"gem", g:24000, e:1 },
    anniversarygift: { type:"gem", g:100, e:1, exclusive:true },
    otherexclusive: { type:"gem", g:100, e:1, exclusive:true },
  };
}

function sandbox(items) {
  const box = {
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
    setTimeout: fn => setImmediate(fn),
    clearTimeout: () => {},
    performance_trick() {},
    sounds: { empty: { cplaying:true, playing:() => true } },
    server_region:"EU",
    server_identifier:"I",
    character:{
      name:"My_Merchant",
      id:"My_Merchant",
      ctype:"merchant",
      level:80,
      map:"main",
      moving:false,
      target:null,
      q:{},
      items,
    },
    G:{ items:defs() },
  };
  box.parent = box;
  return box;
}

async function run(items) {
  const box = sandbox(items);
  vm.createContext(box);
  vm.runInContext(source, box, {
    filename:"pr20-8-wertmutation-live-candidate-readonly-v1-0-7.js",
  });
  for (let i=0;i<20;i+=1) {
    await new Promise(resolve => setImmediate(resolve));
    const status = box.V5PR208ValueMutationLiveCandidateReadonly?.status?.();
    if (status?.terminal) return {box,status};
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

test("v1.0.7 aendert nur die anniversarygift Exchange-Testpolicy und bleibt read-only", () => {
  assert.ok(source.includes("const VERSION = '1.0.7';"));
  assert.ok(source.includes("EXCLUSIVE_EXCHANGE_TEST_EXCEPTION = 'anniversarygift'"));
  assert.ok(source.includes("blockedItem(item, def, true)"));
  assert.ok(source.includes("exclusiveTestException:"));
  assert.equal(source.includes("exchange("), false);
});

test("v1.0.7 bleibt ohne mutierenden Gameplay-Pfad und ohne Authority", () => {
  for (const marker of [
    "upgrade(",
    "compound(",
    "exchange(",
    "buy(",
    "buy_with_gold(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "equip(",
    "unequip(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker), false, marker);

  for (const marker of [
    "gameplayWrites: 0",
    "publicFunctionCalls: 0",
    "rawWriteCalls: 0",
    "sameIntentRetry: false",
    "normalRuntimeAllowed: false",
    "authorityIssued: false",
    "durableIntentCreated: false",
    "exchangeAuthority: false",
  ]) assert.ok(source.includes(marker), marker);
});

test("v1.0.7 erkennt anniversarygift als exakte exclusive Exchange-Testausnahme", async () => {
  const {box,status} = await run([
    {name:"gloves",level:0},
    {name:"scroll0",q:35},
    {name:"anniversarygift",q:106},
  ]);
  assert.equal(box.V5PR208ValueMutationLiveCandidateReadonly.version,"1.0.7");
  assert.equal(status.version,"1.0.7");
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.observations.COMPOUND.status,"KEIN_KANDIDAT");
  assert.equal(status.observations.EXCHANGE.status,"KANDIDAT_GEFUNDEN");
  assert.equal(status.observations.EXCHANGE.candidateCount,1);
  assert.equal(status.selectedCandidates.EXCHANGE.candidate.name,"anniversarygift");
  assert.equal(status.selectedCandidates.EXCHANGE.exchangeQuantity,1);
  assert.equal(status.selectedCandidates.EXCHANGE.exclusiveTestException,true);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.authority.authorityIssued,false);
  assert.equal(status.authority.durableIntentCreated,false);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
  assert.equal(status.authority.rawWriteAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("v1.0.7 erkennt einen natuerlichen Exchange-Kandidaten nur read-only", async () => {
  const {status} = await run([{name:"gem1",q:2}]);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.observations.EXCHANGE.status,"KANDIDAT_GEFUNDEN");
  assert.equal(status.observations.EXCHANGE.candidateCount,1);
  assert.equal(status.selectedCandidates.EXCHANGE.candidate.name,"gem1");
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
  assert.equal(status.authority.rawWriteAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("v1.0.7 blockiert weiterhin jedes andere exclusive Exchange-Item", async () => {
  const {status} = await run([{name:"otherexclusive",q:2}]);
  assert.equal(status.status,"BLOCKIERT");
  assert.equal(status.observations.EXCHANGE.status,"KEIN_KANDIDAT");
  assert.equal(status.observations.EXCHANGE.candidateCount,0);
  assert.ok(status.observations.EXCHANGE.rejected.some(x =>
    x.name==="otherexclusive" && x.reason==="UNSAFE_PHYSICAL_ITEM"
  ));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.authority.exchangeAuthority,false);
});
