import test from "node:test";
import assert from "node:assert/strict";

import {
  AusfuehrungsKernel,
  BANK_SWAP_ACTION_CONTRACT_ID,
  BANK_SWAP_EINMAL_POLICY_ID,
  BANK_SWAP_RECOVERY_CONTRACT_ID,
  BANK_SWAP_VERIFIER_ID,
  BankLeaseKoordinator,
  CharacterSocketBudget,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
  MutationsKanalKoordination,
  PersistenterBankLeaseController,
  ProduktiveBankSwapEinmalAuthority,
  ProduktiveBankSwapTransaktionsOrchestrierung,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

const SHA="1".repeat(40), HASH="2".repeat(64);
const ITEM_A="a".repeat(64), ITEM_B="b".repeat(64), REST="c".repeat(64), INV="d".repeat(64);
const PRE="e".repeat(64), POST="f".repeat(64);

class MemoryJournal {
 constructor(){this.entries=[]}
 async haengeDurableAn(e){this.entries.push(e);return {durable:true,bestaetigungsId:"M:"+e.journalId,journalId:e.journalId,transaktionsId:e.transaktionsId,sequenz:e.sequenz}}
 async liesTransaktion(tx){return this.entries.filter(x=>x.transaktionsId===tx)}
}
function authority(tx="SWAP-TX-1"){
 return new ProduktiveBankSwapEinmalAuthority({schemaVersion:1,aktivierungsId:"SWAP-AUTH-1",transaktionsId:tx,
  faehigkeitId:MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,anbieterModulId:MERCHANT_BANK_CORE_MODUL_ID,anbieterVersion:MERCHANT_BANK_CORE_MODUL_VERSION,
  actionContractId:BANK_SWAP_ACTION_CONTRACT_ID,recoveryContractId:BANK_SWAP_RECOVERY_CONTRACT_ID,verifierId:BANK_SWAP_VERIFIER_ID,
  policyId:BANK_SWAP_EINMAL_POLICY_ID,ausgestelltAmMs:100,gueltigBisMs:2000,faehigkeitsGeneration:7,evidenceIds:["H"],maximaleVerwendungen:1});
}
function binding(lease,swapped=false,changed=true){
 return {schemaVersion:1,characterId:"merchant",sessionId:"session-1",serverRegion:"EU",serverKennung:"I",leaseEpoche:lease,mountEpoche:77,
  beobachtetAmMs:swapped?110:100,bankPack:"items0",slotA:0,slotB:1,
  slotAItem:swapped?{name:"shoes",fingerprint:ITEM_B}:{name:"helmet",fingerprint:ITEM_A},
  slotBItem:swapped?{name:"helmet",fingerprint:ITEM_A}:{name:"shoes",fingerprint:ITEM_B},
  packRestFingerprint:REST,inventoryFingerprint:INV,characterGold:100,bankGold:0,fingerprint:changed?(swapped?POST:PRE):PRE};
}
function request(auth,lease,overrides={}){
 return {schemaVersion:1,freigabeId:"F",auftragId:"O",ablaufId:"FLOW",transaktionsId:auth.daten().transaktionsId,accountId:"account-1",
  characterId:"merchant",sessionId:"session-1",serverRegion:"EU",serverIdentifier:"I",pack:"items0",a:0,b:1,ausgestelltAmMs:100,gueltigBisMs:500,
  leaseDauerMs:10000,maximaleSnapshotAlterMs:1000,externalFence:{serverRegion:"EU",serverIdentifier:"I",mountedCharacterId:"merchant",konflikt:false},
  externalFenceBeobachtetAmMs:100,vorher:binding(lease),authority:auth,wissensSnapshot:{gitCommit:SHA,quellenSha256:[HASH]},
  configFingerprint:HASH,prestateFingerprint:PRE,...overrides};
}
async function env({mode="SERVER",mutate=true,operator=true}={}){
 const ressourcen=new RessourcenVerwalter(), socketBudget=new CharacterSocketBudget(), koord=new BankLeaseKoordinator(ressourcen);let persisted;
 const leaseController=new PersistenterBankLeaseController(koord,{async lies(){return persisted},async schreibeDurable(v){persisted=v}});
 const lease=await leaseController.beanspruche("account-1","merchant","FLOW","bank_swap_two_slot_one_shot_live","EU","I",100,10000);
 const journal=new MemoryJournal();let swapped=false,calls=0,sawIntent=false;
 const adapter={adapterId:"synthetic-swap",actionContractId:BANK_SWAP_ACTION_CONTRACT_ID,recoveryContractId:BANK_SWAP_RECOVERY_CONTRACT_ID,verifierId:BANK_SWAP_VERIFIER_ID,
  async sende(_f,a){calls++;sawIntent=journal.entries[0]?.art==="INTENT";assert.equal(a.pack,"items0");assert.equal(a.a,0);assert.equal(a.b,1);
   if(mutate)swapped=true;
   if(mode==="UNKNOWN")return {art:"UNBEKANNT",grund:"DISCONNECT_NACH_MOEGLICHEM_SEND",korrelationId:null};
   if(mode==="NOT_SENT"){swapped=false;return {art:"NICHT_GESENDET",grund:"PRESTATE_DRIFT"}}
   return {art:"SERVER_ERGEBNIS",korrelationId:"K",ergebnis:{response:"bank_swap"}};
  }};
 const auth=authority();
 return {auth,lease,journal,calls:()=>calls,sawIntent:()=>sawIntent,deps:{leaseController,operatorRichtlinie:{pruefe(){return {erlaubt:operator,generation:2}}},
  laufzeitGate:{pruefe(){return {freigegeben:true,generation:3,nachweisId:"G"}}},journal,ressourcen,socketBudget,
  mutationsKanaele:new MutationsKanalKoordination(ressourcen,socketBudget),ausfuehrung:new AusfuehrungsKernel(),adapter,
  bankBeobachter:{async beobachte(epoche,mount){const b=binding(epoche,swapped,swapped);return {...b,mountEpoche:mount}},
  releaseBeobachter:{async beobachte(){return {offeneTransaktionen:0,backendInProgress:false,bankActionInFlight:false,characterBankAktiv:false,erwarteterExitBeobachtet:true}}},
  vorabLeaseToken:lease,jetztMs:()=>110}};
}

test("bank_swap committed nur nach durable Intent und exaktem Zwei-Slot-Settlement",async()=>{
 const e=await env();const r=await new ProduktiveBankSwapTransaktionsOrchestrierung().fuehreEinmalAus(request(e.auth,e.lease.epoche),e.deps);
 assert.equal(r.status,"COMMITTED");assert.equal(r.journalTerminalArt,"COMMIT");assert.equal(r.pack,"items0");assert.equal(r.a,0);assert.equal(r.b,1);
 assert.equal(r.sameIntentErneutSenden,false);assert.equal(e.calls(),1);assert.equal(e.sawIntent(),true);assert.equal(e.auth.verbraucht(),true);
 assert.deepEqual(e.journal.entries.map(x=>x.art),["INTENT","SERVER_ERGEBNIS","POSTCONDITION","COMMIT"]);
 assert.equal(e.journal.entries[0].inhalt.pack,"items0");assert.equal(e.journal.entries[0].inhalt.slot_a,0);assert.equal(e.journal.entries[0].inhalt.slot_b,1);
 assert.equal(e.deps.leaseController.sicht()[0].zustand,"RELEASED");assert.equal(e.deps.ressourcen.sicht().every(x=>x.status==="FREI"),true);
});

test("UNKNOWN mit beobachtetem Swap wird COMMITTED ohne zweiten Send",async()=>{
 const e=await env({mode:"UNKNOWN"});const r=await new ProduktiveBankSwapTransaktionsOrchestrierung().fuehreEinmalAus(request(e.auth,e.lease.epoche),e.deps);
 assert.equal(r.status,"COMMITTED");assert.equal(r.transportArt,"UNBEKANNT");assert.equal(r.recovery.art,"COMMITTED");assert.equal(e.calls(),1);
});

test("UNKNOWN ohne Swap endet OPERATOR_REQUIRED und nie mit Retry",async()=>{
 const e=await env({mode:"UNKNOWN",mutate:false});const r=await new ProduktiveBankSwapTransaktionsOrchestrierung().fuehreEinmalAus(request(e.auth,e.lease.epoche),e.deps);
 assert.equal(r.status,"OPERATOR_REQUIRED");assert.equal(r.journalTerminalArt,"SICHER_FEHLGESCHLAGEN");assert.equal(r.sameIntentErneutSenden,false);assert.equal(e.calls(),1);
});

test("NICHT_GESENDET endet ABBRUCH mit genau einem Adapteraufruf",async()=>{
 const e=await env({mode:"NOT_SENT",mutate:false});const r=await new ProduktiveBankSwapTransaktionsOrchestrierung().fuehreEinmalAus(request(e.auth,e.lease.epoche),e.deps);
 assert.equal(r.status,"ABORTED");assert.equal(r.transportArt,"NICHT_GESENDET");assert.equal(r.journalTerminalArt,"ABBRUCH");assert.equal(e.calls(),1);
});

test("identische oder out-of-range Slots werden vor Intent und Send verworfen",async()=>{
 for(const overrides of [{b:0},{a:42}]){
  const e=await env();await assert.rejects(()=>new ProduktiveBankSwapTransaktionsOrchestrierung().fuehreEinmalAus(request(e.auth,e.lease.epoche,overrides),e.deps),/KANDIDAT_UNGUELTIG/);
  assert.equal(e.calls(),0);assert.equal(e.journal.entries.length,0);
 }
});
