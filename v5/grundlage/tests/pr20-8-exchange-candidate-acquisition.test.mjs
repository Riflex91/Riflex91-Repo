import test from "node:test";
import assert from "node:assert/strict";
import {
  planePr208ExchangeCandidateAcquisition,
} from "../../erzeugt/index.js";

function item(overrides={}){
  return {
    name:"gem1",
    quantity:1,
    baseGold:24000,
    exchangeQuantity:1,
    locked:false,
    blocked:false,
    specialProperty:false,
    gift:false,
    cash:false,
    event:false,
    quest:false,
    exclusive:false,
    ...overrides,
  };
}

test("inventory candidate wins and needs no acquisition write",()=>{
  const result=planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:4,
    inventory:[
      {...item(),inventorySlot:0},
      null,
      null,
      null,
    ],
    bankSnapshotAvailable:false,
    bank:[],
  });
  assert.equal(result.status,"INVENTORY_CANDIDATE_PRESENT");
  assert.equal(result.selected?.source,"INVENTORY");
  assert.equal(result.selected?.name,"gem1");
  assert.equal(result.bankRetrieveRequired,false);
  assert.equal(result.nextAction,"RUN_EXISTING_EXCHANGE_SCANNER");
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.publicFunctionCalls,0);
  assert.equal(result.rawWriteCalls,0);
});

test("missing bank snapshot stays read-only and requests bank observation",()=>{
  const result=planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:3,
    inventory:[
      {...item({name:"cake",exchangeQuantity:null,baseGold:100}),inventorySlot:0},
      null,
      null,
    ],
    bankSnapshotAvailable:false,
    bank:[],
  });
  assert.equal(result.status,"BANK_SNAPSHOT_REQUIRED");
  assert.equal(result.selected,null);
  assert.equal(result.nextAction,"ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY");
  assert.equal(result.bankRetrieveAllowedByThisPlan,false);
});

test("bank candidate is selected deterministically and only prepares exact retrieve",()=>{
  const result=planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:4,
    inventory:[
      {...item({name:"cake",exchangeQuantity:null,baseGold:100}),inventorySlot:0},
      null,
      null,
      null,
    ],
    bankSnapshotAvailable:true,
    bank:[
      {...item({name:"candypop",quantity:10,exchangeQuantity:10,baseGold:120}),pack:"items1",bankSlot:7},
      {...item({name:"gem1",quantity:1,exchangeQuantity:1,baseGold:24000}),pack:"items0",bankSlot:2},
    ],
  });
  assert.equal(result.status,"BANK_CANDIDATE_FOUND");
  assert.equal(result.selected?.source,"BANK");
  assert.equal(result.selected?.name,"candypop");
  assert.equal(result.selected?.pack,"items1");
  assert.equal(result.selected?.bankSlot,7);
  assert.equal(result.emptyInventorySlot,1);
  assert.equal(result.bankRetrieveRequired,true);
  assert.equal(result.bankRetrieveAllowedByThisPlan,false);
  assert.equal(result.nextAction,"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT");
});

test("scanner exclusions are preserved for bank discovery",()=>{
  const result=planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:4,
    inventory:[null,null,null,null],
    bankSnapshotAvailable:true,
    bank:[
      {...item({name:"sixcake",baseGold:100}),pack:"items0",bankSlot:0},
      {...item({name:"anniversarygift",baseGold:100,exclusive:true}),pack:"items0",bankSlot:1},
      {...item({name:"gem2",baseGold:360000}),pack:"items0",bankSlot:2},
      {...item({name:"candypop",quantity:9,exchangeQuantity:10,baseGold:120}),pack:"items0",bankSlot:3},
    ],
  });
  assert.equal(result.status,"NO_CANDIDATE_INVENTORY_OR_BANK");
  assert.equal(result.selected,null);
  assert.equal(result.rejectedCount,4);
  assert.equal(result.nextAction,"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE");
  assert.equal(result.buyAllowedByThisPlan,false);
  assert.equal(result.farmAllowedByThisPlan,false);
});

test("bank candidate cannot be prepared without empty inventory slot",()=>{
  const result=planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:2,
    inventory:[
      {...item({name:"cake",exchangeQuantity:null,baseGold:100}),inventorySlot:0},
      {...item({name:"cscale",exchangeQuantity:null,baseGold:200}),inventorySlot:1},
    ],
    bankSnapshotAvailable:true,
    bank:[
      {...item(),pack:"items0",bankSlot:5},
    ],
  });
  assert.equal(result.status,"NO_CANDIDATE_INVENTORY_OR_BANK");
  assert.equal(result.selected,null);
  assert.equal(result.emptyInventorySlot,null);
});

test("candidate ordering is stable by base value, exchange quantity and identity",()=>{
  const result=planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:4,
    inventory:[null,null,null,null],
    bankSnapshotAvailable:true,
    bank:[
      {...item({name:"gem1",baseGold:24000,exchangeQuantity:1}),pack:"items2",bankSlot:4},
      {...item({name:"candypop",baseGold:120,quantity:20,exchangeQuantity:10}),pack:"items1",bankSlot:8},
      {...item({name:"candypop",baseGold:120,quantity:10,exchangeQuantity:10}),pack:"items0",bankSlot:1},
    ],
  });
  assert.equal(result.status,"BANK_CANDIDATE_FOUND");
  assert.equal(result.selected?.name,"candypop");
  assert.equal(result.selected?.pack,"items0");
  assert.equal(result.selected?.bankSlot,1);
});

test("invalid snapshot data fails closed",()=>{
  assert.throws(()=>planePr208ExchangeCandidateAcquisition({
    schemaVersion:1,
    inventoryCapacity:0,
    inventory:[],
    bankSnapshotAvailable:false,
    bank:[],
  }),/PR20_8_ACQUISITION_INVENTORY_CAPACITY_UNGUELTIG/);
});
