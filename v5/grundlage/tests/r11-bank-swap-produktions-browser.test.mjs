import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BANK_SWAP_PREFLIGHT_BROWSER_READ_ONLY,
  BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES,
  BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,
  validiereBankSwapPreflightBeobachtung,
  validiereBankSwapAusgangsBeobachtung,
  validiereBankSwapMountBeobachtung,
  erstelleBankSwapBindung,
} from "../../werkzeuge/bank-swap-produktions-browser.mjs";

function obs(overrides={}){
 return {status:"OK",accountId:"a",charakterName:"Merchant",sessionId:"s",ctype:"merchant",map:"bank",
 serverRegion:"EU",serverKennung:"I",rip:false,bewegtSich:false,queueAktiv:false,alternativeRuntimeAktiv:false,
 bankGemountet:true,bridgeFunctionAvailable:true,codeActive:false,characterGold:10,bankGold:0,inventory:[null],
 packs:[{pack:"items0",packMap:"bank",slots:[{name:"helmet",level:0},{name:"shoes",level:1},null]}],...overrides};
}
test("Swap-Browser bleibt read-only",()=>{
 assert.equal(BANK_SWAP_PREFLIGHT_BROWSER_READ_ONLY,true);
 assert.equal(BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES,0);
 assert.equal(BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,0);
 const s=fs.readFileSync("werkzeuge/bank-swap-produktions-browser.mjs","utf8");
 for(const r of [/\bbank_swap\s*\(/,/call_code_function_f\s*\(/,/\.emit\s*\(/]) assert.equal(r.test(s),false);
});
test("Swap-Mount erzeugt exakte Zwei-Slot-Bindung auch bei bankGold=0",()=>{
 const m=validiereBankSwapPreflightBeobachtung(obs(),100);
 assert.equal(m.kandidat.pack,"items0");assert.equal(m.kandidat.a,0);assert.equal(m.kandidat.b,1);assert.equal(m.bankGold,0);
 const b=erstelleBankSwapBindung(m,7);
 assert.equal(b.leaseEpoche,7);assert.equal(b.bankPack,"items0");assert.equal(b.slotAItem.name,"helmet");assert.equal(b.slotBItem.name,"shoes");
});
test("Swap-Start muss ausserhalb Bank sein, Mount danach identisch gebunden",()=>{
 const a=validiereBankSwapAusgangsBeobachtung(obs({bankGemountet:false,bankGold:null,packs:[]}));
 const m=validiereBankSwapMountBeobachtung(obs(),a,101,null);
 assert.equal(m.charakterName,a.charakterName);assert.equal(m.bankGemountet,true);
});
test("Swap blockiert gleichen Namen, falschen Pack-Mount und Runtime-Drift",()=>{
 assert.throws(()=>validiereBankSwapPreflightBeobachtung(obs({packs:[{pack:"items0",packMap:"bank",slots:[{name:"hpot0"},{name:"hpot0"}]}]}),100),/KEIN_SICHERER/);
 assert.throws(()=>validiereBankSwapPreflightBeobachtung(obs({packs:[{pack:"items8",packMap:"bank_b",slots:[{name:"a"},{name:"b"}]}]}),100),/KEIN_PACK/);
 assert.throws(()=>validiereBankSwapPreflightBeobachtung(obs({alternativeRuntimeAktiv:true}),100),/ALTERNATIVE_RUNTIME/);
});
