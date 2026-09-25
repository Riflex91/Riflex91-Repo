import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  new URL("../pr20-8-exchange-normal-source-discovery-v1-0-0.js",import.meta.url),
  "utf8",
);

function makeBox({
  items,
  npcs,
  drops,
  moving=false,
  queue={},
}={}){
  const character={
    name:"My_Merchant",
    ctype:"merchant",
    id:"My_Merchant",
    map:"main",
    items:[null,null,null],
    q:queue,
    moving,
    rip:false,
    dead:false,
  };
  const box={
    character,
    G:{
      items:items??{
        cheapgem:{type:"gem",g:1000,e:2},
        dropgem:{type:"gem",g:500,e:3},
        seashell:{type:"quest",g:800,e:20,quest:"seashell"},
        sixcake:{type:"gem",g:100,e:1},
        expensive:{type:"gem",g:60000,e:1},
        hardquest:{type:"quest",g:100,e:1,quest:true},
      },
      npcs:npcs??{
        potions:{name:"Potion Merchant",role:"merchant",items:["cheapgem",null]},
      },
      drops:drops??{
        monsters:{
          croc:[[0.5,"dropgem",1]],
        },
      },
    },
    server_region:"EU",
    server_identifier:"I",
    AIO_V3:{operations:{status:()=>({schemaVersion:1})}},
    Promise,Object,Array,Number,String,Boolean,Math,Date,JSON,Set,Map,console,setTimeout,clearTimeout,
  };
  box.globalThis=box;
  box.parent=box;
  return box;
}

async function run(box,timeoutMs=1000){
  vm.createContext(box);
  vm.runInContext(source,box,{filename:"pr20-8-exchange-normal-source-discovery-v1-0-0.js"});
  const deadline=Date.now()+timeoutMs;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,2));
    const status=box.V5PR208ExchangeNormalSourceDiscovery?.status?.();
    if(status) last=JSON.parse(JSON.stringify(status));
    if(status?.terminal) return last;
  }
  throw new Error("TEST_DID_NOT_TERMINATE:"+JSON.stringify(last));
}

test("NPC purchase source is preferred read-only over farm source",async()=>{
  const status=await run(makeBox());
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.nextAction,"PREPARE_EXACT_NPC_BUY_ONE_SHOT");
  assert.equal(status.selected.itemName,"cheapgem");
  assert.equal(status.selected.sourceKind,"NPC_PURCHASE");
  assert.equal(status.selected.exchangeQuantity,2);
  assert.equal(status.selected.estimatedNpcAcquisitionGold,2000);
  assert.equal(status.purchaseCandidateCount,1);
  assert.equal(status.farmCandidateCount,1);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.npcBuyAuthority,false);
  assert.equal(status.farmAuthority,false);
  assert.equal(status.exchangeAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("normal direct monster drop becomes bounded-farm preparation only",async()=>{
  const status=await run(makeBox({npcs:{}}));
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.nextAction,"PREPARE_BOUNDED_FARM_SHADOW");
  assert.equal(status.selected.itemName,"dropgem");
  assert.equal(status.selected.sourceKind,"MONSTER_DROP");
  assert.equal(status.selected.monsterDrops[0].monsterName,"croc");
  assert.equal(status.farmAuthority,false);
  assert.equal(status.gameplayWrites,0);
});

test("seashell is scanner-compatible by exact v1.0.6 definition semantics but not source-backed without a live normal source",async()=>{
  const status=await run(makeBox({npcs:{},drops:{monsters:{}}}));
  assert.equal(status.status,"BLOCKIERT");
  assert.equal(status.nextAction,"REMAIN_BLOCKED_NO_NORMAL_ACQUISITION_SOURCE");
  assert.ok(status.unsupportedCandidates.some(x=>x.itemName==="seashell"&&x.exchangeQuantity===20&&x.baseGold===800));
  assert.equal(status.sourceBackedCandidateCount,0);
  assert.equal(status.farmAuthority,false);
});

test("runtime-proven direct seashell drop would be discoverable but still grants no farm authority",async()=>{
  const status=await run(makeBox({
    npcs:{},
    drops:{monsters:{croc:[[1,"seashell",1]]}},
  }));
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.selected.itemName,"seashell");
  assert.equal(status.selected.sourceKind,"MONSTER_DROP");
  assert.equal(status.nextAction,"PREPARE_BOUNDED_FARM_SHADOW");
  assert.equal(status.farmAuthority,false);
  assert.equal(status.exchangeAuthority,false);
});

test("scanner parity excludes boolean quest, sixcake and base value above cap",async()=>{
  const status=await run(makeBox({
    npcs:{
      one:{role:"merchant",items:["hardquest","sixcake","expensive"]},
    },
    drops:{monsters:{}},
  }));
  assert.equal(status.status,"BLOCKIERT");
  assert.equal(status.scannerCandidateDefinitionCount,2);
  assert.equal(status.sourceBackedCandidateCount,0);
});

test("busy or moving merchant fails closed before discovery authority",async()=>{
  const moving=await run(makeBox({moving:true}));
  assert.equal(moving.status,"BLOCKIERT");
  assert.ok(moving.blocker.includes("PR20_8_SOURCE_DISCOVERY_CHARACTER_BEWEGT_SICH"));
  const queued=await run(makeBox({queue:{exchange:{}}}));
  assert.equal(queued.status,"BLOCKIERT");
  assert.ok(queued.blocker.includes("PR20_8_SOURCE_DISCOVERY_Q_NICHT_FREI"));
  assert.equal(queued.gameplayWrites,0);
});

test("package contains no movement, purchase, farming, loot, exchange or raw socket callsite",()=>{
  for(const marker of [
    "smart_move(",
    "trade_buy(",
    "buy(",
    "buy_with_gold(",
    "attack(",
    "use_skill(",
    "loot(",
    "send_item(",
    "exchange(",
    "socket.emit(",
    ".socket.emit(",
  ]){
    assert.equal(source.includes(marker),false,marker);
  }
});
