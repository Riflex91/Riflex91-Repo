import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  new URL("../pr20-8-exchange-candidate-bank-mount-v1-0-0.js",import.meta.url),
  "utf8",
);

function makeBox({
  inventory,
  bank,
  smartMove,
  moving=false,
  queue={},
}={}){
  const items=inventory??[
    {name:"cake",q:1},
    null,
    null,
    null,
  ];
  const character={
    name:"My_Merchant",
    ctype:"merchant",
    id:"session-1",
    items,
    isize:items.length,
    bank,
    q:queue,
    rip:false,
    dead:false,
    moving,
    target:null,
  };
  const G={items:{
    cake:{type:"elixir",g:100},
    cscale:{type:"material",g:200},
    gem1:{type:"gem",g:24000,e:1},
    candypop:{type:"elixir",g:120,e:10},
    sixcake:{type:"gem",g:100,e:1},
    anniversarygift:{type:"gem",g:100,e:1,exclusive:true},
    gem2:{type:"gem",g:360000,e:1},
  }};
  const box={
    character,
    G,
    server_region:"EU",
    server_identifier:"I",
    AIO_V3:{operations:{status:()=>({schemaVersion:1})}},
    Promise,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Math,
    Date,
    JSON,
    Set,
    Map,
    console,
    setTimeout,
    clearTimeout,
  };
  if(smartMove) box.smart_move=smartMove.bind(null,box);
  box.globalThis=box;
  box.parent=box;
  return box;
}

async function run(box,timeoutMs=3500){
  vm.createContext(box);
  vm.runInContext(source,box,{
    filename:"pr20-8-exchange-candidate-bank-mount-v1-0-0.js",
  });
  const deadline=Date.now()+timeoutMs;
  let last=null;
  while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,2));
    const status=box.V5PR208ExchangeCandidateBankMount?.status?.();
    if(status) last=JSON.parse(JSON.stringify(status));
    if(status?.terminal) return last;
  }
  throw new Error("TEST_DID_NOT_TERMINATE:"+JSON.stringify(last));
}

test("existing inventory candidate skips movement and remains zero-write",async()=>{
  let calls=0;
  const box=makeBox({
    inventory:[
      {name:"gem1",q:1},
      null,
      null,
      null,
    ],
    smartMove:async()=>{calls+=1;},
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.selected.source,"INVENTORY");
  assert.equal(status.selected.name,"gem1");
  assert.equal(status.nextAction,"RUN_EXISTING_EXCHANGE_SCANNER");
  assert.equal(status.movementIssued,false);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(calls,0);
});

test("already mounted bank is scanned without movement",async()=>{
  let calls=0;
  const box=makeBox({
    bank:{
      items0:[
        {name:"candypop",q:10},
        {name:"sixcake",q:1},
      ],
    },
    smartMove:async()=>{calls+=1;},
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.selected.source,"BANK");
  assert.equal(status.selected.name,"candypop");
  assert.equal(status.selected.pack,"items0");
  assert.equal(status.selected.bankSlot,0);
  assert.equal(status.emptyInventorySlot,1);
  assert.equal(status.nextAction,"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT");
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(calls,0);
});

test("bank mount uses exactly one smart_move call and then scans read-only",async()=>{
  let calls=0;
  const box=makeBox({
    smartMove:async(boxRef,target)=>{
      calls+=1;
      assert.equal(target,"bank");
      await new Promise(resolve=>setTimeout(resolve,5));
      boxRef.character.bank={
        items0:[
          {name:"sixcake",q:1},
          {name:"candypop",q:10},
        ],
      };
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.movementIssued,true);
  assert.equal(status.movementCompleted,true);
  assert.equal(status.movementCallLimit,1);
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(calls,1);
  assert.equal(status.bankSnapshotAvailable,true);
  assert.equal(status.selected.name,"candypop");
  assert.equal(status.selected.pack,"items0");
  assert.equal(status.selected.bankSlot,1);
  assert.equal(status.nextAction,"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT");
  assert.equal(status.acquisitionAuthority.bankRetrieve,false);
  assert.equal(status.acquisitionAuthority.buy,false);
  assert.equal(status.acquisitionAuthority.farm,false);
  assert.equal(status.acquisitionAuthority.exchange,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("mounted bank with no eligible candidate ends blocked without further mutation",async()=>{
  let calls=0;
  const box=makeBox({
    smartMove:async(boxRef)=>{
      calls+=1;
      boxRef.character.bank={
        items0:[
          {name:"sixcake",q:1},
          {name:"anniversarygift",q:1},
          {name:"gem2",q:1},
        ],
      };
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_KEIN_INVENTORY_ODER_BANK_KANDIDAT"));
  assert.equal(status.nextAction,"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE");
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(calls,1);
  assert.equal(status.sameIntentRetry,false);
});

test("full inventory blocks exact retrieve after successful bank mount",async()=>{
  let calls=0;
  const box=makeBox({
    inventory:[
      {name:"cake",q:1},
      {name:"cscale",q:1},
    ],
    smartMove:async(boxRef)=>{
      calls+=1;
      boxRef.character.bank={items0:[{name:"gem1",q:1}]};
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_INVENTORY_VOLL"));
  assert.equal(status.selected.name,"gem1");
  assert.equal(status.emptyInventorySlot,null);
  assert.equal(status.nextAction,"FREE_EXACT_INVENTORY_SLOT_BEFORE_BANK_RETRIEVE");
  assert.equal(calls,1);
});

test("missing smart_move fails closed before any gameplay write",async()=>{
  const status=await run(makeBox());
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_BANK_MOUNT_SMART_MOVE_FEHLT"));
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.movementIssued,false);
  assert.equal(status.sameIntentRetry,false);
});

test("smart_move failure is terminal and never retried",async()=>{
  let calls=0;
  const box=makeBox({
    smartMove:async()=>{
      calls+=1;
      throw new Error("move failed");
    },
  });
  const status=await run(box);
  assert.equal(status.status,"FEHLER");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_BANK_MOUNT_FEHLER_NO_RETRY"));
  assert.equal(status.nextAction,"RECONCILE_MOVEMENT_OUTCOME_NO_RETRY");
  assert.equal(status.gameplayWrites,1);
  assert.equal(status.publicFunctionCalls,1);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(calls,1);
});

test("package contains one movement boundary and no acquisition mutation APIs",()=>{
  assert.equal((source.match(/smartMove\(TARGET\)/g)??[]).length,1);
  for(const marker of [
    "bank_retrieve(",
    "bank_store(",
    "buy(",
    "buy_with_gold(",
    "exchange(",
    "compound(",
    "upgrade(",
    "attack(",
    "use_skill(",
    "socket.emit(",
    ".socket.emit(",
  ]){
    assert.equal(source.includes(marker),false,marker);
  }
});
