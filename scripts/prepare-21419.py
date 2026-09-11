#!/usr/bin/env python3
import json, re
from pathlib import Path

ROOT=Path('.')

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def must_replace(s, old, new, label, count=1):
    n=s.count(old)
    if n < count: raise SystemExit(f'{label}: expected >= {count} matches, found {n}')
    return s.replace(old,new,count)

bot=read('bot.js')
bot=must_replace(bot,'/* Adventure Land • AiO Bot 2.14.18 | 2026-09-10','/* Adventure Land • AiO Bot 2.14.19 | 2026-09-10','bot header')
bot=must_replace(bot,"var VERSION = '2.14.18';","var VERSION = '2.14.19';",'bot version')

# Extend the literal protected feature contract without making it dynamic.
cm=re.search(r"var FEATURE_CONTRACT = \[(?P<body>[\s\S]*?)\n  \];",bot)
if not cm: raise SystemExit('FEATURE_CONTRACT not found')
new_features=[
    'merchant-route-owner','merchant-exchange-capacity-gate','merchant-capacity-state-backoff',
    'merchant-presale-economics-questions','merchant-loop-breaker','merchant-economy-state-cache'
]
body=cm.group('body')
for f in new_features:
    if "'"+f+"'" not in body:
        stripped=body.rstrip()
        if stripped and not stripped.endswith(','): stripped+=','
        body=stripped+"\n    '"+f+"',"
bot=bot[:cm.start('body')]+body+bot[cm.end('body'):]

anchor="  var v21416SelfUpdateBase=selfUpdate;\n"
if anchor not in bot: raise SystemExit('2.14.19 insertion anchor not found')

