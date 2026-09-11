#!/usr/bin/env node
import fs from 'fs';

const botPath='bot.js';
let bot=fs.readFileSync(botPath,'utf8');
if(bot.includes('/* 2.14.22 unified auto-economy manager */')){
  console.log('v2.14.22 economy manager already applied');
  process.exit(0);
}

function mustReplace(src,from,to,label){
  if(!src.includes(from)) throw new Error('missing patch anchor: '+label);
  return src.replace(from,to);
}

bot=mustReplace(bot,"/* Adventure Land • AiO Bot 2.14.21 | 2026-09-11","/* Adventure Land • AiO Bot 2.14.22 | 2026-09-11",'header version');
bot=mustReplace(bot,"var VERSION = '2.14.21';","var VERSION = '2.14.22';",'VERSION');

bot=mustReplace(bot,
"    merchantItemActions: {},\n    showSettingHelp: true,",
"    merchantItemActions: {},\n    merchantItemRules: {},\n    autoEconomyEnabled: true, autoEconomyMinFreeSlots: 6, autoEconomyEmergencyFreeSlots: 2,\n    autoEconomyGoldReserve: 0, autoEconomyHighValueNpc: 250000, autoEconomyPlanSeconds: 5,\n    autoEconomyRequireProfitForCompound: true, autoEconomyRequireProfitForUpgrade: false,\n    autoEconomyMinProfitGold: 0, autoEconomyMinProfitPct: 0,\n    autoEconomyMaxBankSalesPerCycle: 4, autoEconomyRecoverySeconds: 20,\n    showSettingHelp: true,",
'new defaults');

bot=mustReplace(bot,
"    if(!out.merchantItemActions||typeof out.merchantItemActions!=='object'||Array.isArray(out.merchantItemActions))out.merchantItemActions={};\n    else{var itemActions2147={};Object.keys(out.merchantItemActions).slice(0,2000).forEach(function(name){var p=String(out.merchantItemActions[name]||'auto');if(['keep','bank','sell','exchange'].indexOf(p)>=0)itemActions2147[safeString(name,120)]=p;});out.merchantItemActions=itemActions2147;}",
"    if(!out.merchantItemActions||typeof out.merchantItemActions!=='object'||Array.isArray(out.merchantItemActions))out.merchantItemActions={};\n    else{var itemActions2147={};Object.keys(out.merchantItemActions).slice(0,2000).forEach(function(name){var p=String(out.merchantItemActions[name]||'auto').toLowerCase();if(['auto','keep','bank','sell','upgrade','compound','exchange','recycle','discard','hold_for_merchant'].indexOf(p)>=0&&p!=='auto')itemActions2147[safeString(name,120)]=p;});out.merchantItemActions=itemActions2147;}\n    if(!out.merchantItemRules||typeof out.merchantItemRules!=='object'||Array.isArray(out.merchantItemRules))out.merchantItemRules={};\n    else{var itemRules21422={};Object.keys(out.merchantItemRules).slice(0,2000).forEach(function(name){var r=out.merchantItemRules[name];if(!r||typeof r!=='object'||Array.isArray(r))return;var a=String(r.action||'auto').toLowerCase();if(['auto','keep','bank','sell','upgrade','compound','exchange','recycle','discard','hold_for_merchant'].indexOf(a)<0)a='auto';itemRules21422[safeString(name,120)]={action:a,minKeep:clamp(r.minKeep,0,99999),targetLevel:clamp(r.targetLevel,0,20),requireProfit:r.requireProfit!==false};});out.merchantItemRules=itemRules21422;}\n    out.autoEconomyEnabled=out.autoEconomyEnabled!==false;out.autoEconomyMinFreeSlots=clamp(out.autoEconomyMinFreeSlots,2,20);out.autoEconomyEmergencyFreeSlots=clamp(out.autoEconomyEmergencyFreeSlots,1,out.autoEconomyMinFreeSlots);out.autoEconomyGoldReserve=clamp(out.autoEconomyGoldReserve,0,1000000000);out.autoEconomyHighValueNpc=clamp(out.autoEconomyHighValueNpc,0,1000000000);out.autoEconomyPlanSeconds=clamp(out.autoEconomyPlanSeconds,2,60);out.autoEconomyRequireProfitForCompound=out.autoEconomyRequireProfitForCompound!==false;out.autoEconomyRequireProfitForUpgrade=!!out.autoEconomyRequireProfitForUpgrade;out.autoEconomyMinProfitGold=clamp(out.autoEconomyMinProfitGold,0,1000000000);out.autoEconomyMinProfitPct=clamp(out.autoEconomyMinProfitPct,0,500);out.autoEconomyMaxBankSalesPerCycle=clamp(out.autoEconomyMaxBankSalesPerCycle,1,20);out.autoEconomyRecoverySeconds=clamp(out.autoEconomyRecoverySeconds,5,300);",
'config sanitizer');

