import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_SWAP_ACTION_CONTRACT_ID,
  BANK_SWAP_EINMAL_BESTAETIGUNG,
  BANK_SWAP_EINMAL_POLICY_ID,
  BANK_SWAP_RECOVERY_CONTRACT_ID,
  BANK_SWAP_VERIFIER_ID,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
  V5ProduktionsRuntime,
  erstelleKanonischeProduktionsKomposition,
} from "../../erzeugt/index.js";

const health=[{
  healthId:"h",zustand:"GESUND",beobachtetAmMs:100,gueltigBisMs:1000,evidenceId:"E-SWAP"
}];

function protocol(){
  return {async schreibeDurable(intent){return {
    durable:true,bestaetigungsId:"S:"+intent.aktivierungsId,
    aktivierungsId:intent.aktivierungsId,transaktionsId:intent.transaktionsId
  }}};
}

test("Runtime stellt Swap-One-Shot default-off und durable aus", async () => {
  const runtime=new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    null,null,null,null,null,protocol(),
  );
  runtime.kernKomponenten().module.setzeGesundheit("merchant-bank-core","1","GESUND");
  runtime.kernKomponenten().module.setzeGesundheit("merchant-core-a","1","GESUND");
  runtime.kernKomponenten().module.setzeGesundheit("equipment-core","1","GESUND");
  // Direkter Prozessstart wird in den umfassenden Hosttests geprueft; hier nur Typ-/Oberflaechenabdeckung.
  assert.equal(typeof runtime.erteileBankSwapEinmalAuthority,"function");
  assert.equal(typeof runtime.revalidiereBankSwapEinmalAuthority,"function");
  assert.equal(typeof runtime.fuehreBankSwapShadowAdmission,"function");
  assert.equal(runtime.status().offeneBankSwapEinmalAuthority,false);
  assert.equal(MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,"merchant.bank.intern_tauschen");
  assert.equal(BANK_SWAP_ACTION_CONTRACT_ID,"AL-ACTION-BANK-SWAP");
  assert.equal(BANK_SWAP_RECOVERY_CONTRACT_ID,"AL-RECOVERY-BANK-SWAP");
  assert.equal(BANK_SWAP_VERIFIER_ID,"AL-VERIFIER-BANK-SWAP");
  assert.equal(BANK_SWAP_EINMAL_POLICY_ID,"BANK-SWAP-PRODUKTION-EINMAL-V1");
  assert.equal(BANK_SWAP_EINMAL_BESTAETIGUNG,"V5 BANK SWAP EINMAL AUSFUEHREN");
  assert.equal(MERCHANT_BANK_CORE_MODUL_ID,"merchant-bank-core");
  assert.equal(MERCHANT_BANK_CORE_MODUL_VERSION,"1");
  assert.equal(health.length,1);
});
