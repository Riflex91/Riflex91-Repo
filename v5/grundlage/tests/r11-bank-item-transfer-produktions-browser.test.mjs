import test from "node:test";import assert from "node:assert/strict";
import {validiereBankItemTransferPreflightBeobachtung,BANK_ITEM_TRANSFER_PREFLIGHT_GAMEPLAY_WRITES,BANK_ITEM_TRANSFER_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS} from "../../werkzeuge/bank-item-transfer-produktions-browser.mjs";
const A="a".repeat(64);
function raw(overrides={}){return {status:"OK",accountId:"acc",charakterName:"Merchant",sessionId:"S",ctype:"merchant",map:"bank",serverRegion:"EU",serverKennung:"I",rip:false,bewegtSich:false,queueAktiv:false,alternativeRuntimeAktiv:false,bankGemountet:true,bridgeFunctionAvailable:true,codeActive:true,characterGold:100,bankGold:0,inventoryCapacity:3,
 inventory:[{name:"helmet"},null,{name:"blocked",b:true}],packs:[{pack:"items0",packMap:"bank",slots:[{name:"shoes"},null]}],...overrides}}
test("Item-Transfer Browser bleibt read-only und erzeugt beide expliziten Kandidaten",()=>{
 assert.equal(BANK_ITEM_TRANSFER_PREFLIGHT_GAMEPLAY_WRITES,0);assert.equal(BANK_ITEM_TRANSFER_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,0);
 const x=validiereBankItemTransferPreflightBeobachtung(raw(),100);
 assert.deepEqual({b:x.retrieveKandidat.bankSlot,i:x.retrieveKandidat.inventorySlot},{b:0,i:1});
 assert.deepEqual({b:x.storeKandidat.bankSlot,i:x.storeKandidat.inventorySlot},{b:1,i:0});
 assert.equal(x.retrieveKandidat.automatischeZielwahl,false);assert.equal(x.storeKandidat.automatischeZielwahl,false);
});
test("Store blockiert m/v/b Kandidaten und Retrieve verlangt leeren Inventarslot",()=>{
 const noInv=raw({inventoryCapacity:2,inventory:[{name:"a"},{name:"b"}]});assert.equal(validiereBankItemTransferPreflightBeobachtung(noInv,100).retrieveKandidat,null);
 const noSafe=raw({inventoryCapacity:2,inventory:[{name:"a",m:"x"},{name:"b",v:1}],packs:[{pack:"items0",packMap:"bank",slots:[null]}]});
 assert.equal(validiereBankItemTransferPreflightBeobachtung(noSafe,100).storeKandidat,null);
});
test("falscher Mount oder Alternative Runtime blockiert fail-closed",()=>{
 assert.throws(()=>validiereBankItemTransferPreflightBeobachtung(raw({bankGemountet:false}),100),/BANK_NICHT_GEMOUNTET/);
 assert.throws(()=>validiereBankItemTransferPreflightBeobachtung(raw({alternativeRuntimeAktiv:true}),100),/ALTERNATIVE_RUNTIME_AKTIV/);
});
