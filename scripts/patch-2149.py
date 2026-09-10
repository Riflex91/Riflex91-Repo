#!/usr/bin/env python3
from pathlib import Path
import json

BOT=Path('bot.js')
text=BOT.read_text(encoding='utf-8')
if "var VERSION = '2.14.8';" not in text:
    raise SystemExit('expected 2.14.8 VERSION marker missing')
if '2.14.9 Merchant bank warehouse + active discovery' in text:
    raise SystemExit('2.14.9 block already present')

text=text.replace('Adventure Land • AiO Bot 2.14.8 | 2026-09-10','Adventure Land • AiO Bot 2.14.9 | 2026-09-10',1)
text=text.replace("var VERSION = '2.14.8';","var VERSION = '2.14.9';",1)
text=text.replace('merchantStandAutomation: false,','merchantStandAutomation: true,',1)

marker='  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.\n'
if marker not in text:
    raise SystemExit('final API marker missing')

block=r'''  // ---------------------------------------------------------------------------
  // 2.14.9 Merchant bank warehouse + active discovery + productive idle work.
  // ---------------------------------------------------------------------------
  ['merchant-bank-warehouse','merchant-active-discovery','merchant-gathering'].forEach(function(f){if(FEATURE_CONTRACT.indexOf(f)<0)FEATURE_CONTRACT.push(f);});

  var V2149_BANK_KEY='merchantBankSnapshot2149';
  var V2149_DISCOVERY_KEY='worldDiscovery2149';
  var v2149BankSnapshot=read(V2149_BANK_KEY,null);
  if(!v2149BankSnapshot||Number(v2149BankSnapshot.schema)!==1)v2149BankSnapshot={schema:1,gameVersion:'',at:0,items:[],hash:''};
  var v2149Discovery=read(V2149_DISCOVERY_KEY,null);
  if(!v2149Discovery||Number(v2149Discovery.schema)!==1)v2149Discovery={schema:1,gameVersion:'',lastFullSweepAt:0,knowledge:{},recent:[]};
  if(!v2149Discovery.knowledge||typeof v2149Discovery.knowledge!=='object')v2149Discovery.knowledge={};
  if(!Array.isArray(v2149Discovery.recent))v2149Discovery.recent=[];

  function v2149TinyHash(v){var s='';try{s=JSON.stringify(v);}catch(e){s=String(v||'');}var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return (h>>>0).toString(16);}
  function v2149BankMap(){return String(character.map||'').indexOf('bank')===0;}
  function v2149LocalCount(name,level){var lv=Math.max(0,Number(level)||0),n=0;(character.items||[]).forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});return n;}
  function v2149FindLocal(name,level){var lv=Math.max(0,Number(level)||0);for(var i=0;i<(character.items||[]).length;i++){var it=character.items[i];if(it&&it.name===name&&(Number(it.level)||0)===lv)return i;}return -1;}
  function v2149SnapshotRows(){return Array.isArray(v2149BankSnapshot&&v2149BankSnapshot.items)?v2149BankSnapshot.items:[];}
  function v2149BankCount(name,level){var lv=Math.max(0,Number(level)||0),n=0;v2149SnapshotRows().forEach(function(it){if(it&&it.name===name&&(Number(it.level)||0)===lv)n+=Number(it.q)||1;});return n;}
  function v2149BankSlotsFor(name,level,qtyNeed){var lv=Math.max(0,Number(level)||0),left=Math.max(0,Number(qtyNeed)||0),slots=0;v2149SnapshotRows().some(function(it){if(!it||it.name!==name||(Number(it.level)||0)!==lv||it.l||it.p)return false;slots++;left-=Number(it.q)||1;return left<=0;});return left<=0?slots:Infinity;}
  function v2149RefreshBankSnapshot(force){
    if(character.ctype!=='merchant'||!C.merchantManageBank||!v2149BankMap()||!character.bank)return v2149BankSnapshot;
    var now=clock();if(!force&&now-Number(v2149BankSnapshot.at||0)<1100)return v2149BankSnapshot;
    var rows=[];Object.keys(character.bank||{}).sort().forEach(function(pack){if(!/^items\d+$/.test(pack)||!Array.isArray(character.bank[pack]))return;character.bank[pack].forEach(function(it,index){if(!it||!it.name)return;rows.push({pack:pack,index:index,name:it.name,level:Math.max(0,Number(it.level)||0),q:Number(it.q)||1,l:!!it.l,p:!!it.p});});});
    var hash=v2149TinyHash(rows.map(function(x){return [x.pack,x.index,x.name,x.level,x.q,x.l?1:0,x.p?1:0];})),oldHash=String(v2149BankSnapshot.hash||'');
    v2149BankSnapshot={schema:1,gameVersion:String(v273GameVersion()||''),at:now,items:rows,hash:hash};S.bankScanAt=now;write(V2149_BANK_KEY,v2149BankSnapshot);
    if(hash!==oldHash){audit('merchant_bank_snapshot','Bankbestand als Merchant-Warehouse synchronisiert',{items:rows.length,gameVersion:v2149BankSnapshot.gameVersion});S.times.merchantPlan=0;S.recipeAnalysis=null;}
    return v2149BankSnapshot;
  }

  var v2149AggregateBase=v278AggregateMaterials;
  v278AggregateMaterials=function(){
    var agg=v2149AggregateBase(),bankExact={},bankByName={};agg.exact=agg.exact||{};agg.byName=agg.byName||{};
    v2149SnapshotRows().forEach(function(it){if(!it||!it.name)return;var q=Number(it.q)||1,k=v278MaterialKey(it.name,it.level);bankExact[k]=(bankExact[k]||0)+q;bankByName[it.name]=(bankByName[it.name]||0)+q;agg.exact[k]=(agg.exact[k]||0)+q;agg.byName[it.name]=(agg.byName[it.name]||0)+q;});
    agg.bank={at:Number(v2149BankSnapshot.at)||0,gameVersion:v2149BankSnapshot.gameVersion||'',exact:bankExact,byName:bankByName,items:v2149SnapshotRows().slice()};return agg;
  };
  var v2149OwnedCountBase=v273OwnedCount;
  v273OwnedCount=function(name){var total=Number(v2149OwnedCountBase(name))||0;v2149SnapshotRows().forEach(function(it){if(it&&it.name===name)total+=Number(it.q)||1;});return total;};

  function v2149ActiveMoveLock(){var lock=S.moveArbiter2145;if(lock&&typeof v2145MoveLockActive==='function'&&v2145MoveLockActive(lock))return lock;return null;}
  function v2149HigherRoute(priority){var lock=v2149ActiveMoveLock();return !!(lock&&Number(lock.priority||v2145MovePriority(lock.kind))>Number(priority||0));}
  function v2149CanStartBankWork(){return !v2149HigherRoute(v2145MovePriority('bank'));}

  var v2149CleanupBase=v2148BankCleanupTick;
  v2148BankCleanupTick=function(){
    if(!v2149CanStartBankWork()){
      if(S.merchantBankCleanup2148){audit('merchant_bank_cleanup_deferred','Bankbereinigung gibt einer höher priorisierten Merchant-Route Vorrang',{activeKind:(v2149ActiveMoveLock()||{}).kind||''},'info');S.merchantBankCleanup2148=null;S.times.bankCleanupRetry2148=clock()+10000;}
      return false;
    }
    return v2149CleanupBase();
  };

  function v2149BankWantMissing(w){return Math.max(0,(Number(w.q)||1)-v2149LocalCount(w.name,w.level));}
  function v2149BankRetrieveFinish(kind,message,level){var st=S.merchantBankRetrieve2149;if(!st)return false;if(st.meta&&st.meta.recipient&&st.reason==='gear'){S.pendingBankGear2149={recipient:st.meta.recipient,name:st.wants[0].name,level:st.wants[0].level,at:clock()};}audit(kind,message,{reason:st.reason,wants:st.wants,attempts:Number(st.attempts)||0,durationMs:clock()-Number(st.startedAt||clock())},level||'info');S.merchantBankRetrieve2149=null;S.times.merchantPlan=0;return false;}
  function v2149BankRetrieveTick(){
    var st=S.merchantBankRetrieve2149;if(!st)return false;var now=clock();
    if(v2149HigherRoute(90)){st.startedAt=now;return false;}
    if(now-Number(st.startedAt||now)>20000||Number(st.attempts||0)>=12){S.times.bankRetrieveRetry2149=now+15000;return v2149BankRetrieveFinish('merchant_bank_retrieve_timeout','Bankentnahme kontrolliert freigegeben; späterer Neuversuch','warning');}
    if(v2149BankWantMissing(st.wants[0])<=0&&st.wants.every(function(w){return v2149BankWantMissing(w)<=0;}))return v2149BankRetrieveFinish('merchant_bank_retrieve_done','Geplante Bankentnahme abgeschlossen');
    if(!v2149BankMap()){
      if(!v2149CanStartBankWork())return false;S.status=(C.language==='de'?'Bankentnahme · ':'Bank retrieve · ')+st.reason;S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},C.language==='de'?'Geplante Bankentnahme':'Planned bank retrieve',{kind:'merchant-bank-retrieve',forceAfter:9000});
    }
    if(character.moving||S.moveInFlight||v2147BankExitActive())return true;if(now<Number(st.waitUntil||0))return true;
    v2149RefreshBankSnapshot(true);
    var want=null;for(var wi=0;wi<st.wants.length;wi++)if(v2149BankWantMissing(st.wants[wi])>0){want=st.wants[wi];break;}if(!want)return v2149BankRetrieveFinish('merchant_bank_retrieve_done','Geplante Bankentnahme abgeschlossen');
    var row=v2149SnapshotRows().find(function(it){return it&&!it.l&&!it.p&&it.name===want.name&&(Number(it.level)||0)===(Number(want.level)||0);});
    if(!row){S.times.bankRetrieveRetry2149=now+Math.max(30000,Number(C.merchantBankRecheckSeconds||180)*1000);return v2149BankRetrieveFinish('merchant_bank_retrieve_miss','Geplanter Bankbestand war nicht mehr vorhanden; Snapshot aktualisiert','warning');}
    if(freeSlots()<1)return v2149BankRetrieveFinish('merchant_bank_retrieve_no_space','Bankentnahme gestoppt: kein freier Inventarplatz','warning');
    if(typeof bank_retrieve!=='function')return v2149BankRetrieveFinish('merchant_bank_retrieve_unavailable','bank_retrieve ist nicht verfügbar','warning');
    var started=action('Geplante Bankentnahme '+row.name,function(){if(!v2149BankMap()||character.moving||S.moveInFlight||v2147BankExitActive())throw Error('bank_location_changed');return bank_retrieve(row.pack,row.index);},'bank-retrieve-2149:'+v278MaterialKey(row.name,row.level),1000);
    if(started){st.attempts=Number(st.attempts||0)+1;st.waitUntil=now+2700;S.status=(C.language==='de'?'Hole ':'Retrieve ')+v273Name(row.name)+(row.level?' +'+row.level:'')+(C.language==='de'?' aus dem Warehouse':' from warehouse');S.mode='Merchant · Bank';}
    return true;
  }
  function v2149RequestBank(reason,wants,meta,allowUnknown){
    if(character.ctype!=='merchant'||!C.merchantManageBank||S.merchantBankRetrieve2149||S.merchantBankCleanup2148||clock()<Number(S.times.bankRetrieveRetry2149||0))return false;
    wants=(wants||[]).map(function(w){return {name:String(w&&w.name||''),level:Math.max(0,Number(w&&w.level)||0),q:Math.max(1,Number(w&&w.q)||1)};}).filter(function(w){return w.name&&v2149BankWantMissing(w)>0;});if(!wants.length)return false;
    if(!v2149CanStartBankWork())return false;
    var known=true,needSlots=0;wants.forEach(function(w){var missing=v2149BankWantMissing(w),bank=v2149BankCount(w.name,w.level),slots=v2149BankSlotsFor(w.name,w.level,missing);if(bank<missing)known=false;if(isFinite(slots))needSlots+=slots;});
    if(!known&&!allowUnknown)return false;if(known&&freeSlots()<Math.max(1,needSlots))return false;if(!known&&freeSlots()<1)return false;
    S.merchantBankRetrieve2149={reason:String(reason||'logistics'),wants:wants,meta:meta||{},startedAt:clock(),attempts:0,waitUntil:0,allowUnknown:!!allowUnknown};audit('merchant_bank_retrieve_plan','Konkrete Bankentnahme geplant',{reason:reason,wants:wants,knownSnapshot:known,snapshotAt:Number(v2149BankSnapshot.at)||0});return v2149BankRetrieveTick();
  }

  v273RetrieveMaterialFromBankTick=function(recipe){if(character.ctype!=='merchant'||!C.merchantManageBank||!recipe)return false;var wants=(recipe.items||[]).filter(function(x){return v2149LocalCount(x.name,x.level)<Number(x.q||1);});if(!wants.length)return false;return v2149RequestBank('craft',wants,{recipe:recipe.id||recipe.output||''},true);};

  function v2149LocalUpgradeExists(){return (character.items||[]).some(function(it){return !!(it&&!it.l&&!it.p&&GD.items&&GD.items[it.name]&&GD.items[it.name].upgrade&&(Number(it.level)||0)<Number(C.merchantUpgradeMax)&&v273GroupUtility(it)>=0);});}
  function v2149UpgradeBankCandidate(){if(v2149LocalUpgradeExists())return null;var best=null;v2149SnapshotRows().forEach(function(row){if(!row||row.l||row.p||['bank','sell','exchange'].indexOf(v2147ItemPolicy(row.name))>=0)return;var d=GD.items&&GD.items[row.name]||{},probe={name:row.name,level:row.level,q:row.q};if(!d.upgrade||row.level>=Number(C.merchantUpgradeMax)||v273GroupUtility(probe)<0)return;if(!best||row.level<best.level)best=row;});return best;}
  var v2149UpgradeBase=v273UpgradeTick;
  v273UpgradeTick=function(){var row=v2149UpgradeBankCandidate();if(row&&v2149RequestBank('upgrade',[{name:row.name,level:row.level,q:1}],{},false))return true;return v2149UpgradeBase();};

  function v2149CompoundBankCandidate(){var groups={};function add(name,level,src,q){var k=v278MaterialKey(name,level);if(!groups[k])groups[k]={name:name,level:Math.max(0,Number(level)||0),local:0,bank:0};groups[k][src]+=Number(q)||1;}(character.items||[]).forEach(function(it){if(!it||it.l||it.p)return;var d=GD.items&&GD.items[it.name]||{};if(!d.compound||v273GroupUtility(it)<0)return;add(it.name,it.level,'local',it.q);});v2149SnapshotRows().forEach(function(it){if(!it||it.l||it.p||['bank','sell','exchange'].indexOf(v2147ItemPolicy(it.name))>=0)return;var d=GD.items&&GD.items[it.name]||{},probe={name:it.name,level:it.level,q:it.q};if(!d.compound||v273GroupUtility(probe)<0||it.level>=v273EffectiveCompoundMax(it.name))return;add(it.name,it.level,'bank',it.q);});return Object.keys(groups).map(function(k){return groups[k];}).filter(function(g){return g.local<3&&g.local+g.bank>=3&&v273OwnedCount(g.name)-v273DesiredGroupCopies(g.name)>=2;}).sort(function(a,b){return a.level-b.level||a.name.localeCompare(b.name);})[0]||null;}
  var v2149CompoundBase=v273CompoundTick;
  v273CompoundTick=function(){var g=v2149CompoundBankCandidate();if(g&&v2149RequestBank('compound',[{name:g.name,level:g.level,q:3}],{},false))return true;return v2149CompoundBase();};

  function v2149ExchangeBankCandidate(){var groups={};(character.items||[]).forEach(function(it){if(it&&it.name)groups[it.name]=(groups[it.name]||0)+(Number(it.q)||1);});var rows={};v2149SnapshotRows().forEach(function(it){if(!it||it.l||it.p)return;var p=v2147ItemPolicy(it.name),d=GD.items&&GD.items[it.name]||{};if((p!=='auto'&&p!=='exchange')||!(d.e||d.exchange||d.exchanges))return;(rows[it.name]||(rows[it.name]=[])).push(it);});var names=Object.keys(rows).sort(function(a,b){return (v2147ItemPolicy(b)==='exchange'?1:0)-(v2147ItemPolicy(a)==='exchange'?1:0)||a.localeCompare(b);});for(var i=0;i<names.length;i++){var name=names[i],d=GD.items[name]||{},need=Number(d.e)||Number(d.exchange)||1,local=Number(groups[name]||0),bank=rows[name].reduce(function(n,x){return n+(Number(x.q)||1);},0);if(local<need&&local+bank>=need)return {name:name,level:Number(rows[name][0].level)||0,q:need};}return null;}
  var v2149ExchangeBase=v273ExchangeTick;
  v273ExchangeTick=function(){var x=v2149ExchangeBankCandidate();if(x&&v2149RequestBank('exchange',[x],{},false))return true;return v2149ExchangeBase();};

  function v2149BankGearCandidate(){if(!C.merchantBalanceFarmers)return null;var fs=farmerReports().filter(function(r){return r&&r.active!==false&&!r.rip&&Number(r.free||0)>0;}).sort(function(a,b){return v273FarmerStrength(a)-v273FarmerStrength(b)||a.name.localeCompare(b.name);});var best=null;for(var fi=0;fi<fs.length;fi++){var r=fs[fi];for(var bi=0;bi<v2149SnapshotRows().length;bi++){var it=v2149SnapshotRows()[bi];if(!it||it.l||it.p||['bank','sell','exchange'].indexOf(v2147ItemPolicy(it.name))>=0||!v273ClassCanUse(it.name,r.ctype))continue;var slots=v273EquipSlotsForItem(it.name);if(!slots.length)continue;var probe={name:it.name,level:it.level,q:it.q},candidate=v273ItemScoreForClass(probe,r.ctype),scores=slots.map(function(k){var si=r.slots&&r.slots[k];return si?v273ItemScoreForClass(si,r.ctype):-1e12;}),current=Math.min.apply(Math,scores);if(current<-1e11||candidate>current+Math.max(20,Math.abs(current)*.04)){var row={farmer:r,item:it,candidate:candidate,current:current};if(!best||candidate-current>best.candidate-best.current)best=row;}}}return best;}
  function v2149PendingBankGearDeliveryTick(){var p=S.pendingBankGear2149;if(!p)return false;if(clock()-Number(p.at||0)>120000){S.pendingBankGear2149=null;return false;}var idx=v2149FindLocal(p.name,p.level);if(idx<0){S.pendingBankGear2149=null;return false;}var r=farmerReports().find(function(x){return x&&x.name===p.recipient&&x.active!==false&&!x.rip;});if(!r){S.pendingBankGear2149=null;return false;}var lp=localPlayer(r.name);if(lp&&dist(character,lp)<=260&&typeof send_item==='function'){S.status='Bank-Ausrüstung an '+r.name+': '+v273Name(p.name);S.mode='Merchant · Ausrüstung';var started=action('Bank-Ausrüstung verteilen '+p.name,function(){return send_item(r.name,idx,(character.items[idx]&&character.items[idx].q)||1);},'gear-bank-send:'+r.name,2200);if(started)S.pendingBankGear2149=null;return started;}S.status='Bank-Ausrüstung an '+r.name+' liefern';S.mode='Merchant · Ausrüstung';return moveToGoal(r,'Bank-Ausrüstung liefern',{kind:'distribution',tolerance:90,forceAfter:7000});}
  var v2149DistributeBase=v273DistributeGearTick;
  v273DistributeGearTick=function(){if(v2149PendingBankGearDeliveryTick())return true;var local=v273BestGearRecipient();if(local)return v2149DistributeBase();var b=v2149BankGearCandidate();if(b&&v2149RequestBank('gear',[{name:b.item.name,level:b.item.level,q:1}],{recipient:b.farmer.name},false))return true;return false;};

  function v2149ExplicitBankDispositionTick(){if(character.ctype!=='merchant')return false;var row=v2149SnapshotRows().find(function(it){if(!it||it.l||it.p)return false;var p=v2147ItemPolicy(it.name);if(p==='sell')return !!C.merchantSellTrashToNpc;if(p==='exchange'){var d=GD.items&&GD.items[it.name]||{},need=Number(d.e)||Number(d.exchange)||1;return !!C.merchantAutoExchange&&v2149BankCount(it.name,it.level)>=need;}return false;});if(!row)return false;var p=v2147ItemPolicy(row.name),q=p==='exchange'?(Number((GD.items[row.name]||{}).e)||Number((GD.items[row.name]||{}).exchange)||1):1;return v2149RequestBank('explicit-'+p,[{name:row.name,level:row.level,q:q}],{},false);}

  var v2149EnsureScrollPrevious=v273EnsureScroll;
  v273EnsureScroll=function(prefix,item){
    var name=v273ScrollName(prefix,item),idx=slot(name);if(idx>=0)return idx;if(!(typeof buy==='function'&&GD.items&&GD.items[name]))return -1;
    if(freeSlots()<2){S.times['buy-scroll:'+name]=clock()+15000;S.times.inventoryPressure=0;S.status='Mindestens zwei freie Plätze vor Scroll-Kauf herstellen';S.mode='Merchant · Inventar';return -1;}
    var price=Number(GD.items[name].g||0);if(character.gold-price<=C.merchantBankGoldReserve)return -1;var dest=v282VendorForScroll(name);
    if(dest&&!v2145VendorReady(dest)){S.status='Zum Scroll-Händler für '+name;S.mode='Merchant · Einkauf';if(character.map!==dest.map||dist(character,dest)>75)moveToGoal(dest,'Scroll-Händler '+name,{kind:'merchant-scroll-vendor',forceAfter:9000});return -1;}
    if(character.moving||S.moveInFlight)return -1;
    action('Scroll kaufen '+name,function(){if(freeSlots()<2)throw Error('buy_cant_space_preflight');return buy(name,1);},'buy-scroll:'+name,1800);return -1;
  };

  function v2149BankScanDue(){if(character.ctype!=='merchant'||!C.merchantManageBank)return false;var gv=String(v273GameVersion()||''),age=clock()-Number(v2149BankSnapshot.at||0);return !v2149BankSnapshot.at||v2149BankSnapshot.gameVersion!==gv||age>21600000;}
  function v2149BankInventoryScanTick(){if(!v2149BankScanDue()||clock()<Number(S.times.bankSnapshotRetry2149||0))return false;if(v2149BankMap()){v2149RefreshBankSnapshot(true);S.times.bankSnapshotRetry2149=clock()+21600000;return false;}if(!v2149CanStartBankWork())return false;S.status='Bank-Warehouse inventarisieren';S.mode='Merchant · Bank';return moveToGoal({map:'bank',x:0,y:0},'Bank-Warehouse inventarisieren',{kind:'bank-snapshot',forceAfter:9000});}

  function v2149Point(v){if(Array.isArray(v)&&v.length>=2&&isFinite(Number(v[0]))&&isFinite(Number(v[1])))return {x:Number(v[0]),y:Number(v[1])};if(v&&isFinite(Number(v.x))&&isFinite(Number(v.y)))return {x:Number(v.x),y:Number(v.y)};return null;}
  function v2149PolygonCenter(poly){if(!Array.isArray(poly)||!poly.length)return null;var x=0,y=0,n=0;poly.forEach(function(p){p=v2149Point(p);if(p){x+=p.x;y+=p.y;n++;}});return n?{x:x/n,y:y/n}:null;}
  function v2149NpcDefinition(id){var d=GD.npcs&&GD.npcs[id]||{};return {id:id,name:safeString(d.name||'',120),role:safeString(d.role||'',120),items:Array.isArray(d.items)?d.items.slice(0,40):[],quest:safeString(d.quest||'',120),says:Array.isArray(d.says)?d.says.slice(0,8).map(function(x){return safeString(x,120);}):safeString(d.says||'',240),interaction:safeString(d.interaction||'',400),sideInteraction:safeString(d.side_interaction||'',400)};}
  function v2149NpcClass(def){var role=String(def.role||def.id||'').toLowerCase(),service='dialogue',confidence=.65;if(def.items&&def.items.length){service='shop';confidence=.98;}if(def.quest){service='quest/exchange';confidence=.95;}if(/bank/.test(role))service='bank';else if(/upgrade/.test(role))service='upgrade';else if(/compound/.test(role))service='compound';else if(/craft/.test(role))service='crafting';else if(/exchange|collector/.test(role))service='exchange/quest';else if(/transport|ferry|transporter/.test(role))service='travel';else if(/lock|scrollsmith|destat/.test(role))service='item-maintenance';else if(/merchant|shop|items|potions|scrolls/.test(role))service='shop';return {service:service,confidence:confidence,evidence:[def.role?'role:'+def.role:'',def.items&&def.items.length?'items:'+def.items.length:'',def.quest?'quest:'+def.quest:'',def.interaction?'dialogue':''].filter(Boolean)};}
  function v2149ObjectClass(type){var t=String(type||'').toLowerCase(),service='world-object',confidence=.65;if(t==='fishing'||t==='mining')return {service:'gathering:'+t,confidence:.99,evidence:['zone:'+t]};if(/newyear|tree/.test(t))service='seasonal-interaction';else if(/lever|door|transport/.test(t))service='movement-interaction';else if(/mainframe|computer|machine|terminal/.test(t))service='machine';else if(/statue|poof|destroy/.test(t))service='potentially-destructive';return {service:service,confidence:confidence,evidence:['type:'+t]};}
  function v2149DiscoveryCatalog(){var out=[],seen={};Object.keys(GD.maps||{}).sort().forEach(function(map){var m=GD.maps[map]||{};if(m.pvp===true||m.instance===true)return;(m.npcs||[]).forEach(function(n,ix){var id=String(n&&n.id||n&&n.npc||'');if(!id)return;var p=v2149Point(n.position)||v2149Point(n.positions&&n.positions[0]);var def=v2149NpcDefinition(id),key='npc|'+map+'|'+id;if(!seen[key]){seen[key]=1;out.push({key:key,kind:'npc',id:id,map:map,x:p&&p.x,y:p&&p.y,definition:def,definitionHash:v2149TinyHash(def)});}});(m.quirks||[]).forEach(function(q,ix){var p=Array.isArray(q)?v2149Point(q):v2149Point(q&&q.position),type=Array.isArray(q)?String(q[4]||'quirk'):String(q&&q.type||'quirk'),label=Array.isArray(q)?safeString(q[5]||'',120):safeString(q&&q.label||q&&q.name||'',120),key='quirk|'+map+'|'+type+'|'+ix;if(p)out.push({key:key,kind:'quirk',id:type+':'+ix,type:type,label:label,map:map,x:p.x,y:p.y,definitionHash:v2149TinyHash([type,label])});});(m.machines||[]).forEach(function(q,ix){var p=v2149Point(q&&q.position)||v2149Point(q),type=String(q&&q.type||'machine'),key='machine|'+map+'|'+type+'|'+ix;if(p)out.push({key:key,kind:'machine',id:type+':'+ix,type:type,map:map,x:p.x,y:p.y,definitionHash:v2149TinyHash(q)});});(m.zones||[]).forEach(function(z,ix){var type=String(z&&z.type||'');if(type!=='fishing'&&type!=='mining')return;var p=v2149PolygonCenter(z.polygon)||v2149Point(z.position)||v2149Point(z);if(p)out.push({key:'zone|'+map+'|'+type+'|'+ix,kind:'zone',id:type+':'+ix,type:type,map:map,x:p.x,y:p.y,drop:safeString(z.drop||'',80),definitionHash:v2149TinyHash(z)});});});return out.slice(0,320);}
  function v2149DiscoveryDue(){if(character.ctype!=='merchant'||!C.merchantExploreWhenIdle)return false;var gv=String(v273GameVersion()||'');return !!(S.explorer&&S.explorer.force)||v2149Discovery.gameVersion!==gv||clock()-Number(v2149Discovery.lastFullSweepAt||0)>43200000;}
  function v2149BeforeProbe(){return {at:clock(),level:Number(character.level)||0,xp:Number(character.xp)||0,gold:Number(character.gold)||0,map:String(character.map||''),x:Math.round(Number(character.x)||0),y:Math.round(Number(character.y)||0),inventory:(character.items||[]).filter(Boolean).map(function(i){return [i.name,Number(i.level)||0,Number(i.q)||1];}).slice(0,48),conditions:Object.keys(character.s||character.conditions||{}).sort().slice(0,40)};}
  function v2149RecordDiscovery(entry,probe){if(!entry)return false;var def=entry.kind==='npc'?(entry.definition||v2149NpcDefinition(entry.id)):null,classification=entry.kind==='npc'?v2149NpcClass(def):v2149ObjectClass(entry.type||entry.id),record={at:clock(),gameVersion:String(v273GameVersion()||''),kind:entry.kind,id:entry.id,map:entry.map,x:isFinite(entry.x)?Math.round(entry.x):null,y:isFinite(entry.y)?Math.round(entry.y):null,definition:def,type:entry.type||'',label:entry.label||'',drop:entry.drop||'',classification:classification,probe:probe||null,definitionHash:entry.definitionHash||v2149TinyHash(def||entry)},old=v2149Discovery.knowledge[entry.key],novel=!old||old.definitionHash!==record.definitionHash||!sameJSON(old.classification,record.classification);v2149Discovery.knowledge[entry.key]=record;v2149Discovery.recent=(v2149Discovery.recent||[]).concat([record]).slice(-40);write(V2149_DISCOVERY_KEY,v2149Discovery);var sample={at:record.at,kind:'world-discovery',map:record.map,x:record.x,y:record.y,target:{kind:record.kind,id:record.id,type:record.type,classification:record.classification},probe:record.probe,novel:novel};S.explorer.recentSamples=(S.explorer.recentSamples||[]).concat([sample]).slice(-20);if(novel){audit('merchant_discovery_novel','Neue oder geänderte Weltfunktion beobachtet',{kind:record.kind,id:record.id,map:record.map,classification:record.classification});v290CloudSyncTick(true);v290BrainTick('world_discovery',false);}return novel;}
  function v2149SafeProbe(entry){if(!entry)return false;var before=v2149BeforeProbe();if((entry.id==='newyear_tree'||entry.type==='newyear_tree')&&typeof interact==='function'&&freeSlots()>=2){var started=action('Discovery: New Year Tree',function(){return Promise.resolve(interact('newyear_tree')).then(function(result){v2149RecordDiscovery(entry,{safe:true,function:'interact:newyear_tree',ok:true,result:safeString(JSON.stringify(result),500),before:before,after:v2149BeforeProbe()});return result;},function(e){v2149RecordDiscovery(entry,{safe:true,function:'interact:newyear_tree',ok:false,error:reason(e),before:before,after:v2149BeforeProbe()});throw e;});},'discovery:newyear_tree',15000);return started;}if(entry.kind==='machine'&&/mainframe|computer|terminal/i.test(String(entry.type||entry.id))&&String(character.map)==='cyberland'&&typeof mainframe_command==='function'){return action('Discovery: Mainframe hello',function(){return Promise.resolve(mainframe_command('hello')).then(function(result){v2149RecordDiscovery(entry,{safe:true,function:'mainframe_command:hello',ok:true,result:safeString(JSON.stringify(result),500),before:before,after:v2149BeforeProbe()});return result;});},'discovery:mainframe',30000);}return false;}
  function v2149DiscoveryTick(){if(!v2149DiscoveryDue()&&!S.discovery2149)return false;var now=clock(),gv=String(v273GameVersion()||'');if(!S.discovery2149){var q=v2149DiscoveryCatalog();q.sort(function(a,b){var ao=v2149Discovery.knowledge[a.key],bo=v2149Discovery.knowledge[b.key],an=!ao||ao.definitionHash!==a.definitionHash,bn=!bo||bo.definitionHash!==b.definitionHash;return (bn?1:0)-(an?1:0)||(a.map===character.map?-1:b.map===character.map?1:0)||a.key.localeCompare(b.key);});S.discovery2149={gameVersion:gv,queue:q,index:0,startedAt:now,targetKey:'',targetSince:0};audit('merchant_discovery_start','Gezielte Active-Learning-Welterkundung gestartet',{gameVersion:gv,targets:q.length,afterGameUpdate:v2149Discovery.gameVersion!==gv});}
    var st=S.discovery2149;if(st.index>=st.queue.length){v2149Discovery.gameVersion=gv;v2149Discovery.lastFullSweepAt=now;write(V2149_DISCOVERY_KEY,v2149Discovery);S.discovery2149=null;if(S.explorer)S.explorer.force=false;audit('merchant_discovery_done','Active-Learning-Welterkundung abgeschlossen',{gameVersion:gv,known:Object.keys(v2149Discovery.knowledge).length});return false;}
    var e=st.queue[st.index];if(st.targetKey!==e.key){st.targetKey=e.key;st.targetSince=now;}if(now-Number(st.targetSince||now)>60000){v2149RecordDiscovery(e,{safe:true,ok:false,error:'navigation_timeout'});st.index++;st.targetKey='';return true;}if(!isFinite(e.x)||!isFinite(e.y)){v2149RecordDiscovery(e,null);st.index++;st.targetKey='';return true;}if(character.map===e.map&&dist(character,e)<=170){var live=null;if(e.kind==='npc')live=entities().find(function(x){return x&&x.type==='npc'&&(x.npc===e.id||x.id===e.id);})||null;v2149RecordDiscovery(e,{safe:true,ok:true,visible:!!live,live:live?{id:live.id,npc:live.npc,role:live.role||'',name:live.name||''}:null});v2149SafeProbe(e);st.index++;st.targetKey='';S.status='Untersuche '+(e.kind==='npc'?v273Name(e.id):(e.label||e.type||e.id));S.mode='Merchant · Discovery';return true;}S.status='Active Learning · '+e.kind+' '+e.id;S.mode='Merchant · Discovery';return moveToGoal({map:e.map,x:e.x,y:e.y},'Weltfunktion untersuchen',{kind:'explore',tolerance:120,forceAfter:15000});}

  function v2149GatherZones(){return v2149DiscoveryCatalog().filter(function(x){return x.kind==='zone'&&(x.type==='fishing'||x.type==='mining');});}
  function v2149NpcSeller(itemName){var defs=GD.npcs||{};for(var id in defs){var items=defs[id]&&defs[id].items;if(!Array.isArray(items)||items.indexOf(itemName)<0)continue;var p=null;try{if(typeof find_npc==='function')p=find_npc(id);}catch(e){}if(p)return {id:id,map:p.map||character.map,x:Number(p.x)||0,y:Number(p.y)||0};var c=v2149DiscoveryCatalog().find(function(x){return x.kind==='npc'&&x.id===id;});if(c)return {id:id,map:c.map,x:c.x,y:c.y};}return null;}
  function v2149GatherToolAvailable(kind){var tool=kind==='fishing'?'rod':'pickaxe';return v2149FindLocal(tool,0)>=0||v2149BankCount(tool,0)>0||!!v2149NpcSeller(tool);}
  function v2149GatherDue(){if(character.ctype!=='merchant'||Number(character.level)<16||Number(character.mp)<120||freeSlots()<2||clock()<Number(S.times.gatherNext2149||0))return false;var zones=v2149GatherZones();return zones.some(function(z){return v2149GatherToolAvailable(z.type);});}
  function v2149RestoreGatherMainhand(st){if(!st||!st.oldMainhand||!st.oldMainhand.name)return false;var cur=character.slots&&character.slots.mainhand;if(cur&&cur.name===st.oldMainhand.name&&(Number(cur.level)||0)===(Number(st.oldMainhand.level)||0))return false;var idx=v2149FindLocal(st.oldMainhand.name,st.oldMainhand.level);if(idx>=0&&typeof equip==='function')return action('Merchant-Werkzeug ablegen',function(){return equip(idx);},'gather-restore-mainhand',1600);return false;}
  function v2149GatherFinish(st){v2149RestoreGatherMainhand(st);S.merchantGather2149=null;S.times.gatherNext2149=clock()+2700000;S.times.idleWork2149=clock()+1800;audit('merchant_gather_session','Merchant-Gathering-Session beendet',{kind:st&&st.kind||'',attempts:Number(st&&st.attempts)||0,durationMs:clock()-Number(st&&st.startedAt||clock())});return false;}
  function v2149GatherTick(){if(!S.merchantGather2149&&!v2149GatherDue())return false;var now=clock(),st=S.merchantGather2149;if(!st){var zones=v2149GatherZones().filter(function(z){return v2149GatherToolAvailable(z.type);});if(!zones.length)return false;var last=String(S.lastGatherKind2149||''),zone=zones.find(function(z){return z.type!==last;})||zones[0];st=S.merchantGather2149={kind:zone.type,zone:zone,startedAt:now,attempts:0,nextAttemptAt:0,oldMainhand:character.slots&&character.slots.mainhand?{name:character.slots.mainhand.name,level:Number(character.slots.mainhand.level)||0}:null};S.lastGatherKind2149=zone.type;audit('merchant_gather_start','Produktive Merchant-Idle-Session gestartet',{kind:st.kind,map:zone.map});}
    if(now-Number(st.startedAt||now)>300000||Number(st.attempts||0)>=6)return v2149GatherFinish(st);if(Number(character.mp)<120||freeSlots()<2)return v2149GatherFinish(st);var tool=st.kind==='fishing'?'rod':'pickaxe',idx=v2149FindLocal(tool,0),equipped=character.slots&&character.slots.mainhand;
    if(idx<0){if(v2149BankCount(tool,0)>0)return v2149RequestBank('gather-tool',[{name:tool,level:0,q:1}],{kind:st.kind},false);var seller=v2149NpcSeller(tool);if(!seller)return v2149GatherFinish(st);if(!v2145VendorReady(seller)){S.status='Gathering-Werkzeug holen: '+tool;S.mode='Merchant · Gathering';return moveToGoal(seller,'Gathering-Werkzeug kaufen',{kind:'merchant-vendor',tolerance:70,forceAfter:9000});}if(typeof buy==='function'&&freeSlots()>=2&&character.gold-Number((GD.items[tool]||{}).g||0)>C.merchantBankGoldReserve)return action('Gathering-Werkzeug kaufen '+tool,function(){if(freeSlots()<2)throw Error('buy_cant_space_preflight');return buy(tool,1);},'gather-buy:'+tool,2500);return true;}
    if(!equipped||!GD.items[equipped.name]||GD.items[equipped.name].wtype!==tool){if(typeof equip!=='function')return v2149GatherFinish(st);return action('Gathering-Werkzeug ausrüsten '+tool,function(){return equip(idx);},'gather-equip:'+tool,1800);}
    var z=st.zone;if(character.map!==z.map||dist(character,z)>90){S.status=(st.kind==='fishing'?'Zum Angelplatz':'Zur Mine');S.mode='Merchant · Gathering';return moveToGoal({map:z.map,x:z.x,y:z.y},st.kind==='fishing'?'Angelplatz':'Mine',{kind:'merchant-gather',tolerance:70,forceAfter:15000});}
    if(character.moving||S.moveInFlight||now<Number(st.nextAttemptAt||0)||typeof use_skill!=='function')return true;st.nextAttemptAt=now+7000;var kind=st.kind;var started=action(kind==='fishing'?'Angeln':'Minen',function(){return Promise.resolve(use_skill(kind)).then(function(result){st.attempts=Number(st.attempts||0)+1;var sample={at:clock(),kind:'gathering',map:character.map,x:Math.round(character.x||0),y:Math.round(character.y||0),target:{kind:kind,drop:z.drop||''},result:safeString(JSON.stringify(result),500)};S.explorer.recentSamples=(S.explorer.recentSamples||[]).concat([sample]).slice(-20);audit('merchant_gather_result','Gathering-Versuch abgeschlossen',{kind:kind,attempt:st.attempts,result:safeString(JSON.stringify(result),300)});v290BrainTick('merchant_gathering',false);return result;});},'merchant-gather:'+kind,5000);return started||true;}

  function v2149IdleAllowed(){if(character.ctype!=='merchant'||S.merchantBankRetrieve2149||S.merchantBankCleanup2148||S.merchantServiceTarget||clock()<Number(S.times.idleWork2149||0))return false;var lock=v2149ActiveMoveLock();if(lock&&Number(lock.priority||0)>50)return false;if(S.moveInFlight||character.moving)return false;return !/Merchant · (Bank|Einkauf|NPC|Combine|Upgrade|Craft|Exchange|Versorgung|Service|Inventar|Ausrüstung)/.test(String(S.mode||''));}
  function v2149StandYieldDue(){return character.ctype==='merchant'&&(!!S.merchantBankRetrieve2149||v2149BankScanDue()||v2149DiscoveryDue()||v2149GatherDue());}
  var v2149StandBase=merchantStandTick;
  merchantStandTick=function(){if(v2149StandYieldDue()){if(standIsOpen()){S.times.idleWork2149=clock()+1600;closeStand('Idle-Arbeit/Discovery hat Vorrang');return true;}return false;}return v2149StandBase();};

  var v2149BrainStateBase=v290BrainState;
  v290BrainState=function(trigger){var st=v2149BrainStateBase(trigger),recent=(v2149Discovery.recent||[]).slice(-8);st.bankWarehouse={snapshotAt:Number(v2149BankSnapshot.at)||0,gameVersion:v2149BankSnapshot.gameVersion||'',itemSlots:v2149SnapshotRows().length};st.worldDiscovery={gameVersion:v2149Discovery.gameVersion||'',known:Object.keys(v2149Discovery.knowledge||{}).length,lastFullSweepAt:Number(v2149Discovery.lastFullSweepAt)||0,recent:recent.map(function(x){return {at:x.at,kind:x.kind,id:x.id,map:x.map,classification:x.classification,probe:x.probe&&{function:x.probe.function||'',ok:x.probe.ok,error:x.probe.error||''}};})};return st;};

  var v2149MerchantTickBase=merchantTick;
  merchantTick=function(){
    if(character.ctype!=='merchant')return v2149MerchantTickBase();v2149RefreshBankSnapshot(false);
    if(S.merchantBankRetrieve2149&&v2149BankRetrieveTick())return true;
    if(v2149PendingBankGearDeliveryTick())return true;
    if(v2149ExplicitBankDispositionTick())return true;
    var r=v2149MerchantTickBase();if(!v2149IdleAllowed())return r;
    if(v2149BankInventoryScanTick())return true;
    if(v2149DiscoveryTick())return true;
    if(v2149GatherTick())return true;
    return r;
  };

  audit('feature_contract','2.14.9 Merchant-Warehouse + Active Learning/Discovery + produktive Merchant-Idle-Arbeit geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C),bankSnapshotAt:Number(v2149BankSnapshot.at)||0,worldKnowledge:Object.keys(v2149Discovery.knowledge||{}).length});
'''
text=text.replace(marker,block+'\n\n'+marker,1)
BOT.write_text(text,encoding='utf-8')

