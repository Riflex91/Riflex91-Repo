import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  new URL("../pr20-8-exchange-candidate-acquisition-readonly-v1-0-1.js",import.meta.url),
  "utf8",
);

function makeBox({inventory,bank}={}){
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
    q:{},
    rip:false,
    dead:false,
    moving:false,
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
  box.globalThis=box;
  box.parent=box;
  return box;
}

async function run(box){
  vm.createContext(box);
  vm.runInContext(source,box,{
    filename:"pr20-8-exchange-candidate-acquisition-readonly-v1-0-1.js",
  });
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,1));
    const status=box.V5PR208ExchangeCandidateAcquisitionReadonly?.status?.();
    if(status?.terminal) return JSON.parse(JSON.stringify(status));
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

test("inventory Exchange candidate is detected without writes",async()=>{
  const box=makeBox({
    inventory:[
      {name:"gem1",q:1},
      null,
      null,
      null,
    ],
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.selected.source,"INVENTORY");
  assert.equal(status.selected.name,"gem1");
  assert.equal(status.nextAction,"RUN_EXISTING_EXCHANGE_SCANNER");
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.acquisitionAuthority.bankRetrieve,false);
  assert.equal(status.acquisitionAuthority.buy,false);
  assert.equal(status.acquisitionAuthority.farm,false);
});

test("missing bank snapshot requests only fresh read-only bank observation",async()=>{
  const status=await run(makeBox());
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_BANK_SNAPSHOT_REQUIRED"));
  assert.equal(status.bankSnapshotAvailable,false);
  assert.equal(status.nextAction,"ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY");
  assert.equal(status.gameplayWrites,0);
});

test("bank Exchange candidate is selected deterministically with exact source slot",async()=>{
  const box=makeBox({
    bank:{
      items1:[
        null,
        {name:"gem1",q:1},
      ],
      items0:[
        {name:"candypop",q:10},
        {name:"sixcake",q:1},
        {name:"anniversarygift",q:1},
      ],
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.bankSnapshotAvailable,true);
  assert.equal(status.inventoryCandidateCount,0);
  assert.equal(status.bankCandidateCount,2);
  assert.equal(status.selected.source,"BANK");
  assert.equal(status.selected.name,"candypop");
  assert.equal(status.selected.pack,"items0");
  assert.equal(status.selected.bankSlot,0);
  assert.equal(status.emptyInventorySlot,1);
  assert.equal(status.nextAction,"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT");
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
});

test("sixcake, exclusive and high-value Exchange inputs stay excluded",async()=>{
  const box=makeBox({
    bank:{
      items0:[
        {name:"sixcake",q:1},
        {name:"anniversarygift",q:1},
        {name:"gem2",q:1},
      ],
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_KEIN_INVENTORY_ODER_BANK_KANDIDAT"));
  assert.equal(status.bankCandidateCount,0);
  assert.equal(status.nextAction,"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE");
});

test("bank candidate with full inventory fails closed before retrieve preparation",async()=>{
  const box=makeBox({
    inventory:[
      {name:"cake",q:1},
      {name:"cscale",q:1},
    ],
    bank:{
      items0:[{name:"gem1",q:1}],
    },
  });
  const status=await run(box);
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_ACQUISITION_INVENTORY_VOLL"));
  assert.equal(status.nextAction,"FREE_EXACT_INVENTORY_SLOT_BEFORE_BANK_RETRIEVE");
  assert.equal(status.gameplayWrites,0);
});

test("discovery package contains no mutating gameplay API",()=>{
  for(const marker of [
    "smart_move(",
    "bank_retrieve(",
    "bank_store(",
    "buy(",
    "buy_with_gold(",
    "exchange(",
    "attack(",
    "use_skill(",
    "socket.emit(",
    ".socket.emit(",
  ]){
    assert.equal(source.includes(marker),false,marker);
  }
});
