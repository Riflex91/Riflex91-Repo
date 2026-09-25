import test from "node:test";
import assert from "node:assert/strict";
import {
  planePr208ExchangeCandidateAcquisition,
  PR20_8_EXCHANGE_ACQUISITION_MAX_BASE_GOLD,
} from "../../erzeugt/index.js";

const FP_A="a".repeat(64);
const FP_B="b".repeat(64);
const FP_C="c".repeat(64);

function item(overrides={}) {
  return {
    name:"normalexchange",
    fingerprint:FP_A,
    quantity:10,
    locked:false,
    blocked:false,
    giveaway:false,
    listed:false,
    hasExpires:false,
    hasAcl:false,
    hasRid:false,
    hasSpecialProperty:false,
    gift:false,
    exchangeQuantity:5,
    baseGold:100,
    definitionCash:false,
    definitionEvent:false,
    definitionQuest:false,
    definitionExclusive:false,
    ...overrides,
  };
}

function snapshot(overrides={}) {
  return {
    schemaVersion:1,
    currentMap:"bank",
    bankMounted:true,
    inventoryCapacity:4,
    inventory:[null,null,null,null],
    bankPacks:[],
    ...overrides,
  };
}

test("inventory candidate wins and requires no acquisition mutation",()=>{
  const result=planePr208ExchangeCandidateAcquisition(snapshot({
    inventory:[item({name:"inv",fingerprint:FP_A,baseGold:500}),null,null,null],
    bankPacks:[{
      pack:"items0",
      packMap:"bank",
      slots:[item({name:"bank-cheaper",fingerprint:FP_B,baseGold:1})],
    }],
  }));
  assert.equal(result.status,"INVENTORY_CANDIDATE_READY");
  assert.equal(result.selected?.source,"INVENTORY");
  assert.equal(result.selected?.name,"inv");
  assert.equal(result.acquisitionMutationRequired,false);
  assert.equal(result.acquisitionKind,"NONE");
  assert.equal(result.expectedRetrieveCandidate,null);
  assert.equal(result.scannerMustReverifyAfterAcquisition,true);
  assert.equal(result.acquisitionCountsAsExchangeEvidence,false);
  assert.equal(result.bankRetrieveAuthority,false);
  assert.equal(result.exchangeAuthority,false);
});