vp=Path('version.json')
v=json.loads(vp.read_text(encoding='utf-8'))
v['version']='2.14.9'
v['build']='2026-09-10'
# dashboard/worker intentionally remain 2.14.5
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Release-version assertions in retained regression tests move with the bot release.
for name in ['scripts/smoke-2144-merchant-party-ui.js','scripts/smoke-2145-merchant-path-dashboard-ui.js','scripts/smoke-2146-merchant-update-button.js','scripts/smoke-2147-merchant-bank-item-rules.js','scripts/smoke-2148-merchant-atomic-bank-manual-update.js','scripts/smoke-merchant-stability.js']:
    p=Path(name);s=p.read_text(encoding='utf-8')
    s=s.replace("assert.equal(version.version,'2.14.8');","assert.equal(version.version,'2.14.9');")
    s=s.replace('assert.equal(version.version,"2.14.8");','assert.equal(version.version,"2.14.9");')
    s=s.replace("2\\.14\\.8['\\\"]","2\\.14\\.9['\\\"]")
    s=s.replace("2\\.14\\.8['\"]","2\\.14\\.9['\"]")
    p.write_text(s,encoding='utf-8')

vr=Path('scripts/verify-release.js')
s=vr.read_text(encoding='utf-8')
s=s.replace('ok(version.version === "2.14.8", "prepared release must be 2.14.8");','ok(version.version === "2.14.9", "prepared release must be 2.14.9");')
vr.write_text(s,encoding='utf-8')

