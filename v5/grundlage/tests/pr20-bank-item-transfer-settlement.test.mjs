import test from "node:test";
import assert from "node:assert/strict";
import {
  pruefeBankItemTransferSettlement,
  waehleBankRetrieveErstenKandidaten,
  waehleBankStoreErstenKandidaten,
} from "../../erzeugt/index.js";

const A="a".repeat(64),B="b".repeat(64),P="c".repeat(64),I="d".repeat(64),F="e".repeat(64),G="f".repeat(64);
function base(direction,after=false){
  const item={name:"helmet",fingerprint:A};
  return {
    schemaVersion:1,richtung:direction,characterId:"Merchant",sessionId:"S",serverRegion:"EU",serverKennung:"I",
    leaseEpoche:1,mountEpoche:10,beobachtetAmMs:after?101:100,bankPack:"items0",bankSlot:2,inventorySlot:4,inventoryCapacity:42,
    transferItem:item,
    bankSlotItem:direction==="RETRIEVE"?(after?null:item):(after?item:null),
    inventorySlotItem:direction==="RETRIEVE"?(after?item:null):(after?null:item),
    packRestFingerprint:P,inventoryRestFingerprint:I,characterGold:100,bankGold:0,fingerprint:after?G:F,
  };
}
test("Retrieve bestaetigt nur exakten Bank-zu-leerer-Inventarslot Transfer",()=>{
 const r=pruefeBankItemTransferSettlement(base("RETRIEVE"),base("RETRIEVE",true));
 assert.equal(r.status,"BESTAETIGT");assert.equal(r.quelleLeer,true);assert.equal(r.zielExakt,true);assert.equal(r.sameIntentErneutSenden,false);
});
test("Store bestaetigt nur exakten Inventar-zu-leerem-Bankslot Transfer",()=>{
 const r=pruefeBankItemTransferSettlement(base("STORE"),base("STORE",true));
 assert.equal(r.status,"BESTAETIGT");assert.equal(r.quelleLeer,true);assert.equal(r.zielExakt,true);
});
test("Rest-, Gold- oder Ziel-Drift blockiert",()=>{
 for(const patch of [
  {packRestFingerprint:B},
  {inventoryRestFingerprint:B},
  {characterGold:101},
  {inventorySlotItem:{name:"other",fingerprint:B}},
 ]){
  const before=base("RETRIEVE"),after={...base("RETRIEVE",true),...patch};
  assert.equal(pruefeBankItemTransferSettlement(before,after).status,"DRIFT");
 }
});
test("Retrieve waehlt expliziten leeren Inventarslot und nie -1",()=>{
 const k=waehleBankRetrieveErstenKandidaten(
  [{pack:"items0",slots:[null,{name:"helmet",fingerprint:A}]}],
  [{name:"hpot0",fingerprint:B},null],
  2,
 );
 assert.deepEqual({pack:k.pack,bankSlot:k.bankSlot,inventorySlot:k.inventorySlot}, {pack:"items0",bankSlot:1,inventorySlot:1});
 assert.equal(k.automatischeZielwahl,false);
});
test("Store waehlt nur metadatenneutralen Inventargegenstand und expliziten leeren Bankslot",()=>{
 const k=waehleBankStoreErstenKandidaten(
  [{pack:"items0",slots:[{name:"x",fingerprint:B},null]}],
  [{name:"bad",fingerprint:B,hasM:true},{name:"helmet",fingerprint:A}],
  2,
 );
 assert.deepEqual({pack:k.pack,bankSlot:k.bankSlot,inventorySlot:k.inventorySlot}, {pack:"items0",bankSlot:1,inventorySlot:1});
 assert.equal(k.metadatenMutationAusgeschlossen,true);
});
test("Retrieve ohne freien Inventarslot und Store ohne sicheren Kandidaten fail-closed",()=>{
 assert.equal(waehleBankRetrieveErstenKandidaten([{pack:"items0",slots:[{name:"helmet",fingerprint:A}]}],[{name:"x",fingerprint:B}],1),null);
 assert.equal(waehleBankStoreErstenKandidaten([{pack:"items0",slots:[null]}],[{name:"x",fingerprint:B,blocked:true}],1),null);
});
