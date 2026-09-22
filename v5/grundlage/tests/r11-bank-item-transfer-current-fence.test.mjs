import test from "node:test";import assert from "node:assert/strict";
import {pruefeBankItemTransferVorAuthorityCurrentFence} from "../../erzeugt/index.js";
const basis={schemaVersion:1,equipEinmalAuthorityOffen:false,bankDepositEinmalAuthorityOffen:false,bankWithdrawEinmalAuthorityOffen:false,
bankSwapEinmalAuthorityOffen:false,bankRetrieveEinmalAuthorityOffen:false,bankStoreEinmalAuthorityOffen:false,
offeneBankDepositTransaktionId:null,offeneBankWithdrawTransaktionId:null,offeneBankSwapTransaktionId:null,
offeneBankRetrieveTransaktionId:null,offeneBankStoreTransaktionId:null,aktiveBankLease:false};
test("Item-Transfer Current-Fence ist nur ohne Bank-/Equip-Konflikt bereit",()=>{
 assert.equal(pruefeBankItemTransferVorAuthorityCurrentFence(basis).status,"BEREIT");
 for(const patch of [{bankSwapEinmalAuthorityOffen:true},{offeneBankRetrieveTransaktionId:"T"},{offeneBankStoreTransaktionId:"T"},{aktiveBankLease:true}]){
   assert.equal(pruefeBankItemTransferVorAuthorityCurrentFence({...basis,...patch}).status,"BLOCKIERT");
 }
});
