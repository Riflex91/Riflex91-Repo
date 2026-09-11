#!/usr/bin/env node
import fs from 'fs';
const BOT='bot.js';
let s=fs.readFileSync(BOT,'utf8');
if(s.includes('/* 2.14.23 merchant liveness + buff maintenance + terrain hardening */')){console.log('v2.14.23 patch already applied');process.exit(0);}
function rep(a,b,label){if(!s.includes(a))throw Error('missing '+label);s=s.replace(a,b);}
rep("Adventure Land • AiO Bot 2.14.22 | 2026-09-11","Adventure Land • AiO Bot 2.14.23 | 2026-09-11",'header version');
rep("var VERSION = '2.14.22';","var VERSION = '2.14.23';",'bot version');
rep("autoEconomyMaxBankSalesPerCycle: 4, autoEconomyRecoverySeconds: 20,","autoEconomyMaxBankSalesPerCycle: 4, autoEconomyRecoverySeconds: 20,\n    merchantBuffSupportEnabled: true, merchantBuffSkills: 'mluck', merchantBuffRequestLeadSeconds: 300,\n    merchantBuffRequestRepeatSeconds: 60, merchantBuffConfirmSeconds: 15,",'buff defaults');
rep("out.autoEconomyEnabled=out.autoEconomyEnabled!==false;out.autoEconomyMinFreeSlots=clamp(out.autoEconomyMinFreeSlots,2,20);out.autoEconomyEmergencyFreeSlots=clamp(out.autoEconomyEmergencyFreeSlots,1,out.autoEconomyMinFreeSlots);out.autoEconomyGoldReserve=clamp(out.autoEconomyGoldReserve,0,1000000000);out.autoEconomyHighValueNpc=clamp(out.autoEconomyHighValueNpc,0,1000000000);out.autoEconomyPlanSeconds=clamp(out.autoEconomyPlanSeconds,2,60);out.autoEconomyRequireProfitForCompound=out.autoEconomyRequireProfitForCompound!==false;out.autoEconomyRequireProfitForUpgrade=!!out.autoEconomyRequireProfitForUpgrade;out.autoEconomyMinProfitGold=clamp(out.autoEconomyMinProfitGold,0,1000000000);out.autoEconomyMinProfitPct=clamp(out.autoEconomyMinProfitPct,0,500);out.autoEconomyMaxBankSalesPerCycle=clamp(out.autoEconomyMaxBankSalesPerCycle,1,20);out.autoEconomyRecoverySeconds=clamp(out.autoEconomyRecoverySeconds,5,300);","out.autoEconomyEnabled=out.autoEconomyEnabled!==false;out.autoEconomyMinFreeSlots=clamp(out.autoEconomyMinFreeSlots,2,20);out.autoEconomyEmergencyFreeSlots=clamp(out.autoEconomyEmergencyFreeSlots,1,out.autoEconomyMinFreeSlots);out.autoEconomyGoldReserve=clamp(out.autoEconomyGoldReserve,0,1000000000);out.autoEconomyHighValueNpc=clamp(out.autoEconomyHighValueNpc,0,1000000000);out.autoEconomyPlanSeconds=clamp(out.autoEconomyPlanSeconds,2,60);out.autoEconomyRequireProfitForCompound=out.autoEconomyRequireProfitForCompound!==false;out.autoEconomyRequireProfitForUpgrade=!!out.autoEconomyRequireProfitForUpgrade;out.autoEconomyMinProfitGold=clamp(out.autoEconomyMinProfitGold,0,1000000000);out.autoEconomyMinProfitPct=clamp(out.autoEconomyMinProfitPct,0,500);out.autoEconomyMaxBankSalesPerCycle=clamp(out.autoEconomyMaxBankSalesPerCycle,1,20);out.autoEconomyRecoverySeconds=clamp(out.autoEconomyRecoverySeconds,5,300);out.merchantBuffSupportEnabled=out.merchantBuffSupportEnabled!==false;out.merchantBuffSkills=safeString(out.merchantBuffSkills||'mluck',240);out.merchantBuffRequestLeadSeconds=clamp(out.merchantBuffRequestLeadSeconds,30,1800);out.merchantBuffRequestRepeatSeconds=clamp(out.merchantBuffRequestRepeatSeconds,20,600);out.merchantBuffConfirmSeconds=clamp(out.merchantBuffConfirmSeconds,5,60);",'buff config normalization');

