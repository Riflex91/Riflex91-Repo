import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("Retrieve/Store Real-Shadow bleibt ohne Sendgrenze",()=>{
 for(const f of ["werkzeuge/bank-item-transfer-real-browser-shadow.mjs","werkzeuge/bank-item-transfer-produktions-browser.mjs"]){const s=fs.readFileSync(f,"utf8");for(const r of [/\.emit\s*\(/,/maincode\.contentWindow\.bank_retrieve\s*\(/,/maincode\.contentWindow\.bank_store\s*\(/])assert.equal(r.test(s),false,f+" "+r)}
});
