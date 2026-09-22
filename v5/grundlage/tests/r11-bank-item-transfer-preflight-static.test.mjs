import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("Item-Transfer Preflight besitzt keine mutierende Public-Function oder Raw-Socket-Grenze",()=>{
 for(const f of ["werkzeuge/bank-item-transfer-produktions-browser.mjs","werkzeuge/bank-item-transfer-produktions-preflight.mjs"]){const s=fs.readFileSync(f,"utf8");
  for(const r of [/\bbank_retrieve\s*\(/,/\bbank_store\s*\(/,/\.emit\s*\(/])assert.equal(r.test(s),false,f+" "+r);
 }
});