block=r'''  // ---------------------------------------------------------------------------
  // 2.14.19 Merchant route ownership, capacity backoff, deterministic pre-sale
  // economics questions, loop recovery and profiler attribution.
  // ---------------------------------------------------------------------------
  function v21419HashText(text){var h=2166136261,s=String(text||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
  function v21419InventoryFingerprint(){
    var rows=(character.items||[]).map(function(it){return it?[it.name,Number(it.level)||0,Number(it.q)||1,it.l?1:0,it.p||''].join(':'):'-';});
    return v21419HashText(rows.join('|'));
  }
  function v21419CapacityFingerprint(){
    var snap=0;try{snap=Number((typeof v2149BankSnapshot!=='undefined'&&v2149BankSnapshot&&v2149BankSnapshot.at)||S.bankScanAt||0);}catch(e){}
    return [v21419InventoryFingerprint(),freeSlots(),S.bankFull?1:0,Math.floor((Number(character.gold)||0)/5000000),Math.floor(snap/60000)].join('|');
  }
  function v21419HardCapacityActive(){return character.ctype==='merchant'&&freeSlots()<=Math.max(1,Number(C.merchantInventoryReserve)||0);}

  function v21419RoutePriority(kind){
    kind=String(kind||'').toLowerCase();
    if(/survival|escape|recovery/.test(kind))return 200;
    if(/capacity|bank-cleanup/.test(kind))return 150;
    if(/bank-retrieve|npc-sell|bank-store|organize-bank|^bank$/.test(kind))return 140;
    if(/exchange/.test(kind))return 130;
    if(/scroll|upgrade|compound|vendor/.test(kind))return 120;
    if(/merchant-service|service|collect|supply|deliver|distribution|gear/.test(kind))return 100;
    if(/gather/.test(kind))return 30;
    if(/explore|discovery/.test(kind))return 10;
    return 70;
  }
  function v21419RouteTargetKey(target){
    if(typeof target==='string')return target;
    target=target||{};return [String(target.map||''),Math.round(Number(target.x)||0),Math.round(Number(target.y)||0)].join('|');
  }
  function v21419RouteActive(owner){
    if(!owner)return false;var now=clock();
    if(String(owner.kind||'').indexOf('exchange')>=0&&S.exchangeRouteFlight21418&&S.exchangeRouteFlight21418.active)return true;
    if(S.moveInFlight||character.moving)return true;
    return now-Number(owner.at||0)<2500;
  }
  function v21419CancelRoute(reason){
    try{if(typeof stop==='function')stop('smart');}catch(e){}
    S.moveSeq=Number(S.moveSeq||0)+1;S.moveInFlight=false;S.moveGoal=null;S.moveDestination=null;S.moveArbiter2145=null;S.exchangeRouteFlight21418=null;S.routeOwner21419=null;
    if(reason)S.lastRouteCancel21419={at:clock(),reason:String(reason)};
  }
  function v21419AcquireRoute(kind,target,tolerance){
    if(character.ctype!=='merchant')return {ok:true,same:false,priority:0};
    var now=clock(),priority=v21419RoutePriority(kind),key=v21419RouteTargetKey(target),owner=S.routeOwner21419;
    if(owner&&!v21419RouteActive(owner)){S.routeOwner21419=null;owner=null;}
    if(owner){
      var same=owner.kind===kind&&owner.key===key;
      if(same){owner.lastAt=now;return {ok:true,same:true,priority:priority};}
      if(priority<=Number(owner.priority||0)){
        if(now>Number(S.times.routeDeferred21419||0)){S.times.routeDeferred21419=now+5000;audit('merchant_route_deferred','Merchant-Route wartet auf aktuellen Besitzer',{activeKind:owner.kind,activePriority:owner.priority,requestedKind:kind,requestedPriority:priority},'info');}
        return {ok:false,same:false,priority:priority};
      }
      audit('merchant_route_preempted','Höher priorisierte Merchant-Route übernimmt kontrolliert',{from:owner.kind,fromPriority:owner.priority,to:kind,toPriority:priority},'warning');
      v21419CancelRoute('preempt:'+owner.kind+'->'+kind);
    }
    S.routeOwner21419={kind:kind,key:key,priority:priority,target:target||null,tolerance:Number(tolerance)||85,at:now,lastAt:now};
    return {ok:true,same:false,priority:priority};
  }
  function v21419ReleaseRoute(kind){var o=S.routeOwner21419;if(o&&(!kind||o.kind===kind))S.routeOwner21419=null;}

  var v21419MoveBase=moveToGoal;
  moveToGoal=function(g,why,opts){
    opts=opts||{};if(character.ctype!=='merchant')return v21419MoveBase(g,why,opts);
    var kind=opts.kind||String(why||'move'),target=g&&{map:g.map||character.map,x:Math.round(Number(g.x)||0),y:Math.round(Number(g.y)||0)},r=v21419AcquireRoute(kind,target,opts.tolerance);
    if(!r.ok)return true;
    var started=v21419MoveBase(g,why,opts);if(!started&&!character.moving&&!S.moveInFlight)v21419ReleaseRoute(kind);return started;
  };

  function v21419ExchangeCapacityBlocked(){return freeSlots()<=Math.max(1,Number(C.merchantInventoryReserve)||0);}
  function v21419LocalExchangeCandidate(){
    var found=null;(character.items||[]).some(function(it,i){if(!it||it.l||it.p)return false;var p=v2147ItemPolicy(it.name),d=GD.items&&GD.items[it.name]||{},need=Number(d.e)||Number(d.exchange)||1;if((p!=='auto'&&p!=='exchange')||!(d.e||d.exchange||d.exchanges)||(Number(it.q)||1)<need)return false;found={item:it,index:i,need:need};return true;});return found;
  }
  var v21419ExchangeBase=v273ExchangeTick;
  v273ExchangeTick=function(){
    if(character.ctype==='merchant'&&v21419LocalExchangeCandidate()&&v21419ExchangeCapacityBlocked()){
      var now=clock(),reserve=Math.max(1,Number(C.merchantInventoryReserve)||0);if(now>Number(S.times.exchangeCapacity21419||0)){S.times.exchangeCapacity21419=now+60000;audit('merchant_exchange_capacity_deferred','Eintausch wartet auf sicheren freien Belohnungs-Slot',{free:freeSlots(),reserve:reserve},'warning');}return false;
    }
    return v21419ExchangeBase.apply(this,arguments);
  };

  function v21419ExchangeRouteCore(){
    if(v21417ExchangeReady()){S.exchangeRouteFlight21418=null;v21419ReleaseRoute('merchant-exchange');return false;}
    if(v21419ExchangeCapacityBlocked())return false;
    var now=clock(),flight=S.exchangeRouteFlight21418;
    if(flight&&flight.active){
      if(now-Number(flight.startedAt||now)<45000){S.status=C.language==='de'?'Eintausch-Anreise läuft':'Exchange route in progress';S.mode='Merchant · Exchange';return true;}
      audit('merchant_exchange_route_timeout','Eintausch-Anreise ohne Fortschritt abgebrochen',{durationMs:now-Number(flight.startedAt||now)},'warning');v21419CancelRoute('exchange-timeout');
    }
    var acquire=v21419AcquireRoute('merchant-exchange','exchange',120);if(!acquire.ok)return true;
    if(character.moving||S.moveInFlight)return true;if(typeof smart_move!=='function'){v21419ReleaseRoute('merchant-exchange');return false;}
    var seq=++S.moveSeq,state={active:true,startedAt:now,seq:seq};S.exchangeRouteFlight21418=state;S.moveInFlight=true;S.moveKind='merchant-exchange';S.moveRequestedAt=now;S.moveStarted=now;S.lastMoveAt=now;
    S.status=C.language==='de'?'Zum Eintausch-NPC':'Go to exchange NPC';S.mode='Merchant · Exchange';audit('move','Zum Eintausch-NPC',{smartDestination:'exchange',routeOwner:'merchant-exchange'});
    function done(){if(seq!==S.moveSeq)return;state.active=false;S.moveInFlight=false;var p=pos(character);if(p)S.exchangeReady21417={map:p.map,x:p.x,y:p.y,at:clock()};v21419ReleaseRoute('merchant-exchange');audit('move_done','Eintausch-NPC erreicht',p||{});}
    function failed(e){if(seq!==S.moveSeq)return;state.active=false;S.moveInFlight=false;v21419ReleaseRoute('merchant-exchange');var er=reason(e);if(er==='interrupted')audit('merchant_exchange_route_interrupted','Eintausch-Route extern unterbrochen',{error:er},'warning');else audit('merchant_exchange_route_error','Eintausch-Route fehlgeschlagen',{error:er},'warning');}
    try{Promise.resolve(smart_move('exchange')).then(done,failed);}catch(e){failed(e);return false;}return true;
  }
  v21417ExchangeRouteTick=v21418ProfileWrap('movement',v21419ExchangeRouteCore);

  function v21419BankBackoffActive(){var b=S.bankBackoff21419;if(!b)return false;var fp=v21419CapacityFingerprint();if(b.fingerprint!==fp){S.bankBackoff21419=null;return false;}if(clock()>=Number(b.until||0)){S.bankBackoff21419=null;return false;}return true;}
  var v21419StoreTrashBankBase=v273StoreTrashBankTick;
  v273StoreTrashBankTick=function(){if(character.ctype==='merchant'&&v21419BankBackoffActive())return false;return v21419StoreTrashBankBase.apply(this,arguments);};

  var v21419FindSellCandidateBase=v2144FindSellCandidate;
  v2144FindSellCandidate=function(){
    var key=[v21419InventoryFingerprint(),S.bankFull?1:0,Math.floor((Number(character.gold)||0)/1000000),Number(C.merchantInventoryReserve)||0,Number(C.merchantUpgradeMax)||0,Number(C.merchantCompoundMax)||0,JSON.stringify(C.merchantItemActions||{})].join('|'),now=clock(),c=S.sellCandidateCache21419;
    if(c&&c.key===key&&now<Number(c.until||0))return c.value;
    var value=v21419FindSellCandidateBase.apply(this,arguments);S.sellCandidateCache21419={key:key,until:now+5000,value:value};return value;
  };

  function v21419CompoundReadyForSaleItem(cand){
    if(!cand||!cand.item||!C.merchantAutoCompound)return false;var it=cand.item,d=GD.items&&GD.items[it.name]||{},lv=Number(it.level)||0;if(!d.compound||lv>=v273EffectiveCompoundMax(it.name)||v273GroupUtility(it)<0)return false;
    var n=0;(character.items||[]).forEach(function(x){if(x&&!x.l&&!x.p&&x.name===it.name&&(Number(x.level)||0)===lv)n++;});return n>=3&&v273OwnedCount(it.name)-v273DesiredGroupCopies(it.name)>=2;
  }
  function v21419UpgradeReadyForSaleItem(cand){var it=cand&&cand.item,d=it&&GD.items&&GD.items[it.name]||{};return !!(it&&C.merchantAutoUpgrade&&d.upgrade&&(Number(it.level)||0)<Number(C.merchantUpgradeMax||4)&&v273GroupUtility(it)>=0);}
  function v21419QuestionLog(cand,kind,econ,answer,why){
    if(!econ)return;var now=clock(),name=v273Name(cand.item.name),question=kind==='upgrade'?'Lohnt es sich, '+name+' vor dem NPC-Verkauf zu verbessern?':'Lohnt es sich, '+name+' vor dem NPC-Verkauf zu kombinieren?',key=kind+'|'+cand.item.name+'|'+(Number(cand.item.level)||0)+'|'+answer+'|'+why;
    S.economyQuestionAt21419=S.economyQuestionAt21419||{};if(now<Number(S.economyQuestionAt21419[key]||0))return;S.economyQuestionAt21419[key]=now+60000;
    var data={question:question,answer:answer?'ja':'nein',reason:why,item:cand.item.name,level:Number(cand.item.level)||0,npcValueNow:econ.npcValueNow,npcValueAfter:econ.npcValueAfter,scroll:econ.scroll,scrollCost:econ.scrollCost,netNpcDelta:econ.netNpcDelta};S.lastEconomyQuestion21419=data;audit('merchant_economy_question',question,data,'info');
  }
  function v21419PreSaleQuestions(cand){
    if(!cand||!cand.decision)return false;var now=clock(),pressure=v21419HardCapacityActive(),u=cand.decision.upgradeEconomics,c=cand.decision.compoundEconomics,upgradeGood=!!(u&&Number(u.netNpcDelta)>0&&v21419UpgradeReadyForSaleItem(cand)),compoundGood=!!(c&&Number(c.netNpcDelta)>0&&v21419CompoundReadyForSaleItem(cand));
    v21419QuestionLog(cand,'upgrade',u,!pressure&&upgradeGood,pressure?'capacity-pressure-slot-release':(upgradeGood?'positive-net-value-and-existing-upgrade-policy':'not-profitable-or-not-eligible'));
    v21419QuestionLog(cand,'compound',c,!pressure&&compoundGood,pressure?'capacity-pressure-slot-release':(compoundGood?'positive-net-value-and-existing-compound-policy':'not-profitable-or-not-eligible'));
    if(pressure||(!upgradeGood&&!compoundGood))return false;
    var key=cand.item.name+'|'+(Number(cand.item.level)||0)+'|'+v21419InventoryFingerprint(),hold=S.preSaleHold21419;
    if(!hold||hold.key!==key){S.preSaleHold21419={key:key,until:now+30000,fallbackUntil:0};audit('merchant_presale_deferred','NPC-Verkauf kurz verschoben, damit bestehende sichere Upgrade/Compound-Logik entscheiden kann',{item:cand.item.name,level:Number(cand.item.level)||0,upgrade:upgradeGood,compound:compoundGood,waitMs:30000});return true;}
    if(now<Number(hold.until||0))return true;
    if(!hold.fallbackUntil){hold.fallbackUntil=now+600000;audit('merchant_presale_fallback','Vorverkaufs-Optimierung brachte innerhalb des Zeitfensters keinen Abschluss; sicherer Verkauf wird wieder zugelassen',{item:cand.item.name,level:Number(cand.item.level)||0},'warning');}
    return now<Number(hold.fallbackUntil||0)?false:false;
  }
  function v21419SellTrashCore(){
    if(character.ctype!=='merchant'||!C.merchantSellTrashToNpc||typeof sell!=='function')return false;var cand=v2144FindSellCandidate();
    if(!cand){if(clock()>Number(S.times.sellNoCandidate2145||0)){S.times.sellNoCandidate2145=clock()+30000;audit('merchant_sell_scan','Kein sicherer NPC-Verkaufskandidat',{free:freeSlots(),reserve:C.merchantInventoryReserve,inventory:(character.items||[]).filter(Boolean).length},'info');}return false;}
    if(v21419PreSaleQuestions(cand)){S.status='Prüfe Verbesserung/Kombination vor Verkauf: '+v273Name(cand.item.name);S.mode='Merchant · Ökonomie';return false;}
    var dest=v2144SellVendor();audit('merchant_economy_decision','NPC-Verkauf nach Wert/Drop/Reserve-Prüfung',{item:cand.item.name,level:Number(cand.item.level)||0,quantity:cand.qty,decision:cand.decision,presaleQuestion:S.lastEconomyQuestion21419||null});
    if(dest&&!v2145VendorReady(dest)){S.status='Zum NPC für Verkauf: '+v273Name(cand.item.name);S.mode='Merchant · NPC-Verkauf';return moveToGoal(dest,'NPC-Verkauf '+cand.item.name,{kind:'merchant-npc-sell',tolerance:45,forceAfter:15000});}
    S.status='NPC-Verkauf: '+v273Name(cand.item.name)+' ×'+cand.qty;S.mode='Merchant · NPC-Verkauf';return action('NPC-Verkauf '+cand.item.name,function(){return sell(cand.index,cand.qty);},'merchant-trash-sell:'+cand.item.name,2200);
  }
  v273SellTrashTick=v21418ProfileWrap('economy',v21419SellTrashCore);

  function v21419CapacityCore(){
    if(character.ctype!=='merchant')return false;var reserve=Math.max(1,Number(C.merchantInventoryReserve)||0),free=freeSlots(),now=clock();
    if(free>reserve){if(S.capacityBlocked21418){audit('merchant_capacity_recovered','Merchant-Kapazität wieder verfügbar',{durationMs:now-Number(S.capacityBlocked21418.since||now),free:free,reserve:reserve});S.capacityBlocked21418=null;}return false;}
    var fp=v21419CapacityFingerprint(),blocked=S.capacityBlocked21418;
    if(blocked&&blocked.fingerprint!==fp){blocked=null;S.capacityBlocked21418=null;}
    if(blocked&&now<Number(blocked.retryAt||0)){S.status='Kapazität blockiert · sichere Freigabe später erneut prüfen';S.mode='Merchant · Kapazität';return true;}
    if(S.inventoryPressureBusy){S.status='Inventarbereinigung läuft · Re-Entry blockiert';S.mode='Merchant · Inventar';return true;}
    S.inventoryPressureBusy=true;
    try{
      if(!v21419BankBackoffActive()&&v273StoreTrashBankTick())return true;
      if(v273SellTrashTick())return true;
      var repeats=blocked?Number(blocked.repeats||0)+1:0,retryMs=repeats>0?600000:60000;blocked=blocked||{since:now};blocked.fingerprint=fp;blocked.retryAt=now+retryMs;blocked.repeats=repeats;blocked.free=freeSlots();blocked.reserve=reserve;blocked.bankFull=!!S.bankFull;S.capacityBlocked21418=blocked;
      S.status='Kapazität blockiert · nur sichere Platzfreigabe aktiv';S.mode='Merchant · Kapazität';
      if(now>Number(S.times.capacityBlockedWarn21419||0)){S.times.capacityBlockedWarn21419=now+Math.max(60000,retryMs);audit('merchant_capacity_blocked','Merchant-Kapazität blockiert; optionale Arbeit pausiert und Backoff aktiv',{free:blocked.free,reserve:reserve,bankFull:blocked.bankFull,retryMs:retryMs,repeats:repeats},'warning');}
      return true;
    }finally{S.inventoryPressureBusy=false;}
  }
  v290InventoryPressureTick=v21418ProfileWrap('inventory',v21419CapacityCore);

  var v21419ExploreBase=v290ExploreTick;v290ExploreTick=function(){if(v21419HardCapacityActive()||S.loopRecovery21419)return false;return v21419ExploreBase.apply(this,arguments);};
  if(typeof v2149DiscoveryTick==='function'){var v21419DiscoveryBase=v2149DiscoveryTick;v2149DiscoveryTick=function(){if(v21419HardCapacityActive()||S.loopRecovery21419)return false;return v21419DiscoveryBase.apply(this,arguments);};}
  if(typeof v2149GatherTick==='function'){var v21419GatherBase=v2149GatherTick;v2149GatherTick=function(){if(v21419HardCapacityActive()||S.loopRecovery21419)return false;return v21419GatherBase.apply(this,arguments);};}

  function v21419BreakLoop(signature,source){
    if(character.ctype!=='merchant'||S.loopBreakGuard21419)return false;var now=clock(),rec=S.loopRecovery21419;if(rec&&now<Number(rec.until||0))return false;S.loopBreakGuard21419=true;
    try{
      v21419CancelRoute('loop:'+signature);S.merchantBankCleanup2148=null;S.merchantBankRetrieve2149=null;S.discovery2149=null;S.merchantGather2149=null;if(S.explorer)S.explorer.force=false;S.inventoryPressureBusy=false;S.times.merchantPlan=0;S.times.economy2145=now+12000;
      if(/bank|capacity|inventory|cleanup/.test(String(signature).toLowerCase()))S.bankBackoff21419={fingerprint:v21419CapacityFingerprint(),until:now+600000,reason:'loop-break'};
      S.loopRecovery21419={since:now,until:now+12000,signature:String(signature),source:String(source||'watchdog')};
      audit('merchant_loop_break','Merchant-Endlosschleife erkannt; laufenden Flight verworfen und sichere Neuplanung erzwungen',{signature:String(signature),source:String(source||'watchdog'),recoveryMs:12000},'warning');return true;
    }finally{S.loopBreakGuard21419=false;}
  }
  function v21419LoopEvent(kind,message,data){
    if(character.ctype!=='merchant'||S.loopBreakGuard21419)return;var limits={action_error:[3,90000],merchant_bank_cleanup_start:[4,180000],merchant_bank_cleanup_timeout:[3,180000],merchant_route_preempted:[4,90000],merchant_exchange_route_interrupted:[3,90000]},lim=limits[kind];if(!lim)return;
    var extra=kind==='action_error'?String(data&&data.error||''):kind==='merchant_route_preempted'?String(data&&data.from||'')+'>'+String(data&&data.to||''):String(message||''),sig=kind+'|'+extra,now=clock();S.loopEvents21419=S.loopEvents21419||{};var row=S.loopEvents21419[sig]||[];row=row.filter(function(t){return now-t<=lim[1];});row.push(now);S.loopEvents21419[sig]=row.slice(-8);if(row.length>=lim[0]){S.loopEvents21419[sig]=[];v21419BreakLoop(sig,'event');}
  }
  function v21419StateLoopTick(){
    if(character.ctype!=='merchant'||S.loopRecovery21419)return false;if(S.capacityBlocked21418&&clock()<Number(S.capacityBlocked21418.retryAt||0))return false;
    var mode=String(S.mode||'');if(!/Merchant · (Bank|Exchange|NPC-Verkauf|Discovery|Inventar|Einkauf|Gathering|Ökonomie)/.test(mode)){S.loopState21419=null;return false;}
    var p=pos(character)||{},q=v21417EconomicFlightKind(character.q),owner=S.routeOwner21419&&S.routeOwner21419.kind||'',key=[mode,String(S.moveKind||''),owner,String(p.map||''),Math.round((Number(p.x)||0)/200),Math.round((Number(p.y)||0)/200),freeSlots(),q,v21419InventoryFingerprint()].join('|'),now=clock(),w=S.loopState21419;
    if(!w||w.key!==key){S.loopState21419={key:key,since:now,lastAt:now};return false;}w.lastAt=now;if(now-Number(w.since||now)>=60000){S.loopState21419=null;return v21419BreakLoop('state:'+mode,'state');}return false;
  }
  function v21419RouteSurvivalTick(){
    if(character.ctype!=='merchant'||character.rip)return false;var owner=S.routeOwner21419;if(!owner||!v21419RouteActive(owner))return false;var hp=ratio(character,'hp');if(hp>=.38)return false;
    audit('merchant_route_survival_abort','Merchant-Logistikroute wegen niedriger HP kontrolliert abgebrochen',{hpPct:Math.round(hp*1000)/10,route:owner.kind,map:character.map},'warning');v21419CancelRoute('low-hp');S.loopRecovery21419={since:clock(),until:clock()+12000,signature:'low-hp-route',source:'survival'};return true;
  }

  var v21419MerchantTickBase=merchantTick;
  merchantTick=function(){
    var now=clock(),rec=S.loopRecovery21419;if(rec){if(now<Number(rec.until||0)){S.status='Merchant-Recovery · Schleife/Routenproblem wird sicher aufgelöst';S.mode='Merchant · Recovery';return true;}audit('merchant_loop_recovered','Merchant-Recovery beendet; deterministische Neuplanung läuft',{durationMs:now-Number(rec.since||now),signature:rec.signature});S.loopRecovery21419=null;S.times.merchantPlan=0;}
    if(v21419RouteSurvivalTick())return true;if(v21419StateLoopTick())return true;return v21419MerchantTickBase.apply(this,arguments);
  };

  var v21419AuditBase=audit;
  audit=function(kind,message,data,level){
    if(kind==='merchant_phase_profile'&&data&&typeof data==='object'){
      data=Object.assign({},data,{phases:Object.assign({},data.phases||{})});if(!data.phases.plannerRecipe)data.phases.plannerRecipe={calls:0,avgMs:0,maxMs:0,totalMs:0};
      var total=Number(S.tickRuntime21419&&S.tickRuntime21419.sum)||0,phaseSum=Object.keys(data.phases).reduce(function(n,k){return n+Number(data.phases[k]&&data.phases[k].totalMs||0);},0),other=Math.max(0,total-phaseSum);data.tickRuntimeMs=Math.round(total*100)/100;data.unattributedMs=Math.round(other*100)/100;data.phases.other={calls:Number(S.tickRuntime21419&&S.tickRuntime21419.calls)||0,avgMs:Math.round((other/Math.max(1,Number(S.tickRuntime21419&&S.tickRuntime21419.calls)||0))*100)/100,maxMs:0,totalMs:Math.round(other*100)/100};S.tickRuntime21419={sum:0,calls:0};
    }
    var r=v21419AuditBase(kind,message,data,level);
    if(kind==='merchant_bank_unlock_deferred'||kind==='merchant_bank_cleanup_deferred'){S.bankBackoff21419={fingerprint:v21419CapacityFingerprint(),until:clock()+600000,reason:kind};}
    v21419LoopEvent(kind,message,data);return r;
  };

  var v21419TickBase=tick;
  tick=function(){var t=character.ctype==='merchant'?v21414PerfNow():0;try{return v21419TickBase();}finally{if(character.ctype==='merchant'){var x=S.tickRuntime21419||(S.tickRuntime21419={sum:0,calls:0});x.sum+=Math.max(0,v21414PerfNow()-t);x.calls++;}}};

  audit('feature_contract','2.14.19 Merchant-Route-Owner + Capacity-Backoff + Vorverkaufsökonomie + Loop-Breaker geprüft',{features:FEATURE_CONTRACT});

'''
bot=bot.replace(anchor,block+anchor,1)
write('bot.js',bot)

