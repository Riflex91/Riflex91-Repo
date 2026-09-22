import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("Item-Transfer Live-Runner hat explizite Zwei-Test-Grenzen und keinen Raw-Socket-Bypass",()=>{
 const s=fs.readFileSync("werkzeuge/bank-item-transfer-produktions-live.mjs","utf8");
 assert.match(s,/NodeBankItemTransferLiveTestSequence/);assert.match(s,/testNummer!==1&&testNummer!==2/);assert.match(s,/transportArt==="SERVER_ERGEBNIS"/);assert.match(s,/sameIntentRetry:false/);assert.equal(/\.emit\s*\(/.test(s),false);
});
test("Live-Runner startet keinen zweiten Test automatisch",()=>{
 const s=fs.readFileSync("werkzeuge/bank-item-transfer-produktions-live.mjs","utf8");
 assert.equal(/fuehreBankItemTransferProduktionslauf\([\s\S]*fuehreBankItemTransferProduktionslauf\(/.test(s.slice(s.indexOf("export async function"))),false);
});
