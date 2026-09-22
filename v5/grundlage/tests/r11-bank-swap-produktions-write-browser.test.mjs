import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ProduktionsCdpBankSwapAdapter } from "../../werkzeuge/bank-swap-produktions-write-browser.mjs";
import { validiereBankSwapPreflightBeobachtung } from "../../werkzeuge/bank-swap-produktions-browser.mjs";

function raw(overrides={}){
 return {status:"OK",accountId:"account-1",charakterName:"merchant",sessionId:"session-1",ctype:"merchant",map:"bank",serverRegion:"EU",serverKennung:"I",
  rip:false,bewegtSich:false,queueAktiv:false,alternativeRuntimeAktiv:false,bankGemountet:true,bridgeFunctionAvailable:true,codeActive:true,
  characterGold:100,bankGold:0,inventory:[null,{name:"hpot0",q:5}],packs:[{pack:"items0",packMap:"bank",slots:[{name:"helmet",level:0},{name:"shoes",level:1},null]}],...overrides};
}
function req(overrides={}){
 const s=validiereBankSwapPreflightBeobachtung(raw(),100),k=s.kandidat;
 return {pack:k.pack,a:k.a,b:k.b,accountId:"account-1",characterId:"merchant",sessionId:"session-1",serverRegion:"EU",serverIdentifier:"I",
  erwartetesItemAName:k.itemA.name,erwartetesItemBName:k.itemB.name,erwartetesItemAFingerprint:k.itemA.fingerprint,erwartetesItemBFingerprint:k.itemB.fingerprint,
  erwarteterPackRestFingerprint:k.packRestFingerprint,erwarteterInventoryFingerprint:s.inventoryFingerprint,erwartetesCharacterGold:100,erwartetesBankGold:0,
  erwarteterFingerprint:s.fingerprint,...overrides};
}
test("Swap-Write-Adapter hat exakt einen Public-Function-Write und keinen Raw-Socket-Bypass",()=>{
 const s=fs.readFileSync("werkzeuge/bank-swap-produktions-write-browser.mjs","utf8");
 assert.equal((s.match(/runner\.bank_swap\(E\.pack,E\.a,E\.b\)/g)??[]).length,1);
 assert.match(s,/call_code_function_f\('eval','void 0'\)/);assert.equal(/\.emit\s*\(/.test(s),false);
});
test("Swap-Adapter final revalidiert und sendet maximal einmal",async()=>{
 let calls=0,writeExpr="";
 const session={async evaluate(expr,id,opt){calls++;assert.equal(id,7);if(opt===undefined)return raw();writeExpr=expr;return {sent:true,result:{response:"bank_swap"}}}};
 const a=new ProduktionsCdpBankSwapAdapter(session,7);const r=await a.sende({},req());
 assert.equal(r.art,"SERVER_ERGEBNIS");assert.equal(calls,2);assert.equal(a.adapterAufrufe,1);assert.equal(a.gameWrites,1);assert.equal(a.moeglicherSend,true);
 assert.ok(writeExpr.includes("runner.bank_swap(E.pack,E.a,E.b)"));await assert.rejects(()=>a.sende({},req()),/MEHR_ALS_EIN/);
});
test("ungueltige Slot-Anfrage blockiert vor Browseraufruf",async()=>{
 let calls=0;const a=new ProduktionsCdpBankSwapAdapter({async evaluate(){calls++;return raw()}},1);const r=await a.sende({},req({a:1,b:1}));
 assert.equal(r.art,"NICHT_GESENDET");assert.equal(calls,0);assert.equal(a.gameWrites,0);assert.equal(a.moeglicherSend,false);
});
test("Item-Fingerprint-Drift blockiert vor moeglichem Send",async()=>{
 let calls=0;const drift=raw({packs:[{pack:"items0",packMap:"bank",slots:[{name:"helmet",level:2},{name:"shoes",level:1}]}]});
 const a=new ProduktionsCdpBankSwapAdapter({async evaluate(){calls++;return drift}},1);const r=await a.sende({},req());
 assert.equal(r.art,"NICHT_GESENDET");assert.equal(r.grund,"BANK_SWAP_WRITE_FINAL_PRESTATE_DRIFT");assert.equal(calls,1);assert.equal(a.moeglicherSend,false);
});
test("CDP-Abbruch nach moeglichem Send wird UNBEKANNT und nicht retrybar",async()=>{
 let calls=0;const a=new ProduktionsCdpBankSwapAdapter({async evaluate(){calls++;if(calls===1)return raw();throw new Error("CDP")}},1);const r=await a.sende({},req());
 assert.equal(r.art,"UNBEKANNT");assert.equal(a.adapterAufrufe,1);assert.equal(a.gameWrites,0);assert.equal(a.moeglicherSend,true);
 await assert.rejects(()=>a.sende({},req()),/MEHR_ALS_EIN/);
});

test("durables Send-Gate blockiert nach exaktem finalem Prestate aber vor moeglichem Send",async()=>{
 let calls=0,gate=0;
 const adapter=new ProduktionsCdpBankSwapAdapter({
  async evaluate(){calls++;return raw()}
 },1,{vorMoeglichemSend:async()=>{gate++;throw new Error("TESTLIMIT")}});
 const r=await adapter.sende({},req());
 assert.equal(r.art,"NICHT_GESENDET");
 assert.equal(r.grund,"BANK_SWAP_WRITE_SEND_GATE_BLOCKIERT");
 assert.equal(calls,1);
 assert.equal(gate,1);
 assert.equal(adapter.gameWrites,0);
 assert.equal(adapter.moeglicherSend,false);
});