# Version metadata and dashboard/worker alignment.
version=json.loads(read('version.json'));version['version']='2.14.19';version['dashboardVersion']='2.14.19';write('version.json',json.dumps(version,indent=2,ensure_ascii=False)+'\n')

dash=read('cloudflare-dashboard/dashboard.html').replace('2.14.18','2.14.19')
write('cloudflare-dashboard/dashboard.html',dash)

pkg=json.loads(read('cloudflare-dashboard/package.json'));pkg['version']='2.14.19';write('cloudflare-dashboard/package.json',json.dumps(pkg,indent=2,ensure_ascii=False)+'\n')

worker=read('cloudflare-dashboard/src/worker.js')
worker=re.sub(r'const DASHBOARD_HTML = .*?;\n','const DASHBOARD_HTML = '+json.dumps(dash,ensure_ascii=False,separators=(',',':'))+';\n',worker,count=1,flags=re.S)
worker=worker.replace('2.14.18','2.14.19')
write('cloudflare-dashboard/src/worker.js',worker)

verify=read('scripts/verify-release.js')
verify=verify.replace('prepared release must be 2.14.18','prepared release must be 2.14.19').replace('version.version === "2.14.18"','version.version === "2.14.19"')
verify=verify.replace('dashboard version must be 2.14.18 for layered brain/dashboard release','dashboard version must be 2.14.19 for layered brain/dashboard release').replace('version.dashboardVersion === "2.14.18"','version.dashboardVersion === "2.14.19"')
verify=verify.replace('"merchant-exchange-route-flight-lock","merchant-loot-flight-gate","merchant-capacity-blocked-state","config-control-write-dedupe","merchant-phase-profiler",','"merchant-exchange-route-flight-lock","merchant-loot-flight-gate","merchant-capacity-blocked-state","config-control-write-dedupe","merchant-phase-profiler",\n  "merchant-route-owner","merchant-exchange-capacity-gate","merchant-capacity-state-backoff","merchant-presale-economics-questions","merchant-loop-breaker","merchant-economy-state-cache",')
verify=verify.replace("bot.slice(bot.lastIndexOf('v290InventoryPressureTick=function(){'),bot.indexOf('function v21418ConfigProvenance'))","bot.slice(bot.indexOf('v290InventoryPressureTick=function(){',bot.indexOf('function v21418GuardedLoot')),bot.indexOf('function v21418ConfigProvenance'))")
needle="ok(bot.includes('function v21418ProfileCall') && bot.includes(\"audit('merchant_phase_profile'\") && bot.includes(\"v21418ProfileWrap('inventory'\") && bot.includes(\"v21418ProfileWrap('dashboard'\"), '2.14.18 Merchant phase profiler missing');\n"
if needle not in verify: raise SystemExit('verify 2.14.18 profiler assertion anchor missing')
extra="""ok(bot.includes('function v21419RoutePriority') && bot.includes('S.routeOwner21419') && bot.includes("audit('merchant_route_preempted'") && bot.includes("stop('smart')"), '2.14.19 route owner/preemption missing');
ok(bot.includes('merchant_exchange_capacity_deferred') && bot.includes('function v21419ExchangeCapacityBlocked') && bot.includes("smart_move('exchange')"), '2.14.19 exchange capacity/direct route guard missing');
ok(bot.includes('function v21419CapacityCore') && bot.includes('retryMs=repeats>0?600000:60000') && bot.includes('S.bankBackoff21419'), '2.14.19 capacity/bank backoff missing');
ok(bot.includes('Lohnt es sich, ') && bot.includes('vor dem NPC-Verkauf zu verbessern?') && bot.includes('vor dem NPC-Verkauf zu kombinieren?') && bot.includes("audit('merchant_economy_question'"), '2.14.19 pre-sale economics questions missing');
ok(bot.includes('function v21419BreakLoop') && bot.includes("audit('merchant_loop_break'") && bot.includes("audit('merchant_loop_recovered'"), '2.14.19 loop breaker missing');
ok(bot.includes('S.sellCandidateCache21419') && bot.includes('until:now+5000'), '2.14.19 economy state cache missing');
ok(bot.includes('unattributedMs') && bot.includes('data.phases.plannerRecipe={calls:0'), '2.14.19 profiler attribution/zero phase missing');
"""
verify=verify.replace(needle,needle+extra,1)
write('scripts/verify-release.js',verify)

