import test from "node:test";
import assert from "node:assert/strict";
import {
  BANK_RETRIEVE_ACTION_CONTRACT_ID,
  BANK_RETRIEVE_EINMAL_BESTAETIGUNG,
  BANK_RETRIEVE_EINMAL_POLICY_ID,
  BANK_RETRIEVE_RECOVERY_CONTRACT_ID,
  BANK_RETRIEVE_VERIFIER_ID,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
  erteileProduktiveBankRetrieveEinmalAuthority,
} from "../../erzeugt/index.js";
function req(overrides={}){return {schemaVersion:1,aktivierungsId:"A",transaktionsId:"T",faehigkeitId:MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
anbieterModulId:MERCHANT_BANK_CORE_MODUL_ID,anbieterVersion:MERCHANT_BANK_CORE_MODUL_VERSION,actionContractId:BANK_RETRIEVE_ACTION_CONTRACT_ID,
recoveryContractId:BANK_RETRIEVE_RECOVERY_CONTRACT_ID,verifierId:BANK_RETRIEVE_VERIFIER_ID,policyId:BANK_RETRIEVE_EINMAL_POLICY_ID,
bestaetigungText:BANK_RETRIEVE_EINMAL_BESTAETIGUNG,healthEvidence:[{healthId:"h",zustand:"GESUND",beobachtetAmMs:100,gueltigBisMs:1000,evidenceId:"E"}],
jetztMs:100,gueltigBisMs:500,faehigkeitsGeneration:1,...overrides}}
const proto={async schreibeDurable(i){return {durable:true,bestaetigungsId:"ACK",aktivierungsId:i.aktivierungsId,transaktionsId:i.transaktionsId}}};
test("RETRIEVE Authority ist durable, one-shot und raw-write-frei",async()=>{
 const r=await erteileProduktiveBankRetrieveEinmalAuthority(req(),proto);assert.equal(r.erfolgreich,true);assert.equal(r.gameplayWriteAusgefuehrt,false);
 assert.equal(r.rawWriteAutoritaet,false);assert.equal(r.authority.verbraucht(),false);
 assert.equal(r.authority.pruefe(MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,MERCHANT_BANK_CORE_MODUL_ID).erlaubt,true);
 assert.equal(r.authority.pruefe(MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,MERCHANT_BANK_CORE_MODUL_ID).erlaubt,false);
});
test("RETRIEVE Authority blockiert ohne durable Audit",async()=>{
 const r=await erteileProduktiveBankRetrieveEinmalAuthority(req(),null);assert.equal(r.erfolgreich,false);assert.equal(r.authority,null);
});
test("RETRIEVE Authority verlangt exakte Vertragsbindung",async()=>{
 const r=await erteileProduktiveBankRetrieveEinmalAuthority(req({actionContractId:"FALSCH"}),proto);assert.equal(r.erfolgreich,false);
});
