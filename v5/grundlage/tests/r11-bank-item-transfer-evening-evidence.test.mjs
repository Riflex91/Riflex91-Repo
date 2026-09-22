import test from "node:test";import assert from "node:assert/strict";
import {validiereBankItemTransferAbendEvidence,BANK_ITEM_TRANSFER_ABEND_STUFEN} from "../../werkzeuge/bank-item-transfer-evening-evidence.mjs";
const H="a".repeat(40);
test("Retrieve/Store Evening-Evidence verlangt exakten SHA, Stufe und no-write",()=>{
 for(const modus of ["RETRIEVE","STORE"]){
  const b={schemaVersion:1,modus,stufe:BANK_ITEM_TRANSFER_ABEND_STUFEN.STABILITAET,status:"BESTANDEN",sourceSha:H,actualHeadSha:H,sameIntentRetry:false,safety:{gameplayWrites:0,adapterAufrufe:0,publicFunctionAufrufe:0,mutatingPublicFunctionCalls:0}};
  assert.equal(validiereBankItemTransferAbendEvidence(b,modus,BANK_ITEM_TRANSFER_ABEND_STUFEN.STABILITAET,H).status,"BESTANDEN");
  assert.throws(()=>validiereBankItemTransferAbendEvidence({...b,safety:{...b.safety,publicFunctionAufrufe:1}},modus,BANK_ITEM_TRANSFER_ABEND_STUFEN.STABILITAET,H),/NO_WRITE/);
 }
});