smoke18=read('scripts/smoke-21418-merchant-stability-performance.js')
smoke18=smoke18.replace("assert.equal(version.version,'2.14.18');assert.equal(version.dashboardVersion,'2.14.18');","assert.equal(version.version,'2.14.19');assert.equal(version.dashboardVersion,'2.14.19');")
smoke18=smoke18.replace("bot.slice(bot.lastIndexOf('v290InventoryPressureTick=function(){'),bot.indexOf('function v21418ConfigProvenance'))","bot.slice(bot.indexOf('v290InventoryPressureTick=function(){',bot.indexOf('function v21418GuardedLoot')),bot.indexOf('function v21418ConfigProvenance'))")
write('scripts/smoke-21418-merchant-stability-performance.js',smoke18)

smoke19=r'''#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs');
const bot=fs.readFileSync('bot.js','utf8'),version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.19');assert.equal(version.dashboardVersion,'2.14.19');
const cm=bot.match(/var FEATURE_CONTRACT\s*=\s*(\[[\s\S]*?\]);/);assert(cm);const contract=JSON.parse(cm[1].replace(/'/g,'"'));
for(const f of ['merchant-route-owner','merchant-exchange-capacity-gate','merchant-capacity-state-backoff','merchant-presale-economics-questions','merchant-loop-breaker','merchant-economy-state-cache'])assert.ok(contract.includes(f),'missing feature '+f);
assert.ok(bot.includes('function v21419RoutePriority')&&bot.includes('function v21419AcquireRoute')&&bot.includes('merchant_route_preempted')&&bot.includes("stop('smart')"),'route ownership/preemption missing');
assert.ok(bot.includes('function v21419ExchangeCapacityBlocked')&&bot.includes('merchant_exchange_capacity_deferred')&&bot.includes("Promise.resolve(smart_move('exchange'))"),'exchange capacity/direct route guard missing');
const cap=bot.slice(bot.indexOf('function v21419CapacityCore'),bot.indexOf('function v21419BreakLoop'));
assert.ok(cap.includes('retryMs=repeats>0?600000:60000')&&cap.includes('v273StoreTrashBankTick()')&&cap.includes('v273SellTrashTick()'),'capacity safe-release/backoff missing');
assert.ok(!cap.includes('v273ExchangeTick()')&&!cap.includes('merchantStandTick()')&&!cap.includes('v2149DiscoveryTick()'),'capacity hard state must not perform optional exchange/stand/discovery');
assert.ok(bot.includes('function v21419PreSaleQuestions')&&bot.includes('vor dem NPC-Verkauf zu verbessern?')&&bot.includes('vor dem NPC-Verkauf zu kombinieren?')&&bot.includes('netNpcDelta'),'pre-sale economics questions missing');
assert.ok(bot.includes('function v21419BreakLoop')&&bot.includes('merchant_loop_break')&&bot.includes('merchant_loop_recovered')&&bot.includes('v21419StateLoopTick'),'loop breaker missing');
assert.ok(bot.includes('S.bankBackoff21419')&&bot.includes('until:clock()+600000'),'bank full backoff missing');
assert.ok(bot.includes('S.sellCandidateCache21419')&&bot.includes('until:now+5000'),'economy state cache missing');
assert.ok(bot.includes('data.unattributedMs')&&bot.includes('data.phases.plannerRecipe={calls:0'),'profiler unattributed/zero planner phase missing');
console.log('2.14.19 Merchant recovery / economics smoke OK');
'''
write('scripts/smoke-21419-merchant-recovery-economics.js',smoke19)

print('Prepared 2.14.19 source patch')
