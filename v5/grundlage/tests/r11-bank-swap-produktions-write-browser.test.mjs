import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { ProduktionsCdpBankSwapAdapter } from "../../werkzeuge/bank-swap-produktions-write-browser.mjs";

const F=x=>x.repeat(64).slice(0,64);
function req(){
 return {pack:"items0",a:0,b:1,accountId:"a",characterId:"m",sessionId:"s",serverRegion:"EU",serverIdentifier:"I",
 erwartetesItemAName:"helmet",erwartetesItemBName:"shoes",erwartetesItemAFingerprint:F("a"),erwartetesItemBFingerprint:F("b"),
 erwarteterPackRestFingerprint:F("c"),erwarteterInventoryFingerprint:F("d"),erwartetesCharacterGold:1,erwartetesBankGold:0,erwarteterFingerprint:F("e")};
}

test("Swap-Write-Quelle hat exakt eine Public-Function-Sendgrenze und keinen Raw Socket",()=>{
 const src=fs.readFileSync("werkzeuge/bank-swap-produktions-write-browser.mjs","utf8");
 assert.equal((src.match(/\.bank_swap\s*\(/g)||[]).length,1);
 assert.equal(/\.emit\s*\(/.test(src),false);
 assert.match(src,/call_code_function_f/);
 assert.match(src,/vorMoeglichemSend/);
 assert.match(src,/DISCONNECT_NACH_MOEGLICHEM_SEND/);
});

test("durables Send-Gate blockiert vor moeglichem Send",async()=>{
 let gate=0;
 const session={async evaluate(){throw new Error("DARF_NICHT")}};
 const adapter=new ProduktionsCdpBankSwapAdapter(session,7,{vorMoeglichemSend:async()=>{gate++;throw new Error("LIMIT")}});
 adapter.session.evaluate=async()=>({status:"OK",accountId:"a",charakterName:"m",sessionId:"s",ctype:"merchant",map:"bank",serverRegion:"EU",serverKennung:"I",
 rip:false,bewegtSich:false,queueAktiv:false,alternativeRuntimeAktiv:false,bankGemountet:true,bridgeFunctionAvailable:true,codeActive:true,
 characterGold:1,bankGold:0,inventory:[],packs:[{pack:"items0",packMap:"bank",slots:[{name:"helmet"},{name:"shoes"}]}]});
 // Fingerprints des Fakes passen absichtlich nicht: finaler Prestate blockiert noch vor dem Send-Gate.
 const result=await adapter.sende({},req());
 assert.equal(result.art,"NICHT_GESENDET");
 assert.equal(adapter.moeglicherSend,false);
 assert.equal(gate,0);
});
