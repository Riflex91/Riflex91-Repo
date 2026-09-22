import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_SWAP_MAX_ECHTE_FUNKTIONSTESTS,
  NodeBankSwapLiveTestLimit,
} from "../adapter/persistenz/node-bank-swap-live-test-limit.mjs";

class Mem {
  constructor(){this.value=undefined}
  async liesText(){return this.value}
  async schreibeAtomarDurable(_p,v){this.value=v}
}
const S="a".repeat(40);
const fp=x=>x.repeat(64).slice(0,64);
function k(a="a",b="b"){
 return {
  pack:"items0",a:0,b:1,
  itemA:{name:"helmet",fingerprint:fp(a)},
  itemB:{name:"shoes",fingerprint:fp(b)},
  packRestFingerprint:fp("c"),
  inventoryFingerprint:fp("d"),
  characterGold:100,bankGold:0,
 };
}
function rev(){const x=k();return {...x,itemA:x.itemB,itemB:x.itemA};}

test("Swap-Live-Testlimit ist hart auf zwei begrenzt", async()=>{
 const ds=new Mem(),limit=new NodeBankSwapLiveTestLimit(ds);
 assert.equal(BANK_SWAP_MAX_ECHTE_FUNKTIONSTESTS,2);
 await limit.beginneTest({sourceSha:S,testNummer:1,transaktionsId:"TX1",prestate:k(),zeitMs:1});
 await assert.rejects(()=>limit.pruefeVorTest({sourceSha:S,testNummer:2,prestate:rev()}),/TEST_1_NICHT_SAUBER/);
 await assert.rejects(()=>limit.pruefeVorTest({sourceSha:S,testNummer:1,prestate:k()}),/BEREITS_VERBRAUCHT/);
 await limit.markiereMoeglichenSend({sourceSha:S,transaktionsId:"TX1",zeitMs:2});
 await limit.finalisiere({sourceSha:S,transaktionsId:"TX1",sauberCommitted:true,ergebnis:{recovery:"BESTAETIGT"},zeitMs:3});
 await limit.beginneTest({sourceSha:S,testNummer:2,transaktionsId:"TX2",prestate:rev(),zeitMs:4});
 await assert.rejects(()=>limit.pruefeVorTest({sourceSha:S,testNummer:2,prestate:rev()}),/REIHENFOLGE/);
});

test("Test 2 verlangt exakten Reverse und sauberen Test 1", async()=>{
 const ds=new Mem(),limit=new NodeBankSwapLiveTestLimit(ds);
 await limit.beginneTest({sourceSha:S,testNummer:1,transaktionsId:"TX1",prestate:k(),zeitMs:1});
 await limit.markiereMoeglichenSend({sourceSha:S,transaktionsId:"TX1",zeitMs:2});
 await limit.finalisiere({sourceSha:S,transaktionsId:"TX1",sauberCommitted:true,ergebnis:{},zeitMs:3});
 await assert.rejects(()=>limit.pruefeVorTest({sourceSha:S,testNummer:2,prestate:k()}),/NICHT_EXAKTER_REVERSE/);
 const ready=await limit.pruefeVorTest({sourceSha:S,testNummer:2,prestate:rev()});
 assert.equal(ready.bereit,true);
});

test("Unsicherer oder abgestuerzter Test 1 sperrt jeden weiteren Send", async()=>{
 const ds=new Mem(),limit=new NodeBankSwapLiveTestLimit(ds);
 await limit.beginneTest({sourceSha:S,testNummer:1,transaktionsId:"TX1",prestate:k(),zeitMs:1});
 await assert.rejects(()=>limit.pruefeVorTest({sourceSha:S,testNummer:2,prestate:rev()}),/NICHT_SAUBER/);
 await limit.finalisiere({sourceSha:S,transaktionsId:"TX1",sauberCommitted:false,ergebnis:{transport:"UNBEKANNT"},zeitMs:2});
 await assert.rejects(()=>limit.pruefeVorTest({sourceSha:S,testNummer:2,prestate:rev()}),/NICHT_SAUBER/);
});
