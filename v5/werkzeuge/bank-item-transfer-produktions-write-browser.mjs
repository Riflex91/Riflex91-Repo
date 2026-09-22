import {
  beobachteBankItemTransferRohReadOnly,
  validiereBankItemTransferExplizitenKandidaten,
} from "./bank-item-transfer-produktions-browser.mjs";

function mode(v){const x=String(v||"").toUpperCase();if(!["RETRIEVE","STORE"].includes(x))throw new Error("BANK_ITEM_TRANSFER_WRITE_MODUS_UNGUELTIG");return x}
function txt(v,max=192){return typeof v==="string"&&v.trim().length>0&&v.length<=max}
function hex64(v){return typeof v==="string"&&/^[a-f0-9]{64}$/i.test(v)}
function valid(a,m){
 return a&&typeof a==="object"&&a.modus===m&&/^items[0-9]+$/.test(a.pack)
  &&Number.isInteger(a.bankSlot)&&a.bankSlot>=0&&a.bankSlot<=41
  &&Number.isInteger(a.inventorySlot)&&a.inventorySlot>=0&&a.inventorySlot<=63
  &&txt(a.accountId)&&txt(a.characterId)&&txt(a.sessionId)&&txt(a.serverRegion,32)&&txt(a.serverIdentifier,32)
  &&txt(a.erwartetesItemName)&&hex64(a.erwartetesItemFingerprint)&&hex64(a.erwarteterPackRestFingerprint)
  &&hex64(a.erwarteterInventoryRestFingerprint)&&hex64(a.erwarteterFingerprint)
  &&Number.isSafeInteger(a.erwartetesCharacterGold)&&a.erwartetesCharacterGold>=0
  &&Number.isSafeInteger(a.erwartetesBankGold)&&a.erwartetesBankGold>=0;
}
export class ProduktionsCdpBankItemTransferAdapter {
 constructor(modus,session,contextId,{vorMoeglichemSend=null}={}){
  this.modus=mode(modus);if(!session||typeof session.evaluate!=="function"||!Number.isInteger(contextId))throw new Error("BANK_ITEM_TRANSFER_WRITE_CDP_KONTEXT_UNGUELTIG");
  if(vorMoeglichemSend!==null&&typeof vorMoeglichemSend!=="function")throw new Error("BANK_ITEM_TRANSFER_WRITE_SEND_GATE_UNGUELTIG");
  const k=this.modus;this.adapterId="v5-production-cdp-bank-"+k.toLowerCase()+"-explicit-once";this.actionContractId="AL-ACTION-BANK-"+k;this.recoveryContractId="AL-RECOVERY-BANK-"+k;this.verifierId="AL-VERIFIER-BANK-"+k;
  this.session=session;this.contextId=contextId;this.vorMoeglichemSend=vorMoeglichemSend;this.adapterAufrufe=0;this.gameWrites=0;this.moeglicherSend=false;
 }
 async sende(_freigabe,a){
  if(this.adapterAufrufe!==0)throw new Error("BANK_"+this.modus+"_WRITE_MEHR_ALS_EIN_ADAPTER_AUFRUF");this.adapterAufrufe+=1;
  if(!valid(a,this.modus))return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_"+this.modus+"_WRITE_ADAPTER_ANFRAGE_DRIFT"});
  let snap;try{snap=validiereBankItemTransferExplizitenKandidaten(await beobachteBankItemTransferRohReadOnly(this.session,this.contextId),
    Object.freeze({accountId:a.accountId,charakterName:a.characterId,sessionId:a.sessionId,serverRegion:a.serverRegion,serverKennung:a.serverIdentifier,ctype:"merchant"}),Date.now(),this.modus,
    Object.freeze({pack:a.pack,bankSlot:a.bankSlot,inventorySlot:a.inventorySlot,item:Object.freeze({name:a.erwartetesItemName,fingerprint:a.erwartetesItemFingerprint})}));
  }catch{return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_"+this.modus+"_WRITE_FINAL_PREFLIGHT_BLOCKIERT"})}
  const k=snap.expliziterKandidat;
  if(k.packRestFingerprint!==a.erwarteterPackRestFingerprint||k.inventoryRestFingerprint!==a.erwarteterInventoryRestFingerprint||snap.characterGold!==a.erwartetesCharacterGold||snap.bankGold!==a.erwartetesBankGold||snap.fingerprint!==a.erwarteterFingerprint)
    return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_"+this.modus+"_WRITE_FINAL_PRESTATE_DRIFT"});
  const E={modus:this.modus,accountId:a.accountId,characterName:a.characterId,sessionId:a.sessionId,serverRegion:a.serverRegion,serverIdentifier:a.serverIdentifier,pack:a.pack,bankSlot:a.bankSlot,inventorySlot:a.inventorySlot,itemName:a.erwartetesItemName,characterGold:a.erwartetesCharacterGold,bankGold:a.erwartetesBankGold};
  const expr=[
   "(async()=>{const root=globalThis;const E="+JSON.stringify(E)+";",
   "if(typeof root.call_code_function_f!=='function')return {sent:false,reason:'CODE_BRIDGE_KONTEXT_FEHLT'};",
   "const check=()=>{const c=root.character;if(!c)return 'CHARACTER_FEHLT';let account='';try{account=String(root.user_id||c.owner||'')}catch{};if(account!==E.accountId)return 'ACCOUNT_DRIFT';",
   "if(String(c.name||'')!==E.characterName)return 'CHARACTER_DRIFT';if(String(c.id||'')!==E.sessionId)return 'SESSION_DRIFT';const region=String(root.server_region||root.server?.region||'');const sid=String(root.server_identifier||root.server?.id||'');",
   "if(region!==E.serverRegion||sid!==E.serverIdentifier)return 'SERVER_DRIFT';if(String(c.ctype||c.type||'').toLowerCase()!=='merchant')return 'MERCHANT_ERFORDERLICH';if(c.rip||c.moving||c.target!=null)return 'CHARACTER_NICHT_IDLE';if(c.q&&typeof c.q==='object'&&Object.keys(c.q).length)return 'QUEUE_AKTIV';",
   "let alt=false;try{const x=root.AIO_V3&&root.AIO_V3.__runtime;const s=x&&typeof x.status==='function'?x.status():null;if(x&&(x.timer||(s&&s.running===true)))alt=true}catch{alt=true}try{const x=root.AIO_V4||root.V4Runtime;const s=x&&typeof x.status==='function'?x.status():null;if(s&&(s.running===true||s.aktivFreigegeben===true))alt=true}catch{alt=true}if(alt)return 'ALTERNATIVE_RUNTIME_AKTIV';",
   "const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;if(!bank)return 'BANK_NICHT_GEMOUNTET';let catalog={};try{catalog=root.bank_packs||root.parent?.bank_packs||{}}catch{};if(!catalog[E.pack]||String(catalog[E.pack][0]||'')!==String(c.map||''))return 'PACK_MOUNT_DRIFT';",
   "const p=bank[E.pack];if(!Array.isArray(p)||E.bankSlot<0||E.bankSlot>41||E.inventorySlot<0||E.inventorySlot>=Number(c.isize||c.items?.length||0))return 'SLOT_DRIFT';const bi=p[E.bankSlot]||null,ii=c.items?.[E.inventorySlot]||null;",
   "if(E.modus==='RETRIEVE'){if(!bi||String(bi.name)!==E.itemName||ii)return 'RETRIEVE_PRESTATE_DRIFT';if(bi.name==='placeholder')return 'PLACEHOLDER_BLOCKIERT'}else{if(!ii||String(ii.name)!==E.itemName||bi)return 'STORE_PRESTATE_DRIFT';if(ii.name==='placeholder'||ii.b===true||Object.prototype.hasOwnProperty.call(ii,'m')||Object.prototype.hasOwnProperty.call(ii,'v'))return 'STORE_METADATEN_BLOCKIERT'}",
   "if(Number(c.gold)!==E.characterGold||Number(bank.gold)!==E.bankGold)return 'GOLD_DRIFT';return null};let blocker=check();if(blocker)return {sent:false,reason:blocker};",
   "const rw=()=>{try{const el=root.document&&root.document.getElementById&&root.document.getElementById('maincode');return el&&el.contentWindow?el.contentWindow:null}catch{return null}};let runner=rw();const fn=E.modus==='RETRIEVE'?'bank_retrieve':'bank_store';let runnerGestartet=false;",
   "if(!(root.code_active===true&&runner&&typeof runner[fn]==='function')){if(!(root.code_run===true&&root.code_active!==true)){try{root.call_code_function_f('eval','void 0');runnerGestartet=true}catch(e){return {sent:false,reason:'CODE_RUNNER_BOOTSTRAP_FEHLER',detail:String(e?.message||e).slice(0,160)}}}const deadline=Date.now()+5000;while(Date.now()<deadline){runner=rw();if(root.code_active===true&&runner&&typeof runner[fn]==='function')break;await new Promise(r=>setTimeout(r,50));}}",
   "runner=rw();if(root.code_active!==true||!runner||typeof runner[fn]!=='function')return {sent:false,reason:'CODE_RUNNER_CAPABILITY_FEHLT',runnerGestartet};blocker=check();if(blocker)return {sent:false,reason:blocker,runnerGestartet};",
   "try{const result=E.modus==='RETRIEVE'?await Promise.resolve(runner.bank_retrieve(E.pack,E.bankSlot,E.inventorySlot)):await Promise.resolve(runner.bank_store(E.inventorySlot,E.pack,E.bankSlot));return {sent:true,runnerGestartet,result:result==null?null:result}}",
   "catch(e){return {sent:true,runnerGestartet,error:String(e?.reason||e?.message||e).slice(0,240)}}})()"
  ].join("\n");
  try{if(this.vorMoeglichemSend!==null){try{await this.vorMoeglichemSend(Object.freeze({...a}))}catch{return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_"+this.modus+"_WRITE_SEND_GATE_BLOCKIERT"})}}
   this.moeglicherSend=true;const result=await this.session.evaluate(expr,this.contextId,{userGesture:true});if(!result?.sent){this.moeglicherSend=false;return Object.freeze({art:"NICHT_GESENDET",grund:String(result?.reason||"BANK_ITEM_TRANSFER_WRITE_PRESTATE_DRIFT")})}
   this.gameWrites=1;return Object.freeze({art:"SERVER_ERGEBNIS",korrelationId:"V5-BANK-"+this.modus+"-EXPLICIT",ergebnis:result});
  }catch{return Object.freeze({art:"UNBEKANNT",grund:"DISCONNECT_NACH_MOEGLICHEM_SEND",korrelationId:null})}
 }
}
