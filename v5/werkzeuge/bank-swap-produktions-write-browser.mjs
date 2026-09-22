import {
  beobachteBankSwapRohReadOnly,
  validiereBankSwapMountBeobachtung,
} from "./bank-swap-produktions-browser.mjs";

const ACTION="AL-ACTION-BANK-SWAP";
const RECOVERY="AL-RECOVERY-BANK-SWAP";
const VERIFIER="AL-VERIFIER-BANK-SWAP";

function txt(v,max=192){return typeof v==="string"&&v.trim().length>0&&v.length<=max}
function hex64(v){return typeof v==="string"&&/^[a-f0-9]{64}$/i.test(v)}
function validRequest(a){
 return a&&typeof a==="object"&&/^items[0-9]+$/.test(a.pack)
  &&Number.isInteger(a.a)&&a.a>=0&&a.a<=41&&Number.isInteger(a.b)&&a.b>=0&&a.b<=41&&a.a!==a.b
  &&txt(a.accountId)&&txt(a.characterId)&&txt(a.sessionId)&&txt(a.serverRegion,32)&&txt(a.serverIdentifier,32)
  &&txt(a.erwartetesItemAName)&&txt(a.erwartetesItemBName)&&a.erwartetesItemAName!==a.erwartetesItemBName
  &&hex64(a.erwartetesItemAFingerprint)&&hex64(a.erwartetesItemBFingerprint)
  &&hex64(a.erwarteterPackRestFingerprint)&&hex64(a.erwarteterInventoryFingerprint)&&hex64(a.erwarteterFingerprint)
  &&Number.isSafeInteger(a.erwartetesCharacterGold)&&a.erwartetesCharacterGold>=0
  &&Number.isSafeInteger(a.erwartetesBankGold)&&a.erwartetesBankGold>=0;
}

