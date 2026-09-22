import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Bank-Swap-Live-Runner ist source-locked, staged und startet Test 2 nie automatisch",()=>{
 const s=fs.readFileSync("werkzeuge/bank-swap-produktions-live.mjs","utf8");
 assert.match(s,/git/);assert.match(s,/rev-parse/);assert.match(s,/HEAD/);
 assert.match(s,/LIVE_TEST_1/);assert.match(s,/LIVE_TEST_2/);
 assert.match(s,/verlangeBankSwapAbendVorstufe/);
 assert.match(s,/NodeBankSwapLiveTestLimit/);
 assert.match(s,/markiereMoeglichenSend/);
 assert.equal(/\.emit\s*\(/.test(s),false);
 assert.equal(/fuehreBankSwapProduktionslauf\([^)]*testNummer:\s*2/.test(s),false);
});

test("Write-Preflight deklariert null Gameplay- und Adapter-Writes",()=>{
 const s=fs.readFileSync("werkzeuge/bank-swap-produktions-live.mjs","utf8");
 assert.match(s,/WRITE_PREFLIGHT/);
 assert.match(s,/gameplayWrites:0,adapterAufrufe:0,bankSwapAufrufe:0/);
 assert.match(s,/authorityAusgestellt:false,leaseErworben:false,journalIntentGeschrieben:false/);
});
