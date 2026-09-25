import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  new URL("../pr20-8-exchange-market-discovery-v1-0-0.js",import.meta.url),
  "utf8",
);

function seller({
  name="Seller",
  id="seller-1",
  map="main",
  x=20,
  y=0,
  listing={name:"gem1",q:1,price:25000,rid:"ABCD",level:0},
}={}){
  return {
    type:"character",
    visible:true,
    npc:false,
    rip:false,
    invincible:false,
    name,id,map,x,y,real_x:x,real_y:y,
    slots:{trade1:listing},
  };
}

function makeBox({
  map="main",
  gold=100000,
  entities,
  smartMove,
  moving=false,
  queue={},
}={}){
  const character={
    name:"My_Merchant",
    ctype:"merchant",
    id:"My_Merchant",
    map,
    x:0,y:0,real_x:0,real_y:0,
    gold,
    items:[{name:"cake",q:1},null,null],
    isize:3,
    q:queue,
    rip:false,
    dead:false,
    moving,
  };
  const box={
    character,
    entities:entities??{"seller-1":seller()},
    G:{items:{
      cake:{type:"elixir",g:100},
      gem1:{type:"gem",g:24000,e:1},
      candypop:{type:"elixir",g:120,e:10},
      sixcake:{type:"gem",g:100,e:1},
      anniversarygift:{type:"gem",g:100,e:1,exclusive:true},
      expensive:{type:"gem",g:60000,e:1},
    }},
    server_region:"EU",
    server_identifier:"I",
    AIO_V3:{operations:{status:()=>({schemaVersion:1})}},
    distance:(a,b)=>Math.hypot(
      Number(a.real_x??a.x)-Number(b.real_x??b.x),
      Number(a.real_y??a.y)-Number(b.real_y??b.y),
    ),
    Promise,Object,Array,Number,String,Boolean,Math,Date,JSON,Set,Map,console,setTimeout,clearTimeout,
  };
  if(smartMove) box.smart_move=smartMove.bind(null,box);
  box.globalThis=box;
  box.parent=box;
  return box;
}

async function run(box,timeoutMs=8000){
  vm.createContext(box);
  vm.runInContext(source,box,{filename:"pr20-8-exchange-market-discovery-v1-0-0.js"});
  const deadline=Date.now()+timeoutMs;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,2));
    const status=box.V5PR208ExchangeMarketDiscovery?.status?.();
    if(status) last=JSON.parse(JSON.stringify(status));
    if(status?.terminal) return last;
  }
  throw new Error("TEST_DID_NOT_TERMINATE:"+JSON.stringify(last));
}

test("visible eligible sell listing is selected read-only with exact RID and quantity",async()=>{
  const box=makeBox();
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.nextAction,"PREPARE_EXACT_TRADE_BUY_ONE_SHOT");
  assert.equal(status.selected.targetCharacterId,"Seller");
  assert.equal(status.selected.tradeSlot,"trade1");
  assert.equal(status.selected.rid,"ABCD");
  assert.equal(status.selected.itemName,"gem1");
  assert.equal(status.selected.exchangeQuantity,1);
  assert.equal(status.selected.unitPrice,25000);
  assert.equal(status.selected.totalCost,25000);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.tradeBuyAuthority,false);
  assert.equal(status.farmAuthority,false);
});

test("bank map uses exactly one smart_move to main then scans listings",async()=>{
  let calls=0;
  const box=makeBox({
    map:"bank",
    entities:{},
    smartMove:async(boxRef,target)=>{
      calls+=1;
      assert.equal(target,"main");
      await new Promise(resolve=>setTimeout(resolve,5));
      boxRef.character.map="main";
      boxRef.entities={"seller-1":seller()};
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.movementIssued,true);
  assert.equal(status.movementCompleted,true);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(calls,1);
  assert.equal(status.selected.itemName,"gem1");
});

test("unsafe, buy-side, giveaway, too-expensive and insufficient listings are rejected",async()=>{
  const box=makeBox({
    entities:{
      a:seller({name:"A",id:"a",listing:{name:"sixcake",q:1,price:1,rid:"A1"}}),
      b:seller({name:"B",id:"b",listing:{name:"gem1",q:1,price:60000,rid:"B1"}}),
      c:seller({name:"C",id:"c",listing:{name:"gem1",q:1,price:100,rid:"C1",b:true}}),
      d:seller({name:"D",id:"d",listing:{name:"gem1",q:1,price:100,rid:"D1",giveaway:true}}),
      e:seller({name:"E",id:"e",listing:{name:"candypop",q:9,price:1,rid:"E1"}}),
      f:seller({name:"F",id:"f",listing:{name:"anniversarygift",q:1,price:1,rid:"F1"}}),
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_KEIN_MARKET_KANDIDAT"));
  assert.equal(status.nextAction,"PREPARE_SEASHELL_FARM_STAGE");
  assert.equal(status.eligibleListingCount,0);
  assert.equal(status.selected,null);
  assert.equal(status.gameplayWrites,0);
});

test("candidate ordering prefers lowest total acquisition cost",async()=>{
  const box=makeBox({
    entities:{
      gem:seller({name:"GemSeller",id:"g",listing:{name:"gem1",q:1,price:20000,rid:"GG"}}),
      candy:seller({name:"CandySeller",id:"c",x:30,listing:{name:"candypop",q:20,price:1000,rid:"CC"}}),
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.selected.itemName,"candypop");
  assert.equal(status.selected.exchangeQuantity,10);
  assert.equal(status.selected.totalCost,10000);
});

test("gold reserve and trade distance are fail-closed",async()=>{
  const poor=await run(makeBox({gold:25000}));
  assert.equal(poor.status,"BLOCKIERT");
  const far=await run(makeBox({
    entities:{"far":seller({name:"Far",id:"far",x:401})},
  }));
  assert.equal(far.status,"BLOCKIERT");
});

test("missing smart_move in bank fails before any gameplay write",async()=>{
  const status=await run(makeBox({map:"bank",entities:{}}));
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_MARKET_DISCOVERY_SMART_MOVE_FEHLT"));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
});

test("package has one movement boundary and no purchase, farm or exchange callsite",()=>{
  assert.equal((source.match(/smartMove\(TARGET_MAP\)/g)??[]).length,1);
  for(const marker of [
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