test("bank candidate is deterministically selected and bound to first empty inventory slot",()=>{
  const result=planePr208ExchangeCandidateAcquisition(snapshot({
    inventory:[
      item({name:"unsafe-inventory",fingerprint:FP_C,quantity:1,exchangeQuantity:5}),
      null,
      null,
      null,
    ],
    bankPacks:[
      {
        pack:"items1",
        packMap:"bank_b",
        slots:[
          item({name:"zeta",fingerprint:FP_A,baseGold:100,exchangeQuantity:5}),
        ],
      },
      {
        pack:"items0",
        packMap:"bank_a",
        slots:[
          item({name:"alpha",fingerprint:FP_B,baseGold:50,exchangeQuantity:5}),
        ],
      },
    ],
  }));
  assert.equal(result.status,"BANK_RETRIEVE_CANDIDATE_READY");
  assert.equal(result.selected?.source,"BANK");
  assert.equal(result.selected?.name,"alpha");
  assert.equal(result.selected?.bankPack,"items0");
  assert.equal(result.selected?.bankSlot,0);
  assert.equal(result.selected?.bankMap,"bank_a");
  assert.equal(result.selected?.inventorySlot,1);
  assert.equal(result.acquisitionMutationRequired,true);
  assert.equal(result.acquisitionKind,"BANK_RETRIEVE");
  assert.deepEqual(result.expectedRetrieveCandidate,{
    schemaVersion:1,
    richtung:"RETRIEVE",
    pack:"items0",
    bankSlot:0,
    inventorySlot:1,
    item:{name:"alpha",fingerprint:FP_B},
    explizitesLeeresInventarZiel:true,
    automatischeZielwahl:false,
  });
  assert.equal(result.bankRetrieveAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("scanner-parity exclusions reject special, unsafe, insufficient and expensive stacks",()=>{
  const bad=[
    item({name:"sixcake",fingerprint:"1".repeat(64)}),
    item({name:"locked",fingerprint:"2".repeat(64),locked:true}),
    item({name:"blocked",fingerprint:"3".repeat(64),blocked:true}),
    item({name:"event",fingerprint:"4".repeat(64),definitionEvent:true}),
    item({name:"quest",fingerprint:"5".repeat(64),definitionQuest:true}),
    item({name:"cash",fingerprint:"6".repeat(64),definitionCash:true}),
    item({name:"exclusive",fingerprint:"7".repeat(64),definitionExclusive:true}),
    item({name:"special",fingerprint:"8".repeat(64),hasSpecialProperty:true}),
    item({name:"gift",fingerprint:"9".repeat(64),gift:true}),
    item({name:"short",fingerprint:"d".repeat(64),quantity:4,exchangeQuantity:5}),
    item({
      name:"expensive",
      fingerprint:"e".repeat(64),
      baseGold:PR20_8_EXCHANGE_ACQUISITION_MAX_BASE_GOLD+1,
    }),
  ];
  const result=planePr208ExchangeCandidateAcquisition(snapshot({
    inventory:[null,null,null,null],
    bankPacks:[{pack:"items0",packMap:"bank",slots:bad}],
  }));
  assert.equal(result.status,"NO_CANDIDATE");
  assert.equal(result.selected,null);
  assert.equal(result.bankCandidateCount,0);
  assert.equal(result.rejectedCount,bad.length);
  assert.equal(result.buyAllowed,false);
  assert.equal(result.farmAllowed,false);
});

test("bank discovery is explicitly required when inventory has no candidate and bank is not mounted",()=>{
  const result=planePr208ExchangeCandidateAcquisition(snapshot({
    bankMounted:false,
    bankPacks:[],
  }));
  assert.equal(result.status,"BANK_DISCOVERY_REQUIRED");
  assert.equal(result.acquisitionMutationRequired,false);
  assert.equal(result.selected,null);
});

test("eligible bank candidate fails closed when no inventory target slot is free",()=>{
  const result=planePr208ExchangeCandidateAcquisition(snapshot({
    inventoryCapacity:2,
    inventory:[
      item({name:"not-exchange-1",fingerprint:FP_A,exchangeQuantity:null}),
      item({name:"not-exchange-2",fingerprint:FP_B,exchangeQuantity:null}),
    ],
    bankPacks:[{
      pack:"items0",
      packMap:"bank",
      slots:[item({name:"bank",fingerprint:FP_C})],
    }],
  }));
  assert.equal(result.status,"BANK_CANDIDATE_BLOCKED_NO_FREE_INVENTORY_SLOT");
  assert.equal(result.selected?.name,"bank");
  assert.equal(result.expectedRetrieveCandidate,null);
  assert.equal(result.acquisitionMutationRequired,false);
  assert.equal(result.bankRetrieveAuthority,false);
});

test("eligible candidates follow scanner ordering by base gold, exchange quantity, name and slot",()=>{
  const result=planePr208ExchangeCandidateAcquisition(snapshot({
    bankPacks:[
      {
        pack:"items2",
        packMap:"bank",
        slots:[
          item({name:"b",fingerprint:FP_A,baseGold:50,exchangeQuantity:5}),
          item({name:"a",fingerprint:FP_B,baseGold:50,exchangeQuantity:5}),
        ],
      },
      {
        pack:"items1",
        packMap:"bank",
        slots:[
          item({name:"cheap-more",fingerprint:FP_C,baseGold:20,exchangeQuantity:10}),
        ],
      },
    ],
  }));
  assert.equal(result.selected?.name,"cheap-more");
  assert.equal(result.selected?.baseGold,20);
});

test("planner never grants buy, farm, retrieve, exchange or runtime authority",()=>{
  const result=planePr208ExchangeCandidateAcquisition(snapshot());
  assert.equal(result.buyAllowed,false);
  assert.equal(result.farmAllowed,false);
  assert.equal(result.bankRetrieveAuthority,false);
  assert.equal(result.exchangeAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});