export class ProduktionsCdpBankSwapAdapter {
 constructor(session,contextId,{vorMoeglichemSend=null}={}){
  if(!session||typeof session.evaluate!=="function"||!Number.isInteger(contextId))throw new Error("BANK_SWAP_WRITE_CDP_KONTEXT_UNGUELTIG");
  if(vorMoeglichemSend!==null&&typeof vorMoeglichemSend!=="function")throw new Error("BANK_SWAP_WRITE_SEND_GATE_UNGUELTIG");
  this.adapterId="v5-production-cdp-bank-swap-two-slot-once";this.actionContractId=ACTION;this.recoveryContractId=RECOVERY;this.verifierId=VERIFIER;
  this.session=session;this.contextId=contextId;this.vorMoeglichemSend=vorMoeglichemSend;this.adapterAufrufe=0;this.gameWrites=0;this.moeglicherSend=false;
 }
 async sende(_freigabe,a){
  if(this.adapterAufrufe!==0)throw new Error("BANK_SWAP_WRITE_MEHR_ALS_EIN_ADAPTER_AUFRUF");
  this.adapterAufrufe+=1;
  if(!validRequest(a))return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_SWAP_WRITE_ADAPTER_ANFRAGE_DRIFT"});
  let snap;
  try{
   snap=validiereBankSwapMountBeobachtung(
    await beobachteBankSwapRohReadOnly(this.session,this.contextId),
    Object.freeze({accountId:a.accountId,charakterName:a.characterId,sessionId:a.sessionId,serverRegion:a.serverRegion,serverKennung:a.serverIdentifier,ctype:"merchant"}),
    Date.now(),
    Object.freeze({pack:a.pack,a:a.a,b:a.b}),
   );
  }catch{return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_SWAP_WRITE_FINAL_PREFLIGHT_BLOCKIERT"})}
  if(snap.kandidat.itemA.name!==a.erwartetesItemAName||snap.kandidat.itemB.name!==a.erwartetesItemBName
    ||snap.kandidat.itemA.fingerprint!==a.erwartetesItemAFingerprint||snap.kandidat.itemB.fingerprint!==a.erwartetesItemBFingerprint
    ||snap.kandidat.packRestFingerprint!==a.erwarteterPackRestFingerprint||snap.inventoryFingerprint!==a.erwarteterInventoryFingerprint
    ||snap.characterGold!==a.erwartetesCharacterGold||snap.bankGold!==a.erwartetesBankGold||snap.fingerprint!==a.erwarteterFingerprint){
    return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_SWAP_WRITE_FINAL_PRESTATE_DRIFT"});
  }

  const expected={accountId:a.accountId,characterName:a.characterId,sessionId:a.sessionId,serverRegion:a.serverRegion,serverIdentifier:a.serverIdentifier,
    pack:a.pack,a:a.a,b:a.b,itemA:a.erwartetesItemAName,itemB:a.erwartetesItemBName,characterGold:a.erwartetesCharacterGold,bankGold:a.erwartetesBankGold};
  const expr=[
   "(async()=>{",
   "const root=globalThis;const E="+JSON.stringify(expected)+";",
   "if(typeof root.call_code_function_f!=='function')return {sent:false,reason:'CODE_BRIDGE_KONTEXT_FEHLT'};",
   "const check=()=>{const c=root.character;if(!c)return 'CHARACTER_FEHLT';",
   "let account='';try{account=String(root.user_id||c.owner||'')}catch{};if(account!==E.accountId)return 'ACCOUNT_DRIFT';",
   "if(String(c.name||'')!==E.characterName)return 'CHARACTER_DRIFT';if(String(c.id||'')!==E.sessionId)return 'SESSION_DRIFT';",
   "const region=String(root.server_region||root.server?.region||'');const sid=String(root.server_identifier||root.server?.id||'');if(region!==E.serverRegion||sid!==E.serverIdentifier)return 'SERVER_DRIFT';",
   "if(String(c.ctype||c.type||'').toLowerCase()!=='merchant')return 'MERCHANT_ERFORDERLICH';if(c.rip||c.moving||c.target!=null)return 'CHARACTER_NICHT_IDLE';",
   "if(c.q&&typeof c.q==='object'&&Object.keys(c.q).length)return 'QUEUE_AKTIV';",
   "let alt=false;try{const x=root.AIO_V3&&root.AIO_V3.__runtime;const s=x&&typeof x.status==='function'?x.status():null;if(x&&(x.timer||(s&&s.running===true)))alt=true}catch{alt=true}",
   "try{const x=root.AIO_V4||root.V4Runtime;const s=x&&typeof x.status==='function'?x.status():null;if(s&&(s.running===true||s.aktivFreigegeben===true))alt=true}catch{alt=true}if(alt)return 'ALTERNATIVE_RUNTIME_AKTIV';",
   "const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;if(!bank)return 'BANK_NICHT_GEMOUNTET';",
   "let catalog={};try{catalog=root.bank_packs||root.parent?.bank_packs||{}}catch{};if(!catalog[E.pack]||String(catalog[E.pack][0]||'')!==String(c.map||''))return 'PACK_MOUNT_DRIFT';",
   "const p=bank[E.pack];if(!Array.isArray(p)||E.a<0||E.a>41||E.b<0||E.b>41||E.a===E.b)return 'SLOT_DRIFT';",
   "const ia=p[E.a],ib=p[E.b];if(!ia||!ib||ia.name==='placeholder'||ib.name==='placeholder')return 'ITEM_FEHLT';",
   "if(String(ia.name)!==E.itemA||String(ib.name)!==E.itemB||String(ia.name)===String(ib.name))return 'ITEM_DRIFT';",
   "if(Number(c.gold)!==E.characterGold||Number(bank.gold)!==E.bankGold)return 'GOLD_DRIFT';return null};",
   "let blocker=check();if(blocker)return {sent:false,reason:blocker};",
   "const rw=()=>{try{const el=root.document&&root.document.getElementById&&root.document.getElementById('maincode');return el&&el.contentWindow?el.contentWindow:null}catch{return null}};",
   "let runner=rw();const runnerWarAktiv=root.code_active===true&&runner&&typeof runner.bank_swap==='function';let runnerGestartet=false;",
   "if(!runnerWarAktiv){if(!(root.code_run===true&&root.code_active!==true)){try{root.call_code_function_f('eval','void 0');runnerGestartet=true}catch(e){return {sent:false,reason:'CODE_RUNNER_BOOTSTRAP_FEHLER',detail:String(e?.message||e).slice(0,160)}}}",
   "const deadline=Date.now()+5000;while(Date.now()<deadline){runner=rw();if(root.code_active===true&&runner&&typeof runner.bank_swap==='function')break;await new Promise(r=>setTimeout(r,50));}}",
   "runner=rw();if(root.code_active!==true||!runner||typeof runner.bank_swap!=='function')return {sent:false,reason:'CODE_RUNNER_BANK_SWAP_CAPABILITY_FEHLT',runnerGestartet};",
   "blocker=check();if(blocker)return {sent:false,reason:blocker,runnerGestartet};",
   "try{const result=await Promise.resolve(runner.bank_swap(E.pack,E.a,E.b));return {sent:true,runnerGestartet,runnerWarAktiv,result:result==null?null:result}}",
   "catch(e){return {sent:true,runnerGestartet,runnerWarAktiv,error:String(e?.reason||e?.message||e).slice(0,240)}}",
   "})()"
  ].join("\n");
  try{
   if(this.vorMoeglichemSend!==null){
    try{await this.vorMoeglichemSend(Object.freeze({...a}))}
    catch{return Object.freeze({art:"NICHT_GESENDET",grund:"BANK_SWAP_WRITE_SEND_GATE_BLOCKIERT"})}
   }
   this.moeglicherSend=true;
   const result=await this.session.evaluate(expr,this.contextId,{userGesture:true});
   if(!result?.sent){this.moeglicherSend=false;return Object.freeze({art:"NICHT_GESENDET",grund:String(result?.reason||"BANK_SWAP_WRITE_PRESTATE_DRIFT")})}
   this.gameWrites=1;
   return Object.freeze({art:"SERVER_ERGEBNIS",korrelationId:"V5-BANK-SWAP-TWO-SLOT",ergebnis:result});
  }catch{return Object.freeze({art:"UNBEKANNT",grund:"DISCONNECT_NACH_MOEGLICHEM_SEND",korrelationId:null})}
 }
}