bot=bot.replace("var V2147_ITEM_POLICIES=['auto','keep','bank','sell','exchange'];","var V2147_ITEM_POLICIES=['auto','keep','bank','sell','upgrade','compound','exchange','recycle','discard','hold_for_merchant'];");

const marker='\n})();';
const pos=bot.lastIndexOf(marker);
if(pos<0) throw new Error('cannot find IIFE end');

const block=String.raw`

  /* 2.14.22 unified auto-economy manager */
  var V21422_ACTIONS=['KEEP','SELL','BANK','UPGRADE','COMPOUND','EXCHANGE','RECYCLE','DISCARD','HOLD_FOR_MERCHANT'];
  S.autoEconomy21422=S.autoEconomy21422||{state:'IDLE',tx:null,plan:null,planAt:0,sig:'',recoverUntil:0,bankSales:0,lastLog:{}};

  function v21422NormAction(v){v=String(v||'auto').trim().toUpperCase();return V21422_ACTIONS.indexOf(v)>=0?v:'AUTO';}
  function v21422Rule(name){
    var rich=C.merchantItemRules&&C.merchantItemRules[name],legacy=C.merchantItemActions&&C.merchantItemActions[name];
    if(rich&&typeof rich==='object')return {action:v21422NormAction(rich.action),minKeep:Math.max(0,Number(rich.minKeep)||0),targetLevel:Math.max(0,Number(rich.targetLevel)||0),requireProfit:rich.requireProfit!==false,explicit:true};
    if(legacy)return {action:v21422NormAction(legacy),minKeep:0,targetLevel:0,requireProfit:true,explicit:true};
    return {action:'AUTO',minKeep:0,targetLevel:0,requireProfit:true,explicit:false};
  }
  function v21422Category(it){var d=GD.items&&GD.items[it&&it.name]||{};if(!it)return 'Unknown';if(/^c?scroll[0-4]$/.test(it.name))return 'Scrolls';if(it.name===C.hpot||it.name===C.mpot)return 'Potions';if(d.quest||d.event)return 'Event Items';if(d.e||d.exchange||d.exchanges)return 'Exchange Items';if(d.compound)return 'Compound Gear';if(d.upgrade)return 'Upgrade Gear';if(v273EquipSlotsForItem&&v273EquipSlotsForItem(it.name).length)return 'Gear';if(d.type==='material'||d.type==='misc')return 'Materials';return 'Misc';}
  function v21422EquippedIdentity(it){if(!it)return false;var slots=character.slots||{};return Object.keys(slots).some(function(k){var s=slots[k];return s&&s.name===it.name&&(Number(s.level)||0)===(Number(it.level)||0)&&String(s.p||'')===String(it.p||'');});}
  function v21422Protected(it){
    if(!it||!it.name)return 'unknown-item';
    var d=GD.items&&GD.items[it.name];if(!d)return 'unknown-definition';
    if(it.l)return 'locked';if(it.p)return 'special-property';if(it.gift)return 'gift';if(v21422EquippedIdentity(it))return 'equipped-identity';
    if(protectedStandItem(it)||csv(C.inventoryProtectedItems).indexOf(it.name)>=0)return 'configured-protected';
    if(d.quest||d.event||d.cash||d.rare)return 'rare-or-special';
    var high=Math.max(0,Number(C.autoEconomyHighValueNpc)||0),value=Number(itemValueSafe(it))||0;if(high>0&&value>=high)return 'high-npc-value';
    return '';
  }
  function v21422Reserve(name,rule){var desired=0;try{desired=Math.max(0,Number(v273DesiredGroupCopies(name))||0);}catch(e){}return Math.max(desired,Math.max(0,Number(rule&&rule.minKeep)||0));}
  function v21422Owned(name){try{return Math.max(0,Number(v273OwnedCount(name))||0);}catch(e){return qty(name);}}
  function v21422Profit(prefix,it,copies){
    copies=Math.max(1,Number(copies)||1);var e=v2144ActionEconomics(prefix,it,copies),cur=Number(e.npcValueNow)||0,delta=e.netNpcDelta==null?null:Number(e.netNpcDelta),pct=delta==null||cur<=0?null:(delta/cur*100),ok=delta!=null&&delta>=Number(C.autoEconomyMinProfitGold||0)&&(pct==null||pct>=Number(C.autoEconomyMinProfitPct||0));
    return Object.assign({},e,{profitPct:pct==null?null:Math.round(pct*10)/10,profitable:ok});
  }
  function v21422Policy(it,where){
    var rule=v21422Rule(it&&it.name),prot=v21422Protected(it),d=GD.items&&GD.items[it&&it.name]||{},level=Number(it&&it.level)||0,owned=v21422Owned(it&&it.name),reserve=v21422Reserve(it&&it.name,rule),surplus=Math.max(0,owned-reserve),action=rule.action,reasonText='';
    if(prot)return {action:'KEEP',reason:'protected:'+prot,protected:true,rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    if(action==='RECYCLE'||action==='DISCARD')return {action:'KEEP',reason:'unsupported-safe-fallback:'+action.toLowerCase(),protected:true,rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    if(action==='HOLD_FOR_MERCHANT')return {action:'HOLD_FOR_MERCHANT',reason:'explicit-hold',rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    if(action!=='AUTO'){
      if((action==='SELL'||action==='BANK'||action==='EXCHANGE')&&surplus<=0)return {action:'KEEP',reason:'reserve-floor',rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
      return {action:action,reason:'explicit-policy',rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    }
    if(d.e||d.exchange||d.exchanges)return {action:'EXCHANGE',reason:'exchange-capable',rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    if(d.compound&&surplus>=3&&level<v273EffectiveCompoundMax(it.name)){
      var ce=v21422Profit('cscroll',it,3);if(!C.autoEconomyRequireProfitForCompound||ce.profitable)return {action:'COMPOUND',reason:'compound-economic',economics:ce,rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    }
    if(d.upgrade&&level<Number(C.merchantUpgradeMax||0)&&v273GroupUtility(it)>=0){
      var ue=v21422Profit('scroll',it,1);if(!C.autoEconomyRequireProfitForUpgrade||ue.profitable)return {action:'UPGRADE',reason:'upgrade-eligible',economics:ue,rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    }
    var sd=v2144SellDecision(it);if(sd&&sd.sell&&surplus>0)return {action:'SELL',reason:sd.reason||'safe-surplus',sellDecision:sd,rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    if(where==='inventory'&&freeSlots()<=Number(C.autoEconomyMinFreeSlots||6))return {action:'BANK',reason:'inventory-pressure-safe-bank',rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
    return {action:'KEEP',reason:'default-safe-keep',rule:rule,category:v21422Category(it),reserve:reserve,surplus:surplus};
  }
  function v21422InvSig(){return (character.items||[]).map(function(it){return it?[it.name,Number(it.level)||0,Number(it.q)||1,it.l?1:0,String(it.p||'')].join(':'):'-';}).join('|')+'#'+String(character.map||'')+'#'+String(character.gold||0);}
  function v21422BankRows(){var rows=[];if(!character.bank)return rows;Object.keys(character.bank).filter(function(k){return /^items\d+$/.test(k)&&Array.isArray(character.bank[k]);}).forEach(function(pack){character.bank[pack].forEach(function(it,index){if(it)rows.push({pack:pack,index:index,it:it});});});return rows;}
  function v21422BuildPlan(force){
    var st=S.autoEconomy21422,now=clock(),sig=v21422InvSig();if(!force&&st.plan&&sig===st.sig&&now-Number(st.planAt||0)<Number(C.autoEconomyPlanSeconds||5)*1000)return st.plan;
    var plan={sell:[],bank:[],upgrade:[],compound:[],exchange:[],keep:[],withdrawSell:[],at:now};
    (character.items||[]).forEach(function(it,i){if(!it)return;var p=v21422Policy(it,'inventory'),row={index:i,item:it,policy:p};if(p.action==='SELL')plan.sell.push(row);else if(p.action==='BANK')plan.bank.push(row);else if(p.action==='UPGRADE')plan.upgrade.push(row);else if(p.action==='COMPOUND')plan.compound.push(row);else if(p.action==='EXCHANGE')plan.exchange.push(row);else plan.keep.push(row);});
    if(character.bank){var cap=v273BankCapacity(),full=cap&&cap.free<=0;v21422BankRows().forEach(function(r){var p=v21422Policy(r.it,'bank');if(p.action==='SELL'&&(p.rule.explicit||full))plan.withdrawSell.push({pack:r.pack,index:r.index,item:r.it,policy:p});});}
    st.plan=plan;st.planAt=now;st.sig=sig;return plan;
  }
  function v21422Log(kind,msg,data,level){var st=S.autoEconomy21422,now=clock(),key=kind+':'+msg;if(now-Number(st.lastLog[key]||0)<15000)return;st.lastLog[key]=now;audit(kind,msg,data||{},level||'info');}
  function v21422State(next,reasonText,data){var st=S.autoEconomy21422;if(st.state===next)return;st.state=next;st.enteredAt=clock();v21422Log('merchant_economy_state','Auto-Economy State '+next,Object.assign({reason:reasonText||''},data||{}));}
  function v21422ExistingBusy(){if(S.merchantBankRetrieve2149||S.merchantBankCleanup2148||S.moveInFlight||character.moving)return true;try{if(v21417EconomicFlightKind(character.q))return true;}catch(e){}return false;}
  function v21422ExactInv(name,level){return (character.items||[]).reduce(function(n,it){return n+(it&&it.name===name&&(Number(it.level)||0)===(Number(level)||0)?(Number(it.q)||1):0);},0);}
  function v21422ExactBank(name,level){return v21422BankRows().reduce(function(n,r){return n+(r.it.name===name&&(Number(r.it.level)||0)===(Number(level)||0)?(Number(r.it.q)||1):0);},0);}
  function v21422FindInv(name,level){var best=-1;(character.items||[]).some(function(it,i){if(it&&it.name===name&&(Number(it.level)||0)===(Number(level)||0)){best=i;return true;}return false;});return best;}
  function v21422VendorReady(){var v=v2144SellVendor();return !v||((!v.map||v.map===character.map)&&dist(character,v)<=80);}
  function v21422Recover(reasonText){var st=S.autoEconomy21422;v21422Log('merchant_economy_recover','Auto-Economy Recovery',{reason:reasonText,state:st.state,tx:st.tx},'warning');st.tx=null;st.bankSales=0;st.recoverUntil=clock()+Number(C.autoEconomyRecoverySeconds||20)*1000;v21422State('RECOVER',reasonText);}
  function v21422BankSellTick(){
    var st=S.autoEconomy21422,now=clock(),tx=st.tx;
    if(st.state==='RECOVER'){if(now<Number(st.recoverUntil||0))return true;st.tx=null;v21422State('IDLE','recovery-complete');return false;}
    if(!tx)return false;
    if(character.rip){v21422Recover('character-dead');return true;}
    if(st.state==='WITHDRAW_ITEMS'){
      if(String(character.map||'').indexOf('bank')!==0){if(v21422ExistingBusy())return true;return moveToGoal({map:'bank',x:0,y:0},'Auto-Economy Bankentnahme',{kind:'bank',forceAfter:9000})||true;}
      if(v21422ExistingBusy())return true;
      var live=(character.bank&&character.bank[tx.pack]||[])[tx.bankIndex];if(!live||live.name!==tx.name||(Number(live.level)||0)!==tx.level){v21422Recover('bank-slot-changed');return true;}
      tx.beforeInv=v21422ExactInv(tx.name,tx.level);tx.beforeBank=v21422ExactBank(tx.name,tx.level);tx.startedAt=now;v21422State('WITHDRAW_WAIT','withdraw-sent',{item:tx.name,pack:tx.pack,index:tx.bankIndex});
      var started=action('Auto-Economy Bankentnahme '+tx.name,function(){return bank_retrieve(tx.pack,tx.bankIndex);},'economy-withdraw:'+tx.name,1600);if(!started)v21422Recover('withdraw-not-started');return true;
    }
    if(st.state==='WITHDRAW_WAIT'){
      if(v21422ExactInv(tx.name,tx.level)>Number(tx.beforeInv||0)||v21422ExactBank(tx.name,tx.level)<Number(tx.beforeBank||0)){v21422State('TRAVEL_TO_VENDOR','withdraw-confirmed',{item:tx.name});return true;}
      if(now-Number(tx.startedAt||now)>12000){v21422Recover('withdraw-unconfirmed');return true;}return true;
    }
    if(st.state==='TRAVEL_TO_VENDOR'){
      if(v21422VendorReady()){v21422State('SELL_ITEMS','vendor-ready');return true;}if(v21422ExistingBusy())return true;var v=v2144SellVendor();return moveToGoal(v,'Auto-Economy NPC-Verkauf',{kind:'merchant-vendor',tolerance:60,forceAfter:9000})||true;
    }
    if(st.state==='SELL_ITEMS'){
      if(v21422ExistingBusy())return true;var idx=v21422FindInv(tx.name,tx.level);if(idx<0){v21422Recover('withdrawn-item-not-found');return true;}var it=character.items[idx],p=v21422Policy(it,'inventory');if(p.action!=='SELL'){v21422Recover('policy-changed-before-sale');return true;}var reserve=v21422Reserve(tx.name,p.rule),owned=v21422Owned(tx.name),maxSell=Math.max(0,owned-reserve),qtySell=Math.min(Number(it.q)||1,Math.max(1,maxSell));if(maxSell<=0){v21422Recover('reserve-floor-before-sale');return true;}tx.sellIndex=idx;tx.beforeSell=v21422ExactInv(tx.name,tx.level);tx.sellQty=qtySell;tx.startedAt=now;v21422State('SELL_WAIT','sale-sent',{item:tx.name,qty:qtySell});var ok=action('Auto-Economy Verkauf '+tx.name,function(){return sell(idx,qtySell);},'economy-sell:'+tx.name,1800);if(!ok)v21422Recover('sale-not-started');return true;
    }
    if(st.state==='SELL_WAIT'){
      if(v21422ExactInv(tx.name,tx.level)<Number(tx.beforeSell||0)){st.bankSales=Number(st.bankSales||0)+1;v21422Log('merchant_economy_sale_confirmed','[SELL] '+tx.name+' x'+tx.sellQty,{item:tx.name,level:tx.level,qty:tx.sellQty});st.tx=null;v21422State('IDLE','sale-confirmed');return true;}
      if(now-Number(tx.startedAt||now)>12000){v21422Recover('sale-unconfirmed');return true;}return true;
    }
    return false;
  }
  function v21422MaybeStartBankSale(){
    var st=S.autoEconomy21422;if(st.tx||st.state!=='IDLE'||!character.bank||freeSlots()<1||v21422ExistingBusy())return false;if(Number(st.bankSales||0)>=Number(C.autoEconomyMaxBankSalesPerCycle||4)){st.bankSales=0;st.recoverUntil=clock()+30000;v21422State('RECOVER','bank-sale-cycle-limit');return true;}
    var p=v21422BuildPlan(true),c=p.withdrawSell[0];if(!c)return false;st.tx={name:c.item.name,level:Number(c.item.level)||0,qty:Number(c.item.q)||1,pack:c.pack,bankIndex:c.index};v21422State('WITHDRAW_ITEMS','bank-sell-candidate',{item:c.item.name,pack:c.pack,index:c.index,reason:c.policy.reason});return true;
  }
  function v21422CompoundCandidate(){
    var groups={};(character.items||[]).forEach(function(it,i){if(!it)return;var p=v21422Policy(it,'inventory');if(p.action!=='COMPOUND')return;var key=it.name+'|'+(Number(it.level)||0);(groups[key]||(groups[key]=[])).push({it:it,i:i,p:p});});
    var rows=Object.keys(groups).filter(function(k){return groups[k].length>=3;}).map(function(k){var g=groups[k],econ=v21422Profit('cscroll',g[0].it,3),rule=g[0].p.rule,require=rule.explicit?rule.requireProfit:C.autoEconomyRequireProfitForCompound;if(require&&!econ.profitable){v21422Log('merchant_economy_skip','[SKIP] Compound wirtschaftlich negativ',{item:g[0].it.name,level:Number(g[0].it.level)||0,economics:econ},'info');return null;}return {g:g.slice(0,3),econ:econ};}).filter(Boolean);return rows[0]||null;
  }
  function v21422UpgradeCandidate(){
    var rows=[];(character.items||[]).forEach(function(it,i){if(!it)return;var p=v21422Policy(it,'inventory');if(p.action!=='UPGRADE')return;var target=Number(p.rule.targetLevel)||Number(C.merchantUpgradeMax||0),lv=Number(it.level)||0;if(lv>=target)return;var econ=v21422Profit('scroll',it,1),require=p.rule.explicit?p.rule.requireProfit:C.autoEconomyRequireProfitForUpgrade;if(require&&!econ.profitable){v21422Log('merchant_economy_skip','[SKIP] Upgrade wirtschaftlich negativ',{item:it.name,level:lv,economics:econ},'info');return;}rows.push({it:it,i:i,p:p,econ:econ,lv:lv,target:target});});rows.sort(function(a,b){return a.lv-b.lv;});return rows[0]||null;
  }

  var v21422CompoundBase=v273CompoundTick;
  v273CompoundTick=function(){if(character.ctype!=='merchant'||!C.autoEconomyEnabled)return v21422CompoundBase();if(v21422ExistingBusy())return false;var c=v21422CompoundCandidate();if(!c)return false;var item=c.g[0].it,sc=v273EnsureScroll('cscroll',item);if(sc<0)return true;var ids=c.g.map(function(x){return x.i;}),finger=c.g.map(function(x){return v291ItemFingerprint? v291ItemFingerprint(x.it):x.it.name+'|'+(Number(x.it.level)||0);});S.status='Kombiniere wirtschaftlich '+v273Name(item.name)+' +'+(Number(item.level)||0);S.mode='Merchant · Combine';return action('Wirtschaftliches Compound '+item.name,function(){for(var j=0;j<ids.length;j++){var live=character.items[ids[j]];if(!live||live.name!==item.name||(Number(live.level)||0)!==(Number(item.level)||0)||live.l||live.p)throw Error('compound_slot_changed');}audit('merchant_economy_compound','[COMPOUND] '+item.name+' +'+(Number(item.level)||0)+' x3',{item:item.name,level:Number(item.level)||0,economics:c.econ,fingerprints:finger});return compound(ids[0],ids[1],ids[2],sc);},'merchant-compound-21422',3400);};

  var v21422UpgradeBase=v273UpgradeTick;
  v273UpgradeTick=function(){if(character.ctype!=='merchant'||!C.autoEconomyEnabled)return v21422UpgradeBase();if(v21422ExistingBusy())return false;var c=v21422UpgradeCandidate();if(!c)return false;var sc=v273EnsureScroll('scroll',c.it);if(sc<0)return true;var idx=c.i,name=c.it.name,lv=c.lv;S.status='Verbessere geplant '+v273Name(name)+' +'+lv+' → +'+(lv+1);S.mode='Merchant · Upgrade';return action('Geplantes Upgrade '+name,function(){var live=character.items[idx];if(!live||live.name!==name||(Number(live.level)||0)!==lv||live.l||live.p)throw Error('upgrade_slot_changed');audit('merchant_economy_upgrade','[UPGRADE] '+name+' +'+lv+' -> +'+(lv+1),{item:name,level:lv,target:c.target,economics:c.econ});return upgrade(idx,sc);},'merchant-upgrade-21422',2800);};

  var v21422MerchantBase=merchantTick;
  merchantTick=function(){
    if(character.ctype!=='merchant'||!C.autoEconomyEnabled)return v21422MerchantBase();
    var st=S.autoEconomy21422;if(st.state!=='IDLE'&&v21422BankSellTick())return true;
    if(!v21422ExistingBusy()&&v21422MaybeStartBankSale())return true;
    var p=v21422BuildPlan(false);if(clock()>Number(S.times.economySummary21422||0)){S.times.economySummary21422=clock()+30000;v21422Log('merchant_economy_plan','[INVENTORY] '+((character.items||[]).length-freeSlots())+'/'+(character.items||[]).length+' slots used',{sell:p.sell.length,bank:p.bank.length,upgrade:p.upgrade.length,compound:p.compound.length,exchange:p.exchange.length,keep:p.keep.length,withdrawSell:p.withdrawSell.length,free:freeSlots()});}
    return v21422MerchantBase();
  };

  try{FEATURE_CONTRACT.push('merchant-unified-auto-economy','merchant-central-item-policy','merchant-economic-compound-guard','merchant-bank-withdraw-sell-state-machine');}catch(e){}
  audit('feature_contract','2.14.22 Zentrale Item-Policy + Auto-Economy State Machine + wirtschaftliches Compound geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});
`;

bot=bot.slice(0,pos)+block+bot.slice(pos);
fs.writeFileSync(botPath,bot);

const versionPath='version.json';
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));
version.version='2.14.22';version.dashboardVersion='2.14.22';version.build='2026-09-11';
fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');

for(const p of ['cloudflare-dashboard/package.json']){
  const j=JSON.parse(fs.readFileSync(p,'utf8'));j.version='2.14.22';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
}
for(const p of ['cloudflare-dashboard/dashboard.html','cloudflare-dashboard/src/worker.js']){
  let t=fs.readFileSync(p,'utf8');t=t.replace(/2\.14\.21/g,'2.14.22');fs.writeFileSync(p,t);
}
let vr=fs.readFileSync('scripts/verify-release.js','utf8');vr=vr.replace(/2\.14\.21/g,'2.14.22');fs.writeFileSync('scripts/verify-release.js',vr);
console.log('Applied v2.14.22 unified auto-economy manager');