const marker='\n  try{FEATURE_CONTRACT.push(\'merchant-unified-auto-economy\',\'merchant-central-item-policy\',\'merchant-economic-compound-guard\',\'merchant-bank-withdraw-sell-state-machine\');}catch(e){}\n';
if(!s.includes(marker))throw Error('missing 2.14.22 tail marker');
const add=`

  /* 2.14.23 merchant liveness + buff maintenance + terrain hardening */
  S.bankStoreNoProgress21423=S.bankStoreNoProgress21423||{};
  S.buffRequests21423=S.buffRequests21423||{};
  S.buffPending21423=S.buffPending21423||null;

  function v21423StoreKey(name,level){return String(name||'')+'|'+(Number(level)||0);}
  function v21423StoreBlocked(name,level){var x=S.bankStoreNoProgress21423[v21423StoreKey(name,level)];if(!x)return false;if(clock()>=Number(x.until||0)){delete S.bankStoreNoProgress21423[v21423StoreKey(name,level)];return false;}return true;}
  var v21423AuditBase=audit;
  audit=function(kind,message,data,level){
    if(kind==='merchant_bank_cleanup_sync_wait'&&data&&data.item){var key=v21423StoreKey(data.item,data.level),until=clock()+300000;S.bankStoreNoProgress21423[key]={item:String(data.item),level:Number(data.level)||0,until:until,reason:'no-observable-bank-progress'};if(S.autoEconomy21422){S.autoEconomy21422.plan=null;S.autoEconomy21422.sig='';}v21423AuditBase('merchant_bank_store_quarantined','Banklagerung ohne beobachtbaren Fortschritt vorübergehend quarantänisiert',{item:data.item,level:Number(data.level)||0,until:until,source:'merchant_bank_cleanup_sync_wait'},'warning');}
    return v21423AuditBase(kind,message,data,level);
  };

  // Keep the proven legacy cleanup classifier, but never hammer the same identity
  // after a server ACK produced no inventory/bank postcondition. Try another safe
  // candidate; if none exists, yield to service/economy instead of looping forever.
  v2148BankCleanupCandidate=function(){
    if(character.ctype!=='merchant'||!C.merchantManageBank)return null;
    var items=character.items||[],i,it,policy;
    for(i=0;i<items.length;i++){
      it=items[i];if(!it||it.l||it.p||v21423StoreBlocked(it.name,it.level))continue;
      policy=v2147ItemPolicy(it.name);if(policy==='bank')return {index:i,item:it,explicit:true};
    }
    if(freeSlots()>Number(C.merchantInventoryReserve||5))return null;
    for(i=0;i<items.length;i++){
      it=items[i];if(!it||it.l||it.p||v21423StoreBlocked(it.name,it.level)||v2147ItemPolicy(it.name)!=='auto'||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))continue;
      var d=GD.items&&GD.items[it.name]||{},required=S.merchantPlan&&S.merchantPlan.farmOrder&&S.merchantPlan.farmOrder.item===it.name;
      if(required)continue;
      if(v273GroupUtility(it)<0||(!d.upgrade&&!d.compound&&!d.e&&!d.exchange&&!d.exchanges))return {index:i,item:it,explicit:false};
    }
    return null;
  };

  function v21423BuffSkills(){return csv(C.merchantBuffSkills).filter(function(id){var d=GD.skills&&GD.skills[id];return !!(id&&d&&!d.hostile);}).slice(0,8);}
  function v21423BuffState(id){var d=GD.skills&&GD.skills[id]||{},cond=String(d.condition||id),x=character.s&&character.s[cond];return {skill:id,condition:cond,active:!!x,ms:x&&isFinite(Number(x.ms))?Math.max(0,Number(x.ms)):null,from:x&&x.f||''};}
  function v21423BuffSnapshot(){var o={};v21423BuffSkills().forEach(function(id){o[id]=v21423BuffState(id);});return o;}
  function v21423FarmerBuffSignalTick(){
    if(character.ctype==='merchant'||!C.merchantBuffSupportEnabled||!S.running||character.rip)return false;
    var mn=merchantName();if(!mn||typeof send_cm!=='function')return false;var lead=Number(C.merchantBuffRequestLeadSeconds||300)*1000,needs=[];
    v21423BuffSkills().forEach(function(id){var b=v21423BuffState(id);if(!b.active||b.ms==null||b.ms<=lead)needs.push({skill:id,condition:b.condition,remainingMs:b.ms});});
    if(!needs.length)return false;var now=clock();if(now<Number(S.times.buffRequest21423||0))return false;S.times.buffRequest21423=now+Number(C.merchantBuffRequestRepeatSeconds||60)*1000;
    try{send_cm(mn,{type:'aio27-buff-request',from:me,needs:needs,map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),at:now,version:VERSION});audit('buff_request','Farmer fordert Merchant-Buff frühzeitig an',{merchant:mn,needs:needs,leadMs:lead});}catch(e){audit('buff_request_error','Buff-Anforderung konnte nicht gesendet werden',{merchant:mn,error:reason(e)},'warning');}
    return false;
  }
  var v21423ReportBase=report;
  report=function(withRole){var r=v21423ReportBase(withRole);r.buffs=v21423BuffSnapshot();return r;};
  var v21423CMBase=on_cm;
  on_cm=function(name,data){try{v21423CMBase(name,data);}catch(e){}if(character.ctype==='merchant'&&C.merchantBuffSupportEnabled&&accountCharacterName(name)&&data&&data.type==='aio27-buff-request'&&data.from===name){S.buffRequests21423[name]={name:name,needs:Array.isArray(data.needs)?data.needs.slice(0,8):[],map:String(data.map||''),x:Number(data.x)||0,y:Number(data.y)||0,at:clock()};audit('merchant_buff_request','Merchant hat Buff-Anforderung erhalten',{farmer:name,needs:S.buffRequests21423[name].needs});}};

  function v21423ReportedBuff(r,id){var b=r&&r.buffs&&r.buffs[id];return b&&typeof b==='object'?b:null;}
  function v21423BuffConfirmTick(){var p=S.buffPending21423;if(!p)return false;var r=peerReport(p.name),b=v21423ReportedBuff(r,p.skill),now=clock();if(b&&b.active&&b.ms!=null&&Number(b.ms)>Number(p.beforeMs||0)+30000){audit('merchant_buff_confirmed','Merchant-Buff beim Farmer bestätigt',{farmer:p.name,skill:p.skill,remainingMs:b.ms});delete S.buffRequests21423[p.name];S.buffPending21423=null;return false;}if(now-Number(p.at||now)>Number(C.merchantBuffConfirmSeconds||15)*1000){audit('merchant_buff_unconfirmed','Merchant-Buff noch nicht durch Farmer-Report bestätigt; kontrollierter späterer Retry',{farmer:p.name,skill:p.skill},'warning');S.buffPending21423=null;S.times['buffRetry:'+p.name+':'+p.skill]=now+30000;return false;}return true;}
  function v21423NextBuffRequest(){var now=clock(),rows=[];Object.keys(S.buffRequests21423||{}).forEach(function(name){var q=S.buffRequests21423[name];if(!q||now-Number(q.at||0)>600000){delete S.buffRequests21423[name];return;}var r=peerReport(name);if(!r||r.rip||r.active===false)return;(q.needs||[]).forEach(function(n){var id=String(n&&n.skill||''),d=GD.skills&&GD.skills[id];if(!d||d.hostile||now<Number(S.times['buffRetry:'+name+':'+id]||0))return;var b=v21423ReportedBuff(r,id),lead=Number(C.merchantBuffRequestLeadSeconds||300)*1000;if(b&&b.active&&b.ms!=null&&Number(b.ms)>lead){return;}rows.push({name:name,skill:id,r:r,remaining:b&&b.ms!=null?Number(b.ms):Number(n.remainingMs)||0,requestedAt:Number(q.at)||0});});});rows.sort(function(a,b){return Number(a.remaining||0)-Number(b.remaining||0)||a.requestedAt-b.requestedAt||a.name.localeCompare(b.name);});return rows[0]||null;}
  function v21423BuffServiceTick(){
    if(character.ctype!=='merchant'||!C.merchantBuffSupportEnabled||character.rip)return false;if(v21423BuffConfirmTick())return true;
    var q=v21423NextBuffRequest();if(!q)return false;try{if(v21417EconomicFlightKind(character.q))return false;}catch(e){}if(S.merchantBankRetrieve2149||S.autoEconomy21422&&S.autoEconomy21422.tx)return false;
    var target=localPlayer(q.name),d=GD.skills&&GD.skills[q.skill]||{},range=Math.max(40,Number(d.range)||320);
    if(!target||target.map!==character.map||dist(character,target)>range){if(character.moving||S.moveInFlight)return true;var dest={map:q.r.map,x:Number(q.r.x)||0,y:Number(q.r.y)||0};S.status='Buff-Service · '+q.skill+' → '+q.name;S.mode='Merchant · Buff';return moveToGoal(dest,'Merchant Buff-Service '+q.skill+' → '+q.name,{kind:'merchant-buff-service',tolerance:Math.max(35,Math.min(120,range*.55)),forceAfter:12000})||true;}
    if(character.moving||S.moveInFlight)return true;var before=v21423ReportedBuff(q.r,q.skill),beforeMs=before&&before.ms!=null?Number(before.ms):0;
    if(!skillCanUse(q.skill))return true;var started=useSkillSafe(q.skill,target,null,false);if(started){S.buffPending21423={name:q.name,skill:q.skill,beforeMs:beforeMs,at:clock()};audit('merchant_buff_cast','Merchant-Buff ausgelöst; Farmer-Bestätigung wird abgewartet',{farmer:q.name,skill:q.skill,beforeMs:beforeMs});return true;}return false;
  }
  var v21423TickBase=tick;
  tick=function(){v21423FarmerBuffSignalTick();return v21423TickBase();};
  var v21423MerchantBase=merchantTick;
  merchantTick=function(){if(character.ctype==='merchant'&&v21423BuffServiceTick())return true;return v21423MerchantBase();};

  // Always ship compact real G.geometry collision lines. Tile sprites remain the
  // preferred background, but the dashboard no longer becomes blank if those
  // cross-origin images fail or a terrain payload is omitted for size.
  var v21423TerrainBase=v21412TerrainPayload;
  v21412TerrainPayload=function(){var out=v21423TerrainBase(),mapId=String(character.map||''),geo=GD.geometry&&GD.geometry[mapId];if(!geo)return out;var v={x:v21414CompactLines(geo.x_lines,420),y:v21414CompactLines(geo.y_lines,420)};if(!out)out={map:mapId,omitted:true,bytes:0,source:'Adventure Land G.geometry'};out.v=v;out.fallback=out.omitted?'collision-lines':'tiles+collision-lines';return out;};
  var v21423DashboardBase=dashboardPayload;
  dashboardPayload=function(){var d=v21423DashboardBase();d.version=Math.max(11,Number(d.version)||0);d.mapBounds=dashboardMapBounds();d.mapVisual=v282MapVisual();try{d.terrain=(typeof v21414TerrainOwner!=='function'||v21414TerrainOwner(String(character.map||''))===me)?v21412TerrainPayload():null;}catch(e){d.terrain=v21412TerrainPayload();}d.buffs=v21423BuffSnapshot();return d;};

  try{FEATURE_CONTRACT.push('merchant-bank-store-no-progress-quarantine','merchant-proactive-buff-service','farmer-buff-renewal-request','dashboard-always-vector-terrain-fallback');}catch(e){}
  audit('feature_contract','2.14.23 Merchant-Liveness + proaktive Buff-Erneuerung + robuste reale Gruppenkarte geprüft',{features:FEATURE_CONTRACT,buffSkills:v21423BuffSkills()});
`;
s=s.replace(marker,marker+add);
fs.writeFileSync(BOT,s);

for(const p of ['version.json','cloudflare-dashboard/package.json','cloudflare-dashboard/dashboard.html','cloudflare-dashboard/src/worker.js']){
  let x=fs.readFileSync(p,'utf8');x=x.replaceAll('2.14.22','2.14.23');fs.writeFileSync(p,x);
}
console.log('Applied v2.14.23 Merchant liveness, buffs and terrain hardening');