smoke=r'''#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.9');
assert.equal(version.dashboardVersion,'2.14.5');
assert.match(bot,/var VERSION = ['"]2\.14\.9['"]/);
assert.doesNotThrow(()=>new vm.Script(bot), 'bot syntax');
assert.ok(bot.includes("V2149_BANK_KEY='merchantBankSnapshot2149'"),'persistent bank snapshot missing');
assert.ok(bot.includes('function v2149RefreshBankSnapshot'),'bank snapshot refresh missing');
assert.ok(bot.includes('v278AggregateMaterials=function()')&&bot.includes('agg.bank={at:'),'global material aggregate must include bank');
assert.ok(bot.includes('v273OwnedCount=function(name)')&&bot.includes('v2149SnapshotRows().forEach'),'owned count must include bank');
assert.ok(bot.includes('merchantBankRetrieve2149'),'bounded concrete bank retrieve state missing');
assert.ok(bot.includes("reason:String(reason||'logistics')")&&bot.includes('knownSnapshot:known'),'bank travel must be tied to a concrete downstream reason');
assert.ok(bot.includes("now-Number(st.startedAt||now)>20000")&&bot.includes('Number(st.attempts||0)>=12'),'bank retrieve lease missing');
assert.ok(bot.includes("v2149RequestBank('craft'")&&bot.includes("v2149RequestBank('upgrade'")&&bot.includes("v2149RequestBank('compound'")&&bot.includes("v2149RequestBank('exchange'")&&bot.includes("v2149RequestBank('gear'"),'bank warehouse not integrated across Merchant logistics');
assert.ok(bot.includes("v2147ItemPolicy(it.name))>=0")||bot.includes("['bank','sell','exchange'].indexOf(v2147ItemPolicy"),'bank staging must respect explicit bank/sell/exchange disposition');
assert.ok(bot.includes('merchant_bank_cleanup_deferred')&&bot.includes('v2149CanStartBankWork'),'bank cleanup must yield to higher-priority routes');
const ensurePos=bot.lastIndexOf('v273EnsureScroll=function');
const ensure=bot.slice(ensurePos,bot.indexOf('\n  };',ensurePos)+5);
assert.ok(ensure.includes('freeSlots()<2'),'scroll purchase needs a two-slot safety margin');
assert.ok(ensure.includes('v2145VendorReady(dest)'),'scroll purchase must be settled at vendor');
assert.ok(ensure.includes("throw Error('buy_cant_space_preflight')"),'scroll buy execution must recheck space');
assert.ok(bot.includes('function v2149DiscoveryCatalog'),'Active-Learning catalog missing');
assert.ok(bot.includes('(m.npcs||[])')&&bot.includes('(m.quirks||[])')&&bot.includes('(m.machines||[])')&&bot.includes('(m.zones||[])'),'discovery must cover NPCs and world interaction layers');
assert.ok(bot.includes('afterGameUpdate:v2149Discovery.gameVersion!==gv'),'game-update-triggered discovery missing');
assert.ok(bot.includes('function v2149NpcClass')&&bot.includes('function v2149ObjectClass'),'deterministic world-function classifier missing');
assert.ok(bot.includes("interact('newyear_tree')")&&bot.includes("mainframe_command('hello')"),'safe documented probes missing');
const block=bot.slice(bot.indexOf('2.14.9 Merchant bank warehouse + active discovery'),bot.indexOf("audit('feature_contract','2.14.9"));
assert.ok(!block.includes('destroy('),'Discovery must never perform destructive experiments');
assert.ok(!block.includes("interact('the_lever')"),'Discovery must not trigger disruptive lever travel');
assert.ok(!block.includes("interact('monsterhunt')"),'Discovery must not mutate hunts just to learn');
assert.ok(bot.includes('Number(character.level)<16')&&bot.includes('Number(character.mp)<120')&&bot.includes('freeSlots()<2'),'gathering prerequisites/safety margin missing');
assert.ok(bot.includes("kind==='fishing'?'rod':'pickaxe'")&&bot.includes('use_skill(kind)'),'fishing/mining implementation missing');
assert.ok(bot.includes('merchantStandAutomation: true'),'Merchant stand should be enabled by default');
assert.ok(bot.includes('worldDiscovery={gameVersion:')&&bot.includes('bankWarehouse={snapshotAt:'),'Brain state must receive discovery + bank context');
assert.ok(bot.includes("S.explorer.recentSamples=(S.explorer.recentSamples||[]).concat([sample]).slice(-20)"),'novel discovery must flow through existing cloud observation path');
assert.ok(bot.includes("!(character.ctype==='merchant'&&String(character.map||'').indexOf('bank')===0)"),'2.14.8 bank loot guard regressed');
assert.ok(bot.includes("bankCleanupRetry2148=now+12000"),'2.14.8 bank cleanup safety backoff regressed');
console.log('2.14.9 Merchant warehouse / discovery / productive-idle smoke OK');
'''
Path('scripts/smoke-2149-bank-discovery.js').write_text(smoke,encoding='utf-8')
print('patched 2.14.9')
