const PFAD="runtime/canary/bank-item-transfer-evening/live-test-sequence.json";
const STUFEN=Object.freeze([
 Object.freeze({modus:"RETRIEVE",testNummer:1}),
 Object.freeze({modus:"STORE",testNummer:1}),
 Object.freeze({modus:"RETRIEVE",testNummer:2}),
 Object.freeze({modus:"STORE",testNummer:2}),
]);
function sha(v){if(typeof v!=="string"||!/^[a-f0-9]{40}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_SHA_UNGUELTIG");return v.toLowerCase()}
function txt(v,n,max=192){if(typeof v!=="string"||v.trim().length===0||v.length>max)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_TEXT_UNGUELTIG:"+n);return v}
function fp(v,n){if(typeof v!=="string"||!/^[a-f0-9]{64}$/i.test(v))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_FP_UNGUELTIG:"+n);return v.toLowerCase()}
function mode(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_MODUS_UNGUELTIG");return x}
function k(v){
 if(!v||typeof v!=="object"||!/^items[0-9]+$/.test(String(v.pack||""))||!Number.isInteger(v.bankSlot)||v.bankSlot<0||v.bankSlot>41||!Number.isInteger(v.inventorySlot)||v.inventorySlot<0||v.inventorySlot>63||!v.item)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_KANDIDAT_UNGUELTIG");
 const out=Object.freeze({pack:String(v.pack),bankSlot:v.bankSlot,inventorySlot:v.inventorySlot,item:Object.freeze({name:txt(v.item.name,"item.name"),fingerprint:fp(v.item.fingerprint,"item")}),
  packRestFingerprint:fp(v.packRestFingerprint,"packRest"),inventoryRestFingerprint:fp(v.inventoryRestFingerprint,"inventoryRest"),characterGold:v.characterGold,bankGold:v.bankGold});
 if(!Number.isSafeInteger(out.characterGold)||out.characterGold<0||!Number.isSafeInteger(out.bankGold)||out.bankGold<0)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_GOLD_UNGUELTIG");return out;
}
function gleich(a,b){return a.pack===b.pack&&a.bankSlot===b.bankSlot&&a.inventorySlot===b.inventorySlot&&a.item.name===b.item.name&&a.item.fingerprint===b.item.fingerprint&&a.packRestFingerprint===b.packRestFingerprint&&a.inventoryRestFingerprint===b.inventoryRestFingerprint&&a.characterGold===b.characterGold&&a.bankGold===b.bankGold}
function leer(s){return Object.freeze({schemaVersion:1,sourceSha:s,maxEchteFunktionstestsProFunktion:2,maxGesamtWrites:4,attempts:Object.freeze([])})}
function state(v){if(!v||v.schemaVersion!==1||v.maxEchteFunktionstestsProFunktion!==2||v.maxGesamtWrites!==4||!Array.isArray(v.attempts)||v.attempts.length>4)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_STATE_UNGUELTIG");
 const s=sha(v.sourceSha),attempts=v.attempts.map((x,i)=>{const exp=STUFEN[i];if(!exp||mode(x.modus)!==exp.modus||x.testNummer!==exp.testNummer)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_REIHENFOLGE_STATE_DRIFT");
  return Object.freeze({...x,sourceSha:sha(x.sourceSha),transaktionsId:txt(x.transaktionsId,"tx"),modus:mode(x.modus),prestate:k(x.prestate)})});
 return Object.freeze({schemaVersion:1,sourceSha:s,maxEchteFunktionstestsProFunktion:2,maxGesamtWrites:4,attempts:Object.freeze(attempts)})}
export class NodeBankItemTransferLiveTestSequence{
 constructor(ds){if(!ds||typeof ds.liesText!=="function"||typeof ds.schreibeAtomarDurable!=="function")throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_DATEISYSTEM_UNGUELTIG");this.ds=ds}
 async lade(sourceSha){const s=sha(sourceSha),raw=await this.ds.liesText(PFAD);if(raw===undefined)return leer(s);if(raw.length<2||raw.length>800000)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_DATEI_UNGUELTIG");let x;try{x=state(JSON.parse(raw))}catch(e){throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_PARSE_ODER_STATE_FEHLER:"+String(e?.message||e))}
  if(x.sourceSha!==s)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_SOURCE_DRIFT:"+x.sourceSha+":"+s);return x}
 async pruefeVorTest({sourceSha,modus,testNummer,prestate}){const s=sha(sourceSha),m=mode(modus),candidate=k(prestate),st=await this.lade(s),exp=STUFEN[st.attempts.length];
  if(!exp)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_ALLE_TESTS_VERBRAUCHT");if(exp.modus!==m||exp.testNummer!==testNummer)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_REIHENFOLGE_BLOCKIERT:"+exp.modus+":"+exp.testNummer);
  if(st.attempts.length>0){const last=st.attempts[st.attempts.length-1];if(last.status!=="COMMITTED_BESTAETIGT")throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_VORSTUFE_NICHT_SAUBER")}
  if(st.attempts.length===1&&!gleich(st.attempts[0].prestate,candidate))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_STORE1_KEIN_EXAKTER_RUECKTRANSFER");
  if(st.attempts.length===2&&!gleich(st.attempts[0].prestate,candidate))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_RETRIEVE2_NICHT_AUSGANGSZUSTAND");
  if(st.attempts.length===3&&!gleich(st.attempts[1].prestate,candidate))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_STORE2_KEIN_EXAKTER_RUECKTRANSFER");
  return Object.freeze({bereit:true,sourceSha:s,modus:m,testNummer,prestate:candidate})}
 async beginneTest({sourceSha,modus,testNummer,transaktionsId,prestate,zeitMs}){if(!Number.isSafeInteger(zeitMs)||zeitMs<0)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_ZEIT_UNGUELTIG");txt(transaktionsId,"tx");const gate=await this.pruefeVorTest({sourceSha,modus,testNummer,prestate}),st=await this.lade(gate.sourceSha);
  const a=Object.freeze({schemaVersion:1,sequenzNummer:st.attempts.length+1,modus:gate.modus,testNummer,sourceSha:gate.sourceSha,transaktionsId,status:"TEST_GESTARTET_NOCH_NICHT_GESENDET",armiertAmMs:zeitMs,prestate:gate.prestate,sameIntentRetry:false});
  const n=Object.freeze({...st,attempts:Object.freeze([...st.attempts,a])});await this.ds.schreibeAtomarDurable(PFAD,JSON.stringify(n,null,2)+"\n","bank-item-transfer-live-start-"+a.sequenzNummer+"-"+zeitMs);return a}
 async markiereMoeglichenSend({sourceSha,transaktionsId,zeitMs}){if(!Number.isSafeInteger(zeitMs)||zeitMs<0)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_SEND_ZEIT_UNGUELTIG");const st=await this.lade(sourceSha);if(!st.attempts.length)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_KEIN_TEST");const last=st.attempts.at(-1);
  if(last.transaktionsId!==transaktionsId||last.status!=="TEST_GESTARTET_NOCH_NICHT_GESENDET")throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_SEND_BINDUNG_UNGUELTIG");const repl=Object.freeze({...last,status:"MOEGLICHER_SEND_ARMED",moeglicherSendAmMs:zeitMs,sameIntentRetry:false}),arr=[...st.attempts];arr[arr.length-1]=repl;
  await this.ds.schreibeAtomarDurable(PFAD,JSON.stringify(Object.freeze({...st,attempts:Object.freeze(arr)}),null,2)+"\n","bank-item-transfer-live-send-"+last.sequenzNummer+"-"+zeitMs);return repl}
 async finalisiere({sourceSha,transaktionsId,sauberCommitted,ergebnis,zeitMs}){if(!Number.isSafeInteger(zeitMs)||zeitMs<0)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_FINAL_ZEIT_UNGUELTIG");const st=await this.lade(sourceSha);if(!st.attempts.length)throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_KEIN_ARMED_TEST");const last=st.attempts.at(-1);
  if(last.transaktionsId!==transaktionsId||!["MOEGLICHER_SEND_ARMED","TEST_GESTARTET_NOCH_NICHT_GESENDET"].includes(last.status))throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_FINAL_BINDUNG_UNGUELTIG");if(sauberCommitted&&last.status!=="MOEGLICHER_SEND_ARMED")throw new Error("BANK_ITEM_TRANSFER_TESTLIMIT_COMMIT_OHNE_MOEGLICHEN_SEND");
  const repl=Object.freeze({...last,status:sauberCommitted?"COMMITTED_BESTAETIGT":"NICHT_SAUBER_ABGESCHLOSSEN",finalisiertAmMs:zeitMs,ergebnis:Object.freeze({...ergebnis}),sameIntentRetry:false}),arr=[...st.attempts];arr[arr.length-1]=repl;
  await this.ds.schreibeAtomarDurable(PFAD,JSON.stringify(Object.freeze({...st,attempts:Object.freeze(arr)}),null,2)+"\n","bank-item-transfer-live-final-"+last.sequenzNummer+"-"+zeitMs);return repl}
}
export const BANK_ITEM_TRANSFER_LIVE_TEST_SEQUENCE_PFAD=PFAD;
export const BANK_ITEM_TRANSFER_MAX_ECHTE_FUNKTIONSTESTS_PRO_FUNKTION=2;
export const BANK_ITEM_TRANSFER_MAX_GESAMT_WRITES=4;
