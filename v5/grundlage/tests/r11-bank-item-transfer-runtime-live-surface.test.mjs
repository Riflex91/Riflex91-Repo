import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {V5ProduktionsRuntime,erstelleKanonischeProduktionsKomposition} from "../../erzeugt/index.js";
test("Runtime exponiert Retrieve/Store Produktions-Transaktionen",()=>{
 const r=new V5ProduktionsRuntime(erstelleKanonischeProduktionsKomposition());
 assert.equal(typeof r.fuehreBankRetrieveExplizitTransaktion,"function");
 assert.equal(typeof r.fuehreBankStoreExplizitTransaktion,"function");
});
test("Host-Komposition exponiert Retrieve/Store Produktionspfade ohne Raw-Socket",()=>{
 const s=fs.readFileSync("werkzeuge/v5-produktions-host-komposition.mjs","utf8");
 assert.match(s,/async fuehreBankRetrieveExplizitTransaktion\(/);
 assert.match(s,/async fuehreBankStoreExplizitTransaktion\(/);
 assert.equal(/\.emit\s*\(/.test(s),false);
});
