import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {V5ProduktionsRuntime,erstelleKanonischeProduktionsKomposition} from "../../erzeugt/index.js";
test("Runtime stellt Retrieve/Store Authority, Revalidation und Shadow getrennt bereit",()=>{
 const r=new V5ProduktionsRuntime(erstelleKanonischeProduktionsKomposition());
 for(const n of ["erteileBankRetrieveEinmalAuthority","revalidiereBankRetrieveEinmalAuthority","fuehreBankRetrieveShadowAdmission","erteileBankStoreEinmalAuthority","revalidiereBankStoreEinmalAuthority","fuehreBankStoreShadowAdmission"])assert.equal(typeof r[n],"function",n);
 assert.equal(r.status().offeneBankRetrieveEinmalAuthority,false);assert.equal(r.status().offeneBankStoreEinmalAuthority,false);
});
test("Retrieve/Store Shadowquellen enthalten keine Public-Function oder Raw-Socket Sendgrenze",()=>{
 for(const f of ["grundlage/quelle/merchant/bank-retrieve-shadow-admission.ts","grundlage/quelle/merchant/bank-store-shadow-admission.ts"]){const s=fs.readFileSync(f,"utf8");for(const x of [/\bbank_retrieve\s*\(/,/\bbank_store\s*\(/,/\.emit\s*\(/,/AusfuehrungsAdapter/,/AusfuehrungsKernel/])assert.equal(x.test(s),false,f+" "+x)}
});
